-- DentAce — move PDFs to a PRIVATE Supabase Storage bucket.
-- Run in Supabase → SQL editor. Safe to re-run.

-- 1) Create a private bucket named 'pdfs' (not publicly downloadable).
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do update set public = false;

-- 2) Access policy: only the admin OR a member you've granted (profiles.show_pdfs)
--    may create a signed URL (a SELECT on the object). Guests get nothing.
--    Uploading is done with the service key, which bypasses RLS.
drop policy if exists "pdf read for granted members" on storage.objects;
create policy "pdf read for granted members"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pdfs'
  and (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.show_pdfs = true
    )
  )
);

-- (storage.objects already has RLS enabled by default in Supabase.)
