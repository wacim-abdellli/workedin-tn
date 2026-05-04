import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { formatCurrency } from '../lib/currencyUtils';

type VerificationStatus = 'verifying' | 'success' | 'failed';

/**
 * PaymentSuccess Page
 * Handles redirect after successful Dhmad payment
 * 
 * FIXES APPLIED:
 * - Removed frontend Flouci verification (security risk)
 * - Now polls the database waiting for the Dhmad webhook to mark escrow_funded = true
 */
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
        setContractId(contract_id);

        if (!contract_id) {
            logger.error('[PaymentSuccess] No contract_id in URL');
            setStatus('failed');
            setError('معرف العقد غير موجود');
            return;
        }

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
                        setError('انتهى وقت الانتظار. يرجى التحقق من حالة الدفع في لوحة التحكم.');
                    }
                }, 2000);

                return () => clearInterval(interval);
            }
        });
    }, [searchParams, navigate]);

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900/20 flex items-center justify-center p-4"
            dir={dir}
        >
            <div className="max-w-md w-full">
                {/* Verifying State */}
                {status === 'verifying' && (
                    <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
                        <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-6" />
                        <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">
                            {tx('dynamic_key_374761519')}</h2>
                        <p className="text-muted-foreground">
                            {tx('dynamic_key_1821001923')}</p>
                    </div>
                )}

                {/* Success State */}
                {status === 'success' && (
                    <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
                            {tx('dynamic_key_1798326885')}</h2>
                        <p className="text-muted-foreground mb-4">
                            {tx('dynamic_key_831489996')}</p>

                        {amount > 0 && (
                            <div className="text-3xl font-bold text-green-600 mb-6">
                                {formatCurrency(amount)}
                            </div>
                        )}

                        <div className="text-sm text-muted mb-6">
                            {tx('dynamic_key_480999927')}</div>

                        {contractId && (
                            <Link
                                to={`/contracts/${contractId}`}
                                className="btn-primary btn-lg justify-center w-full"
                            >
                                <span>{tx('dynamic_key_730815621')}</span>
                                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                            </Link>
                        )}
                    </div>
                )}

                {/* Failed State */}
                {status === 'failed' && (
                    <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
                            {tx('dynamic_key_1762109572')}</h2>
                        <p className="text-muted-foreground mb-4">
                            {error || 'حدث خطأ أثناء التحقق من عملية الدفع'}
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary btn-lg justify-center w-full"
                            >
                                {tx('dynamic_key_131381918')}</button>
                            <Link
                                to="/client/dashboard"
                                className="btn-secondary btn-lg justify-center w-full"
                            >
                                {tx('dynamic_key_764967864')}</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
