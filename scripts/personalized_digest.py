#!/usr/bin/env python3
"""Send personalized job digests for opted-in users."""

from __future__ import annotations

import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from config import MASTER_JOBS_PATH
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

LOCATION_TOKEN_ALL_STATES = "all_states"
LOCATION_TOKEN_REMOTE = "remote"
LOCATION_TOKEN_OUTSIDE_NIGERIA = "outside_nigeria"

NIGERIAN_STATE_TOKENS = {
    "abia",
    "adamawa",
    "akwa_ibom",
    "anambra",
    "bauchi",
    "bayelsa",
    "benue",
    "borno",
    "cross_river",
    "delta",
    "ebonyi",
    "edo",
    "ekiti",
    "enugu",
    "gombe",
    "imo",
    "jigawa",
    "kaduna",
    "kano",
    "katsina",
    "kebbi",
    "kogi",
    "kwara",
    "lagos",
    "nasarawa",
    "niger",
    "ogun",
    "ondo",
    "osun",
    "oyo",
    "plateau",
    "rivers",
    "sokoto",
    "taraba",
    "yobe",
    "zamfara",
    "fct",
}

LOCATION_PREFERENCE_ALIASES = {
    "all states": LOCATION_TOKEN_ALL_STATES,
    "all nigeria states": LOCATION_TOKEN_ALL_STATES,
    "nigeria": LOCATION_TOKEN_ALL_STATES,
    "nationwide": LOCATION_TOKEN_ALL_STATES,
    "fct": "fct",
    "abuja": "fct",
    "remote": LOCATION_TOKEN_REMOTE,
    "work from home": LOCATION_TOKEN_REMOTE,
    "wfh": LOCATION_TOKEN_REMOTE,
    "outside nigeria": LOCATION_TOKEN_OUTSIDE_NIGERIA,
    "international": LOCATION_TOKEN_OUTSIDE_NIGERIA,
}

CITY_TO_STATE_TOKEN = {
    "abuja": "fct",
    "lagos": "lagos",
    "kano": "kano",
    "ibadan": "oyo",
    "port harcourt": "rivers",
    "benin": "edo",
    "benin city": "edo",
    "kaduna": "kaduna",
    "enugu": "enugu",
    "jos": "plateau",
    "ilorin": "kwara",
    "sokoto": "sokoto",
    "calabar": "cross_river",
    "warri": "delta",
    "owerri": "imo",
    "uyo": "akwa_ibom",
    "abeokuta": "ogun",
    "maiduguri": "borno",
    "zaria": "kaduna",
    "aba": "abia",
    "ogbomoso": "oyo",
    "onitsha": "anambra",
    "akure": "ondo",
    "bauchi": "bauchi",
    "yola": "adamawa",
    "gombe": "gombe",
    "lafia": "nasarawa",
    "lokoja": "kogi",
    "minna": "niger",
    "oshogbo": "osun",
    "asaba": "delta",
    "awka": "anambra",
    "birnin kebbi": "kebbi",
    "damaturu": "yobe",
    "dutse": "jigawa",
    "ado ekiti": "ekiti",
    "gusau": "zamfara",
    "jalingo": "taraba",
    "katsina": "katsina",
    "umuahia": "abia",
    "yenagoa": "bayelsa",
    "mowe": "ogun",
    "keffi": "nasarawa",
}

REMOTE_KEYWORDS = ("remote", "work from home", "wfh")

KNOWN_LOCATION_TOKENS = {
    LOCATION_TOKEN_ALL_STATES,
    LOCATION_TOKEN_REMOTE,
    LOCATION_TOKEN_OUTSIDE_NIGERIA,
    *NIGERIAN_STATE_TOKENS,
}

CATEGORY_TOKEN_DOCTOR = "doctor"
CATEGORY_TOKEN_NURSE = "nurse"
CATEGORY_TOKEN_PHARMACIST = "pharmacist"
CATEGORY_TOKEN_MEDICAL_LAB = "medical_laboratory_scientist"
CATEGORY_TOKEN_DENTIST = "dentist"
CATEGORY_TOKEN_PUBLIC_HEALTH = "public_health"
CATEGORY_TOKEN_HEALTHCARE_MANAGEMENT = "healthcare_management"
CATEGORY_TOKEN_ALLIED_HEALTH = "allied_health"
CATEGORY_TOKEN_OTHER = "other"

CATEGORY_PREFERENCE_ALIASES = {
    "doctor": CATEGORY_TOKEN_DOCTOR,
    "doctors": CATEGORY_TOKEN_DOCTOR,
    "nurse": CATEGORY_TOKEN_NURSE,
    "nurses": CATEGORY_TOKEN_NURSE,
    "nurses & midwives": CATEGORY_TOKEN_NURSE,
    "nurses and midwives": CATEGORY_TOKEN_NURSE,
    "midwife": CATEGORY_TOKEN_NURSE,
    "midwives": CATEGORY_TOKEN_NURSE,
    "pharmacist": CATEGORY_TOKEN_PHARMACIST,
    "pharmacists": CATEGORY_TOKEN_PHARMACIST,
    "medical laboratory scientist": CATEGORY_TOKEN_MEDICAL_LAB,
    "medical laboratory scientists": CATEGORY_TOKEN_MEDICAL_LAB,
    "dentist": CATEGORY_TOKEN_DENTIST,
    "dentists": CATEGORY_TOKEN_DENTIST,
    "public health": CATEGORY_TOKEN_PUBLIC_HEALTH,
    "healthcare management": CATEGORY_TOKEN_HEALTHCARE_MANAGEMENT,
    "allied health": CATEGORY_TOKEN_ALLIED_HEALTH,
    "other": CATEGORY_TOKEN_OTHER,
    "others": CATEGORY_TOKEN_OTHER,
}


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


def normalize_category_preference(value: str) -> str:
    raw = value.strip().lower()
    if not raw:
        return ""

    raw = re.sub(r"\s+", " ", raw)
    if raw in CATEGORY_PREFERENCE_ALIASES:
        return CATEGORY_PREFERENCE_ALIASES[raw]

    if "laboratory" in raw and "scientist" in raw:
        return CATEGORY_TOKEN_MEDICAL_LAB
    if "nurse" in raw or "midwi" in raw:
        return CATEGORY_TOKEN_NURSE
    if "doctor" in raw or "physician" in raw or "medical officer" in raw:
        return CATEGORY_TOKEN_DOCTOR
    if "pharmac" in raw:
        return CATEGORY_TOKEN_PHARMACIST
    if "dent" in raw:
        return CATEGORY_TOKEN_DENTIST
    if "public health" in raw:
        return CATEGORY_TOKEN_PUBLIC_HEALTH
    if "management" in raw:
        return CATEGORY_TOKEN_HEALTHCARE_MANAGEMENT
    if "allied health" in raw:
        return CATEGORY_TOKEN_ALLIED_HEALTH

    return raw


def category_matches_preferences(preferences: list[str], candidate: str) -> bool:
    if not preferences:
        return True

    normalized_preferences: set[str] = set()
    for value in preferences:
        normalized = normalize_category_preference(value)
        if normalized:
            normalized_preferences.add(normalized)

    if not normalized_preferences:
        return True

    normalized_candidate = normalize_category_preference(candidate)
    if normalized_candidate and normalized_candidate in normalized_preferences:
        return True

    # Keep a legacy fallback for unnormalized historical values.
    return value_matches(preferences, candidate)


def has_word(value: str, phrase: str) -> bool:
    escaped = re.escape(phrase)
    return re.search(rf"\b{escaped}\b", value, flags=re.IGNORECASE) is not None


def normalize_location_preference(value: str) -> str:
    raw = value.strip().lower()
    if not raw:
        return ""

    if raw in LOCATION_PREFERENCE_ALIASES:
        return LOCATION_PREFERENCE_ALIASES[raw]

    as_token = raw.replace(" ", "_")
    if as_token in NIGERIAN_STATE_TOKENS:
        return as_token

    return raw


def normalize_location_preferences(values: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()

    for value in values:
        token = normalize_location_preference(value)
        if not token:
            continue
        if token in seen:
            continue
        seen.add(token)
        normalized.append(token)

    return normalized


def matched_nigerian_state_tokens(location: str) -> set[str]:
    if not location:
        return set()

    matched: set[str] = set()

    for token in NIGERIAN_STATE_TOKENS:
        if token == "fct":
            if has_word(location, "fct") or has_word(location, "abuja"):
                matched.add("fct")
            continue

        phrase = token.replace("_", " ")
        if has_word(location, phrase):
            matched.add(token)

    for city, state_token in CITY_TO_STATE_TOKEN.items():
        if has_word(location, city):
            matched.add(state_token)

    return matched


def is_nigeria_location(location: str) -> bool:
    if not location:
        return False

    if has_word(location, "nigeria") or has_word(location, "nationwide"):
        return True

    return bool(matched_nigerian_state_tokens(location))


def is_remote_location(location: str) -> bool:
    if not location:
        return False
    return any(has_word(location, keyword) for keyword in REMOTE_KEYWORDS)


def location_matches_preferences(preferences: list[str], candidate: str) -> bool:
    if not preferences:
        return True

    normalized_preferences = normalize_location_preferences(preferences)
    if not normalized_preferences:
        return True

    location = (candidate or "").strip().lower()
    nigerian_tokens = matched_nigerian_state_tokens(location)
    nigeria_match = bool(location) and is_nigeria_location(location)

    if LOCATION_TOKEN_REMOTE in normalized_preferences and is_remote_location(location):
        return True

    if LOCATION_TOKEN_ALL_STATES in normalized_preferences and nigeria_match:
        return True

    selected_states = [value for value in normalized_preferences if value in NIGERIAN_STATE_TOKENS]
    if selected_states and nigerian_tokens.intersection(selected_states):
        return True

    if LOCATION_TOKEN_OUTSIDE_NIGERIA in normalized_preferences and location and not nigeria_match:
        return True

    legacy_terms = [value for value in normalized_preferences if value not in KNOWN_LOCATION_TOKENS]
    if legacy_terms and location and any(term in location for term in legacy_terms):
        return True

    return False


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
                "job_title": str(row.get("title") or "Healthcare role"),
                "company": "Direct Employer",
                "location": str(row.get("location") or ""),
                "job_type": str(row.get("job_type") or ""),
                "job_category": str(row.get("category") or ""),
                "salary": build_native_job_salary(row),
                "date_posted": row.get("published_at") or row.get("created_at") or "",
                "deadline": row.get("apply_deadline") or "",
                "apply_url": f"{site_base_url}/jobs/direct/{native_job_id}",
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
        if recipient.categories and not category_matches_preferences(recipient.categories, category):
            continue

        location = str(job.get("location") or "")
        if recipient.locations and not location_matches_preferences(recipient.locations, location):
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

    aggregated_jobs = load_aggregated_jobs(MASTER_JOBS_PATH)
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
