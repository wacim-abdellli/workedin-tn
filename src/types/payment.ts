/**
 * Payment-related TypeScript types for Khedma.tn
 * Phase 1: Payment Gateway Integration
 */

// ============================================
// ENUMS
// ============================================

export type TransactionType =
    | 'deposit'          // Wallet deposit / top-up
    | 'escrow_fund'      // Client funds escrow for a contract
    | 'escrow_release'   // Escrow released after completion
    | 'withdrawal'       // Freelancer withdraws to bank/mobile wallet
    | 'refund'           // Refund to client
    | 'platform_fee'     // Platform fee deduction
    | 'escrow'           // Legacy alias for escrow_fund
    | 'release'          // Legacy alias for escrow_release
    | 'earning'          // Legacy earning entry
    | 'fee'              // Legacy alias for platform_fee
    | 'payment';         // Legacy generic payment entry

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
    | 'bank'
    | 'bank_transfer'
    | 'd17';

export type PaymentDetails = string | Record<string, string>;

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
    contract_id?: string | null;
    wallet_id?: string | null;
    type: TransactionType;
    amount: number;
    fee_amount?: number | null;
    net_amount?: number | null; // Amount after fees
    currency: string;
    status: TransactionStatus;
    payment_method?: string | null;
    payment_gateway_id?: string | null;
    payment_gateway_response?: Record<string, unknown> | null;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
    error_message?: string | null;
    reference_id?: string | null;
    created_at: string;
    updated_at: string;
    completed_at?: string | null;
}

/**
 * Freelancer withdrawal request
 */
export interface Withdrawal {
    id: string;
    user_id: string;
    wallet_id?: string | null;
    amount: number;
    currency?: string | null;
    method: WithdrawalMethod;
    status: WithdrawalStatus;
    fee?: number | null;
    net_amount?: number | null;
    // Bank transfer details
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_iban?: string | null;
    iban?: string | null;
    // D17/Flouci details
    phone_number?: string | null;
    d17_phone?: string | null;
    // Admin processing
    admin_id?: string | null;
    admin_notes?: string | null;
    rejection_reason?: string | null;
    // Timestamps
    created_at: string;
    updated_at: string;
    processed_at?: string | null;
    completed_at?: string | null;
}

/**
 * Saved payment method
 */
export interface PaymentMethod {
    id: string;
    user_id: string;
    type: PaymentMethodType;
    is_default: boolean;
    label?: string | null;
    details?: PaymentDetails | null; // Legacy UI convenience field, not a persisted DB column
    // Card details
    card_last_four?: string | null;
    card_brand?: string | null;
    card_expiry?: string | null;
    // Bank details
    bank_name?: string | null;
    iban?: string | null;
    bank_iban?: string | null;
    bank_account_name?: string | null;
    // Mobile details
    d17_phone?: string | null;
    phone_number?: string | null;
    gateway_payment_method_id?: string | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface EarningsTransactionSummary {
    amount: number;
    type: TransactionType;
    created_at: string;
}

export interface TransactionsPage {
    data: Transaction[];
    count: number;
}

export interface WalletEarningsStats {
    wallet: Wallet | null;
    totalEarnings: number;
    transactionCount: number;
}

export interface WithdrawalRequestInput {
    user_id: string;
    amount: number;
    method: WithdrawalMethod | 'bank';
    details: Record<string, string>;
}

export interface CreateWithdrawalRequest {
    user_id: string;
    wallet_id: string;
    amount: number;
    method: WithdrawalMethod;
    status: WithdrawalStatus;
    bank_name?: string | null;
    bank_account_name?: string | null;
    iban?: string | null;
    d17_phone?: string | null;
}

export interface AddPaymentMethodInput {
    type: PaymentMethodType;
    details: PaymentDetails;
    is_default?: boolean;
}

export interface StuckTransaction {
    id: string;
    user_id: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    contract_id: string | null;
    reference_id?: string | null;
    created_at: string;
    user_name: string | null;
    email: string | null;
}

export interface ReconcilePaymentResult {
    success: boolean;
    message: string;
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
    contract_id?: string;
    transaction_amount?: number;
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

export interface FlouciPaymentCompletion {
    success: boolean;
    data?: unknown;
    error?: string;
}

export interface FlouciPaymentHookResponse extends FlouciVerificationResponse {
    completion?: FlouciPaymentCompletion;
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
