import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, Loader2, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { useTranslation } from '../../i18n';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    freelancerId: string;
    freelancerName: string;
}

export default function ContactModal({ isOpen, onClose, freelancerId, freelancerName }: ContactModalProps) {
    const { user } = useAuth();
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
            const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
                user1: user.id,
                user2: freelancerId
            });

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
            <div className="w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#171421] shadow-[0_32px_90px_-36px_rgba(15,13,22,0.7)] animate-in fade-in zoom-in duration-200">
                <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(139,92,246,0.16)_0%,rgba(245,158,11,0.08)_100%)] px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                                {tx('pages.freelancerProfile.contactModal.sectionLabel', undefined, 'Direct message')}
                            </div>
                            <h3 className="mt-2 text-2xl font-black leading-tight text-white">
                                {tx('pages.freelancerProfile.contactModal.title', { name: freelancerName }, `Message ${freelancerName}`)}
                            </h3>
                        </div>
                        <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-white/70 transition-colors hover:bg-white dark:bg-gray-800/5 hover:text-white">
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
                        <div className="rounded-2xl border border-white/8 bg-white dark:bg-gray-800/[0.03] p-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--workspace-primary)]/14 text-[color:var(--workspace-primary)]">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm leading-7 text-white/80">
                                        {tx('pages.freelancerProfile.contactModal.body', { name: freelancerName }, `A direct conversation with ${freelancerName} will open in your messages workspace.`)}
                                    </p>
                                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white dark:bg-gray-800/[0.03] px-3 py-1.5 text-xs font-medium text-white/60">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                        {tx('pages.freelancerProfile.contactModal.trustNote', undefined, 'Use Khedma messages to keep project communication organized.')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" className="h-12 rounded-2xl px-6" onClick={onClose}>
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            className="h-12 rounded-2xl px-6"
                            onClick={startConversation}
                            disabled={!user || isCreating}
                            leftIcon={isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                            rightIcon={!isCreating ? <ArrowUpRight className="w-4 h-4" /> : undefined}
                        >
                            {isCreating
                                ? tx('pages.freelancerProfile.contactModal.opening', undefined, 'Opening...')
                                : tx('pages.freelancerProfile.contactModal.startAction', undefined, 'Start conversation')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
