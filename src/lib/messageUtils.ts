/**
 * messageUtils.ts
 * Pure utility functions for the messaging system.
 * Extracted from Messages.tsx to eliminate the God Component anti-pattern.
 */

import { supabase } from './supabase';
import { normalizeMimeType } from './audioProcessing';
import { parseReplyMetadataFromContent } from './messageReplies';
import type { Message } from '../services/messages';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageAttachment = NonNullable<Message['attachments']>[number];

export type ThreadMessage = Message & {
    status?: 'sending' | 'failed';
};

export type ContractSystemMessageKind =
    | 'delivery'
    | 'revision_requested'
    | 'contract_completed'
    | 'dispute_opened'
    | 'review_left';

// ─── Constants ─────────────────────────────────────────────────────────────────

export const MESSAGE_ATTACHMENT_ACCEPT = [
    'image/*',
    'application/pdf',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/webm',
    'video/mp4',
    '.doc',
    '.docx',
    '.txt',
    '.gif',
    '.m4a',
    '.mp3',
    '.wav',
    '.ogg',
    '.mp4',
    '.webm',
].join(',');

export const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'canceled', 'disputed']);

const GENERIC_CONTRACT_TITLES = new Set([
    'unknown project',
    'contract project',
    'untitled project',
    'untitled job',
    'unknown job',
]);

// ─── Attachment Helpers ────────────────────────────────────────────────────────

export const isImageAttachment = (attachment: MessageAttachment): boolean =>
    Boolean(attachment.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(attachment.name || ''));

export const isAudioAttachment = (attachment: MessageAttachment): boolean =>
    Boolean(attachment.type?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|webm)$/i.test(attachment.name || ''));

export const formatAttachmentSize = (size: string | number | null | undefined): string | null => {
    const parsedSize = typeof size === 'string' ? Number(size) : size;
    if (!Number.isFinite(parsedSize) || !parsedSize || parsedSize <= 0) return null;
    if (parsedSize < 1024) return `${parsedSize} B`;
    if (parsedSize < 1024 * 1024) return `${(parsedSize / 1024).toFixed(1)} KB`;
    return `${(parsedSize / (1024 * 1024)).toFixed(1)} MB`;
};

export const getAttachmentExtensionLabel = (
    name: string | null | undefined,
    mimeType: string | null | undefined
): string => {
    const rawName = String(name || '').trim();
    if (rawName.includes('.')) {
        const ext = rawName.split('.').pop();
        if (ext) return ext.toUpperCase();
    }

    const normalizedMimeType = normalizeMimeType(mimeType);
    if (normalizedMimeType.includes('/')) {
        return normalizedMimeType.split('/')[1]?.toUpperCase() || 'FILE';
    }

    return 'FILE';
};

export const extractMessageAttachmentPath = (value: string | null | undefined): string | null => {
    const raw = String(value || '').trim();
    if (!raw) return null;

    if (!/^(https?:)/i.test(raw)) {
        const normalized = raw.replace(/^\/+/, '');
        const withoutPublicPrefix = normalized.replace(/^storage\/v1\/object\/public\/message_attachments\//i, '');
        const objectPath = withoutPublicPrefix.startsWith('message_attachments/')
            ? withoutPublicPrefix.slice('message_attachments/'.length)
            : withoutPublicPrefix;
        return objectPath || null;
    }

    try {
        const parsed = new URL(raw);
        const decodedPath = decodeURIComponent(parsed.pathname);
        const marker = '/message_attachments/';
        const markerIndex = decodedPath.indexOf(marker);
        if (markerIndex === -1) return null;
        const candidate = decodedPath.slice(markerIndex + marker.length);
        return candidate || null;
    } catch {
        return null;
    }
};

export const resolveMessageAttachmentUrl = (url: string | null | undefined): string => {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^(https?:|blob:|data:)/i.test(raw)) return raw;

    const normalized = raw.replace(/^\/+/, '');
    const withoutPublicPrefix = normalized.replace(/^storage\/v1\/object\/public\/message_attachments\//i, '');
    const objectPath = withoutPublicPrefix.startsWith('message_attachments/')
        ? withoutPublicPrefix.slice('message_attachments/'.length)
        : withoutPublicPrefix;

    if (!objectPath) return raw;

    return supabase.storage
        .from('message_attachments')
        .getPublicUrl(objectPath)
        .data.publicUrl;
};

// ─── Text / String Helpers ─────────────────────────────────────────────────────

export const truncateText = (text: string | null | undefined, max: number): string => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '...' : text;
};

export const sanitizeContractTitle = (value: string | null | undefined): string => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    return GENERIC_CONTRACT_TITLES.has(normalized.toLowerCase()) ? '' : normalized;
};

// ─── System Message Parsing ────────────────────────────────────────────────────

export const resolveContractSystemMessage = (
    rawBodyText: string
): { kind: ContractSystemMessageKind; text: string } | null => {
    const trimmed = rawBodyText.trim();
    if (!trimmed) return null;

    const markerMatch = trimmed.match(/^\[\[([a-z_]+)\]\]\s*(.*)$/i);
    if (!markerMatch) return null;

    const marker = markerMatch[1].toLowerCase();
    const details = markerMatch[2]?.trim() || '';

    const kindMap: Record<string, { kind: ContractSystemMessageKind; fallback: string }> = {
        delivery: { kind: 'delivery', fallback: 'Work delivered and ready for review' },
        revision_requested: { kind: 'revision_requested', fallback: 'Revision requested by client' },
        contract_completed: { kind: 'contract_completed', fallback: 'Contract completed and payment released' },
        dispute_opened: { kind: 'dispute_opened', fallback: 'Dispute opened for this contract' },
        review_left: { kind: 'review_left', fallback: 'Review submitted' },
    };

    const entry = kindMap[marker];
    if (!entry) return null;

    return { kind: entry.kind, text: details || entry.fallback };
};

export const isDeletedMessage = (message: ThreadMessage | null | undefined): boolean =>
    Boolean(message?.is_deleted);

export const getMessageDisplayText = (
    message: ThreadMessage | null | undefined,
    deletedLabel: string
): string | null => {
    if (!message) return null;
    if (isDeletedMessage(message)) return deletedLabel;

    const bodyText = parseReplyMetadataFromContent(message.content).bodyText;
    const contractSystemMessage = resolveContractSystemMessage(bodyText);
    return contractSystemMessage?.text || bodyText;
};

export const getMessageContractSystemKind = (
    message: ThreadMessage | null | undefined
): ContractSystemMessageKind | null => {
    if (!message || isDeletedMessage(message)) return null;
    return resolveContractSystemMessage(parseReplyMetadataFromContent(message.content).bodyText)?.kind || null;
};

export const getMessageReplyMetadata = (message: ThreadMessage | null | undefined) => {
    if (!message || isDeletedMessage(message)) return null;
    return parseReplyMetadataFromContent(message.content).replyMetadata;
};

// ─── URL / Download Helpers ────────────────────────────────────────────────────

export const openBlobAsPreviewOrDownload = (blob: Blob, fileName: string, canPreviewInTab: boolean): void => {
    const objectUrl = URL.createObjectURL(blob);

    if (canPreviewInTab) {
        const openedWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');
        if (!openedWindow) {
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = fileName;
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } else {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    window.setTimeout(() => { URL.revokeObjectURL(objectUrl); }, 60_000);
};

// ─── Conversation Sorting ──────────────────────────────────────────────────────

export const sortConversationsByActivity = (
    items: import('../services/messages').Conversation[],
    contractStatusById: Record<string, string> = {}
): import('../services/messages').Conversation[] => {
    return [...items].sort((a, b) => {
        const aStatus = a.contract_id ? contractStatusById[a.contract_id] ?? '' : '';
        const bStatus = b.contract_id ? contractStatusById[b.contract_id] ?? '' : '';
        const aTerminal = TERMINAL_STATUSES.has(aStatus);
        const bTerminal = TERMINAL_STATUSES.has(bStatus);
        if (aTerminal !== bTerminal) return aTerminal ? 1 : -1;
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
    });
};

// ─── URL Normalization ─────────────────────────────────────────────────────────

export const normalizeComparableUrl = (value: string): string =>
    value.trim().replace(/[?#].*$/, '').replace(/\/+$/, '');

export const shouldHideAttachmentUrlText = (message: ThreadMessage | null | undefined): boolean => {
    if (!message || isDeletedMessage(message)) return false;

    const content = parseReplyMetadataFromContent(message.content).bodyText.trim();
    if (!content || !/^https?:\/\/\S+$/i.test(content)) return false;

    const attachments = message.attachments ?? [];
    if (attachments.length === 0) return false;

    const normalizedContent = normalizeComparableUrl(content);
    return attachments.some((attachment) => {
        if (!attachment.url) return false;
        return normalizeComparableUrl(attachment.url) === normalizedContent;
    });
};

// ─── Thread Preview ────────────────────────────────────────────────────────────

export const getThreadPreview = (
    threadMessages: ThreadMessage[],
    deletedLabel: string
): { last_message_text: string | null; last_message_at: string | null } => {
    const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
    const rawPreviewText = getMessageDisplayText(lastMessage, deletedLabel)?.trim() || '';

    let resolvedPreviewText: string | null = rawPreviewText;

    if (!resolvedPreviewText && lastMessage && !isDeletedMessage(lastMessage)) {
        const lastMessageAttachments = lastMessage.attachments ?? [];
        if (lastMessageAttachments.some((attachment) => isAudioAttachment(attachment))) {
            resolvedPreviewText = 'Audio note';
        } else if (lastMessageAttachments.some((attachment) => isImageAttachment(attachment))) {
            resolvedPreviewText = 'Image';
        } else if (lastMessageAttachments.length > 0) {
            resolvedPreviewText = 'Attachment';
        }
    }

    return {
        last_message_text: resolvedPreviewText,
        last_message_at: lastMessage?.created_at ?? null,
    };
};

// ─── Lifecycle Banner ──────────────────────────────────────────────────────────

export const getLifecycleBannerClassName = (tone: import('../lib/messagingLifecycle').MessagingPolicyTone): string => {
    switch (tone) {
        case 'success': return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
        case 'warning': return 'border-amber-500/40 bg-amber-500/10 text-amber-100';
        case 'danger': return 'border-red-500/40 bg-red-500/10 text-red-100';
        case 'info': return 'border-blue-500/40 bg-blue-500/10 text-blue-100';
        case 'none':
        default: return 'border-surface surface-sunken text-on-surface-muted';
    }
};

// ─── Error Detection ───────────────────────────────────────────────────────────

export const isMissingSchemaColumnError = (error: unknown, tableName: string, columnName: string): boolean => {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { message?: unknown };
    const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : '';
    if (
        message.includes('could not find')
        && message.includes('schema cache')
        && message.includes(tableName.toLowerCase())
        && message.includes(columnName.toLowerCase())
    ) return true;

    return message.includes('does not exist')
        && message.includes(tableName.toLowerCase())
        && message.includes(columnName.toLowerCase());
};

export const isEnumValueUnsupportedError = (error: unknown, enumName: string, enumValue: string): boolean => {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { message?: unknown };
    const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : '';
    return message.includes('invalid input value for enum')
        && message.includes(enumName.toLowerCase())
        && message.includes(enumValue.toLowerCase());
};

// ─── UUID Validation ───────────────────────────────────────────────────────────

const UUID_LIKE_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuidLike = (value: string | null | undefined): value is string => {
    if (!value) return false;
    return UUID_LIKE_REGEX.test(String(value).trim());
};

export const extractRpcConversationId = (payload: unknown): string | null => {
    if (typeof payload === 'string' && payload.trim().length > 0) return payload;
    if (payload && typeof payload === 'object') {
        const candidate = payload as { id?: unknown; conversation_id?: unknown };
        if (typeof candidate.id === 'string' && candidate.id.trim().length > 0) return candidate.id;
        if (typeof candidate.conversation_id === 'string' && candidate.conversation_id.trim().length > 0) return candidate.conversation_id;
    }
    return null;
};
