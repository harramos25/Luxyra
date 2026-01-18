-- ====================================================================
-- LUXYRA DATABASE HARDENING & AUTOMATION
-- Run this script in the Supabase SQL Editor
-- ====================================================================

-- 1. Ensure Profiles Table Structure & Defaults
-- =============================================
-- Make sure table exists
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  alias text unique,
  birthday date,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add Onboarding columns if missing
alter table public.profiles
  add column if not exists gender_identity text,
  add column if not exists bio text,
  add column if not exists interests text[] default '{}'::text[],
  add column if not exists avatar_url text,
  add column if not exists verification_selfie_url text,
  add column if not exists verification_reject_reason text,
  add column if not exists onboarding_completed boolean not null default false;

-- Enforce default 'pending' explicitly
alter table public.profiles
  alter column verification_status set default 'pending';

-- Create Index for unique Alias (case-insensitive)
create unique index if not exists profiles_alias_unique
on public.profiles (lower(alias))
where alias is not null;


-- 2. Automated Profile Creation Trigger
-- =====================================
-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, verification_status)
  values (new.id, new.email, 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger to run on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


-- 3. Strict Profile Constraints (Age & Interests)
-- ===============================================

-- Interest Count Constraint (Max 3)
create or replace function public.enforce_interests_max3()
returns trigger
language plpgsql
as $$
begin
  if new.interests is not null and array_length(new.interests, 1) > 3 then
    raise exception 'Interests max 3 allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_interests_max3 on public.profiles;

create trigger trg_profiles_interests_max3
before insert or update on public.profiles
for each row
execute procedure public.enforce_interests_max3();

-- Age Constraint (18+ Only check)
create or replace function public.enforce_age_18plus()
returns trigger
language plpgsql
as $$
begin
  if new.birthday is not null then
    if new.birthday > (current_date - interval '18 years') then
      raise exception 'Must be 18+ to use Luxyra';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_age_18plus on public.profiles;

create trigger trg_profiles_age_18plus
before insert or update on public.profiles
for each row
execute procedure public.enforce_age_18plus();


-- 4. Row Level Security (RLS) Policies
-- ====================================

alter table public.profiles enable row level security;

-- SELECT: Users can read their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

-- INSERT: Users can insert their own profile (Cover app-side inserts if trigger fails or delayed)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

-- UPDATE: Users can update their own profile (Onboarding, Bio, etc.)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
