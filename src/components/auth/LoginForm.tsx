import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Validation schema for phone number
const phoneSchema = z.object({
    phone: z
        .string()
        .min(8, 'رقم الهاتف يجب أن يكون 8 أرقام')
        .max(8, 'رقم الهاتف يجب أن يكون 8 أرقام')
        .regex(/^[0-9]+$/, 'أدخل أرقام فقط'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToSignup?: () => void;
}

function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
    const { t, dir } = useTranslation();
    const { signInWithPhone, verifyOtp } = useAuth();
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendTimer, setResendTimer] = useState(0);

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PhoneFormData>({
        resolver: zodResolver(phoneSchema),
    });

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // Handle phone submission
    const onPhoneSubmit = async (data: PhoneFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await signInWithPhone(data.phone);
            setPhone(data.phone);
            setStep('otp');
            setResendTimer(60);
        } catch (err) {
            setError((err as Error).message || 'حدث خطأ في إرسال الرمز');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle OTP input
    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = digit;
                }
            });
            setOtp(newOtp);

            // Focus last filled input or next empty
            const nextIndex = Math.min(index + digits.length, 5);
            const nextInput = document.querySelector<HTMLInputElement>(`#otp-${nextIndex}`);
            nextInput?.focus();
        } else {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-focus next input
            if (value && index < 5) {
                const nextInput = document.querySelector<HTMLInputElement>(`#otp-${index + 1}`);
                nextInput?.focus();
            }
        }
    };

    // Handle OTP backspace
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.querySelector<HTMLInputElement>(`#otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    // Verify OTP
    const handleVerifyOtp = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setError('أدخل الرمز المكون من 6 أرقام');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await verifyOtp(phone, code);
            onSuccess?.();
        } catch (err) {
            setError((err as Error).message || 'رمز التحقق غير صحيح');
            setOtp(['', '', '', '', '', '']);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-submit when OTP is complete
    useEffect(() => {
        if (otp.every((digit) => digit) && otp.length === 6) {
            handleVerifyOtp();
        }
    }, [otp]);

    // Resend OTP
    const handleResend = async () => {
        if (resendTimer > 0) return;

        setIsLoading(true);
        setError(null);

        try {
            await signInWithPhone(phone);
            setResendTimer(60);
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            setError((err as Error).message || 'حدث خطأ في إعادة الإرسال');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {step === 'phone' ? (
                <form onSubmit={handleSubmit(onPhoneSubmit)} className="space-y-6">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
                            <Phone className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            {t.nav.login}
                        </h2>
                        <p className="text-muted">
                            أدخل رقم هاتفك للمتابعة
                        </p>
                    </div>

                    <div className="relative">
                        <Input
                            {...register('phone')}
                            type="tel"
                            placeholder="XX XXX XXX"
                            error={errors.phone?.message}
                            className="text-center text-xl tracking-widest"
                            dir="ltr"
                        />
                        <span className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                            +216
                        </span>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isLoading}
                        rightIcon={<ArrowIcon className="w-5 h-5" />}
                    >
                        {t.auth.sendCode}
                    </Button>

                    {onSwitchToSignup && (
                        <p className="text-center text-muted">
                            ليس لديك حساب؟{' '}
                            <button
                                type="button"
                                onClick={onSwitchToSignup}
                                className="text-primary-600 font-medium hover:underline"
                            >
                                {t.nav.signup}
                            </button>
                        </p>
                    )}
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            {t.auth.verifyCode}
                        </h2>
                        <p className="text-muted">
                            أرسلنا رمز التحقق إلى
                            <span className="font-medium text-foreground block mt-1" dir="ltr">
                                +216 {phone}
                            </span>
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-2" dir="ltr">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                className={`
                  w-12 h-14 text-center text-2xl font-bold rounded-xl border-2
                  focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent
                  transition-all duration-200
                  ${digit ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white'}
                `}
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <Button
                        onClick={handleVerifyOtp}
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isLoading}
                    >
                        {t.auth.verify}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendTimer > 0}
                            className={`text-sm ${resendTimer > 0 ? 'text-muted' : 'text-primary-600 hover:underline'
                                }`}
                        >
                            {resendTimer > 0
                                ? `${t.auth.resendIn} ${resendTimer} ${t.auth.seconds}`
                                : t.auth.resendCode}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setStep('phone');
                            setOtp(['', '', '', '', '', '']);
                            setError(null);
                        }}
                        className="w-full text-center text-muted hover:text-foreground transition-colors"
                    >
                        تغيير رقم الهاتف
                    </button>
                </div>
            )}
        </div>
    );
}

export default LoginForm;
