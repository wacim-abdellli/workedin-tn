import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';

function VerifyEmail() {
    const { t, dir } = useTranslation();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
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
        <div
            className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f7f5ff] via-white to-primary-50 p-4 dark:from-[#09070f] dark:via-[#0f0d16] dark:to-primary-950"
            dir={dir}
        >
            <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/90 p-8 text-center shadow-2xl shadow-primary-500/10 backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:shadow-none">
                <img
                    src="/logos/logo-social.svg"
                    alt="Khedma TN"
                    width="88"
                    height="88"
                    className="mx-auto mb-6 h-[88px] w-[88px] rounded-[24px] shadow-xl shadow-primary-500/15"
                />

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
                            <ArrowLeft className={`h-5 w-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
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
        </div>
    );
}

export default VerifyEmail;
