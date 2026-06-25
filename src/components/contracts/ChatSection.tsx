import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, Loader2, FileText, Download, Check, CheckCheck } from 'lucide-react';
import Button from '../ui/Button';
import SanitizedHtml from '../ui/SanitizedHtml';
import { useTranslation } from '../../i18n';
import ErrorBoundary from '../ui/ErrorBoundary';
import type { Message } from '../../types';
interface ChatMessage extends Omit<Message, 'sender'> {
    type?: 'text' | 'system'; // System messages like "Contract Started"
    sender?: {
        full_name: string;
        avatar_url?: string | null;
    } | null;
}

interface ChatSectionProps {
    messages: ChatMessage[];
    currentUser: { id: string } | null;
    onSendMessage: (content: string) => Promise<void>;
    onFileUpload: (file: File) => Promise<void>;
    isSending: boolean;
    isUploading: boolean;
    uploadProgress: number;
    otherUserTyping: boolean;
    onTyping: () => void;
    isLoadingHistory: boolean;
    isComposerDisabled?: boolean;
    disabledReason?: string | null;
    canAttachFiles?: boolean;
}

export default function ChatSection({
    messages,
    currentUser,
    onSendMessage,
    onFileUpload,
    isSending,
    isUploading,
    uploadProgress,
    otherUserTyping,
    onTyping,
    isLoadingHistory,
    isComposerDisabled = false,
    disabledReason = null,
    canAttachFiles = true,
}: ChatSectionProps) {
    const { t, tx } = useTranslation();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages, otherUserTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isComposerDisabled) return;
        if (!newMessage.trim()) return;

        await onSendMessage(newMessage);
        setNewMessage('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isComposerDisabled || !canAttachFiles) {
            e.target.value = '';
            return;
        }

        const file = e.target.files?.[0];
        if (file) {
            await onFileUpload(file);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return t.common?.today || 'Today';
        return date.toLocaleDateString();
    };

    return (
        <div className="flex h-full flex-col bg-gradient-to-b from-card via-card to-surface/60">
            <ErrorBoundary fallback={
                <div className="flex flex-1 items-center justify-center text-muted">
                    <div className="text-center">
                        <p>{t.common?.error || 'Failed to load messages'}</p>
                    </div>
                </div>
            }>
                <div className="relative flex-1 overflow-y-auto px-4 pb-5 pt-4 sm:px-6" role="log" aria-live="polite" aria-relevant="additions text">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary-500/10 to-transparent" />

                    {isLoadingHistory && (
                        <div className="flex justify-center py-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
                                <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                                <span>{tx('common.loading', undefined, 'Loading')}</span>
                            </div>
                        </div>
                    )}

                    {messages.length === 0 && !isLoadingHistory ? (
                        <div className="flex h-full items-center justify-center py-8">
                            <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/15">
                                    <Send className="h-7 w-7 text-primary-400" />
                                </div>
                                <p className="text-base font-medium text-foreground">
                                    {t.contract?.startConversation || 'Start the conversation now'}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {tx('contract.firstMessageHint', undefined, 'Share context, files, and next steps to keep the project moving.')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5 pb-2">
                            {messages.map((message, index) => {
                                const isOwn = message.sender_id === currentUser?.id;
                                const showDateSeparator = index === 0
                                    || new Date(message.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();

                                if (message.type === 'system') {
                                    return (
                                        <div key={message.id} className="flex justify-center py-1">
                                            <SanitizedHtml
                                                as="span"
                                                html={message.content}
                                                className="rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] text-muted-foreground shadow-sm"
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <div key={message.id}>
                                        {showDateSeparator && (
                                            <div className="relative my-5 flex items-center justify-center">
                                                <div className="absolute inset-x-0 h-px bg-border" />
                                                <span className="relative rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground">
                                                    {formatDateSeparator(message.created_at)}
                                                </span>
                                            </div>
                                        )}

                                        <div className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            {!isOwn && (
                                                <div className="mt-auto mb-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
                                                    {message.sender?.avatar_url ? (
                                                        <img src={message.sender.avatar_url} alt={message.sender.full_name || 'User'} className="h-9 w-9 object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-primary-500">
                                                            {message.sender?.full_name?.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className={`flex max-w-[78%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                                <div
                                                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${isOwn
                                                        ? 'rounded-br-md border border-primary-400/30 bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                                                        : 'rounded-bl-md border border-border bg-card text-foreground'
                                                        }`}
                                                >
                                                    {message.content && (
                                                        <SanitizedHtml
                                                            html={message.content}
                                                            className="leading-relaxed whitespace-pre-wrap"
                                                        />
                                                    )}

                                                    {message.attachments && message.attachments.length > 0 && (
                                                        <div className="mt-3 space-y-2">
                                                            {message.attachments.map((file, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className={`flex items-center gap-3 rounded-xl border p-2.5 ${isOwn
                                                                        ? 'border-white/25 bg-black/10'
                                                                        : 'border-border bg-surface'
                                                                        }`}
                                                                >
                                                                    <div className={`rounded-lg p-2 ${isOwn ? 'bg-white/15' : 'bg-card border border-border'}`}>
                                                                        <FileText className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="truncate text-xs font-medium">{file.name}</p>
                                                                        <p className={`text-[10px] ${isOwn ? 'text-white/80' : 'text-muted-foreground'}`}>{file.size}</p>
                                                                    </div>
                                                                    <a
                                                                        href={file.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${isOwn ? 'hover:bg-white/20' : 'hover:bg-muted'}`}
                                                                        aria-label={`تحميل المرفق: ${file.name}`}
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-1.5 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                                                    <span>{formatTime(message.created_at)}</span>
                                                    {isOwn && (
                                                        message.is_read
                                                            ? <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                                                            : <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {otherUserTyping && (
                                <div className="flex justify-start gap-3" role="status" aria-live="polite">
                                    <span className="sr-only">{tx('dynamic_key_229505028')}</span>
                                    <div className="h-9 w-9 rounded-2xl border border-border bg-surface animate-pulse" />
                                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 shadow-sm">
                                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" style={{ animationDelay: '0ms' }} />
                                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" style={{ animationDelay: '150ms' }} />
                                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ErrorBoundary>

            <div className="shrink-0 border-t border-border bg-card/95 px-4 py-4 backdrop-blur sm:px-6">
                {isComposerDisabled && disabledReason ? (
                    <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/12 px-3 py-2 text-xs text-amber-300">
                        {disabledReason}
                    </div>
                ) : null}

                {isUploading && (
                    <div className="mb-3" role="status" aria-live="polite">
                        <div className="mb-1 flex items-center justify-between text-xs text-primary-500">
                            <span>{tx('dynamic_key_1393796300')}</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-end gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        multiple={false}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:border-primary-400/40 hover:text-primary-500"
                        disabled={isUploading || isComposerDisabled || !canAttachFiles}
                        aria-label={t.contract?.attachFile || 'Attach file'}
                    >
                        <Paperclip className="h-5 w-5" />
                    </button>

                    <div className="flex min-h-[48px] flex-1 items-end rounded-xl border border-border bg-surface/80 px-4 py-3 transition-all focus-within:border-primary-400/60 focus-within:ring-2 focus-within:ring-primary-500/20">
                        <textarea
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                if (!isComposerDisabled) {
                                    onTyping();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder={isComposerDisabled
                                ? (disabledReason || tx('pages.messages.readOnlyPlaceholder', undefined, 'This conversation is read-only.'))
                                : (t.contract?.typeMessage || "Write your message here...")}
                            disabled={isComposerDisabled || isSending}
                            className="my-auto max-h-32 w-full resize-none border-none bg-transparent p-0 text-sm leading-relaxed focus:ring-0 scrollbar-hide"
                            rows={1}
                            style={{ minHeight: '24px' }}
                            aria-label={t.contract?.typeMessage || "Write your message here..."}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl p-0"
                        disabled={!newMessage.trim() || isSending || isComposerDisabled}
                        isLoading={isSending}
                        aria-label={t.contract?.sendMessage || 'Send message'}
                    >
                        <Send className="ms-1 h-5 w-5 rtl:rotate-180" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
