CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_status text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    source text NOT NULL DEFAULT 'account_status_gate',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    CONSTRAINT support_tickets_account_status_check CHECK (account_status IN ('suspended', 'archived')),
    CONSTRAINT support_tickets_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_support_tickets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_support_tickets_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_select_owner_or_admin" ON public.support_tickets;
CREATE POLICY "support_tickets_select_owner_or_admin"
    ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "support_tickets_insert_owner_suspended_or_archived" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_owner_suspended_or_archived"
    ON public.support_tickets
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND account_status IN ('suspended', 'archived')
        AND EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.account_status = support_tickets.account_status
        )
    );

DROP POLICY IF EXISTS "support_tickets_update_admin_only" ON public.support_tickets;
CREATE POLICY "support_tickets_update_admin_only"
    ON public.support_tickets
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "support_tickets_delete_admin_only" ON public.support_tickets;
CREATE POLICY "support_tickets_delete_admin_only"
    ON public.support_tickets
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.support_tickets TO authenticated;
