-- 0016_profiles_admin_email_visibility.sql
-- Make requester identity readable in admin approval flows and backfill missing profile identity data.

-- 1) Align profiles admin-read policy with platform-admin checks used by access requests.
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  using (
    auth.uid() = user_id
    or public.is_platform_admin(auth.uid())
    or auth.role() = 'service_role'
  );

-- 2) Backfill missing profile rows for legacy auth users.
insert into public.profiles (user_id, email, full_name)
select
  u.id,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), '')
from auth.users u
left join public.profiles p
  on p.user_id = u.id
where p.user_id is null;

-- 3) Fill empty profile emails from auth.users.
update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and u.email is not null
  and (p.email is null or btrim(p.email::text) = '');

-- 4) Fill empty profile names from auth metadata where available.
update public.profiles p
set full_name = nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), '')
from auth.users u
where p.user_id = u.id
  and (p.full_name is null or btrim(p.full_name) = '')
  and nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), '') is not null;
