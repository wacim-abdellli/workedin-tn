-- Migration: Add Dhmad escrow tracking columns to contracts
-- Deployed via: npx supabase db push --project-ref <ref>
-- Part of: Dhmad escrow integration infrastructure

ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS dhmad_escrow_id   TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS dhmad_payment_url TEXT DEFAULT NULL;

-- Index: fast lookup by Dhmad escrow ID (webhook / reconciliation use-case)
CREATE INDEX IF NOT EXISTS idx_contracts_dhmad_escrow_id
    ON public.contracts (dhmad_escrow_id)
    WHERE dhmad_escrow_id IS NOT NULL;

-- Documentation
COMMENT ON COLUMN public.contracts.dhmad_escrow_id IS
    'Dhmad escrow ID returned by the dhmad-create-escrow Edge Function. '
    'Used to correlate Khedmetna contracts with Dhmad escrow records for '
    'release, refund, and webhook reconciliation flows.';

COMMENT ON COLUMN public.contracts.dhmad_payment_url IS
    'Dhmad payment URL the client must visit to fund the escrow. '
    'Returned by the dhmad-create-escrow Edge Function and stored here for '
    'display in the contract workspace UI.';
