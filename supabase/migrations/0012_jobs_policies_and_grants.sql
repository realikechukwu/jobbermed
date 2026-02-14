-- 0012_jobs_policies_and_grants.sql
-- Public read policies for active jobs and privilege grants.

-- Jobs policies
drop policy if exists jobs_select_active on public.jobs;
create policy jobs_select_active
  on public.jobs
  for select
  to anon, authenticated
  using (status = 'active' or public.is_admin() or auth.role() = 'service_role');

drop policy if exists jobs_insert_admin on public.jobs;
create policy jobs_insert_admin
  on public.jobs
  for insert
  to authenticated
  with check (public.is_admin() or auth.role() = 'service_role');

drop policy if exists jobs_update_admin on public.jobs;
create policy jobs_update_admin
  on public.jobs
  for update
  to authenticated
  using (public.is_admin() or auth.role() = 'service_role')
  with check (public.is_admin() or auth.role() = 'service_role');

drop policy if exists jobs_delete_admin on public.jobs;
create policy jobs_delete_admin
  on public.jobs
  for delete
  to authenticated
  using (public.is_admin() or auth.role() = 'service_role');

-- Grants
grant usage on schema public to anon, authenticated, service_role;

grant select on table public.jobs to anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.saved_jobs to authenticated;
grant select, insert, update, delete on table public.job_alerts to authenticated;
grant select, insert, update, delete on table public.job_applications to authenticated;

grant all privileges on table public.jobs to service_role;
grant all privileges on table public.profiles to service_role;
grant all privileges on table public.saved_jobs to service_role;
grant all privileges on table public.job_alerts to service_role;
grant all privileges on table public.job_applications to service_role;
