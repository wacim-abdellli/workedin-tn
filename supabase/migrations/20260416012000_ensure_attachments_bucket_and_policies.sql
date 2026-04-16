-- Ensure attachments bucket exists and is usable for job/proposal uploads.
-- This migration prevents edit/create flows from failing with bucket/policy errors.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  true,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "attachments_public_read" on storage.objects;
create policy "attachments_public_read"
on storage.objects
for select
using (bucket_id = 'attachments');

drop policy if exists "attachments_insert_own" on storage.objects;
create policy "attachments_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "attachments_update_own" on storage.objects;
create policy "attachments_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "attachments_delete_own" on storage.objects;
create policy "attachments_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';