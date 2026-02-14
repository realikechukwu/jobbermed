#!/usr/bin/env python3
"""Shared runtime helpers for personalized email workflows."""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterable
from urllib.parse import quote

import requests
from dotenv import load_dotenv

SUPABASE_TIMEOUT_SECONDS = 30
BREVO_TIMEOUT_SECONDS = 30
MISSING_RELATION_CODES = {"PGRST205", "42P01"}


class MissingRelationError(RuntimeError):
    """Raised when an expected table/view is missing from Supabase."""


class ConfigurationSkip(RuntimeError):
    """Raised when a script should skip due to missing runtime configuration."""


@dataclass
class RuntimeConfig:
    supabase_url: str | None
    supabase_service_role_key: str | None
    brevo_api_key: str | None
    weekly_list_id: int | None
    personalized_list_id: int | None
    sender_email: str
    sender_name: str
    email_cta_url: str
    dry_run: bool


def parse_bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def parse_optional_int_env(name: str) -> int | None:
    raw = os.getenv(name, "").strip()
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def load_runtime_config(dry_run_env: str) -> RuntimeConfig:
    load_dotenv()
    weekly_list_id = parse_optional_int_env("BREVO_WEEKLY_LIST_ID")
    if weekly_list_id is None:
        weekly_list_id = parse_optional_int_env("BREVO_LIST_ID")

    return RuntimeConfig(
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        brevo_api_key=os.getenv("BREVO_API_KEY"),
        weekly_list_id=weekly_list_id,
        personalized_list_id=parse_optional_int_env("BREVO_PERSONALIZED_LIST_ID"),
        sender_email=os.getenv("BREVO_SENDER_EMAIL", "jobs@jobbermed.com"),
        sender_name=os.getenv("BREVO_SENDER_NAME", "JobberMed"),
        email_cta_url=os.getenv("EMAIL_CTA_URL", "/signup"),
        dry_run=parse_bool_env(dry_run_env, default=False),
    )


def has_supabase_credentials(config: RuntimeConfig) -> bool:
    return bool(config.supabase_url and config.supabase_service_role_key)


def has_brevo_api_key(config: RuntimeConfig) -> bool:
    return bool(config.brevo_api_key)


def _supabase_headers(config: RuntimeConfig, prefer: str | None = None) -> dict[str, str]:
    if not has_supabase_credentials(config):
        raise ConfigurationSkip("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; skipping.")

    headers = {
        "apikey": config.supabase_service_role_key or "",
        "Authorization": f"Bearer {config.supabase_service_role_key or ''}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _brevo_headers(config: RuntimeConfig) -> dict[str, str]:
    if not has_brevo_api_key(config):
        raise ConfigurationSkip("Missing BREVO_API_KEY; skipping.")
    return {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": config.brevo_api_key or "",
    }


def _parse_response_payload(response: requests.Response) -> Any:
    try:
        return response.json()
    except ValueError:
        return {"message": response.text.strip()}


def _is_missing_relation_payload(payload: Any) -> bool:
    if not isinstance(payload, dict):
        return False

    code = str(payload.get("code", "")).upper()
    if code in MISSING_RELATION_CODES:
        return True

    message = f"{payload.get('message', '')} {payload.get('details', '')}".lower()
    return "could not find the table" in message or (
        "relation" in message and "does not exist" in message
    )


def _supabase_request(
    config: RuntimeConfig,
    method: str,
    table: str,
    *,
    params: dict[str, str] | None = None,
    payload: Any = None,
    prefer: str | None = None,
) -> requests.Response:
    headers = _supabase_headers(config, prefer=prefer)
    url = f"{(config.supabase_url or '').rstrip('/')}/rest/v1/{table}"
    response = requests.request(
        method=method,
        url=url,
        headers=headers,
        params=params,
        json=payload,
        timeout=SUPABASE_TIMEOUT_SECONDS,
    )
    return response


def supabase_select(
    config: RuntimeConfig,
    table: str,
    *,
    select: str,
    filters: dict[str, str] | None = None,
    order: str | None = None,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {"select": select}
    if filters:
        params.update(filters)
    if order:
        params["order"] = order
    if limit is not None:
        params["limit"] = str(limit)

    response = _supabase_request(config, "GET", table, params=params)
    if response.status_code == 200:
        payload = _parse_response_payload(response)
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict):
            return [payload]
        return []

    payload = _parse_response_payload(response)
    if _is_missing_relation_payload(payload):
        raise MissingRelationError(f"Missing relation: {table}")
    raise RuntimeError(
        f"Supabase select failed for {table}: {response.status_code} {payload.get('message', payload)}"
    )


def supabase_insert(config: RuntimeConfig, table: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return

    response = _supabase_request(
        config,
        "POST",
        table,
        payload=rows,
        prefer="return=minimal",
    )
    if response.status_code in {200, 201, 204}:
        return

    payload = _parse_response_payload(response)
    if _is_missing_relation_payload(payload):
        raise MissingRelationError(f"Missing relation: {table}")
    raise RuntimeError(
        f"Supabase insert failed for {table}: {response.status_code} {payload.get('message', payload)}"
    )


def supabase_upsert(
    config: RuntimeConfig,
    table: str,
    rows: list[dict[str, Any]],
    *,
    on_conflict: str,
) -> None:
    if not rows:
        return

    params = {"on_conflict": on_conflict}
    response = _supabase_request(
        config,
        "POST",
        table,
        params=params,
        payload=rows,
        prefer="resolution=merge-duplicates,return=minimal",
    )
    if response.status_code in {200, 201, 204}:
        return

    payload = _parse_response_payload(response)
    if _is_missing_relation_payload(payload):
        raise MissingRelationError(f"Missing relation: {table}")
    raise RuntimeError(
        f"Supabase upsert failed for {table}: {response.status_code} {payload.get('message', payload)}"
    )


def supabase_delete(config: RuntimeConfig, table: str, *, filters: dict[str, str]) -> None:
    response = _supabase_request(config, "DELETE", table, params=filters, prefer="return=minimal")
    if response.status_code in {200, 204}:
        return

    payload = _parse_response_payload(response)
    if _is_missing_relation_payload(payload):
        raise MissingRelationError(f"Missing relation: {table}")
    raise RuntimeError(
        f"Supabase delete failed for {table}: {response.status_code} {payload.get('message', payload)}"
    )


def supabase_table_exists(config: RuntimeConfig, table: str) -> bool:
    try:
        supabase_select(config, table, select="*", limit=1)
        return True
    except MissingRelationError:
        return False


def build_in_filter(values: Iterable[str]) -> str:
    cleaned = [value for value in values if value]
    return f"in.({','.join(cleaned)})"


def fetch_opted_in_user_rows(config: RuntimeConfig) -> list[dict[str, Any]]:
    return supabase_select(
        config,
        "email_preferences",
        select="user_id, personalization_enabled, frequency",
        filters={"personalization_enabled": "eq.true"},
    )


def fetch_profile_map(config: RuntimeConfig, user_ids: list[str]) -> dict[str, dict[str, Any]]:
    if not user_ids:
        return {}

    profile_rows = supabase_select(
        config,
        "profiles",
        select="user_id, email, full_name",
        filters={"user_id": build_in_filter(user_ids)},
    )
    return {
        str(row.get("user_id")): row
        for row in profile_rows
        if isinstance(row, dict) and row.get("user_id")
    }


def fetch_string_preferences_for_users(
    config: RuntimeConfig,
    table: str,
    column: str,
    user_ids: list[str],
) -> dict[str, list[str]]:
    if not user_ids:
        return {}

    rows = supabase_select(
        config,
        table,
        select=f"user_id, {column}",
        filters={"user_id": build_in_filter(user_ids)},
    )

    grouped: dict[str, list[str]] = {}
    for row in rows:
        user_id = str(row.get("user_id") or "")
        value = str(row.get(column) or "").strip()
        if not user_id or not value:
            continue
        grouped.setdefault(user_id, []).append(value)
    return {user_id: normalize_text_list(values) for user_id, values in grouped.items()}


def _brevo_request(
    config: RuntimeConfig,
    method: str,
    path: str,
    *,
    payload: dict[str, Any] | None = None,
) -> requests.Response:
    headers = _brevo_headers(config)
    url = f"https://api.brevo.com/v3{path}"
    response = requests.request(
        method=method,
        url=url,
        headers=headers,
        json=payload,
        timeout=BREVO_TIMEOUT_SECONDS,
    )
    return response


def get_brevo_contact(config: RuntimeConfig, email: str) -> dict[str, Any] | None:
    response = _brevo_request(config, "GET", f"/contacts/{quote(email, safe='')}")
    if response.status_code == 200:
        payload = _parse_response_payload(response)
        if isinstance(payload, dict):
            return payload
        return None
    if response.status_code == 404:
        return None

    payload = _parse_response_payload(response)
    raise RuntimeError(
        f"Brevo contact lookup failed for {email}: {response.status_code} {payload.get('message', payload)}"
    )


def remove_emails_from_brevo_list(
    config: RuntimeConfig,
    *,
    list_id: int,
    emails: list[str],
    dry_run: bool,
) -> int:
    unique_emails = normalize_text_list(emails)
    if not unique_emails:
        return 0

    if dry_run:
        print(f"[DRY RUN] Would remove {len(unique_emails)} contacts from Brevo list {list_id}.")
        return len(unique_emails)

    response = _brevo_request(
        config,
        "POST",
        f"/contacts/lists/{list_id}/contacts/remove",
        payload={"emails": unique_emails},
    )
    if response.status_code in {200, 201, 204}:
        return len(unique_emails)

    payload = _parse_response_payload(response)
    raise RuntimeError(
        f"Brevo list remove failed: {response.status_code} {payload.get('message', payload)}"
    )


def add_emails_to_brevo_list(
    config: RuntimeConfig,
    *,
    list_id: int,
    emails: list[str],
    dry_run: bool,
) -> int:
    unique_emails = normalize_text_list(emails)
    if not unique_emails:
        return 0

    if dry_run:
        print(f"[DRY RUN] Would add {len(unique_emails)} contacts to Brevo list {list_id}.")
        return len(unique_emails)

    response = _brevo_request(
        config,
        "POST",
        f"/contacts/lists/{list_id}/contacts/add",
        payload={"emails": unique_emails},
    )
    if response.status_code in {200, 201, 204}:
        return len(unique_emails)

    payload = _parse_response_payload(response)
    raise RuntimeError(f"Brevo list add failed: {response.status_code} {payload.get('message', payload)}")


def send_transactional_email(
    config: RuntimeConfig,
    *,
    to_email: str,
    to_name: str | None,
    subject: str,
    html_content: str,
    tags: list[str] | None = None,
    dry_run: bool,
) -> bool:
    if dry_run:
        print(f"[DRY RUN] Would send personalized email to {to_email} with subject '{subject}'.")
        return True

    payload: dict[str, Any] = {
        "sender": {"name": config.sender_name, "email": config.sender_email},
        "to": [{"email": to_email, "name": to_name or ""}],
        "subject": subject,
        "htmlContent": html_content,
    }
    if tags:
        payload["tags"] = tags

    response = _brevo_request(config, "POST", "/smtp/email", payload=payload)
    if response.status_code in {200, 201, 202, 204}:
        return True

    payload_data = _parse_response_payload(response)
    raise RuntimeError(
        f"Brevo transactional send failed: {response.status_code} "
        f"{payload_data.get('message', payload_data)}"
    )


def normalize_text_list(values: Iterable[str]) -> list[str]:
    seen = set()
    cleaned: list[str] = []
    for raw in values:
        value = raw.strip()
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(value)
    return cleaned


def normalize_frequency(value: Any) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"daily", "weekly"}:
        return raw
    return "weekly"


def is_due_for_frequency(*, frequency: str, now_utc: datetime | None = None) -> bool:
    normalized_frequency = normalize_frequency(frequency)
    if normalized_frequency == "daily":
        return True

    current_utc = now_utc or datetime.now(timezone.utc)
    # Weekly personalized digests run on Mondays (UTC).
    return current_utc.weekday() == 0


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
