-- 0002_enums.sql
-- Enumerations shared by app tables.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role'
      and n.nspname = 'public'
  ) then
    create type public.user_role as enum ('user', 'admin');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'job_source'
      and n.nspname = 'public'
  ) then
    create type public.job_source as enum (
      'medlocum',
      'jobsinnigeria',
      'medicalworldnigeria',
      'other'
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
    where t.typname = 'employment_type'
      and n.nspname = 'public'
  ) then
    create type public.employment_type as enum (
      'full_time',
      'part_time',
      'contract',
      'locum',
      'internship',
      'temporary',
      'remote',
      'other'
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
    where t.typname = 'job_status'
      and n.nspname = 'public'
  ) then
    create type public.job_status as enum ('active', 'archived', 'expired');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'alert_frequency'
      and n.nspname = 'public'
  ) then
    create type public.alert_frequency as enum ('daily', 'weekly', 'monthly');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'application_status'
      and n.nspname = 'public'
  ) then
    create type public.application_status as enum (
      'saved',
      'applied',
      'interviewing',
      'offered',
      'rejected',
      'withdrawn'
    );
  end if;
end
$$;
