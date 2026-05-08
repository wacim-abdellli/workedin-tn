-- Add revision_requested to contract_status_enum safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'contract_status_enum' AND e.enumlabel = 'revision_requested'
    ) THEN
        ALTER TYPE public.contract_status_enum ADD VALUE 'revision_requested';
    END IF;
END
$$;
