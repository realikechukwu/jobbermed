-- 0007_job_applications.sql
-- Lightweight application tracker per user.

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id text not null,
  job_title text,
  company text,
  location text,
  apply_url text,
  status public.application_status not null default 'saved',
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint job_applications_user_job_unique unique (user_id, job_id)
);

create index if not exists job_applications_user_status_idx
  on public.job_applications (user_id, status);
