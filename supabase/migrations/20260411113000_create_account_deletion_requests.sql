CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason text,
    status text NOT NULL DEFAULT 'pending',
    source text NOT NULL DEFAULT 'settings_security',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    requested_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    processed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    processor_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT account_deletion_requests_status_check CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id
    ON public.account_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status
    ON public.account_deletion_requests(status);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_requested_at
    ON public.account_deletion_requests(requested_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_account_deletion_requests_one_open_per_user
    ON public.account_deletion_requests(user_id)
    WHERE status IN ('pending', 'in_review');

CREATE OR REPLACE FUNCTION public.touch_account_deletion_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_account_deletion_requests_updated_at ON public.account_deletion_requests;
CREATE TRIGGER trg_account_deletion_requests_updated_at
    BEFORE UPDATE ON public.account_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_account_deletion_requests_updated_at();

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_deletion_requests_select_owner_or_admin" ON public.account_deletion_requests;
CREATE POLICY "account_deletion_requests_select_owner_or_admin"
    ON public.account_deletion_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "account_deletion_requests_insert_owner" ON public.account_deletion_requests;
CREATE POLICY "account_deletion_requests_insert_owner"
    ON public.account_deletion_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "account_deletion_requests_update_admin_only" ON public.account_deletion_requests;
CREATE POLICY "account_deletion_requests_update_admin_only"
    ON public.account_deletion_requests
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "account_deletion_requests_delete_admin_only" ON public.account_deletion_requests;
CREATE POLICY "account_deletion_requests_delete_admin_only"
    ON public.account_deletion_requests
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_requests TO authenticated;
