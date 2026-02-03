import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Briefcase, Users, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import type { UserType } from '../../types';
import { useToast } from '../ui/Toast';

interface SignupFormProps {
    onComplete?: () => void;
}

function SignupForm({ onComplete }: SignupFormProps) {
    const { t, dir } = useTranslation();
    const { profile, setUserType, signUpWithEmail, signInWithEmail } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState<'email' | 'userType'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const preSelectedType = searchParams.get('type') as UserType | null;

    const signupSchema = z.object({
        email: z.string().email(t.auth.invalidEmail),
        password: z.string().min(6, t.auth.passwordMinLength),
        confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t.auth.passwordMismatch,
        path: ['confirmPassword'],
    });

    type SignupFormData = z.infer<typeof signupSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    });

    const userTypes: { type: UserType; icon: React.ReactNode; title: string; description: string; gradient: string }[] = [
        {
            type: 'freelancer',
            icon: <User className="w-8 h-8" />,
            title: t.auth.freelancer,
            description: dir === 'rtl' ? 'أريد العمل وتقديم خدماتي' : 'I want to work and offer my services',
            gradient: 'from-primary-500 to-primary-600',
        },
        {
            type: 'client',
            icon: <Briefcase className="w-8 h-8" />,
            title: t.auth.client,
            description: dir === 'rtl' ? 'أريد توظيف موظفين' : 'I want to hire freelancers',
            gradient: 'from-accent-500 to-accent-600',
        },
        {
            type: 'both',
            icon: <Users className="w-8 h-8" />,
            title: t.auth.both,
            description: dir === 'rtl' ? 'أريد العمل والتوظيف معاً' : 'I want to do both',
            gradient: 'from-secondary-500 to-secondary-600',
        },
    ];

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await signUpWithEmail(data.email, data.password);
            await signInWithEmail(data.email, data.password);

            if (preSelectedType) {
                await handleSelectUserType(preSelectedType);
            } else {
                setStep('userType');
            }
        } catch (err) {
            const message = (err as Error).message;
            if (message.includes('User already registered')) {
                setError(t.auth.emailExists);
                showToast(t.auth.emailExists, 'error');
            } else {
                setError(message || t.common.error);
                showToast(message || t.common.error, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUserType = async (userType: UserType) => {
        setIsLoading(true);
        try {
            await setUserType(userType);
            if (userType === 'freelancer' || userType === 'both') {
                navigate('/onboarding/freelancer');
            } else {
                navigate('/onboarding/client');
            }
            onComplete?.();
        } catch (error) {
            logger.error('Error setting user type:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (profile?.user_type) {
        navigate(profile.user_type === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        return null;
    }

    return (
        <div className="w-full max-w-md mx-auto">
            {step === 'email' ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative inline-block">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent-500/30">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <div className="absolute -top-1 -end-1 w-8 h-8 rounded-xl bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                                <User className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                            {t.nav.signup}
                        </h2>
                        <p className="text-muted">
                            {t.auth.signupSubtitle}
                        </p>
                    </div>

                    {/* Google OAuth Button */}
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const { error } = await (await import('../../lib/supabase')).supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: `${window.location.origin}/auth/callback`,
                                        queryParams: {
                                            access_type: 'offline',
                                            prompt: 'consent',
                                        },
                                    },
                                });
                                if (error) throw error;
                            } catch {
                                showToast('فشل التسجيل عبر Google', 'error');
                            }
                        }}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>التسجيل بواسطة Google</span>
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white dark:bg-gray-900 text-gray-500">أو</span>
                        </div>
                    </div>

                    <div className="space-y-4">
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

                        <div className="relative">
                            <label className="label flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary-500" />
                                {t.auth.confirmPassword}
                            </label>
                            <input
                                {...register('confirmPassword')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t.auth.confirmPasswordPlaceholder}
                                className="input"
                                dir="ltr"
                            />
                            {errors.confirmPassword && (
                                <p className="text-accent-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
                            <p className="text-accent-600 dark:text-accent-400 text-sm text-center font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary btn-lg w-full group"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{t.auth.createAccount}</span>
                                <ArrowIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-muted">
                        {t.auth.hasAccount}{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                        >
                            {t.nav.login}
                        </button>
                    </p>
                </form>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                            <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                            {t.auth.selectUserType}
                        </h2>
                        <p className="text-muted">
                            {dir === 'rtl' ? 'اختر نوع الحساب الذي يناسبك' : 'Choose the account type that suits you'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {userTypes.map((item) => (
                            <button
                                key={item.type}
                                onClick={() => handleSelectUserType(item.type)}
                                disabled={isLoading}
                                className={`
                                    w-full p-5 rounded-2xl border-2 text-start relative overflow-hidden group
                                    transition-all duration-300
                                    hover:border-transparent hover:shadow-xl hover:-translate-y-1
                                    focus:outline-none ring-offset-2 focus:ring-2
                                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    bg-white dark:bg-dark-800 border-dark-100 dark:border-dark-700
                                `}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-muted text-sm">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full border-2 border-dark-200 dark:border-dark-600 flex items-center justify-center group-hover:border-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors`}>
                                        <ArrowIcon className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <p className="text-center text-sm text-muted">
                        {dir === 'rtl' ? 'يمكنك تغيير نوع حسابك لاحقاً من الإعدادات' : 'You can change your account type later in settings'}
                    </p>
                </div>
            )}
        </div>
    );
}

export default SignupForm;
