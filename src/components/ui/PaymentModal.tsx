import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Loader2, Smartphone, Building } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    recipientName: string;
    onSuccess: () => Promise<void>;
}

type PaymentMethod = 'd17' | 'flouci' | 'card';

export default function PaymentModal({ isOpen, onClose, amount, recipientName, onSuccess }: PaymentModalProps) {
    const [method, setMethod] = useState<PaymentMethod>('d17');
    const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('select');
            setMethod('d17');
            setPhoneNumber('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const handlePayment = async () => {
        if (method === 'd17' && !phoneNumber) return;

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
    };

    const renderD17 = () => (
        <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                    <h3 className="font-bold text-yellow-800">D17 دفع عبر</h3>
                    <p className="text-sm text-yellow-600">أسرع طريقة للدفع في تونس</p>
                </div>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
                <div className="w-48 h-48 bg-white mx-auto mb-4 p-2 rounded-lg shadow-sm border border-gray-100 flex items-center justify-center">
                    {/* Placeholder QR Code */}
                    <div className="w-full h-full bg-gray-800 pattern-dots" style={{
                        backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                        backgroundSize: '16px 16px'
                    }} />
                </div>
                <p className="text-sm text-muted mb-2">امسح الرمز بواسطة تطبيق D17</p>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-foreground">
                    <span>المبلغ: {amount} د.ت</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>المستفيد: {recipientName}</span>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted">أو أدخل رقم هاتفك</span>
                </div>
            </div>

            <Input
                placeholder="2x xxx xxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                leftIcon={<Smartphone className="w-5 h-5" />}
                label="رقم الهاتف المرتبط بـ D17"
            />
        </div>
    );

    const renderFlouci = () => (
        <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h3 className="font-bold text-green-800">Flouci</h3>
                    <p className="text-sm text-green-600">محفظتك الرقمية الآمنة</p>
                </div>
            </div>

            <div className="text-center py-8">
                <p className="text-muted mb-6">سيتم تحويلك إلى تطبيق Flouci لإتمام عملية الدفع</p>
                <Button
                    variant="outline"
                    className="w-full justify-center gap-2 h-12 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                    onClick={handlePayment}
                >
                    فتح تطبيق Flouci
                    <Smartphone className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );

    const renderCard = () => (
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-800">بطاقة بنكية</h3>
                    <p className="text-sm text-blue-600">Visa / Mastercard / CIB</p>
                </div>
            </div>

            <Input
                label="رقم البطاقة"
                placeholder="0000 0000 0000 0000"
                leftIcon={<CreditCard className="w-5 h-5" />}
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="تاريخ الانتهاء"
                    placeholder="MM/YY"
                />
                <Input
                    label="CVC"
                    placeholder="123"
                    type="password"
                />
            </div>
            <Input
                label="اسم حامل البطاقة"
                placeholder="الاسم كما يظهر على البطاقة"
            />
        </div>
    );

    const renderContent = () => {
        if (step === 'processing') {
            return (
                <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">جاري معالجة الدفع...</h3>
                    <p className="text-muted">يرجى الانتظار ولانغلاق النافذة</p>
                </div>
            );
        }

        if (step === 'success') {
            return (
                <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">تم الدفع بنجاح!</h3>
                    <p className="text-muted">تم تحويل مبلغ {amount} د.ت إلى {recipientName}</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'd17' ? 'bg-white shadow-sm text-primary-600' : 'text-muted hover:text-foreground'}`}
                        onClick={() => setMethod('d17')}
                    >
                        D17
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'flouci' ? 'bg-white shadow-sm text-primary-600' : 'text-muted hover:text-foreground'}`}
                        onClick={() => setMethod('flouci')}
                    >
                        Flouci
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'card' ? 'bg-white shadow-sm text-primary-600' : 'text-muted hover:text-foreground'}`}
                        onClick={() => setMethod('card')}
                    >
                        بطاقة بنكية
                    </button>
                </div>

                {/* Method Content */}
                <div className="min-h-[300px]">
                    {method === 'd17' && renderD17()}
                    {method === 'flouci' && renderFlouci()}
                    {method === 'card' && renderCard()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
                    <div className="text-sm">
                        <p className="text-muted mb-1">المجموع للدفع</p>
                        <p className="text-xl font-bold text-foreground">{amount} د.ت</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
                        <Button
                            variant="primary"
                            onClick={handlePayment}
                            isLoading={isLoading}
                            disabled={method === 'd17' && !phoneNumber}
                        >
                            دفع الآن
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
            title="إتمام الدفع"
        >
            {renderContent()}
        </Modal>
    );
}
