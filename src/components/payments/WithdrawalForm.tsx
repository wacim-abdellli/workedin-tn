import { logger } from '@/lib/logger';
import { useState } from 'react';
import { Loader2, Building, Phone, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { useMutation } from '@tanstack/react-query';
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
    const [submitted, setSubmitted] = useState(false);

    // Form state
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<WithdrawalMethod>('bank_transfer');
    const [bankName, setBankName] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    const [bankIban, setBankIban] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const amountValue = parseFloat(amount) || 0;
    const validation = validateWithdrawalAmount(amountValue, wallet.balance);

    // Withdrawal mutation with retry logic
    const withdrawalMutation = useMutation({
        mutationFn: async ({ requestId }: { requestId: string }) => {
            logger.log('[WithdrawalForm] Submitting withdrawal request');

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            const { error: withdrawalError } = await supabase.rpc('request_withdrawal_atomic', {
                p_wallet_id: wallet.id,
                p_amount: amountValue,
                p_method: method,
                p_client_request_id: requestId,
                p_bank_name: method === 'bank_transfer' ? bankName : null,
                p_bank_account_name: method === 'bank_transfer' ? bankAccountName : null,
                p_bank_iban: method === 'bank_transfer' ? bankIban : null,
                p_phone_number: method !== 'bank_transfer' ? phoneNumber : null,
            });

            if (withdrawalError) {
                throw withdrawalError;
            }

            logger.log('[WithdrawalForm] Withdrawal submitted successfully');
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        onSuccess: () => {
            setSubmitted(true);
            showToast('تم إرسال طلب السحب بنجاح', 'success');

            // Delay before callback to show success state
            setTimeout(() => {
                onSuccess?.();
            }, 2000);
        },
        onError: (error) => {
            logger.error('[WithdrawalForm] Error:', error);
            const message = error instanceof Error ? error.message : 'فشل في إرسال طلب السحب';
            showToast(message, 'error');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!validation.valid) {
            showToast(validation.error || 'خطأ في التحقق من المبلغ', 'error');
            return;
        }

        if (method === 'bank_transfer') {
            if (!bankName.trim() || !bankAccountName.trim() || !bankIban.trim()) {
                showToast('الرجاء إدخال بيانات البنك كاملة', 'error');
                return;
            }
        } else {
            if (!phoneNumber.trim()) {
                showToast('الرجاء إدخال رقم الهاتف', 'error');
                return;
            }
        }

        withdrawalMutation.mutate({ requestId: crypto.randomUUID() });
    };

    if (submitted) {
        return (
            <div className="bg-card rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">
                    تم إرسال طلب السحب
                </h3>
                <p className="text-muted-foreground mb-4">
                    سيتم مراجعة طلبك وتحويل المبلغ خلال 2-5 أيام عمل
                </p>
                <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(amountValue)}
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground dark:text-white">
                    طلب سحب
                </h3>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-muted"
                    >
                        <X className="w-5 h-5 text-muted" />
                    </button>
                )}
            </div>

            {/* Available Balance */}
            <div className="mb-6 p-4 bg-surface rounded-xl">
                <div className="text-sm text-muted mb-1">الرصيد المتاح</div>
                <div className="text-2xl font-bold text-foreground dark:text-white">
                    {formatCurrency(wallet.balance)}
                </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                    المبلغ المطلوب
                </label>
                <div className="relative" dir="ltr">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`الحد الأدنى ${MIN_WITHDRAWAL_AMOUNT} د.ت`}
                        min={MIN_WITHDRAWAL_AMOUNT}
                        max={wallet.balance}
                        step="0.001"
                        className="input w-full ps-16"
                        dir="ltr"
                    />
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted">
                        د.ت
                    </span>
                </div>
                {amount && !validation.valid && (
                    <p className="text-red-500 text-sm mt-1">{validation.error}</p>
                )}
            </div>

            {/* Withdrawal Method */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                                : 'border-border hover:border-border'
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
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
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
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
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
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
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
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        رقم الهاتف
                    </label>
                    <div className="relative" dir="ltr">
                        <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+216 XX XXX XXX"
                            className="input w-full ps-10"
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
                disabled={withdrawalMutation.isPending || !validation.valid || !amount}
                className="w-full btn-primary btn-lg justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {withdrawalMutation.isPending ? (
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
