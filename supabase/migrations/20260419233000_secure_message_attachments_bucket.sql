insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message_attachments',
  'message_attachments',
  true,
  15728640,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'video/webm',
    'video/mp4'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "message_attachments_public_read" on storage.objects;
create policy "message_attachments_public_read"
on storage.objects
for select
using (bucket_id = 'message_attachments');

drop policy if exists "message_attachments_insert_conversation_member" on storage.objects;
create policy "message_attachments_insert_conversation_member"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'message_attachments');
drop policy if exists "message_attachments_update_owner" on storage.objects;
create policy "message_attachments_update_owner"
on storage.objects
for update
to authenticated
using (bucket_id = 'message_attachments')
with check (bucket_id = 'message_attachments');
drop policy if exists "message_attachments_delete_owner" on storage.objects;
create policy "message_attachments_delete_owner"
on storage.objects
for delete
to authenticated
using (bucket_id = 'message_attachments');
notify pgrst, 'reload schema';
