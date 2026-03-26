/**
 * Currency formatting utilities for Khedma.tn
 * Handles TND (Tunisian Dinar) formatting
 */

import type { Language } from '../types';

const numberLocaleByLanguage: Record<Language, string> = {
    ar: 'ar-TN',
    en: 'en-US',
    fr: 'fr-FR',
};

const currencySymbolByLanguage: Record<Language, string> = {
    ar: 'د.ت',
    en: 'TND',
    fr: 'TND',
};

/**
 * Format amount in TND with proper Arabic formatting
 * @param amount - Amount in TND
 * @param showSymbol - Whether to show the currency symbol (default: true)
 * @returns Formatted string like "125.500 د.ت"
 */
export function formatCurrency(amount: number, showSymbol = true, language: Language = 'ar'): string {
    // TND uses 3 decimal places (millimes)
    const formatted = new Intl.NumberFormat(numberLocaleByLanguage[language], {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    }).format(amount);

    return showSymbol ? `${formatted} ${currencySymbolByLanguage[language]}` : formatted;
}

/**
 * Format amount for compact display (no decimals for whole numbers)
 * @param amount - Amount in TND
 * @returns Formatted string like "125 د.ت" or "125.500 د.ت"
 */
export function formatCurrencyCompact(amount: number, language: Language = 'ar'): string {
    const isWholeNumber = amount % 1 === 0;

    const formatted = new Intl.NumberFormat(numberLocaleByLanguage[language], {
        minimumFractionDigits: isWholeNumber ? 0 : 3,
        maximumFractionDigits: 3,
    }).format(amount);

    return `${formatted} ${currencySymbolByLanguage[language]}`;
}

/**
 * Convert TND to millimes (for Flouci API)
 * @param tnd - Amount in TND
 * @returns Amount in millimes (integer)
 */
export function tndToMillimes(tnd: number): number {
    return Math.round(tnd * 1000);
}

/**
 * Convert millimes to TND
 * @param millimes - Amount in millimes
 * @returns Amount in TND
 */
export function millimesToTnd(millimes: number): number {
    return millimes / 1000;
}

/**
 * Calculate platform fee for a given amount
 * @param amount - Original amount in TND
 * @param feePercentage - Fee percentage (default: 0.10 = 10%)
 * @returns Fee amount in TND
 */
export function calculatePlatformFee(amount: number, feePercentage = 0.10): number {
    return Number((amount * feePercentage).toFixed(3));
}

/**
 * Calculate total with platform fee
 * @param amount - Original amount in TND
 * @param feePercentage - Fee percentage (default: 0.10 = 10%)
 * @returns Object with fee and total amounts
 */
export function calculateTotalWithFee(amount: number, feePercentage = 0.10): {
    originalAmount: number;
    feeAmount: number;
    totalAmount: number;
} {
    const feeAmount = calculatePlatformFee(amount, feePercentage);
    return {
        originalAmount: amount,
        feeAmount,
        totalAmount: Number((amount + feeAmount).toFixed(3)),
    };
}

/**
 * Calculate net amount after fee deduction (for freelancer)
 * @param amount - Gross amount in TND
 * @param feePercentage - Fee percentage (default: 0.10 = 10%)
 * @returns Net amount after fee
 */
export function calculateNetAfterFee(amount: number, feePercentage = 0.10): number {
    const fee = calculatePlatformFee(amount, feePercentage);
    return Number((amount - fee).toFixed(3));
}

/**
 * Validate withdrawal amount
 * @param amount - Requested withdrawal amount
 * @param balance - Available wallet balance
 * @param minAmount - Minimum withdrawal (default: 20 TND)
 * @returns Validation result
 */
export function validateWithdrawalAmount(
    amount: number,
    balance: number,
    minAmount = 20
): { valid: boolean; error?: string } {
    if (amount <= 0) {
        return { valid: false, error: 'المبلغ يجب أن يكون أكبر من صفر' };
    }

    if (amount < minAmount) {
        return { valid: false, error: `الحد الأدنى للسحب هو ${minAmount} د.ت` };
    }

    if (amount > balance) {
        return { valid: false, error: 'المبلغ المطلوب أكبر من الرصيد المتاح' };
    }

    return { valid: true };
}

/**
 * Format transaction type for display
 */
export function formatTransactionType(type: string, language: Language = 'ar'): string {
    const typeLabels: Record<Language, Record<string, string>> = {
        ar: {
            deposit: 'إيداع',
            escrow: 'ضمان',
            release: 'تحويل',
            refund: 'استرداد',
            withdrawal: 'سحب',
            fee: 'رسوم',
        },
        en: {
            deposit: 'Deposit',
            escrow: 'Escrow',
            release: 'Release',
            refund: 'Refund',
            withdrawal: 'Withdrawal',
            fee: 'Fee',
        },
        fr: {
            deposit: 'Depot',
            escrow: 'Escrow',
            release: 'Transfert',
            refund: 'Remboursement',
            withdrawal: 'Retrait',
            fee: 'Frais',
        },
    };
    return typeLabels[language][type] || type;
}

/**
 * Format transaction status for display
 */
export function formatTransactionStatus(status: string, language: Language = 'ar'): string {
    const statusLabels: Record<Language, Record<string, string>> = {
        ar: {
            pending: 'قيد الانتظار',
            processing: 'جاري المعالجة',
            completed: 'مكتمل',
            failed: 'فشل',
            refunded: 'تم الاسترداد',
            cancelled: 'ملغي',
        },
        en: {
            pending: 'Pending',
            processing: 'Processing',
            completed: 'Completed',
            failed: 'Failed',
            refunded: 'Refunded',
            cancelled: 'Cancelled',
        },
        fr: {
            pending: 'En attente',
            processing: 'En traitement',
            completed: 'Termine',
            failed: 'Echec',
            refunded: 'Rembourse',
            cancelled: 'Annule',
        },
    };
    return statusLabels[language][status] || status;
}

/**
 * Format withdrawal status for display
 */
export function formatWithdrawalStatus(status: string, language: Language = 'ar'): string {
    const statusLabels: Record<Language, Record<string, string>> = {
        ar: {
            pending: 'قيد المراجعة',
            approved: 'تمت الموافقة',
            processing: 'جاري التحويل',
            completed: 'مكتمل',
            rejected: 'مرفوض',
        },
        en: {
            pending: 'Under review',
            approved: 'Approved',
            processing: 'Processing',
            completed: 'Completed',
            rejected: 'Rejected',
        },
        fr: {
            pending: 'En revision',
            approved: 'Approuve',
            processing: 'En traitement',
            completed: 'Termine',
            rejected: 'Rejete',
        },
    };
    return statusLabels[language][status] || status;
}

/**
 * Format withdrawal method for display
 */
export function formatWithdrawalMethod(method: string, language: Language = 'ar'): string {
    const methodLabels: Record<Language, Record<string, string>> = {
        ar: {
            bank_transfer: 'تحويل بنكي',
            d17: 'D17',
            flouci: 'Flouci',
        },
        en: {
            bank_transfer: 'Bank transfer',
            d17: 'D17',
            flouci: 'Flouci',
        },
        fr: {
            bank_transfer: 'Virement bancaire',
            d17: 'D17',
            flouci: 'Flouci',
        },
    };
    return methodLabels[language][method] || method;
}

/**
 * Get status color class for transactions/withdrawals
 */
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
        processing: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
        completed: 'text-green-600 bg-green-100 dark:bg-green-900/30',
        failed: 'text-red-600 bg-red-100 dark:bg-red-900/30',
        refunded: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
        cancelled: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
        approved: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
        rejected: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
}
