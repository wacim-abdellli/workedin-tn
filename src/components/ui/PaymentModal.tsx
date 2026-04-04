import { useState, useEffect, useRef } from 'react';
import { CreditCard, CheckCircle, Loader2, Smartphone, Building, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useTranslation } from '../../i18n';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    recipientName: string;
    onSuccess: () => Promise<void>;
}

type PaymentMethod = 'd17' | 'flouci' | 'card';

export default function PaymentModal({ isOpen, onClose, amount, recipientName, onSuccess }: PaymentModalProps) {
    const { t } = useTranslation();
    const [method, setMethod] = useState<PaymentMethod>('d17');
    const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const activePanelId = `payment-panel-${method}`;

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('select');
            setMethod('d17');
            setPhoneNumber('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const isPaymentPending = useRef(false);

    const handlePayment = async () => {
        if (method === 'd17' && !phoneNumber) return;
        if (isPaymentPending.current) return;
        
        isPaymentPending.current = true;
        try {
            setIsLoading(true);
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            setStep('processing');
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));

            setStep('success');
            // Wait a bit before closing/calling success
            await new Promise(resolve => setTimeout(resolve, 1500));

            await onSuccess();
            onClose();
        } finally {
            isPaymentPending.current = false;
            setIsLoading(false);
        }
    };

    const renderD17 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-xl flex items-center gap-4 transition-all">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Smartphone className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-400 text-lg">D17 {t.payment.payVia}</h3>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500/80">{t.payment.d17Desc}</p>
                </div>
            </div>

            <div className="border-2 border-dashed border-gray-200 dark:border-dark-600 rounded-2xl p-8 text-center bg-gray-50 dark:bg-dark-800/50 hover:bg-white dark:bg-gray-800 dark:hover:bg-dark-800/80 hover:border-primary-200 dark:hover:border-primary-900 transition-all duration-300">
                <div className="w-48 h-48 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {/* Placeholder QR Code - Simulated with CSS */}
                    <div className="w-full h-full bg-dark-900 pattern-dots opacity-80" style={{
                        backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                        backgroundSize: '16px 16px'
                    }} />
                    <div className="absolute bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
                        <Smartphone className="w-6 h-6 text-yellow-500" />
                    </div>
                </div>
                <p className="text-sm text-muted mb-3 font-medium">{t.payment.scanD17}</p>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white dark:bg-dark-700 rounded-full border border-gray-100 dark:border-dark-600 shadow-sm">
                    <span className="text-sm font-bold text-dark-900 dark:text-white">{t.payment.amount}: {amount} {t.common.tnd}</span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-dark-500 rounded-full" />
                    <span className="text-sm text-dark-600 dark:text-dark-300">{t.payment.to}: {recipientName}</span>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-dark-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-medium">
                    <span className="bg-white dark:bg-dark-900 px-3 text-muted">{t.payment.orEnterPhone}</span>
                </div>
            </div>

            <Input
                placeholder={t.payment.d17PhonePlaceholder}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                leftIcon={<Smartphone className="w-5 h-5" />}
                label={t.payment.d17PhoneLabel}
            />
        </div>
    );

    const renderFlouci = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 p-4 rounded-xl flex items-center gap-4 transition-all">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Building className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h3 className="font-bold text-green-800 dark:text-green-400 text-lg">{t.payment.flouciTitle}</h3>
                    <p className="text-sm text-green-600 dark:text-green-500/80">{t.payment.flouciDesc}</p>
                </div>
            </div>

            <div className="text-center py-12 bg-gray-50 dark:bg-dark-800/50 rounded-2xl border border-gray-100 dark:border-dark-700">
                <p className="text-muted mb-8 font-medium">{t.payment.flouciRedirect}</p>
                <Button
                    variant="outline"
                    className="w-full max-w-xs mx-auto justify-center gap-2 h-14 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 shadow-sm hover:shadow"
                    onClick={handlePayment}
                >
                    {t.payment.openFlouci}
                    <Smartphone className="w-5 h-5" />
                </Button>
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.payment.secureTransaction}</span>
                </div>
            </div>
        </div>
    );

    const renderCard = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="p-4 rounded-xl flex items-center gap-4 transition-all border" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 16%, transparent)' }}>
                    <CreditCard className="w-6 h-6" style={{ color: 'var(--workspace-primary)' }} />
                </div>
                <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--workspace-primary)' }}>{t.payment.creditCard}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.payment.cardSchemes}</p>
                </div>
            </div>

            <div className="space-y-4">
                <Input
                    label={t.payment.cardNumber}
                    placeholder={t.payment.cardNumberPlaceholder}
                    leftIcon={<CreditCard className="w-5 h-5" />}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={t.payment.expiryDate}
                        placeholder={t.payment.expiryDatePlaceholder}
                    />
                    <Input
                        label={t.payment.cvc}
                        placeholder={t.payment.cvcPlaceholder}
                        type="password"
                    />
                </div>
                <Input
                    label={t.payment.cardHolder}
                    placeholder={t.payment.cardHolder}
                />
            </div>
        </div>
    );

    const renderContent = () => {
        if (step === 'processing') {
            return (
                <div className="py-16 text-center animate-fade-in" role="status" aria-live="assertive">
                    <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Loader2 className="w-10 h-10 text-primary-600 dark:text-primary-400 animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-dark-900 dark:text-white">{t.payment.processing}</h3>
                    <p className="text-muted text-lg">{t.payment.processingDesc}</p>
                </div>
            );
        }

        if (step === 'success') {
            return (
                <div className="py-16 text-center animate-scale-in" role="status" aria-live="polite">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-500 animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-dark-900 dark:text-white">{t.payment.success}</h3>
                    <p className="text-muted text-lg mb-8">{t.payment.transferred} <span className="font-bold text-dark-900 dark:text-white">{amount} {t.common.tnd}</span> {t.payment.to} {recipientName}</p>
                    <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 text-sm text-dark-500">
                        {t.payment.transactionId}: #{Math.floor(Math.random() * 1000000)}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-dark-800 p-1.5 rounded-xl border border-gray-200 dark:border-dark-700" role="tablist" aria-label={t.payment.chooseMethod}>
                    <button
                        type="button"
                        role="tab"
                        id="payment-tab-d17"
                        aria-selected={method === 'd17'}
                        aria-controls="payment-panel-d17"
                        tabIndex={method === 'd17' ? 0 : -1}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${method === 'd17' ? 'bg-white dark:bg-dark-700 shadow text-primary-600 dark:text-primary-400' : 'text-muted hover:text-dark-900 dark:hover:text-white hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-dark-700/50'}`}
                        onClick={() => setMethod('d17')}
                    >
                        D17
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="payment-tab-flouci"
                        aria-selected={method === 'flouci'}
                        aria-controls="payment-panel-flouci"
                        tabIndex={method === 'flouci' ? 0 : -1}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${method === 'flouci' ? 'bg-white dark:bg-dark-700 shadow text-primary-600 dark:text-primary-400' : 'text-muted hover:text-dark-900 dark:hover:text-white hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-dark-700/50'}`}
                        onClick={() => setMethod('flouci')}
                    >
                        Flouci
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="payment-tab-card"
                        aria-selected={method === 'card'}
                        aria-controls="payment-panel-card"
                        tabIndex={method === 'card' ? 0 : -1}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${method === 'card' ? 'bg-white dark:bg-dark-700 shadow text-primary-600 dark:text-primary-400' : 'text-muted hover:text-dark-900 dark:hover:text-white hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-dark-700/50'}`}
                        onClick={() => setMethod('card')}
                    >
                        {t.payment.creditCard}
                    </button>
                </div>

                {/* Method Content */}
                <div
                    className="min-h-[300px]"
                    id={activePanelId}
                    role="tabpanel"
                    aria-labelledby={`payment-tab-${method}`}
                >
                    {method === 'd17' && renderD17()}
                    {method === 'flouci' && renderFlouci()}
                    {method === 'card' && renderCard()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-dark-700 pt-6 mt-6">
                    <div>
                        <p className="text-muted text-xs mb-1 font-medium">{t.payment.totalToPay}</p>
                        <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">{amount} <span className="text-sm text-dark-500 font-bold">{t.common.tnd}</span></p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
                        <Button
                            variant="primary"
                            onClick={handlePayment}
                            isLoading={isLoading}
                            disabled={method === 'd17' && !phoneNumber}
                            className="bg-gradient-to-r from-primary-600 to-primary-500 min-w-[140px]"
                            rightIcon={<ShieldCheck className="w-5 h-5" />}
                        >
                            {t.payment.payNow}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t.payment.completeTitle}
            size="lg"
        >
            {renderContent()}
        </Modal>
    );
}
