#!/usr/bin/env python3
"""Send personalized job digests for opted-in users."""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from newsletter import build_email_html

from email_runtime import (
    ConfigurationSkip,
    MissingRelationError,
    fetch_opted_in_user_rows,
    fetch_profile_map,
    fetch_string_preferences_for_users,
    get_brevo_contact,
    has_brevo_api_key,
    has_supabase_credentials,
    is_due_for_frequency,
    load_runtime_config,
    normalize_frequency,
    normalize_text_list,
    now_utc,
    send_transactional_email,
    supabase_select,
    supabase_table_exists,
    supabase_upsert,
)

REQUIRED_PREFERENCE_TABLES = [
    "email_preferences",
    "email_pref_categories",
    "email_pref_locations",
]


@dataclass
class RecipientPreference:
    user_id: str
    email: str
    full_name: str
    frequency: str
    categories: list[str] = field(default_factory=list)
    locations: list[str] = field(default_factory=list)


def parse_iso_datetime(value: Any) -> datetime:
    raw = str(value or "").strip()
    if not raw:
        return datetime.min.replace(tzinfo=timezone.utc)
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def value_matches(preferences: list[str], candidate: str) -> bool:
    if not preferences:
        return True
    target = (candidate or "").strip().lower()
    if not target:
        return False
    return any(preference.lower() in target for preference in preferences)


def missing_preference_tables(config) -> list[str]:
    missing: list[str] = []
    for table in REQUIRED_PREFERENCE_TABLES:
        if not supabase_table_exists(config, table):
            missing.append(table)
    return missing


def load_aggregated_jobs(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        print(f"⚠️  Aggregated jobs file not found at {path}.")
        return []

    with open(path, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    jobs = payload.get("jobs", []) if isinstance(payload, dict) else payload
    normalized: list[dict[str, Any]] = []
    for job in jobs if isinstance(jobs, list) else []:
        if not isinstance(job, dict):
            continue
        item = dict(job)
        item["_digest_source"] = "aggregated"
        normalized.append(item)
    return normalized


def build_native_job_salary(row: dict[str, Any]) -> str:
    salary_min = row.get("salary_min")
    salary_max = row.get("salary_max")
    currency = (row.get("currency") or "NGN").strip()

    if salary_min is None and salary_max is None:
        return ""
    if salary_min is not None and salary_max is not None:
        return f"{currency} {salary_min} - {salary_max}"
    if salary_min is not None:
        return f"{currency} {salary_min}+"
    return f"Up to {currency} {salary_max}"


def load_native_jobs(config) -> list[dict[str, Any]]:
    site_base_url = os.getenv("SITE_BASE_URL", "https://jobbermed.com").rstrip("/")
    rows = supabase_select(
        config,
        "native_jobs",
        select=(
            "id, title, location, job_type, category, salary_min, salary_max, currency, "
            "apply_deadline, published_at, created_at"
        ),
        filters={"status": "eq.published", "is_public": "eq.true"},
        order="published_at.desc",
    )

    normalized: list[dict[str, Any]] = []
    for row in rows:
        native_job_id = str(row.get("id") or "").strip()
        if not native_job_id:
            continue
        normalized.append(
            {
                "_digest_source": "native",
                "job_title": str(row.get("title") or "Native healthcare role"),
                "company": "Direct Employer",
                "location": str(row.get("location") or ""),
                "job_type": str(row.get("job_type") or ""),
                "job_category": str(row.get("category") or ""),
                "salary": build_native_job_salary(row),
                "date_posted": row.get("published_at") or row.get("created_at") or "",
                "deadline": row.get("apply_deadline") or "",
                "apply_url": f"{site_base_url}/native-jobs/{native_job_id}",
            }
        )
    return normalized


def load_recipients(config) -> list[RecipientPreference]:
    user_rows = fetch_opted_in_user_rows(config)
    if not user_rows:
        return []

    user_ids = [str(row.get("user_id") or "") for row in user_rows]
    user_ids = [value for value in user_ids if value]
    profile_map = fetch_profile_map(config, user_ids)
    categories_map = fetch_string_preferences_for_users(
        config,
        "email_pref_categories",
        "category",
        user_ids,
    )
    locations_map = fetch_string_preferences_for_users(
        config,
        "email_pref_locations",
        "location",
        user_ids,
    )

    recipients: list[RecipientPreference] = []
    for row in user_rows:
        user_id = str(row.get("user_id") or "").strip()
        if not user_id:
            continue

        profile = profile_map.get(user_id, {})
        email = str(profile.get("email") or "").strip()
        if not email:
            continue

        recipients.append(
            RecipientPreference(
                user_id=user_id,
                email=email,
                full_name=str(profile.get("full_name") or "").strip(),
                frequency=normalize_frequency(row.get("frequency")),
                categories=normalize_text_list(categories_map.get(user_id, [])),
                locations=normalize_text_list(locations_map.get(user_id, [])),
            )
        )

    return recipients


def filter_jobs_for_recipient(
    jobs: list[dict[str, Any]],
    recipient: RecipientPreference,
) -> list[dict[str, Any]]:
    matched: list[dict[str, Any]] = []

    for job in jobs:
        category = str(job.get("job_category") or job.get("category") or "")
        if recipient.categories and not value_matches(recipient.categories, category):
            continue

        location = str(job.get("location") or "")
        if recipient.locations and not value_matches(recipient.locations, location):
            continue

        matched.append(job)

    matched.sort(
        key=lambda job: parse_iso_datetime(job.get("date_posted") or job.get("published_at")),
        reverse=True,
    )
    return matched


def build_campaign_type(frequency: str) -> str:
    return "personalized_daily" if normalize_frequency(frequency) == "daily" else "personalized_weekly"


def build_dedupe_key(
    *,
    campaign_type: str,
    recipient: RecipientPreference,
    current_utc: datetime,
) -> str:
    identity = recipient.user_id or recipient.email.lower()
    if campaign_type == "personalized_daily":
        window_key = current_utc.date().isoformat()
    else:
        iso_calendar = current_utc.isocalendar()
        window_key = f"{iso_calendar.year}-W{iso_calendar.week:02d}"
    return f"{campaign_type}:{window_key}:{identity}"


def already_logged(
    config,
    *,
    dedupe_key: str,
    delivery_log_enabled: bool,
) -> bool:
    if not delivery_log_enabled:
        return False
    rows = supabase_select(
        config,
        "email_delivery_log",
        select="id",
        filters={"dedupe_key": f"eq.{dedupe_key}"},
        limit=1,
    )
    return len(rows) > 0


def log_delivery(
    config,
    *,
    recipient: RecipientPreference,
    campaign_type: str,
    dedupe_key: str,
    status: str,
    reason: str,
    job_count: int,
    delivery_log_enabled: bool,
) -> None:
    if not delivery_log_enabled:
        return

    row = {
        "user_id": recipient.user_id,
        "recipient_email": recipient.email,
        "campaign_type": campaign_type,
        "status": status,
        "dedupe_key": dedupe_key,
        "meta": {"reason": reason, "job_count": job_count},
        "sent_at": now_utc().isoformat(),
    }
    supabase_upsert(
        config,
        "email_delivery_log",
        [row],
        on_conflict="dedupe_key",
    )


def recipient_still_in_weekly_segment(config, email: str) -> bool:
    if not config.weekly_list_id:
        return False

    contact = get_brevo_contact(config, email)
    if not contact:
        return False

    list_ids_raw = contact.get("listIds")
    if not isinstance(list_ids_raw, list):
        return False
    list_ids: set[int] = set()
    for value in list_ids_raw:
        try:
            list_ids.add(int(value))
        except (TypeError, ValueError):
            continue
    return config.weekly_list_id in list_ids


def main() -> int:
    config = load_runtime_config("PERSONALIZED_DRY_RUN")

    print("=" * 64)
    print("  JOBBERMED PERSONALIZED DIGEST")
    print("=" * 64)

    if not has_supabase_credentials(config):
        print("⚠️  Missing Supabase runtime credentials. Skipping personalized digest.")
        return 0
    if not has_brevo_api_key(config):
        print("⚠️  Missing BREVO_API_KEY. Skipping personalized digest.")
        return 0

    missing_tables = missing_preference_tables(config)
    if missing_tables:
        print("⚠️  Preference tables are unavailable; weekly fallback remains active.")
        print(f"    Missing: {', '.join(missing_tables)}")
        return 0

    recipients = load_recipients(config)
    if not recipients:
        print("ℹ️  No opted-in recipients found for personalized delivery.")
        return 0

    aggregated_jobs = load_aggregated_jobs(PROJECT_ROOT / "legacy/docs/master_jobs.json")
    native_jobs = load_native_jobs(config)
    all_jobs = [*aggregated_jobs, *native_jobs]
    if not all_jobs:
        print("ℹ️  No jobs available for personalized delivery.")
        return 0

    try:
        job_limit = int(os.getenv("PERSONALIZED_DIGEST_JOB_LIMIT", "20"))
    except ValueError:
        job_limit = 20
    if job_limit < 1:
        job_limit = 20

    delivery_log_enabled = supabase_table_exists(config, "email_delivery_log")
    if not delivery_log_enabled:
        print("⚠️  email_delivery_log unavailable; idempotency will only apply within this run.")

    sent_in_run: set[str] = set()
    sent_count = 0
    skipped_count = 0
    failed_count = 0

    for recipient in recipients:
        recipient_key = recipient.email.lower()
        if recipient_key in sent_in_run:
            skipped_count += 1
            continue

        if not is_due_for_frequency(frequency=recipient.frequency):
            skipped_count += 1
            continue

        campaign_type = build_campaign_type(recipient.frequency)
        dedupe_key = build_dedupe_key(
            campaign_type=campaign_type,
            recipient=recipient,
            current_utc=now_utc(),
        )

        if already_logged(
            config,
            dedupe_key=dedupe_key,
            delivery_log_enabled=delivery_log_enabled,
        ):
            skipped_count += 1
            continue

        try:
            if recipient_still_in_weekly_segment(config, recipient.email):
                skipped_count += 1
                log_delivery(
                    config,
                    recipient=recipient,
                    campaign_type=campaign_type,
                    dedupe_key=dedupe_key,
                    status="skipped",
                    reason="still_in_weekly_segment",
                    job_count=0,
                    delivery_log_enabled=delivery_log_enabled,
                )
                continue
        except Exception as membership_error:
            print(f"⚠️  Weekly membership check failed for {recipient.email}: {membership_error}")
            skipped_count += 1
            log_delivery(
                config,
                recipient=recipient,
                campaign_type=campaign_type,
                dedupe_key=dedupe_key,
                status="skipped",
                reason="weekly_membership_check_failed",
                job_count=0,
                delivery_log_enabled=delivery_log_enabled,
            )
            continue

        matched_jobs = filter_jobs_for_recipient(all_jobs, recipient)
        if not matched_jobs:
            skipped_count += 1
            log_delivery(
                config,
                recipient=recipient,
                campaign_type=campaign_type,
                dedupe_key=dedupe_key,
                status="skipped",
                reason="no_matching_jobs",
                job_count=0,
                delivery_log_enabled=delivery_log_enabled,
            )
            continue

        top_jobs = matched_jobs[:job_limit]
        subject = f"{len(top_jobs)} jobs matching your preferences — {now_utc().strftime('%d %b %Y')}"
        html_content = build_email_html(
            top_jobs,
            headline_text="Healthcare jobs across Nigeria and Africa.",
            subheadline_text="Personalized to your dashboard preferences.",
            intro_text=(
                f"Here are <strong>{len(top_jobs)} opportunities</strong> aligned with your current "
                "category and location settings."
            ),
            include_signup_cta=False,
        )

        try:
            send_transactional_email(
                config,
                to_email=recipient.email,
                to_name=recipient.full_name,
                subject=subject,
                html_content=html_content,
                tags=["personalized-digest", campaign_type],
                dry_run=config.dry_run,
            )
            sent_in_run.add(recipient_key)
            sent_count += 1
            log_delivery(
                config,
                recipient=recipient,
                campaign_type=campaign_type,
                dedupe_key=dedupe_key,
                status="sent",
                reason="ok",
                job_count=len(top_jobs),
                delivery_log_enabled=delivery_log_enabled,
            )
        except Exception as send_error:
            failed_count += 1
            print(f"❌ Personalized send failed for {recipient.email}: {send_error}")
            log_delivery(
                config,
                recipient=recipient,
                campaign_type=campaign_type,
                dedupe_key=dedupe_key,
                status="failed",
                reason=str(send_error)[:240],
                job_count=len(top_jobs),
                delivery_log_enabled=delivery_log_enabled,
            )

    print("\nSummary:")
    print(f"- Recipients evaluated: {len(recipients)}")
    print(f"- Sent: {sent_count}")
    print(f"- Skipped: {skipped_count}")
    print(f"- Failed: {failed_count}")

    return 1 if failed_count else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ConfigurationSkip as skip_error:
        print(f"⚠️  {skip_error}")
        raise SystemExit(0)
    except MissingRelationError as relation_error:
        print(f"⚠️  {relation_error}")
        raise SystemExit(0)
