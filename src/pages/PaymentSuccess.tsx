import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { formatCurrency } from '../lib/currencyUtils';

type VerificationStatus = 'verifying' | 'success' | 'failed';

const PaymentSuccess = () => {
    const { dir, tx } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState<VerificationStatus>('verifying');
    const [error, setError] = useState<string | null>(null);
    const [contractId, setContractId] = useState<string | null>(null);
    const [amount, setAmount] = useState<number>(0);

    useEffect(() => {
        const contract_id = searchParams.get('contract_id');
        const payment_id = searchParams.get('payment_id');
        // Sandbox mode: enabled when redirected from edge function with sandbox=true param
        // This is safe because the actual DB write goes through a Supabase RPC that enforces ownership
        const isSandbox = searchParams.get('sandbox') === 'true';
        // Legacy DEV-only mock path (kept for local dev convenience)
        const isMockSuccess = import.meta.env.DEV && searchParams.get('mock_success') === 'true';
        const mockAmount = parseFloat(searchParams.get('amount') || '0') || 100;

        setContractId(contract_id);

        if (!contract_id && !payment_id) {
            logger.error('[PaymentSuccess] No contract_id or payment_id in URL');
            setStatus('failed');
            setError(tx('payment.successDetails.missingInfo', undefined, 'Missing payment identifier'));
            return;
        }

        // --- Flow A: Wallet Deposit ---
        if (payment_id && !contract_id) {
            if (isMockSuccess && mockAmount > 0) {
                // Perform local wallet mock balance update (DEV mode)
                const updateMockWallet = async () => {
                    if (import.meta.env.DEV) {
                        try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) throw new Error('Not authenticated');

                            // Get current user wallet
                            const { data: wallet, error: walletError } = await supabase
                                .from('wallets')
                                .select('id, balance')
                                .eq('user_id', user.id)
                                .single();

                            if (walletError || !wallet) throw new Error('Wallet not found');

                            // DEV ONLY: Direct wallet write. In production, wallet updates happen via
                            // server-side RPCs triggered by verified payment webhooks only.
                            const { error: updateError } = await supabase
                                .from('wallets')
                                .update({ balance: wallet.balance + mockAmount })
                                .eq('id', wallet.id);

                            if (updateError) throw updateError;

                            // Insert transaction history record
                            await supabase.from('transactions').insert({
                                user_id: user.id,
                                amount: mockAmount,
                                type: 'deposit',
                                status: 'completed',
                                description: `Wallet Deposit (Mock Payment)`,
                            });

                            setAmount(mockAmount);
                            setStatus('success');
                            setTimeout(() => {
                                navigate('/wallet');
                            }, 4000);
                        } catch (err) {
                            logger.error('[PaymentSuccess] Mock wallet update failed:', err);
                            setStatus('failed');
                            setError(tx('wallet.mockDepositFailed', undefined, 'Failed to credit mock wallet deposit'));
                        }
                    }
                };

                void updateMockWallet();
                return;
            } else {
                // In production, poll transactions table for completed deposit
                let pollCount = 0;
                const maxPolls = 15; // 30 seconds max (2s interval)

                const pollWalletTransaction = async () => {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) throw new Error('Not authenticated');

                        // Poll transactions table for completed deposit
                        const { data: txs, error: txError } = await supabase
                            .from('transactions')
                            .select('amount, status')
                            .eq('user_id', user.id)
                            .eq('type', 'deposit')
                            .eq('status', 'completed')
                            .order('created_at', { ascending: false })
                            .limit(1);

                        if (txError) throw txError;

                        if (txs && txs.length > 0) {
                            setAmount(txs[0].amount || 0);
                            setStatus('success');
                            setTimeout(() => {
                                navigate('/wallet');
                            }, 4000);
                            return true; // Stop polling
                        }
                        return false;
                    } catch (err) {
                        logger.error('[PaymentSuccess] Wallet poll error:', err);
                        return false;
                    }
                };

                pollWalletTransaction().then(success => {
                    if (!success) {
                        const interval = setInterval(async () => {
                            pollCount++;
                            const isSuccess = await pollWalletTransaction();
                            if (isSuccess) {
                                clearInterval(interval);
                            } else if (pollCount >= maxPolls) {
                                clearInterval(interval);
                                setStatus('failed');
                                setError(tx('payment.successDetails.timeout', undefined, 'Timeout waiting for deposit verification. Please check your wallet dashboard.'));
                            }
                        }, 2000);
                        return () => clearInterval(interval);
                    }
                });
                return;
            }
        }

        // --- Flow B: Contract Escrow Payment ---
        if (contract_id) {
            if (isMockSuccess) {
                // Mock update contract escrow_funded = true directly in DEV mode
                const fundMockContract = async () => {
                    if (import.meta.env.DEV) {
                        try {
                            const { data: contract, error: fetchError } = await supabase
                                .from('contracts')
                                .select('id, amount')
                                .eq('id', contract_id)
                                .single();

                            if (fetchError || !contract) throw new Error('Contract not found');

                            const { error: updateError } = await supabase
                                .from('contracts')
                                .update({ escrow_funded: true })
                                .eq('id', contract_id);

                            if (updateError) throw updateError;

                            setAmount(contract.amount || 0);
                            setStatus('success');
                            setTimeout(() => {
                                navigate(`/contracts/${contract_id}`);
                            }, 4000);
                        } catch (err) {
                            logger.error('[PaymentSuccess] Mock contract funding failed:', err);
                            setStatus('failed');
                            setError('Mock contract funding failed');
                        }
                    }
                };

                void fundMockContract();
                return;
            } else if (isSandbox) {
                // Sandbox mode: edge function sent us back here with sandbox=true
                // Call an RPC that verifies ownership and marks escrow_funded = true
                const fundSandboxContract = async () => {
                    try {
                        logger.log('[PaymentSuccess] Sandbox: funding escrow via RPC for contract:', contract_id);
                        const { data, error: rpcError } = await supabase.rpc(
                            'sandbox_fund_escrow',
                            { p_contract_id: contract_id },
                        );

                        if (rpcError) throw rpcError;

                        const funded = data as { amount: number } | null;
                        setAmount(funded?.amount ?? 0);
                        setStatus('success');
                        setTimeout(() => {
                            navigate(`/workspace/${contract_id}`);
                        }, 3000);
                    } catch (err) {
                        logger.error('[PaymentSuccess] Sandbox funding failed:', err);
                        setStatus('failed');
                        setError(
                            err instanceof Error
                                ? err.message
                                : tx('payment.successDetails.verificationError', undefined, 'Payment verification failed. Please contact support.')
                        );
                    }
                };

                void fundSandboxContract();
                return;
            } else {
                let pollCount = 0;
                const maxPolls = 15; // 30 seconds max (2s interval)

                const pollContract = async () => {
                    try {
                        const { data: contract, error: fetchError } = await supabase
                            .from('contracts')
                            .select('id, amount, escrow_funded')
                            .eq('id', contract_id)
                            .single();

                        if (fetchError || !contract) {
                            throw new Error('لم يتم العثور على العقد');
                        }

                        if (contract.escrow_funded) {
                            logger.log('[PaymentSuccess] Escrow funded confirmed by webhook');
                            setAmount(contract.amount || 0);
                            setStatus('success');
                            setTimeout(() => {
                                navigate(`/contracts/${contract_id}`);
                            }, 4000);
                            return true; // Stop polling
                        }
                        
                        return false; // Keep polling
                    } catch (err) {
                        logger.error('[PaymentSuccess] Polling error:', err);
                        return false;
                    }
                };

                // Initial check
                pollContract().then(success => {
                    if (!success) {
                        // Start polling interval
                        const interval = setInterval(async () => {
                            pollCount++;
                            const isSuccess = await pollContract();
                            
                            if (isSuccess) {
                                clearInterval(interval);
                            } else if (pollCount >= maxPolls) {
                                clearInterval(interval);
                                setStatus('failed');
                                setError(tx('payment.successDetails.timeout', undefined, 'Timeout waiting for payment verification. Please check your dashboard.'));
                            }
                        }, 2000);

                        return () => clearInterval(interval);
                    }
                });
            }
        }
    }, [searchParams, navigate, tx]);

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900/20 flex items-center justify-center p-4"
            dir={dir}
        >
            <div className="max-w-md w-full">
                {/* Verifying State */}
                {status === 'verifying' && (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-bg-elevated)]/60 backdrop-blur-md p-8 text-center shadow-xl">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="w-16 h-16 bg-[color:var(--workspace-primary-dim)] border border-[color:var(--workspace-primary)]/20 rounded-[18px] flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Loader2 className="w-6 h-6 animate-spin text-[color:var(--workspace-primary)]" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">
                            {tx('dynamic_key_374761519')}</h2>
                        <p className="text-muted-foreground text-sm">
                            {tx('dynamic_key_1821001923')}</p>
                    </div>
                )}

                {/* Success State */}
                {status === 'success' && (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-bg-elevated)]/60 backdrop-blur-md p-8 text-center shadow-xl">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-[18px] flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
                            {tx('dynamic_key_1798326885')}</h2>
                        <p className="text-muted-foreground text-sm mb-4">
                            {contractId
                                ? tx('dynamic_key_831489996')
                                : tx('payment.successDetails.walletFunded', undefined, 'Wallet balance updated successfully.')}
                        </p>

                        {amount > 0 && (
                            <div className="text-3xl font-black text-emerald-400 mb-6">
                                {formatCurrency(amount, true)}
                            </div>
                        )}

                        <div className="text-xs text-muted mb-6">
                            {tx('dynamic_key_480999927')}</div>

                        {contractId ? (
                            <Link
                                to={`/contracts/${contractId}`}
                                className="btn-primary btn-lg justify-center w-full"
                            >
                                <span>{tx('dynamic_key_730815621')}</span>
                                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                            </Link>
                        ) : (
                            <Link
                                to="/wallet"
                                className="btn-primary btn-lg justify-center w-full"
                            >
                                <span>{tx('payment.successDetails.goToWallet', undefined, 'Go to Wallet')}</span>
                                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                            </Link>
                        )}
                    </div>
                )}

                {/* Failed State */}
                {status === 'failed' && (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-bg-elevated)]/60 backdrop-blur-md p-8 text-center shadow-xl">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-[18px] flex items-center justify-center mx-auto mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
                            {tx('dynamic_key_1762109572')}</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            {error || tx('payment.successDetails.verificationError', undefined, 'An error occurred during payment verification.')}
                        </p>

                        <div className="space-y-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary btn-lg justify-center w-full"
                            >
                                {tx('dynamic_key_131381918')}</button>
                            <Link
                                to={contractId ? `/contracts/${contractId}` : "/wallet"}
                                className="btn-secondary btn-lg justify-center w-full"
                            >
                                {contractId 
                                    ? tx('payment.successDetails.backToContract', undefined, 'Back to Contract') 
                                    : tx('payment.successDetails.backToWallet', undefined, 'Back to Wallet')}</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
