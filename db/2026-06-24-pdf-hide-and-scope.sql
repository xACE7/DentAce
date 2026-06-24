-- DentAce — run once in the Supabase SQL editor (Dashboard → SQL → New query).
-- Adds the per-user study scope and makes PDFs hidden-by-default.
-- Safe to re-run (idempotent).

-- 1) Per-user study scope: which year+semester the profile progress reflects.
--    Stored as "<year>/<sem>", e.g. '3rd/s1'. NULL → the app falls back to the
--    first year+semester until the member picks one in Edit Account.
alter table public.profiles
  add column if not exists scope text;

-- 2) Hide PDFs by default for EVERY member.
--    (You, the admin, always see PDFs regardless of this flag.)

-- 2a) Column default (used when an INSERT doesn't name show_pdfs).
alter table public.profiles
  alter column show_pdfs set default false;

-- 2b) Trigger-proof guard: force every NEW profile to start hidden, even if your
--     signup trigger (handle_new_user) explicitly inserts show_pdfs = true.
--     Granting access later is an UPDATE, so this guard never blocks /members.
create or replace function public.profiles_hide_pdfs_on_insert()
returns trigger language plpgsql as $$
begin
  new.show_pdfs := false;
  return new;
end
$$;

drop trigger if exists trg_profiles_hide_pdfs on public.profiles;
create trigger trg_profiles_hide_pdfs
  before insert on public.profiles
  for each row execute function public.profiles_hide_pdfs_on_insert();

-- 2c) Reset all EXISTING members to hidden so the new default applies
--     retroactively. Re-grant the people you want in the app (/members → PDFs).
update public.profiles
  set show_pdfs = false;

-- ── Optional: verify it worked ───────────────────────────────────────────────
-- select username, email, show_pdfs from public.profiles order by created_at desc;
