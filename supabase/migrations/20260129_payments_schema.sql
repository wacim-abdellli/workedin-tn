-- ============================================
-- Khedma.tn Payments Schema
-- Phase 1: Payment Gateway Integration
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- ENUMS for Payment System
-- ============================================

-- Transaction types
DO $$ BEGIN
    CREATE TYPE transaction_type_enum AS ENUM (
        'deposit',      -- Client adds funds
        'escrow',       -- Funds held for contract
        'release',      -- Payment released to freelancer
        'refund',       -- Refund to client
        'withdrawal',   -- Freelancer withdraws to bank
        'fee'           -- Platform fee deduction
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Transaction status
DO $$ BEGIN
    CREATE TYPE transaction_status_enum AS ENUM (
        'pending',      -- Awaiting payment
        'processing',   -- Payment being processed
        'completed',    -- Successfully completed
        'failed',       -- Payment failed
        'refunded',     -- Transaction refunded
        'cancelled'     -- User cancelled
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Withdrawal status
DO $$ BEGIN
    CREATE TYPE withdrawal_status_enum AS ENUM (
        'pending',      -- Awaiting admin review
        'approved',     -- Admin approved, processing
        'processing',   -- Bank transfer in progress
        'completed',    -- Successfully withdrawn
        'rejected'      -- Admin rejected
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Withdrawal method
DO $$ BEGIN
    CREATE TYPE withdrawal_method_enum AS ENUM (
        'bank_transfer',
        'd17',
        'flouci'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 1. WALLETS TABLE (User Escrow Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    balance DECIMAL(12, 3) DEFAULT 0 CHECK (balance >= 0),        -- Available balance in TND
    pending_balance DECIMAL(12, 3) DEFAULT 0 CHECK (pending_balance >= 0), -- In escrow (awaiting release)
    currency VARCHAR(3) DEFAULT 'TND',
    total_earned DECIMAL(12, 3) DEFAULT 0,      -- Lifetime earnings
    total_withdrawn DECIMAL(12, 3) DEFAULT 0,   -- Lifetime withdrawals
    total_fees_paid DECIMAL(12, 3) DEFAULT 0,   -- Lifetime platform fees
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)  -- One wallet per user
);

-- ============================================
-- 2. TRANSACTIONS TABLE (All Payment Records)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    type transaction_type_enum NOT NULL,
    amount DECIMAL(12, 3) NOT NULL CHECK (amount > 0),
    fee_amount DECIMAL(12, 3) DEFAULT 0,        -- Platform fee for this transaction
    net_amount DECIMAL(12, 3),                  -- Amount after fees
    currency VARCHAR(3) DEFAULT 'TND',
    status transaction_status_enum DEFAULT 'pending',
    payment_method VARCHAR(50),                 -- 'flouci', 'card', 'bank_transfer'
    payment_gateway_id VARCHAR(255),            -- External payment gateway transaction ID
    payment_gateway_response JSONB,             -- Full response from payment gateway
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,         -- Additional data
    error_message TEXT,                         -- Error details if failed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ                    -- When transaction was finalized
);

-- ============================================
-- 3. WITHDRAWALS TABLE (Payout Requests)
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12, 3) NOT NULL CHECK (amount >= 20), -- Minimum 20 TND
    currency VARCHAR(3) DEFAULT 'TND',
    method withdrawal_method_enum NOT NULL,
    status withdrawal_status_enum DEFAULT 'pending',
    -- Bank transfer details
    bank_name VARCHAR(255),
    bank_account_name VARCHAR(255),
    bank_iban VARCHAR(50),
    -- D17/Flouci details
    phone_number VARCHAR(20),
    -- Admin processing
    admin_id UUID REFERENCES profiles(id),
    admin_notes TEXT,
    rejection_reason TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ============================================
-- 4. PAYMENT_METHODS TABLE (Saved Methods)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,                  -- 'card', 'flouci', 'bank'
    is_default BOOLEAN DEFAULT FALSE,
    label VARCHAR(100),                         -- User-friendly label
    -- Card details (tokenized, never store full card)
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    card_expiry VARCHAR(7),                     -- MM/YYYY
    -- Bank details
    bank_name VARCHAR(255),
    bank_iban VARCHAR(50),
    bank_account_name VARCHAR(255),
    -- Flouci/Mobile details
    phone_number VARCHAR(20),
    -- Metadata
    gateway_payment_method_id VARCHAR(255),     -- Token from payment gateway
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_contract_id ON transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_gateway_id ON transactions(payment_gateway_id);

-- Withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet_id ON withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- Payment Methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- WALLETS: Users can only view/manage their own wallet
CREATE POLICY "Users can view own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System creates wallets" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cannot delete wallets" ON wallets
    FOR DELETE USING (false);  -- Wallets can only be deleted by system

-- TRANSACTIONS: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update pending transactions" ON transactions
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND status = 'pending'
    );

-- WITHDRAWALS: Users manage their own withdrawal requests
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel pending withdrawals" ON withdrawals
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND status = 'pending'
    );

-- PAYMENT_METHODS: Users manage their own payment methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-create wallet for new users
-- ============================================
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance, pending_balance, currency)
    VALUES (NEW.id, 0, 0, 'TND')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_profile_created_create_wallet ON profiles;

-- Create trigger
CREATE TRIGGER on_profile_created_create_wallet
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_wallet_for_new_user();

-- ============================================
-- TRIGGER: Update timestamps on modification
-- ============================================
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to wallets
DROP TRIGGER IF EXISTS wallet_updated_at ON wallets;
CREATE TRIGGER wallet_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at();

-- Apply to transactions
DROP TRIGGER IF EXISTS transaction_updated_at ON transactions;
CREATE TRIGGER transaction_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at();

-- Apply to withdrawals
DROP TRIGGER IF EXISTS withdrawal_updated_at ON withdrawals;
CREATE TRIGGER withdrawal_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at();

-- Apply to payment_methods
DROP TRIGGER IF EXISTS payment_method_updated_at ON payment_methods;
CREATE TRIGGER payment_method_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at();

-- ============================================
-- RPC FUNCTION: Update wallet balance atomically
-- ============================================
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_user_id UUID,
    p_amount DECIMAL(12, 3),
    p_type VARCHAR(20)  -- 'add_balance', 'subtract_balance', 'add_pending', 'release_pending'
)
RETURNS JSONB AS $$
DECLARE
    v_wallet wallets%ROWTYPE;
    v_result JSONB;
BEGIN
    -- Lock the wallet row for update
    SELECT * INTO v_wallet 
    FROM wallets 
    WHERE user_id = p_user_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
    END IF;
    
    CASE p_type
        WHEN 'add_balance' THEN
            UPDATE wallets 
            SET balance = balance + p_amount,
                total_earned = total_earned + p_amount
            WHERE user_id = p_user_id;
            
        WHEN 'subtract_balance' THEN
            IF v_wallet.balance < p_amount THEN
                RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
            END IF;
            UPDATE wallets 
            SET balance = balance - p_amount
            WHERE user_id = p_user_id;
            
        WHEN 'add_pending' THEN
            UPDATE wallets 
            SET pending_balance = pending_balance + p_amount
            WHERE user_id = p_user_id;
            
        WHEN 'release_pending' THEN
            IF v_wallet.pending_balance < p_amount THEN
                RETURN jsonb_build_object('success', false, 'error', 'Insufficient pending balance');
            END IF;
            UPDATE wallets 
            SET pending_balance = pending_balance - p_amount,
                balance = balance + p_amount
            WHERE user_id = p_user_id;
            
        WHEN 'subtract_for_withdrawal' THEN
            IF v_wallet.balance < p_amount THEN
                RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
            END IF;
            UPDATE wallets 
            SET balance = balance - p_amount,
                total_withdrawn = total_withdrawn + p_amount
            WHERE user_id = p_user_id;
            
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Invalid operation type');
    END CASE;
    
    -- Return updated wallet
    SELECT jsonb_build_object(
        'success', true,
        'wallet', jsonb_build_object(
            'balance', balance,
            'pending_balance', pending_balance,
            'total_earned', total_earned,
            'total_withdrawn', total_withdrawn
        )
    ) INTO v_result
    FROM wallets 
    WHERE user_id = p_user_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC FUNCTION: Get wallet with transaction summary
-- ============================================
CREATE OR REPLACE FUNCTION get_wallet_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'wallet', jsonb_build_object(
            'id', w.id,
            'balance', w.balance,
            'pending_balance', w.pending_balance,
            'total_earned', w.total_earned,
            'total_withdrawn', w.total_withdrawn,
            'total_fees_paid', w.total_fees_paid,
            'currency', w.currency
        ),
        'recent_transactions', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'type', t.type,
                    'amount', t.amount,
                    'status', t.status,
                    'description', t.description,
                    'created_at', t.created_at
                ) ORDER BY t.created_at DESC
            )
            FROM transactions t 
            WHERE t.user_id = p_user_id 
            LIMIT 10),
            '[]'::jsonb
        ),
        'pending_withdrawals', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', wd.id,
                    'amount', wd.amount,
                    'method', wd.method,
                    'status', wd.status,
                    'created_at', wd.created_at
                )
            )
            FROM withdrawals wd 
            WHERE wd.user_id = p_user_id 
            AND wd.status IN ('pending', 'approved', 'processing')),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM wallets w
    WHERE w.user_id = p_user_id;
    
    RETURN COALESCE(v_result, jsonb_build_object('error', 'Wallet not found'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Add escrow_funded column to contracts if not exists
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'escrow_funded'
    ) THEN
        ALTER TABLE contracts ADD COLUMN escrow_funded BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'escrow_amount'
    ) THEN
        ALTER TABLE contracts ADD COLUMN escrow_amount DECIMAL(12, 3) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'funded_at'
    ) THEN
        ALTER TABLE contracts ADD COLUMN funded_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'released_at'
    ) THEN
        ALTER TABLE contracts ADD COLUMN released_at TIMESTAMPTZ;
    END IF;
END $$;

-- ============================================
-- Create wallets for existing users (one-time migration)
-- ============================================
INSERT INTO wallets (user_id, balance, pending_balance, currency)
SELECT id, 0, 0, 'TND'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- COMMENTS for documentation
-- ============================================
COMMENT ON TABLE wallets IS 'User wallet/escrow accounts for payment management';
COMMENT ON TABLE transactions IS 'All payment transactions including escrow, releases, and withdrawals';
COMMENT ON TABLE withdrawals IS 'Freelancer payout requests awaiting admin approval';
COMMENT ON TABLE payment_methods IS 'Saved payment methods for quick checkout';
COMMENT ON FUNCTION update_wallet_balance IS 'Atomically update wallet balance with proper locking';
COMMENT ON FUNCTION get_wallet_summary IS 'Get wallet details with recent transactions';
