-- 0004_saved_jobs.sql
-- Saved jobs for authenticated users.

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id text not null,
  job_title text,
  company text,
  location text,
  apply_url text,
  saved_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint saved_jobs_user_job_unique unique (user_id, job_id)
);

create index if not exists saved_jobs_user_saved_at_idx
  on public.saved_jobs (user_id, saved_at desc);

create index if not exists saved_jobs_job_id_idx
  on public.saved_jobs (job_id);
