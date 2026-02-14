-- 0003_profiles.sql
-- User profile data linked 1:1 with auth.users.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email citext,
  full_name text,
  occupation text,
  occupation_other text,
  grad_year integer,
  country text,
  country_other text,
  state text,
  role public.user_role not null default 'user',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_grad_year_check
    check (grad_year is null or (grad_year >= 1950 and grad_year <= 2100))
);

create unique index if not exists profiles_email_key
  on public.profiles (email)
  where email is not null;

create index if not exists profiles_role_idx
  on public.profiles (role);
