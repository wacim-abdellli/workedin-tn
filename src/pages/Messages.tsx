import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Search,
    Send,
    Paperclip,
    Trash2,
    ArrowLeft,
    FileText,
    Loader2,
    Mic,
    Square,
    X,
    FileAudio,
    Clock,
    Play,
    Pause,
    AlertCircle,
    MoreVertical,
    CheckCheck,
    CornerUpLeft,
    Download,
    Image as ImageIcon,
    User,
    Mail,
    Flag,
    CheckCircle,
    AlertTriangle,
    Archive,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ReviewForm } from '../components/ui/Reviews';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { supabase } from '../lib/supabase';
import {
    getContractConversationInboxPatch,
    repairContractConversationInboxRows,
} from '../lib/contractConversationInbox';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
    getConversations,
    getMessages,
    deleteMessage,
    sendMessage,
    sendContractMessage,
    uploadMessageAttachment,
    markConversationRead,
    subscribeToConversation,
    subscribeToConversations,
    type ConversationScope,
    type Conversation,
    type Message,
} from '../services/messages';
import { getJobById } from '../services/jobs';
import { submitReview as submitReviewRequest } from '../services/reviews';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useReadReceipts } from '../hooks/useReadReceipts';
import { useTranslation } from '../i18n';
import ErrorBoundary from '../components/ErrorBoundary';
import { validateUploadSelection } from '../lib/uploadPolicy';
import ContractDetailsSidebar from '@/components/contracts/ContractDetailsSidebar';
import {
    normalizeContractStatus,
    resolveMessagingLifecyclePolicy,
    type ContractMessagingStatus,
    type MessagingPolicyTone,
} from '../lib/messagingLifecycle';
import {
    canClientAcceptForStatus,
    canClientRequestChangesForStatus,
    canFreelancerDeliverForStatus,
    canOpenDisputeForStatus,
} from '../lib/contractWorkflow';
import { detectContractChatSafetyRisk } from '../lib/contractChatSafety';
import { isProtectedContractEvidenceMessage } from '../lib/contractEvidence';
import { validateUploadPayload } from '../lib/uploadPolicy';
import { getErrorMessage } from '../lib/errorMessage';

import {
  fileToBase64,
  base64ToFile,
  blobToBase64,
  normalizeMimeType,
  canonicalizeVoiceMimeType,
  getAudioExtensionFromMimeType,
  buildVoiceMemoFile,
  hasSignature,
  detectAudioMimeTypeFromBuffer,
  inferAudioMimeType,
  formatAudioTime
} from '../lib/audioProcessing';

const MESSAGE_ATTACHMENT_ACCEPT = [
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

const extractMessageAttachmentPath = (value: string | null | undefined): string | null => {
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

const truncateText = (text: string | null | undefined, max: number): string => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '...' : text;
};

const GENERIC_CONTRACT_TITLES = new Set([
    'unknown project',
    'contract project',
    'untitled project',
    'untitled job',
    'unknown job',
]);

const sanitizeContractTitle = (value: string | null | undefined): string => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';

    return GENERIC_CONTRACT_TITLES.has(normalized.toLowerCase()) ? '' : normalized;
};

type MessageAttachment = NonNullable<Message['attachments']>[number];

const isImageAttachment = (attachment: MessageAttachment) =>
    attachment.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(attachment.name || '');

const isAudioAttachment = (attachment: MessageAttachment) =>
    attachment.type?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|webm)$/i.test(attachment.name || '');

const formatAttachmentSize = (size: string | number | null | undefined) => {
    const parsedSize = typeof size === 'string' ? Number(size) : size;
    if (!Number.isFinite(parsedSize) || !parsedSize || parsedSize <= 0) return null;
    if (parsedSize < 1024) return `${parsedSize} B`;
    if (parsedSize < 1024 * 1024) return `${(parsedSize / 1024).toFixed(1)} KB`;
    return `${(parsedSize / (1024 * 1024)).toFixed(1)} MB`;
};

const getAttachmentExtensionLabel = (name: string | null | undefined, mimeType: string | null | undefined) => {
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

import { MessageAudioPlayer } from '../components/chat/MessageAudioPlayer';
const resolveMessageAttachmentUrl = (url: string | null | undefined) => {
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

const openBlobAsPreviewOrDownload = (blob: Blob, fileName: string, canPreviewInTab: boolean) => {
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

    window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 60_000);
};

type ThreadMessage = Message & {
    status?: 'sending' | 'failed';
};

const CollapsibleMessageText = ({ text, isDeleted, isOwnMessage }: { text: string, isDeleted: boolean, isOwnMessage: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 300;

    if (!text || text.length <= MAX_LENGTH) {
        return (
            <p className={`whitespace-pre-wrap break-words ${isDeleted ? 'italic leading-tight' : ''}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }}>
                {text}
            </p>
        );
    }

    const displayText = isExpanded ? text : `${text.slice(0, MAX_LENGTH)}...`;

    return (
        <div>
            <p className={`whitespace-pre-wrap break-words ${isDeleted ? 'italic leading-tight' : ''}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }}>
                {displayText}
            </p>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-1 text-[11px] font-semibold tracking-wide uppercase opacity-70 hover:opacity-100 transition-opacity ${isOwnMessage ? 'text-white' : 'text-amber-500'}`}
            >
                {isExpanded ? 'See less' : 'See more'}
            </button>
        </div>
    );
};

type ContractSessionMeta = {
    id: string;
    status: string | null;
    title: string | null;
    amount: number | null;
    total_amount: number | null;
    revision_requests_count?: number | null;
    max_revision_rounds?: number | null;
    funded_at?: string | null;
    delivery_submitted_at?: string | null;
    review_due_at?: string | null;
    revision_requested_at?: string | null;
    job_deadline: string | null;
    client_id: string | null;
    freelancer_id: string | null;
    job_id: string | null;
    proposal_id?: string | null;
    linked_contract_id?: string | null;
};

type ContractMilestone = {
    id: string;
    contract_id: string | null;
    title: string | null;
    description: string | null;
    amount: number | null;
    status: string | null;
    due_date: string | null;
    order_index: number | null;
    created_at: string | null;
};

type ContractSharedFile = {
    id: string;
    name: string;
    url: string;
    type: string | null;
    size: number | string | null;
    uploadedAt: string | null;
    senderName: string;
};

import {
  type ReplyMetadata,
  parseReplyMetadataFromContent,
  serializeReplyMetadataIntoContent
} from '../lib/messageReplies';
const MAX_CACHED_CONVERSATIONS = 50;
const MAX_CACHED_MESSAGES = 200;
const ENABLE_MESSAGES_SESSION_CACHE = false;

const getConversationsCacheKey = (userId: string, modeKey: string) => `messages:conversations:${userId}:${modeKey}`;
const getMessagesCacheKey = (conversationId: string) => `messages:thread:${conversationId}`;

const resolveConversationScopes = (activeMode: string | null | undefined): ConversationScope[] => {
    if (activeMode === 'freelancer') return ['freelancer', 'contract', 'shared'];
    if (activeMode === 'client') return ['client', 'contract', 'shared'];
    return ['client', 'freelancer', 'contract', 'shared'];
};

const isConversationVisibleInMode = (
    conversation: Conversation,
    userId: string | undefined,
    activeMode: string | null | undefined,
) => {
    if (!userId) return true;
    if (activeMode !== 'client' && activeMode !== 'freelancer') return true;

    const isParticipant1 = conversation.participant_1 === userId;
    const myInbox = isParticipant1
        ? conversation.inbox_participant_1
        : conversation.inbox_participant_2;

    // Prefer per-participant inbox columns when present.
    if (myInbox === 'client' || myInbox === 'freelancer' || myInbox === 'shared') {
        return myInbox === activeMode || myInbox === 'shared';
    }
    // Legacy fallback for rows that still need role-specific inbox repair.
    if (myInbox === 'contract') return true;

    // Legacy fallback when inbox columns are absent.
    const scope = conversation.conversation_scope;
    if (scope === 'shared') return true;
    if (scope === 'client' || scope === 'freelancer') return scope === activeMode;
    if (scope === 'contract') return true;

    return true;
};

const resolveModeCacheKey = (activeMode: string | null | undefined) => {
    if (activeMode === 'client' || activeMode === 'freelancer') return activeMode;
    return 'all';
};

const readSessionCache = <T,>(key: string): T | null => {
    if (!ENABLE_MESSAGES_SESSION_CACHE) return null;
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : null;
    } catch {
        return null;
    }
};

const writeSessionCache = (key: string, value: unknown) => {
    if (!ENABLE_MESSAGES_SESSION_CACHE) return;
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore session storage write failures.
    }
};

const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'canceled', 'disputed']);

const sortConversationsByActivity = (items: Conversation[], contractStatusById: Record<string, string> = {}) => {
    return [...items].sort((a, b) => {
        const aStatus = a.contract_id ? contractStatusById[a.contract_id] ?? '' : '';
        const bStatus = b.contract_id ? contractStatusById[b.contract_id] ?? '' : '';
        const aTerminal = TERMINAL_STATUSES.has(aStatus);
        const bTerminal = TERMINAL_STATUSES.has(bStatus);
        // Terminal conversations always sink to the bottom
        if (aTerminal !== bTerminal) return aTerminal ? 1 : -1;
        // Within same group: sort by last activity
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
    });
};

const isDeletedMessage = (message: ThreadMessage | null | undefined) => Boolean(message?.is_deleted);

const normalizeComparableUrl = (value: string) => (
    value
        .trim()
        .replace(/[?#].*$/, '')
        .replace(/\/+$/, '')
);

const shouldHideAttachmentUrlText = (message: ThreadMessage | null | undefined) => {
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

type ContractSystemMessageKind = 'delivery' | 'revision_requested' | 'contract_completed' | 'dispute_opened' | 'review_left';

const resolveContractSystemMessage = (rawBodyText: string): { kind: ContractSystemMessageKind; text: string } | null => {
    const trimmed = rawBodyText.trim();
    if (!trimmed) return null;

    const markerMatch = trimmed.match(/^\[\[([a-z_]+)\]\]\s*(.*)$/i);
    if (!markerMatch) return null;

    const marker = markerMatch[1].toLowerCase();
    const details = markerMatch[2]?.trim() || '';

    if (marker === 'delivery') {
        return {
            kind: 'delivery',
            text: details || 'Work delivered and ready for review',
        };
    }

    if (marker === 'revision_requested') {
        return {
            kind: 'revision_requested',
            text: details || 'Revision requested by client',
        };
    }

    if (marker === 'contract_completed') {
        return {
            kind: 'contract_completed',
            text: details || 'Contract completed and payment released',
        };
    }

    if (marker === 'dispute_opened') {
        return {
            kind: 'dispute_opened',
            text: details || 'Dispute opened for this contract',
        };
    }

    if (marker === 'review_left') {
        return {
            kind: 'review_left',
            text: details || 'Review submitted',
        };
    }

    return null;
};

const getMessageDisplayText = (message: ThreadMessage | null | undefined, deletedLabel: string) => {
    if (!message) return null;
    if (isDeletedMessage(message)) return deletedLabel;

    const bodyText = parseReplyMetadataFromContent(message.content).bodyText;
    const contractSystemMessage = resolveContractSystemMessage(bodyText);
    return contractSystemMessage?.text || bodyText;
};

const getMessageContractSystemKind = (message: ThreadMessage | null | undefined): ContractSystemMessageKind | null => {
    if (!message || isDeletedMessage(message)) return null;
    return resolveContractSystemMessage(parseReplyMetadataFromContent(message.content).bodyText)?.kind || null;
};

const getMessageReplyMetadata = (message: ThreadMessage | null | undefined) => {
    if (!message || isDeletedMessage(message)) return null;
    return parseReplyMetadataFromContent(message.content).replyMetadata;
};

const getThreadPreview = (threadMessages: ThreadMessage[], deletedLabel: string) => {
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

const getLifecycleBannerClassName = (tone: MessagingPolicyTone) => {
    switch (tone) {
        case 'success':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
        case 'warning':
            return 'border-amber-500/40 bg-amber-500/10 text-amber-100';
        case 'danger':
            return 'border-red-500/40 bg-red-500/10 text-red-100';
        case 'info':
            return 'border-blue-500/40 bg-blue-500/10 text-blue-100';
        case 'none':
        default:
            return 'border-surface surface-sunken text-on-surface-muted';
    }
};

const isMissingSchemaColumnError = (error: unknown, tableName: string, columnName: string): boolean => {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { message?: unknown };
    const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : '';
    if (
        message.includes('could not find')
        && message.includes('schema cache')
        && message.includes(tableName.toLowerCase())
        && message.includes(columnName.toLowerCase())
    ) {
        return true;
    }

    return message.includes('does not exist')
        && message.includes(tableName.toLowerCase())
        && message.includes(columnName.toLowerCase());
};

const isEnumValueUnsupportedError = (error: unknown, enumName: string, enumValue: string): boolean => {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { message?: unknown };
    const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : '';
    return message.includes('invalid input value for enum')
        && message.includes(enumName.toLowerCase())
        && message.includes(enumValue.toLowerCase());
};

type ContractConversationLookupRow = {
    id: string;
    participant_1: string;
    participant_2: string;
    contract_id: string | null;
    last_message_text: string | null;
    last_message_at: string | null;
    unread_count_1: number | null;
    unread_count_2: number | null;
    created_at: string;
    updated_at: string;
    conversation_scope?: ConversationScope | null;
    inbox_participant_1?: string | null;
    inbox_participant_2?: string | null;
};

const extractRpcConversationId = (payload: unknown): string | null => {
    if (typeof payload === 'string' && payload.trim().length > 0) return payload;
    if (payload && typeof payload === 'object') {
        const candidate = payload as { id?: unknown; conversation_id?: unknown };
        if (typeof candidate.id === 'string' && candidate.id.trim().length > 0) return candidate.id;
        if (typeof candidate.conversation_id === 'string' && candidate.conversation_id.trim().length > 0) return candidate.conversation_id;
    }
    return null;
};

const UUID_LIKE_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuidLike = (value: string | null | undefined): value is string => {
    if (!value) return false;
    return UUID_LIKE_REGEX.test(String(value).trim());
};

const hydrateConversationRow = async (
    userId: string,
    row: ContractConversationLookupRow,
): Promise<Conversation> => {
    const otherUserId = row.participant_1 === userId ? row.participant_2 : row.participant_1;

    let profile: { id: string; full_name: string | null; avatar_url: string | null; username?: string | null } | null = null;
    if (otherUserId) {
        const publicProfileResult = await supabase
            .from('public_profiles')
            .select('id, full_name, avatar_url, username')
            .eq('id', otherUserId)
            .maybeSingle();

        if (publicProfileResult.data) {
            profile = publicProfileResult.data;
        } else {
            const profileResult = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', otherUserId)
                .maybeSingle();

            if (profileResult.data) {
                profile = profileResult.data;
            }
        }
    }

    const isParticipant1 = row.participant_1 === userId;

    return {
        id: row.id,
        participant_1: row.participant_1,
        participant_2: row.participant_2,
        contract_id: row.contract_id,
        last_message_text: row.last_message_text,
        last_message_at: row.last_message_at,
        unread_count_1: row.unread_count_1 ?? 0,
        unread_count_2: row.unread_count_2 ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        conversation_scope: row.conversation_scope ?? 'shared',
        inbox_participant_1: row.inbox_participant_1 ?? undefined,
        inbox_participant_2: row.inbox_participant_2 ?? undefined,
        otherUser: {
            id: profile?.id || otherUserId || '',
            full_name: profile?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url || null,
            username: profile?.username || null,
        },
        unread_count: isParticipant1 ? (row.unread_count_1 ?? 0) : (row.unread_count_2 ?? 0),
    };
};

const fetchConversationById = async (
    userId: string,
    conversationId: string,
): Promise<Conversation | null> => {
    const buildLookup = (includeScopeColumns: boolean) => {
        const selectColumns = includeScopeColumns
            ? 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2'
            : 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at';

        return supabase
            .from('conversations')
            .select(selectColumns)
            .eq('id', conversationId)
            .maybeSingle();
    };

    let lookupResult = await buildLookup(true);

    const needsLegacySelect = (
        isMissingSchemaColumnError(lookupResult.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(lookupResult.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(lookupResult.error, 'conversations', 'inbox_participant_2')
    );

    if (needsLegacySelect) {
        lookupResult = await buildLookup(false);
    }

    const row = lookupResult.data as ContractConversationLookupRow | null;
    if (!row) return null;
    if (row.participant_1 !== userId && row.participant_2 !== userId) return null;

    const [repairedRow] = await repairContractConversationInboxRows([row]);
    return hydrateConversationRow(userId, repairedRow ?? row);
};

const fetchConversationByContractId = async (
    userId: string,
    contractId: string
): Promise<Conversation | null> => {
    const buildLookup = (
        participantColumn: 'participant_1' | 'participant_2',
        includeScopeColumns: boolean
    ) => {
        const selectColumns = includeScopeColumns
            ? 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2'
            : 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at';

        return supabase
            .from('conversations')
            .select(selectColumns)
            .eq('contract_id', contractId)
            .eq(participantColumn, userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
    };

    let [participant1Result, participant2Result] = await Promise.all([
        buildLookup('participant_1', true),
        buildLookup('participant_2', true),
    ]);

    const needsLegacySelect = (
        isMissingSchemaColumnError(participant1Result.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(participant1Result.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(participant1Result.error, 'conversations', 'inbox_participant_2')
        || isMissingSchemaColumnError(participant2Result.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(participant2Result.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(participant2Result.error, 'conversations', 'inbox_participant_2')
    );

    if (needsLegacySelect) {
        [participant1Result, participant2Result] = await Promise.all([
            buildLookup('participant_1', false),
            buildLookup('participant_2', false),
        ]);
    }

    const row = (participant1Result.data || participant2Result.data) as ContractConversationLookupRow | null;
    if (!row) return null;

    const [repairedRow] = await repairContractConversationInboxRows([row]);
    return hydrateConversationRow(userId, repairedRow ?? row);
};

const fetchConversationByParticipants = async (
    userId: string,
    otherUserId: string,
): Promise<Conversation | null> => {
    const [participant1, participant2] = userId < otherUserId
        ? [userId, otherUserId]
        : [otherUserId, userId];

    const buildLookup = (includeScopeColumns: boolean) => {
        const selectColumns = includeScopeColumns
            ? 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2'
            : 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at';

        return supabase
            .from('conversations')
            .select(selectColumns)
            .eq('participant_1', participant1)
            .eq('participant_2', participant2)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
    };

    let lookupResult = await buildLookup(true);

    const needsLegacySelect = (
        isMissingSchemaColumnError(lookupResult.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(lookupResult.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(lookupResult.error, 'conversations', 'inbox_participant_2')
    );

    if (needsLegacySelect) {
        lookupResult = await buildLookup(false);
    }

    const row = lookupResult.data as ContractConversationLookupRow | null;
    if (!row) return null;

    const [repairedRow] = await repairContractConversationInboxRows([row]);
    return hydrateConversationRow(userId, repairedRow ?? row);
};

const createContractConversationFallback = async (
    userId: string,
    otherUserId: string,
    contractId: string,
): Promise<Conversation | null> => {
    const [participant1, participant2] = userId < otherUserId
        ? [userId, otherUserId]
        : [otherUserId, userId];
    const contractInboxPatch = await getContractConversationInboxPatch(
        participant1,
        participant2,
        contractId,
    );

    if (!contractInboxPatch) return null;

    const insertModern = () => supabase
        .from('conversations')
        .insert({
            participant_1: participant1,
            participant_2: participant2,
            contract_id: contractId,
            ...contractInboxPatch,
        })
        .select('id')
        .maybeSingle();

    const insertLegacy = () => supabase
        .from('conversations')
        .insert({
            participant_1: participant1,
            participant_2: participant2,
            contract_id: contractId,
        })
        .select('id')
        .maybeSingle();

    let insertResult = await insertModern();

    const shouldRetryLegacyInsert = (
        isMissingSchemaColumnError(insertResult.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(insertResult.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(insertResult.error, 'conversations', 'inbox_participant_2')
    );

    if (shouldRetryLegacyInsert) {
        insertResult = await insertLegacy();
    }

    const insertedConversationId = (
        insertResult.data
        && typeof insertResult.data === 'object'
        && 'id' in insertResult.data
        && typeof (insertResult.data as { id?: unknown }).id === 'string'
    )
        ? (insertResult.data as { id: string }).id
        : null;

    if (insertedConversationId) {
        return fetchConversationById(userId, insertedConversationId);
    }

    // Unique conflicts can happen on legacy schemas (single row per participant pair).
    // In that case recover by reading existing rows directly.
    const duplicateKey = (insertResult.error as { code?: string } | null)?.code === '23505';
    if (!insertResult.error || duplicateKey) {
        const contractConversation = await fetchConversationByContractId(userId, contractId);
        if (contractConversation) return contractConversation;

        const pairConversation = await fetchConversationByParticipants(userId, otherUserId);
        if (pairConversation) return pairConversation;
    }

    return null;
};

/**
 * Derive the counterparty role label for a conversation.
 *
 * With the new per-participant inbox system we can read the inbox assignment
 * directly: MY inbox assignment tells me my role, so the counterparty's role
 * is the opposite.
 *
 * Falls back to the legacy conversation_scope heuristic when the inbox columns
 * are not yet present (pre-migration data).
 */
const getCounterpartyRoleFromConversation = (
    conversation: Conversation,
    userId: string | undefined,
    activeMode: string | null | undefined
): 'client' | 'freelancer' | null => {
    // Use per-participant inbox columns when available (post-migration)
    if (userId) {
        const isParticipant1 = conversation.participant_1 === userId;
        const myInbox = isParticipant1
            ? conversation.inbox_participant_1
            : conversation.inbox_participant_2;

        if (myInbox === 'client') return 'freelancer';    // I am client → they are freelancer
        if (myInbox === 'freelancer') return 'client';    // I am freelancer → they are client
        if (myInbox === 'contract') {
            // For contract conversations use active mode as hint
            if (activeMode === 'client') return 'freelancer';
            if (activeMode === 'freelancer') return 'client';
        }
        // myInbox === 'shared' or undefined → fall through to legacy heuristic
    }

    // Legacy fallback: derive from conversation_scope
    const scope = conversation.conversation_scope;
    if (scope === 'client') return 'freelancer';
    if (scope === 'freelancer') return 'client';
    if (scope === 'contract') {
        if (activeMode === 'client') return 'freelancer';
        if (activeMode === 'freelancer') return 'client';
    }
    return null;
};

function MessagesComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user, profile, activeMode } = useAuth();
    const { showToast } = useToast();
    const { tx, language } = useTranslation();
    const deletedMessageLabel = tx('pages.messages.deletedMessage', undefined, 'Message deleted');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLTextAreaElement>(null);

    const conversationsParentRef = useRef<HTMLDivElement>(null);
    const messagesParentRef = useRef<HTMLDivElement>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ThreadMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [showArchived, setShowArchived] = useState(false);
    const [archivedConversationIds, setArchivedConversationIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem('workedin_archived_conversations');
            return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
        } catch {
            return new Set();
        }
    });
    const [showMobileThread, setShowMobileThread] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingQueue, setPendingQueue] = useState<any[]>([]);
    const [contractStatusById, setContractStatusById] = useState<Record<string, ContractMessagingStatus>>(() => {
        try {
            const cached = sessionStorage.getItem('workedin_contract_statuses');
            return cached ? (JSON.parse(cached) as Record<string, ContractMessagingStatus>) : {};
        } catch {
            return {};
        }
    });
    // Always starts false — we MUST wait for loadContractStatuses to complete before
    // rendering the list. Using sessionStorage to pre-set this caused a flash because
    // the cached contract IDs could be stale, letting conversations render with
    // 'unknown' status, then disappear once real statuses (e.g. 'completed') arrived.
    // The sessionStorage cache of contractStatusById (above) still speeds up the fetch
    // by giving it a pre-populated starting state to diff against.
    const [contractStatusesHydrated, setContractStatusesHydrated] = useState(false);
    const [contractSessionMetaById, setContractSessionMetaById] = useState<Record<string, ContractSessionMeta>>({});
    const [milestonesByContractId, setMilestonesByContractId] = useState<Record<string, ContractMilestone[]>>({});
    const [hasReviewedContractById, setHasReviewedContractById] = useState<Record<string, boolean>>({});

    // Keep contract status cache in sessionStorage so archived items don't flash on reload
    useEffect(() => {
        if (Object.keys(contractStatusById).length === 0) return;
        try {
            sessionStorage.setItem('workedin_contract_statuses', JSON.stringify(contractStatusById));
        } catch {
            // sessionStorage quota exceeded or unavailable — safe to ignore
        }
    }, [contractStatusById]);

    const [page, setPage] = useState(0);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [replyTarget, setReplyTarget] = useState<ReplyMetadata | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [showUnknownContractBanner, setShowUnknownContractBanner] = useState(false);
    const [deliveryNote, setDeliveryNote] = useState('');
    const [deliveryActionError, setDeliveryActionError] = useState<string | null>(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [isDeliveringContractWork, setIsDeliveringContractWork] = useState(false);
    const [isAcceptingContractWork, setIsAcceptingContractWork] = useState(false);
    const [isRequestingContractChanges, setIsRequestingContractChanges] = useState(false);
    const [isOpeningContractDispute, setIsOpeningContractDispute] = useState(false);
    const [loadingMilestonesContractId, setLoadingMilestonesContractId] = useState<string | null>(null);
    const [loadingReviewContractId, setLoadingReviewContractId] = useState<string | null>(null);
    const [isContractSidebarVisible, setIsContractSidebarVisible] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const replyHighlightTimeoutRef = useRef<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const {
        isRecording,
        recordingTime,
        startRecording,
        stopRecording,
        cancelRecording,
        audioBlob,
        error: audioRecorderError,
    } = useAudioRecorder();

    const [deletedForMeMessageIds, setDeletedForMeMessageIds] = useState<Set<string>>(new Set());
    const [messagePendingDelete, setMessagePendingDelete] = useState<ThreadMessage | null>(null);

    const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
    const messagesChannelRef = useRef<RealtimeChannel | null>(null);
    const messageRequestIdRef = useRef(0);
    const messageCacheRef = useRef<Record<string, ThreadMessage[]>>({});
    const prefetchedConversationIdsRef = useRef<Set<string>>(new Set());
    const previewHydratedConversationIdsRef = useRef<Set<string>>(new Set());
    const contractBootstrapAttemptsRef = useRef<Set<string>>(new Set());

    const conversationScopes = resolveConversationScopes(activeMode ?? profile?.active_mode);
    const conversationsModeCacheKey = resolveModeCacheKey(activeMode ?? profile?.active_mode);
    const contractConversationIds = useMemo(() => {
        return Array.from(
            new Set(
                conversations
                    .map((conversation) => conversation.contract_id)
                    .filter((contractId): contractId is string => Boolean(contractId))
            )
        ).sort();
    }, [conversations]);
    const contractConversationIdsKey = useMemo(() => contractConversationIds.join('|'), [contractConversationIds]);
    const routeContractId = useMemo(() => {
        const fromQuery = searchParams.get('contract');
        if (fromQuery) return fromQuery;

        return (location.state as { contractId?: string } | null)?.contractId || null;
    }, [searchParams, location.state]);
    const routeOtherUserId = useMemo(() => {
        const fromQuery = searchParams.get('with');
        if (fromQuery) return fromQuery;

        return (location.state as { otherUserId?: string } | null)?.otherUserId || null;
    }, [searchParams, location.state]);

    const getConversationLifecyclePolicy = useCallback((conversation: Conversation) => {
        const isContractConversation = Boolean(conversation.contract_id);
        const contractStatus = conversation.contract_id
            ? contractStatusById[conversation.contract_id]
            : null;

        return resolveMessagingLifecyclePolicy({
            kind: isContractConversation ? 'contract' : 'direct',
            contractStatus,
        });
    }, [contractStatusById]);

    const selectedConversationPolicy = useMemo(() => {
        if (!selectedConversation) return null;
        return getConversationLifecyclePolicy(selectedConversation);
    }, [getConversationLifecyclePolicy, selectedConversation]);

    const canSendInSelectedConversation = selectedConversationPolicy?.canSend ?? false;
    const canAttachInSelectedConversation = selectedConversationPolicy?.canAttachFiles ?? false;
    const canSendVoiceInSelectedConversation = selectedConversationPolicy?.canSendVoiceNotes ?? false;
    const canReplyInSelectedConversation = selectedConversationPolicy?.canReply ?? false;

    const selectedContractId = selectedConversation?.contract_id || null;
    const selectedContractMeta = selectedContractId ? contractSessionMetaById[selectedContractId] : null;
    const isContractSession = Boolean(selectedContractId);
    const activeWorkspace = activeMode ?? profile?.active_mode;
    const isFreelancerWorkspace = activeWorkspace === 'freelancer';
    const conversationWorkspaceLabel = useMemo(() => {
        if (activeWorkspace === 'client') {
            return tx('pages.messages.clientInboxLabel', undefined, 'Client inbox');
        }

        if (activeWorkspace === 'freelancer') {
            return tx('pages.messages.freelancerInboxLabel', undefined, 'Freelancer inbox');
        }

        return tx('pages.messages.allConversationsLabel', undefined, 'All conversations');
    }, [activeWorkspace, tx]);

    useEffect(() => {
        if (!isContractSession) {
            setIsContractSidebarVisible(false);
            setIsReviewModalOpen(false);
            return;
        }

        setIsReviewModalOpen(false);
    }, [isContractSession, selectedContractId]);

    const selectedContractUserRole: 'client' | 'freelancer' = useMemo(() => {
        if (activeWorkspace === 'client') return 'client';
        if (activeWorkspace === 'freelancer') return 'freelancer';

        if (selectedContractMeta?.client_id && selectedContractMeta.client_id === user?.id) {
            return 'client';
        }

        return 'freelancer';
    }, [activeWorkspace, selectedContractMeta?.client_id, user?.id]);

    const selectedContractStatus = selectedContractId
        ? (contractStatusById[selectedContractId] ?? normalizeContractStatus(selectedContractMeta?.status))
        : null;

    const selectedContractMilestones = selectedContractId
        ? (milestonesByContractId[selectedContractId] ?? [])
        : [];

    const selectedContractHasReview = selectedContractId
        ? (hasReviewedContractById[selectedContractId] ?? false)
        : true;
    const selectedContractRevisionCount = Number(selectedContractMeta?.revision_requests_count ?? 0);
    const selectedContractRevisionLimit = Number(selectedContractMeta?.max_revision_rounds ?? 2);
    const selectedContractRevisionRemaining = Math.max(selectedContractRevisionLimit - selectedContractRevisionCount, 0);
    const selectedContractDeliverySubmittedAt = selectedContractMeta?.delivery_submitted_at || null;
    const selectedContractReviewDueAt = selectedContractMeta?.review_due_at || null;

    useEffect(() => {
        if (!selectedContractId || selectedConversationPolicy?.contractStatus !== 'unknown') {
            setShowUnknownContractBanner(false);
            return;
        }

        setShowUnknownContractBanner(false);
        const timeoutId = window.setTimeout(() => {
            setShowUnknownContractBanner(true);
        }, 1500);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [selectedContractId, selectedConversationPolicy?.contractStatus]);

    const accentClasses = useMemo(() => ({
        selectedConversationBorder: isFreelancerWorkspace ? 'border-violet-500' : 'border-amber-500',
        selectedConversationSurface: isFreelancerWorkspace
            ? 'border-violet-500/25 bg-[linear-gradient(135deg,rgba(20,14,32,0.99),rgba(12,12,14,0.99))] shadow-[0_14px_28px_-26px_rgba(124,58,237,0.38)]'
            : 'border-amber-500/25 bg-[linear-gradient(135deg,rgba(28,18,6,0.99),rgba(12,12,14,0.99))] shadow-[0_14px_28px_-26px_rgba(245,158,11,0.34)]',
        conversationHoverSurface: isFreelancerWorkspace
            ? 'hover:border-violet-500/25 hover:bg-[var(--color-bg-muted)]'
            : 'hover:border-amber-500/25 hover:bg-[var(--color-bg-muted)]',
        avatarHoverRing: isFreelancerWorkspace ? 'hover:ring-violet-500/60' : 'hover:ring-amber-500/60',
        headerAvatarHoverRing: isFreelancerWorkspace ? 'hover:ring-violet-500' : 'hover:ring-amber-500',
        contextLabelText: isFreelancerWorkspace ? 'text-violet-300/90' : 'text-amber-300/90',
        unreadBadgeBg: isFreelancerWorkspace ? 'bg-violet-600' : 'bg-amber-600',
        inputFocusBorder: isFreelancerWorkspace ? 'focus:border-violet-500' : 'focus:border-amber-500',
        headerMetaText: isFreelancerWorkspace ? 'text-violet-300' : 'text-amber-300',
        searchSurface: isFreelancerWorkspace
            ? 'border-violet-500/20 bg-[var(--color-bg-muted)] focus-within:border-violet-500/50'
            : 'border-amber-500/20 bg-[var(--color-bg-muted)] focus-within:border-amber-500/50',
        contractToggleActive: isFreelancerWorkspace
            ? 'border-violet-500/50 bg-violet-500/12 text-violet-200 hover:bg-violet-500/20'
            : 'border-amber-500/50 bg-amber-500/12 text-amber-200 hover:bg-amber-500/20',
        contractToggleIdle: isFreelancerWorkspace
            ? 'border-violet-500/20 text-violet-300 hover:border-violet-400 hover:bg-violet-500/10'
            : 'border-amber-500/20 text-amber-300 hover:border-amber-400 hover:bg-amber-500/10',
        threadAmbientGlow: isFreelancerWorkspace
            ? 'from-violet-500/8 via-transparent to-transparent'
            : 'from-amber-500/8 via-transparent to-transparent',
        ownBubbleBg: isFreelancerWorkspace ? 'bg-violet-600' : 'bg-amber-600',
        ownReplyCard: isFreelancerWorkspace
            ? 'border-violet-300/40 bg-violet-700/30 text-violet-100'
            : 'border-amber-300/40 bg-amber-700/30 text-amber-100',
        ownTextMuted: isFreelancerWorkspace ? 'text-violet-100' : 'text-amber-100',
        ownAttachmentCard: isFreelancerWorkspace
            ? 'bg-violet-700/50 hover:bg-violet-700/80'
            : 'bg-amber-700/50 hover:bg-amber-700/80',
        ownAttachmentIcon: isFreelancerWorkspace
            ? 'bg-violet-500/40 text-violet-100'
            : 'bg-amber-500/40 text-amber-100',
        neutralAttachmentIcon: isFreelancerWorkspace ? 'text-violet-300' : 'text-amber-300',
        readReceipt: isFreelancerWorkspace ? 'text-violet-300' : 'text-amber-300',
        replyActionHover: isFreelancerWorkspace ? 'hover:text-violet-300' : 'hover:text-amber-300',
        highlightRing: isFreelancerWorkspace ? 'ring-violet-400/70' : 'ring-amber-400/70',
        typingDot: isFreelancerWorkspace ? 'bg-violet-500' : 'bg-amber-500',
        replyStripe: isFreelancerWorkspace ? 'bg-violet-500' : 'bg-amber-500',
        iconAccent: isFreelancerWorkspace ? 'text-violet-400' : 'text-amber-400',
        sendButton: isFreelancerWorkspace ? 'bg-violet-600 hover:bg-violet-500' : 'bg-amber-600 hover:bg-amber-500',
        composerShell: isFreelancerWorkspace
            ? 'border-violet-500/20 bg-[var(--color-bg-elevated)] focus-within:border-violet-400/50 focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.20)]'
            : 'border-amber-500/20 bg-[var(--color-bg-elevated)] focus-within:border-amber-400/50 focus-within:shadow-[0_0_0_1px_rgba(251,191,36,0.20)]',
    }), [isFreelancerWorkspace]);

    useEffect(() => {
        if (!selectedContractId) return;

        let cancelled = false;
        setLoadingMilestonesContractId(selectedContractId);

        const loadMilestones = async () => {
            try {
                const { data, error } = await supabase
                    .from('milestones')
                    .select('id, contract_id, title, description, amount, status, due_date, order_index, created_at')
                    .eq('contract_id', selectedContractId)
                    .order('order_index', { ascending: true });

                if (error) {
                    const shouldRetryWithoutOrder = typeof error.message === 'string'
                        && error.message.toLowerCase().includes('order_index');

                    if (!shouldRetryWithoutOrder) {
                        console.warn('[Messages] Failed to load contract milestones', error);
                        if (!cancelled) {
                            setMilestonesByContractId((prev) => ({
                                ...prev,
                                [selectedContractId]: prev[selectedContractId] ?? [],
                            }));
                        }
                        return;
                    }

                    const fallback = await supabase
                        .from('milestones')
                        .select('id, contract_id, title, description, amount, status, due_date, created_at')
                        .eq('contract_id', selectedContractId)
                        .order('created_at', { ascending: true });

                    if (fallback.error) {
                        console.warn('[Messages] Failed to load contract milestones fallback', fallback.error);
                        if (!cancelled) {
                            setMilestonesByContractId((prev) => ({
                                ...prev,
                                [selectedContractId]: prev[selectedContractId] ?? [],
                            }));
                        }
                        return;
                    }

                    if (cancelled) return;

                    const fallbackRows = (fallback.data ?? []).map((row) => ({
                        ...row,
                        order_index: null,
                    })) as ContractMilestone[];

                    setMilestonesByContractId((prev) => ({
                        ...prev,
                        [selectedContractId]: fallbackRows,
                    }));

                    return;
                }

                if (cancelled) return;

                setMilestonesByContractId((prev) => ({
                    ...prev,
                    [selectedContractId]: (data ?? []) as ContractMilestone[],
                }));
            } catch (caughtError) {
                console.warn('[Messages] Failed to load contract milestones', caughtError);
                if (!cancelled) {
                    setMilestonesByContractId((prev) => ({
                        ...prev,
                        [selectedContractId]: prev[selectedContractId] ?? [],
                    }));
                }
            } finally {
                if (!cancelled) {
                    setLoadingMilestonesContractId((current) => (
                        current === selectedContractId ? null : current
                    ));
                }
            }
        };

        void loadMilestones();

        return () => {
            cancelled = true;
        };
    }, [selectedContractId]);

    useEffect(() => {
        if (!selectedContractId || !user?.id) return;

        let cancelled = false;
        setLoadingReviewContractId(selectedContractId);

        const loadReviewStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('id')
                    .eq('contract_id', selectedContractId)
                    .eq('reviewer_id', user.id)
                    .maybeSingle();

                if (cancelled) return;

                if (error) {
                    console.warn('[Messages] Failed to load review status for contract', error);
                    setHasReviewedContractById((prev) => ({
                        ...prev,
                        [selectedContractId]: prev[selectedContractId] ?? false,
                    }));
                    return;
                }

                setHasReviewedContractById((prev) => ({
                    ...prev,
                    [selectedContractId]: Boolean(data?.id),
                }));
            } catch (caughtError) {
                console.warn('[Messages] Failed to load review status for contract', caughtError);
                if (!cancelled) {
                    setHasReviewedContractById((prev) => ({
                        ...prev,
                        [selectedContractId]: prev[selectedContractId] ?? false,
                    }));
                }
            } finally {
                if (!cancelled) {
                    setLoadingReviewContractId((current) => (
                        current === selectedContractId ? null : current
                    ));
                }
            }
        };

        void loadReviewStatus();

        return () => {
            cancelled = true;
        };
    }, [selectedContractId, user?.id]);

    const currentUserDisplayName = profile?.full_name || tx('common.you', undefined, 'You');
    const currentUserAvatar = profile?.avatar_url || null;

    const contractSharedFiles = useMemo<ContractSharedFile[]>(() => {
        if (!isContractSession || !selectedContractId) return [];

        const dedupe = new Set<string>();
        const files: ContractSharedFile[] = [];

        for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
            const message = messages[messageIndex];
            if (message.contract_id !== selectedContractId) continue;

            const attachments = message.attachments ?? [];
            if (attachments.length === 0) continue;

            const senderName = message.sender_id === user?.id
                ? tx('common.you', undefined, 'You')
                : (selectedConversation?.otherUser.full_name || tx('pages.messages.userFallback', undefined, 'User'));

            for (const [attachmentIndex, attachment] of attachments.entries()) {
                if (!attachment?.url) continue;

                const dedupeKey = `${attachment.url}|${attachment.name || ''}`;
                if (dedupe.has(dedupeKey)) continue;
                dedupe.add(dedupeKey);

                files.push({
                    id: `${message.id}-${attachmentIndex}`,
                    name: attachment.name || tx('pages.messages.attachmentLabel', undefined, 'Attachment'),
                    url: attachment.url,
                    type: attachment.type || null,
                    size: attachment.size ?? null,
                    uploadedAt: message.created_at || null,
                    senderName,
                });

                if (files.length >= 12) return files;
            }
        }

        return files;
    }, [
        isContractSession,
        messages,
        selectedContractId,
        selectedConversation?.otherUser.full_name,
        tx,
        user?.id,
    ]);

    const getContractReferenceLabel = useCallback((contractId: string | null | undefined) => {
        const normalizedId = String(contractId || '').trim();
        if (!normalizedId) {
            return tx('pages.messages.contractReferenceFallback', undefined, 'Contract');
        }

        const shortId = normalizedId.slice(0, 8);
        return tx('pages.messages.contractReferenceWithId', { id: shortId }, `Contract #${shortId}`);
    }, [tx]);

    const getContractFallbackTitle = useCallback((
        conversation: Conversation,
        variant: 'compact' | 'hero' = 'hero'
    ) => {
        const referenceLabel = getContractReferenceLabel(conversation.contract_id);

        if (variant === 'compact') {
            return referenceLabel;
        }

        return tx('pages.messages.contractWorkspaceTitle', undefined, 'Contract workspace');
    }, [getContractReferenceLabel, tx]);

    const getResolvedContractTitle = useCallback((conversation: Conversation) => {
        if (!conversation.contract_id) return '';

        const jobTitle = sanitizeContractTitle(contractSessionMetaById[conversation.contract_id]?.title);
        if (jobTitle) return jobTitle;

        return getContractFallbackTitle(conversation, 'hero');
    }, [contractSessionMetaById, getContractFallbackTitle]);

    const contractSidebarData = useMemo(() => {
        if (!isContractSession || !selectedConversation) return null;

        const title = getResolvedContractTitle(selectedConversation)
            || tx('pages.messages.contractSessionFallbackTitle', undefined, 'Contract');
        const amountValue = selectedContractMeta?.total_amount
            ?? selectedContractMeta?.amount
            ?? 0;
        const jobDeadline = selectedContractMeta?.job_deadline || null;

        const firstUpcomingDueDate = selectedContractMilestones
            .filter((milestone) => {
                if (!milestone.due_date) return false;
                const normalizedStatus = String(milestone.status || '').trim().toLowerCase();
                return normalizedStatus !== 'completed'
                    && normalizedStatus !== 'approved'
                    && normalizedStatus !== 'paid'
                    && normalizedStatus !== 'cancelled'
                    && normalizedStatus !== 'canceled';
            })
            .map((milestone) => milestone.due_date as string)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

        const otherParticipant = selectedConversation.otherUser;

        const clientProfile = selectedContractUserRole === 'client'
            ? {
                full_name: currentUserDisplayName,
                avatar_url: currentUserAvatar,
            }
            : {
                full_name: otherParticipant.full_name,
                avatar_url: otherParticipant.avatar_url,
            };

        const freelancerProfile = selectedContractUserRole === 'freelancer'
            ? {
                full_name: currentUserDisplayName,
                avatar_url: currentUserAvatar,
            }
            : {
                full_name: otherParticipant.full_name,
                avatar_url: otherParticipant.avatar_url,
            };

        return {
            amount: amountValue,
            revisionRequestsCount: selectedContractMeta?.revision_requests_count ?? 0,
            maxRevisionRounds: selectedContractMeta?.max_revision_rounds ?? 2,
            fundedAt: selectedContractMeta?.funded_at ?? null,
            deliverySubmittedAt: selectedContractDeliverySubmittedAt,
            reviewDueAt: selectedContractReviewDueAt,
            job: {
                title,
                deadline: firstUpcomingDueDate || jobDeadline,
            },
            milestones: selectedContractMilestones.map((milestone) => ({
                id: milestone.id,
                title: milestone.title,
                description: milestone.description,
                amount: milestone.amount,
                status: milestone.status,
                due_date: milestone.due_date,
            })),
            sharedFiles: contractSharedFiles,
            client: clientProfile,
            freelancer: freelancerProfile,
        };
    }, [
        contractSharedFiles,
        currentUserAvatar,
        currentUserDisplayName,
        isContractSession,
        selectedContractMilestones,
        selectedContractDeliverySubmittedAt,
        selectedContractMeta?.amount,
        selectedContractMeta?.job_deadline,
        selectedContractMeta?.max_revision_rounds,
        selectedContractMeta?.revision_requests_count,
        selectedContractReviewDueAt,
        selectedContractId,
        selectedContractMeta?.title,
        selectedContractMeta?.total_amount,
        selectedContractUserRole,
        selectedConversation,
        getResolvedContractTitle,
        tx,
    ]);

    const contractDeliverySubmitted = useMemo(() => {
        if (!isContractSession) return false;
        if (selectedContractStatus === 'completed') return true;

        const freelancerId = selectedContractUserRole === 'client'
            ? selectedConversation?.otherUser.id
            : user?.id;

        if (!freelancerId) return false;

        return messages.some((message) => {
            if (message.sender_id !== freelancerId) return false;
            const normalized = String(parseReplyMetadataFromContent(message.content).bodyText || '').trim().toLowerCase();
            return normalized.startsWith('[[delivery]]')
                || normalized.startsWith('work has been delivered:')
                || normalized.startsWith('work delivered and ready for review');
        });
    }, [isContractSession, messages, selectedContractStatus, selectedContractUserRole, selectedConversation?.otherUser.id, user?.id]);

    const isAnyContractActionLoading = isDeliveringContractWork
        || isAcceptingContractWork
        || isRequestingContractChanges
        || isOpeningContractDispute;

    const isContractSidebarDataLoading = useMemo(() => {
        if (!isContractSession || !selectedContractId) return false;

        const hasMilestonesEntry = Object.prototype.hasOwnProperty.call(milestonesByContractId, selectedContractId);
        const hasReviewEntry = !user?.id
            || Object.prototype.hasOwnProperty.call(hasReviewedContractById, selectedContractId);

        const isMilestonesLoading = loadingMilestonesContractId === selectedContractId;
        const isReviewLoading = Boolean(user?.id) && loadingReviewContractId === selectedContractId;

        return !hasMilestonesEntry || !hasReviewEntry || isMilestonesLoading || isReviewLoading;
    }, [
        hasReviewedContractById,
        isContractSession,
        loadingMilestonesContractId,
        loadingReviewContractId,
        milestonesByContractId,
        selectedContractId,
        user?.id,
    ]);

    const deleteModalWorkspaceVars = useMemo(() => {
        return {
            '--workspace-primary': '#9333ea',
            '--workspace-primary-hover': '#a855f7',
            '--workspace-primary-active': '#7e22ce',
            '--workspace-primary-dim': 'rgba(147, 51, 234, 0.14)',
            '--workspace-primary-text': '#ffffff',
        } as CSSProperties;
    }, []);

    const getConversationIdentityLabel = useCallback((conversation: Conversation) => {
        const username = conversation.otherUser.username?.trim();
        return username ? `@${username}` : null;
    }, []);

    const getConversationProfilePath = useCallback((conversation: Conversation) => {
        const counterpartyRole = getCounterpartyRoleFromConversation(
            conversation,
            user?.id,
            activeMode ?? profile?.active_mode
        );

        if (counterpartyRole === 'client') {
            return `/client/${conversation.otherUser.id}`;
        }

        return `/freelancer/${conversation.otherUser.id}`;
    }, [activeMode, profile?.active_mode, user?.id]);

    const getConversationWorkDescriptor = useCallback((conversation: Conversation) => {
        if (!conversation.contract_id) {
            return tx('pages.messages.directChat', undefined, 'Direct chat');
        }

        const jobTitle = sanitizeContractTitle(contractSessionMetaById[conversation.contract_id]?.title);

        if (jobTitle) {
            return jobTitle;
        }

        return getContractFallbackTitle(conversation, 'compact');
    }, [contractSessionMetaById, getContractFallbackTitle, tx]);

    const getConversationRoleMeta = useCallback((conversation: Conversation) => {
        const counterpartyRole = getCounterpartyRoleFromConversation(
            conversation,
            user?.id,
            activeMode ?? profile?.active_mode
        );

        if (counterpartyRole === 'client') {
            return {
                label: tx('mobileNav.client', undefined, 'Client'),
                className: 'border-sky-500/25 bg-sky-500/10 text-sky-100',
            };
        }

        if (counterpartyRole === 'freelancer') {
            return {
                label: tx('mobileNav.freelancer', undefined, 'Freelancer'),
                className: 'border-violet-500/25 bg-violet-500/10 text-violet-100',
            };
        }

        if (!conversation.contract_id) {
            return {
                label: tx('pages.messages.directChat', undefined, 'Direct chat'),
                className: 'border-surface surface-sunken text-on-surface-muted',
            };
        }

        return null;
    }, [activeMode, profile?.active_mode, user?.id, tx]);

    const getConversationStatusMeta = useCallback((conversation: Conversation) => {
        if (!conversation.contract_id) return null;

        const lifecyclePolicy = getConversationLifecyclePolicy(conversation);

        switch (lifecyclePolicy.contractStatus) {
            case 'active':
                return {
                    label: tx('contract.inProgress', undefined, 'In progress'),
                    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
                };
            case 'pending_payment':
                return {
                    label: tx('contract.pendingPayment', undefined, 'Pending payment'),
                    className: 'border-sky-500/25 bg-sky-500/10 text-sky-100',
                };
            case 'completed':
                return {
                    label: tx('contract.completed', undefined, 'Completed'),
                    className: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-100',
                };
            case 'cancelled':
                return {
                    label: tx('contract.cancelled', undefined, 'Cancelled'),
                    className: 'border-red-500/25 bg-red-500/10 text-red-100',
                };
            case 'disputed':
                return {
                    label: tx('contract.disputeOpened', undefined, 'Disputed'),
                    className: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
                };
            // 'unknown' or any unrecognized status: show no badge.
            // This prevents "Status unavailable" from flashing while statuses are loading.
            default:
                return null;
        }
    }, [getConversationLifecyclePolicy, tx]);

    const handleOpenAttachment = useCallback(async (attachment: NonNullable<Message['attachments']>[number]) => {
        const sourceUrl = resolveMessageAttachmentUrl(attachment.url);
        if (!sourceUrl) {
            showToast(tx('pages.messages.errors.invalidAttachment', undefined, 'Attachment link is not available'), 'error');
            return;
        }

        const normalizedType = normalizeMimeType(attachment.type);
        const canPreviewInTab = normalizedType.startsWith('image/')
            || normalizedType.startsWith('audio/')
            || normalizedType.startsWith('video/')
            || normalizedType === 'application/pdf';

        try {
            const response = await fetch(sourceUrl, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            openBlobAsPreviewOrDownload(blob, attachment.name || 'attachment', canPreviewInTab);
        } catch (error) {
            try {
                const attachmentPath = extractMessageAttachmentPath(attachment.url);
                if (!attachmentPath) throw error;

                const { data, error: downloadError } = await supabase.storage
                    .from('message_attachments')
                    .download(attachmentPath);

                if (downloadError || !data) {
                    throw downloadError || error;
                }

                openBlobAsPreviewOrDownload(data, attachment.name || 'attachment', canPreviewInTab);
            } catch (downloadError) {
                console.error('[Messages] Failed to open attachment via fallback:', downloadError);
                showToast(tx('pages.messages.errors.openAttachment', undefined, 'Failed to open attachment right now'), 'error');
            }
        }
    }, [showToast, tx]);

    // Typing indicators
    const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
        selectedConversation?.id || null,
        user?.id || null
    );

    // Read receipts
    useReadReceipts({
        conversationId: selectedConversation?.id || null,
        currentUserId: user?.id || null,
        messages,
        onMarkedRead: (messageIds) => {
            const ids = new Set(messageIds);
            setMessages((prev) => prev.map((message) => (
                ids.has(message.id) ? { ...message, is_read: true, status: undefined } : message
            )));
            if (selectedConversation) {
                setConversations((prev) => prev.map((conversation) => (
                    conversation.id === selectedConversation.id
                        ? { ...conversation, unread_count: 0 }
                        : conversation
                )));
            }
        },
    });

    // Network status listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!audioRecorderError) return;
        showToast(audioRecorderError.message, 'error');
    }, [audioRecorderError, showToast]);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    useEffect(() => {
        setIsMenuOpen(false);
        setReplyTarget(null);
        setIsDeliverModalOpen(false);
        setIsAcceptModalOpen(false);
        setIsDisputeModalOpen(false);
        setDeliveryNote('');
        setDeliveryActionError(null);
        setDisputeReason('');
    }, [selectedConversation?.id]);

    useEffect(() => {
        if (!selectedConversationPolicy || selectedConversationPolicy.canSend) return;

        if (replyTarget) {
            setReplyTarget(null);
        }

        if (selectedFile) {
            setSelectedFile(null);
        }

        if (audioBlob) {
            cancelRecording();
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [audioBlob, cancelRecording, replyTarget, selectedConversationPolicy, selectedFile]);

    useEffect(() => {
        return () => {
            if (replyHighlightTimeoutRef.current) {
                window.clearTimeout(replyHighlightTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!audioBlob) {
            setAudioPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [audioBlob]);

    // Sync pending queue when back online
    useEffect(() => {
        if (isOnline && pendingQueue.length > 0 && selectedConversation && user) {
            const selectedLifecyclePolicy = getConversationLifecyclePolicy(selectedConversation);
            if (!selectedLifecyclePolicy.canSend) {
                return;
            }

            const syncQueue = async () => {
                const currentQueue = [...pendingQueue];
                setPendingQueue([]);
                
                for (const pendingMsg of currentQueue) {
                    try {
                        const attachments = [];
                        
                        // Handle base64-encoded files (new format)
                        if (pendingMsg.fileBase64 && pendingMsg.fileName && pendingMsg.fileType) {
                            const file = base64ToFile(pendingMsg.fileBase64, pendingMsg.fileName, pendingMsg.fileType);
                            const { url, error } = await uploadMessageAttachment(file, selectedConversation.id);
                            if (url && !error) {
                                attachments.push({ 
                                    name: pendingMsg.fileName, 
                                    url, 
                                    type: pendingMsg.fileType, 
                                    size: pendingMsg.fileSize || file.size 
                                });
                            }
                        }
                        // Handle base64-encoded audio (new format)
                        if (pendingMsg.audioBase64 && pendingMsg.audioFileName && pendingMsg.audioType) {
                            const audioFile = base64ToFile(pendingMsg.audioBase64, pendingMsg.audioFileName, pendingMsg.audioType);
                            const { url, error } = await uploadMessageAttachment(audioFile, selectedConversation.id);
                            if (url && !error) {
                                attachments.push({ 
                                    name: tx('pages.messages.voiceMemo', undefined, 'Audio note'), 
                                    url, 
                                    type: audioFile.type, 
                                    size: audioFile.size 
                                });
                            }
                        }
                        
                        // Legacy support: Handle old format with File objects (won't survive reload but works in-session)
                        if (pendingMsg.offlineFile) {
                            const { url, error } = await uploadMessageAttachment(pendingMsg.offlineFile, selectedConversation.id);
                            if (url && !error) {
                                attachments.push({ 
                                    name: pendingMsg.offlineFile.name, 
                                    url, 
                                    type: pendingMsg.offlineFile.type, 
                                    size: pendingMsg.offlineFile.size 
                                });
                            }
                        }
                        if (pendingMsg.offlineAudio) {
                            const audioFile = new File([pendingMsg.offlineAudio], pendingMsg.offlineFileName, { type: pendingMsg.offlineAudio.type || 'audio/webm' });
                            const { url, error } = await uploadMessageAttachment(audioFile, selectedConversation.id);
                            if (url && !error) {
                                attachments.push({ 
                                    name: tx('pages.messages.voiceMemo', undefined, 'Audio note'), 
                                    url, 
                                    type: audioFile.type, 
                                    size: audioFile.size 
                                });
                            }
                        }

                        await sendMessage({
                            conversationId: selectedConversation.id,
                            senderId: user.id,
                            receiverId: selectedConversation.otherUser.id,
                            content: pendingMsg.content || '',
                            contractId: selectedConversation.contract_id,
                            attachments: attachments.length > 0 ? attachments : undefined
                        });
                    } catch (err) {
                        console.error("Failed to sync offline message", err);
                    }
                }
                
                // Clear localstorage backup
                localStorage.removeItem(`pendingQueue_${selectedConversation.id}`);
                showToast(tx('pages.messages.offline.synced', undefined, 'Offline messages synced successfully'), 'success');
            };
            
            syncQueue();
        }
    }, [isOnline, selectedConversation?.id]); // Note: Depends on selectedConversation. If they switched chats, this basic version only syncs the active one, but it handles the primary UX loop.

    // Load pending from localstorage on load
    useEffect(() => {
        if (selectedConversation) {
            const savedQueue = localStorage.getItem(`pendingQueue_${selectedConversation.id}`);
            if (savedQueue) {
                try {
                    // Note: File objects don't survive JSON stringify, but basic text does.
                    const parsed = JSON.parse(savedQueue);
                    setPendingQueue(parsed);
                } catch(_e) {
                    // Ignore invalid JSON in localStorage pending queue
                }
            }
        }
    }, [selectedConversation?.id]);


    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        const parent = messagesParentRef.current;
        if (!parent) return;

        window.requestAnimationFrame(() => {
            messagesVirtualizer.scrollToIndex(Math.max(messages.length - 1, 0), { align: 'end' });
            parent.scrollTo({ top: parent.scrollHeight, behavior });
        });
    };

    // Check if user is viewing the bottom of the conversation (within 500px)
    const isUserViewingBottom = () => {
        const parent = messagesParentRef.current;
        if (!parent) return false;
        
        return (parent.scrollHeight - parent.scrollTop - parent.clientHeight) < 500;
    };

    useEffect(() => {
        // Only auto-scroll to bottom if user is already viewing the bottom
        // This prevents jarring scroll when deleting messages higher up
        if (isUserViewingBottom()) {
            scrollToBottom('auto');
        }
    }, [messages]);

    useEffect(() => {
        if (!selectedConversation || messages.length === 0 || isLoadingMessages) return;
        scrollToBottom('auto');
    }, [selectedConversation?.id, messages.length, isLoadingMessages]);

    useEffect(() => {
        if (!selectedConversation) return;

        const frame = window.requestAnimationFrame(() => {
            messageInputRef.current?.focus();
        });

        return () => window.cancelAnimationFrame(frame);
    }, [selectedConversation?.id, isSending]);

    const handleSelectConversation = useCallback(async (conversation: Conversation) => {
        if (selectedConversation?.id === conversation.id) return;

        const seenCount = Math.max(0, Math.floor(conversation.unread_count || 0));
        if (seenCount > 0 && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('messages:unread-seen', { detail: { count: seenCount } }));
        }

        const isParticipant1 = user ? conversation.participant_1 === user.id : false;
        const nextSelectedConversation = user
            ? {
                ...conversation,
                unread_count: 0,
                unread_count_1: isParticipant1 ? 0 : conversation.unread_count_1,
                unread_count_2: isParticipant1 ? conversation.unread_count_2 : 0,
            }
            : conversation;

        setSelectedConversation(nextSelectedConversation);
        setShowMobileThread(true);

        // Optimistically clear unread badge in list immediately for better UX.
        setConversations((prev) => prev.map((conv) => {
            if (conv.id !== conversation.id || !user) return conv;
            const isConvParticipant1 = conv.participant_1 === user.id;
            return {
                ...conv,
                unread_count: 0,
                unread_count_1: isConvParticipant1 ? 0 : conv.unread_count_1,
                unread_count_2: isConvParticipant1 ? conv.unread_count_2 : 0,
            };
        }));

        const cachedMessages = messageCacheRef.current[conversation.id]
            ?? readSessionCache<ThreadMessage[]>(getMessagesCacheKey(conversation.id));
        if (cachedMessages) {
            setMessages(cachedMessages);
            setIsLoadingMessages(false);
        } else {
            void prefetchConversationMessages(conversation.id);
        }
        
        // Load draft for this conversation
        const draft = localStorage.getItem(`draft_${conversation.id}`);
        setNewMessage(draft || '');

        // Mark as read and update UI
        if (user && conversation.unread_count > 0) {
            await markConversationRead(conversation.id, user.id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversation?.id, user?.id]);

    const updateConversationPreview = (
        conversationId: string,
        updater: (conversation: Conversation) => Conversation
    ) => {
        setConversations((prev) => {
            const next = prev.map((conversation) => (
                conversation.id === conversationId ? updater(conversation) : conversation
            ));
            return sortConversationsByActivity(next);
        });
    };

    const cacheMessagesForConversation = (conversationId: string, threadMessages: ThreadMessage[]) => {
        messageCacheRef.current[conversationId] = threadMessages;
        writeSessionCache(
            getMessagesCacheKey(conversationId),
            threadMessages.slice(-MAX_CACHED_MESSAGES)
        );
    };

    const prefetchConversationMessages = async (conversationId: string) => {
        if (prefetchedConversationIdsRef.current.has(conversationId)) return;
        prefetchedConversationIdsRef.current.add(conversationId);

        const cachedMessages = messageCacheRef.current[conversationId]
            ?? readSessionCache<ThreadMessage[]>(getMessagesCacheKey(conversationId));
        if (cachedMessages && cachedMessages.length > 0) return;

        const { data } = await getMessages(conversationId);
        if (data) {
            cacheMessagesForConversation(conversationId, data as ThreadMessage[]);
        }
    };

    const handleDeleteMessage = (message: ThreadMessage) => {
        if (!selectedConversation || !user || message.sender_id !== user.id || message.status === 'sending') {
            return;
        }

        // Show modal to choose delete type
        setMessagePendingDelete(message);
    };

    const confirmDeleteMessage = async (deleteType: 'me' | 'everyone') => {
        const message = messagePendingDelete;
        if (!message || !selectedConversation || !user) return;

        // Close modal
        setMessagePendingDelete(null);

        const previousMessages = messages;
        let nextMessages: ThreadMessage[];
        
        if (deleteType === 'everyone') {
            // Mark as deleted for everyone
            nextMessages = previousMessages.map((item) => (
                item.id === message.id
                    ? {
                        ...item,
                        is_deleted: true,
                        deleted_at: new Date().toISOString(),
                        deleted_by: user.id,
                        attachments: [],
                        is_read: true,
                    }
                    : item
            ));
        } else {
            // Delete for me only - just remove from view and track locally
            nextMessages = previousMessages.filter(item => item.id !== message.id);
            const newDeletedForMe = new Set(deletedForMeMessageIds);
            newDeletedForMe.add(message.id);
            setDeletedForMeMessageIds(newDeletedForMe);
        }

        const nextPreview = getThreadPreview(nextMessages, deletedMessageLabel);

        setDeletingMessageId(message.id);
        setMessages(nextMessages);
        updateConversationPreview(selectedConversation.id, (conversation) => ({
            ...conversation,
            ...nextPreview,
        }));

        // Only call backend for "delete for everyone"
        if (deleteType === 'everyone') {
            const { error } = await deleteMessage(message.id);

            if (error) {
                setMessages(previousMessages);
                updateConversationPreview(selectedConversation.id, (conversation) => ({
                    ...conversation,
                    ...getThreadPreview(previousMessages, deletedMessageLabel),
                }));
                showToast(error.message, 'error');
            }
        }

        setDeletingMessageId(null);
    };

    // On mode switch: reset all conversation state and always refetch from server.
    useEffect(() => {
        setConversations([]);
        setSelectedConversation(null);
        setMessages([]);
        setPage(0);
        setHasMoreConversations(true);
        setIsLoadingConversations(true);
        // Clear bootstrap attempts so the contract bootstrap re-runs after a mode switch.
        contractBootstrapAttemptsRef.current.clear();
    }, [user?.id, conversationsModeCacheKey, activeMode, profile?.active_mode]);


    useEffect(() => {
        if (!user?.id || conversations.length === 0) return;
        conversations.slice(0, 4).forEach((conversation) => {
            void prefetchConversationMessages(conversation.id);
        });
    }, [user?.id, conversations]);

    useEffect(() => {
        if (!selectedConversation?.id) return;
        if (messages.length > 0 && messages.some((message) => message.conversation_id !== selectedConversation.id)) {
            return;
        }
        cacheMessagesForConversation(selectedConversation.id, messages);
    }, [selectedConversation?.id, messages]);

    useEffect(() => {
        if (contractConversationIds.length === 0) {
            setContractStatusById({});
            setContractSessionMetaById({});
            setMilestonesByContractId({});
            setHasReviewedContractById({});
            return;
        }

        let cancelled = false;

        const loadContractStatuses = async () => {
            type ContractSessionRow = Omit<ContractSessionMeta, 'linked_contract_id'> & {
                proposal_id?: string | null;
                created_at?: string | null;
            };
            type ProposalTitleFallbackRow = {
                id: string;
                job_id: string | null;
                freelancer_id: string | null;
                status: string | null;
                created_at?: string | null;
            };
            type JobTitleLookupRow = {
                id: string;
                title: string | null;
                deadline?: string | null;
                client_id?: string | null;
            };
            const contractSelectColumns =
                'id, proposal_id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, revision_requested_at, client_id, freelancer_id, job_id, created_at';
            const legacyContractSelectColumns =
                'id, proposal_id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, revision_requested_at, client_id, freelancer_id, job_id, created_at';
            const fetchContractRows = async (
                field: 'id' | 'proposal_id' | 'job_id' | 'client_id' | 'freelancer_id',
                ids: string[],
                extraEq?: { column: 'client_id' | 'freelancer_id'; value: string } | null,
            ) => {
                if (ids.length === 0) {
                    return { data: [] as ContractSessionRow[], error: null };
                }

                const runLookup = (selectColumns: string) => {
                    let query = supabase
                        .from('contracts')
                        .select(selectColumns);

                    if (extraEq) {
                        query = query.eq(extraEq.column, extraEq.value);
                    }

                    return query.in(field, ids);
                };

                let result = await runLookup(contractSelectColumns);

                if (isMissingSchemaColumnError(result.error, 'contracts', 'total_amount')) {
                    result = await runLookup(legacyContractSelectColumns);
                }

                return result as { data: ContractSessionRow[] | null; error: unknown };
            };

            try {
                const { data, error } = await fetchContractRows('id', contractConversationIds);

                if (cancelled) return;

                if (error) {
                    console.warn('[Messages] Failed to load contract statuses for lifecycle policy', error);
                    return;
                }

            const rowByConversationContractId = new Map<string, ContractSessionRow>();
            const hydrateRow = (conversationContractId: string, row: ContractSessionRow) => {
                if (!conversationContractId) return;

                const existing = rowByConversationContractId.get(conversationContractId);
                if (!existing) {
                    rowByConversationContractId.set(conversationContractId, row);
                    return;
                }

                const existingTitle = typeof existing.title === 'string' ? existing.title.trim() : '';
                const incomingTitle = typeof row.title === 'string' ? row.title.trim() : '';
                const shouldReplace = (!existingTitle && !!incomingTitle)
                    || (!existing.job_id && !!row.job_id);

                if (shouldReplace) {
                    rowByConversationContractId.set(conversationContractId, row);
                }
            };

            const primaryRows = (data ?? []) as Array<ContractSessionRow>;
            for (const row of primaryRows) {
                if (!row?.id) continue;
                hydrateRow(row.id, row);
            }

            const conversationByContractId = new Map<string, Conversation>();
            for (const conversation of conversations) {
                if (!conversation.contract_id) continue;
                conversationByContractId.set(conversation.contract_id, conversation);
            }

            let unresolvedConversationContractIds = contractConversationIds.filter(
                (contractId) => !rowByConversationContractId.has(contractId)
            );

            if (unresolvedConversationContractIds.length > 0) {
                const { data: proposalLinkedRows, error: proposalLinkedError } = await fetchContractRows(
                    'proposal_id',
                    unresolvedConversationContractIds
                );

                if (cancelled) return;

                if (proposalLinkedError) {
                    console.warn('[Messages] Failed to load proposal-linked contract statuses for lifecycle policy', proposalLinkedError);
                } else {
                    for (const row of (proposalLinkedRows ?? []) as Array<ContractSessionRow>) {
                        const proposalId = typeof row?.proposal_id === 'string' ? row.proposal_id : '';
                        if (!proposalId) continue;
                        hydrateRow(proposalId, row);
                    }

                    unresolvedConversationContractIds = unresolvedConversationContractIds.filter(
                        (contractId) => !rowByConversationContractId.has(contractId)
                    );
                }
            }

            if (unresolvedConversationContractIds.length > 0) {
                const { data: jobLinkedRows, error: jobLinkedError } = await fetchContractRows(
                    'job_id',
                    unresolvedConversationContractIds
                );

                if (cancelled) return;

                if (jobLinkedError) {
                    console.warn('[Messages] Failed to load job-linked contract statuses for lifecycle policy', jobLinkedError);
                } else {
                    for (const row of (jobLinkedRows ?? []) as Array<ContractSessionRow>) {
                        const jobId = typeof row?.job_id === 'string' ? row.job_id : '';
                        if (!jobId) continue;
                        hydrateRow(jobId, row);
                    }
                }
            }

            if (unresolvedConversationContractIds.length > 0 && user?.id) {
                const partnerIdByConversationContractId: Record<string, string> = {};
                for (const unresolvedId of unresolvedConversationContractIds) {
                    const partnerId = conversationByContractId.get(unresolvedId)?.otherUser.id;
                    if (!partnerId) continue;
                    partnerIdByConversationContractId[unresolvedId] = partnerId;
                }

                const partnerIds = Array.from(new Set(Object.values(partnerIdByConversationContractId)));

                if (partnerIds.length > 0) {
                    const [asClientResult, asFreelancerResult] = await Promise.all([
                        fetchContractRows('freelancer_id', partnerIds, { column: 'client_id', value: user.id }),
                        fetchContractRows('client_id', partnerIds, { column: 'freelancer_id', value: user.id }),
                    ]);

                    if (cancelled) return;

                    if (asClientResult.error) {
                        console.warn('[Messages] Failed partner contract lookup (as client)', asClientResult.error);
                    }
                    if (asFreelancerResult.error) {
                        console.warn('[Messages] Failed partner contract lookup (as freelancer)', asFreelancerResult.error);
                    }

                    const pickPreferredRow = (current: ContractSessionRow | undefined, candidate: ContractSessionRow) => {
                        if (!current) return candidate;

                        const currentTitle = typeof current.title === 'string' ? current.title.trim() : '';
                        const candidateTitle = typeof candidate.title === 'string' ? candidate.title.trim() : '';
                        if (!currentTitle && candidateTitle) return candidate;
                        if (currentTitle && !candidateTitle) return current;

                        const currentCreatedAt = Date.parse(String(current.created_at || ''));
                        const candidateCreatedAt = Date.parse(String(candidate.created_at || ''));
                        if (!Number.isFinite(currentCreatedAt)) return candidate;
                        if (!Number.isFinite(candidateCreatedAt)) return current;
                        return candidateCreatedAt > currentCreatedAt ? candidate : current;
                    };

                    const partnerBestRow: Record<string, ContractSessionRow> = {};
                    const partnerRows = [
                        ...((asClientResult.data ?? []) as Array<ContractSessionRow>),
                        ...((asFreelancerResult.data ?? []) as Array<ContractSessionRow>),
                    ];

                    for (const row of partnerRows) {
                        if (!row) continue;
                        const partnerId = row.client_id === user.id ? row.freelancer_id : row.client_id;
                        if (!partnerId) continue;

                        partnerBestRow[partnerId] = pickPreferredRow(partnerBestRow[partnerId], row);
                    }

                    for (const unresolvedId of unresolvedConversationContractIds) {
                        const partnerId = partnerIdByConversationContractId[unresolvedId];
                        if (!partnerId) continue;
                        const row = partnerBestRow[partnerId];
                        if (!row) continue;
                        hydrateRow(unresolvedId, row);
                    }
                }
            }

            unresolvedConversationContractIds = contractConversationIds.filter(
                (contractId) => !rowByConversationContractId.has(contractId)
            );

            const resolvedRows = Array.from(rowByConversationContractId.entries());

            const proposalIdsNeedingJobLookup = Array.from(new Set([
                ...unresolvedConversationContractIds,
                ...resolvedRows
                    .filter(([, row]) => {
                        const proposalId = typeof row?.proposal_id === 'string' ? row.proposal_id : '';
                        if (!proposalId) return false;

                        const existingTitle = typeof row.title === 'string' ? row.title.trim() : '';
                        const hasJobId = typeof row.job_id === 'string' && row.job_id.trim().length > 0;
                        return !hasJobId || existingTitle.length === 0;
                    })
                    .map(([, row]) => row.proposal_id as string),
            ]));

            const proposalJobIdByProposalId: Record<string, string> = {};
            if (proposalIdsNeedingJobLookup.length > 0) {
                const { data: proposalRows, error: proposalRowsError } = await supabase
                    .from('proposals')
                    .select('id, job_id')
                    .in('id', proposalIdsNeedingJobLookup);

                if (cancelled) return;

                if (proposalRowsError) {
                    console.warn('[Messages] Failed to load proposal rows for conversation title fallback', proposalRowsError);
                } else {
                    for (const proposal of (proposalRows ?? []) as Array<{ id: string; job_id: string | null }>) {
                        const proposalId = typeof proposal?.id === 'string' ? proposal.id : '';
                        const jobId = typeof proposal?.job_id === 'string' ? proposal.job_id : '';
                        if (!proposalId || !jobId) continue;
                        proposalJobIdByProposalId[proposalId] = jobId;
                    }
                }
            }

            const jobIdsNeedingTitle = Array.from(new Set(
                resolvedRows
                    .map(([, row]) => {
                        const existingTitle = typeof row.title === 'string' ? row.title.trim() : '';
                        if (existingTitle.length > 0) return null;

                        const directJobId = typeof row.job_id === 'string' ? row.job_id.trim() : '';
                        if (directJobId) return directJobId;

                        const proposalId = typeof row.proposal_id === 'string' ? row.proposal_id : '';
                        return proposalId ? proposalJobIdByProposalId[proposalId] || null : null;
                    })
                    .filter((jobId): jobId is string => Boolean(jobId))
            ));

            const fallbackJobIds = Array.from(new Set([
                ...jobIdsNeedingTitle,
                ...unresolvedConversationContractIds,
                ...Object.values(proposalJobIdByProposalId),
            ]));

            const jobTitleById: Record<string, string> = {};
            const jobDeadlineById: Record<string, string> = {};

            if (fallbackJobIds.length > 0) {
                const { data: jobsData, error: jobsError } = await supabase
                    .from('jobs')
                    .select('id, title, deadline')
                    .in('id', fallbackJobIds);

                if (cancelled) return;

                if (jobsError) {
                    console.warn('[Messages] Failed to load job titles for contract conversations', jobsError);
                } else {
                    for (const job of (jobsData ?? []) as Array<{ id: string; title: string | null; deadline?: string | null }>) {
                        const normalizedTitle = typeof job.title === 'string' ? job.title.trim() : '';
                        if (job.id && normalizedTitle) {
                            jobTitleById[job.id] = normalizedTitle;
                        }

                        const normalizedDeadline = typeof job.deadline === 'string' ? job.deadline.trim() : '';
                        if (job.id && normalizedDeadline) {
                            jobDeadlineById[job.id] = normalizedDeadline;
                        }
                    }
                }

                const missingJobTitleIds = fallbackJobIds.filter((jobId) => !jobTitleById[jobId]).slice(0, 16);
                if (missingJobTitleIds.length > 0) {
                    const resolvedViaPublicLookup = await Promise.all(missingJobTitleIds.map(async (jobId) => {
                        const { data: jobData, error: jobError } = await getJobById(jobId);
                        if (jobError || !jobData) return null;

                        const title = typeof (jobData as { title?: string | null }).title === 'string'
                            ? (jobData as { title?: string | null }).title?.trim()
                            : '';
                        const deadline = typeof (jobData as { deadline?: string | null }).deadline === 'string'
                            ? (jobData as { deadline?: string | null }).deadline?.trim()
                            : '';
                        if (!title && !deadline) return null;

                        return { jobId, title, deadline };
                    }));

                    if (cancelled) return;

                    for (const resolved of resolvedViaPublicLookup) {
                        if (!resolved) continue;
                        if (resolved.title) {
                            jobTitleById[resolved.jobId] = resolved.title;
                        }
                        if (resolved.deadline) {
                            jobDeadlineById[resolved.jobId] = resolved.deadline;
                        }
                    }
                }
            }

            const conversationIdsNeedingPartnerProposalFallback = Array.from(new Set([
                ...unresolvedConversationContractIds,
                ...resolvedRows
                    .filter(([conversationContractId, row]) => {
                        const existingTitle = typeof row?.title === 'string' ? row.title.trim() : '';
                        if (existingTitle.length > 0) return false;

                        const directJobId = typeof row?.job_id === 'string' ? row.job_id.trim() : '';
                        if (directJobId && jobTitleById[directJobId]) return false;

                        const proposalId = typeof row?.proposal_id === 'string' ? row.proposal_id : '';
                        const proposalJobId = proposalId ? proposalJobIdByProposalId[proposalId] || '' : '';
                        if (proposalJobId && jobTitleById[proposalJobId]) return false;

                        return Boolean(conversationContractId);
                    })
                    .map(([conversationContractId]) => conversationContractId),
            ]));

            const partnerProposalFallbackByConversationContractId: Record<string, {
                jobId: string | null;
                title: string | null;
                proposalId: string | null;
            }> = {};

            if (conversationIdsNeedingPartnerProposalFallback.length > 0 && user?.id) {
                const partnerIdByConversationContractId: Record<string, string> = {};
                for (const conversationContractId of conversationIdsNeedingPartnerProposalFallback) {
                    const partnerId = conversationByContractId.get(conversationContractId)?.otherUser.id;
                    if (!partnerId) continue;
                    partnerIdByConversationContractId[conversationContractId] = partnerId;
                }

                const partnerIds = Array.from(new Set(Object.values(partnerIdByConversationContractId)));

                if (partnerIds.length > 0) {
                    const [proposalsAsClientResult, proposalsAsFreelancerResult] = await Promise.all([
                        supabase
                            .from('proposals')
                            .select('id, job_id, freelancer_id, status, created_at')
                            .in('freelancer_id', partnerIds),
                        supabase
                            .from('proposals')
                            .select('id, job_id, freelancer_id, status, created_at')
                            .in('freelancer_id', [user.id]),
                    ]);

                    if (cancelled) return;

                    if (proposalsAsClientResult.error) {
                        console.warn('[Messages] Failed partner proposal lookup (as client)', proposalsAsClientResult.error);
                    }
                    if (proposalsAsFreelancerResult.error) {
                        console.warn('[Messages] Failed partner proposal lookup (as freelancer)', proposalsAsFreelancerResult.error);
                    }

                    const proposalRows = [
                        ...((proposalsAsClientResult.data ?? []) as Array<ProposalTitleFallbackRow>),
                        ...((proposalsAsFreelancerResult.data ?? []) as Array<ProposalTitleFallbackRow>),
                    ];

                    const proposalJobIds = Array.from(new Set(
                        proposalRows
                            .map((proposal) => (typeof proposal.job_id === 'string' ? proposal.job_id.trim() : ''))
                            .filter(Boolean)
                    ));

                    const jobsById: Record<string, JobTitleLookupRow> = {};
                    if (proposalJobIds.length > 0) {
                        const { data: proposalJobsData, error: proposalJobsError } = await supabase
                            .from('jobs')
                            .select('id, title, client_id')
                            .in('id', proposalJobIds);

                        if (cancelled) return;

                        if (proposalJobsError) {
                            console.warn('[Messages] Failed proposal job lookup for conversation title fallback', proposalJobsError);
                        } else {
                            for (const job of (proposalJobsData ?? []) as Array<JobTitleLookupRow>) {
                                if (!job?.id) continue;
                                jobsById[job.id] = job;

                                const normalizedTitle = typeof job.title === 'string' ? job.title.trim() : '';
                                if (normalizedTitle && !jobTitleById[job.id]) {
                                    jobTitleById[job.id] = normalizedTitle;
                                }
                            }
                        }
                    }

                    const getProposalPriority = (status: string | null | undefined) => {
                        switch (String(status || '').trim().toLowerCase()) {
                            case 'accepted':
                                return 5;
                            case 'shortlisted':
                                return 4;
                            case 'pending':
                            case 'new':
                                return 3;
                            case 'submitted':
                                return 2;
                            case 'rejected':
                            case 'withdrawn':
                            case 'archived':
                                return 1;
                            default:
                                return 0;
                        }
                    };

                    const pickPreferredProposal = (
                        current: { jobId: string | null; title: string | null; proposalId: string | null; priority: number; createdAt: number } | undefined,
                        candidate: { jobId: string | null; title: string | null; proposalId: string | null; priority: number; createdAt: number },
                    ) => {
                        if (!current) return candidate;
                        if (candidate.priority !== current.priority) {
                            return candidate.priority > current.priority ? candidate : current;
                        }
                        return candidate.createdAt > current.createdAt ? candidate : current;
                    };

                    const bestProposalByPartnerId: Record<string, {
                        jobId: string | null;
                        title: string | null;
                        proposalId: string | null;
                        priority: number;
                        createdAt: number;
                    }> = {};

                    for (const proposal of proposalRows) {
                        const proposalId = typeof proposal.id === 'string' ? proposal.id : '';
                        const jobId = typeof proposal.job_id === 'string' ? proposal.job_id.trim() : '';
                        if (!proposalId || !jobId) continue;

                        const job = jobsById[jobId];
                        if (!job) continue;

                        const title = typeof job.title === 'string' ? job.title.trim() : '';
                        if (!title) continue;

                        let partnerId: string | null = null;
                        if (proposal.freelancer_id === user.id) {
                            const jobClientId = typeof job.client_id === 'string' ? job.client_id : '';
                            if (jobClientId && partnerIds.includes(jobClientId)) {
                                partnerId = jobClientId;
                            }
                        } else {
                            const freelancerId = typeof proposal.freelancer_id === 'string' ? proposal.freelancer_id : '';
                            const jobClientId = typeof job.client_id === 'string' ? job.client_id : '';
                            if (freelancerId && partnerIds.includes(freelancerId) && jobClientId === user.id) {
                                partnerId = freelancerId;
                            }
                        }

                        if (!partnerId) continue;

                        const createdAt = Date.parse(String(proposal.created_at || ''));
                        bestProposalByPartnerId[partnerId] = pickPreferredProposal(bestProposalByPartnerId[partnerId], {
                            jobId,
                            title,
                            proposalId,
                            priority: getProposalPriority(proposal.status),
                            createdAt: Number.isFinite(createdAt) ? createdAt : 0,
                        });
                    }

                    for (const conversationContractId of conversationIdsNeedingPartnerProposalFallback) {
                        const partnerId = partnerIdByConversationContractId[conversationContractId];
                        if (!partnerId) continue;

                        const fallback = bestProposalByPartnerId[partnerId];
                        if (!fallback) continue;

                        partnerProposalFallbackByConversationContractId[conversationContractId] = {
                            jobId: fallback.jobId,
                            title: fallback.title,
                            proposalId: fallback.proposalId,
                        };
                    }
                }
            }

            const nextStatuses: Record<string, ContractMessagingStatus> = {};
            const nextMeta: Record<string, ContractSessionMeta> = {};
            for (const contractId of contractConversationIds) {
                nextStatuses[contractId] = 'unknown';
            }

            for (const [conversationContractId, row] of resolvedRows) {
                if (!row) continue;

                const existingTitle = typeof row.title === 'string' ? row.title.trim() : '';
                const partnerFallback = partnerProposalFallbackByConversationContractId[conversationContractId];
                const resolvedJobId = (typeof row.job_id === 'string' ? row.job_id.trim() : '')
                    || (typeof row.proposal_id === 'string' ? proposalJobIdByProposalId[row.proposal_id] || '' : '')
                    || (partnerFallback?.jobId || '');
                const resolvedTitle = existingTitle
                    || (resolvedJobId ? jobTitleById[resolvedJobId] : '')
                    || partnerFallback?.title
                    || null;
                const resolvedJobDeadline = resolvedJobId
                    ? (jobDeadlineById[resolvedJobId] || null)
                    : null;

                nextStatuses[conversationContractId] = normalizeContractStatus(row.status);
                nextMeta[conversationContractId] = {
                    id: conversationContractId,
                    status: row.status,
                    title: resolvedTitle,
                    amount: row.amount ?? null,
                    total_amount: row.total_amount ?? null,
                    job_deadline: resolvedJobDeadline,
                    client_id: row.client_id ?? null,
                    freelancer_id: row.freelancer_id ?? null,
                    job_id: resolvedJobId || null,
                    proposal_id: row.proposal_id ?? partnerFallback?.proposalId ?? null,
                    linked_contract_id: row.id ?? null,
                };
            }

            for (const unresolvedId of unresolvedConversationContractIds) {
                if (nextMeta[unresolvedId]) continue;

                const jobIdFromProposal = proposalJobIdByProposalId[unresolvedId] || null;
                const partnerFallback = partnerProposalFallbackByConversationContractId[unresolvedId];
                const resolvedJobId = jobIdFromProposal || partnerFallback?.jobId || unresolvedId;
                const resolvedTitle = jobTitleById[resolvedJobId] || partnerFallback?.title || null;
                const resolvedJobDeadline = jobDeadlineById[resolvedJobId] || null;

                if (!resolvedTitle && !resolvedJobDeadline) continue;

                nextMeta[unresolvedId] = {
                    id: unresolvedId,
                    status: null,
                    title: resolvedTitle,
                    amount: null,
                    total_amount: null,
                    job_deadline: resolvedJobDeadline,
                    client_id: null,
                    freelancer_id: null,
                    job_id: resolvedJobId,
                    proposal_id: jobIdFromProposal ? unresolvedId : partnerFallback?.proposalId ?? null,
                    linked_contract_id: null,
                };
            }

                setContractStatusById((prev) => {
                    const previousKeys = Object.keys(prev);
                    const nextKeys = Object.keys(nextStatuses);

                    const isSameShape = previousKeys.length === nextKeys.length
                        && nextKeys.every((key) => Object.prototype.hasOwnProperty.call(prev, key));
                    if (!isSameShape) return nextStatuses;

                    const isSameValues = nextKeys.every((key) => prev[key] === nextStatuses[key]);
                    return isSameValues ? prev : nextStatuses;
                });

                setContractSessionMetaById(nextMeta);
            } catch (caughtError) {
                if (cancelled) return;

                console.warn('[Messages] Contract status hydration fallback to unknown', caughtError);
                const fallbackStatuses: Record<string, ContractMessagingStatus> = {};
                for (const contractId of contractConversationIds) {
                    fallbackStatuses[contractId] = 'unknown';
                }
                setContractStatusById(fallbackStatuses);
            } finally {
                if (!cancelled) setContractStatusesHydrated(true);
            }
        };

        void loadContractStatuses();

        return () => {
            cancelled = true;
        };
    }, [contractConversationIdsKey, conversations, user?.id]);

    // If there are no contract conversations at all (after loading), mark statuses as ready immediately
    // so the list renders without waiting for the status-fetch effect (which won't run)
    useEffect(() => {
        if (isLoadingConversations) return;
        if (contractConversationIds.length === 0) setContractStatusesHydrated(true);
    }, [isLoadingConversations, contractConversationIds.length]);


    // Bootstrap and force-load contract conversations when arriving via /messages?contract=<id>.
    // This keeps messaging functional even if scope metadata is stale or the conversation row was not pre-created.
    useEffect(() => {
        if (!user?.id || !routeContractId || isLoadingConversations) return;

        if (!isUuidLike(routeContractId)) {
            console.warn('[Messages] Ignoring invalid contract route id', routeContractId);
            navigate('/messages', { replace: true, state: null });
            return;
        }

        // If the conversation is already in state, auto-select it and clean up the URL.
        const existingContractConversation = conversations.find(
            (conversation) => conversation.contract_id === routeContractId
        );
        if (existingContractConversation) {
            void handleSelectConversation(existingContractConversation);
            navigate('/messages', { replace: true, state: null });
            return;
        }

        const attemptKey = `${user.id}:${routeContractId}`;
        if (contractBootstrapAttemptsRef.current.has(attemptKey)) return;
        contractBootstrapAttemptsRef.current.add(attemptKey);

        let cancelled = false;

        const bootstrapContractConversation = async () => {
            const directExistingConversation = await fetchConversationByContractId(user.id, routeContractId);
            if (cancelled) return;

            if (directExistingConversation) {
                setConversations((prev) => {
                    const withoutExisting = prev.filter((conversation) => conversation.id !== directExistingConversation.id);
                    return sortConversationsByActivity([...withoutExisting, directExistingConversation]);
                });
                await handleSelectConversation(directExistingConversation);
                navigate('/messages', { replace: true, state: null });
                return;
            }

            const contractConversationRpcResult = await supabase.rpc('get_or_create_contract_conversation', {
                p_contract_id: routeContractId,
            });

            if (cancelled) return;

            if (!contractConversationRpcResult.error) {
                const conversationIdFromContractRpc = extractRpcConversationId(contractConversationRpcResult.data);
                if (conversationIdFromContractRpc) {
                    const conversationFromContractRpcId = await fetchConversationById(user.id, conversationIdFromContractRpc);
                    if (cancelled) return;

                    if (conversationFromContractRpcId) {
                        setConversations((prev) => {
                            const withoutExisting = prev.filter((conversation) => conversation.id !== conversationFromContractRpcId.id);
                            return sortConversationsByActivity([...withoutExisting, conversationFromContractRpcId]);
                        });
                        await handleSelectConversation(conversationFromContractRpcId);
                        navigate('/messages', { replace: true, state: null });
                        return;
                    }
                }

                const conversationFromContractRpc = await fetchConversationByContractId(user.id, routeContractId);
                if (cancelled) return;

                if (conversationFromContractRpc) {
                    setConversations((prev) => {
                        const withoutExisting = prev.filter((conversation) => conversation.id !== conversationFromContractRpc.id);
                        return sortConversationsByActivity([...withoutExisting, conversationFromContractRpc]);
                    });
                    await handleSelectConversation(conversationFromContractRpc);
                    navigate('/messages', { replace: true, state: null });
                    return;
                }
            } else {
                const normalizedRpcMessage = String(contractConversationRpcResult.error.message || '').toLowerCase();
                const rpcMissing = normalizedRpcMessage.includes('get_or_create_contract_conversation')
                    && normalizedRpcMessage.includes('does not exist');

                if (!rpcMissing) {
                    console.warn('[Messages] get_or_create_contract_conversation RPC failed; using fallback bootstrap', contractConversationRpcResult.error);
                }
            }

            let otherUserId: string | null = isUuidLike(routeOtherUserId) ? routeOtherUserId : null;

            if (!otherUserId) {
                const { data: contractRow, error: contractError } = await supabase
                    .from('contracts')
                    .select('id, client_id, freelancer_id')
                    .eq('id', routeContractId)
                    .maybeSingle();

                if (cancelled) return;

                if (contractError || !contractRow) {
                    console.warn('[Messages] Contract conversation bootstrap failed to load contract', contractError);
                    contractBootstrapAttemptsRef.current.delete(attemptKey);
                    return;
                }

                const isClient = contractRow.client_id === user.id;
                const isFreelancer = contractRow.freelancer_id === user.id;
                if (!isClient && !isFreelancer) {
                    contractBootstrapAttemptsRef.current.delete(attemptKey);
                    return;
                }

                otherUserId = isClient ? contractRow.freelancer_id : contractRow.client_id;
            }

            if (!otherUserId) {
                contractBootstrapAttemptsRef.current.delete(attemptKey);
                return;
            }

            let rpcResult = await supabase.rpc('get_or_create_conversation', {
                user1: user.id,
                user2: otherUserId,
                p_contract_id: routeContractId,
                p_scope: 'contract',
            });

            if (rpcResult.error) {
                const normalizedError = String(rpcResult.error.message || '').toLowerCase();
                const shouldRetryLegacy = normalizedError.includes('p_scope')
                    || (normalizedError.includes('get_or_create_conversation') && normalizedError.includes('does not exist'));

                if (shouldRetryLegacy) {
                    rpcResult = await supabase.rpc('get_or_create_conversation', {
                        user1: user.id,
                        user2: otherUserId,
                        p_contract_id: routeContractId,
                    });
                }
            }

            if (cancelled) return;

            if (rpcResult.error) {
                console.warn('[Messages] Contract conversation bootstrap RPC failed; trying existing conversation fallback', rpcResult.error);
            }

            const conversationIdFromLegacyRpc = extractRpcConversationId(rpcResult.data);
            if (conversationIdFromLegacyRpc) {
                const conversationFromLegacyRpcId = await fetchConversationById(user.id, conversationIdFromLegacyRpc);

                if (cancelled) return;

                if (conversationFromLegacyRpcId) {
                    setConversations((prev) => {
                        const withoutExisting = prev.filter((conversation) => conversation.id !== conversationFromLegacyRpcId.id);
                        return sortConversationsByActivity([...withoutExisting, conversationFromLegacyRpcId]);
                    });
                    await handleSelectConversation(conversationFromLegacyRpcId);
                    navigate('/messages', { replace: true, state: null });
                    return;
                }
            }

            const forcedContractConversation = await fetchConversationByContractId(user.id, routeContractId);

            if (cancelled) return;

            if (forcedContractConversation) {
                setConversations((prev) => {
                    const withoutExisting = prev.filter((conversation) => conversation.id !== forcedContractConversation.id);
                    return sortConversationsByActivity([...withoutExisting, forcedContractConversation]);
                });
                await handleSelectConversation(forcedContractConversation);
                navigate('/messages', { replace: true, state: null });
                return;
            }

            const insertedContractConversation = await createContractConversationFallback(
                user.id,
                otherUserId,
                routeContractId,
            );

            if (cancelled) return;

            if (insertedContractConversation) {
                setConversations((prev) => {
                    const withoutExisting = prev.filter((conversation) => conversation.id !== insertedContractConversation.id);
                    return sortConversationsByActivity([...withoutExisting, insertedContractConversation]);
                });
                await handleSelectConversation(insertedContractConversation);
                navigate('/messages', { replace: true, state: null });
                return;
            }

            // Final fallback: if contract-linked thread cannot be resolved on this DB revision,
            // open/create a direct thread with the same partner instead of leaving an empty screen.
            let fallbackDirectRpc = await supabase.rpc('get_or_create_conversation', {
                user1: user.id,
                user2: otherUserId,
                p_contract_id: null,
                p_scope: 'shared',
            });

            if (fallbackDirectRpc.error) {
                const fallbackDirectError = String(fallbackDirectRpc.error.message || '').toLowerCase();
                const retryLegacyDirect = fallbackDirectError.includes('p_scope')
                    || (fallbackDirectError.includes('get_or_create_conversation') && fallbackDirectError.includes('does not exist'));

                if (retryLegacyDirect) {
                    fallbackDirectRpc = await supabase.rpc('get_or_create_conversation', {
                        user1: user.id,
                        user2: otherUserId,
                        p_contract_id: null,
                    });
                }
            }

            if (!fallbackDirectRpc.error) {
                const directConversationId = extractRpcConversationId(fallbackDirectRpc.data);
                if (directConversationId) {
                    const directConversation = await fetchConversationById(user.id, directConversationId);
                    if (cancelled) return;

                    if (directConversation) {
                        setConversations((prev) => {
                            const withoutExisting = prev.filter((conversation) => conversation.id !== directConversation.id);
                            return sortConversationsByActivity([...withoutExisting, directConversation]);
                        });
                        await handleSelectConversation(directConversation);
                        navigate('/messages', { replace: true, state: null });
                        return;
                    }
                }
            }

            const fallbackPairConversation = await fetchConversationByParticipants(user.id, otherUserId);
            if (cancelled) return;

            if (fallbackPairConversation) {
                setConversations((prev) => {
                    const withoutExisting = prev.filter((conversation) => conversation.id !== fallbackPairConversation.id);
                    return sortConversationsByActivity([...withoutExisting, fallbackPairConversation]);
                });
                await handleSelectConversation(fallbackPairConversation);
                navigate('/messages', { replace: true, state: null });
                return;
            }

            showToast(
                tx(
                    'pages.messages.contractOpenFailed',
                    undefined,
                    'Could not open this contract thread yet. Please refresh and try again.',
                ),
                'warning',
            );
            navigate('/messages', { replace: true, state: null });

            contractBootstrapAttemptsRef.current.delete(attemptKey);
        };

        void bootstrapContractConversation();

        return () => {
            cancelled = true;
        };
    }, [
        user?.id,
        routeContractId,
        routeOtherUserId,
        isLoadingConversations,
        conversations,
        activeMode,
        profile?.active_mode,
        // handleSelectConversation is memoized via useCallback — safe to include.
        handleSelectConversation,
        navigate,
        showToast,
        tx,
    ]);

    // Auto-select conversation from URL params or navigation state.
    // Supports:
    // - /messages?conversation=<conversationId>
    // - /messages?contract=<contractId>
    // - navigate('/messages', { state: { contractId } })
    useEffect(() => {
        if (isLoadingConversations) return;
        if (conversations.length === 0) return;

        const targetConversationId = searchParams.get('conversation');
        const targetContractId = routeContractId;

        let match: Conversation | undefined;

        if (targetConversationId) {
            match = conversations.find((conversation) => conversation.id === targetConversationId);
        }

        if (!match && targetContractId) {
            match = conversations.find((conversation) => conversation.contract_id === targetContractId);
        }

        const alreadySelected = match && selectedConversation?.id === match.id;

        if (match && !alreadySelected) {
            void handleSelectConversation(match);
            // Clean transient route hints after selection.
            navigate('/messages', { replace: true, state: null });
        }
    }, [
        searchParams,
        conversations,
        routeContractId,
        handleSelectConversation,
        isLoadingConversations,
        navigate,
        selectedConversation?.id,
    ]);

    // Load conversations
    useEffect(() => {
        if (!user) return;

        const loadConversations = async (currentPage: number, append: boolean = false) => {
            if (!append && conversations.length === 0) setIsLoadingConversations(true);
            if (append) setIsLoadingMore(true);

            const limit = 20;
            const { data, count, error } = await getConversations(user.id, currentPage, limit, {
                scopes: conversationScopes,
            });

            if (error) {
                showToast(error.message, 'error');
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            } else if (data) {
                let scopedData = data.filter((conversation) => (
                    isConversationVisibleInMode(conversation, user.id, activeMode ?? profile?.active_mode)
                    || (routeContractId ? conversation.contract_id === routeContractId : false)
                ));

                if (routeContractId && !scopedData.some((conversation) => conversation.contract_id === routeContractId)) {
                    const directRouteConversation = await fetchConversationByContractId(user.id, routeContractId);
                    if (directRouteConversation) {
                        const withoutExisting = scopedData.filter((conversation) => conversation.id !== directRouteConversation.id);
                        scopedData = sortConversationsByActivity([...withoutExisting, directRouteConversation]);
                    }
                }

                if (append) {
                    setConversations(prev => {
                        const existingIds = new Set(prev.map(c => c.id));
                        const uniqueNew = scopedData.filter(c => !existingIds.has(c.id));
                        return sortConversationsByActivity([...prev, ...uniqueNew]);
                    });
                } else {
                    setConversations(sortConversationsByActivity(scopedData));
                }
                setHasMoreConversations((currentPage + 1) * limit < (count || 0));
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            } else {
                // Handle edge case: no error and no data (should not happen)
                console.warn('[loadConversations] Unexpected state: no error and no data');
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            }
        };

        void loadConversations(page, page > 0);

        // Only setup subscription on initial mount/page 0 to avoid duplicates
        if (page === 0) {
            conversationsChannelRef.current = subscribeToConversations(user.id, conversationScopes, (payload) => {
                const eventType = payload.eventType;
                if (eventType === 'UPDATE') {
                    const changed = payload.new as any;
                    setConversations(prev => {
                        const idx = prev.findIndex(c => c.id === changed.id);
                        if (idx > -1) {
                            const updated = [...prev];
                            const isParticipant1 = changed.participant_1 === user.id;
                            const unread_count = isParticipant1 ? changed.unread_count_1 : changed.unread_count_2;
                            updated[idx] = {
                                ...updated[idx],
                                last_message_text: changed.last_message_text,
                                last_message_at: changed.last_message_at,
                                unread_count: unread_count || 0,
                            };
                            return sortConversationsByActivity(updated);
                        }
                        // If it's a new conversation we don't have loaded, do a fetch
                        loadConversations(0, false);
                        return prev;
                    });
                } else if (eventType === 'INSERT') {
                    loadConversations(0, false);
                    setPage(0);
                }
            });
        }

        return () => {
            if (page === 0 && conversationsChannelRef.current) {
                conversationsChannelRef.current.unsubscribe();
            }
        };
    }, [user?.id, page, conversationScopes.join('|'), routeContractId, activeMode, profile?.active_mode]);

    // Reset pagination when filter or search changes
    useEffect(() => {
        setPage(0);
    }, [filter, searchQuery]);

    // Load messages when conversation is selected
    useEffect(() => {
        if (!selectedConversation || !user) return;

        const loadMessages = async () => {
            const requestId = ++messageRequestIdRef.current;
            const cachedMessages = messageCacheRef.current[selectedConversation.id]
                ?? readSessionCache<ThreadMessage[]>(getMessagesCacheKey(selectedConversation.id));

            if (cachedMessages && cachedMessages.length > 0) {
                setMessages(cachedMessages);
                setIsLoadingMessages(false);
            } else {
                setMessages([]);
                setIsLoadingMessages(true);
            }

            const { data, error } = await getMessages(selectedConversation.id);

            if (messageRequestIdRef.current !== requestId) return;

            if (error) {
                if (!cachedMessages || cachedMessages.length === 0) {
                    showToast(error.message, 'error');
                }
            } else if (data) {
                const threadMessages = data as ThreadMessage[];
                setMessages(threadMessages);
                messageCacheRef.current[selectedConversation.id] = threadMessages;

                const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
                if (lastMessage) {
                    updateConversationPreview(selectedConversation.id, (conversation) => ({
                        ...conversation,
                        last_message_text: getReplyPreviewTextForMessage(lastMessage),
                        last_message_at: lastMessage.created_at,
                    }));
                }
            }

            setIsLoadingMessages(false);

            // Mark conversation as read
            const { error: readError } = await markConversationRead(selectedConversation.id, user.id);
            if (!readError && messageRequestIdRef.current === requestId) {
                const seenCount = Math.max(0, Math.floor(selectedConversation.unread_count || 0));
                if (seenCount > 0 && typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('messages:unread-seen', { detail: { count: seenCount } }));
                }

                setMessages((prev) => prev.map((message) => (
                    message.receiver_id === user.id ? { ...message, is_read: true, status: undefined } : message
                )));
                updateConversationPreview(selectedConversation.id, (conversation) => ({
                    ...conversation,
                    unread_count: 0,
                }));
            }
        };

        loadMessages();

        // Subscribe to new messages in this conversation
        messagesChannelRef.current = subscribeToConversation(
            selectedConversation.id,
            (payload) => {
                if (payload.eventType === 'UPDATE') {
                    const updatedMessage = payload.new as unknown as ThreadMessage;
                    setMessages((prev) => {
                        const nextMessages = prev.map((message) => (
                            message.id === updatedMessage.id ? { ...message, ...updatedMessage, status: undefined } : message
                        ));

                        updateConversationPreview(selectedConversation.id, (conversation) => ({
                            ...conversation,
                            ...getThreadPreview(nextMessages, deletedMessageLabel),
                        }));

                        return nextMessages;
                    });
                    return;
                }

                if (payload.eventType === 'DELETE') {
                    const deletedMessage = payload.old as unknown as ThreadMessage;
                    setMessages((prev) => {
                        const nextMessages = prev.filter((message) => message.id !== deletedMessage.id);
                        updateConversationPreview(selectedConversation.id, (conversation) => ({
                            ...conversation,
                            ...getThreadPreview(nextMessages, deletedMessageLabel),
                        }));
                        return nextMessages;
                    });
                    return;
                }

                if (payload.eventType !== 'INSERT') return;

                const newMsg = payload.new as unknown as ThreadMessage;

                setMessages((prev) => {
                    if (prev.some((message) => message.id === newMsg.id)) {
                        return prev;
                    }

                    const optimisticIndex = prev.findIndex((message) => (
                        message.status === 'sending'
                        && message.sender_id === newMsg.sender_id
                        && message.receiver_id === newMsg.receiver_id
                        && message.content === newMsg.content
                    ));

                    if (optimisticIndex > -1) {
                        const updated = [...prev];
                        updated[optimisticIndex] = { ...newMsg };
                        return updated;
                    }

                    return [...prev, newMsg];
                });

                updateConversationPreview(selectedConversation.id, (conversation) => ({
                    ...conversation,
                    last_message_text: getReplyPreviewTextForMessage(newMsg),
                    last_message_at: newMsg.created_at,
                    unread_count: newMsg.sender_id === user.id ? 0 : conversation.unread_count,
                }));
            }
        );

        return () => {
            if (messagesChannelRef.current) {
                messagesChannelRef.current.unsubscribe();
            }
        };
     }, [selectedConversation?.id, user?.id]);

    // Subscribe to ALL new messages directed at this user (not just the selected conversation).
    // This keeps the sidebar conversation list fresh in real-time.
    // IMPORTANT: scope-gated — only processes messages that belong to conversations
    // already visible in the current mode's inbox (freelancer vs client). This prevents
    // a freelancer-scoped message from appearing in the client inbox and vice-versa.
    useEffect(() => {
        if (!user?.id) return;

        let globalMessagesChannelRef = null as any;

        globalMessagesChannelRef = supabase
            .channel(`user_messages:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}` // Messages sent TO this user
                },
                (payload: any) => {
                    const newMsg = payload.new as unknown as Message;

                    setConversations(prev => {
                        const convIdx = prev.findIndex(c => c.id === newMsg.conversation_id);

                        // ── Scope gate ────────────────────────────────────────────────
                        // If the conversation isn't in our current scoped list it means
                        // it belongs to a different mode (e.g. freelancer message arriving
                        // while in client mode). Do NOT mutate state — return as-is.
                        if (convIdx === -1) {
                            // A truly new conversation (never loaded yet) — trigger a
                            // page-0 reload which will fetch with the correct scopes.
                            setPage(prevPage => prevPage === 0 ? prevPage : 0);
                            return prev;
                        }

                        // Conversation exists in the current scoped list — update it
                        const updated = [...prev];
                        // Clone the conversation object so we don't mutate the array directly
                        const conv: Conversation = { ...updated[convIdx] };
                        updated.splice(convIdx, 1); // Remove from current position

                        // Update last message preview
                        conv.last_message_text = newMsg.content;
                        conv.last_message_at = newMsg.created_at;

                        // Increment unread count if it's not the currently selected conversation.
                        // Update BOTH the raw participant fields AND the derived display field
                        // so the conversation badge renders correctly without a DB round-trip.
                        if (selectedConversation?.id !== newMsg.conversation_id) {
                            const isParticipant1 = conv.participant_1 === user.id;
                            if (isParticipant1) {
                                conv.unread_count_1 = (conv.unread_count_1 || 0) + 1;
                            } else {
                                conv.unread_count_2 = (conv.unread_count_2 || 0) + 1;
                            }
                            // Keep the display field in sync — this is what the UI badge reads
                            conv.unread_count = (conv.unread_count || 0) + 1;
                        }

                        // Bubble the conversation to the top of the list
                        return [conv, ...updated];
                    });
                }
            )
            .subscribe();

        return () => {
            if (globalMessagesChannelRef) {
                globalMessagesChannelRef.unsubscribe();
            }
        };
    }, [user?.id, selectedConversation?.id]);

    useEffect(() => {
        if (selectedConversation && newMessage !== undefined) {
            const draftKey = `draft_${selectedConversation.id}`;
            if (newMessage.trim() === '') {
                localStorage.removeItem(draftKey);
            } else {
                localStorage.setItem(draftKey, newMessage);
            }
        }
    }, [newMessage, selectedConversation?.id]);

    const MAX_RECORDING_SECONDS = 5 * 60; // 5 minutes max recording limit
    useEffect(() => {
        if (isRecording && recordingTime >= MAX_RECORDING_SECONDS) {
            stopRecording();
            showToast(tx('pages.messages.errors.recordingLimit', undefined, 'Recording limit reached (5 minutes)'), 'warning');
        }
    }, [recordingTime, isRecording]);

    const syncContractStatusLocally = useCallback((contractId: string, status: ContractMessagingStatus) => {
        setContractStatusById((prev) => ({
            ...prev,
            [contractId]: status,
        }));

        setContractSessionMetaById((prev) => {
            const existing = prev[contractId];
            if (!existing) return prev;
            return {
                ...prev,
                [contractId]: {
                    ...existing,
                    status,
                },
            };
        });
    }, []);

    const handleDeliverContractWork = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !user?.id) return;

        setDeliveryActionError(null);
        setIsDeliveringContractWork(true);
        try {
            if (selectedContractUserRole !== 'freelancer') {
                throw new Error(tx('contract.deliverBlocked', undefined, 'Only the freelancer can deliver work for this contract.'));
            }

            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canFreelancerDeliverForStatus(workflowStatus)) {
                throw new Error(tx('contract.deliverBlocked', undefined, 'This contract is not ready for delivery.'));
            }

            const contractId = selectedConversation.contract_id;
            const trimmedNote = deliveryNote.trim();
            const messageContent = trimmedNote
                ? `[[delivery]] ${trimmedNote}`
                : '[[delivery]] Work delivered and ready for review';
            const { data: deliveryResult, error: deliveryError } = await supabase.rpc('submit_contract_delivery_atomic', {
                p_contract_id: contractId,
                p_delivery_note: trimmedNote || 'submitted',
            });

            if (deliveryError) throw deliveryError;

            const returnedStatus = normalizeContractStatus(
                deliveryResult && typeof deliveryResult === 'object' && 'status' in deliveryResult
                    ? String((deliveryResult as { status?: string }).status || '')
                    : null
            );

            if (returnedStatus !== 'unknown') {
                syncContractStatusLocally(contractId, returnedStatus);
            }

            const { error } = await sendContractMessage({
                contract_id: contractId,
                sender_id: user.id,
                receiver_id: selectedConversation.otherUser.id,
                content: messageContent,
                message_type: 'delivery',
            });

            if (error) throw error;

            setIsDeliverModalOpen(false);
            setDeliveryNote('');
            showToast(tx('contract.workDelivered', undefined, 'Work delivered successfully'), 'success');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.deliverError', undefined, 'Failed to deliver work'));
            setDeliveryActionError(message);
            showToast(message, 'error');
        } finally {
            setIsDeliveringContractWork(false);
        }
    }, [deliveryNote, selectedConversation, selectedContractStatus, selectedContractUserRole, showToast, syncContractStatusLocally, tx, user?.id]);

    const handleRequestContractChanges = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !user?.id) return;

        setIsRequestingContractChanges(true);
        try {
            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canClientRequestChangesForStatus(workflowStatus, contractDeliverySubmitted)) {
                throw new Error(tx('contract.requestChangesBlocked', undefined, 'Changes can only be requested after a delivery is submitted.'));
            }
            if (selectedContractRevisionRemaining <= 0) {
                throw new Error(tx('contract.revisionLimitReached', undefined, 'Revision limit reached for this contract.'));
            }

            const contractId = selectedConversation.contract_id;
            let revisionStatusApplied = false;

            const { data: revisionResult, error: updateStatusError } = await supabase.rpc('request_contract_revision_atomic', {
                p_contract_id: contractId,
                p_reason: tx('contract.requestRevision', undefined, 'Please revise according to feedback'),
            });

            if (!updateStatusError) {
                revisionStatusApplied = true;
                syncContractStatusLocally(contractId, 'revision_requested');
                setContractSessionMetaById((prev) => {
                    const existing = prev[contractId];
                    if (!existing) return prev;

                    return {
                        ...prev,
                        [contractId]: {
                            ...existing,
                            status: 'revision_requested',
                            revision_requests_count:
                                revisionResult && typeof revisionResult === 'object' && 'revision_requests_count' in revisionResult
                                    ? Number((revisionResult as { revision_requests_count?: number }).revision_requests_count ?? existing.revision_requests_count ?? 0)
                                    : (existing.revision_requests_count ?? 0) + 1,
                            max_revision_rounds:
                                revisionResult && typeof revisionResult === 'object' && 'max_revision_rounds' in revisionResult
                                    ? Number((revisionResult as { max_revision_rounds?: number }).max_revision_rounds ?? existing.max_revision_rounds ?? 2)
                                    : (existing.max_revision_rounds ?? 2),
                        },
                    };
                });
            } else if (
                isEnumValueUnsupportedError(updateStatusError, 'contract_status_enum', 'revision_requested')
                || isMissingSchemaColumnError(updateStatusError, 'contracts', 'status')
            ) {
                console.warn('[Messages] Revision status update skipped for compatibility', updateStatusError);
            } else {
                console.warn('[Messages] Failed to update contract status to revision_requested', updateStatusError);
            }

            const changeNote = tx('contract.requestRevision', undefined, 'Please revise according to feedback');
            const { error } = await sendContractMessage({
                contract_id: contractId,
                sender_id: user.id,
                receiver_id: selectedConversation.otherUser.id,
                content: `[[revision_requested]] ${changeNote}`,
                message_type: 'system',
            });

            if (error) throw error;

            if (revisionStatusApplied) {
                showToast(tx('contract.revisionSent', undefined, 'Revision request sent'), 'info');
            } else {
                showToast(
                    tx(
                        'contract.revisionSentCompatibilityNotice',
                        undefined,
                        'Revision request sent. Status update will apply once the latest contract enum migration is available.'
                    ),
                    'warning'
                );
            }
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.error', undefined, 'Action failed'));
            showToast(message, 'error');
        } finally {
            setIsRequestingContractChanges(false);
        }
    }, [contractDeliverySubmitted, selectedContractRevisionRemaining, selectedContractStatus, selectedConversation, showToast, syncContractStatusLocally, tx, user?.id]);

    const handleAcceptContractAndPay = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !user?.id) return;

        setIsAcceptingContractWork(true);
        try {
            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canClientAcceptForStatus(workflowStatus, contractDeliverySubmitted)) {
                throw new Error(tx('contract.acceptBlocked', undefined, 'Work must be delivered before it can be accepted.'));
            }

            const { error: releaseError } = await supabase.rpc('release_contract_payment_atomic', {
                p_contract_id: selectedConversation.contract_id,
            });

            if (releaseError) throw releaseError;

            syncContractStatusLocally(selectedConversation.contract_id, 'completed');

            const { error: messageError } = await sendContractMessage({
                contract_id: selectedConversation.contract_id,
                sender_id: user.id,
                receiver_id: selectedConversation.otherUser.id,
                content: '[[contract_completed]] Work has been accepted and payment released',
                message_type: 'system',
            });

            if (messageError) throw messageError;

            setIsAcceptModalOpen(false);
            showToast(tx('contract.workAccepted', undefined, 'Work accepted and payment released'), 'success');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.acceptError', undefined, 'Failed to accept work'));
            showToast(message, 'error');
        } finally {
            setIsAcceptingContractWork(false);
        }
    }, [contractDeliverySubmitted, selectedContractStatus, selectedConversation, showToast, syncContractStatusLocally, tx, user?.id]);

    const handleOpenContractDispute = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !user?.id) return;
        if (!disputeReason.trim()) return;

        setIsOpeningContractDispute(true);
        try {
            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canOpenDisputeForStatus(workflowStatus)) {
                throw new Error(tx('contract.disputeBlocked', undefined, 'A dispute cannot be opened in the current contract state.'));
            }

            const { error: disputeError } = await supabase.rpc('open_dispute_atomic', {
                p_contract_id: selectedConversation.contract_id,
                p_reason: disputeReason.trim(),
            });

            if (disputeError) throw disputeError;

            syncContractStatusLocally(selectedConversation.contract_id, 'disputed');

            const { error: messageError } = await sendContractMessage({
                contract_id: selectedConversation.contract_id,
                sender_id: user.id,
                receiver_id: selectedConversation.otherUser.id,
                content: `[[dispute_opened]] Dispute opened: ${disputeReason.trim()}`,
                message_type: 'dispute',
            });

            if (messageError) {
                console.warn('[Messages] Dispute opened but follow-up message failed', messageError);
            }

            setIsDisputeModalOpen(false);
            setDisputeReason('');
            showToast(tx('contract.disputeOpened', undefined, 'Dispute opened successfully'), 'warning');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.disputeError', undefined, 'Failed to open dispute'));
            showToast(message, 'error');
        } finally {
            setIsOpeningContractDispute(false);
        }
    }, [disputeReason, selectedContractStatus, selectedConversation, showToast, syncContractStatusLocally, tx, user?.id]);

    const handleSubmitContractReview = useCallback(async (rating: number, comment: string) => {
        if (!selectedContractId || !user?.id || !selectedConversation) {
            throw new Error('Missing contract context for review submission.');
        }

        const { error } = await submitReviewRequest(selectedContractId, rating, comment);
        if (error) {
            const errMessage = typeof error === 'object' && error !== null && 'message' in error
                ? String((error as { message?: string }).message || '')
                : '';
            throw new Error(errMessage || tx('contract.error', undefined, 'An error occurred'));
        }

        await sendContractMessage({
            contract_id: selectedContractId,
            sender_id: user.id,
            receiver_id: selectedConversation.otherUser.id,
            content: `[[review_left]] ${rating} stars: ${comment || 'No comment provided'}`,
            message_type: 'system',
        });

        setHasReviewedContractById((prev) => ({
            ...prev,
            [selectedContractId]: true,
        }));
        setIsReviewModalOpen(false);
        showToast(tx('contract.reviewSent', undefined, 'Review submitted successfully'), 'success');
    }, [selectedContractId, selectedConversation, showToast, tx, user?.id]);

    const handleSendMessage = async () => {
        const messageContent = newMessage.trim();
        const replyTargetSnapshot = replyTarget;
        const serializedMessageContent = serializeReplyMetadataIntoContent(messageContent, replyTargetSnapshot);

        if ((!messageContent && !selectedFile && !audioBlob) || !selectedConversation || !user) return;

        if (selectedConversationPolicy && !selectedConversationPolicy.canSend) {
            const blockedMessage = selectedConversationPolicy.blockedReasonFallback
                || 'This conversation is read-only right now.';
            showToast(
                tx(
                    'pages.messages.readOnlyThread',
                    { message: blockedMessage },
                    blockedMessage,
                ),
                'warning'
            );
            return;
        }

        if (selectedFile && selectedConversationPolicy && !selectedConversationPolicy.canAttachFiles) {
            const blockedMessage = selectedConversationPolicy.blockedReasonFallback
                || 'Attachments are disabled for this conversation.';
            showToast(
                tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage),
                'warning'
            );
            return;
        }

        if (audioBlob && selectedConversationPolicy && !selectedConversationPolicy.canSendVoiceNotes) {
            const blockedMessage = selectedConversationPolicy.blockedReasonFallback
                || 'Voice notes are disabled for this conversation.';
            showToast(
                tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage),
                'warning'
            );
            return;
        }

        if (selectedConversation.contract_id && messageContent) {
            const safetyResult = detectContractChatSafetyRisk(messageContent);
            if (safetyResult.blocked) {
                showToast(
                    tx(
                        'contract.chatSafetyBlocked',
                        { message: safetyResult.reason || '' },
                        safetyResult.reason || 'This message is blocked by contract safety rules.'
                    ),
                    'warning'
                );
                return;
            }
        }

        if (!isOnline) {
            // Store offline message with base64-encoded files for persistence
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for offline storage
            
            let fileBase64: string | null = null;
            let fileName: string | null = null;
            let fileType: string | null = null;
            let fileSize: number | null = null;
            
            let audioBase64: string | null = null;
            let audioFileName: string | null = null;
            let audioType: string | null = null;
            
            try {
                // Convert file to base64 if small enough
                if (selectedFile) {
                    if (selectedFile.size <= MAX_FILE_SIZE) {
                        fileBase64 = await fileToBase64(selectedFile);
                        fileName = selectedFile.name;
                        fileType = selectedFile.type;
                        fileSize = selectedFile.size;
                    } else {
                        showToast(tx('pages.messages.offline.fileTooLarge', undefined, 'File too large for offline storage (max 5MB)'), 'warning');
                        return;
                    }
                }
                
                // Convert audio blob to base64
                if (audioBlob) {
                    if (audioBlob.size <= MAX_FILE_SIZE) {
                        const voiceMemo = buildVoiceMemoFile(audioBlob);
                        audioBase64 = await blobToBase64(audioBlob);
                        audioFileName = voiceMemo.fileName;
                        audioType = voiceMemo.mimeType;
                    } else {
                        showToast(tx('pages.messages.offline.audioTooLarge', undefined, 'Audio too large for offline storage'), 'warning');
                        return;
                    }
                }
            } catch (error) {
                console.error('[Offline Queue] Failed to encode file:', error);
                showToast(tx('pages.messages.offline.encodingFailed', undefined, 'Failed to prepare file for offline storage'), 'error');
                return;
            }
            
            const offlineMsg = {
                id: `pending_${Date.now()}`,
                content: serializedMessageContent,
                fileBase64,
                fileName,
                fileType,
                fileSize,
                audioBase64,
                audioFileName,
                audioType,
            };

            const updatedQueue = [...pendingQueue, offlineMsg];
            setPendingQueue(updatedQueue);
            
            // Save to localStorage with base64-encoded files
            try {
                localStorage.setItem(`pendingQueue_${selectedConversation.id}`, JSON.stringify(updatedQueue));
            } catch (error) {
                console.error('[Offline Queue] localStorage failed:', error);
                showToast(tx('pages.messages.offline.storageFailed', undefined, 'Failed to save message offline'), 'error');
            }
            
            setNewMessage('');
            setReplyTarget(null);
            if (audioBlob) cancelRecording();
            if (selectedFile) setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            showToast(tx('pages.messages.offline.queued', undefined, 'You are offline. Message queued and will send when reconnected.'), 'info');
            return;
        }

        stopTyping();

        const activeConversation = selectedConversation;
        const fileToSend = selectedFile;
        const recordedAudio = audioBlob;
        const optimisticId = `temp_${Date.now()}`;
        const optimisticCreatedAt = new Date().toISOString();
        const previewText = messageContent
            || (recordedAudio
                ? tx('pages.messages.voiceMemo', undefined, 'Audio note')
                : fileToSend?.name || tx('pages.messages.attachmentLabel', undefined, 'Attachment'));
        const optimisticContent = serializedMessageContent || previewText;
        const previousPreview = {
            last_message_text: activeConversation.last_message_text,
            last_message_at: activeConversation.last_message_at,
        };

        const optimisticMessage: ThreadMessage = {
            id: optimisticId,
            conversation_id: activeConversation.id,
            sender_id: user.id,
            receiver_id: activeConversation.otherUser.id,
            content: optimisticContent,
            attachments: [],
            is_read: false,
            created_at: optimisticCreatedAt,
            contract_id: activeConversation.contract_id,
            proposal_id: null,
            status: 'sending',
            sender: {
                id: user.id,
                full_name: profile?.full_name || tx('common.you', undefined, 'You'),
                avatar_url: profile?.avatar_url || null,
            },
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        updateConversationPreview(activeConversation.id, (conversation) => ({
            ...conversation,
            last_message_text: previewText,
            last_message_at: optimisticCreatedAt,
            unread_count: 0,
        }));

        setNewMessage('');
        setReplyTarget(null);
        if (fileToSend) {
            setSelectedFile(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (recordedAudio) {
            cancelRecording();
        }
        messageInputRef.current?.focus();

        setIsSending(true);
        setUploadProgress(0);
        
        let progressInterval: NodeJS.Timeout | null = null;
        if (selectedFile || audioBlob) {
            // Simulate upload progress
            progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 500);
        }

        const attachments: Message['attachments'] = [];

        try {
            const uploadTasks: Promise<Message['attachments'][number]>[] = [];

            if (recordedAudio) {
                const voiceMemo = buildVoiceMemoFile(recordedAudio);
                const audioFile = voiceMemo.file;
                uploadTasks.push((async () => {
                    const { url, error } = await uploadMessageAttachment(audioFile, activeConversation.id);
                    if (error || !url) {
                        throw new Error(`${tx('pages.messages.errors.audioUpload', undefined, 'Failed to upload audio')}: ${error?.message || 'Unknown error'}`);
                    }
                    return {
                        name: tx('pages.messages.voiceMemo', undefined, 'Audio note'),
                        url,
                        type: audioFile.type,
                        size: audioFile.size,
                    };
                })());
            }

            if (fileToSend) {
                uploadTasks.push((async () => {
                    const { url, error } = await uploadMessageAttachment(fileToSend, activeConversation.id);
                    if (error || !url) {
                        throw new Error(`${tx('pages.messages.errors.fileUpload', undefined, 'Failed to upload file')}: ${error?.message || 'Unknown error'}`);
                    }
                    return {
                        name: fileToSend.name,
                        url,
                        type: fileToSend.type,
                        size: fileToSend.size,
                    };
                })());
            }

            attachments.push(...await Promise.all(uploadTasks));

            if (progressInterval) {
                clearInterval(progressInterval);
                setUploadProgress(100);
            }

            const { data, error } = await sendMessage({
                conversationId: activeConversation.id,
                senderId: user.id,
                receiverId: activeConversation.otherUser.id,
                content: serializedMessageContent,
                contractId: activeConversation.contract_id,
                attachments: attachments.length > 0 ? attachments : undefined
            });

            if (error) {
                throw error;
            }

            if (data) {
                const persistedMessage = data as ThreadMessage;
                setMessages((prev) => {
                    const alreadyInserted = prev.some((message) => message.id === persistedMessage.id);
                    if (alreadyInserted) {
                        return prev.map((message) => (
                            message.id === persistedMessage.id ? { ...persistedMessage } : message
                        ));
                    }

                    const optimisticIndex = prev.findIndex((message) => message.id === optimisticId);
                    if (optimisticIndex > -1) {
                        const updated = [...prev];
                        updated[optimisticIndex] = { ...persistedMessage };
                        return updated;
                    }

                    return [...prev, { ...persistedMessage }];
                });
            }
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : tx('pages.messages.errors.sendFailed', undefined, 'Failed to send message');

            setMessages((prev) => prev.map((item) => (
                item.id === optimisticId ? { ...item, status: 'failed' } : item
            )));
            updateConversationPreview(activeConversation.id, (conversation) => ({
                ...conversation,
                last_message_text:
                    conversation.last_message_at === optimisticCreatedAt
                        ? previousPreview.last_message_text
                        : conversation.last_message_text,
                last_message_at:
                    conversation.last_message_at === optimisticCreatedAt
                        ? previousPreview.last_message_at
                        : conversation.last_message_at,
            }));
            if (messageContent) {
                setNewMessage((current) => current || messageContent);
            }
            if (replyTargetSnapshot) {
                setReplyTarget((current) => current || replyTargetSnapshot);
            }
            showToast(message, 'error');
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setIsSending(false);
            setTimeout(() => setUploadProgress(0), 1500); // clear progress bar after short delay
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!canAttachInSelectedConversation) {
                const blockedMessage = selectedConversationPolicy?.blockedReasonFallback
                    || 'Attachments are disabled for this conversation.';
                showToast(
                    tx(
                        'pages.messages.readOnlyThread',
                        { message: blockedMessage },
                        blockedMessage,
                    ),
                    'warning'
                );
                e.target.value = '';
                return;
            }

            const validation = validateUploadSelection({
                bucket: 'message_attachments',
                fileName: file.name,
                mimeType: normalizeMimeType(file.type),
                size: file.size,
            });
            if (!validation.ok) {
                showToast(validation.reason || tx('pages.messages.errors.fileUnsupported', undefined, 'Unsupported file type'), 'error');
                e.target.value = '';
                return;
            }

            try {
                const payloadValidation = validateUploadPayload({
                    bucket: 'message_attachments',
                    fileName: file.name,
                    mimeType: normalizeMimeType(file.type),
                    size: file.size,
                    bytes: new Uint8Array(await file.arrayBuffer()),
                });

                if (!payloadValidation.ok) {
                    showToast(payloadValidation.reason || tx('pages.messages.errors.fileUnsupported', undefined, 'Unsupported file type'), 'error');
                    e.target.value = '';
                    return;
                }
            } catch (error) {
                console.error('[Messages] Failed to inspect attachment payload:', error);
                showToast(tx('pages.messages.errors.fileInspectionFailed', undefined, 'Could not verify this file safely. Please choose another file.'), 'error');
                e.target.value = '';
                return;
            }

            setSelectedFile(file);
        }
    };

    const getConversationSidebarTitle = useCallback((conversation: Conversation) => {
        return conversation.otherUser.full_name;
    }, []);
    const archiveConversation = useCallback((conversationId: string) => {
        setArchivedConversationIds((prev) => {
            const next = new Set(prev);
            next.add(conversationId);
            try { localStorage.setItem('workedin_archived_conversations', JSON.stringify([...next])); } catch {}
            return next;
        });
        // Deselect if currently open
        if (selectedConversation?.id === conversationId) {
            setSelectedConversation(null);
            setShowMobileThread(false);
        }
    }, [selectedConversation?.id]);

    const unarchiveConversation = useCallback((conversationId: string) => {
        setArchivedConversationIds((prev) => {
            const next = new Set(prev);
            next.delete(conversationId);
            try { localStorage.setItem('workedin_archived_conversations', JSON.stringify([...next])); } catch {}
            return next;
        });
    }, []);

    // Archive-aware filtering and smart sorting
    const filteredConversations = useMemo(() => {
        return conversations.filter((c) => {
            const contractStatus = c.contract_id ? contractStatusById[c.contract_id] ?? '' : '';
            const isTerminalAndRead = TERMINAL_STATUSES.has(contractStatus) && c.unread_count === 0
                && selectedConversation?.id !== c.id;
            const isManuallyArchived = archivedConversationIds.has(c.id);
            const isArchived = isManuallyArchived || isTerminalAndRead;

            // In archive view: show only archived items
            if (showArchived) return isArchived;
            // In normal view: hide archived items
            if (isArchived) return false;

            if (filter === 'unread' && c.unread_count === 0) return false;
            if (searchQuery) {
                const normalizedQuery = searchQuery.toLowerCase();
                const byName = c.otherUser.full_name.toLowerCase().includes(normalizedQuery);
                const contractTitle = getResolvedContractTitle(c).toLowerCase();
                if (!byName && !contractTitle.includes(normalizedQuery)) return false;
            }
            return true;
        });
    }, [conversations, contractStatusById, archivedConversationIds, showArchived, filter, searchQuery, selectedConversation?.id, getResolvedContractTitle]);

    const displayConversations = useMemo(() => {
        const seenKeys = new Set<string>();
        const deduped: Conversation[] = [];

        for (const conversation of filteredConversations) {
            const groupingKey = conversation.contract_id
                ? `contract:${conversation.contract_id}`
                : `direct:${conversation.otherUser.id}`;

            if (seenKeys.has(groupingKey)) continue;
            seenKeys.add(groupingKey);
            deduped.push(conversation);
        }

        return sortConversationsByActivity(deduped, contractStatusById);
    }, [filteredConversations, contractStatusById]);

    const conversationSummaryLabel = useMemo(() => {
        if (showArchived) {
            return `${conversationWorkspaceLabel} / ${tx('pages.messages.archivedLabel', undefined, 'ARCHIVED')}`;
        }
        const countLabel = searchQuery
            ? tx('pages.messages.searchResultsSummary', { count: displayConversations.length }, `${displayConversations.length} results`)
            : tx('pages.messages.threadCountSummary', { count: displayConversations.length }, `${displayConversations.length} threads`);

        return `${conversationWorkspaceLabel} / ${countLabel}`;
    }, [conversationWorkspaceLabel, displayConversations.length, searchQuery, showArchived, tx]);

    // conversationsVirtualizer removed — the list now uses a plain scrollable div
    // (virtualizer caused layout bugs with dynamic row heights).

    // Filter out messages deleted for the current user
    const displayMessages = messages.filter((message) => !deletedForMeMessageIds.has(message.id));

    // messagesVirtualizer removed - using native flex column.

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return tx('pages.messages.time.now', undefined, 'Now');
        if (diffMins < 60) return tx('pages.messages.time.minutesAgo', { count: diffMins }, `${diffMins} min ago`);
        if (diffHours < 24) return tx('pages.messages.time.hoursAgo', { count: diffHours }, `${diffHours} h ago`);
        if (diffDays < 7) return tx('pages.messages.time.daysAgo', { count: diffDays }, `${diffDays} d ago`);

        return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US');
    };

    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getReplyPreviewTextForMessage = useCallback((message: ThreadMessage) => {
        const rawText = getMessageDisplayText(message, deletedMessageLabel)?.trim() || '';
        if (rawText) {
            const maxReplyPreviewLength = 120;
            return rawText.length > maxReplyPreviewLength
                ? `${rawText.slice(0, maxReplyPreviewLength - 1)}...`
                : rawText;
        }

        const attachments = message.attachments ?? [];
        if (attachments.some((attachment) => isAudioAttachment(attachment))) {
            return tx('pages.messages.voiceMemo', undefined, 'Audio note');
        }
        if (attachments.some((attachment) => isImageAttachment(attachment))) {
            return tx('pages.messages.imageLabel', undefined, 'Image');
        }
        if (attachments.length > 0) {
            return tx('pages.messages.attachmentLabel', undefined, 'Attachment');
        }

        return tx('pages.messages.attachmentLabel', undefined, 'Attachment');
    }, [deletedMessageLabel, tx]);

    const buildReplyMetadataFromMessage = useCallback((message: ThreadMessage): ReplyMetadata => {
        const senderName = message.sender_id === user?.id
            ? tx('common.you', undefined, 'You')
            : selectedConversation?.otherUser.full_name
                || message.sender?.full_name
                || tx('pages.messages.userFallback', undefined, 'user');

        return {
            messageId: message.id,
            senderName,
            previewText: getReplyPreviewTextForMessage(message),
        };
    }, [getReplyPreviewTextForMessage, selectedConversation?.otherUser.full_name, tx, user?.id]);

    const scrollToMessageById = useCallback((messageId: string) => {
        const messageIndex = displayMessages.findIndex((message) => message.id === messageId);
        if (messageIndex < 0) {
            showToast(tx('pages.messages.replyTargetMissing', undefined, 'Original message is no longer available.'), 'info');
            return;
        }

        // Native DOM scroll
        const el = document.getElementById(`message-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setHighlightedMessageId(messageId);
        if (replyHighlightTimeoutRef.current) {
            window.clearTimeout(replyHighlightTimeoutRef.current);
        }
        replyHighlightTimeoutRef.current = window.setTimeout(() => {
            setHighlightedMessageId(null);
        }, 1800);
    }, [displayMessages, showToast, tx]);

    const handleReplyToMessage = useCallback((message: ThreadMessage) => {
        if (!canReplyInSelectedConversation) return;
        if (isDeletedMessage(message)) return;
        setReplyTarget(buildReplyMetadataFromMessage(message));
        messageInputRef.current?.focus();
    }, [buildReplyMetadataFromMessage, canReplyInSelectedConversation]);

    const getConversationLastPreviewText = useCallback((conversationId: string, rawLastMessageText: string | null | undefined) => {
        const inlinePreview = parseReplyMetadataFromContent(rawLastMessageText).bodyText.trim();
        if (inlinePreview) {
            // Decode system message markers (e.g. [[review_left]], [[contract_completed]]) into
            // human-readable text so they don't appear raw in the conversation list preview.
            const decoded = resolveContractSystemMessage(inlinePreview);
            return decoded ? decoded.text : inlinePreview;
        }

        const cachedThread = messageCacheRef.current[conversationId];
        if (!cachedThread || cachedThread.length === 0) return null;

        return getReplyPreviewTextForMessage(cachedThread[cachedThread.length - 1]);
    }, [getReplyPreviewTextForMessage]);

    useEffect(() => {
        if (isLoadingConversations || conversations.length === 0) return;

        const candidates = conversations
            .filter((conversation) => {
                if (previewHydratedConversationIdsRef.current.has(conversation.id)) return false;
                return !getConversationLastPreviewText(conversation.id, conversation.last_message_text);
            })
            .slice(0, 6);

        if (candidates.length === 0) return;

        let cancelled = false;

        const hydrateMissingPreviews = async () => {
            const updates = await Promise.all(candidates.map(async (conversation) => {
                previewHydratedConversationIdsRef.current.add(conversation.id);

                const { data, error } = await getMessages(conversation.id, 1, 0);
                if (error || !data || data.length === 0) return null;

                const threadMessages = data as ThreadMessage[];
                const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
                if (!lastMessage) return null;

                messageCacheRef.current[conversation.id] = threadMessages;
                return {
                    conversationId: conversation.id,
                    previewText: getReplyPreviewTextForMessage(lastMessage),
                    createdAt: lastMessage.created_at,
                };
            }));

            if (cancelled) return;

            const updatesById = new Map(
                updates
                    .filter((update): update is { conversationId: string; previewText: string; createdAt: string } => Boolean(update))
                    .map((update) => [update.conversationId, update])
            );

            if (updatesById.size === 0) return;

            setConversations((prev) => prev.map((conversation) => {
                const update = updatesById.get(conversation.id);
                if (!update) return conversation;

                return {
                    ...conversation,
                    last_message_text: conversation.last_message_text || update.previewText,
                    last_message_at: conversation.last_message_at || update.createdAt,
                };
            }));
        };

        void hydrateMissingPreviews();

        return () => {
            cancelled = true;
        };
    }, [conversations, getConversationLastPreviewText, getReplyPreviewTextForMessage, isLoadingConversations]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages.length, pendingQueue.length]);

    const renderConversationList = () => (
        <div className={`${showMobileThread ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-[#1b1f24] bg-[#121212] flex-col shrink-0`}>
            {/* Header */}
            <div className="border-b border-[#1b1f24] bg-[#141414] p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-on-surface">{tx('pages.messages.title', undefined, 'Messages')}</h2>
                        <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-on-surface-subtle">
                            {conversationSummaryLabel}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className={`flex h-9 w-full items-center gap-2 rounded-xl border px-3 text-sm transition-all ${accentClasses.searchSurface}`}>
                    <Search className="h-3.5 w-3.5 shrink-0 text-on-surface-subtle" />
                    <input
                        id="messages-conversation-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tx('pages.messages.searchPlaceholder', undefined, 'Search conversations...')}
                        className="w-full border-0 bg-transparent p-0 text-sm text-on-surface outline-none placeholder:text-on-surface-subtle focus:outline-none focus:ring-0"
                    />
                    {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery('')} className="text-on-surface-subtle hover:text-on-surface transition-colors">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter chips */}
                {!showArchived && (
                    <div className="flex gap-1.5">
                        {(['all', 'unread'] as const).map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setFilter(f)}
                                className={`rounded-lg px-3 py-1 text-[11px] font-medium transition-all ${
                                    filter === f
                                        ? `${accentClasses.contractToggleActive} border`
                                        : 'text-on-surface-subtle hover:text-on-surface hover:bg-[#1f1f1f] border border-transparent'
                                }`}
                            >
                                {f === 'all' ? tx('pages.messages.filterAll', undefined, 'All') : tx('pages.messages.filterUnread', undefined, 'Unread')}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Conversation list — plain scroll, no virtualizer */}
            <div
                ref={conversationsParentRef}
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}
            >
                {(isLoadingConversations || !contractStatusesHydrated) ? (
                    <div className="h-full flex items-center justify-center px-6 py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-on-surface-subtle" />
                    </div>
                ) : displayConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                        <div className="h-10 w-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                            {showArchived
                                ? <Archive className="h-5 w-5 text-on-surface-subtle" />
                                : <Mail className="h-5 w-5 text-on-surface-subtle" />}
                        </div>
                        <p className="text-sm text-on-surface-subtle">
                            {showArchived
                                ? tx('pages.messages.empty.noArchivedTitle', undefined, 'No archived conversations')
                                : searchQuery
                                ? tx('pages.messages.empty.noMatchingTitle', undefined, 'No matching conversations')
                                : tx('pages.messages.empty.noConversationsTitle', undefined, 'No conversations yet')}
                        </p>
                    </div>
                ) : (
                    <div className="py-1">
                        {displayConversations.map((conversation) => {
                            const isActive = selectedConversation?.id === conversation.id;
                            const isArchived = archivedConversationIds.has(conversation.id);
                            const previewText = getConversationLastPreviewText(conversation.id, conversation.last_message_text)
                                || ((conversation.message_count ?? 0) > 0
                                    ? tx('pages.messages.attachmentLabel', undefined, 'Attachment')
                                    : tx('pages.messages.noMessagesYet', undefined, 'No messages yet'));

                            return (
                                <div
                                    key={conversation.id}
                                    className="group/item relative px-2 py-1"
                                >
                                    {/* Archive button — appears on hover */}
                                    <button
                                        type="button"
                                        title={isArchived ? tx('pages.messages.unarchive', undefined, 'Unarchive') : tx('pages.messages.archive', undefined, 'Archive')}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            isArchived ? unarchiveConversation(conversation.id) : archiveConversation(conversation.id);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border border-[#2a2a2a] bg-[#141414] items-center justify-center text-on-surface-subtle hover:text-on-surface transition-all opacity-0 group-hover/item:opacity-100 hidden md:flex"
                                        aria-label={isArchived ? 'Unarchive conversation' : 'Archive conversation'}
                                    >
                                        <Archive className="h-3 w-3" />
                                    </button>

                                    <div
                                        onClick={() => handleSelectConversation(conversation)}
                                        onMouseEnter={() => { void prefetchConversationMessages(conversation.id); }}
                                        onFocus={() => { void prefetchConversationMessages(conversation.id); }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                void handleSelectConversation(conversation);
                                            }
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <div className={`flex gap-3 rounded-2xl border px-3 py-3 transition-all ${
                                            isActive
                                                ? accentClasses.selectedConversationSurface
                                                : `border-transparent bg-transparent ${accentClasses.conversationHoverSurface}`
                                        }`}>
                                            {/* Avatar */}
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    navigate(getConversationProfilePath(conversation));
                                                }}
                                                aria-label={tx('pages.messages.profileAction', undefined, 'View profile')}
                                                className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#22272d] bg-[#0f1114] text-sm font-semibold text-on-surface-muted transition-all hover:ring-2 ${accentClasses.avatarHoverRing}`}
                                            >
                                                <span aria-hidden="true">{conversation.otherUser.full_name.charAt(0)}</span>
                                                {conversation.otherUser.avatar_url ? (
                                                    <img
                                                        src={conversation.otherUser.avatar_url}
                                                        alt={conversation.otherUser.full_name}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : null}
                                            </button>

                                            {/* Content */}
                                            <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden gap-[4px]">
                                                {/* Row 1 — Job/Project name + time + unread */}
                                                <div className="flex items-start justify-between gap-2">
                                                    {(() => {
                                                        const workDesc = getConversationWorkDescriptor(conversation);
                                                        return (
                                                            <p className={`truncate text-[13px] font-semibold leading-tight ${
                                                                conversation.unread_count > 0 ? 'text-on-surface' : 'text-on-surface-muted'
                                                            }`}>
                                                                {workDesc || conversation.otherUser.full_name}
                                                            </p>
                                                        );
                                                    })()}
                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                        <span className="text-[11px] tabular-nums text-on-surface-subtle">
                                                            {formatTime(conversation.last_message_at)}
                                                        </span>
                                                        {conversation.unread_count > 0 ? (
                                                            <span className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold leading-tight text-white ${accentClasses.unreadBadgeBg}`}>
                                                                {conversation.unread_count}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {/* Row 2 — Person name + Role + Status */}
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="truncate text-[11.5px] leading-tight text-on-surface-muted">
                                                        {conversation.otherUser.full_name}
                                                    </p>
                                                    {(() => {
                                                        const roleMeta = getConversationRoleMeta(conversation);
                                                        const statusMeta = getConversationStatusMeta(conversation);
                                                        return (
                                                            <>
                                                                {roleMeta ? (
                                                                    <span className={`shrink-0 inline-flex items-center rounded-md border px-1.5 py-[2px] text-[10px] font-medium leading-none ${roleMeta.className}`}>
                                                                        {roleMeta.label}
                                                                    </span>
                                                                ) : null}
                                                                {statusMeta ? (
                                                                    <span className={`shrink-0 inline-flex items-center rounded-md border px-1.5 py-[2px] text-[10px] font-medium leading-none ${statusMeta.className}`}>
                                                                        {statusMeta.label}
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Row 3 — Last message preview */}
                                                <p className={`truncate text-[11px] leading-tight ${
                                                    conversation.unread_count > 0 ? 'text-on-surface-muted' : 'text-on-surface-subtle'
                                                } ${previewText === deletedMessageLabel ? 'italic' : ''}`}>
                                                    {previewText}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasMoreConversations && displayConversations.length > 0 && !searchQuery && !showArchived ? (
                    <div className="border-t border-[#1b1f24] px-4 py-3">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={isLoadingMore}
                            className="w-full rounded-xl border border-[#242a31] bg-[#101214] px-3 py-2 text-[12px] text-on-surface-muted transition-colors hover:bg-[#171a1f] disabled:opacity-50"
                        >
                            {isLoadingMore ? tx('common.loading', undefined, 'Loading...') : tx('pages.messages.loadMore', undefined, 'Load more')}
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Archived toggle at the bottom */}
            <div className="border-t border-[#1b1f24] bg-[#141414] px-4 py-2.5">
                <button
                    type="button"
                    onClick={() => { setShowArchived((v) => !v); setSearchQuery(''); setFilter('all'); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-all ${
                        showArchived
                            ? `${accentClasses.contractToggleActive} border`
                            : 'text-on-surface-subtle hover:text-on-surface hover:bg-[#1f1f1f] border border-transparent'
                    }`}
                >
                    <Archive className="h-3.5 w-3.5" />
                    {showArchived
                        ? tx('pages.messages.backToInbox', undefined, 'Back to inbox')
                        : tx('pages.messages.viewArchived', undefined, 'Archived conversations')}
                </button>
            </div>
        </div>
    );


    const renderMessageThread = () => (
        <div className={`${showMobileThread ? 'flex' : 'hidden md:flex'} flex-1 flex-col page-bg-base relative`}>
            {selectedConversation ? (
                <div className="flex h-full min-h-0 flex-1">
                    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                        <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] ${accentClasses.threadAmbientGlow}`} />
                        <div className="relative z-20 min-h-[84px] border-b border-[#1b1f24] bg-[#151515] px-4 py-4 backdrop-blur-sm md:px-6">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowMobileThread(false)}
                                        aria-label={tx('common.back', undefined, 'Back')}
                                        className="rounded-xl p-2.5 text-on-surface-muted transition-colors hover-surface hover:text-on-surface md:hidden"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate(getConversationProfilePath(selectedConversation))}
                                        aria-label={tx('pages.messages.profileAction', undefined, 'View profile')}
                                        className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-[#22272d] bg-[#0f1114] text-sm font-semibold text-on-surface-muted shadow-md transition-all hover:ring-2 ${accentClasses.headerAvatarHoverRing}`}
                                    >
                                        <span aria-hidden="true">{selectedConversation.otherUser.full_name.charAt(0)}</span>
                                        {selectedConversation.otherUser.avatar_url ? (
                                            <img
                                                src={selectedConversation.otherUser.avatar_url}
                                                alt={selectedConversation.otherUser.full_name}
                                                className="absolute inset-0 h-full w-full object-cover"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : null}
                                    </button>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                            <p className="truncate text-base font-bold text-on-surface shrink-0">
                                                {selectedConversation.otherUser.full_name}
                                            </p>
                                            {(() => {
                                                const roleMeta = getConversationRoleMeta(selectedConversation);
                                                const statusMeta = getConversationStatusMeta(selectedConversation);

                                                return (
                                                    <>
                                                        {roleMeta ? (
                                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${roleMeta.className}`}>
                                                                {roleMeta.label}
                                                            </span>
                                                        ) : null}
                                                        <span className="inline-flex max-w-[160px] items-center rounded-full border border-surface surface-sunken px-2 py-0.5 text-[10px] font-medium text-on-surface-muted shrink-0">
                                                            <span className="truncate">{truncateText(getConversationWorkDescriptor(selectedConversation), 28)}</span>
                                                        </span>
                                                        {statusMeta ? (
                                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${statusMeta.className}`}>
                                                                {statusMeta.label}
                                                            </span>
                                                        ) : null}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedConversation.contract_id ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsContractSidebarVisible((prev) => !prev)}
                                            aria-expanded={isContractSidebarVisible}
                                            aria-controls="contract-workspace-sidebar"
                                            className={`hidden xl:inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                                isContractSidebarVisible
                                                    ? accentClasses.contractToggleActive
                                                    : accentClasses.contractToggleIdle
                                            }`}
                                        >
                                            {isContractSidebarVisible
                                                ? tx('pages.messages.hideContract', undefined, 'Hide Contract')
                                                : tx('pages.messages.openContract', undefined, 'Open Contract')}
                                        </button>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={() => setIsMenuOpen((prev) => !prev)}
                                        aria-label={tx('common.more', undefined, 'More')}
                                        className="rounded-lg p-2 text-on-surface-muted transition-colors hover-surface hover:text-on-surface"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {isMenuOpen ? (
                                <div ref={menuRef} className="absolute right-6 top-[72px] z-[70] mt-2 w-48 overflow-hidden rounded-xl border border-[#232830] bg-[#121418] py-1 shadow-2xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigate(getConversationProfilePath(selectedConversation));
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-on-surface-muted transition-colors hover-surface hover:text-on-surface"
                                    >
                                        <span className="flex items-center gap-3">
                                            <User className="w-4 h-4" />
                                            <span>{tx('pages.messages.profileAction', undefined, 'View Profile')}</span>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setConversations((prev) => prev.map((conversation) => (
                                                conversation.id === selectedConversation.id
                                                    ? { ...conversation, unread_count: Math.max(1, conversation.unread_count) }
                                                    : conversation
                                            )));
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-on-surface-muted transition-colors hover-surface hover:text-on-surface"
                                    >
                                        <span className="flex items-center gap-3">
                                            <Mail className="w-4 h-4" />
                                            <span>{tx('pages.messages.markUnread', undefined, 'Mark as Unread')}</span>
                                        </span>
                                    </button>

                                    <div className="my-1 border-t border-surface" />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            showToast(tx('pages.messages.reportSubmitted', undefined, 'User report queued for review'), 'success');
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
                                    >
                                        <span className="flex items-center gap-3">
                                            <Flag className="w-4 h-4" />
                                            <span>{tx('pages.messages.reportUser', undefined, 'Report User')}</span>
                                        </span>
                                    </button>
                                </div>
                            ) : null}
                        </div>

                    {selectedConversationPolicy
                        && selectedConversationPolicy.bannerTone !== 'none'
                        && selectedConversationPolicy.bannerFallback
                        && (selectedConversationPolicy.contractStatus !== 'unknown' || showUnknownContractBanner) ? (
                        <div className={`mx-4 md:mx-6 mt-4 rounded-xl border px-3 py-2 text-xs flex items-start gap-2 ${getLifecycleBannerClassName(selectedConversationPolicy.bannerTone)}`}>
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>
                                {tx(
                                    'pages.messages.lifecycleBanner',
                                    { message: selectedConversationPolicy.bannerFallback },
                                    selectedConversationPolicy.bannerFallback,
                                )}
                            </p>
                        </div>
                    ) : null}

                    <div ref={messagesParentRef} className="relative z-0 flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
                        {isLoadingMessages ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="h-7 w-7 animate-spin text-on-surface-subtle" />
                            </div>
                        ) : displayMessages.length === 0 && pendingQueue.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <Send className="mx-auto h-10 w-10 text-on-surface-subtle" />
                                    <p className="mt-3 text-sm text-on-surface-subtle">{tx('pages.messages.emptyThread', undefined, 'No messages yet. Start the conversation!')}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1" />
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2a2a2e] to-transparent" />
                                    <span className="rounded-full border border-[#262b31] bg-[#111317] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-on-surface-subtle">
                                        {tx('pages.messages.today', undefined, 'Today')}
                                    </span>
                                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2a2a2e] to-transparent" />
                                </div>

                                <div className="flex w-full flex-col gap-4 relative">
                                    {displayMessages.map((message) => {
                                        const isOwnMessage = message.sender_id === user?.id;
                                        const contractSystemMessageKind = getMessageContractSystemKind(message);
                                        const isContractSystemMessage = Boolean(contractSystemMessageKind);
                                        const messageText = getMessageDisplayText(message, deletedMessageLabel);
                                        const replyMetadata = getMessageReplyMetadata(message);
                                        const shouldRenderMessageText = Boolean(messageText) && !shouldHideAttachmentUrlText(message);
                                        const attachments = message.attachments ?? [];
                                        const hasAttachments = attachments.length > 0;
                                        const imageAttachmentCount = attachments.filter((attachment) => isImageAttachment(attachment)).length;
                                        const hasImageAttachment = imageAttachmentCount > 0;
                                        const firstImageAttachmentIndex = attachments.findIndex((attachment) => isImageAttachment(attachment));
                                        const shouldRenderImageCaption = shouldRenderMessageText && hasImageAttachment;
                                        const shouldRenderStandaloneText = shouldRenderMessageText && !shouldRenderImageCaption;
                                        const isImageOnlyMessage = !isDeletedMessage(message)
                                            && !shouldRenderMessageText
                                            && hasAttachments
                                            && imageAttachmentCount === attachments.length;

                                        return (
                                            <div key={message.id}>
                                                <div id={`message-${message.id}`} className={`group/message flex w-full ${isContractSystemMessage ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`relative max-w-[85%] md:max-w-[75%] flex flex-col ${isContractSystemMessage ? 'items-center' : isOwnMessage ? 'items-end' : 'items-start'}`}>
                                                        {isOwnMessage && !message.status && !message.is_deleted && !isProtectedContractEvidenceMessage(message) ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleDeleteMessage(message)}
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

                                                        <div className={`flex items-end gap-2 ${isContractSystemMessage ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                            {!isOwnMessage && !isContractSystemMessage ? (
                                                                <div className="w-6 h-6 rounded-full surface-sunken overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-on-surface-subtle">
                                                                    <span aria-hidden="true">{selectedConversation.otherUser.full_name.charAt(0)}</span>
                                                                    {selectedConversation.otherUser.avatar_url ? (
                                                                        <img
                                                                            src={selectedConversation.otherUser.avatar_url}
                                                                            alt={selectedConversation.otherUser.full_name}
                                                                            className="absolute h-6 w-6 rounded-full object-cover"
                                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                        />
                                                                    ) : null}
                                                                </div>
                                                            ) : null}

                                                            <div
                                                                className={`min-w-0 break-words ${
                                                                    isDeletedMessage(message)
                                                                        ? 'rounded-full border border-surface surface-sunken text-on-surface-subtle px-3 py-1.5 text-xs'
                                                                        : isContractSystemMessage
                                                                        ? 'rounded-xl border border-sky-500/35 bg-sky-500/10 text-sky-100 px-3 py-2 text-xs font-medium'
                                                                        : (hasImageAttachment && (isImageOnlyMessage || shouldRenderImageCaption))
                                                                        ? (isOwnMessage
                                                                            ? `${accentClasses.ownBubbleBg} p-1 overflow-hidden rounded-2xl rounded-br-sm text-white ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-80' : ''}`
                                                                            : 'surface-card border border-surface p-1 overflow-hidden rounded-2xl rounded-bl-sm text-on-surface')
                                                                        : isOwnMessage
                                                                        ? `${accentClasses.ownBubbleBg} text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-md ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-80' : ''}`
                                                                        : 'surface-card border border-surface text-on-surface px-4 py-2 rounded-2xl rounded-bl-sm text-sm'
                                                                } ${highlightedMessageId === message.id ? `ring-1 ${accentClasses.highlightRing}` : ''}`}
                                                            >
                                                                {replyMetadata ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            scrollToMessageById(replyMetadata.messageId);
                                                                        }}
                                                                        className={`mb-2 w-full rounded-lg border px-2 py-1.5 text-left ${isOwnMessage ? accentClasses.ownReplyCard : 'border-surface surface-sunken text-on-surface-muted'}`}
                                                                        aria-label={tx('pages.messages.jumpToRepliedMessage', undefined, 'Jump to replied message')}
                                                                    >
                                                                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90">{replyMetadata.senderName}</p>
                                                                        <p className="text-xs truncate opacity-90">{replyMetadata.previewText}</p>
                                                                    </button>
                                                                ) : null}

                                                                {shouldRenderStandaloneText ? (
                                                                    <CollapsibleMessageText text={messageText} isDeleted={isDeletedMessage(message)} isOwnMessage={isOwnMessage} />
                                                                ) : null}

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
                                                                                        onClick={() => { void handleOpenAttachment(att); }}
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
                                                                                                <CollapsibleMessageText text={messageText} isDeleted={isDeletedMessage(message)} isOwnMessage={isOwnMessage} />
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
                                                                                    onClick={() => { void handleOpenAttachment(att); }}
                                                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors w-full max-w-sm ${
                                                                                        isOwnMessage
                                                                                            ? accentClasses.ownAttachmentCard
                                                                                            : 'surface-card hover-surface border border-surface'
                                                                                    }`}
                                                                                    aria-label={tx('pages.messages.a11y.openAttachment', undefined, 'Open attachment')}
                                                                                >
                                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isOwnMessage ? accentClasses.ownAttachmentIcon : `bg-[#1e1c22] ${accentClasses.neutralAttachmentIcon}`}`}>
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

                                                            {isOwnMessage && !isDeletedMessage(message) && !message.status ? (
                                                                <CheckCheck className={`h-3 w-3 mb-1 ${message.is_read ? accentClasses.readReceipt : 'text-zinc-600'}`} />
                                                            ) : null}
                                                        </div>

                                                        <p className={`mt-1 text-[11px] text-zinc-600 flex items-center gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                            <span>{formatMessageTime(message.created_at)}</span>
                                                            {isOwnMessage && message.status === 'sending' ? <Clock className="h-3 w-3" /> : null}
                                                            {isOwnMessage && message.status === 'failed' ? (
                                                                <span className="text-red-400">{tx('pages.messages.sendFailed', undefined, 'Failed')}</span>
                                                            ) : null}
                                                        </p>

                                                        {!isDeletedMessage(message) && canReplyInSelectedConversation ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleReplyToMessage(message);
                                                                }}
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
                                    })}
                                </div>

                                {pendingQueue.map((pendingMsg, idx) => (
                                    <div key={`pending-${idx}`} className="flex justify-end w-full opacity-70">
                                        <div className="max-w-[80%]">
                                            <div className={`${accentClasses.ownBubbleBg} text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-md`}>
                                                <p className="text-sm break-words">{parseReplyMetadataFromContent(pendingMsg.content).bodyText || tx('pages.messages.attachmentLabel', undefined, 'Attachment')}</p>
                                                {(pendingMsg.fileName || pendingMsg.audioFileName || pendingMsg.offlineFile || pendingMsg.offlineAudio) ? (
                                                    <div className="mt-2 text-xs italic opacity-90 flex items-center gap-1">
                                                        <Paperclip className="w-3 h-3" />
                                                        <span>{pendingMsg.fileName || pendingMsg.audioFileName || pendingMsg.offlineFileName || pendingMsg.offlineFile?.name || tx('pages.messages.offline.attachmentPending', undefined, 'Attachment pending')}</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                            <p className="mt-1 text-[11px] text-zinc-600 flex items-center justify-end gap-1">
                                                <Clock className="w-3 h-3" /> {tx('pages.messages.offline.statusWaiting', undefined, 'Pending connection...')}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {typingUsers.length > 0 ? (
                        <div className="px-4 md:px-6 py-2 border-t border-[#1e1e22]">
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <div className="flex gap-1">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${accentClasses.typingDot}`} />
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${accentClasses.typingDot}`} />
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${accentClasses.typingDot}`} />
                                </div>
                                <span>
                                    {typingUsers.length === 1
                                        ? `${selectedConversation.otherUser.full_name} ${tx('pages.messages.typingIndicator.singular', undefined, 'is typing...')}`
                                        : `${typingUsers.length} ${tx('pages.messages.typingIndicator.plural', undefined, 'people are typing...')}`}
                                </span>
                            </div>
                        </div>
                    ) : null}

                    <div className="shrink-0 border-t border-[#191c21] bg-[#0d0d0f]/98 px-4 py-3 backdrop-blur-sm">
                        {replyTarget ? (
                            <div className="mb-3 rounded-xl border border-[#1f2328] bg-[#111317] px-3 py-2">
                                <div className="flex items-start gap-2">
                                    <span className={`mt-0.5 h-8 w-1 rounded-full ${accentClasses.replyStripe}`} aria-hidden="true" />
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs font-semibold ${accentClasses.headerMetaText}`}>{tx('pages.messages.replyingTo', undefined, 'Replying to')} {replyTarget.senderName}</p>
                                        <p className="text-xs text-zinc-400 truncate">{replyTarget.previewText}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReplyTarget(null)}
                                        className="rounded-md p-1 text-zinc-500 hover:bg-[#1e1c22] hover:text-white transition-colors"
                                        aria-label={tx('pages.messages.cancelReply', undefined, 'Cancel reply')}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {(selectedFile || audioBlob || isRecording) ? (
                            <div className="mb-3 space-y-2">
                                {isRecording ? (
                                    <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                        <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                                        <span>{tx('ui.recording', undefined, 'Recording')} {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            aria-label={tx('pages.messages.a11y.stopRecording', undefined, 'Stop recording')}
                                            className="ml-auto p-2 rounded-lg text-red-200 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Square className="w-4 h-4 fill-current" />
                                        </button>
                                    </div>
                                ) : null}

                                {audioBlob ? (
                                    <div className="rounded-xl border border-[#1f2328] bg-[#111317] px-3 py-2">
                                        <div className="flex items-center gap-2 text-sm text-zinc-200">
                                            <FileAudio className={`w-4 h-4 ${accentClasses.iconAccent}`} />
                                            <span className="flex-1">{tx('pages.messages.voiceMemo', undefined, 'Audio note')} • {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                            <button
                                                type="button"
                                                onClick={cancelRecording}
                                                disabled={isSending}
                                                aria-label={tx('pages.messages.a11y.removeAttachedItem', undefined, 'Remove attached item')}
                                                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1e1c22] transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {audioPreviewUrl ? (
                                            <div className="mt-2 rounded-xl border border-[#1d2126] bg-[#0f1114] px-3 py-2">
                                                <MessageAudioPlayer
                                                    src={audioPreviewUrl}
                                                    name={tx('pages.messages.voiceMemo', undefined, 'Audio note')}
                                                    isOwn
                                                    accentVariant={isFreelancerWorkspace ? 'violet' : 'amber'}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {selectedFile ? (
                                    <div className="rounded-xl border border-[#1f2328] bg-[#111317] px-3 py-2">
                                        <div className="flex items-center gap-2 text-sm text-zinc-200">
                                            <FileText className={`w-4 h-4 ${accentClasses.iconAccent}`} />
                                            <span className="flex-1 truncate">{selectedFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedFile(null)}
                                                disabled={isSending}
                                                aria-label={tx('pages.messages.a11y.removeAttachedItem', undefined, 'Remove attached item')}
                                                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1e1c22] transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept={MESSAGE_ATTACHMENT_ACCEPT} />

                        <div className={`flex items-end rounded-[26px] border p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_20px_45px_-32px_rgba(0,0,0,0.85)] transition-all ${accentClasses.composerShell}`}>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSending || !!selectedFile || !canAttachInSelectedConversation}
                                aria-label={tx('pages.messages.a11y.attachFile', undefined, 'Attach file')}
                                className="p-2.5 text-zinc-500 hover:text-white hover:bg-[#1e1c22] rounded-xl cursor-pointer transition-all disabled:opacity-50"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!canSendVoiceInSelectedConversation) {
                                        const blockedMessage = selectedConversationPolicy?.blockedReasonFallback
                                            || 'Voice notes are disabled for this conversation.';
                                        showToast(
                                            tx(
                                                'pages.messages.readOnlyThread',
                                                { message: blockedMessage },
                                                blockedMessage,
                                            ),
                                            'warning'
                                        );
                                        return;
                                    }

                                    if (isRecording) {
                                        stopRecording();
                                    } else {
                                        startRecording();
                                    }
                                }}
                                disabled={isSending || !canSendVoiceInSelectedConversation}
                                aria-label={isRecording
                                    ? tx('pages.messages.a11y.stopRecording', undefined, 'Stop recording')
                                    : tx('pages.messages.a11y.startRecording', undefined, 'Start recording')}
                                className={`p-2.5 rounded-xl transition-all ${
                                    isRecording
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'text-zinc-500 hover:text-white hover:bg-[#1e1c22]'
                                } disabled:opacity-50`}
                            >
                                {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                            </button>

                            <textarea
                                id="messages-thread-composer-input"
                                ref={messageInputRef}
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    if (e.target.value.trim()) {
                                        startTyping();
                                    } else {
                                        stopTyping();
                                    }

                                    e.currentTarget.style.height = '44px';
                                    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 128)}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        stopTyping();
                                        void handleSendMessage();
                                    }
                                }}
                                onBlur={stopTyping}
                                placeholder={canSendInSelectedConversation
                                    ? tx('pages.messages.messagePlaceholder', undefined, 'Type a message...')
                                    : (() => {
                                        const blockedMessage = selectedConversationPolicy?.blockedReasonFallback
                                            || 'This conversation is read-only.';
                                        return tx(
                                            'pages.messages.readOnlyPlaceholder',
                                            { message: blockedMessage },
                                            blockedMessage,
                                        );
                                    })()}
                                disabled={isSending || isRecording || !canSendInSelectedConversation}
                                rows={1}
                                className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 focus:border-transparent text-white text-sm px-3 py-2.5 outline-none resize-none max-h-32 min-h-[44px] placeholder:text-zinc-500 disabled:opacity-50"
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    stopTyping();
                                    void handleSendMessage();
                                }}
                                disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || isSending || isRecording || !canSendInSelectedConversation}
                                aria-label={tx('pages.messages.send', undefined, 'Send message')}
                                className={`${accentClasses.sendButton} text-white p-2.5 rounded-xl cursor-pointer transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    </div>

                    {isContractSession ? (
                        <div
                            className={`hidden xl:block shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out ${
                                isContractSidebarVisible
                                    ? 'w-[420px] 2xl:w-[460px] opacity-100'
                                    : 'w-0 opacity-0 pointer-events-none'
                            }`}
                            aria-hidden={!isContractSidebarVisible}
                        >
                            <aside
                                id="contract-workspace-sidebar"
                                className={`h-full w-[420px] 2xl:w-[460px] border-l border-[#18130f] bg-[#090807] transition-transform duration-300 ease-out ${
                                    isContractSidebarVisible ? 'translate-x-0' : 'translate-x-6'
                                }`}
                            >
                                {isContractSidebarDataLoading ? (
                                    <div className="flex h-full items-center justify-center px-6 text-center">
                                        <div className="space-y-3">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-on-surface-subtle" />
                                            <p className="text-xs text-on-surface-subtle">
                                                {tx('pages.messages.loadingContractSidebar', undefined, 'Loading contract details...')}
                                            </p>
                                        </div>
                                    </div>
                                ) : contractSidebarData ? (
                                    <ContractDetailsSidebar
                                        contract={contractSidebarData}
                                        userRole={selectedContractUserRole}
                                        currentStatus={selectedContractStatus || 'unknown'}
                                        deliverySubmitted={contractDeliverySubmitted}
                                        isActionLoading={isAnyContractActionLoading}
                                        onDeliver={() => {
                                            setDeliveryActionError(null);
                                            setIsDeliverModalOpen(true);
                                        }}
                                        onRequestChanges={() => {
                                            void handleRequestContractChanges();
                                        }}
                                        onAcceptAndPay={() => setIsAcceptModalOpen(true)}
                                        onDispute={() => setIsDisputeModalOpen(true)}
                                        onReview={() => {
                                            setIsReviewModalOpen(true);
                                        }}
                                        onOpenSharedFile={(file: { url: string; name: string; type?: string | null; size?: number | string | null }) => {
                                            void handleOpenAttachment({
                                                url: file.url,
                                                name: file.name,
                                                type: file.type || 'application/octet-stream',
                                                size: file.size ?? 0,
                                            });
                                        }}
                                        hasLeftReview={selectedContractHasReview}
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center px-6 text-center">
                                        <p className="text-xs text-on-surface-subtle">
                                            {tx('pages.messages.contractSidebarUnavailable', undefined, 'Contract details are not available for this conversation yet.')}
                                        </p>
                                    </div>
                                )}
                            </aside>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="text-center">
                        <Send className="mx-auto h-10 w-10 text-on-surface-subtle" />
                        <h3 className="mt-3 text-lg font-semibold text-white">{tx('pages.messages.selectConversationTitle', undefined, 'Select a conversation')}</h3>
                        <p className="mt-1 text-sm text-on-surface-subtle">{tx('pages.messages.selectConversationDescription', undefined, 'Choose a conversation to start messaging')}</p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className="min-h-screen page-bg-base">
                <SEO {...SEO_CONFIG.messages} url="/messages" noIndex />
                <Header />

                <main className="flex-1 w-full h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">
                    {renderConversationList()}
                    {renderMessageThread()}
                </main>
            </div>

            <Modal
                isOpen={isDeliverModalOpen}
                onClose={() => {
                    if (isDeliveringContractWork) return;
                    setIsDeliverModalOpen(false);
                    setDeliveryActionError(null);
                }}
                title={tx('contract.deliverWork', undefined, 'Deliver Work')}
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {tx('contract.deliverNoteLabel', undefined, 'Add a note for the client')}
                    </p>
                    {deliveryActionError ? (
                        <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                            {deliveryActionError}
                        </div>
                    ) : null}
                    <textarea
                        value={deliveryNote}
                        onChange={(event) => {
                            if (deliveryActionError) {
                                setDeliveryActionError(null);
                            }
                            setDeliveryNote(event.target.value);
                        }}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-[#333] bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                        placeholder={tx('contract.deliverNotePlaceholder', undefined, 'Delivery notes (optional)...')}
                        aria-label={tx('contract.deliverNoteAria', undefined, 'Delivery notes')}
                    />
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsDeliverModalOpen(false);
                                setDeliveryActionError(null);
                            }}
                            disabled={isDeliveringContractWork}
                        >
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                void handleDeliverContractWork();
                            }}
                            isLoading={isDeliveringContractWork}
                            leftIcon={<CheckCircle className="h-4 w-4" />}
                        >
                            {tx('contract.confirmDelivery', undefined, 'Confirm Delivery')}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isAcceptModalOpen}
                onClose={() => setIsAcceptModalOpen(false)}
                title={tx('contract.acceptAndPay', undefined, 'Accept and Pay')}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {tx('contract.acceptAndPayConfirm', undefined, 'This will mark the contract as completed and release payment.')}
                    </p>
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsAcceptModalOpen(false)}>
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                void handleAcceptContractAndPay();
                            }}
                            isLoading={isAcceptingContractWork}
                            leftIcon={<CheckCircle className="h-4 w-4" />}
                        >
                            {tx('contract.acceptAndPay', undefined, 'Accept and Pay')}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDisputeModalOpen}
                onClose={() => setIsDisputeModalOpen(false)}
                title={tx('contract.openDispute', undefined, 'Open Dispute')}
                size="md"
            >
                <div className="space-y-4">
                    <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                                {tx('contract.disputeWarning', undefined, 'Opening a dispute will suspend the contract while it is reviewed.')}
                            </p>
                        </div>
                    </div>
                    <textarea
                        value={disputeReason}
                        onChange={(event) => setDisputeReason(event.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-[#333] bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                        placeholder={tx('contract.disputeReasonPlaceholder', undefined, 'Explain reason for dispute...')}
                        aria-label={tx('contract.disputeReasonAria', undefined, 'Dispute reason')}
                    />
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsDisputeModalOpen(false)}>
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                void handleOpenContractDispute();
                            }}
                            isLoading={isOpeningContractDispute}
                            disabled={!disputeReason.trim()}
                        >
                            {tx('contract.openDisputeAction', undefined, 'Open Dispute')}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title={tx('contract.reviewExperience', undefined, 'Review Experience')}
                size="md"
            >
                <ReviewForm
                    jobTitle={contractSidebarData?.job?.title || tx('contract.untitledJob', undefined, 'Untitled job')}
                    recipientName={selectedConversation?.otherUser.full_name || tx('pages.messages.userFallback', undefined, 'User')}
                    onSubmit={handleSubmitContractReview}
                    onCancel={() => setIsReviewModalOpen(false)}
                />
            </Modal>

            {/* Delete Message Modal */}
            <Modal
                isOpen={!!messagePendingDelete}
                onClose={() => {
                    if (deletingMessageId) return;
                    setMessagePendingDelete(null);
                }}
                title={tx('pages.messages.deleteMessage', undefined, 'Delete message')}
                size="sm"
            >
                <div className="space-y-5" style={deleteModalWorkspaceVars}>
                    <p className="text-sm text-muted-foreground">
                        {tx('pages.messages.deleteMessagePrompt', undefined, 'Choose how you want to delete this message:')}
                    </p>

                    {messagePendingDelete?.content ? (
                        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground">
                            {messagePendingDelete.content}
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void confirmDeleteMessage('me')}
                            disabled={!!deletingMessageId}
                            className="w-full border-2"
                        >
                            {tx('pages.messages.deleteForMe', undefined, 'Delete for me')}
                        </Button>
                        
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => void confirmDeleteMessage('everyone')}
                            isLoading={!!deletingMessageId}
                            disabled={!!deletingMessageId}
                            className="w-full"
                        >
                            {tx('pages.messages.deleteForEveryone', undefined, 'Delete for everyone')}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setMessagePendingDelete(null)}
                            disabled={!!deletingMessageId}
                            className="w-full"
                        >
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

export default function Messages() {
    return (
        <ErrorBoundary>
            <MessagesComponent />
        </ErrorBoundary>
    );
}
