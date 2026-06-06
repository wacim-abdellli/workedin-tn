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

            // ── Sandbox mode: skip Dhmad entirely, call RPC directly ──────────
            // Enabled by setting VITE_SANDBOX_MODE=true in your deployment env vars.
            // The RPC enforces auth + contract ownership server-side, so this is safe.
            if (import.meta.env.VITE_SANDBOX_MODE === 'true') {
                logger.info('[FundEscrow][SANDBOX] Funding escrow via sandbox_fund_escrow RPC');
                const { error: rpcError } = await supabase.rpc('sandbox_fund_escrow', {
                    p_contract_id: contract.id,
                });
                if (rpcError) throw rpcError;
                showToast(tx('payment.escrowFunded', undefined, 'Escrow funded successfully'), 'success');
                onSuccess?.();
                return;
            }

            // ── Production: Dhmad payment gateway ────────────────────────────
            const escrowResponse = await createEscrow({
                amount: totalAmount,
                buyer_id: user.id,
                seller_id: contract.freelancer_id,
                contract_id: contract.id,
                description: `Escrow for contract ${contract.id}`,
            });

            logger.log('[FundEscrow] Dhmad escrow created:', escrowResponse.escrow_id);
            showToast(tx('payment.redirectingToPayment', undefined, 'Redirecting to secure payment...'), 'success');

            if (escrowResponse.payment_url) {
                window.location.href = escrowResponse.payment_url;
            } else {
                window.location.href = `${window.location.origin}/payment/success?contract_id=${contract.id}`;
            }

            onSuccess?.();

        } catch (error) {
            logger.error('[FundEscrow] Error:', error);
            const message = error instanceof Error
                ? error.message
                : tx('payment.startFailed', undefined, 'Failed to start payment. Please try again.');
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
        <div className="bg-[#0d0d12]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-base">{tx('payment.fundEscrowTitle', undefined, 'Fund escrow')}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{tx('payment.fundEscrowSubtitle', undefined, 'Funds are protected until the work is completed')}</p>
                </div>
            </div>

            <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200 leading-relaxed">
                        {tx('payment.fundEscrowHint', undefined, 'You need to fund escrow before the freelancer starts. Funds remain protected until you approve the delivery.')}
                    </p>
                </div>
            </div>

            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors mb-3"
                >
                    {showBreakdown ? tx('common.hide', undefined, 'Hide details') : tx('common.show', undefined, 'Show details')}
                </button>

                {showBreakdown && (
                    <div className="space-y-2.5 p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl text-sm text-zinc-300">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">{tx('payment.projectBudget', undefined, 'Project budget')}</span>
                            <span className="font-semibold text-white">{formatCurrency(originalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">{tx('payment.platformFee', undefined, 'Platform fee')} (10%)</span>
                            <span className="font-semibold text-white">{formatCurrency(feeAmount)}</span>
                        </div>
                        <div className="h-px bg-white/[0.06] my-2" />
                        <div className="flex justify-between font-bold">
                            <span className="text-white">{tx('payment.total', undefined, 'Total')}</span>
                            <span className="text-amber-400">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                )}

                {!showBreakdown && (
                    <div className="text-2xl font-black text-amber-400 tracking-tight">
                        {formatCurrency(totalAmount)}
                    </div>
                )}
            </div>

            <button
                onClick={handleFundEscrow}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black shadow-lg shadow-amber-500/10 transition-all duration-200 hover:bg-amber-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <p className="text-center text-[11px] text-zinc-500 mt-4 leading-normal">
                {tx('payment.dhmadDescription', undefined, 'Payments are securely held in escrow by Dhmad.tn')}</p>
        </div>
    );
};

export default FundEscrow;
