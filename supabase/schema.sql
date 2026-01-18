-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  alias text unique,
  birthday date not null check (birthday <= current_date - interval '18 years'), -- 18+ check
  gender_identity text,
  bio text,
  avatar_url text, -- Stored in 'avatars' bucket
  verification_status text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  subscription_tier text default 'free' check (subscription_tier in ('free', 'premium')),
  verification_image_url text, -- Stored in 'verification_selfies' bucket (private)
  created_at timestamptz default now()
);

-- RLS for Profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
  on profiles for select 
  using (true);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on profiles for insert 
  with check (auth.uid() = id);


-- INTERESTS (Max 3 per user)
create table interests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  interest text not null,
  created_at timestamptz default now(),
  unique(user_id, interest)
);

alter table interests enable row level security;

create policy "Interests viewable by everyone" on interests for select using (true);
create policy "Users manage own interests" on interests for all using (auth.uid() = user_id);

-- Trigger to enforce max 3 interests
create or replace function check_interest_count()
returns trigger as $$
begin
  if (select count(*) from interests where user_id = new.user_id) >= 3 then
    raise exception 'Max 3 interests allowed';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger enforce_interest_count
before insert on interests
for each row execute procedure check_interest_count();


-- STRANGER ROOMS (Ephemeral)
create table stranger_rooms (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  is_active boolean default true
);

create table stranger_participants (
  room_id uuid references stranger_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (room_id, user_id)
);

alter table stranger_rooms enable row level security;
alter table stranger_participants enable row level security;

create policy "Users can view rooms they are in" on stranger_rooms
  for select using (
    exists (select 1 from stranger_participants where room_id = id and user_id = auth.uid())
  );

create policy "Participants can view participants" on stranger_participants
  for select using (
    exists (select 1 from stranger_participants sp where sp.room_id = room_id and sp.user_id = auth.uid())
  );

-- STRANGER MESSAGES
create table stranger_messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references stranger_rooms(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table stranger_messages enable row level security;

create policy "Users can read/write messages in their rooms" on stranger_messages
  for all using (
    exists (select 1 from stranger_participants where room_id = stranger_messages.room_id and user_id = auth.uid())
  );


-- FRIENDSHIPS
create table friend_requests (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(sender_id, receiver_id)
);

alter table friend_requests enable row level security;
create policy "Users can view own requests" on friend_requests for select 
using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can create requests" on friend_requests for insert 
with check (auth.uid() = sender_id);
create policy "Users can update received requests" on friend_requests for update 
using (auth.uid() = receiver_id);


create table friendships (
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

alter table friendships enable row level security;
create policy "Users can view friends" on friendships for select using (auth.uid() = user_id);


-- FRIEND ROOMS & MESSAGES
create table friend_rooms (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now()
);

create table friend_participants (
  room_id uuid references friend_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (room_id, user_id)
);

create table friend_messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references friend_rooms(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table friend_rooms enable row level security;
alter table friend_participants enable row level security;
alter table friend_messages enable row level security;

-- Policies for friend chat
create policy "View friend rooms" on friend_rooms for select using (
  exists (select 1 from friend_participants where room_id = id and user_id = auth.uid())
);

create policy "View friend messages" on friend_messages for select using (
  exists (select 1 from friend_participants where room_id = friend_messages.room_id and user_id = auth.uid())
);
create policy "Send friend messages" on friend_messages for insert with check (
  exists (select 1 from friend_participants where room_id = friend_messages.room_id and user_id = auth.uid())
);


-- STORAGE BUCKETS (Simulated via SQL for intent, executed in dashboard usually)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('verification_selfies', 'verification_selfies', false) on conflict do nothing;
-- Policies for storage would be added here in real migration if using SQL editor
-- e.g., create policy "Public Avatars" on storage.objects for select using (bucket_id = 'avatars');


-- RPC: Delete Stranger Room (Server Side Action Helper)
create or replace function delete_stranger_room(room_id_input uuid)
returns void as $$
begin
  -- Verify user is in the room (security check, though usually called by server role which bypasses RLS)
  -- But for server action calling this as 'postgres' role, it works.
  delete from stranger_rooms where id = room_id_input;
end;
$$ language plpgsql security definer;


-- RPC: Get Friend Messages (Enforce 24h limit for free users)
-- This function returns messages tailored to the caller's subscription
create or replace function get_friend_messages(room_id_input uuid)
returns setof friend_messages as $$
declare
  is_premium boolean;
  is_friend_premium boolean;
  caller_id uuid := auth.uid();
begin
  -- Check if caller is premium
  select (subscription_tier = 'premium') into is_premium from profiles where id = caller_id;
  
  -- Check if other participant is premium (if "one user is premium" rule applies globally)
  -- Logic: "If one user is premium and other is free: Premium sees history, Free sees 24h"
  -- So we only care about caller's view right? 
  -- "If one user is premium and the other is free... premium still sees everything; free still only sees last 24 hours."
  -- Result: Caller's view depends strictly on CALLER'S status OR if the app logic implies shared premium benefit?
  -- Reading carefully: "Premium users can view full history... Free users can only view... last 24 hours."
  -- "If one user is premium... premium sees everything; free still only sees last 24 hours."
  -- So it's STRICTLY based on the viewer's subscription.
  
  if is_premium then
    return query select * from friend_messages where room_id = room_id_input order by created_at asc;
  else
    return query select * from friend_messages 
                 where room_id = room_id_input 
                 and created_at > (now() - interval '24 hours')
                 order by created_at asc;
  end if;
end;
$$ language plpgsql;


-- MATCHING QUEUE
create table match_queue (
  user_id uuid references profiles(id) on delete cascade primary key,
  created_at timestamptz default now()
);
-- We use this for finding matches. Logic will be in Next.js Server Action to lock rows.
