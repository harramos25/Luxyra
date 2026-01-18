-- Add verification columns to profiles table
alter table public.profiles
add column if not exists verification_status text not null default 'pending',
add column if not exists verification_reason text,
add column if not exists selfie_path text,
add column if not exists verified_at timestamptz;

-- Enforce allowed status values
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_verification_status_check') then
    alter table public.profiles
      add constraint profiles_verification_status_check
      check (verification_status in ('pending','approved','rejected'));
  end if;
end $$;

-- RLS should already be enabled, but ensure users cannot update these specific columns
-- Ideally, we'd have a separate policy or simply rely on the fact that existing policies might allow UPDATE.
-- BUT, if existing policy allows "UPDATE using (id = auth.uid())", then users modify their own status.
-- FIX: We need to revoke update on these columns specifically or ensure the general UPDATE policy excludes them.
-- However, Supabase RLS is row-level. Column-level security is harder.
-- BETTER: Use a trigger to prevent changes to these columns by the user.

create or replace function prevent_user_verification_update()
returns trigger as $$
begin
  -- If the user is not a service_role (superuser bypasses RLS anyway mostly, but let's be safe)
  -- Actually, in Supabase, service_role bypasses RLS. So this trigger will fire.
  -- We need to check if the current role is 'authenticated' (the user).
  
  if (auth.role() = 'authenticated') then
     if (NEW.verification_status is distinct from OLD.verification_status) or
        (NEW.verified_at is distinct from OLD.verified_at) then
        raise exception 'You are not allowed to update verification status.';
     end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Drop trigger if exists to recreate
drop trigger if exists prevent_verification_update_trigger on public.profiles;

create trigger prevent_verification_update_trigger
before update on public.profiles
for each row execute function prevent_user_verification_update();
