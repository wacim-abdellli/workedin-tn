ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS delivery_note text;

COMMENT ON COLUMN public.contracts.delivery_note IS 'Latest recorded freelancer delivery summary/note for client review and workflow enforcement.';
