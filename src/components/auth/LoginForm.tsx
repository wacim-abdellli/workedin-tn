import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles, Lock } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToSignup?: () => void;
}

function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
    const { t, dir } = useTranslation();
    const { signInWithEmail } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    const emailSchema = z.object({
        email: z.string().email(t.auth.invalidEmail),
        password: z.string().min(6, t.auth.passwordMinLength),
    });

    type EmailFormData = z.infer<typeof emailSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
    });

    const onSubmit = async (data: EmailFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await signInWithEmail(data.email, data.password);
            onSuccess?.();
        } catch (err) {
            const message = (err as Error).message;
            if (message.includes('Invalid login credentials')) {
                setError(t.auth.invalidCredentials);
            } else if (message.includes('Email not confirmed')) {
                setError(t.auth.emailNotConfirmed);
            } else {
                setError(message || t.common.error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-600/30">
                            <Mail className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -end-1 w-8 h-8 rounded-xl bg-gradient-to-r from-accent-400 to-accent-600 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        {t.nav.login}
                    </h2>
                    <p className="text-muted">
                        {t.auth.loginSubtitle}
                    </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                    <div className="relative">
                        <label className="label flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary-500" />
                            {t.auth.email}
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder={t.auth.emailPlaceholder}
                            className="input"
                            dir="ltr"
                        />
                        {errors.email && (
                            <p className="text-accent-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="relative">
                        <label className="label flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary-500" />
                            {t.auth.password}
                        </label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t.auth.passwordPlaceholder}
                                className="input pe-12"
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute end-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-accent-500 text-sm mt-1">{errors.password.message}</p>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
                        <p className="text-accent-600 dark:text-accent-400 text-sm text-center font-medium">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary btn-lg w-full group"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>{t.nav.login}</span>
                            <ArrowIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                {/* Switch to Signup */}
                {onSwitchToSignup && (
                    <p className="text-center text-muted">
                        {t.auth.noAccount}{' '}
                        <button
                            type="button"
                            onClick={onSwitchToSignup}
                            className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                        >
                            {t.nav.signup}
                        </button>
                    </p>
                )}
            </form>
        </div>
    );
}

export default LoginForm;
