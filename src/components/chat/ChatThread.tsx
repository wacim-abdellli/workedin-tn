import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { MessageSquare } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { useTranslation } from '../../i18n';

export interface ChatThreadMessage {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    isDeleted?: boolean;
    status?: 'sending' | 'sent' | 'read' | 'failed';
    attachments?: { id?: string; url?: string | null; name?: string | null; type?: string | null; size?: number | string | null }[];
}

interface ChatThreadProps {
    messages: ChatThreadMessage[];
    currentUserId: string;
    isLoading?: boolean;
    otherUserAvatar?: string | null;
    onDownloadAttachment?: (attachment: any) => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
    messages,
    currentUserId,
    isLoading = false,
    otherUserAvatar,
    onDownloadAttachment
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const { tx } = useTranslation();

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = new Date(message.timestamp).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {} as Record<string, ChatThreadMessage[]>);

    return (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 bg-[var(--color-bg-base)]">
            {isLoading ? (
                <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-brand-primary)', borderTopColor: 'transparent' }} />
                </div>
            ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center p-4">
                    <EmptyState
                        icon={MessageSquare}
                        title={tx('pages.messages.startConversationTitle', undefined, 'No messages yet')}
                        description={tx('pages.messages.startConversationDesc', undefined, 'Start the conversation by sending a message or file below.')}
                        className="w-full max-w-md border-0 bg-transparent shadow-none"
                    />
                </div>
            ) : (
                <div className="flex flex-col min-h-full justify-end">
                    {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date} className="mb-6 flex flex-col">
                            {/* Date Divider */}
                            <div className="relative mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />
                                </div>
                                <div className="relative bg-[var(--color-bg-base)] px-4">
                                    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                                        {date}
                                    </span>
                                </div>
                            </div>

                            {/* Messages for this date */}
                            <div className="flex flex-col gap-1">
                                <AnimatePresence initial={false}>
                                    {dateMessages.map((msg) => (
                                        <MessageBubble
                                            key={msg.id}
                                            text={msg.text}
                                            isOwnMessage={msg.senderId === currentUserId}
                                            isDeleted={msg.isDeleted}
                                            timestamp={msg.timestamp}
                                            status={msg.status}
                                            attachments={msg.attachments}
                                            senderAvatar={msg.senderId === currentUserId ? null : otherUserAvatar}
                                            onDownloadAttachment={onDownloadAttachment}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            )}
        </div>
    );
};
