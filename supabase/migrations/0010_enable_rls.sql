-- 0010_enable_rls.sql
-- Enable row-level security on all app-owned tables.

alter table public.profiles enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.jobs enable row level security;
alter table public.job_alerts enable row level security;
alter table public.job_applications enable row level security;
