-- 0011_user_policies.sql
-- Owner-scoped policies for authenticated user data.

-- Profiles policies
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists profiles_insert_own_or_admin on public.profiles;
create policy profiles_insert_own_or_admin
  on public.profiles
  for insert
  with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
  on public.profiles
  for update
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
  with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists profiles_delete_own_or_admin on public.profiles;
create policy profiles_delete_own_or_admin
  on public.profiles
  for delete
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

-- Saved jobs policies
drop policy if exists saved_jobs_select_own_or_admin on public.saved_jobs;
create policy saved_jobs_select_own_or_admin
  on public.saved_jobs
  for select
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists saved_jobs_insert_own_or_admin on public.saved_jobs;
create policy saved_jobs_insert_own_or_admin
  on public.saved_jobs
  for insert
  with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists saved_jobs_update_own_or_admin on public.saved_jobs;
create policy saved_jobs_update_own_or_admin
  on public.saved_jobs
  for update
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
  with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists saved_jobs_delete_own_or_admin on public.saved_jobs;
create policy saved_jobs_delete_own_or_admin
  on public.saved_jobs
  for delete
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

-- Job alerts policies
drop policy if exists job_alerts_select_own_or_admin on public.job_alerts;
create policy job_alerts_select_own_or_admin
  on public.job_alerts
  for select
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists job_alerts_insert_own_or_admin on public.job_alerts;
create policy job_alerts_insert_own_or_admin
  on public.job_alerts
  for insert
  with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists job_alerts_update_own_or_admin on public.job_alerts;
create policy job_alerts_update_own_or_admin
  on public.job_alerts
  for update
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
  with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists job_alerts_delete_own_or_admin on public.job_alerts;
create policy job_alerts_delete_own_or_admin
  on public.job_alerts
  for delete
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

-- Job applications policies
drop policy if exists job_applications_select_own_or_admin on public.job_applications;
create policy job_applications_select_own_or_admin
  on public.job_applications
  for select
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists job_applications_insert_own_or_admin on public.job_applications;
create policy job_applications_insert_own_or_admin
  on public.job_applications
  for insert
  with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists job_applications_update_own_or_admin on public.job_applications;
create policy job_applications_update_own_or_admin
  on public.job_applications
  for update
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role')
  with check (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists job_applications_delete_own_or_admin on public.job_applications;
create policy job_applications_delete_own_or_admin
  on public.job_applications
  for delete
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');
