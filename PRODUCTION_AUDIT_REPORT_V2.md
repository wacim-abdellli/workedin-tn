You are working on Khedma TN. Wallet.tsx validates withdrawal amounts client-side but there is no confirmed server-side enforcement.

TASK: Ensure the withdrawal minimum is enforced at the database level.

Step 1: Open supabase/migrations/ and find the withdrawals table migration. Check if a CHECK constraint or RLS policy enforces minimum withdrawal amount.

Step 2: If no server-side enforcement exists, create a new migration file:
supabase/migrations/YYYYMMDD_enforce_withdrawal_rules.sql

Add:
-- Enforce minimum withdrawal amount (match MIN_WITHDRAWAL_AMOUNT from types/payment.ts)
ALTER TABLE withdrawals ADD CONSTRAINT min_withdrawal_amount 
  CHECK (amount >= 10); -- replace 10 with actual MIN value from types/payment.ts

-- Prevent negative amounts
ALTER TABLE withdrawals ADD CONSTRAINT positive_amount
  CHECK (amount > 0);

-- RLS: user can only insert their OWN withdrawal
-- (verify this policy exists, add if missing)
CREATE POLICY "users_insert_own_withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS: user can only read their OWN withdrawals
CREATE POLICY "users_read_own_withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

Step 3: Also add a check that amount cannot exceed the user's current balance. This is harder to enforce in pure RLS — verify if there is a Supabase Edge Function or database function handling withdrawal creation. If yes, add the balance check there.

Step 4: Report exactly what constraints existed before and what you added.