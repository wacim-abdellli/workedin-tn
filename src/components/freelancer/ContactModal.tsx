 import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, Loader2, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { useTranslation } from '../../i18n';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    freelancerId: string;
    freelancerName: string;
    accentColor?: string;
}

export default function ContactModal({ isOpen, onClose, freelancerId, freelancerName, accentColor = '#8B5CF6' }: ContactModalProps) {
    const { user, activeMode } = useAuth();
    const { showToast } = useToast();
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;

    const startConversation = async () => {
        if (!user) {
            showToast(tx('pages.freelancerProfile.contactModal.loginRequired', undefined, 'You need to sign in to send a message'), 'error');
            return;
        }

        if (user.id === freelancerId) {
            showToast(tx('pages.freelancerProfile.contactModal.cannotMessageSelf', undefined, 'You cannot message yourself'), 'warning');
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
                if (message.includes('p_scope') || (message.includes('get_or_create_conversation') && message.includes('does not exist'))) {
                    const legacyResult = await supabase.rpc('get_or_create_conversation', {
                        user1: user.id,
                        user2: freelancerId,
                    });
                    conversationId = legacyResult.data;
                    error = legacyResult.error;
                }
            }

            if (error || !conversationId) throw error || new Error(tx('pages.freelancerProfile.contactModal.createFailed', undefined, 'Failed to create conversation'));

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <div
                className="w-full max-w-lg overflow-hidden rounded-[1.75rem] border bg-[#1a1a1a] shadow-[0_32px_90px_-36px_rgba(15,13,22,0.7)] animate-in fade-in zoom-in duration-200"
                style={{
                    borderColor: `color-mix(in srgb, ${accentColor} 30%, #3a3a3a)`,
                }}
            >
                <div
                    className="border-b border-white/8 px-6 py-5"
                    style={{
                        background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 22%, #1a1a1a) 0%, #232323 65%, #1d1d1d 100%)`,
                    }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                                {tx('pages.freelancerProfile.contactModal.sectionLabel', undefined, 'Direct message')}
                            </div>
                            <h3 className="mt-2 text-2xl font-black leading-tight text-white">
                                {tx('pages.freelancerProfile.contactModal.title', { name: freelancerName }, `Message ${freelancerName}`)}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-white/12 bg-black/15 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {!user ? (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                            {tx('pages.freelancerProfile.contactModal.loginPrompt', undefined, 'You need to sign in before contacting freelancers.')}
                        </div>
                    ) : (
                            <div className="rounded-2xl border border-white/10 bg-[#202020] p-4">
                            <div className="flex items-start gap-3">
                                <div
                                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                                    style={{
                                        background: `color-mix(in srgb, ${accentColor} 16%, transparent)`,
                                        color: accentColor,
                                    }}
                                >
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm leading-7 text-white/80">
                                        {tx('pages.freelancerProfile.contactModal.body', { name: freelancerName }, `A direct conversation with ${freelancerName} will open in your messages workspace.`)}
                                    </p>
                                    <div
                                        className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                                        style={{
                                            borderColor: `color-mix(in srgb, ${accentColor} 28%, #3a3a3a)`,
                                            background: 'rgba(0,0,0,0.18)',
                                            color: 'rgba(255,255,255,0.75)',
                                        }}
                                    >
                                        <ShieldCheck className="h-3.5 w-3.5" style={{ color: accentColor }} />
                                        {tx('pages.freelancerProfile.contactModal.trustNote', undefined, 'Use WorkedIn messages to keep project communication organized.')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            className="h-12 rounded-2xl px-6 border border-white/15 text-white/80 transition-colors hover:text-white hover:bg-white/5"
                            onClick={onClose}
                        >
                            {tx('common.cancel', undefined, 'Cancel')}
                        </button>
                        <button
                            type="button"
                            className="h-12 rounded-2xl px-6 inline-flex items-center justify-center gap-2 text-white font-semibold transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                                background: accentColor,
                                boxShadow: `0 14px 32px -22px color-mix(in srgb, ${accentColor} 70%, transparent)`,
                            }}
                            onClick={startConversation}
                            disabled={!user || isCreating}
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                            {isCreating
                                ? tx('pages.freelancerProfile.contactModal.opening', undefined, 'Opening...')
                                : tx('pages.freelancerProfile.contactModal.startAction', undefined, 'Start conversation')}
                            {!isCreating ? <ArrowUpRight className="w-4 h-4" /> : null}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

