-- Add reference links field for job briefs (Drive, portfolio, social links, etc.)
-- Stored as JSONB array so UI can render platform-aware link cards.

alter table public.jobs
  add column if not exists reference_links jsonb not null default '[]'::jsonb;

alter table public.jobs
  drop constraint if exists jobs_reference_links_is_array;

alter table public.jobs
  add constraint jobs_reference_links_is_array
  check (jsonb_typeof(reference_links) = 'array');

comment on column public.jobs.reference_links is
  'Optional external links shared with the job brief (Google Drive, social media, portfolio, etc.).';

notify pgrst, 'reload schema';
