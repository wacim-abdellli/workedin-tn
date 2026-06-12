/**
 * MessageBubbleItem.tsx
 * Renders a single message in the thread — handles text, attachments,
 * contract system messages, reply metadata, and all bubble styling.
 * Extracted from the Messages.tsx God Component.
 */
import { Loader2, Trash2, CheckCheck, Clock, FileText, Download, Image as ImageIcon, RefreshCw, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { MessageAudioPlayer } from './MessageAudioPlayer';
import { CollapsibleMessageText } from './CollapsibleMessageText';
import type { Message } from '../../services/messages';
import { useTranslation } from '../../i18n';
import {
    isImageAttachment,
    isAudioAttachment,
    isDeletedMessage,
    getMessageDisplayText,
    getMessageContractSystemKind,
    getMessageReplyMetadata,
    shouldHideAttachmentUrlText,
    resolveMessageAttachmentUrl,
    formatAttachmentSize,
    getAttachmentExtensionLabel,
    resolveSystemMessageText,
    _SYSTEM_MESSAGE_FALLBACKS,
} from '../../lib/messageUtils';
import type { ReplyMetadata } from '../../lib/messageReplies';

type ThreadMessage = Message & { status?: 'sending' | 'failed' };

interface AccentClasses {
    ownBubbleBg: string;
    ownReplyCard: string;
    ownTextMuted: string;
    ownAttachmentCard: string;
    ownAttachmentIcon: string;
    neutralAttachmentIcon: string;
    readReceipt: string;
    replyActionHover: string;
    highlightRing: string;
}

interface MessageBubbleItemProps {
    message: ThreadMessage;
    userId: string;
    deletedMessageLabel: string;
    deletingMessageId: string | null;
    highlightedMessageId: string | null;
    canReplyInSelectedConversation: boolean;
    isFreelancerWorkspace: boolean;
    otherUserAvatarUrl: string | null;
    otherUserName: string;
    accentClasses: AccentClasses;
    onDelete: (message: ThreadMessage) => void;
    onReply: (message: ThreadMessage) => void;
    onScrollToMessage: (messageId: string) => void;
    onOpenImage: (url: string) => void;
    onOpenAttachment: (att: NonNullable<Message['attachments']>[number]) => void;
}

export const MessageBubbleItem = ({
    message,
    userId,
    deletedMessageLabel,
    deletingMessageId,
    highlightedMessageId,
    _canReplyInSelectedConversation,
    isFreelancerWorkspace,
    otherUserAvatarUrl,
    otherUserName,
    accentClasses,
    onDelete,
    _onReply,
    onScrollToMessage,
    onOpenImage,
    onOpenAttachment,
}: MessageBubbleItemProps) => {
    const { tx } = useTranslation();

    const isOwnMessage = message.sender_id === userId;
    const contractSystemMessageKind = getMessageContractSystemKind(message);
    const isContractSystemMessage = Boolean(contractSystemMessageKind);
    const messageText = getMessageDisplayText(message, deletedMessageLabel);
const replyMetadata: ReplyMetadata | null = getMessageReplyMetadata(message, tx) as ReplyMetadata | null;
const shouldRenderMessageText = Boolean(messageText) && !shouldHideAttachmentUrlText(message);
    const attachments = message.attachments ?? [];
    const hasAttachments = attachments.length > 0;
    const imageAttachmentCount = attachments.filter(isImageAttachment).length;
    const hasImageAttachment = imageAttachmentCount > 0;
    const firstImageAttachmentIndex = attachments.findIndex(isImageAttachment);
    const shouldRenderImageCaption = shouldRenderMessageText && hasImageAttachment;
    const shouldRenderStandaloneText = shouldRenderMessageText && !shouldRenderImageCaption;
    const isImageOnlyMessage = !isDeletedMessage(message)
        && !shouldRenderMessageText
        && hasAttachments
        && imageAttachmentCount === attachments.length;

    const isProtectedEvidence = false; // Caller already filters; simplify if needed

    const bubbleCn = isDeletedMessage(message)
        ? 'rounded-full border border-surface surface-sunken text-on-surface-subtle px-3 py-1.5 text-xs'
        : isContractSystemMessage
        ? 'bg-zinc-950/40 border border-white/[0.05] rounded-2xl p-4 min-w-[280px] max-w-[480px] flex flex-col gap-2 shadow-sm'
        : (hasImageAttachment && (isImageOnlyMessage || shouldRenderImageCaption))
        ? (isOwnMessage
            ? `relative ${accentClasses.ownBubbleBg} p-1 overflow-hidden rounded-xl min-w-[95px] rounded-br-sm text-white ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-85' : ''}`
            : `relative border border-white/[0.05] bg-white/[0.025] backdrop-blur-md p-1 overflow-hidden rounded-xl min-w-[95px] rounded-bl-sm text-zinc-100`)
        : isOwnMessage
        ? `relative ${accentClasses.ownBubbleBg} text-white pt-2.5 pr-4 pb-1.5 pl-4 rounded-xl min-w-[95px] rounded-br-sm text-[13px] font-normal leading-relaxed ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-85' : ''}`
        : `relative border border-white/[0.05] bg-white/[0.025] backdrop-blur-md text-zinc-100 pt-2.5 pr-4 pb-1.5 pl-4 rounded-xl min-w-[95px] rounded-bl-sm text-[13px] font-normal leading-relaxed`;

    return (
        <div key={message.id}>
            <div
                id={`message-${message.id}`}
                className={`group/message flex w-full ${isContractSystemMessage ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
                <div
                    className={`relative max-w-[85%] md:max-w-[75%] flex flex-col ${isContractSystemMessage ? 'items-center' : isOwnMessage ? 'items-end' : 'items-start'}`}
                >
                    {/* Delete button for own messages */}
                    {isOwnMessage && !message.status && !message.is_deleted && !isProtectedEvidence ? (
                        <button
                            type="button"
                            onClick={() => onDelete(message)}
                            disabled={deletingMessageId === message.id}
                            aria-label={tx('pages.messages.deleteMessage', undefined, 'Delete message')}
                            className="absolute -left-9 top-2 z-10 h-7 w-7 rounded-full border border-surface surface-sunken text-on-surface-subtle hidden md:flex items-center justify-center hover:text-on-surface hover-surface transition-colors transition-opacity opacity-0 group-hover/message:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                        >
                            {deletingMessageId === message.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                            )}
                        </button>
                    ) : null}

                    <div
                        className={`flex items-end gap-2 ${isContractSystemMessage ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                        {/* Other user avatar */}
                        {!isOwnMessage && !isContractSystemMessage ? (
                            <div className="w-6 h-6 rounded-full surface-sunken overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-on-surface-subtle">
                                <span aria-hidden="true">{otherUserName.charAt(0)}</span>
                                {otherUserAvatarUrl ? (
                                    <img
                                        src={otherUserAvatarUrl}
                                        alt={otherUserName}
                                        className="absolute h-6 w-6 rounded-full object-cover"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                ) : null}
                            </div>
                        ) : null}

                        {/* Bubble */}
                        <div
                            className={`min-w-0 break-words ${bubbleCn} ${highlightedMessageId === message.id ? `ring-1 ${accentClasses.highlightRing}` : ''}`}
                        >
                            {/* Reply preview card */}
                            {replyMetadata ? (
                                <button
                                    type="button"
                                    onClick={() => onScrollToMessage(replyMetadata.messageId)}
                                    className={`mb-1.5 w-full text-left px-2.5 py-1.5 rounded-r-md border-l-[3px] border-t-transparent border-r-transparent border-b-transparent transition-all duration-205 ease-in-out ${
                                        isOwnMessage
                                            ? 'bg-black/20 hover:bg-black/35 text-zinc-300'
                                            : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400'
                                    }`}
                                    style={{
                                        borderLeftColor: 'var(--workspace-primary)'
                                    }}
                                    aria-label={tx('pages.messages.jumpToRepliedMessage', undefined, 'Jump to replied message')}
                                >
                                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--workspace-primary)' }}>
                                        {replyMetadata.senderName}
                                    </p>
                                    <p className="text-[11.5px] truncate text-zinc-300/95 mt-0.5">{replyMetadata.previewText}</p>
                                </button>
                            ) : null}

                            {/* System message content */}
                            {isContractSystemMessage ? (
                                (() => {
                                    const kind = getMessageContractSystemKind(message) || 'delivery';
                                    let IconComponent = FileText;
                                    let iconColorClass = 'text-violet-400 bg-violet-500/10 border-violet-500/20';
                                    
                                    if (kind === 'delivery') {
                                        IconComponent = FileText;
                                        iconColorClass = isOwnMessage ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                                    } else if (kind === 'revision_requested') {
                                        IconComponent = RefreshCw;
                                        iconColorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                                    } else if (kind === 'contract_completed') {
                                        IconComponent = CheckCircle;
                                        iconColorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                                    } else if (kind === 'dispute_opened') {
                                        IconComponent = AlertTriangle;
                                        iconColorClass = 'text-red-400 bg-red-500/10 border-red-500/20';
                                    } else if (kind === 'review_left') {
                                        IconComponent = Star;
                                        iconColorClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
                                    }

                                    let eventTitle = tx('pages.messages.systemEventTitle', undefined, 'System Update');
                                    const eventDescription = resolveSystemMessageText(messageText, kind, tx);
                                    if (kind === 'delivery') {
                                        eventTitle = tx('pages.messages.system.deliveryTitle', undefined, 'Work Delivered');
                                    } else if (kind === 'revision_requested') {
                                        eventTitle = tx('pages.messages.system.revisionTitle', undefined, 'Revision Requested');
                                    } else if (kind === 'contract_completed') {
                                        eventTitle = tx('pages.messages.system.completedTitle', undefined, 'Contract Completed');
                                    } else if (kind === 'dispute_opened') {
                                        eventTitle = tx('pages.messages.system.disputeTitle', undefined, 'Dispute Opened');
                                    } else if (kind === 'review_left') {
                                        eventTitle = tx('pages.messages.system.reviewTitle', undefined, 'Review Submitted');
                                    }

                                    return (
                                        <div className="flex flex-col gap-2 w-full text-zinc-300">
                                            <div className="flex items-center gap-2 select-none">
                                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${iconColorClass}`}>
                                                    <IconComponent className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="font-bold text-[12px] tracking-wide text-zinc-100">{eventTitle}</span>
                                            </div>
                                            {eventDescription && (
                                                <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-[11px] leading-relaxed text-zinc-400 font-mono break-words max-w-full">
                                                    {eventDescription}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : shouldRenderStandaloneText ? (
                                <CollapsibleMessageText
                                    text={messageText ?? ''}
                                    isDeleted={isDeletedMessage(message)}
                                    isOwnMessage={isOwnMessage}
                                />
                            ) : null}

                            {/* Attachments */}
                            {!isDeletedMessage(message) && hasAttachments ? (
                                <div className={`${shouldRenderStandaloneText ? 'mt-3' : ''} space-y-2`}>
                                    {attachments.map((att, index) => {
                                        const attachmentUrl = resolveMessageAttachmentUrl(att.url);
                                        const isImage = isImageAttachment(att);
                                        const isAudio = isAudioAttachment(att);
const extensionLabel = getAttachmentExtensionLabel(att.name, att.type, tx);
const fileSizeLabel = formatAttachmentSize(att.size, tx);
const fileMetaLabel = fileSizeLabel ? `${extensionLabel} • ${fileSizeLabel}` : extensionLabel;

if (isImage) {
    return (
        <button
            key={index}
            type="button"
            onClick={() => onOpenImage(attachmentUrl)}
                                                    aria-label={tx('pages.messages.a11y.openImageAttachment', undefined, 'Open image attachment')}
                                                    className="block w-full max-w-sm rounded-xl overflow-hidden"
                                                >
                                                    <div className="relative">
                                                        <img
                                                            src={attachmentUrl}
                                                            alt={att.name}
                                                            className="w-full max-w-sm rounded-xl object-cover aspect-video cursor-pointer hover:opacity-90 transition-opacity"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = 'none';
                                                                const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="hidden w-full max-w-sm rounded-xl aspect-video items-center justify-center surface-sunken border border-surface text-on-surface-subtle">
                                                            <ImageIcon className="h-6 w-6" />
                                                        </div>
                                                    </div>
                                                    {shouldRenderImageCaption && index === firstImageAttachmentIndex ? (
                                                        <div className={`px-3 py-2 text-sm text-left ${isOwnMessage ? accentClasses.ownTextMuted : 'text-zinc-200'}`}>
                                                            <CollapsibleMessageText
                                                                text={messageText ?? ''}
                                                                isDeleted={isDeletedMessage(message)}
                                                                isOwnMessage={isOwnMessage}
                                                            />
                                                        </div>
                                                    ) : null}
                                                </button>
                                            );
                                        }

                                        if (isAudio) {
                                            return (
                                                <MessageAudioPlayer
                                                    key={index}
                                                    src={attachmentUrl}
                                                    rawSource={att.url}
                                                    name={att.name}
                                                    mimeType={att.type}
                                                    isOwn={isOwnMessage}
                                                    accentVariant={isFreelancerWorkspace ? 'violet' : 'amber'}
                                                />
                                            );
                                        }

                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => onOpenAttachment(att)}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors w-full max-w-sm ${
                                                    isOwnMessage
                                                        ? accentClasses.ownAttachmentCard
                                                        : 'surface-card hover-surface border border-surface'
                                                }`}
                                                aria-label={tx('pages.messages.a11y.openAttachment', undefined, 'Open attachment')}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isOwnMessage ? accentClasses.ownAttachmentIcon : `bg-[var(--color-bg-muted)] ${accentClasses.neutralAttachmentIcon}`}`}>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0 flex-1 text-start">
                                                    <p className="font-semibold text-sm truncate text-on-surface">{att.name || tx('pages.messages.attachmentLabel', undefined, 'Attachment')}</p>
                                                    <p className="text-xs opacity-70 text-on-surface-muted">{fileMetaLabel}</p>
                                                </div>
                                                <Download className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity ml-auto shrink-0 text-on-surface-muted" />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                            {!isContractSystemMessage && !isDeletedMessage(message) && (
                                <div className="absolute bottom-1 right-2.5 flex items-center gap-1 text-[9px] select-none text-zinc-500">
                                    <span>
                                        {new Date(message.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isOwnMessage && (
                                        message.status === 'sending' ? (
                                            <Clock className="h-2.5 w-2.5" />
                                        ) : message.status === 'failed' ? (
                                            <span className="text-red-400 font-bold">!</span>
                                        ) : (
                                            <CheckCheck className={`h-3 w-3 ${message.is_read ? accentClasses.readReceipt : 'text-zinc-600'}`} />
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
