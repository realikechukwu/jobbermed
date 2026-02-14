#!/usr/bin/env python3
"""Sync Brevo delivery segments to avoid weekly/personalized duplication."""

from __future__ import annotations

from email_runtime import (
    ConfigurationSkip,
    MissingRelationError,
    add_emails_to_brevo_list,
    fetch_opted_in_user_rows,
    fetch_profile_map,
    has_brevo_api_key,
    has_supabase_credentials,
    load_runtime_config,
    normalize_text_list,
    remove_emails_from_brevo_list,
    supabase_table_exists,
)

REQUIRED_PREFERENCE_TABLES = ["email_preferences"]


def missing_preference_tables(config) -> list[str]:
    missing: list[str] = []
    for table in REQUIRED_PREFERENCE_TABLES:
        if not supabase_table_exists(config, table):
            missing.append(table)
    return missing


def load_opted_in_emails(config) -> list[str]:
    user_rows = fetch_opted_in_user_rows(config)
    if not user_rows:
        return []

    opted_in_user_ids: list[str] = []
    for row in user_rows:
        user_id = str(row.get("user_id") or "").strip()
        if not user_id:
            continue
        delivery_mode = str(row.get("delivery_mode") or "").strip().lower()
        if delivery_mode and delivery_mode != "personalized":
            continue
        opted_in_user_ids.append(user_id)

    profile_map = fetch_profile_map(config, opted_in_user_ids)
    emails: list[str] = []
    for user_id in opted_in_user_ids:
        profile = profile_map.get(user_id, {})
        email = str(profile.get("email") or "").strip()
        if email:
            emails.append(email)
    return normalize_text_list(emails)


def main() -> int:
    config = load_runtime_config("SYNC_DRY_RUN")

    print("=" * 64)
    print("  JOBBERMED DELIVERY SEGMENT SYNC")
    print("=" * 64)

    if not config.weekly_list_id:
        print("⚠️  Weekly Brevo list id not set. Skipping segment sync.")
        return 0
    if not has_supabase_credentials(config):
        print("⚠️  Missing Supabase runtime credentials. Skipping segment sync.")
        return 0
    if not has_brevo_api_key(config):
        print("⚠️  Missing BREVO_API_KEY. Skipping segment sync.")
        return 0

    missing_tables = missing_preference_tables(config)
    if missing_tables:
        print("⚠️  Preference tables unavailable; skipping segment sync.")
        print(f"    Missing: {', '.join(missing_tables)}")
        return 0

    opted_in_emails = load_opted_in_emails(config)
    if not opted_in_emails:
        print("ℹ️  No opted-in recipients found. No list changes required.")
        return 0

    removed = remove_emails_from_brevo_list(
        config,
        list_id=config.weekly_list_id,
        emails=opted_in_emails,
        dry_run=config.dry_run,
    )
    print(f"✅ Removed {removed} personalized recipients from weekly list {config.weekly_list_id}.")

    if config.personalized_list_id:
        added = add_emails_to_brevo_list(
            config,
            list_id=config.personalized_list_id,
            emails=opted_in_emails,
            dry_run=config.dry_run,
        )
        print(
            f"✅ Added {added} personalized recipients to list {config.personalized_list_id}."
        )
    else:
        print("ℹ️  BREVO_PERSONALIZED_LIST_ID not set; skipped personalized list add step.")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ConfigurationSkip as skip_error:
        print(f"⚠️  {skip_error}")
        raise SystemExit(0)
    except MissingRelationError as relation_error:
        print(f"⚠️  {relation_error}")
        raise SystemExit(0)
