BEGIN;

CREATE TABLE IF NOT EXISTS public.upload_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    bucket text NOT NULL,
    file_name text NOT NULL,
    storage_path text,
    mime_type text NOT NULL,
    file_size bigint NOT NULL CHECK (file_size >= 0),
    status text NOT NULL CHECK (status IN ('accepted', 'rejected', 'rate_limited', 'failed')),
    reason text,
    ip_address text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_upload_audit_log_user_bucket_created_at
    ON public.upload_audit_log (user_id, bucket, created_at DESC);

ALTER TABLE public.upload_audit_log ENABLE ROW LEVEL SECURITY;

COMMIT;
