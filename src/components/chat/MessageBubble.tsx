import React from 'react';
import { m } from 'framer-motion';
import { Check, CheckCheck, Clock, FileText, Download } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface Attachment {
    id?: string;
    url?: string | null;
    name?: string | null;
    type?: string | null;
    size?: number | string | null;
}

interface MessageBubbleProps {
    text: string;
    isOwnMessage: boolean;
    isDeleted?: boolean;
    timestamp: string;
    status?: 'sending' | 'sent' | 'read' | 'failed';
    attachments?: Attachment[];
    senderAvatar?: string | null;
    onDownloadAttachment?: (attachment: Attachment) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    text,
    isOwnMessage,
    isDeleted = false,
    timestamp,
    status = 'sent',
    attachments = [],
    senderAvatar,
    onDownloadAttachment
}) => {
    const { tx } = useTranslation();
    // Determine colors based on design tokens
    const bubbleBg = isOwnMessage 
        ? 'var(--color-bg-elevated)' 
        : 'var(--color-bg-muted)';
        
    const textColor = isOwnMessage 
        ? 'var(--color-text-primary)' 
        : 'var(--color-text-primary)';
        
    const timeColor = isOwnMessage 
        ? 'var(--color-text-tertiary)' 
        : 'var(--color-text-tertiary)';

    return (
        <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
        >
            <div className={`flex max-w-[75%] gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar for received messages */}
                {!isOwnMessage && (
                    <div className="flex-shrink-0 mt-auto mb-1">
                        {senderAvatar ? (
                            <img src={senderAvatar} alt={tx('pages.messages.senderAlt', undefined, 'Sender')} className="h-8 w-8 rounded-full object-cover border" style={{ borderColor: 'var(--color-border-subtle)' }} />
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                                <span className="text-xs font-medium text-[var(--color-text-tertiary)]">U</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    {/* The Bubble */}
                    <div
                        className={`relative rounded-xl pt-2.5 pr-4 pb-1.5 pl-4 shadow-sm ${
                            isOwnMessage ? 'rounded-br-sm' : 'rounded-bl-sm'
                        }`}
                        style={{ backgroundColor: bubbleBg, color: textColor }}
                    >
                        {isDeleted ? (
                            <p className="italic opacity-70 text-sm">{tx('pages.messages.deletedMessage', undefined, 'This message was deleted')}</p>
                        ) : (
                            <>
                                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                                    {text}
                                    {!isDeleted && <span className="inline-block w-14 h-1 select-none pointer-events-none" />}
                                </p>
                                
                                {/* Attachments */}
                                {attachments.length > 0 && (
                                    <div className="mt-3 flex flex-col gap-2">
                                        {attachments.map((att, i) => (
                                            <div 
                                                key={att.id || i} 
                                                className="flex items-center gap-3 rounded-lg bg-black/10 px-3 py-2 cursor-pointer hover:bg-black/20 transition-colors border border-black/5"
                                                onClick={() => onDownloadAttachment && onDownloadAttachment(att)}
                                            >
                                                <FileText className="h-5 w-5 opacity-80" />
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="truncate text-sm font-medium">{att.name || tx('pages.messages.attachmentLabel', undefined, 'Attachment')}</p>
                                                </div>
                                                <Download className="h-4 w-4 opacity-70" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Metadata (Time & Status) */}
                        <div className="absolute bottom-1 right-2.5 flex items-center gap-1 text-[9px] select-none opacity-60">
                            <span>{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOwnMessage && (
                                <span className="flex items-center">
                                    {status === 'sending' && <Clock className="h-2.5 w-2.5 opacity-60" />}
                                    {status === 'sent' && <Check className="h-2.5 w-2.5 opacity-80" />}
                                    {status === 'read' && <CheckCheck className="h-3 w-3 text-blue-400" />}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </m.div>
    );
};
