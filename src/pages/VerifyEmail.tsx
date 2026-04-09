import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { sanitizeText } from '../lib/sanitization';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { AuthShell } from '../components/auth';

function VerifyEmail() {
    const { t } = useTranslation();
    const { showToast } = useToast();
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
        <AuthShell
            badge={t.verifyEmail.title}
            title={t.verifyEmail.title}
            description={t.verifyEmail.subtitle.replace('{{email}}', email)}
            highlights={[
                {
                    icon: Mail,
                    title: t.verifyEmail.resend,
                    description: t.verifyEmail.subtitle.replace('{{email}}', email),
                },
                {
                    icon: ShieldCheck,
                    title: t.verifyEmail.checkSpam,
                    description: t.verifyEmail.noEmail,
                    tone: 'cyan',
                },
                {
                    icon: Sparkles,
                    title: t.verifyEmail.resendSuccess,
                    description: t.verifyEmail.resendCooldown.replace('{{seconds}}', '60'),
                    tone: 'accent',
                },
            ]}
            topAction={
                <Link
                    to="/signup"
                    className="inline-flex items-center rounded-full border border-white/12 bg-card/6 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-card/10 hover:text-white"
                >
                    {t.verifyEmail.wrongEmail}
                </Link>
            }
        >
            <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
                    <Mail className="h-10 w-10 text-white" />
                </div>

                <h1 className="mb-3 text-2xl font-bold text-[#171420] dark:text-white">
                    {t.verifyEmail.title}
                </h1>

                <p className="mb-6 text-[#625c78] dark:text-[#a7a2ba]">
                    {t.verifyEmail.subtitle.replace('{{email}}', email)}
                </p>

                <div className="space-y-3">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handleResend}
                        isLoading={isResending}
                        disabled={cooldown > 0}
                    >
                        {cooldown > 0 ? (
                            t.verifyEmail.resendCooldown.replace('{{seconds}}', String(cooldown))
                        ) : (
                            t.verifyEmail.resend
                        )}
                    </Button>

                    <Link to="/signup">
                        <Button variant="outline" size="lg" className="w-full">
                            {t.verifyEmail.wrongEmail}
                        </Button>
                    </Link>
                </div>

                <div className="mt-6 rounded-xl border border-primary-200/50 bg-primary-50/50 p-4 dark:border-primary-800/30 dark:bg-primary-900/20">
                    <div className="flex items-start gap-3 text-start">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
                        <p className="text-sm text-primary-900 dark:text-primary-100">
                            {t.verifyEmail.checkSpam}
                        </p>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}

export default VerifyEmail;
