-- 0005_jobs.sql
-- Canonical jobs table for ingestion and downstream querying.

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  source public.job_source not null default 'other',
  job_key text not null,
  source_job_id text,
  job_title text not null,
  company text,
  location text,
  country text,
  state text,
  job_type text,
  employment_type public.employment_type not null default 'other',
  job_category text,
  salary text,
  experience text,
  qualification text,
  requirements text[] not null default '{}',
  responsibilities text[] not null default '{}',
  how_to_apply text[] not null default '{}',
  date_posted date,
  deadline date,
  contact_email text,
  contact_phone text,
  apply_url text,
  status public.job_status not null default 'active',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint jobs_job_key_key unique (job_key)
);

create index if not exists jobs_source_idx
  on public.jobs (source);

create index if not exists jobs_status_date_posted_idx
  on public.jobs (status, date_posted desc nulls last);

create index if not exists jobs_apply_url_idx
  on public.jobs (apply_url);
