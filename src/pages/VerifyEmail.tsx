import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { sanitizeText } from '../lib/sanitization';
import { useToast } from '../components/ui/Toast';
import { Logo } from '../components/ui/Logo';

function VerifyEmail() {
    const { t, tx } = useTranslation();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const rawEmail = searchParams.get('email') || '';
    const email = sanitizeText(rawEmail);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (!email) {
            showToast(t.verifyEmail.noEmail, 'error');
            return;
        }

        setIsResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;

            showToast(t.verifyEmail.resendSuccess, 'success');
            setCooldown(60);
        } catch (error) {
            const message = error instanceof Error ? error.message : t.common.error;
            showToast(message, 'error');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-base)] px-5">
            <div className="w-full max-w-[480px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-2xl p-12 text-center shadow-xl">
                <div className="mb-8 flex justify-center">
                    <Logo variant="full" size="md" mode="client" />
                </div>

                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-purple-500/10">
                    <Mail className="w-8 h-8 text-purple-500" />
                </div>

                <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--color-text-primary)] mb-3">
                    {t.verifyEmail.title}
                </h1>

                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed mb-8">
                    {tx('verifyEmail.subtitle', { email }, `We sent a verification link to ${email}. Click it to activate your account.`)}
                </p>

                <button
                    onClick={handleResend}
                    disabled={isResending || cooldown > 0}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-extrabold text-white tracking-tight transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] mb-3"
                    style={{ background: '#E8820C' }}
                >
                    {isResending ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" />{tx('support.form.sending', undefined, 'Sending...')}</>
                    ) : cooldown > 0 ? (
                        tx('verifyEmail.resendCooldown', { seconds: String(cooldown) }, `Resend in ${cooldown} seconds`)
                    ) : (
                        <><RefreshCw className="w-4 h-4" />{t.verifyEmail.resend}</>
                    )}
                </button>

                <button
                    onClick={() => navigate('/signup')}
                    className="w-full py-3.5 rounded-xl text-[15px] font-bold text-[var(--color-text-secondary)] border border-[var(--color-border-default)] bg-transparent hover:bg-[var(--color-bg-muted)] hover:border-[var(--color-border-strong)] transition-all duration-200"
                >
                    {t.verifyEmail.wrongEmail}
                </button>

                <div className="mt-6 p-4 rounded-xl flex items-start gap-3 text-left bg-blue-500/10 border border-blue-500/20">
                    <AlertCircle className="w-[18px] h-[18px] text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-blue-300 leading-relaxed">
                        {t.verifyEmail.checkSpam} {t.verifyEmail.noEmail}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VerifyEmail;
