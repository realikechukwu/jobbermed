-- 0015_email_personalization_schema.sql
-- Email personalization schema with backward-compatible legacy weekly flow.

-- A) email_preferences
create table if not exists public.email_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  personalization_enabled boolean not null default false,
  frequency text not null default 'weekly',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint email_preferences_frequency_check
    check (frequency in ('daily', 'weekly'))
);

alter table public.email_preferences add column if not exists user_id uuid;
alter table public.email_preferences add column if not exists personalization_enabled boolean;
alter table public.email_preferences add column if not exists frequency text;
alter table public.email_preferences add column if not exists updated_at timestamptz;
alter table public.email_preferences add column if not exists created_at timestamptz;

update public.email_preferences
set personalization_enabled = false
where personalization_enabled is null;

update public.email_preferences
set frequency = 'weekly'
where frequency is null;

update public.email_preferences
set created_at = now()
where created_at is null;

update public.email_preferences
set updated_at = now()
where updated_at is null;

alter table public.email_preferences
  alter column personalization_enabled set default false,
  alter column frequency set default 'weekly',
  alter column created_at set default now(),
  alter column updated_at set default now(),
  alter column personalization_enabled set not null,
  alter column frequency set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_preferences_user_fk'
      and conrelid = 'public.email_preferences'::regclass
  ) then
    alter table public.email_preferences
      add constraint email_preferences_user_fk
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_preferences_frequency_check'
      and conrelid = 'public.email_preferences'::regclass
  ) then
    alter table public.email_preferences
      add constraint email_preferences_frequency_check
      check (frequency in ('daily', 'weekly'));
  end if;
end
$$;

-- B) email_pref_categories
create table if not exists public.email_pref_categories (
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.email_pref_categories add column if not exists user_id uuid;
alter table public.email_pref_categories add column if not exists category text;
alter table public.email_pref_categories add column if not exists created_at timestamptz;

update public.email_pref_categories
set created_at = now()
where created_at is null;

alter table public.email_pref_categories
  alter column created_at set default now(),
  alter column created_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_pref_categories_user_fk'
      and conrelid = 'public.email_pref_categories'::regclass
  ) then
    alter table public.email_pref_categories
      add constraint email_pref_categories_user_fk
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end
$$;

-- C) email_pref_locations
create table if not exists public.email_pref_locations (
  user_id uuid not null references auth.users (id) on delete cascade,
  location text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, location)
);

alter table public.email_pref_locations add column if not exists user_id uuid;
alter table public.email_pref_locations add column if not exists location text;
alter table public.email_pref_locations add column if not exists created_at timestamptz;

update public.email_pref_locations
set created_at = now()
where created_at is null;

alter table public.email_pref_locations
  alter column created_at set default now(),
  alter column created_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_pref_locations_user_fk'
      and conrelid = 'public.email_pref_locations'::regclass
  ) then
    alter table public.email_pref_locations
      add constraint email_pref_locations_user_fk
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end
$$;

-- D) email_delivery_log
create table if not exists public.email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  recipient_email text not null,
  campaign_type text not null,
  status text not null default 'sent',
  dedupe_key text unique,
  meta jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint email_delivery_log_campaign_type_check
    check (campaign_type in ('weekly_default', 'personalized_daily', 'personalized_weekly'))
);

alter table public.email_delivery_log add column if not exists id uuid default gen_random_uuid();
alter table public.email_delivery_log add column if not exists user_id uuid;
alter table public.email_delivery_log add column if not exists recipient_email text;
alter table public.email_delivery_log add column if not exists campaign_type text;
alter table public.email_delivery_log add column if not exists status text;
alter table public.email_delivery_log add column if not exists dedupe_key text;
alter table public.email_delivery_log add column if not exists meta jsonb;
alter table public.email_delivery_log add column if not exists sent_at timestamptz;
alter table public.email_delivery_log add column if not exists created_at timestamptz;

update public.email_delivery_log
set status = 'sent'
where status is null;

update public.email_delivery_log
set meta = '{}'::jsonb
where meta is null;

update public.email_delivery_log
set sent_at = now()
where sent_at is null;

update public.email_delivery_log
set created_at = now()
where created_at is null;

alter table public.email_delivery_log
  alter column status set default 'sent',
  alter column meta set default '{}'::jsonb,
  alter column sent_at set default now(),
  alter column created_at set default now(),
  alter column recipient_email set not null,
  alter column campaign_type set not null,
  alter column status set not null,
  alter column meta set not null,
  alter column sent_at set not null,
  alter column created_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_delivery_log_user_fk'
      and conrelid = 'public.email_delivery_log'::regclass
  ) then
    alter table public.email_delivery_log
      add constraint email_delivery_log_user_fk
      foreign key (user_id) references auth.users (id) on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_delivery_log_campaign_type_check'
      and conrelid = 'public.email_delivery_log'::regclass
  ) then
    alter table public.email_delivery_log
      add constraint email_delivery_log_campaign_type_check
      check (campaign_type in ('weekly_default', 'personalized_daily', 'personalized_weekly'));
  end if;
end
$$;

create unique index if not exists email_delivery_log_dedupe_key_key
  on public.email_delivery_log (dedupe_key);

-- 4) Indexes
create index if not exists email_preferences_personalization_frequency_idx
  on public.email_preferences (personalization_enabled, frequency);

create index if not exists email_pref_categories_category_idx
  on public.email_pref_categories (category);

create index if not exists email_pref_locations_location_idx
  on public.email_pref_locations (location);

create index if not exists email_delivery_log_sent_at_idx
  on public.email_delivery_log (sent_at desc);

create index if not exists email_delivery_log_campaign_type_sent_at_idx
  on public.email_delivery_log (campaign_type, sent_at desc);

create index if not exists email_delivery_log_recipient_email_sent_at_idx
  on public.email_delivery_log (recipient_email, sent_at desc);

-- 5) updated_at trigger for email_preferences
drop trigger if exists set_email_preferences_updated_at on public.email_preferences;
create trigger set_email_preferences_updated_at
  before update on public.email_preferences
  for each row execute function public.set_updated_at();

-- 6) Grants + RLS + policies
grant select, insert, update on table public.email_preferences to authenticated;
grant select, insert, update, delete on table public.email_pref_categories to authenticated;
grant select, insert, update, delete on table public.email_pref_locations to authenticated;
grant all privileges on table public.email_preferences to service_role;
grant all privileges on table public.email_pref_categories to service_role;
grant all privileges on table public.email_pref_locations to service_role;
grant all privileges on table public.email_delivery_log to service_role;

revoke all on table public.email_delivery_log from anon, authenticated;

alter table public.email_preferences enable row level security;
alter table public.email_pref_categories enable row level security;
alter table public.email_pref_locations enable row level security;
alter table public.email_delivery_log enable row level security;

-- email_preferences
drop policy if exists email_preferences_select_own on public.email_preferences;
create policy email_preferences_select_own
  on public.email_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists email_preferences_insert_own on public.email_preferences;
create policy email_preferences_insert_own
  on public.email_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists email_preferences_update_own on public.email_preferences;
create policy email_preferences_update_own
  on public.email_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists email_preferences_admin_read on public.email_preferences;
create policy email_preferences_admin_read
  on public.email_preferences
  for select
  to authenticated
  using (public.is_admin() or auth.role() = 'service_role');

-- email_pref_categories
drop policy if exists email_pref_categories_select_own on public.email_pref_categories;
create policy email_pref_categories_select_own
  on public.email_pref_categories
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists email_pref_categories_insert_own on public.email_pref_categories;
create policy email_pref_categories_insert_own
  on public.email_pref_categories
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists email_pref_categories_update_own on public.email_pref_categories;
create policy email_pref_categories_update_own
  on public.email_pref_categories
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists email_pref_categories_delete_own on public.email_pref_categories;
create policy email_pref_categories_delete_own
  on public.email_pref_categories
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists email_pref_categories_admin_read on public.email_pref_categories;
create policy email_pref_categories_admin_read
  on public.email_pref_categories
  for select
  to authenticated
  using (public.is_admin() or auth.role() = 'service_role');

-- email_pref_locations
drop policy if exists email_pref_locations_select_own on public.email_pref_locations;
create policy email_pref_locations_select_own
  on public.email_pref_locations
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists email_pref_locations_insert_own on public.email_pref_locations;
create policy email_pref_locations_insert_own
  on public.email_pref_locations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists email_pref_locations_update_own on public.email_pref_locations;
create policy email_pref_locations_update_own
  on public.email_pref_locations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists email_pref_locations_delete_own on public.email_pref_locations;
create policy email_pref_locations_delete_own
  on public.email_pref_locations
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists email_pref_locations_admin_read on public.email_pref_locations;
create policy email_pref_locations_admin_read
  on public.email_pref_locations
  for select
  to authenticated
  using (public.is_admin() or auth.role() = 'service_role');

-- email_delivery_log (service-role only)
drop policy if exists email_delivery_log_service_role_all on public.email_delivery_log;
create policy email_delivery_log_service_role_all
  on public.email_delivery_log
  for all
  to service_role
  using (true)
  with check (true);
