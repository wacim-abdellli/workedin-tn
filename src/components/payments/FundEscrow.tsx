import { logger } from '@/lib/logger';
import { useState } from 'react';
import { Loader2, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { createEscrow } from '@/services/dhmad';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { formatCurrency, calculateTotalWithFee } from '../../lib/currencyUtils';
import { PLATFORM_FEE_PERCENTAGE } from '../../types/payment';
import type { FundEscrowProps } from '../../types/payment';
import { useTranslation } from "../../i18n";

/**
 * FundEscrow Component
 * Allows clients to fund escrow for a contract via Flouci payment
 */
const FundEscrow = ({ contract, onSuccess, onError }: FundEscrowProps) => {
    const { tx } = useTranslation();
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
                throw new Error(tx('auth.loginRequired', undefined, 'You must be signed in'));
            }

            // Initiate Dhmad escrow creation
            const escrowResponse = await createEscrow({
                amount: totalAmount, // Dhmad uses TND directly
                buyer_id: user.id,
                seller_id: contract.freelancer_id,
                contract_id: contract.id,
                description: `Escrow for contract ${contract.id}`,
            });

            logger.log('[FundEscrow] Dhmad escrow created:', escrowResponse.escrow_id);

            showToast(tx('payment.redirectingToPayment', undefined, 'Redirecting to secure payment...'), 'success');

            if (escrowResponse.payment_url) {
                // Redirect to Dhmad payment page
                window.location.href = escrowResponse.payment_url;
            } else {
                // DEV fallback if payment_url is missing
                const baseUrl = window.location.origin;
                window.location.href = `${baseUrl}/payment/success?contract_id=${contract.id}`;
            }

            onSuccess?.();
        } catch (error) {
            logger.error('[FundEscrow] Error:', error);
            const message = error instanceof Error ? error.message : tx('payment.startFailed', undefined, 'Failed to start payment');
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
                        {tx('payment.escrowFunded', undefined, 'Escrow funded successfully')}
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
                    <h3 className="font-bold text-foreground dark:text-white">{tx('payment.fundEscrowTitle', undefined, 'Fund escrow')}</h3>
                    <p className="text-sm text-muted">{tx('payment.fundEscrowSubtitle', undefined, 'Funds are protected until the work is completed')}</p>
                </div>
            </div>

            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        {tx('payment.fundEscrowHint', undefined, 'You need to fund escrow before the freelancer starts. Funds remain protected until you approve the delivery.')}
                    </p>
                </div>
            </div>

            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-sm text-primary-600 hover:text-primary-700 mb-2"
                >
                    {showBreakdown ? tx('common.hide', undefined, 'Hide details') : tx('common.show', undefined, 'Show details')}
                </button>

                {showBreakdown && (
                    <div className="space-y-2 p-3 bg-surface rounded-lg text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{tx('payment.projectBudget', undefined, 'Project budget')}</span>
                            <span className="font-medium">{formatCurrency(originalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{tx('payment.platformFee', undefined, 'Platform fee')} (10%)</span>
                            <span className="font-medium">{formatCurrency(feeAmount)}</span>
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between font-bold">
                            <span>{tx('payment.total', undefined, 'Total')}</span>
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
                        <span>{tx('common.loading', undefined, 'Loading...')}</span>
                    </>
                ) : (
                    <>
                        <Shield className="w-5 h-5" />
                        <span>{tx('payment.fundEscrowAction', undefined, 'Fund escrow now')}</span>
                    </>
                )}
            </button>

            <p className="text-center text-xs text-muted mt-4">
                {tx('payment.dhmadDescription', undefined, 'Payments are securely held in escrow by Dhmad.tn')}</p>
        </div>
    );
};

export default FundEscrow;
