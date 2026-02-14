-- 0013_native_jobs_contract_fix.sql
-- Native Jobs contract fix for coexistence with legacy jobs/application objects.
-- Legacy public.job_applications and public.application_status remain untouched.

-- 1) Enums
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'native_job_status'
      and n.nspname = 'public'
  ) then
    create type public.native_job_status as enum (
      'draft',
      'published',
      'closed',
      'archived'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'native_application_status'
      and n.nspname = 'public'
  ) then
    create type public.native_application_status as enum (
      'submitted',
      'in_review',
      'shortlisted',
      'rejected',
      'hired',
      'withdrawn'
    );
  end if;
end
$$;

-- 2) Native jobs table
create table if not exists public.native_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  posted_by uuid not null,
  title text not null,
  description text not null,
  requirements text,
  responsibilities text,
  location text,
  job_type text,
  category text,
  salary_min numeric,
  salary_max numeric,
  currency text default 'NGN',
  apply_deadline timestamptz,
  status public.native_job_status not null default 'draft',
  is_public boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint native_jobs_posted_by_fk
    foreign key (posted_by) references public.profiles (user_id),
  constraint native_jobs_salary_range_check
    check (salary_min is null or salary_max is null or salary_min <= salary_max)
);

alter table public.native_jobs add column if not exists organization_id uuid;
alter table public.native_jobs add column if not exists posted_by uuid;
alter table public.native_jobs add column if not exists title text;
alter table public.native_jobs add column if not exists description text;
alter table public.native_jobs add column if not exists requirements text;
alter table public.native_jobs add column if not exists responsibilities text;
alter table public.native_jobs add column if not exists location text;
alter table public.native_jobs add column if not exists job_type text;
alter table public.native_jobs add column if not exists category text;
alter table public.native_jobs add column if not exists salary_min numeric;
alter table public.native_jobs add column if not exists salary_max numeric;
alter table public.native_jobs add column if not exists currency text;
alter table public.native_jobs add column if not exists apply_deadline timestamptz;
alter table public.native_jobs add column if not exists status public.native_job_status;
alter table public.native_jobs add column if not exists is_public boolean;
alter table public.native_jobs add column if not exists published_at timestamptz;
alter table public.native_jobs add column if not exists created_at timestamptz;
alter table public.native_jobs add column if not exists updated_at timestamptz;

alter table public.native_jobs
  alter column currency set default 'NGN',
  alter column status set default 'draft',
  alter column is_public set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'native_jobs'
      and column_name = 'posted_by'
  )
  and not exists (
    select 1
    from pg_constraint
    where conname = 'native_jobs_posted_by_fk'
      and conrelid = 'public.native_jobs'::regclass
  ) then
    alter table public.native_jobs
      add constraint native_jobs_posted_by_fk
      foreign key (posted_by) references public.profiles (user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'native_jobs_salary_range_check'
      and conrelid = 'public.native_jobs'::regclass
  ) then
    alter table public.native_jobs
      add constraint native_jobs_salary_range_check
      check (salary_min is null or salary_max is null or salary_min <= salary_max);
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
    where conname = 'native_jobs_organization_fk'
      and conrelid = 'public.native_jobs'::regclass
  ) then
    alter table public.native_jobs
      add constraint native_jobs_organization_fk
      foreign key (organization_id) references public.organizations (id)
      on delete set null;
  end if;
end
$$;

-- 3) Native job applications table
create table if not exists public.native_job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  candidate_user_id uuid,
  applicant_name text not null,
  applicant_email text not null,
  applicant_phone text,
  cover_letter text,
  cv_url text,
  status public.native_application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint native_job_applications_job_fk
    foreign key (job_id) references public.native_jobs (id) on delete cascade,
  constraint native_job_applications_candidate_fk
    foreign key (candidate_user_id) references public.profiles (user_id) on delete set null
);

alter table public.native_job_applications add column if not exists job_id uuid;
alter table public.native_job_applications add column if not exists candidate_user_id uuid;
alter table public.native_job_applications add column if not exists applicant_name text;
alter table public.native_job_applications add column if not exists applicant_email text;
alter table public.native_job_applications add column if not exists applicant_phone text;
alter table public.native_job_applications add column if not exists cover_letter text;
alter table public.native_job_applications add column if not exists cv_url text;
alter table public.native_job_applications add column if not exists status public.native_application_status;
alter table public.native_job_applications add column if not exists submitted_at timestamptz;
alter table public.native_job_applications add column if not exists updated_at timestamptz;

alter table public.native_job_applications
  alter column status set default 'submitted',
  alter column submitted_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'native_job_applications'
      and column_name = 'job_id'
  )
  and not exists (
    select 1
    from pg_constraint
    where conname = 'native_job_applications_job_fk'
      and conrelid = 'public.native_job_applications'::regclass
  ) then
    alter table public.native_job_applications
      add constraint native_job_applications_job_fk
      foreign key (job_id) references public.native_jobs (id) on delete cascade;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'native_job_applications'
      and column_name = 'candidate_user_id'
  )
  and not exists (
    select 1
    from pg_constraint
    where conname = 'native_job_applications_candidate_fk'
      and conrelid = 'public.native_job_applications'::regclass
  ) then
    alter table public.native_job_applications
      add constraint native_job_applications_candidate_fk
      foreign key (candidate_user_id) references public.profiles (user_id) on delete set null;
  end if;
end
$$;

-- 4) Indexes
create index if not exists native_jobs_status_public_published_at_idx
  on public.native_jobs (status, is_public, published_at desc);

create index if not exists native_jobs_category_idx
  on public.native_jobs (category);

create index if not exists native_jobs_location_idx
  on public.native_jobs (location);

create index if not exists native_job_applications_job_id_idx
  on public.native_job_applications (job_id);

create index if not exists native_job_applications_status_idx
  on public.native_job_applications (status);

create index if not exists native_job_applications_submitted_at_idx
  on public.native_job_applications (submitted_at desc);

create unique index if not exists native_job_applications_job_candidate_unique_idx
  on public.native_job_applications (job_id, candidate_user_id)
  where candidate_user_id is not null;

-- 5) updated_at triggers
drop trigger if exists set_native_jobs_updated_at on public.native_jobs;
create trigger set_native_jobs_updated_at
  before update on public.native_jobs
  for each row execute function public.set_updated_at();

drop trigger if exists set_native_job_applications_updated_at on public.native_job_applications;
create trigger set_native_job_applications_updated_at
  before update on public.native_job_applications
  for each row execute function public.set_updated_at();

-- 6) Grants and RLS
grant select on table public.native_jobs to anon, authenticated;
grant insert, update, delete on table public.native_jobs to authenticated;
grant select, insert, update on table public.native_job_applications to authenticated;
grant all privileges on table public.native_jobs to service_role;
grant all privileges on table public.native_job_applications to service_role;

alter table public.native_jobs enable row level security;
alter table public.native_job_applications enable row level security;

-- Native jobs policies
drop policy if exists native_jobs_public_read_published on public.native_jobs;
create policy native_jobs_public_read_published
  on public.native_jobs
  for select
  to anon, authenticated
  using (is_public = true and status = 'published');

drop policy if exists native_jobs_owner_admin_read on public.native_jobs;
create policy native_jobs_owner_admin_read
  on public.native_jobs
  for select
  to authenticated
  using (
    auth.uid() = posted_by
    or public.is_admin()
    or auth.role() = 'service_role'
  );

drop policy if exists native_jobs_owner_admin_insert on public.native_jobs;
create policy native_jobs_owner_admin_insert
  on public.native_jobs
  for insert
  to authenticated
  with check (
    auth.uid() = posted_by
    or public.is_admin()
    or auth.role() = 'service_role'
  );

drop policy if exists native_jobs_owner_admin_update on public.native_jobs;
create policy native_jobs_owner_admin_update
  on public.native_jobs
  for update
  to authenticated
  using (
    auth.uid() = posted_by
    or public.is_admin()
    or auth.role() = 'service_role'
  )
  with check (
    auth.uid() = posted_by
    or public.is_admin()
    or auth.role() = 'service_role'
  );

drop policy if exists native_jobs_owner_admin_delete on public.native_jobs;
create policy native_jobs_owner_admin_delete
  on public.native_jobs
  for delete
  to authenticated
  using (
    auth.uid() = posted_by
    or public.is_admin()
    or auth.role() = 'service_role'
  );

-- Native application policies
drop policy if exists native_job_applications_insert_own on public.native_job_applications;
create policy native_job_applications_insert_own
  on public.native_job_applications
  for insert
  to authenticated
  with check (candidate_user_id = auth.uid());

drop policy if exists native_job_applications_select_own on public.native_job_applications;
create policy native_job_applications_select_own
  on public.native_job_applications
  for select
  to authenticated
  using (candidate_user_id = auth.uid());

drop policy if exists native_job_applications_reviewer_read on public.native_job_applications;
create policy native_job_applications_reviewer_read
  on public.native_job_applications
  for select
  to authenticated
  using (
    public.is_admin()
    or auth.role() = 'service_role'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('recruiter', 'mdcn')
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
    public.is_admin()
    or auth.role() = 'service_role'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('recruiter', 'mdcn')
    or exists (
      select 1
      from public.native_jobs nj
      where nj.id = native_job_applications.job_id
        and nj.posted_by = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or auth.role() = 'service_role'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('recruiter', 'mdcn')
    or exists (
      select 1
      from public.native_jobs nj
      where nj.id = native_job_applications.job_id
        and nj.posted_by = auth.uid()
    )
  );
