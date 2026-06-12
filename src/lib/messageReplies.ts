export type ReplyMetadata = {
    messageId: string;
    senderName: string;
    previewText: string;
};

const REPLY_TOKEN_PREFIX = '[[reply:';
const REPLY_TOKEN_SUFFIX = ']]';
const MAX_REPLY_PREVIEW_LENGTH = 120;

const truncateText = (value: string, maxLength: number) => (
    value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value
);

type TxFn = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

export const parseReplyMetadataFromContent = (content: string | null | undefined, tx?: TxFn) => {
    const rawContent = String(content || '');

    if (!rawContent.startsWith(REPLY_TOKEN_PREFIX)) {
        return { replyMetadata: null as ReplyMetadata | null, bodyText: rawContent };
    }

    const suffixIndex = rawContent.indexOf(REPLY_TOKEN_SUFFIX);
    if (suffixIndex <= REPLY_TOKEN_PREFIX.length) {
        return { replyMetadata: null as ReplyMetadata | null, bodyText: rawContent };
    }

    const encodedPayload = rawContent.slice(REPLY_TOKEN_PREFIX.length, suffixIndex);
    const bodyText = rawContent.slice(suffixIndex + REPLY_TOKEN_SUFFIX.length).trimStart();

    try {
        const parsedPayload = JSON.parse(decodeURIComponent(encodedPayload)) as Partial<ReplyMetadata>;
        if (
            !parsedPayload
            || typeof parsedPayload.messageId !== 'string'
            || typeof parsedPayload.senderName !== 'string'
            || typeof parsedPayload.previewText !== 'string'
        ) {
            return { replyMetadata: null as ReplyMetadata | null, bodyText: rawContent };
        }

        const replyMetadata: ReplyMetadata = {
            messageId: parsedPayload.messageId,
            senderName: truncateText(parsedPayload.senderName.trim() || (tx ? tx('pages.messages.unknownSender', undefined, 'User') : 'User'), 60),
            previewText: truncateText(parsedPayload.previewText.trim() || (tx ? tx('pages.messages.attachmentFallback', undefined, 'Attachment') : 'Attachment'), MAX_REPLY_PREVIEW_LENGTH),
        };

        return { replyMetadata, bodyText };
    } catch {
        return { replyMetadata: null as ReplyMetadata | null, bodyText: rawContent };
    }
};

export const serializeReplyMetadataIntoContent = (bodyText: string, replyMetadata: ReplyMetadata | null, tx?: TxFn) => {
    const normalizedBody = bodyText.trim();
    if (!replyMetadata) return normalizedBody;

    const payload = encodeURIComponent(JSON.stringify({
        messageId: replyMetadata.messageId,
        senderName: truncateText(replyMetadata.senderName.trim() || (tx ? tx('pages.messages.unknownSender', undefined, 'User') : 'User'), 60),
        previewText: truncateText(replyMetadata.previewText.trim() || (tx ? tx('pages.messages.attachmentFallback', undefined, 'Attachment') : 'Attachment'), MAX_REPLY_PREVIEW_LENGTH),
    }));

    return `${REPLY_TOKEN_PREFIX}${payload}${REPLY_TOKEN_SUFFIX}${normalizedBody ? ` ${normalizedBody}` : ''}`;
};
