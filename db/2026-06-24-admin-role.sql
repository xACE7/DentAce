-- DentAce — move "admin" from a hardcoded email to a Supabase role claim,
-- so the owner's email is no longer in the published code. Run in the
-- Supabase SQL editor (Dashboard → SQL → New query).

-- 1) REQUIRED — grant yourself the admin role. This writes to app_metadata,
--    which is server-side only: a normal user can NOT set this on themselves.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
where email = 'removed@example.com';   -- ← your owner email (run privately; not published)

-- 2) REQUIRED — on the website, sign OUT and back IN. app_metadata is only baked
--    into a fresh token, so the admin UI (Members / Online, full PDF access)
--    appears after you re-login. Without step 1+2 you'd have NO admin access.

-- 3) Verify:
--    select email, raw_app_meta_data ->> 'role' as role from auth.users
--    where email = 'removed@example.com';   -- should show role = admin


-- ── OPTIONAL — also make the SERVER rules (RLS) role-based ────────────────────
-- /members and /online are protected by RLS policies that currently test your
-- email. Those policies live in Supabase (private — they are NOT in the published
-- site), so the published-email problem is already solved by the steps above.
-- To fully decouple the server side too, first list the current policies:
--
--    select tablename, policyname, cmd, qual
--    from pg_policies where tablename in ('profiles', 'presence');
--
-- Then in each owner/admin policy, replace the email test, e.g.
--    auth.email() = 'removed@example.com'
--    (auth.jwt() ->> 'email') = 'removed@example.com'
-- with the role test:
--    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
--
-- (Paste the policy list to me and I'll write the exact ALTER/CREATE POLICY SQL.)
