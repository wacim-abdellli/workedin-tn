/**
 * Currency formatting utilities for Khedma.tn
 * Handles TND (Tunisian Dinar) formatting
 */

/**
 * Format amount in TND with proper Arabic formatting
 * @param amount - Amount in TND
 * @param showSymbol - Whether to show the currency symbol (default: true)
 * @returns Formatted string like "125.500 د.ت"
 */
export function formatCurrency(amount: number, showSymbol = true): string {
    // TND uses 3 decimal places (millimes)
    const formatted = new Intl.NumberFormat('ar-TN', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    }).format(amount);

    return showSymbol ? `${formatted} د.ت` : formatted;
}

/**
 * Format amount for compact display (no decimals for whole numbers)
 * @param amount - Amount in TND
 * @returns Formatted string like "125 د.ت" or "125.500 د.ت"
 */
export function formatCurrencyCompact(amount: number): string {
    const isWholeNumber = amount % 1 === 0;

    const formatted = new Intl.NumberFormat('ar-TN', {
        minimumFractionDigits: isWholeNumber ? 0 : 3,
        maximumFractionDigits: 3,
    }).format(amount);

    return `${formatted} د.ت`;
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
export function formatTransactionType(type: string): string {
    const typeLabels: Record<string, string> = {
        deposit: 'إيداع',
        escrow: 'ضمان',
        release: 'تحويل',
        refund: 'استرداد',
        withdrawal: 'سحب',
        fee: 'رسوم',
    };
    return typeLabels[type] || type;
}

/**
 * Format transaction status for display
 */
export function formatTransactionStatus(status: string): string {
    const statusLabels: Record<string, string> = {
        pending: 'قيد الانتظار',
        processing: 'جاري المعالجة',
        completed: 'مكتمل',
        failed: 'فشل',
        refunded: 'تم الاسترداد',
        cancelled: 'ملغي',
    };
    return statusLabels[status] || status;
}

/**
 * Format withdrawal status for display
 */
export function formatWithdrawalStatus(status: string): string {
    const statusLabels: Record<string, string> = {
        pending: 'قيد المراجعة',
        approved: 'تمت الموافقة',
        processing: 'جاري التحويل',
        completed: 'مكتمل',
        rejected: 'مرفوض',
    };
    return statusLabels[status] || status;
}

/**
 * Format withdrawal method for display
 */
export function formatWithdrawalMethod(method: string): string {
    const methodLabels: Record<string, string> = {
        bank_transfer: 'تحويل بنكي',
        d17: 'D17',
        flouci: 'Flouci',
    };
    return methodLabels[method] || method;
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
