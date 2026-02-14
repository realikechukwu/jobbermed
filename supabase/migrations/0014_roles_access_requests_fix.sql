-- 0014_roles_access_requests_fix.sql
-- Role + access-request schema and approval workflow for dashboard gating.
-- Keeps backward compatibility with legacy role alias `mdcn`.

-- 1) Role enum alignment.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role'
      and n.nspname = 'public'
  ) then
    create type public.user_role as enum (
      'user',
      'admin',
      'recruiter',
      'mdcn_official',
      'mdcn'
    );
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role'
      and n.nspname = 'public'
  ) then
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where t.typname = 'user_role'
        and n.nspname = 'public'
        and e.enumlabel = 'recruiter'
    ) then
      alter type public.user_role add value 'recruiter';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where t.typname = 'user_role'
        and n.nspname = 'public'
        and e.enumlabel = 'mdcn_official'
    ) then
      alter type public.user_role add value 'mdcn_official';
    end if;

    -- Legacy alias kept for backward compatibility.
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where t.typname = 'user_role'
        and n.nspname = 'public'
        and e.enumlabel = 'mdcn'
    ) then
      alter type public.user_role add value 'mdcn';
    end if;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'access_request_status'
      and n.nspname = 'public'
  ) then
    create type public.access_request_status as enum (
      'pending',
      'approved',
      'rejected'
    );
  end if;
end
$$;

-- 2) user_platform_roles table.
create table if not exists public.user_platform_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.user_role not null,
  org_id uuid,
  status text not null default 'active',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_platform_roles_status_check
    check (status in ('pending', 'active', 'inactive', 'revoked'))
);

alter table public.user_platform_roles add column if not exists id uuid default gen_random_uuid();
alter table public.user_platform_roles add column if not exists user_id uuid;
alter table public.user_platform_roles add column if not exists role public.user_role;
alter table public.user_platform_roles add column if not exists org_id uuid;
alter table public.user_platform_roles add column if not exists status text;
alter table public.user_platform_roles add column if not exists is_active boolean;
alter table public.user_platform_roles add column if not exists created_at timestamptz;
alter table public.user_platform_roles add column if not exists updated_at timestamptz;

alter table public.user_platform_roles
  alter column status set default 'active',
  alter column is_active set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_platform_roles_status_check'
      and conrelid = 'public.user_platform_roles'::regclass
  ) then
    alter table public.user_platform_roles
      add constraint user_platform_roles_status_check
      check (status in ('pending', 'active', 'inactive', 'revoked'));
  end if;
end
$$;

do $$
begin
  if to_regclass('public.organizations') is not null
  and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'id'
  )
  and not exists (
    select 1
    from pg_constraint
    where conname = 'user_platform_roles_org_fk'
      and conrelid = 'public.user_platform_roles'::regclass
  ) then
    alter table public.user_platform_roles
      add constraint user_platform_roles_org_fk
      foreign key (org_id) references public.organizations (id)
      on delete set null;
  end if;
end
$$;

create index if not exists user_platform_roles_user_idx
  on public.user_platform_roles (user_id);

create index if not exists user_platform_roles_role_active_idx
  on public.user_platform_roles (role, is_active, status);

create index if not exists user_platform_roles_org_idx
  on public.user_platform_roles (org_id);

create unique index if not exists user_platform_roles_user_role_global_unique_idx
  on public.user_platform_roles (user_id, role)
  where org_id is null;

create unique index if not exists user_platform_roles_user_role_org_unique_idx
  on public.user_platform_roles (user_id, role, org_id)
  where org_id is not null;

-- 3) access_requests table.
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_role public.user_role not null,
  org_id uuid,
  reason text,
  status public.access_request_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.access_requests add column if not exists id uuid default gen_random_uuid();
alter table public.access_requests add column if not exists user_id uuid;
alter table public.access_requests add column if not exists requested_role public.user_role;
alter table public.access_requests add column if not exists org_id uuid;
alter table public.access_requests add column if not exists reason text;
alter table public.access_requests add column if not exists status public.access_request_status;
alter table public.access_requests add column if not exists reviewed_by uuid;
alter table public.access_requests add column if not exists reviewed_at timestamptz;
alter table public.access_requests add column if not exists created_at timestamptz;
alter table public.access_requests add column if not exists updated_at timestamptz;

alter table public.access_requests
  alter column status set default 'pending',
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if to_regclass('public.organizations') is not null
  and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'id'
  )
  and not exists (
    select 1
    from pg_constraint
    where conname = 'access_requests_org_fk'
      and conrelid = 'public.access_requests'::regclass
  ) then
    alter table public.access_requests
      add constraint access_requests_org_fk
      foreign key (org_id) references public.organizations (id)
      on delete set null;
  end if;
end
$$;

create index if not exists access_requests_user_status_idx
  on public.access_requests (user_id, status, created_at desc);

create index if not exists access_requests_status_role_idx
  on public.access_requests (status, requested_role, created_at desc);

create index if not exists access_requests_reviewed_by_idx
  on public.access_requests (reviewed_by);

-- 4) Helper functions used by policies.
create or replace function public.normalize_platform_role(p_role text)
returns text
language sql
immutable
as $$
  select case
    when p_role is null then null
    when lower(p_role) = 'mdcn' then 'mdcn_official'
    else lower(p_role)
  end;
$$;

create or replace function public.has_platform_role(
  p_role text,
  p_user_id uuid default auth.uid(),
  p_org_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  with desired as (
    select public.normalize_platform_role(p_role) as role_name
  ),
  jwt_role as (
    select public.normalize_platform_role(
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '')
    ) as role_name
  )
  select
    exists (
      select 1
      from jwt_role jr
      join desired d on true
      where jr.role_name = d.role_name
    )
    or exists (
      select 1
      from public.user_platform_roles upr
      join desired d on true
      where upr.user_id = coalesce(p_user_id, auth.uid())
        and upr.is_active = true
        and upr.status = 'active'
        and (
          public.normalize_platform_role(upr.role::text) = d.role_name
        )
        and (
          p_org_id is null
          or upr.org_id is null
          or upr.org_id = p_org_id
        )
    );
$$;

create or replace function public.is_platform_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    coalesce(public.is_admin(), false)
    or public.has_platform_role('admin', p_user_id, null)
    or auth.role() = 'service_role';
$$;

-- 5) approve_access_request workflow (single transaction as function body).
create or replace function public.approve_access_request(
  p_request_id uuid,
  p_approve boolean default true
)
returns public.access_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_request public.access_requests%rowtype;
  v_now timestamptz := now();
  v_role public.user_role;
begin
  if not public.is_platform_admin(auth.uid()) and auth.role() <> 'service_role' then
    raise exception 'not authorized to review access requests'
      using errcode = '42501';
  end if;

  select *
  into v_request
  from public.access_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'access request % not found', p_request_id
      using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'access request % is already %', p_request_id, v_request.status
      using errcode = 'P0001';
  end if;

  if public.normalize_platform_role(v_request.requested_role::text) = 'mdcn_official' then
    v_role := 'mdcn_official'::public.user_role;
  else
    v_role := v_request.requested_role;
  end if;

  update public.access_requests
  set status = case when p_approve then 'approved'::public.access_request_status else 'rejected'::public.access_request_status end,
      reviewed_by = auth.uid(),
      reviewed_at = v_now,
      updated_at = v_now
  where id = p_request_id
  returning * into v_request;

  if p_approve then
    update public.user_platform_roles
    set is_active = true,
        status = 'active',
        updated_at = v_now
    where user_id = v_request.user_id
      and role = v_role
      and (
        (org_id is null and v_request.org_id is null)
        or org_id = v_request.org_id
      );

    if not found then
      insert into public.user_platform_roles (
        user_id,
        role,
        org_id,
        status,
        is_active,
        created_at,
        updated_at
      )
      values (
        v_request.user_id,
        v_role,
        v_request.org_id,
        'active',
        true,
        v_now,
        v_now
      );
    end if;
  end if;

  return v_request;
end;
$$;

grant execute on function public.approve_access_request(uuid, boolean)
  to authenticated, service_role;

-- 6) updated_at triggers.
drop trigger if exists set_user_platform_roles_updated_at on public.user_platform_roles;
create trigger set_user_platform_roles_updated_at
  before update on public.user_platform_roles
  for each row execute function public.set_updated_at();

drop trigger if exists set_access_requests_updated_at on public.access_requests;
create trigger set_access_requests_updated_at
  before update on public.access_requests
  for each row execute function public.set_updated_at();

-- 7) RLS + policies.
grant select, insert, update, delete on table public.user_platform_roles to authenticated;
grant select, insert, update on table public.access_requests to authenticated;
grant all privileges on table public.user_platform_roles to service_role;
grant all privileges on table public.access_requests to service_role;

alter table public.user_platform_roles enable row level security;
alter table public.access_requests enable row level security;

drop policy if exists user_platform_roles_select_own on public.user_platform_roles;
create policy user_platform_roles_select_own
  on public.user_platform_roles
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_platform_roles_admin_select on public.user_platform_roles;
create policy user_platform_roles_admin_select
  on public.user_platform_roles
  for select
  to authenticated
  using (public.is_admin() or auth.role() = 'service_role');

drop policy if exists user_platform_roles_admin_insert on public.user_platform_roles;
create policy user_platform_roles_admin_insert
  on public.user_platform_roles
  for insert
  to authenticated
  with check (public.is_admin() or auth.role() = 'service_role');

drop policy if exists user_platform_roles_admin_update on public.user_platform_roles;
create policy user_platform_roles_admin_update
  on public.user_platform_roles
  for update
  to authenticated
  using (public.is_admin() or auth.role() = 'service_role')
  with check (public.is_admin() or auth.role() = 'service_role');

drop policy if exists user_platform_roles_admin_delete on public.user_platform_roles;
create policy user_platform_roles_admin_delete
  on public.user_platform_roles
  for delete
  to authenticated
  using (public.is_admin() or auth.role() = 'service_role');

drop policy if exists access_requests_select_own on public.access_requests;
create policy access_requests_select_own
  on public.access_requests
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists access_requests_insert_own on public.access_requests;
create policy access_requests_insert_own
  on public.access_requests
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
  );

drop policy if exists access_requests_admin_select on public.access_requests;
create policy access_requests_admin_select
  on public.access_requests
  for select
  to authenticated
  using (public.is_platform_admin(auth.uid()) or auth.role() = 'service_role');

drop policy if exists access_requests_admin_update on public.access_requests;
create policy access_requests_admin_update
  on public.access_requests
  for update
  to authenticated
  using (public.is_platform_admin(auth.uid()) or auth.role() = 'service_role')
  with check (public.is_platform_admin(auth.uid()) or auth.role() = 'service_role');

-- 8) Patch native reviewer policies to include mdcn_official (+ legacy mdcn alias).
drop policy if exists native_job_applications_reviewer_read on public.native_job_applications;
create policy native_job_applications_reviewer_read
  on public.native_job_applications
  for select
  to authenticated
  using (
    public.is_platform_admin(auth.uid())
    or auth.role() = 'service_role'
    or public.has_platform_role('recruiter')
    or public.has_platform_role('mdcn_official')
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('recruiter', 'mdcn_official', 'mdcn')
    or exists (
      select 1
      from public.native_jobs nj
      where nj.id = native_job_applications.job_id
        and nj.posted_by = auth.uid()
    )
  );

drop policy if exists native_job_applications_reviewer_update on public.native_job_applications;
create policy native_job_applications_reviewer_update
  on public.native_job_applications
  for update
  to authenticated
  using (
    public.is_platform_admin(auth.uid())
    or auth.role() = 'service_role'
    or public.has_platform_role('recruiter')
    or public.has_platform_role('mdcn_official')
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('recruiter', 'mdcn_official', 'mdcn')
    or exists (
      select 1
      from public.native_jobs nj
      where nj.id = native_job_applications.job_id
        and nj.posted_by = auth.uid()
    )
  )
  with check (
    public.is_platform_admin(auth.uid())
    or auth.role() = 'service_role'
    or public.has_platform_role('recruiter')
    or public.has_platform_role('mdcn_official')
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('recruiter', 'mdcn_official', 'mdcn')
    or exists (
      select 1
      from public.native_jobs nj
      where nj.id = native_job_applications.job_id
        and nj.posted_by = auth.uid()
    )
  );
