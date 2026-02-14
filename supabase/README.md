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

## Objects Created

### Enums
- `public.user_role`
- `public.job_source`
- `public.employment_type`
- `public.job_status`
- `public.alert_frequency`
- `public.application_status`

### Tables
- `public.profiles`
- `public.saved_jobs`
- `public.jobs`
- `public.job_alerts`
- `public.job_applications`

### Functions
- `public.set_updated_at()`
- `public.is_admin()`
- `public.handle_new_user()`

### Triggers
- `on_auth_user_created` on `auth.users`
- `set_profiles_updated_at` on `public.profiles`
- `set_saved_jobs_updated_at` on `public.saved_jobs`
- `set_jobs_updated_at` on `public.jobs`
- `set_job_alerts_updated_at` on `public.job_alerts`
- `set_job_applications_updated_at` on `public.job_applications`

### RLS
RLS is enabled on all app tables and policies are split into:
- User-owner policies (`profiles`, `saved_jobs`, `job_alerts`, `job_applications`)
- Public read + admin write policies (`jobs`)

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
supabase db query "select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('profiles','saved_jobs','jobs','job_alerts','job_applications') order by tablename;"
supabase db query "select schemaname, tablename, policyname from pg_policies where schemaname='public' order by tablename, policyname;"
```

## Notes

- `saved_jobs` is the active persistence path for authenticated users.
- `jobs`, `job_alerts`, and `job_applications` are prepared for backend ingestion and future product expansion.
- Admin policy checks use JWT claim `app_metadata.role = 'admin'`.
