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
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
            `}</style>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#0c0c0c',
                fontFamily: "'Outfit', sans-serif",
                padding: '20px',
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: 480,
                    background: '#111',
                    border: '1px solid #222',
                    borderRadius: 20,
                    padding: '48px 40px',
                    textAlign: 'center',
                }}>
                    <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
                        <Logo variant="full" size="md" mode="client" />
                    </div>

                    <div style={{
                        width: 64,
                        height: 64,
                        margin: '0 auto 24px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Mail style={{ width: 32, height: 32, color: '#8b5cf6' }} />
                    </div>

                    <h1 style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: '#fff',
                        marginBottom: 12,
                        letterSpacing: '-0.5px',
                    }}>
                        {t.verifyEmail.title}
                    </h1>

                    <p style={{
                        fontSize: 15,
                        color: '#888',
                        lineHeight: 1.6,
                        marginBottom: 32,
                    }}>
                        {tx('verifyEmail.subtitle', { email }, `We sent a verification link to ${email}. Click it to activate your account.`)}
                    </p>

                    <button
                        onClick={handleResend}
                        disabled={isResending || cooldown > 0}
                        style={{
                            width: '100%',
                            padding: 14,
                            background: (isResending || cooldown > 0) ? '#9a5608' : '#E8820C',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: 800,
                            color: '#fff',
                            cursor: (isResending || cooldown > 0) ? 'not-allowed' : 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            letterSpacing: '-0.3px',
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                        }}
                        onMouseEnter={e => { if (!isResending && cooldown === 0) (e.target as HTMLElement).style.background = '#d4750a'; }}
                        onMouseLeave={e => { if (!isResending && cooldown === 0) (e.target as HTMLElement).style.background = '#E8820C'; }}
                    >
                        {isResending ? (
                            <>
                                <RefreshCw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                                {tx('support.form.sending', undefined, 'Sending...')}
                            </>
                        ) : cooldown > 0 ? (
                            tx('verifyEmail.resendCooldown', { seconds: String(cooldown) }, `Resend in ${cooldown} seconds`)
                        ) : (
                            <>
                                <RefreshCw style={{ width: 16, height: 16 }} />
                                {t.verifyEmail.resend}
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => navigate('/signup')}
                        style={{
                            width: '100%',
                            padding: 14,
                            background: 'transparent',
                            border: '1px solid #2a2a2a',
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#aaa',
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            letterSpacing: '-0.3px',
                        }}
                        onMouseEnter={e => {
                            (e.target as HTMLElement).style.background = '#1a1a1a';
                            (e.target as HTMLElement).style.borderColor = '#333';
                        }}
                        onMouseLeave={e => {
                            (e.target as HTMLElement).style.background = 'transparent';
                            (e.target as HTMLElement).style.borderColor = '#2a2a2a';
                        }}
                    >
                        {t.verifyEmail.wrongEmail}
                    </button>

                    <div style={{
                        marginTop: 24,
                        padding: '14px 16px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        textAlign: 'left',
                    }}>
                        <AlertCircle style={{ width: 18, height: 18, color: '#60a5fa', flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 13, color: '#93c5fd', lineHeight: 1.5 }}>
                            {t.verifyEmail.checkSpam} {t.verifyEmail.noEmail}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default VerifyEmail;
