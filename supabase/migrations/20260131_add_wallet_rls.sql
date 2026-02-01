-- Add RLS policy for wallets UPDATE
-- This allows users to update their own wallet if needed, though most updates should go through secure RPCs.

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Ensure transactions have RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure withdrawals have RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can request withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
