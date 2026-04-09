import { logger } from '@/lib/logger';
import { useState } from 'react';
import { Loader2, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { initiatePayment } from '../../lib/flouci';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { formatCurrency, calculateTotalWithFee, tndToMillimes } from '../../lib/currencyUtils';
import { PLATFORM_FEE_PERCENTAGE } from '../../types/payment';
import type { FundEscrowProps } from '../../types/payment';

/**
 * FundEscrow Component
 * Allows clients to fund escrow for a contract via Flouci payment
 */
const FundEscrow = ({ contract, onSuccess, onError }: FundEscrowProps) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Calculate fees
    const { originalAmount, feeAmount, totalAmount } = calculateTotalWithFee(
        contract.budget,
        PLATFORM_FEE_PERCENTAGE
    );

    const handleFundEscrow = async () => {
        setLoading(true);
        logger.log('[FundEscrow] Starting escrow funding for contract:', contract.id);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Ã™Å Ã˜Â¬Ã˜Â¨ Ã˜ÂªÃ˜Â³Ã˜Â¬Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¯Ã˜Â®Ã™Ë†Ã™â€ž Ã˜Â£Ã™Ë†Ã™â€žÃ˜Â§Ã™â€¹');
            }

            // Convert to millimes for Flouci
            const amountInMillimes = tndToMillimes(totalAmount);

            // Build redirect URLs
            const baseUrl = window.location.origin;
            const successUrl = `${baseUrl}/payment/success?contract_id=${contract.id}`;
            const failUrl = `${baseUrl}/payment/failed?contract_id=${contract.id}`;

            // Initiate Flouci payment and create the pending transaction server-side.
            const payment = await initiatePayment({
                amount: amountInMillimes,
                success_link: successUrl,
                fail_link: failUrl,
                session_timeout_secs: 1200,
                developer_tracking_id: `contract_${contract.id}_${Date.now()}`,
                contract_id: contract.id,
                transaction_amount: totalAmount,
            });

            logger.log('[FundEscrow] Payment initiated:', payment.payment_id);

            showToast('Ã˜Â¬Ã˜Â§Ã˜Â±Ã™Å  Ã˜ÂªÃ˜Â­Ã™Ë†Ã™Å Ã™â€žÃ™Æ’ Ã™â€žÃ˜ÂµÃ™ÂÃ˜Â­Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â¯Ã™ÂÃ˜Â¹...', 'success');

            // Redirect to Flouci payment page
            window.location.href = payment.link;

            onSuccess?.();
        } catch (error) {
            logger.error('[FundEscrow] Error:', error);
            const message = error instanceof Error ? error.message : 'Ã™ÂÃ˜Â´Ã™â€ž Ã™ÂÃ™Å  Ã˜Â¨Ã˜Â¯Ã˜Â¡ Ã˜Â¹Ã™â€¦Ã™â€žÃ™Å Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â¯Ã™ÂÃ˜Â¹';
            showToast(message, 'error');
            onError?.(message);
        } finally {
            setLoading(false);
        }
    };

    if (contract.escrow_funded) {
        return (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                        Ã˜ÂªÃ™â€¦ Ã˜ÂªÃ™â€¦Ã™Ë†Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¶Ã™â€¦Ã˜Â§Ã™â€  Ã˜Â¨Ã™â€ Ã˜Â¬Ã˜Â§Ã˜Â­
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground dark:text-white">Ã˜ÂªÃ™â€¦Ã™Ë†Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¶Ã™â€¦Ã˜Â§Ã™â€ </h3>
                    <p className="text-sm text-muted">Ã˜Â£Ã™â€¦Ã™Ë†Ã˜Â§Ã™â€žÃ™Æ’ Ã™â€¦Ã˜Â­Ã™ÂÃ™Ë†Ã˜Â¸Ã˜Â© Ã˜Â­Ã˜ÂªÃ™â€° Ã˜Â§Ã™Æ’Ã˜ÂªÃ™â€¦Ã˜Â§Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¹Ã™â€¦Ã™â€ž</p>
                </div>
            </div>

            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Ã™Å Ã˜Â¬Ã˜Â¨ Ã˜ÂªÃ™â€¦Ã™Ë†Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¶Ã™â€¦Ã˜Â§Ã™â€  Ã™â€šÃ˜Â¨Ã™â€ž Ã˜Â£Ã™â€  Ã™Å Ã˜Â¨Ã˜Â¯Ã˜Â£ Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â³Ã˜ÂªÃ™â€šÃ™â€ž Ã˜Â¨Ã˜Â§Ã™â€žÃ˜Â¹Ã™â€¦Ã™â€ž. Ã˜Â§Ã™â€žÃ˜Â£Ã™â€¦Ã™Ë†Ã˜Â§Ã™â€ž Ã™â€¦Ã˜Â­Ã™â€¦Ã™Å Ã˜Â© Ã˜Â­Ã˜ÂªÃ™â€° Ã˜ÂªÃ™Ë†Ã˜Â§Ã™ÂÃ™â€š Ã˜Â¹Ã™â€žÃ™â€° Ã˜ÂªÃ˜Â³Ã™â€žÃ™Å Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â¹Ã™â€¦Ã™â€ž.
                    </p>
                </div>
            </div>

            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-sm text-primary-600 hover:text-primary-700 mb-2"
                >
                    {showBreakdown ? 'Ã˜Â¥Ã˜Â®Ã™ÂÃ˜Â§Ã˜Â¡ Ã˜Â§Ã™â€žÃ˜ÂªÃ™ÂÃ˜Â§Ã˜ÂµÃ™Å Ã™â€ž' : 'Ã˜Â¹Ã˜Â±Ã˜Â¶ Ã˜Â§Ã™â€žÃ˜ÂªÃ™ÂÃ˜Â§Ã˜ÂµÃ™Å Ã™â€ž'}
                </button>

                {showBreakdown && (
                    <div className="space-y-2 p-3 bg-surface rounded-lg text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Ã™â€¦Ã™Å Ã˜Â²Ã˜Â§Ã™â€ Ã™Å Ã˜Â© Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â´Ã˜Â±Ã™Ë†Ã˜Â¹</span>
                            <span className="font-medium">{formatCurrency(originalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Ã˜Â±Ã˜Â³Ã™Ë†Ã™â€¦ Ã˜Â§Ã™â€žÃ™â€¦Ã™â€ Ã˜ÂµÃ˜Â© (10%)</span>
                            <span className="font-medium">{formatCurrency(feeAmount)}</span>
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between font-bold">
                            <span>Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â¬Ã™â€¦Ã™Ë†Ã˜Â¹</span>
                            <span className="text-primary-600">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                )}

                {!showBreakdown && (
                    <div className="text-2xl font-bold text-primary-600">
                        {formatCurrency(totalAmount)}
                    </div>
                )}
            </div>

            <button
                onClick={handleFundEscrow}
                disabled={loading}
                className="w-full btn-primary btn-lg justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Ã˜Â¬Ã˜Â§Ã˜Â±Ã™Å  Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â¹Ã˜Â§Ã™â€žÃ˜Â¬Ã˜Â©...</span>
                    </>
                ) : (
                    <>
                        <Shield className="w-5 h-5" />
                        <span>Ã˜ÂªÃ™â€¦Ã™Ë†Ã™Å Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â¶Ã™â€¦Ã˜Â§Ã™â€  Ã˜Â§Ã™â€žÃ˜Â¢Ã™â€ </span>
                    </>
                )}
            </button>

            <p className="text-center text-xs text-muted mt-4">
                Ã˜Â§Ã™â€žÃ˜Â¯Ã™ÂÃ˜Â¹ Ã˜Â¹Ã˜Â¨Ã˜Â± Flouci - Ã˜Â¨Ã˜Â·Ã˜Â§Ã™â€šÃ˜Â§Ã˜Âª Ã˜Â¨Ã™â€ Ã™Æ’Ã™Å Ã˜Â© Ã™Ë†Ã™â€¦Ã˜Â­Ã˜Â§Ã™ÂÃ˜Â¸ Ã˜Â¥Ã™â€žÃ™Æ’Ã˜ÂªÃ˜Â±Ã™Ë†Ã™â€ Ã™Å Ã˜Â©
            </p>
        </div>
    );
};

export default FundEscrow;
