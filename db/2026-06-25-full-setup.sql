-- ============================================================================
-- DentAce — FULL database setup (run once in Supabase → SQL Editor → New query).
-- Rebuilds everything the app needs: tables, RLS, triggers, RPCs, storage buckets.
-- Idempotent — safe to re-run. Required edit: your owner email in section 9.
-- ============================================================================

-- Helper: is the caller an admin? (role claim baked into app_metadata)
create or replace function public.is_admin() returns boolean
  language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1) PROFILES — one row per user (mirrors auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text,
  email         text,
  avatar_url    text,
  banned        boolean not null default false,
  show_pdfs     boolean not null default false,   -- hidden by default
  show_tests    boolean not null default true,
  show_lectures boolean not null default true,
  scope         text,                              -- '<year>/<sem>', e.g. '3rd/s1'
  created_at    timestamptz not null default now()
);
-- defensive: add any columns missing from an older profiles table
alter table public.profiles add column if not exists username      text;
alter table public.profiles add column if not exists email         text;
alter table public.profiles add column if not exists avatar_url    text;
alter table public.profiles add column if not exists banned        boolean not null default false;
alter table public.profiles add column if not exists show_pdfs     boolean not null default false;
alter table public.profiles add column if not exists show_tests    boolean not null default true;
alter table public.profiles add column if not exists show_lectures boolean not null default true;
alter table public.profiles add column if not exists scope         text;
alter table public.profiles add column if not exists created_at    timestamptz not null default now();

-- case-insensitive unique usernames
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "profiles read"   on public.profiles;
create policy "profiles read" on public.profiles
  for select to authenticated using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Guard: members can NEVER self-grant privileged flags; new rows start hidden.
-- Admin updates (Members page) run with is_admin() = true, so they pass through.
create or replace function public.profiles_guard() returns trigger
  language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.show_pdfs := false;
    new.banned    := coalesce(new.banned, false);
  elsif tg_op = 'UPDATE' and not public.is_admin() then
    new.show_pdfs     := old.show_pdfs;
    new.show_tests    := old.show_tests;
    new.show_lectures := old.show_lectures;
    new.banned        := old.banned;
  end if;
  return new;
end $$;
drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard before insert or update on public.profiles
  for each row execute function public.profiles_guard();

-- ---------------------------------------------------------------------------
-- 2) Signup trigger — create a profile row for every new auth user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data ->> 'username')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3) Username RPCs (used at login/signup — callable before auth)
-- ---------------------------------------------------------------------------
create or replace function public.username_available(uname text) returns boolean
  language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(uname))
$$;
create or replace function public.email_for_username(uname text) returns text
  language sql security definer set search_path = public stable as $$
  select email from public.profiles where lower(username) = lower(uname) limit 1
$$;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) PROGRESS — cloud sync of each user's study progress (one JSONB row/user)
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
grant select, insert, update on public.progress to authenticated;
drop policy if exists "progress self" on public.progress;
create policy "progress self" on public.progress
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5) PRESENCE — live "who's online" heartbeat (admin-readable)
-- ---------------------------------------------------------------------------
create table if not exists public.presence (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text,
  page       text,
  updated_at timestamptz not null default now()
);
alter table public.presence enable row level security;
grant select, insert, update, delete on public.presence to authenticated;
drop policy if exists "presence self write" on public.presence;
create policy "presence self write" on public.presence
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- realtime feed for the admin Online view (never let this abort the script)
do $$
begin
  alter publication supabase_realtime add table public.presence;
exception when others then null;  -- already added / publication absent — ignore
end $$;

-- ---------------------------------------------------------------------------
-- 6) STORAGE — avatars (public) + pdfs (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', false)
  on conflict (id) do update set public = false;

-- avatars: anyone can read; a user may write only their own "<uid>/..." folder
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects
  for select to public using (bucket_id = 'avatars');
drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- pdfs: only admin or an explicitly-granted member may sign a URL (SELECT).
-- Uploading is done with the SERVICE key, which bypasses RLS (no insert policy needed).
drop policy if exists "pdfs read for granted" on storage.objects;
create policy "pdfs read for granted" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pdfs' and (
      public.is_admin()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.show_pdfs = true)
    )
  );

-- ---------------------------------------------------------------------------
-- 7) Backfill profiles for any users that already exist (no-op on a fresh DB)
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, username)
select u.id, u.email, u.raw_user_meta_data ->> 'username'
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 8) (Optional) make ALL existing members start with PDFs hidden
-- ---------------------------------------------------------------------------
-- update public.profiles set show_pdfs = false;

-- ---------------------------------------------------------------------------
-- 9) REQUIRED — grant YOURSELF the admin role, then sign out & back in.
--     Replace the email below with your real owner email before running.
-- ---------------------------------------------------------------------------
update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                          || jsonb_build_object('role', 'admin')
  where email = 'YOUR_OWNER_EMAIL@example.com';   -- ← EDIT THIS

-- Verify (optional):
-- select email, raw_app_meta_data ->> 'role' as role from auth.users;
-- select username, email, show_pdfs, scope from public.profiles order by created_at desc;
