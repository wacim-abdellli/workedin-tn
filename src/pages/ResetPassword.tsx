import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { AuthShell } from '../components/auth';

// Password validation schema
const getResetPasswordSchema = (tx: any) => z.object({
  password: z.string()
    .min(8, tx('auth.validation.password.minLength', undefined, 'Password must be at least 8 characters'))
    .regex(/[A-Z]/, tx('auth.validation.password.uppercase', undefined, 'Must contain at least one uppercase letter'))
    .regex(/[a-z]/, tx('auth.validation.password.lowercase', undefined, 'Must contain at least one lowercase letter'))
    .regex(/[0-9]/, tx('auth.validation.password.number', undefined, 'Must contain at least one number')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: tx('auth.validation.password.match', undefined, 'Passwords do not match'),
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<ReturnType<typeof getResetPasswordSchema>>;

// Password strength calculator
const getPasswordStrength = (password: string, tx: any): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: tx('auth.passwordStrength.weak', undefined, 'Weak'), color: 'bg-red-500' };
    if (score <= 4) return { score, label: tx('auth.passwordStrength.medium', undefined, 'Medium'), color: 'bg-yellow-500' };
    return { score, label: tx('auth.passwordStrength.strong', undefined, 'Strong'), color: 'bg-green-500' };
};

const ResetPassword = () => {
    const { t, tx } = useTranslation() as any;
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);
    const [isCheckingToken, setIsCheckingToken] = useState(true);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(getResetPasswordSchema(tx)),
    });

    const password = watch('password', '');
    const passwordStrength = getPasswordStrength(password, tx);

    // Check for valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                // Check if URL contains recovery type
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const type = hashParams.get('type');
                const accessToken = hashParams.get('access_token');

                if (type === 'recovery' && accessToken) {
                    // Valid recovery link
                    setIsValidToken(true);
                } else if (!session) {
                    // No session and no recovery token
                    setIsValidToken(false);
                }
            } catch (error) {
                logger.error('Session check error:', error);
                setIsValidToken(false);
            } finally {
                setIsCheckingToken(false);
            }
        };

        checkSession();
    }, []);

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) {
                if (error.message.includes('expired') || error.message.includes('invalid')) {
                    setIsValidToken(false);
                    showToast(t.auth.resetPassword.linkExpired, 'error');
                    return;
                }
                throw error;
            }

            // Sign out all other sessions for security
            await supabase.auth.signOut({ scope: 'others' });

            setIsSuccess(true);
            showToast(t.auth.resetPassword.success, 'success');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error('Password update error:', error);
            showToast(msg || t.auth.resetPassword.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isCheckingToken) {
        return (
            <AuthShell
                badge={t.auth.resetPassword.setNewTitle}
                title={tx('pages.resetPassword.title', undefined, 'Choose a new password')}
                description={tx('pages.resetPassword.subtitle', undefined, 'We are validating your recovery session before letting you update your password.')}
                highlights={[
                    { icon: KeyRound, title: t.auth.resetPassword.setNewTitle, description: tx('pages.resetPassword.subtitle', undefined, 'We are validating your recovery session before letting you update your password.') },
                    { icon: ShieldCheck, title: tx('pages.resetPassword.securityTitle', undefined, 'Security first'), description: tx('pages.resetPassword.securityDescription', undefined, 'Recovery links stay temporary and tied to your active session.'), tone: 'cyan' },
                    { icon: Sparkles, title: tx('pages.resetPassword.requirementsTitle', undefined, 'Strong password rules'), description: tx('pages.resetPassword.requirementsDescription', undefined, 'Use a password with upper/lowercase letters and numbers.'), tone: 'accent' },
                ]}
                topAction={
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                        {tx('pages.resetPassword.backToLogin', undefined, 'Back to sign in')}
                    </button>
                }
            >
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{tx('pages.resetPassword.validating', undefined, 'Validating your recovery link...')}</p>
                </div>
            </AuthShell>
        );
    }

    // Invalid/expired token state
    if (!isValidToken) {
        return (
            <AuthShell
                badge={t.auth.resetPassword.linkExpired}
                title={tx('pages.resetPassword.expiredTitle', undefined, 'This recovery link is no longer valid')}
                description={tx('pages.resetPassword.expiredDescription', undefined, 'Request a fresh reset link and we will send you back through a clean password recovery flow.')}
                highlights={[
                    { icon: AlertTriangle, title: t.auth.resetPassword.linkExpired, description: tx('pages.resetPassword.expiredDescription', undefined, 'Request a fresh reset link and we will send you back through a clean password recovery flow.') },
                    { icon: ShieldCheck, title: tx('pages.resetPassword.securityTitle', undefined, 'Security first'), description: tx('pages.resetPassword.securityDescription', undefined, 'Recovery links stay temporary and tied to your active session.'), tone: 'cyan' },
                    { icon: Sparkles, title: tx('pages.resetPassword.retryTitle', undefined, 'Start again cleanly'), description: tx('pages.resetPassword.retryDescription', undefined, 'Generate a new recovery email instead of fighting with an expired token.'), tone: 'accent' },
                ]}
                topAction={
                    <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                        {tx('pages.resetPassword.requestNew', undefined, 'Request new link')}
                    </button>
                }
            >
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            {tx('auth.resetPassword.expiredLink', undefined, 'Expired Link')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            {tx('auth.resetPassword.invalidLinkDesc', undefined, 'Invalid reset link.')}
                        </p>
                        <Button
                            onClick={() => navigate('/forgot-password')}
                            className="w-full"
                        >{tx('auth.resetPassword.requestNewLink', undefined, 'Request New Link')}</Button>
                    </div>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            badge={t.auth.resetPassword.setNewTitle}
            title={tx('pages.resetPassword.title', undefined, 'Choose a new password')}
            description={tx('pages.resetPassword.subtitle', undefined, 'Use a strong password so you can return to your workspace with confidence.')}
            highlights={[
                { icon: KeyRound, title: t.auth.resetPassword.setNewTitle, description: tx('pages.resetPassword.subtitle', undefined, 'Use a strong password so you can return to your workspace with confidence.') },
                { icon: ShieldCheck, title: tx('pages.resetPassword.securityTitle', undefined, 'Security first'), description: tx('pages.resetPassword.securityDescription', undefined, 'Recovery links stay temporary and tied to your active session.'), tone: 'cyan' },
                { icon: Sparkles, title: tx('pages.resetPassword.requirementsTitle', undefined, 'Strong password rules'), description: tx('pages.resetPassword.requirementsDescription', undefined, 'Use a password with upper/lowercase letters and numbers.'), tone: 'accent' },
            ]}
            topAction={
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                    {tx('pages.resetPassword.backToLogin', undefined, 'Back to sign in')}
                </button>
            }
        >
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                    {!isSuccess ? (
                        <>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {tx('auth.resetPassword.setNew', undefined, 'Set New Password')}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {tx('auth.resetPassword.setNewDesc', undefined, 'Enter your new password')}
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
                                {/* New Password Field */}
                                <div>
                                    <label htmlFor="password" className="label">{tx('auth.password.new', undefined, 'New Password')}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            {...register('password')}
                                            className={`input ps-10 pe-12 ${errors.password ? 'input-error' : ''}`}
                                            placeholder={tx('auth.passwordPlaceholder.new', undefined, 'Enter your new password')}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && <p className="form-error">{errors.password.message}</p>}

                                    {/* Password Strength Indicator */}
                                    {password && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-500">{tx('auth.passwordStrength.label', undefined, 'Password strength')}</span>
                                                <span className={`text-xs font-medium ${passwordStrength.color === 'bg-red-500' ? 'text-red-500' :
                                                    passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-500' :
                                                        'text-green-500'
                                                    }`}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="label">
                                        {tx('auth.confirmPassword', undefined, 'Confirm Password')}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            {...register('confirmPassword')}
                                            className={`input ps-10 pe-12 ${errors.confirmPassword ? 'input-error' : ''}`}
                                            placeholder={tx('auth.confirmPasswordPlaceholder', undefined, 'Re-enter your password')}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
                                </div>

                                {/* Password Requirements */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {tx('auth.passwordRequirements.title', undefined, 'Password Requirements:')}
                                    </p>
                                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <li className={password.length >= 8 ? 'text-green-600' : ''}>
                                            {tx('auth.passwordRequirements.req1', undefined, '• At least 8 characters')}
                                        </li>
                                        <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                                            {tx('auth.passwordRequirements.req2', undefined, '• At least one uppercase letter')}
                                        </li>
                                        <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                                            {tx('auth.passwordRequirements.req3', undefined, '• At least one lowercase letter')}
                                        </li>
                                        <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                                            {tx('auth.passwordRequirements.req4', undefined, '• At least one number')}
                                        </li>
                                    </ul>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                                            {t.auth.loggingOut}
                                        </>
                                    ) : (
                                        t.auth.resetPassword.setNewTitle
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        /* Success State */
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                {tx('auth.resetPassword.success', undefined, 'Password changed successfully!')}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {tx('auth.resetPassword.successDesc', undefined, 'You can now log in with your new password.')}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {tx('auth.resetPassword.redirecting', undefined, 'Redirecting to login...')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthShell>
    );
};

export default ResetPassword;
