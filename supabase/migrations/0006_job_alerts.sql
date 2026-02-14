-- 0006_job_alerts.sql
-- Per-user alert preferences for future scheduled notifications.

create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  keywords text[] not null default '{}',
  locations text[] not null default '{}',
  occupations text[] not null default '{}',
  employment_types public.employment_type[] not null default '{}'::public.employment_type[],
  frequency public.alert_frequency not null default 'weekly',
  is_active boolean not null default true,
  last_sent_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint job_alerts_user_unique unique (user_id)
);

create index if not exists job_alerts_active_next_run_idx
  on public.job_alerts (is_active, next_run_at);
