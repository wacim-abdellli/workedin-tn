/**
 * MessageBubbleItem.tsx
 * Renders a single message in the thread — handles text, attachments,
 * contract system messages, reply metadata, and all bubble styling.
 * Extracted from the Messages.tsx God Component.
 */
import { Loader2, Trash2, CheckCheck, Clock, CornerUpLeft, FileText, Download, Image as ImageIcon } from 'lucide-react';
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
    canReplyInSelectedConversation,
    isFreelancerWorkspace,
    otherUserAvatarUrl,
    otherUserName,
    accentClasses,
    onDelete,
    onReply,
    onScrollToMessage,
    onOpenImage,
    onOpenAttachment,
}: MessageBubbleItemProps) => {
    const { tx } = useTranslation();

    const isOwnMessage = message.sender_id === userId;
    const contractSystemMessageKind = getMessageContractSystemKind(message);
    const isContractSystemMessage = Boolean(contractSystemMessageKind);
    const messageText = getMessageDisplayText(message, deletedMessageLabel);
    const replyMetadata: ReplyMetadata | null = getMessageReplyMetadata(message) as ReplyMetadata | null;
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
        ? 'flex items-center gap-2 rounded-full border border-white/[0.07] bg-[var(--color-bg-elevated)] px-4 py-2 text-[12px] font-medium text-[#8A8880] tracking-wide'
        : (hasImageAttachment && (isImageOnlyMessage || shouldRenderImageCaption))
        ? (isOwnMessage
            ? `${accentClasses.ownBubbleBg} p-1 overflow-hidden rounded-2xl rounded-br-sm text-white ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-80' : ''}`
            : 'surface-card border border-surface p-1 overflow-hidden rounded-2xl rounded-bl-sm text-on-surface')
        : isOwnMessage
        ? `${accentClasses.ownBubbleBg} text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-md ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-80' : ''}`
        : 'surface-card border border-surface text-on-surface px-4 py-2 rounded-2xl rounded-bl-sm text-sm';

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
                                    className={`mb-2 w-full rounded-lg border px-2 py-1.5 text-left ${isOwnMessage ? accentClasses.ownReplyCard : 'border-surface surface-sunken text-on-surface-muted'}`}
                                    aria-label={tx('pages.messages.jumpToRepliedMessage', undefined, 'Jump to replied message')}
                                >
                                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90">{replyMetadata.senderName}</p>
                                    <p className="text-xs truncate opacity-90">{replyMetadata.previewText}</p>
                                </button>
                            ) : null}

                            {/* System message content */}
                            {isContractSystemMessage ? (
                                <>
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px]">⚡</span>
                                    <span>{messageText}</span>
                                </>
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
                                        const extensionLabel = getAttachmentExtensionLabel(att.name, att.type);
                                        const fileSizeLabel = formatAttachmentSize(att.size);
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
                        </div>

                        {/* Read receipt */}
                        {isOwnMessage && !isDeletedMessage(message) && !message.status ? (
                            <CheckCheck className={`h-3 w-3 mb-1 ${message.is_read ? accentClasses.readReceipt : 'text-zinc-600'}`} />
                        ) : null}
                    </div>

                    {/* Timestamp row */}
                    <p className={`mt-1 text-[11px] text-zinc-600 flex items-center gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <span>
                            {new Date(message.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwnMessage && message.status === 'sending' ? <Clock className="h-3 w-3" /> : null}
                        {isOwnMessage && message.status === 'failed' ? (
                            <span className="text-red-400">{tx('pages.messages.sendFailed', undefined, 'Failed')}</span>
                        ) : null}
                    </p>

                    {/* Reply action */}
                    {!isDeletedMessage(message) && canReplyInSelectedConversation ? (
                        <button
                            type="button"
                            onClick={() => onReply(message)}
                            className={`mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-600 transition-colors opacity-0 group-hover/message:opacity-100 ${accentClasses.replyActionHover} ${isOwnMessage ? 'ms-auto' : ''}`}
                            aria-label={tx('pages.messages.replyAction', undefined, 'Reply to message')}
                        >
                            <CornerUpLeft className="h-3 w-3" />
                            <span>{tx('pages.messages.reply', undefined, 'Reply')}</span>
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
