import { logger } from '@/lib/logger';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { verifyPayment } from '../lib/flouci';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { formatCurrency } from '../lib/currencyUtils';

type VerificationStatus = 'verifying' | 'success' | 'failed';

/**
 * PaymentSuccess Page
 * Handles redirect after successful Flouci payment
 * 
 * FIXES APPLIED:
 * - Added idempotency check (prevents duplicate processing on refresh)
 * - Uses atomic payment completion via SQL function
 * - Fixed field name: 'amount' instead of 'budget'
 */
const PaymentSuccess = () => {
    const { dir } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Prevent double processing with ref
    const processingRef = useRef(false);

    const [status, setStatus] = useState<VerificationStatus>('verifying');
    const [error, setError] = useState<string | null>(null);
    const [contractId, setContractId] = useState<string | null>(null);
    const [amount, setAmount] = useState<number>(0);

    useEffect(() => {
        const verifyAndProcess = async () => {
            // Prevent double execution
            if (processingRef.current) return;
            processingRef.current = true;

            const payment_id = searchParams.get('payment_id');
            const contract_id = searchParams.get('contract_id');

            logger.log('[PaymentSuccess] Verifying payment:', { payment_id, contract_id });
            setContractId(contract_id);

            if (!payment_id) {
                logger.error('[PaymentSuccess] No payment_id in URL');
                setStatus('failed');
                setError('معرف الدفع غير موجود');
                return;
            }

            try {
                // ================================================
                // STEP 1: IDEMPOTENCY CHECK
                // Check if payment was already processed
                // ================================================
                const { data: existingTransaction } = await supabase
                    .from('transactions')
                    .select('id, status, amount')
                    .eq('payment_gateway_id', payment_id)
                    .single();

                if (existingTransaction?.status === 'completed') {
                    logger.log('[PaymentSuccess] Payment already processed (idempotent)');
                    setAmount(existingTransaction.amount || 0);
                    setStatus('success');

                    // Redirect after delay
                    setTimeout(() => {
                        if (contract_id) {
                            navigate(`/contracts/${contract_id}`);
                        } else {
                            navigate('/client/dashboard');
                        }
                    }, 3000);
                    return; // EXIT - Already completed
                }

                // ================================================
                // STEP 2: VERIFY WITH FLOUCI
                // ================================================
                const verification = await verifyPayment(payment_id);
                logger.log('[PaymentSuccess] Verification result:', verification);

                if (verification.status !== 'SUCCESS') {
                    setStatus('failed');
                    setError('لم يتم التحقق من الدفع');
                    return;
                }

                // ================================================
                // STEP 3: GET CONTRACT DETAILS
                // ================================================
                if (!contract_id) {
                    // No contract - just update transaction if exists
                    if (existingTransaction) {
                        await supabase
                            .from('transactions')
                            .update({
                                status: 'completed',
                                completed_at: new Date().toISOString(),
                                payment_gateway_response: verification,
                            })
                            .eq('id', existingTransaction.id);
                        setAmount(existingTransaction.amount || 0);
                    }
                    setStatus('success');
                    setTimeout(() => navigate('/client/dashboard'), 4000);
                    return;
                }

                // Get contract with correct field name (amount, not budget)
                const { data: contract, error: contractFetchError } = await supabase
                    .from('contracts')
                    .select('id, freelancer_id, amount, escrow_funded') // ✅ FIXED: 'amount' not 'budget'
                    .eq('id', contract_id)
                    .single();

                if (contractFetchError || !contract) {
                    logger.error('[PaymentSuccess] Contract fetch error:', contractFetchError);
                    setStatus('failed');
                    setError('لم يتم العثور على العقد');
                    return;
                }

                // Check if already funded
                if (contract.escrow_funded) {
                    logger.log('[PaymentSuccess] Contract already funded (idempotent)');
                    setAmount(contract.amount || 0);
                    setStatus('success');
                    setTimeout(() => navigate(`/contracts/${contract_id}`), 3000);
                    return;
                }

                // ================================================
                // STEP 4: ATOMIC PAYMENT COMPLETION
                // Uses SQL function to update all in single transaction
                // ================================================
                if (existingTransaction && contract.freelancer_id) {
                    logger.log('[PaymentSuccess] Completing payment atomically...');

                    const { data: completionResult, error: completionError } = await supabase.rpc(
                        'complete_escrow_payment',
                        {
                            p_transaction_id: existingTransaction.id,
                            p_contract_id: contract_id,
                            p_freelancer_id: contract.freelancer_id,
                            p_amount: contract.amount,
                        }
                    );

                    if (completionError) {
                        logger.error('[PaymentSuccess] Atomic payment error:', completionError);

                        // Check if it was an idempotent failure (already completed)
                        if (completionError.message?.includes('already completed')) {
                            setAmount(contract.amount || 0);
                            setStatus('success');
                            setTimeout(() => navigate(`/contracts/${contract_id}`), 3000);
                            return;
                        }

                        setStatus('failed');
                        setError('فشل في إتمام الدفع');
                        return;
                    }

                    logger.log('[PaymentSuccess] Atomic completion result:', completionResult);
                    setAmount(contract.amount || 0);
                } else {
                    // Fallback: Manual updates if no transaction found
                    // This shouldn't happen in normal flow but handle it gracefully
                    logger.log('[PaymentSuccess] No transaction found, updating contract directly');

                    await supabase
                        .from('contracts')
                        .update({
                            escrow_funded: true,
                            escrow_amount: contract.amount,
                            funded_at: new Date().toISOString(),
                        })
                        .eq('id', contract_id);

                    setAmount(contract.amount || 0);
                }

                // ================================================
                // SUCCESS!
                // ================================================
                setStatus('success');
                logger.log('[PaymentSuccess] Payment verified and processed successfully');

                // Redirect after 4 seconds
                setTimeout(() => {
                    navigate(`/contracts/${contract_id}`);
                }, 4000);

            } catch (err) {
                logger.error('[PaymentSuccess] Error:', err);
                setStatus('failed');
                setError(err instanceof Error ? err.message : 'خطأ في التحقق من الدفع');
            }
        };

        verifyAndProcess();
    }, [searchParams, navigate]);

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900/20 flex items-center justify-center p-4"
            dir={dir}
        >
            <div className="max-w-md w-full">
                {/* Verifying State */}
                {status === 'verifying' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-6" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            جاري التحقق من الدفع...
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            يرجى الانتظار بينما نتحقق من عملية الدفع
                        </p>
                    </div>
                )}

                {/* Success State */}
                {status === 'success' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            تم الدفع بنجاح! 🎉
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            تم تمويل الضمان بنجاح. الأموال محفوظة حتى اكتمال العمل.
                        </p>

                        {amount > 0 && (
                            <div className="text-3xl font-bold text-green-600 mb-6">
                                {formatCurrency(amount)}
                            </div>
                        )}

                        <div className="text-sm text-gray-500 mb-6">
                            جاري تحويلك تلقائياً...
                        </div>

                        {contractId && (
                            <Link
                                to={`/contracts/${contractId}`}
                                className="btn-primary btn-lg justify-center w-full"
                            >
                                <span>الذهاب للعقد</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        )}
                    </div>
                )}

                {/* Failed State */}
                {status === 'failed' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            فشل التحقق من الدفع
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {error || 'حدث خطأ أثناء التحقق من عملية الدفع'}
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary btn-lg justify-center w-full"
                            >
                                إعادة المحاولة
                            </button>
                            <Link
                                to="/client/dashboard"
                                className="btn-secondary btn-lg justify-center w-full"
                            >
                                العودة للوحة التحكم
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
