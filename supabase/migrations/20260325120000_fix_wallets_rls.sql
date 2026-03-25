-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- DROP old policies first
DROP POLICY IF EXISTS "wallets_select" ON wallets;
DROP POLICY IF EXISTS "wallets_insert" ON wallets;
DROP POLICY IF EXISTS "wallets_update" ON wallets;
DROP POLICY IF EXISTS "wallets_delete" ON wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users view own wallet" ON wallets;
DROP POLICY IF EXISTS "System creates wallets" ON wallets;
DROP POLICY IF EXISTS "Users create own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
DROP POLICY IF EXISTS "Users update own wallet" ON wallets;

-- Users can only see their own wallet
CREATE POLICY "wallets_select" ON wallets
FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own wallet
CREATE POLICY "wallets_insert" ON wallets
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own wallet
CREATE POLICY "wallets_update" ON wallets
FOR UPDATE USING (auth.uid() = user_id);

-- No one can delete a wallet (not even the owner)
CREATE POLICY "wallets_delete" ON wallets
FOR DELETE USING (false);
