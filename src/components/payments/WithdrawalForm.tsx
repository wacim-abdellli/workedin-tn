import { useState } from 'react';
import { Loader2, Building, Phone, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import {
    formatCurrency,
    formatWithdrawalMethod,
    validateWithdrawalAmount
} from '../../lib/currencyUtils';
import { MIN_WITHDRAWAL_AMOUNT } from '../../types/payment';
import type { WithdrawalFormProps, WithdrawalMethod } from '../../types/payment';

/**
 * WithdrawalForm Component
 * Allows freelancers to request withdrawal from their wallet
 */
const WithdrawalForm = ({ wallet, onSuccess, onCancel }: WithdrawalFormProps) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form state
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<WithdrawalMethod>('bank_transfer');
    const [bankName, setBankName] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    const [bankIban, setBankIban] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const amountValue = parseFloat(amount) || 0;
    const validation = validateWithdrawalAmount(amountValue, wallet.balance, MIN_WITHDRAWAL_AMOUNT);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validation.valid) {
            showToast(validation.error || 'خطأ في البيانات', 'error');
            return;
        }

        // Validate method-specific fields
        if (method === 'bank_transfer') {
            if (!bankName || !bankAccountName || !bankIban) {
                showToast('الرجاء إدخال جميع بيانات الحساب البنكي', 'error');
                return;
            }
        } else if (method === 'd17' || method === 'flouci') {
            if (!phoneNumber) {
                showToast('الرجاء إدخال رقم الهاتف', 'error');
                return;
            }
        }

        setLoading(true);
        console.log('[WithdrawalForm] Submitting withdrawal request');

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            // Create withdrawal request
            const { error: withdrawalError } = await supabase.from('withdrawals').insert({
                user_id: user.id,
                wallet_id: wallet.id,
                amount: amountValue,
                currency: 'TND',
                method,
                status: 'pending',
                bank_name: method === 'bank_transfer' ? bankName : null,
                bank_account_name: method === 'bank_transfer' ? bankAccountName : null,
                bank_iban: method === 'bank_transfer' ? bankIban : null,
                phone_number: method !== 'bank_transfer' ? phoneNumber : null,
            });

            if (withdrawalError) {
                throw withdrawalError;
            }

            // Deduct from wallet balance (move to pending state)
            const { error: updateError } = await supabase
                .rpc('update_wallet_balance', {
                    p_user_id: user.id,
                    p_amount: amountValue,
                    p_type: 'subtract_balance',
                });

            if (updateError) {
                console.error('[WithdrawalForm] Wallet update error:', updateError);
                // Withdrawal was created, but wallet not updated - admin will handle
            }

            console.log('[WithdrawalForm] Withdrawal submitted successfully');
            setSubmitted(true);
            showToast('تم إرسال طلب السحب بنجاح', 'success');

            // Delay before callback to show success state
            setTimeout(() => {
                onSuccess?.();
            }, 2000);
        } catch (error) {
            console.error('[WithdrawalForm] Error:', error);
            const message = error instanceof Error ? error.message : 'فشل في إرسال طلب السحب';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    تم إرسال طلب السحب
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    سيتم مراجعة طلبك وتحويل المبلغ خلال 2-5 أيام عمل
                </p>
                <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(amountValue)}
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    طلب سحب
                </h3>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                )}
            </div>

            {/* Available Balance */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">الرصيد المتاح</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(wallet.balance)}
                </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المبلغ المطلوب
                </label>
                <div className="relative">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`الحد الأدنى ${MIN_WITHDRAWAL_AMOUNT} د.ت`}
                        min={MIN_WITHDRAWAL_AMOUNT}
                        max={wallet.balance}
                        step="0.001"
                        className="input w-full pl-16"
                        dir="ltr"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        د.ت
                    </span>
                </div>
                {amount && !validation.valid && (
                    <p className="text-red-500 text-sm mt-1">{validation.error}</p>
                )}
            </div>

            {/* Withdrawal Method */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    طريقة السحب
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {(['bank_transfer', 'd17', 'flouci'] as WithdrawalMethod[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMethod(m)}
                            className={`p-3 rounded-xl border-2 text-center transition-colors ${method === m
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                }`}
                        >
                            {m === 'bank_transfer' && <Building className="w-5 h-5 mx-auto mb-1" />}
                            {m === 'd17' && <span className="font-bold text-lg">D17</span>}
                            {m === 'flouci' && <span className="font-bold text-lg">F</span>}
                            <div className="text-xs">{formatWithdrawalMethod(m)}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bank Transfer Fields */}
            {method === 'bank_transfer' && (
                <div className="space-y-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            اسم البنك
                        </label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="مثال: البنك الوطني الفلاحي"
                            className="input w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            اسم صاحب الحساب
                        </label>
                        <input
                            type="text"
                            value={bankAccountName}
                            onChange={(e) => setBankAccountName(e.target.value)}
                            placeholder="الاسم كما يظهر في الحساب البنكي"
                            className="input w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            رقم IBAN
                        </label>
                        <input
                            type="text"
                            value={bankIban}
                            onChange={(e) => setBankIban(e.target.value)}
                            placeholder="TN59XXXXX..."
                            className="input w-full"
                            dir="ltr"
                        />
                    </div>
                </div>
            )}

            {/* Mobile Payment Fields */}
            {(method === 'd17' || method === 'flouci') && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        رقم الهاتف
                    </label>
                    <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+216 XX XXX XXX"
                            className="input w-full pr-10"
                            dir="ltr"
                        />
                    </div>
                </div>
            )}

            {/* Warning */}
            <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        سيتم مراجعة طلب السحب من قبل الإدارة وتحويل المبلغ خلال 2-5 أيام عمل.
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading || !validation.valid || !amount}
                className="w-full btn-primary btn-lg justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جاري الإرسال...</span>
                    </>
                ) : (
                    <span>إرسال طلب السحب</span>
                )}
            </button>
        </form>
    );
};

export default WithdrawalForm;
