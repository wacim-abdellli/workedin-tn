-- Create a durable send log to prevent email replay attacks and double-sends

CREATE TABLE IF NOT EXISTS public.email_dispatch_log (
    id uuid primary key default gen_random_uuid(),
    action text not null,
    entity_type text not null,
    entity_id uuid not null,
    recipient_id uuid not null,
    triggered_by uuid not null,
    created_at timestamptz not null default now(),
    UNIQUE (action, entity_type, entity_id, recipient_id)
);

-- Protect the log to prevent tampering
ALTER TABLE public.email_dispatch_log ENABLE ROW LEVEL SECURITY;

-- Admins and the Edge Function (service role) can read/write
CREATE POLICY admin_email_log_all ON public.email_dispatch_log
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );
