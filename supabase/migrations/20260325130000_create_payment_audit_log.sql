-- Payment audit log: immutable record of every financial event
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'payment_initiated',
        'payment_success',
        'payment_failed',
        'payment_refunded',
        'wallet_credited',
        'wallet_debited',
        'withdrawal_requested',
        'withdrawal_completed',
        'withdrawal_failed'
    )),
    amount NUMERIC(12, 3) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TND',
    flouci_session_id TEXT,
    contract_id UUID REFERENCES contracts(id),
    wallet_id UUID REFERENCES wallets(id),
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded'))
);

-- RLS: users can only read their own log entries, nobody can insert/update/delete via client
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select" ON payment_audit_log
FOR SELECT USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE from client — only Edge Functions can write to this table
-- (enforced by having no permissive client policies for those operations)

-- Index for fast lookup by user and time
CREATE INDEX idx_audit_log_user_id ON payment_audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON payment_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_flouci_session ON payment_audit_log(flouci_session_id) WHERE flouci_session_id IS NOT NULL;
