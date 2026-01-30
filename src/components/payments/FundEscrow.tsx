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
        console.log('[FundEscrow] Starting escrow funding for contract:', contract.id);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            // Convert to millimes for Flouci
            const amountInMillimes = tndToMillimes(totalAmount);

            // Build redirect URLs
            const baseUrl = window.location.origin;
            const successUrl = `${baseUrl}/payment/success?contract_id=${contract.id}`;
            const failUrl = `${baseUrl}/payment/failed?contract_id=${contract.id}`;

            // Initiate Flouci payment
            const payment = await initiatePayment({
                amount: amountInMillimes,
                success_link: successUrl,
                fail_link: failUrl,
                session_timeout_secs: 1200, // 20 minutes
                developer_tracking_id: `contract_${contract.id}_${Date.now()}`,
            });

            console.log('[FundEscrow] Payment initiated:', payment.payment_id);

            // Create pending transaction record
            const { error: txError } = await supabase.from('transactions').insert({
                user_id: user.id,
                contract_id: contract.id,
                type: 'escrow',
                amount: totalAmount,
                fee_amount: feeAmount,
                net_amount: originalAmount,
                status: 'pending',
                payment_method: 'flouci',
                payment_gateway_id: payment.payment_id,
                description: `تمويل ضمان للعقد ${contract.id}`,
                metadata: {
                    budget: contract.budget,
                    fee_percentage: PLATFORM_FEE_PERCENTAGE,
                    freelancer_id: contract.freelancer_id,
                },
            });

            if (txError) {
                console.error('[FundEscrow] Transaction record error:', txError);
                // Continue anyway - payment can still work
            }

            showToast('جاري تحويلك لصفحة الدفع...', 'success');

            // Redirect to Flouci payment page
            window.location.href = payment.link;

            onSuccess?.();
        } catch (error) {
            console.error('[FundEscrow] Error:', error);
            const message = error instanceof Error ? error.message : 'فشل في بدء عملية الدفع';
            showToast(message, 'error');
            onError?.(message);
        } finally {
            setLoading(false);
        }
    };

    // Don't show if already funded
    if (contract.escrow_funded) {
        return (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                        تم تمويل الضمان بنجاح
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">تمويل الضمان</h3>
                    <p className="text-sm text-gray-500">أموالك محفوظة حتى اكتمال العمل</p>
                </div>
            </div>

            {/* Warning */}
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        يجب تمويل الضمان قبل أن يبدأ المستقل بالعمل. الأموال محمية حتى توافق على تسليم العمل.
                    </p>
                </div>
            </div>

            {/* Amount Breakdown */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-sm text-primary-600 hover:text-primary-700 mb-2"
                >
                    {showBreakdown ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                </button>

                {showBreakdown && (
                    <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">ميزانية المشروع</span>
                            <span className="font-medium">{formatCurrency(originalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">رسوم المنصة (10%)</span>
                            <span className="font-medium">{formatCurrency(feeAmount)}</span>
                        </div>
                        <div className="h-px bg-gray-200 dark:bg-gray-600 my-2" />
                        <div className="flex justify-between font-bold">
                            <span>المجموع</span>
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

            {/* Payment Button */}
            <button
                onClick={handleFundEscrow}
                disabled={loading}
                className="w-full btn-primary btn-lg justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جاري المعالجة...</span>
                    </>
                ) : (
                    <>
                        <Shield className="w-5 h-5" />
                        <span>تمويل الضمان الآن</span>
                    </>
                )}
            </button>

            {/* Payment Methods Info */}
            <p className="text-center text-xs text-gray-500 mt-4">
                الدفع عبر Flouci - بطاقات بنكية ومحافظ إلكترونية
            </p>
        </div>
    );
};

export default FundEscrow;
