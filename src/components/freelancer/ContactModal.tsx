import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Loader2, ArrowUpRight, ShieldCheck,
    Lock, Star, Zap, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { useTranslation } from '../../i18n';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    freelancerId: string;
    freelancerName: string;
    /** Avatar URL of the freelancer (optional) */
    freelancerAvatar?: string | null;
    /** Professional title of the freelancer (optional) */
    freelancerTitle?: string | null;
    /** Hourly rate in TND (optional) */
    hourlyRate?: number | null;
    /** Workspace accent colour */
    accentColor?: string;
}

export default function ContactModal({
    isOpen,
    onClose,
    freelancerId,
    freelancerName,
    freelancerAvatar,
    freelancerTitle,
    hourlyRate,
    accentColor = '#8B5CF6',
}: ContactModalProps) {
    const { user, activeMode } = useAuth();
    const { showToast } = useToast();
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const backdropRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Reset avatar error when modal reopens
    useEffect(() => { if (isOpen) setAvatarError(false); }, [isOpen]);

    if (!isOpen) return null;

    const isGuest = !user;
    const initials = freelancerName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const startConversation = async () => {
        // Hard guard — should never reach RPC if not logged in
        if (!user) {
            showToast(
                tx('pages.freelancerProfile.contactModal.loginRequired', undefined, 'You need to sign in to send a message'),
                'error',
            );
            return;
        }

        if (user.id === freelancerId) {
            showToast(
                tx('pages.freelancerProfile.contactModal.cannotMessageSelf', undefined, 'You cannot message yourself'),
                'warning',
            );
            return;
        }

        setIsCreating(true);
        try {
            let { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
                user1: user.id,
                user2: freelancerId,
                p_scope: activeMode === 'freelancer' ? 'freelancer' : 'client',
            });

            if (error) {
                const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
                if (
                    message.includes('p_scope') ||
                    (message.includes('get_or_create_conversation') && message.includes('does not exist'))
                ) {
                    const legacyResult = await supabase.rpc('get_or_create_conversation', {
                        user1: user.id,
                        user2: freelancerId,
                    });
                    conversationId = legacyResult.data;
                    error = legacyResult.error;
                }
            }

            if (error || !conversationId)
                throw error || new Error(tx('pages.freelancerProfile.contactModal.createFailed', undefined, 'Failed to create conversation'));

            onClose();
            navigate(`/messages?conversation=${conversationId}`);
        } catch (error: any) {
            logger.error('Error starting conversation:', error);
            const msg = error?.message || tx('pages.freelancerProfile.contactModal.startError', undefined, 'Something went wrong while starting the conversation');
            showToast(msg, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current) onClose();
    };

    return (
        <div
            ref={backdropRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(4,4,8,0.78)', backdropFilter: 'blur(14px)' }}
        >
            <div
                className="relative w-full max-w-md overflow-hidden rounded-[2rem] shadow-2xl"
                style={{
                    background: 'linear-gradient(160deg,#18181f 0%,#101015 60%,#0e0e14 100%)',
                    border: `1px solid color-mix(in srgb,${accentColor} 28%,#2a2a35)`,
                    boxShadow: `0 40px 100px -30px color-mix(in srgb,${accentColor} 30%,#000), 0 0 0 1px rgba(255,255,255,0.04)`,
                    animation: 'contactModalIn 0.22s cubic-bezier(0.22,1,0.36,1) both',
                }}
            >
                {/* Glow orb */}
                <div
                    className="pointer-events-none absolute -top-20 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
                    style={{ background: accentColor }}
                />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* ─── Header — Avatar + Name ─── */}
                <div className="relative flex flex-col items-center pb-6 pt-10 px-6 text-center">
                    {/* Avatar */}
                    <div className="relative mb-4">
                        {/* Animated ring */}
                        <div
                            className="absolute -inset-1 rounded-full opacity-60"
                            style={{
                                background: `conic-gradient(from 0deg, ${accentColor}, transparent, ${accentColor})`,
                                animation: 'spin 4s linear infinite',
                                borderRadius: '9999px',
                            }}
                        />
                        <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-black/60">
                            {freelancerAvatar && !avatarError ? (
                                <img
                                    src={freelancerAvatar}
                                    alt={freelancerName}
                                    className="h-full w-full object-cover"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <div
                                    className="h-full w-full flex items-center justify-center text-xl font-bold text-white"
                                    style={{ background: `linear-gradient(135deg, ${accentColor} 0%, color-mix(in srgb,${accentColor} 60%,#000) 100%)` }}
                                >
                                    {initials}
                                </div>
                            )}
                        </div>
                        {/* Online indicator */}
                        <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-black" />
                    </div>

                    <h3 className="text-xl font-black text-white tracking-tight">
                        {tx('pages.freelancerProfile.contactModal.title', { name: freelancerName }, `Message ${freelancerName}`)}
                    </h3>
                    {freelancerTitle && (
                        <p className="mt-0.5 text-sm text-white/50">{freelancerTitle}</p>
                    )}

                    {/* Quick info pills */}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        {hourlyRate != null && hourlyRate > 0 && (
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                                style={{
                                    background: `color-mix(in srgb,${accentColor} 14%,transparent)`,
                                    border: `1px solid color-mix(in srgb,${accentColor} 30%,transparent)`,
                                    color: accentColor,
                                }}
                            >
                                <Zap className="h-3 w-3" />
                                {hourlyRate} TND/hr
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                            <Star className="h-3 w-3 text-amber-400" />
                            Top Rated
                        </span>
                    </div>
                </div>

                {/* ─── Body ─── */}
                <div className="px-6 pb-6 space-y-4">
                    {isGuest ? (
                        /* Guest state */
                        <div
                            className="rounded-2xl p-5 text-center space-y-3"
                            style={{
                                background: 'rgba(245,158,11,0.07)',
                                border: '1px solid rgba(245,158,11,0.2)',
                            }}
                        >
                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                                <Lock className="h-5 w-5 text-amber-400" />
                            </div>
                            <p className="text-sm font-semibold text-amber-300">Sign in required</p>
                            <p className="text-xs text-amber-200/70">
                                {tx('pages.freelancerProfile.contactModal.loginPrompt', undefined, 'Create an account or sign in to send a message to this freelancer.')}
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-2 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                style={{ background: accentColor }}
                            >
                                Sign in to message
                                <ArrowUpRight className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        /* Logged-in state */
                        <div
                            className="rounded-2xl p-4"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                    style={{
                                        background: `color-mix(in srgb,${accentColor} 16%,transparent)`,
                                        color: accentColor,
                                    }}
                                >
                                    <MessageSquare className="h-4.5 w-4.5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-white/90">
                                        {tx('pages.freelancerProfile.contactModal.body', { name: freelancerName }, `Your message will open a secure, private conversation with ${freelancerName}.`)}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs text-white/45">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" />
                                        {tx('pages.freelancerProfile.contactModal.trustNote', undefined, 'End-to-end workspace messaging. No spam.')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CTA row — only when logged in */}
                    {!isGuest && (
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white/70 transition-all hover:bg-white/8 hover:text-white"
                            >
                                {tx('common.cancel', undefined, 'Cancel')}
                            </button>
                            <button
                                type="button"
                                disabled={isCreating}
                                onClick={startConversation}
                                className="h-12 flex-[2] inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
                                style={{
                                    background: `linear-gradient(135deg, ${accentColor} 0%, color-mix(in srgb,${accentColor} 75%,#7c3aed) 100%)`,
                                    boxShadow: `0 12px 28px -14px color-mix(in srgb,${accentColor} 70%,transparent)`,
                                }}
                            >
                                {isCreating
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <MessageSquare className="h-4 w-4" />}
                                {isCreating
                                    ? tx('pages.freelancerProfile.contactModal.opening', undefined, 'Opening...')
                                    : tx('pages.freelancerProfile.contactModal.startAction', undefined, 'Start conversation')}
                                {!isCreating && <ArrowUpRight className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Animation keyframes injected inline for standalone usage */}
            <style>{`
                @keyframes contactModalIn {
                    from { opacity: 0; transform: scale(0.94) translateY(10px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
