/**
 * Payment-related TypeScript types for Khedma.tn
 * Phase 1: Payment Gateway Integration
 */

// ============================================
// ENUMS
// ============================================

export type TransactionType =
    | 'deposit'      // Client adds funds
    | 'escrow'       // Funds held for contract
    | 'release'      // Payment released to freelancer
    | 'refund'       // Refund to client
    | 'withdrawal'   // Freelancer withdraws to bank
    | 'fee';         // Platform fee deduction

export type TransactionStatus =
    | 'pending'      // Awaiting payment
    | 'processing'   // Payment being processed
    | 'completed'    // Successfully completed
    | 'failed'       // Payment failed
    | 'refunded'     // Transaction refunded
    | 'cancelled';   // User cancelled

export type WithdrawalStatus =
    | 'pending'      // Awaiting admin review
    | 'approved'     // Admin approved, processing
    | 'processing'   // Bank transfer in progress
    | 'completed'    // Successfully withdrawn
    | 'rejected';    // Admin rejected

export type WithdrawalMethod =
    | 'bank_transfer'
    | 'd17'
    | 'flouci';

export type PaymentMethodType =
    | 'card'
    | 'flouci'
    | 'bank';

// ============================================
// INTERFACES
// ============================================

/**
 * User wallet/escrow account
 */
export interface Wallet {
    id: string;
    user_id: string;
    balance: number;            // Available balance in TND
    pending_balance: number;    // In escrow (awaiting release)
    currency: string;           // Usually 'TND'
    total_earned: number;       // Lifetime earnings
    total_withdrawn: number;    // Lifetime withdrawals
    total_fees_paid: number;    // Lifetime platform fees
    created_at: string;
    updated_at: string;
}

/**
 * Payment transaction record
 */
export interface Transaction {
    id: string;
    user_id: string;
    contract_id?: string;
    wallet_id?: string;
    type: TransactionType;
    amount: number;
    fee_amount: number;
    net_amount?: number;        // Amount after fees
    currency: string;
    status: TransactionStatus;
    payment_method?: string;
    payment_gateway_id?: string;
    payment_gateway_response?: Record<string, unknown>;
    description?: string;
    metadata?: Record<string, unknown>;
    error_message?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

/**
 * Freelancer withdrawal request
 */
export interface Withdrawal {
    id: string;
    user_id: string;
    wallet_id?: string;
    amount: number;
    currency: string;
    method: WithdrawalMethod;
    status: WithdrawalStatus;
    // Bank transfer details
    bank_name?: string;
    bank_account_name?: string;
    bank_iban?: string;
    // D17/Flouci details
    phone_number?: string;
    // Admin processing
    admin_id?: string;
    admin_notes?: string;
    rejection_reason?: string;
    // Timestamps
    created_at: string;
    updated_at: string;
    processed_at?: string;
    completed_at?: string;
}

/**
 * Saved payment method
 */
export interface PaymentMethod {
    id: string;
    user_id: string;
    type: PaymentMethodType;
    is_default: boolean;
    label?: string;
    // Card details
    card_last_four?: string;
    card_brand?: string;
    card_expiry?: string;
    // Bank details
    bank_name?: string;
    bank_iban?: string;
    bank_account_name?: string;
    // Mobile details
    phone_number?: string;
    gateway_payment_method_id?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Wallet balance update response from RPC
 */
export interface WalletUpdateResult {
    success: boolean;
    error?: string;
    wallet?: {
        balance: number;
        pending_balance: number;
        total_earned: number;
        total_withdrawn: number;
    };
}

/**
 * Wallet summary with recent transactions
 */
export interface WalletSummary {
    wallet: Wallet;
    recent_transactions: Transaction[];
    pending_withdrawals: Withdrawal[];
}

// ============================================
// FLOUCI PAYMENT TYPES
// ============================================

/**
 * Flouci payment initiation request
 */
export interface FlouciPaymentRequest {
    amount: number;             // Amount in millimes (1 TND = 1000 millimes)
    success_link: string;       // Redirect URL on success
    fail_link: string;          // Redirect URL on failure
    session_timeout_secs?: number;
    developer_tracking_id?: string;
}

/**
 * Flouci payment initiation response
 */
export interface FlouciPaymentResponse {
    payment_id: string;
    link: string;               // Redirect URL for payment
}

/**
 * Flouci payment verification response
 */
export interface FlouciVerificationResponse {
    status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';
    payment_id: string;
    amount: number;
    developer_tracking_id?: string;
    created_at: string;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface FundEscrowProps {
    contract: {
        id: string;
        client_id: string;
        freelancer_id: string;
        budget: number;
        escrow_funded?: boolean;
    };
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export interface WalletCardProps {
    className?: string;
    showWithdrawal?: boolean;
}

export interface WithdrawalFormProps {
    wallet: Wallet;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

export const PLATFORM_FEE_PERCENTAGE = 0.10;  // 10%
export const MIN_WITHDRAWAL_AMOUNT = 20;       // 20 TND minimum
export const TND_TO_MILLIMES = 1000;           // 1 TND = 1000 millimes
