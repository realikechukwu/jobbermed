# Supabase DB (Schema + RLS)

This folder contains first-party database migrations for JobberMed.

## Migration Order

1. `migrations/0001_extensions.sql`
2. `migrations/0002_enums.sql`
3. `migrations/0003_profiles.sql`
4. `migrations/0004_saved_jobs.sql`
5. `migrations/0005_jobs.sql`
6. `migrations/0006_job_alerts.sql`
7. `migrations/0007_job_applications.sql`
8. `migrations/0008_functions.sql`
9. `migrations/0009_triggers.sql`
10. `migrations/0010_enable_rls.sql`
11. `migrations/0011_user_policies.sql`
12. `migrations/0012_jobs_policies_and_grants.sql`
13. `migrations/0013_native_jobs_contract_fix.sql`
14. `migrations/0014_roles_access_requests_fix.sql`
15. `migrations/0015_email_personalization_schema.sql`

## Objects Created

### Enums
- `public.user_role`
- `public.job_source`
- `public.employment_type`
- `public.job_status`
- `public.alert_frequency`
- `public.application_status`
- `public.native_job_status`
- `public.native_application_status`
- `public.access_request_status`

### Tables
- `public.profiles`
- `public.saved_jobs`
- `public.jobs`
- `public.job_alerts`
- `public.job_applications`
- `public.native_jobs`
- `public.native_job_applications`
- `public.user_platform_roles`
- `public.access_requests`
- `public.email_preferences`
- `public.email_pref_categories`
- `public.email_pref_locations`
- `public.email_delivery_log`

### Functions
- `public.set_updated_at()`
- `public.is_admin()`
- `public.handle_new_user()`
- `public.normalize_platform_role()`
- `public.has_platform_role()`
- `public.is_platform_admin()`
- `public.approve_access_request()`

### Triggers
- `on_auth_user_created` on `auth.users`
- `set_profiles_updated_at` on `public.profiles`
- `set_saved_jobs_updated_at` on `public.saved_jobs`
- `set_jobs_updated_at` on `public.jobs`
- `set_job_alerts_updated_at` on `public.job_alerts`
- `set_job_applications_updated_at` on `public.job_applications`
- `set_native_jobs_updated_at` on `public.native_jobs`
- `set_native_job_applications_updated_at` on `public.native_job_applications`
- `set_user_platform_roles_updated_at` on `public.user_platform_roles`
- `set_access_requests_updated_at` on `public.access_requests`
- `set_email_preferences_updated_at` on `public.email_preferences`

### RLS
RLS is enabled on all app tables and policies are split into:
- User-owner policies (`profiles`, `saved_jobs`, `job_alerts`, `job_applications`)
- Public read + admin write policies (`jobs`)
- Native jobs policies (`native_jobs`) with public published-read and owner/admin writes
- Native application policies (`native_job_applications`) for insert/read-own and reviewer/job-owner access
- Role assignment/request policies (`user_platform_roles`, `access_requests`) for own-read and admin review/update
- Email personalization policies (`email_preferences`, `email_pref_categories`, `email_pref_locations`) for own-row management, with service-role-only delivery logs

## Current Frontend Dependencies

These existing pages/scripts rely directly on this schema:
- `docs/dashboard.html` -> `profiles`, `saved_jobs`
- `docs/js/savedJobs.js` -> `saved_jobs`

## Validation Commands

Run from repo root after Supabase CLI is configured:

```bash
supabase db lint
supabase db reset
```

Optional policy/table checks:

```bash
supabase db query "select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('profiles','saved_jobs','jobs','job_alerts','job_applications','native_jobs','native_job_applications') order by tablename;"
supabase db query "select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('user_platform_roles','access_requests') order by tablename;"
supabase db query "select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('email_preferences','email_pref_categories','email_pref_locations','email_delivery_log') order by tablename;"
supabase db query "select schemaname, tablename, policyname from pg_policies where schemaname='public' order by tablename, policyname;"
```

## Notes

- `saved_jobs` is the active persistence path for authenticated users.
- `jobs`, `job_alerts`, and `job_applications` are prepared for backend ingestion and future product expansion.
- Legacy `public.job_applications`/`public.application_status` and native `public.native_job_applications`/`public.native_application_status` coexist for backward compatibility.
- Legacy jobs flows and native jobs flows are intentionally parallel in this phase; no legacy tables were dropped or renamed.
- Role values now include `recruiter` and `mdcn_official`; legacy `mdcn` alias is preserved for compatibility.
- Dashboard access approvals are backed by `access_requests` + `user_platform_roles`, with `approve_access_request()` handling approval updates atomically.
- Legacy weekly digest (`weekly_default`) and personalized campaigns (`personalized_daily`, `personalized_weekly`) intentionally coexist during rollout.
- `email_delivery_log.dedupe_key` is used to prevent duplicate sends for the same user/campaign window.
- Admin policy checks use JWT claim `app_metadata.role = 'admin'`.
