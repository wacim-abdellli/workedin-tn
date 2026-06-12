import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search,
    Send,
    Paperclip,
    Trash2,
    ArrowLeft,
    FileText,
    Loader2,
    _Mic,
    _Square,
    X,
    _FileAudio,
    Clock,
    _Play,
    _Pause,
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
    ChevronLeft,
    _ChevronRight,
    Menu,
    RefreshCw,
    Star,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ReviewForm } from '../components/ui/Reviews';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { supabase } from '../lib/supabase';

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
import { submitReport } from '../services/reports';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useReadReceipts } from '../hooks/useReadReceipts';
import { usePresence } from '../hooks/usePresence';
import { useTranslation } from '../i18n';
import ErrorBoundary from '../components/ErrorBoundary';
import { validateUploadSelection } from '../lib/uploadPolicy';
import ContractDetailsSidebar, { type ContractActivityEvent } from '@/components/contracts/ContractDetailsSidebar';
import SubmitDeliveryForm from '@/components/contracts/SubmitDeliveryForm';
import { ChatInputArea } from '../components/chat/ChatInputArea';
import {
    normalizeContractStatus,
    resolveMessagingLifecyclePolicy,
    type ContractMessagingStatus,
    type _MessagingPolicyTone,
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
import { getContractWorkspaceRoute } from '@/lib/routes';
import { extractMessageAttachmentPath } from '../lib/messageUtils';


import {
  fileToBase64,
  base64ToFile,
  blobToBase64,
  normalizeMimeType,
  _canonicalizeVoiceMimeType,
  _getAudioExtensionFromMimeType,
  buildVoiceMemoFile,
  _hasSignature,
  _detectAudioMimeTypeFromBuffer,
  _inferAudioMimeType,
  _formatAudioTime
} from '../lib/audioProcessing';

import {
    _MESSAGE_ATTACHMENT_ACCEPT,
    isImageAttachment,
    isAudioAttachment,
    formatAttachmentSize,
    getAttachmentExtensionLabel,
    resolveMessageAttachmentUrl,
    openBlobAsPreviewOrDownload,
    _truncateText,
    sanitizeContractTitle,
    TERMINAL_STATUSES,
    sortConversationsByActivity,
    isDeletedMessage,
    shouldHideAttachmentUrlText,
    resolveContractSystemMessage,
    getMessageDisplayText,
    getMessageContractSystemKind,
    getMessageReplyMetadata,
    getThreadPreview,
    getLifecycleBannerClassName,
    isMissingSchemaColumnError,
    isEnumValueUnsupportedError,
    extractRpcConversationId,
    isUuidLike,
    resolveSystemMessageText,
    type ThreadMessage,
    type _MessageAttachment,
    type _ContractSystemMessageKind,
} from '../lib/messageUtils';
import { CollapsibleMessageText } from '../components/chat/CollapsibleMessageText';




import FundEscrow from '../components/payments/FundEscrow';

import {
    type ReplyMetadata,
    parseReplyMetadataFromContent,
    serializeReplyMetadataIntoContent,
} from '../lib/messageReplies';
import { MessageAudioPlayer } from '../components/chat/MessageAudioPlayer';

// ─── Local-only session / cache constants ────────────────────────────────────
const _MAX_CACHED_CONVERSATIONS = 50;
const MAX_CACHED_MESSAGES = 200;
const ENABLE_MESSAGES_SESSION_CACHE = false;

const _getConversationsCacheKey = (userId: string, modeKey: string) => `messages:conversations:${userId}:${modeKey}`;
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
    const myInbox = isParticipant1 ? conversation.inbox_participant_1 : conversation.inbox_participant_2;

    if (myInbox === 'client' || myInbox === 'freelancer' || myInbox === 'shared') {
        return myInbox === activeMode || myInbox === 'shared';
    }
    if (myInbox === 'contract') return true;

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
    } catch { return null; }
};

const writeSessionCache = (key: string, value: unknown) => {
    if (!ENABLE_MESSAGES_SESSION_CACHE) return;
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

// ─── Domain-local types ───────────────────────────────────────────────────────
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

type LatestContractDeliveryAsset = {
    id: string;
    asset_kind: 'review_asset' | 'final_asset';
    access_state: 'preview_available' | 'locked' | 'released';
    name: string;
    storage_bucket?: string | null;
    storage_path: string;
    mime_type?: string | null;
    size_bytes?: number | null;
};

type LatestContractDelivery = {
    id: string;
    version_number: number;
    delivery_note?: string | null;
    review_due_at?: string | null;
    submitted_at?: string | null;
    locked_final_asset_count?: number | null;
    assets?: LatestContractDeliveryAsset[];
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

type ContractConversationLookupRow = {
    id: string;
    participant_1: string;
    participant_2: string;
    client_id?: string;
    freelancer_id?: string;
    status?: string;
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
        client_id: row.client_id,
        freelancer_id: row.freelancer_id,
        status: row.status || 'active',
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
            ? 'id, participant_1, participant_2, client_id, freelancer_id, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2, status'
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

    return hydrateConversationRow(userId, row);
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
            ? 'id, participant_1, participant_2, client_id, freelancer_id, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2, status'
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

    return hydrateConversationRow(userId, row);
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
            ? 'id, participant_1, participant_2, client_id, freelancer_id, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2, status'
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

    return hydrateConversationRow(userId, row);
};

const createContractConversationFallback = async (
    userId: string,
    otherUserId: string,
    contractId: string,
): Promise<Conversation | null> => {
    const [participant1, participant2] = userId < otherUserId
        ? [userId, otherUserId]
        : [otherUserId, userId];

    const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id, client_id, freelancer_id')
        .eq('id', contractId)
        .maybeSingle();

    if (contractError || !contract) return null;

    const inboxParticipant1 = participant1 === contract.client_id
        ? 'client'
        : participant1 === contract.freelancer_id
            ? 'freelancer'
            : null;
    const inboxParticipant2 = participant2 === contract.client_id
        ? 'client'
        : participant2 === contract.freelancer_id
            ? 'freelancer'
            : null;

    const insertModern = () => supabase
        .from('conversations')
        .insert({
            participant_1: participant1,
            participant_2: participant2,
            client_id: contract.client_id,
            freelancer_id: contract.freelancer_id,
            contract_id: contractId,
            conversation_scope: 'contract',
            inbox_participant_1: inboxParticipant1,
            inbox_participant_2: inboxParticipant2,
            status: 'active',
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
        || isMissingSchemaColumnError(insertResult.error, 'conversations', 'client_id')
        || isMissingSchemaColumnError(insertResult.error, 'conversations', 'freelancer_id')
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

    // Track this user's presence and get the isOnline helper for checking others
    const { isOnline: isUserOnline } = usePresence({ 
        userId: user?.id, 
        isOnlineForMessages: profile?.is_online_for_messages !== false 
    });

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
    const [unarchivedConversationIds, setUnarchivedConversationIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem('workedin_unarchived_conversations');
            return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
        } catch {
            return new Set();
        }
    });
    const [showMobileThread, setShowMobileThread] = useState(false);
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const [_uploadProgress, setUploadProgress] = useState(0);
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
    const [latestDeliveryByContractId, setLatestDeliveryByContractId] = useState<Record<string, LatestContractDelivery>>({});

    // Keep contract status cache in sessionStorage so archived items don't flash on reload
    useEffect(() => {
        if (Object.keys(contractStatusById).length === 0) return;
        try {
            sessionStorage.setItem('workedin_contract_statuses', JSON.stringify(contractStatusById));
        } catch {
            // sessionStorage quota exceeded or unavailable — safe to ignore
        }
    }, [contractStatusById]);

    const selectedContractId = selectedConversation?.contract_id || null;
    const selectedContractMeta = selectedContractId ? contractSessionMetaById[selectedContractId] : null;
    const selectedWorkspaceContractId = selectedContractMeta?.linked_contract_id || selectedContractId;
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

    const selectedContractUserRole: 'client' | 'freelancer' = useMemo(() => {
        if (activeWorkspace === 'client') return 'client';
        if (activeWorkspace === 'freelancer') return 'freelancer';

        if (selectedContractMeta?.client_id && selectedContractMeta.client_id === user?.id) {
            return 'client';
        }

        return 'freelancer';
    }, [activeWorkspace, selectedContractMeta?.client_id, user?.id]);

    const selectedContractStatus = useMemo(() => {
        if (!selectedContractId) return null;
        const rawStatus = contractStatusById[selectedContractId] ?? normalizeContractStatus(selectedContractMeta?.status);
        const isEscrowFunded = selectedContractMeta ? (selectedContractMeta.funded_at !== null) : true;
        if (rawStatus === 'active' && !isEscrowFunded) {
            return 'pending_payment';
        }
        return rawStatus;
    }, [selectedContractId, contractStatusById, selectedContractMeta]);

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

    const [page, setPage] = useState(0);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [_audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [replyTarget, setReplyTarget] = useState<ReplyMetadata | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [customReportReason, setCustomReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportTouched, setReportTouched] = useState(false);
    const [showUnknownContractBanner, setShowUnknownContractBanner] = useState(false);
    const [isFundEscrowOpen, setIsFundEscrowOpen] = useState(false);
    const [_walletBalance, setWalletBalance] = useState<number | null>(null);
    const [showConversationsList, setShowConversationsList] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const hasContract = params.has('contract') || params.has('with');
        return !hasContract;
    });
    const [showContractPanel, setShowContractPanel] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.has('contract');
    });
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);

    // Enforce mutual exclusivity of sidebars (conversations list & contract panel)
    useEffect(() => {
        if (showConversationsList && showContractPanel) {
            if (isContractSession) {
                setShowConversationsList(false);
            } else {
                setShowContractPanel(false);
            }
        }
    }, [showConversationsList, showContractPanel, isContractSession]);

    useEffect(() => {
        if (!user?.id || selectedContractStatus !== 'pending_payment' || selectedContractUserRole !== 'client') {
            setWalletBalance(null);
            return;
        }

        let active = true;
        const fetchWallet = async () => {
            try {
                const { data } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
                if (active && data) {
                    setWalletBalance(data.balance ?? 0);
                }
            } catch (err) {
                console.warn('Failed to load wallet balance', err);
            }
        };

        void fetchWallet();

        return () => {
            active = false;
        };
    }, [user?.id, selectedContractStatus, selectedContractUserRole]);
    const [deliveryNote, setDeliveryNote] = useState('');
    const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
    const [deliveryActionError, setDeliveryActionError] = useState<string | null>(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [isDeliveringContractWork, setIsDeliveringContractWork] = useState(false);
    const [isAcceptingContractWork, setIsAcceptingContractWork] = useState(false);
    const [isRequestingContractChanges, setIsRequestingContractChanges] = useState(false);
    const [isOpeningContractDispute, setIsOpeningContractDispute] = useState(false);
    const [loadingMilestonesContractId, setLoadingMilestonesContractId] = useState<string | null>(null);
    const [loadingReviewContractId, setLoadingReviewContractId] = useState<string | null>(null);
    const [isContractWorkspaceOpen, setIsContractWorkspaceOpen] = useState(false);
    const [_isBannerExpanded, _setIsBannerExpanded] = useState(false);
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
        let contractStatus = conversation.contract_id
            ? contractStatusById[conversation.contract_id]
            : null;

        const sessionMeta = conversation.contract_id ? contractSessionMetaById[conversation.contract_id] : null;
        const isEscrowFunded = sessionMeta ? (sessionMeta.funded_at !== null) : true;

        if (isContractConversation && contractStatus === 'active' && !isEscrowFunded) {
            contractStatus = 'pending_payment';
        }

        return resolveMessagingLifecyclePolicy({
            kind: isContractConversation ? 'contract' : 'direct',
            contractStatus,
        });
    }, [contractStatusById, contractSessionMetaById]);

    const selectedConversationPolicy = useMemo(() => {
        if (!selectedConversation) return null;
        return getConversationLifecyclePolicy(selectedConversation);
    }, [getConversationLifecyclePolicy, selectedConversation]);

    const selectedContractReviewBanner = useMemo(() => {
        if (selectedContractStatus !== 'delivery_submitted') return null;

        const dueDate = selectedContractReviewDueAt ? new Date(selectedContractReviewDueAt) : null;
        const dueLabel = dueDate && !Number.isNaN(dueDate.getTime())
            ? dueDate.toLocaleString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')
            : null;
        const overdue = Boolean(dueDate && dueDate.getTime() < Date.now());

        if (selectedContractUserRole === 'client') {
            return overdue
                ? `Review is overdue. Please accept, request changes, or open a dispute now. If you stay inactive, the platform may escalate or auto-resolve this contract based on policy.`
                : `This delivery is under review. Review it by ${dueLabel ?? 'the deadline'} and choose Accept and Pay, Request Changes, or Open Dispute. If you do nothing, the platform may escalate or auto-resolve the next step based on policy.`;
        }

        return overdue
            ? `Client review is overdue. The platform will follow the contract protection policy next if the client stays inactive.`
            : `Your delivery is under review until ${dueLabel ?? 'the deadline'}. The client must accept, request changes, or open a dispute. If they do nothing, the platform may escalate or auto-resolve the next step based on policy.`;
    }, [language, selectedContractReviewDueAt, selectedContractStatus, selectedContractUserRole]);

    const translatedLifecycleBanner = useMemo(() => {
        if (selectedContractReviewBanner) return selectedContractReviewBanner;
        if (!selectedConversationPolicy) return '';
        const status = selectedConversationPolicy.contractStatus;
        if (!status || status === 'active') return '';

        const statusKeys: Record<string, string> = {
            completed: 'pages.messages.lifecycle.completed',
            cancelled: 'pages.messages.lifecycle.cancelled',
            disputed: 'pages.messages.lifecycle.disputed',
            pending_payment: 'pages.messages.lifecycle.pendingPayment',
            delivery_submitted: 'pages.messages.lifecycle.deliverySubmitted',
            revision_requested: 'pages.messages.lifecycle.revisionRequested',
            unknown: 'pages.messages.lifecycle.unknown',
        };

        const key = statusKeys[status];
        if (key) {
            return tx(key, undefined, selectedConversationPolicy.bannerFallback || '');
        }
        return selectedConversationPolicy.bannerFallback || '';
    }, [selectedContractReviewBanner, selectedConversationPolicy, tx]);

    const translatedBlockedReason = useMemo(() => {
        if (!selectedConversationPolicy) return null;
        const status = selectedConversationPolicy.contractStatus;
        if (!status || !selectedConversationPolicy.blockedReasonFallback) return null;

        const statusKeys: Record<string, string> = {
            completed: 'pages.messages.lifecycle.completed',
            cancelled: 'pages.messages.lifecycle.cancelled',
            disputed: 'pages.messages.lifecycle.disputed',
        };

        const key = statusKeys[status];
        if (key) {
            return tx(key, undefined, selectedConversationPolicy.blockedReasonFallback);
        }
        return selectedConversationPolicy.blockedReasonFallback;
    }, [selectedConversationPolicy, tx]);

    const canSendInSelectedConversation = selectedConversationPolicy?.canSend ?? false;
    const canAttachInSelectedConversation = selectedConversationPolicy?.canAttachFiles ?? false;
    const canSendVoiceInSelectedConversation = selectedConversationPolicy?.canSendVoiceNotes ?? false;
    const canReplyInSelectedConversation = selectedConversationPolicy?.canReply ?? false;



    useEffect(() => {
        if (!isContractSession) {
            setIsContractWorkspaceOpen(false);
            setIsReviewModalOpen(false);
            return;
        }

        setIsReviewModalOpen(false);
    }, [isContractSession, selectedContractId]);

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
        selectedConversationBorder: isFreelancerWorkspace ? 'border-violet-500/25' : 'border-amber-500/25',
        selectedConversationSurface: isFreelancerWorkspace
            ? 'border-white/[0.10] bg-white/[0.035] shadow-none ring-1 ring-violet-500/[0.15]'
            : 'border-white/[0.10] bg-white/[0.035] shadow-none ring-1 ring-amber-500/[0.15]',
        conversationHoverSurface: isFreelancerWorkspace
            ? 'hover:border-white/[0.08] hover:bg-white/[0.025]'
            : 'hover:border-white/[0.08] hover:bg-white/[0.025]',
        avatarHoverRing: isFreelancerWorkspace ? 'hover:ring-violet-500/60' : 'hover:ring-amber-500/60',
        headerAvatarHoverRing: isFreelancerWorkspace ? 'hover:ring-violet-500' : 'hover:ring-amber-500',
        contextLabelText: isFreelancerWorkspace ? 'text-violet-300/90' : 'text-amber-300/90',
        unreadBadgeBg: isFreelancerWorkspace ? 'bg-violet-600' : 'bg-amber-600',
        inputFocusBorder: isFreelancerWorkspace ? 'focus:border-violet-500/60' : 'focus:border-amber-500/60',
        headerMetaText: isFreelancerWorkspace ? 'text-violet-300' : 'text-amber-300',
        searchSurface: isFreelancerWorkspace
            ? 'border-white/[0.08] bg-white/[0.025] focus-within:border-violet-500/35 focus-within:ring-1 focus-within:ring-violet-500/10'
            : 'border-white/[0.08] bg-white/[0.025] focus-within:border-amber-500/35 focus-within:ring-1 focus-within:ring-amber-500/10',
        contractToggleActive: isFreelancerWorkspace
            ? 'border-violet-500/20 bg-violet-500/[0.08] text-violet-200 hover:bg-violet-500/[0.12]'
            : 'border-amber-500/20 bg-amber-500/[0.08] text-amber-200 hover:bg-amber-500/[0.12]',
        contractToggleIdle: isFreelancerWorkspace
            ? 'border-violet-500/20 text-violet-300 hover:border-violet-400/50 hover:bg-violet-500/10'
            : 'border-amber-500/20 text-amber-300 hover:border-amber-400/50 hover:bg-amber-500/10',
        threadAmbientGlow: 'hidden',
        ownBubbleBg: isFreelancerWorkspace
            ? 'border border-violet-500/30 bg-zinc-800/80 text-zinc-100 shadow-sm'
            : 'border border-amber-500/30 bg-zinc-800/80 text-zinc-100 shadow-sm',
        ownReplyCard: isFreelancerWorkspace
            ? 'bg-black/25 border-l-violet-500/60 border-t-transparent border-r-transparent border-b-transparent text-violet-300'
            : 'bg-black/25 border-l-amber-500/60 border-t-transparent border-r-transparent border-b-transparent text-amber-300',
        ownTextMuted: 'text-on-surface-muted',
        ownAttachmentCard: 'bg-surface-sunken hover:bg-surface-card',
        ownAttachmentIcon: 'bg-surface-card text-on-surface-subtle',
        neutralAttachmentIcon: 'text-on-surface-subtle',
        readReceipt: 'text-on-surface-subtle',
        replyActionHover: 'hover:text-on-surface',
        highlightRing: 'ring-on-surface-subtle',
        typingDot: 'bg-on-surface-subtle',
        replyStripe: 'bg-on-surface-subtle',
        iconAccent: 'text-on-surface-subtle',
        sendButton: 'bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]',
        composerShell: 'border-[#1a1b1e] bg-[var(--color-bg-elevated)] focus-within:border-white/20 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]',
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

    const refreshLatestContractDelivery = useCallback(async (contractId: string) => {
        try {
            const { data, error } = await supabase.rpc('get_latest_contract_delivery', {
                p_contract_id: contractId,
            });

            if (error) {
                console.warn('[Messages] Failed to load latest contract delivery', error);
                return;
            }

            setLatestDeliveryByContractId((prev) => {
                if (data && typeof data === 'object' && 'id' in data) {
                    return {
                        ...prev,
                        [contractId]: data as LatestContractDelivery,
                    };
                }

                const rest = { ...prev };
                delete rest[contractId];
                return rest;
            });
        } catch (caughtError) {
            console.warn('[Messages] Failed to load latest contract delivery', caughtError);
        }
    }, []);

    useEffect(() => {
        if (!selectedContractId) return;

        void refreshLatestContractDelivery(selectedContractId);
    }, [refreshLatestContractDelivery, selectedContractId]);

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
        const latestDelivery = selectedContractId ? latestDeliveryByContractId[selectedContractId] : undefined;
        const latestDeliveryAssets = latestDelivery?.assets ?? [];
        const reviewFiles = latestDeliveryAssets.filter((asset) => asset.asset_kind === 'review_asset');
        const finalFiles = latestDeliveryAssets.filter((asset) => asset.asset_kind === 'final_asset');
        const lockedFinalFilesCount = Number(
            latestDelivery?.locked_final_asset_count ?? finalFiles.filter((asset) => asset.access_state !== 'released').length
        );
        const visibleFinalFiles = selectedContractUserRole === 'client'
            ? finalFiles.filter((asset) => asset.access_state === 'released')
            : finalFiles;

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
            reviewFiles: reviewFiles.map((asset) => ({
                id: asset.id,
                name: asset.name,
                storagePath: asset.storage_path,
                storageBucket: asset.storage_bucket ?? 'contract-files',
                mimeType: asset.mime_type ?? null,
                sizeBytes: asset.size_bytes ?? null,
                assetKind: asset.asset_kind,
                accessState: asset.access_state,
            })),
            finalFiles: visibleFinalFiles.map((asset) => ({
                id: asset.id,
                name: asset.name,
                storagePath: asset.storage_path,
                storageBucket: asset.storage_bucket ?? 'contract-files',
                mimeType: asset.mime_type ?? null,
                sizeBytes: asset.size_bytes ?? null,
                assetKind: asset.asset_kind,
                accessState: asset.access_state,
            })),
            lockedFinalFilesCount,
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
        latestDeliveryByContractId,
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
        if (selectedContractStatus === 'delivery_submitted' || selectedContractStatus === 'completed') return true;

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

    const _contractCockpit = useMemo(() => {
        if (!isContractSession || !contractSidebarData) return null;

        const status = String(selectedContractStatus || 'unknown').trim().toLowerCase();
        const amount = new Intl.NumberFormat(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', {
            maximumFractionDigits: 2,
        }).format(Number(contractSidebarData.amount ?? 0));
        const formatContractDate = (value: string | null | undefined) => {
            if (!value) return 'No due date';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return 'No due date';
            return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US');
        };
        const dueLabel = formatContractDate(contractSidebarData.job?.deadline ?? null);
        const reviewDueLabel = formatContractDate(contractSidebarData.reviewDueAt ?? null);
        const statusLabel = (() => {
            if (status === 'active') return tx('pages.messages.contract.status.inProgress', undefined, 'In progress');
            if (status === 'delivery_submitted') return tx('pages.messages.contract.status.underReview', undefined, 'Under review');
            if (status === 'revision_requested') return tx('pages.messages.contract.status.revisionRequested', undefined, 'Revision requested');
            if (status === 'completed') return tx('pages.messages.contract.status.completed', undefined, 'Completed');
            if (status === 'disputed') return tx('pages.messages.contract.status.disputed', undefined, 'Disputed');
            if (status === 'pending_payment') return tx('pages.messages.contract.status.paymentPending', undefined, 'Payment pending');
            if (status === 'cancelled' || status === 'canceled') return tx('pages.messages.contract.status.cancelled', undefined, 'Cancelled');
            return tx('pages.messages.contract.status.syncing', undefined, 'Syncing');
        })();
        const nextStep = (() => {
            if (selectedContractUserRole === 'client' && status === 'delivery_submitted') return tx('pages.messages.contract.nextStep.clientReviewDelivery', undefined, 'Review delivery, then accept, request changes, or dispute.');
            if (selectedContractUserRole === 'freelancer' && status === 'delivery_submitted') return tx('pages.messages.contract.nextStep.freelancerWaitingForReview', undefined, 'Waiting for client review. Final files stay protected.');
            if (selectedContractUserRole === 'freelancer' && (status === 'active' || status === 'revision_requested')) return tx('pages.messages.contract.nextStep.freelancerSubmitReviewFiles', undefined, 'Submit review files and locked final files when ready.');
            if (selectedContractUserRole === 'client' && status === 'active') return tx('pages.messages.contract.nextStep.clientWaitingDelivery', undefined, 'Freelancer is working. Delivery will appear here.');
            if (status === 'completed') return selectedContractHasReview ? tx('pages.messages.contract.nextStep.completedDefault', undefined, 'Contract is complete.') : tx('pages.messages.contract.nextStep.completedLeaveReview', undefined, 'Leave a review to close the trust loop.');
            if (status === 'pending_payment') return tx('pages.messages.contract.nextStep.paymentPending', undefined, 'Payment must be confirmed before work begins.');
            if (status === 'disputed') return tx('pages.messages.contract.nextStep.disputed', undefined, 'Dispute is open. Evidence is preserved.');
            return tx('pages.messages.contract.nextStep.syncing', undefined, 'Keep the conversation open while the contract syncs.');
        })();
        const theme = selectedContractUserRole === 'client'
            ? {
                shell: 'border-sky-500/25 bg-sky-500/10',
                chip: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
                accent: 'text-sky-200',
            }
            : {
                shell: 'border-violet-500/25 bg-violet-500/10',
                chip: 'border-violet-400/30 bg-violet-400/10 text-violet-100',
                accent: 'text-violet-200',
            };

        return {
            amount: `${amount} TND`,
            dueLabel,
            reviewDueLabel,
            nextStep,
            statusLabel,
            theme,
            title: contractSidebarData.job?.title || 'Contract workspace',
        };
    }, [
        contractSidebarData,
        isContractSession,
        language,
        selectedContractHasReview,
        selectedContractStatus,
        selectedContractUserRole,
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

    const _getConversationIdentityLabel = useCallback((conversation: Conversation) => {
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
                className: 'border-sky-500/10 bg-sky-500/[0.06] text-sky-300',
                textColor: 'text-sky-400',
            };
        }

        if (counterpartyRole === 'freelancer') {
            return {
                label: tx('mobileNav.freelancer', undefined, 'Freelancer'),
                className: 'border-violet-500/10 bg-violet-500/[0.06] text-violet-300',
                textColor: 'text-violet-400',
            };
        }

        if (!conversation.contract_id) {
            return {
                label: tx('pages.messages.directChat', undefined, 'Direct chat'),
                className: 'border-zinc-500/10 bg-zinc-500/[0.06] text-zinc-400',
                textColor: 'text-zinc-500',
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
                    label: tx('pages.messages.contract.status.inProgress', undefined, 'In progress'),
                    className: 'border-emerald-500/10 bg-emerald-500/[0.06] text-emerald-300',
                    textColor: 'text-emerald-400',
                };
            case 'pending_payment':
                return {
                    label: tx('pages.messages.contract.status.paymentPending', undefined, 'Pending payment'),
                    className: 'border-sky-500/10 bg-sky-500/[0.06] text-sky-300',
                    textColor: 'text-sky-400',
                };
            case 'completed':
                return {
                    label: tx('pages.messages.contract.status.completed', undefined, 'Completed'),
                    className: 'border-cyan-500/10 bg-cyan-500/[0.06] text-cyan-300',
                    textColor: 'text-cyan-400',
                };
            case 'cancelled':
                return {
                    label: tx('pages.messages.contract.status.cancelled', undefined, 'Cancelled'),
                    className: 'border-red-500/10 bg-red-500/[0.06] text-red-300',
                    textColor: 'text-red-400',
                };
            case 'disputed':
                return {
                    label: tx('pages.messages.contract.status.disputed', undefined, 'Disputed'),
                    className: 'border-amber-500/10 bg-amber-500/[0.06] text-amber-300',
                    textColor: 'text-amber-400',
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

    const handleOpenContractSidebarFile = useCallback(async (file: {
        url?: string;
        name: string;
        type?: string | null;
        size?: number | string | null;
        storageBucket?: string | null;
        storagePath?: string | null;
    }) => {
        if (file.storageBucket && file.storagePath) {
            const normalizedType = normalizeMimeType(file.type);
            const canPreviewInTab = normalizedType.startsWith('image/')
                || normalizedType.startsWith('audio/')
                || normalizedType.startsWith('video/')
                || normalizedType === 'application/pdf';

            try {
                const { data, error } = await supabase.storage
                    .from(file.storageBucket)
                    .download(file.storagePath);

                if (error || !data) {
                    throw error || new Error('Download failed');
                }

                openBlobAsPreviewOrDownload(data, file.name || 'attachment', canPreviewInTab);
                return;
            } catch (error) {
                console.error('[Messages] Failed to open contract delivery file:', error);
                showToast(tx('pages.messages.errors.openAttachment', undefined, 'Failed to open attachment right now'), 'error');
                return;
            }
        }

        if (file.url) {
            await handleOpenAttachment({
                url: file.url,
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size ?? 0,
            });
            return;
        }

        showToast(tx('pages.messages.errors.invalidAttachment', undefined, 'Attachment link is not available'), 'error');
    }, [handleOpenAttachment, showToast, tx]);

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

        setIsBannerDismissed(false);
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
                'id, proposal_id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, revision_requested_at, client_id, freelancer_id, job_id, created_at, delivery_note';
            const legacyContractSelectColumns =
                'id, proposal_id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, revision_requested_at, client_id, freelancer_id, job_id, created_at, delivery_note';
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
                    revision_requests_count: row.revision_requests_count ?? 0,
                    max_revision_rounds: row.max_revision_rounds ?? 2,
                    funded_at: row.funded_at === undefined ? undefined : row.funded_at,
                    delivery_submitted_at: row.delivery_submitted_at === undefined ? undefined : row.delivery_submitted_at,
                    review_due_at: row.review_due_at === undefined ? undefined : row.review_due_at,
                    revision_requested_at: row.revision_requested_at === undefined ? undefined : row.revision_requested_at,
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

    const handleDeliverContractWork = useCallback(async (links: Array<any> = [], fileStages: Record<number, 'review' | 'final'> = {}) => {
        if (isDeliveringContractWork) return;
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
            const selectedDeliveryFiles = deliveryFiles;
            
            const hasReview = selectedDeliveryFiles.some((_, idx) => fileStages[idx] === 'review') || links.some(l => l.link_kind === 'review_link');
            const hasFinal = selectedDeliveryFiles.some((_, idx) => fileStages[idx] === 'final') || links.some(l => l.link_kind === 'final_link');
            if (!hasReview || !hasFinal) {
                setDeliveryActionError('Please provide deliverables for both review and final hand-off phases.');
                setIsDeliveringContractWork(false);
                return;
            }

            for (const file of selectedDeliveryFiles) {
                const validation = validateUploadSelection({
                    bucket: 'contract-files',
                    fileName: file.name,
                    mimeType: normalizeMimeType(file.type),
                    size: file.size,
                });

                if (!validation.ok) {
                    throw new Error(`${file.name}: ${validation.reason || 'Unsupported file type.'}`);
                }
            }

            const messageContent = trimmedNote
                ? `[[delivery]] ${trimmedNote}`
                : '[[delivery]] Work delivered and ready for review';

            const uploadFile = async (file: File, stage: 'review' | 'final') => {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const path = `${user.id}/${contractId}/submissions/${stage}/${Date.now()}_${safeName}`;
                
                const { error } = await supabase.storage.from('contract-files').upload(path, file, { upsert: false });
                if (error) throw new Error(tx('contract.lifecycle.uploadFailed', { stage: stage === 'review' ? 'Review' : 'Final', name: file.name, message: error.message }, `${stage === 'review' ? 'Review' : 'Final'} upload failed for ${file.name}: ${error.message}`));

                return {
                    name: file.name,
                    storage_path: path,
                    storage_bucket: 'contract-files',
                    mime_type: file.type || '',
                    size_bytes: file.size,
                };
            };

            const reviewAssets = [];
            const finalAssets = [];
            for (let idx = 0; idx < selectedDeliveryFiles.length; idx++) {
                const file = selectedDeliveryFiles[idx];
                const stage = fileStages[idx] || 'review';
                const asset = await uploadFile(file, stage);
                if (stage === 'review') {
                    reviewAssets.push(asset);
                } else {
                    finalAssets.push(asset);
                }
            }

            const { data: deliveryResult, error: deliveryError } = await supabase.rpc('submit_contract_delivery_atomic', {
                p_contract_id: contractId,
                p_delivery_note: trimmedNote || 'submitted',
                p_review_assets: reviewAssets,
                p_final_assets: finalAssets,
                p_delivery_links: links,
            });

            if (deliveryError) {
                throw new Error(`Delivery record failed: ${getErrorMessage(deliveryError, 'Delivery was blocked by database policy')}`);
            }

            const returnedStatus = normalizeContractStatus(
                deliveryResult && typeof deliveryResult === 'object' && 'status' in deliveryResult
                    ? String((deliveryResult as { status?: string }).status || '')
                    : null
            );

            if (returnedStatus !== 'unknown') {
                syncContractStatusLocally(contractId, returnedStatus);
            }

            await refreshLatestContractDelivery(contractId);

            const { error } = await sendContractMessage({
                contract_id: contractId,
                sender_id: user.id,
                receiver_id: selectedConversation.otherUser.id,
                content: messageContent,
                message_type: 'delivery',
            });

            if (error) {
                throw new Error(`Delivery message failed: ${getErrorMessage(error, 'Message was blocked by database policy')}`);
            }

            setIsDeliverModalOpen(false);
            setDeliveryNote('');
            setDeliveryFiles([]);
            showToast(tx('contract.workDelivered', undefined, 'Work delivered successfully'), 'success');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.deliverError', undefined, 'Failed to deliver work'));
            setDeliveryActionError(message);
            showToast(message, 'error');
        } finally {
            setIsDeliveringContractWork(false);
        }
    }, [deliveryFiles, deliveryNote, isDeliveringContractWork, refreshLatestContractDelivery, selectedConversation, selectedContractStatus, selectedContractUserRole, showToast, syncContractStatusLocally, tx, user?.id]);

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
            // DEV auto-funding / escrow id bypass
            if (import.meta.env.DEV) {
                const { data: contractData, error: fetchErr } = await supabase
                    .from('contracts')
                    .select('dhmad_escrow_id')
                    .eq('id', selectedConversation.contract_id)
                    .single();

                if (!fetchErr && contractData && !contractData.dhmad_escrow_id) {
                    const mockId = `dhmad_mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
                    const { error: updateError } = await supabase
                        .from('contracts')
                        .update({
                            dhmad_escrow_id: mockId,
                        })
                        .eq('id', selectedConversation.contract_id);
                    
                    if (updateError) {
                        console.error('[DEV] Failed to auto-fund contract in messages:', updateError);
                    } else {
                        console.info('[DEV] Auto-funded contract in messages for release bypass:', mockId);
                    }
                }
            }

            const { error: releaseError } = await supabase.rpc('release_contract_payment_atomic', {
                p_contract_id: selectedConversation.contract_id,
            });

            if (releaseError) throw releaseError;

            syncContractStatusLocally(selectedConversation.contract_id, 'completed');
            await refreshLatestContractDelivery(selectedConversation.contract_id);

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
    }, [contractDeliverySubmitted, refreshLatestContractDelivery, selectedContractStatus, selectedConversation, showToast, syncContractStatusLocally, tx, user?.id]);

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

    const handleReportUser = useCallback(async () => {
        if (!selectedConversation || !user?.id) return;
        if (!reportReason) return;
        const finalReason = reportReason === 'other' ? customReportReason.trim() : reportReason;
        if (reportReason === 'other' && !finalReason) return;

        setIsSubmittingReport(true);
        try {
            await submitReport(user.id, 'user', selectedConversation.otherUser.id, finalReason);
            showToast(tx('pages.messages.reportSubmittedSuccess', undefined, 'Report submitted successfully. Our team will review it.'), 'success');
            setIsReportModalOpen(false);
            setReportReason('');
            setCustomReportReason('');
            setReportTouched(false);
        } catch (error) {
            console.error('[Messages] Failed to submit user report:', error);
            const errMsg = error instanceof Error ? error.message : String(error);
            showToast(errMsg || tx('common.reportFailed', undefined, 'Failed to submit report'), 'error');
        } finally {
            setIsSubmittingReport(false);
        }
    }, [selectedConversation, user?.id, reportReason, customReportReason, showToast, tx]);

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
            const blockedMessage = translatedBlockedReason
                || tx('pages.messages.readOnlyRightNow', undefined, 'This conversation is read-only right now.');
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
            const blockedMessage = translatedBlockedReason
                || tx('pages.messages.attachmentsDisabled', undefined, 'Attachments are disabled for this conversation.');
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

        if (audioBlob && selectedConversationPolicy && !selectedConversationPolicy.canSendVoiceNotes) {
            const blockedMessage = translatedBlockedReason
                || tx('pages.messages.voiceNotesDisabled', undefined, 'Voice notes are disabled for this conversation.');
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
                const blockedMessage = translatedBlockedReason
                    || tx('pages.messages.attachmentsDisabled', undefined, 'Attachments are disabled for this conversation.');
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

    const _getConversationSidebarTitle = useCallback((conversation: Conversation) => {
        return conversation.otherUser.full_name;
    }, []);
    const archiveConversation = useCallback((conversationId: string) => {
        setArchivedConversationIds((prev) => {
            const next = new Set(prev);
            next.add(conversationId);
            try { localStorage.setItem('workedin_archived_conversations', JSON.stringify([...next])); } catch {
                // localStorage can fail in private browsing or restricted environments.
            }
            return next;
        });
        setUnarchivedConversationIds((prev) => {
            const next = new Set(prev);
            next.delete(conversationId);
            try { localStorage.setItem('workedin_unarchived_conversations', JSON.stringify([...next])); } catch {
                // localStorage can fail in private browsing or restricted environments.
            }
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
            try { localStorage.setItem('workedin_archived_conversations', JSON.stringify([...next])); } catch {
                // localStorage can fail in private browsing or restricted environments.
            }
            return next;
        });
        setUnarchivedConversationIds((prev) => {
            const next = new Set(prev);
            next.add(conversationId);
            try { localStorage.setItem('workedin_unarchived_conversations', JSON.stringify([...next])); } catch {
                // localStorage can fail in private browsing or restricted environments.
            }
            return next;
        });
    }, []);

    // Archive-aware filtering and smart sorting
    const filteredConversations = useMemo(() => {
        return conversations.filter((c) => {
            const contractStatus = c.contract_id ? contractStatusById[c.contract_id] ?? '' : '';
            const isTerminalAndRead = TERMINAL_STATUSES.has(contractStatus) && c.unread_count === 0
                && (showArchived || selectedConversation?.id !== c.id);
            const isManuallyArchived = archivedConversationIds.has(c.id);
            const isManuallyUnarchived = unarchivedConversationIds.has(c.id);
            const isArchived = isManuallyArchived || (isTerminalAndRead && !isManuallyUnarchived);

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
    }, [conversations, contractStatusById, archivedConversationIds, unarchivedConversationIds, showArchived, filter, searchQuery, selectedConversation?.id, getResolvedContractTitle]);

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

    const contractActionBar = useMemo(() => {
        if (!isContractSession || !selectedContractStatus) return null;

        const status = String(selectedContractStatus).trim().toLowerCase();
        const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
        const canDeliver = selectedContractUserRole === 'freelancer'
            && canFreelancerDeliverForStatus(workflowStatus)
            && !contractDeliverySubmitted;
        const canClientReview = selectedContractUserRole === 'client'
            && canClientAcceptForStatus(workflowStatus, contractDeliverySubmitted)
            && contractDeliverySubmitted;
        const canRequestChanges = selectedContractUserRole === 'client'
            && canClientRequestChangesForStatus(workflowStatus, contractDeliverySubmitted)
            && selectedContractRevisionRemaining > 0;
        const canDispute = canOpenDisputeForStatus(workflowStatus);

        if (canDeliver) {
            return {
                tone: 'border-violet-500/25 bg-violet-500/10 text-violet-100',
                text: status === 'revision_requested' ? 'Revision requested. Submit the updated delivery when ready.' : 'Ready to hand off work? Submit review files and locked final files.',
                primary: 'Deliver Work',
                onPrimary: () => {
                    setDeliveryActionError(null);
                    setIsDeliverModalOpen(true);
                },
                secondary: null as null | { label: string; onClick: () => void },
                danger: canDispute ? { label: 'Open Dispute', onClick: () => setIsDisputeModalOpen(true) } : null,
            };
        }

        if (canClientReview) {
            return {
                tone: 'border-sky-500/25 bg-sky-500/10 text-sky-100',
                text: selectedContractRevisionRemaining > 0
                    ? 'Review delivery files before releasing payment. Final files unlock after acceptance.'
                    : 'Review delivery files before releasing payment. Revision limit has been reached.',
                primary: 'Accept & Release',
                onPrimary: () => setIsAcceptModalOpen(true),
                secondary: canRequestChanges ? { label: 'Request Changes', onClick: () => { void handleRequestContractChanges(); } } : null,
                danger: canDispute ? { label: 'Open Dispute', onClick: () => setIsDisputeModalOpen(true) } : null,
            };
        }

        if (status === 'completed' && !selectedContractHasReview) {
            return {
                tone: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
                text: 'Contract complete. Leave a review to help future trust decisions.',
                primary: 'Leave Review',
                onPrimary: () => setIsReviewModalOpen(true),
                secondary: null,
                danger: null,
            };
        }

        return null;
    }, [
        contractDeliverySubmitted,
        handleRequestContractChanges,
        isContractSession,
        selectedContractHasReview,
        selectedContractRevisionRemaining,
        selectedContractStatus,
        selectedContractUserRole,
    ]);

    const conversationSummaryLabel = useMemo(() => {
        if (showArchived) {
            return `${conversationWorkspaceLabel} • ${tx('pages.messages.archivedLabel', undefined, 'Archived')}`;
        }
        const countLabel = searchQuery
            ? tx('pages.messages.searchResultsSummary', { count: displayConversations.length }, `${displayConversations.length} results`)
            : tx('pages.messages.threadCountSummary', { count: displayConversations.length }, `${displayConversations.length} threads`);

        return `${conversationWorkspaceLabel} • ${countLabel}`;
    }, [conversationWorkspaceLabel, displayConversations.length, searchQuery, showArchived, tx]);

    // conversationsVirtualizer removed — the list now uses a plain scrollable div
    // (virtualizer caused layout bugs with dynamic row heights).

    // Filter out messages deleted for the current user
    const displayMessages = messages.filter((message) => !deletedForMeMessageIds.has(message.id));

    const selectedContractActivityEvents = useMemo<ContractActivityEvent[]>(() => {
        if (!selectedContractId || !selectedConversation) return [];

        return displayMessages
            .filter((message) => {
                if (message.contract_id !== selectedContractId) return false;
                // Only include contract lifecycle events — NOT plain chat messages.
                // A message is a lifecycle event if it has a recognized system kind marker.
                const systemKind = getMessageContractSystemKind(message);
                return systemKind !== null;
            })
            .map((message) => {
                const systemKind = getMessageContractSystemKind(message);
                const text = getMessageDisplayText(message, deletedMessageLabel)
                    || tx('pages.messages.attachmentLabel', undefined, 'Attachment');
                const isOwnMessage = message.sender_id === user?.id;
                const actorRole = systemKind === 'contract_completed'
                    ? 'system'
                    : isOwnMessage
                    ? selectedContractUserRole
                    : selectedContractUserRole === 'client'
                    ? 'freelancer'
                    : 'client';
                const kind = systemKind === 'delivery'
                    ? 'delivery'
                    : systemKind === 'contract_completed'
                    ? 'payment'
                    : systemKind === 'review_left'
                    ? 'review'
                    : systemKind === 'revision_requested'
                    ? 'revision'
                    : systemKind === 'dispute_opened'
                    ? 'dispute'
                    : 'message';

                return {
                    id: message.id,
                    text,
                    timestamp: message.created_at,
                    actorName: actorRole === 'system'
                        ? tx('pages.messages.systemEventTitle', undefined, 'System')
                        : isOwnMessage
                        ? currentUserDisplayName
                        : selectedConversation.otherUser.full_name,
                    actorRole,
                    actorAvatarUrl: actorRole === 'system'
                        ? null
                        : isOwnMessage
                        ? currentUserAvatar
                        : selectedConversation.otherUser.avatar_url,
                    kind,
                    system: actorRole === 'system',
                } satisfies ContractActivityEvent;
            });
    }, [
        currentUserAvatar,
        currentUserDisplayName,
        deletedMessageLabel,
        displayMessages,
        selectedContractId,
        selectedContractUserRole,
        selectedConversation,
        tx,
        user?.id,
    ]);

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
        if (el && typeof el.scrollIntoView === 'function') {
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
        if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages.length, pendingQueue.length]);

    const renderConversationList = () => (
        <div 
            onClick={() => {
                if (showContractPanel) {
                    setShowContractPanel(false);
                }
                if (!showConversationsList) {
                    setShowConversationsList(true);
                }
            }}
            className={`transition-all duration-300 ease-in-out border-r border-white/[0.04] bg-[#060607]/92 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden ${
                showConversationsList
                    ? 'w-full md:w-[320px] lg:w-[340px] xl:w-[360px] opacity-100'
                    : 'w-0 md:w-[76px] opacity-100 border-r pointer-events-auto cursor-pointer hover:bg-white/[0.012]'
            } ${showMobileThread ? 'hidden md:flex' : 'flex'}`}>
            {/* Header */}
            {showConversationsList ? (
                <div className="border-b border-white/[0.04] bg-white/[0.008] p-3.5 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-[18px] font-semibold tracking-tight text-zinc-100">{tx('pages.messages.title', undefined, 'Messages')}</h2>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 font-normal">
                                <span className={`h-1.5 w-1.5 rounded-full ${isFreelancerWorkspace ? 'bg-violet-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                                <span>{conversationSummaryLabel}</span>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className={`flex h-9 w-full items-center gap-2 rounded-[12px] border px-3 text-sm transition-all ${accentClasses.searchSurface}`}>
                        <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <input
                            id="messages-conversation-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={tx('pages.messages.searchPlaceholder', undefined, 'Search conversations...')}
                            className="w-full border-0 bg-transparent p-0 text-sm text-white outline-none placeholder:text-zinc-500 focus:outline-none focus:ring-0"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-white transition-colors">
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
                                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.08em] font-semibold transition-all ${
                                        filter === f
                                            ? `${accentClasses.contractToggleActive} border`
                                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                                    }`}
                                >
                                    {f === 'all' ? tx('pages.messages.filterAll', undefined, 'All') : tx('pages.messages.filterUnread', undefined, 'Unread')}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-[68px] border-b border-white/[0.04] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Inbox</span>
                </div>
            )}

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
                        <div className="h-10 w-10 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center">
                            {showArchived
                                ? <Archive className="h-5 w-5 text-on-surface-subtle" />
                                : <Mail className="h-5 w-5 text-on-surface-subtle" />}
                        </div>
                        {showConversationsList && (
                            <p className="text-sm text-on-surface-subtle">
                                {showArchived
                                    ? tx('pages.messages.empty.noArchivedTitle', undefined, 'No archived conversations')
                                    : searchQuery
                                    ? tx('pages.messages.empty.noMatchingTitle', undefined, 'No matching conversations')
                                    : tx('pages.messages.empty.noConversationsTitle', undefined, 'No conversations yet')}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="py-1.5">
                        {displayConversations.map((conversation) => {
                            const isActive = selectedConversation?.id === conversation.id;
                            const contractStatus = conversation.contract_id ? contractStatusById[conversation.contract_id] ?? '' : '';
                            const isTerminalAndRead = TERMINAL_STATUSES.has(contractStatus) && conversation.unread_count === 0;
                            const isArchived = archivedConversationIds.has(conversation.id)
                                || (isTerminalAndRead && !unarchivedConversationIds.has(conversation.id));
                            const previewText = getConversationLastPreviewText(conversation.id, conversation.last_message_text)
                                || ((conversation.message_count ?? 0) > 0
                                    ? tx('pages.messages.attachmentLabel', undefined, 'Attachment')
                                    : tx('pages.messages.noMessagesYet', undefined, 'No messages yet'));

                            return (
                                <div
                                    key={conversation.id}
                                    className={`group/item relative ${showConversationsList ? 'px-2 py-0.5' : 'px-1.5 py-1'}`}
                                >
                                    {/* Archive button — appears on hover */}
                                    {showConversationsList && (
                                        <button
                                            type="button"
                                            title={isArchived ? tx('pages.messages.unarchive', undefined, 'Unarchive') : tx('pages.messages.archive', undefined, 'Archive')}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isArchived) {
                                                    unarchiveConversation(conversation.id);
                                                } else {
                                                    archiveConversation(conversation.id);
                                                }
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] items-center justify-center text-on-surface-subtle hover:text-on-surface transition-all opacity-0 group-hover/item:opacity-100 hidden md:flex"
                                            aria-label={isArchived ? 'Unarchive conversation' : 'Archive conversation'}
                                        >
                                            <Archive className="h-3 w-3" />
                                        </button>
                                    )}

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
                                        <div className={`flex rounded-[14px] border transition-all ${
                                            showConversationsList ? 'gap-2.5 px-2.5 py-2.5' : 'justify-center p-2'
                                        } ${
                                            isActive
                                                ? accentClasses.selectedConversationSurface
                                                : `border-transparent bg-transparent ${accentClasses.conversationHoverSurface}`
                                        }`}>
                                            {/* Avatar */}
                                            <div className="relative h-10 w-10 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        navigate(getConversationProfilePath(conversation));
                                                    }}
                                                    aria-label={tx('pages.messages.profileAction', undefined, 'View profile')}
                                                    className={`relative block h-10 w-10 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-sm font-semibold text-zinc-300 transition-all hover:ring-2 ${accentClasses.avatarHoverRing}`}
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
                                                {/* Online Indicator */}
                                                {isUserOnline(conversation.otherUser.id) && (
                                                    <div 
                                                        className="absolute -bottom-[2px] -right-[2px] z-10 h-3 w-3 rounded-full border-2 border-[#060607] bg-[#14a800] shadow-sm" 
                                                        aria-hidden="true" 
                                                    />
                                                )}
                                                {/* Unread badge overlay in collapsed state */}
                                                {!showConversationsList && conversation.unread_count > 0 && (
                                                    <div className={`absolute -top-[2px] -right-[2px] z-20 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full px-1.5 py-px text-[9px] font-bold leading-none text-white ring-1 ring-[#09090b] ${accentClasses.unreadBadgeBg}`}>
                                                        {conversation.unread_count}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            {showConversationsList && (
                                                <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden gap-[3px]">
                                                    {/* Row 1 — Person name + time */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`truncate text-[13px] font-semibold leading-tight ${
                                                            conversation.unread_count > 0 ? 'text-white' : 'text-zinc-300'
                                                        }`}>
                                                            {conversation.otherUser.full_name}
                                                        </p>
                                                        <div className="flex shrink-0 items-center gap-1.5">
                                                            <span className="text-[10px] font-medium tabular-nums text-zinc-500">
                                                                {formatTime(conversation.last_message_at)}
                                                            </span>
                                                            {conversation.unread_count > 0 ? (
                                                                <span className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold leading-tight text-white ${accentClasses.unreadBadgeBg}`}>
                                                                    {conversation.unread_count}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    {/* Row 2 — Role + Status + project name text */}
                                                    <div className="flex items-center gap-1.5 min-w-0 text-[10.5px] font-medium leading-none text-zinc-500">
                                                        {(() => {
                                                            const roleMeta = getConversationRoleMeta(conversation);
                                                            const statusMeta = getConversationStatusMeta(conversation);
                                                            const workDesc = getConversationWorkDescriptor(conversation);
                                                            const items = [];
                                                            if (roleMeta) {
                                                                items.push(
                                                                    <span key="role" className="shrink-0 text-zinc-400 font-semibold">
                                                                        {roleMeta.label}
                                                                    </span>
                                                                );
                                                            }
                                                            if (statusMeta) {
                                                                items.push(
                                                                    <span key="status" className={`shrink-0 ${statusMeta.textColor || 'text-zinc-500'}`}>
                                                                        {statusMeta.label}
                                                                    </span>
                                                                );
                                                            }
                                                            const sessionMeta = conversation.contract_id ? contractSessionMetaById[conversation.contract_id] : null;
                                                            const isEscrowFunded = sessionMeta ? Boolean(sessionMeta.funded_at) : true;
                                                            const needsEscrowFunding = conversation.contract_id && !isEscrowFunded && (contractStatus === 'pending_payment' || contractStatus === 'active');
                                                            if (needsEscrowFunding) {
                                                                items.push(
                                                                    <span key="unfunded" className="shrink-0 text-amber-500 font-semibold" title="Escrow not funded yet">
                                                                        Unfunded
                                                                    </span>
                                                                );
                                                            }
                                                            if (workDesc) {
                                                                items.push(
                                                                    <span key="work" className="truncate text-zinc-500" title={workDesc}>
                                                                        {workDesc}
                                                                    </span>
                                                                );
                                                            }

                                                            return items.reduce((acc: React.ReactNode[], item, index) => {
                                                                if (index > 0) {
                                                                    acc.push(<span key={`bullet-${index}`} className="shrink-0 text-zinc-600 select-none">•</span>);
                                                                }
                                                                acc.push(item);
                                                                return acc;
                                                            }, []);
                                                        })()}
                                                    </div>

                                                    {/* Row 3 — Last message preview */}
                                                    <p className={`truncate text-[11px] leading-tight ${
                                                        conversation.unread_count > 0 ? 'text-zinc-300 font-medium' : 'text-zinc-500'
                                                    } ${previewText === deletedMessageLabel ? 'italic' : ''}`}>
                                                        {previewText}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasMoreConversations && displayConversations.length > 0 && !searchQuery && !showArchived ? (
                    <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={isLoadingMore}
                            className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-3 py-2 text-[12px] text-on-surface-muted transition-colors hover:bg-[var(--color-bg-muted)] disabled:opacity-50"
                        >
                            {isLoadingMore ? tx('common.loading', undefined, 'Loading...') : tx('pages.messages.loadMore', undefined, 'Load more')}
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Archived toggle at the bottom */}
            <div className={`border-t border-white/[0.04] bg-[#060607] ${showConversationsList ? 'px-4 py-2.5' : 'px-2 py-2.5'}`}>
                <button
                    type="button"
                    onClick={() => { setShowArchived((v) => !v); setSearchQuery(''); setFilter('all'); }}
                    title={showArchived ? tx('pages.messages.backToInbox', undefined, 'Back to inbox') : tx('pages.messages.viewArchived', undefined, 'Archived conversations')}
                    className={`flex w-full items-center ${showConversationsList ? 'gap-2 px-3' : 'justify-center px-0'} rounded-lg py-2 text-[12px] font-medium transition-all ${
                        showArchived
                            ? `${accentClasses.contractToggleActive} border`
                            : 'text-on-surface-subtle hover:text-on-surface hover:bg-[var(--color-bg-muted)] border border-transparent'
                    }`}
                >
                    <Archive className="h-3.5 w-3.5" />
                    {showConversationsList ? (
                        showArchived
                            ? tx('pages.messages.backToInbox', undefined, 'Back to inbox')
                            : tx('pages.messages.viewArchived', undefined, 'Archived conversations')
                    ) : null}
                </button>
            </div>
        </div>
    );


    const renderMessageThread = () => (
        <div className={`${showMobileThread ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#070709] relative`}>
            {selectedConversation ? (
                <div className={`flex h-full min-h-0 flex-1 ${isContractSession ? 'bg-[#070709]' : ''}`}>
                    <div className={`relative flex min-w-0 flex-1 flex-col overflow-hidden ${isContractSession ? 'border-l border-white/[0.04] bg-[#070709]' : ''}`}>
                        <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] ${accentClasses.threadAmbientGlow}`} />
                        <div className="relative z-20 border-b border-white/[0.04] bg-[#070709]/70 px-4 py-2.5 backdrop-blur-md md:px-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowMobileThread(false)}
                                        aria-label={tx('common.back', undefined, 'Back')}
                                        className="rounded-xl p-2.5 text-on-surface-muted transition-colors hover-surface hover:text-on-surface md:hidden"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>

                                    {/* Left Conversations Sidebar Toggle */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowConversationsList((prev) => {
                                                const nextVal = !prev;
                                                if (nextVal) {
                                                    // Auto-hide workspace when conversations list expands
                                                    setShowContractPanel(false);
                                                }
                                                return nextVal;
                                            });
                                        }}
                                        className={`hidden md:flex rounded-[10px] border p-2 transition-all ${
                                            showConversationsList
                                                ? 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                                                : 'border-white/[0.10] bg-white/[0.04] text-zinc-200 hover:bg-white/[0.07]'
                                        }`}
                                        title={showConversationsList ? "Hide conversations" : "Show conversations"}
                                    >
                                        {showConversationsList ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                                    </button>

                                    <div className="relative h-10 w-10 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => navigate(getConversationProfilePath(selectedConversation))}
                                            aria-label={tx('pages.messages.profileAction', undefined, 'View profile')}
                                            className={`relative block h-10 w-10 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-sm font-semibold text-zinc-300 transition-all hover:ring-2 ${accentClasses.headerAvatarHoverRing}`}
                                        >
                                            <span aria-hidden="true" className="text-[13px] font-semibold">{selectedConversation.otherUser.full_name.charAt(0)}</span>
                                            {selectedConversation.otherUser.avatar_url ? (
                                                <img
                                                    src={selectedConversation.otherUser.avatar_url}
                                                    alt={selectedConversation.otherUser.full_name}
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            ) : null}
                                        </button>
                                        {/* Online Indicator */}
                                        {isUserOnline(selectedConversation.otherUser.id) && (
                                            <div 
                                                className="absolute -bottom-[3px] -right-[3px] z-10 h-3.5 w-3.5 rounded-full border-[2.5px] border-[#070709] bg-[#14a800] shadow-sm" 
                                                aria-hidden="true" 
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                            <p className="truncate text-[13.5px] font-semibold text-white shrink-0">
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
                                                        <span className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                                                            <span>{getConversationWorkDescriptor(selectedConversation)}</span>
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
                                    {isContractSession && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.innerWidth < 1024) {
                                                    setIsContractWorkspaceOpen(true);
                                                } else {
                                                    setShowContractPanel((prev) => {
                                                        const nextVal = !prev;
                                                        if (nextVal) {
                                                            // Auto-collapse conversations list when workspace opens
                                                            setShowConversationsList(false);
                                                        }
                                                        return nextVal;
                                                    });
                                                }
                                            }}
                                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                                                showContractPanel
                                                    ? 'border-white/[0.12] bg-white/[0.06] text-zinc-100'
                                                    : 'border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                                            }`}
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>{showContractPanel ? tx('pages.messages.hideWorkspace', undefined, 'Hide Workspace') : tx('contract.workspaceTitle', undefined, 'Workspace')}</span>
                                        </button>
                                    )}

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
                                <div ref={menuRef} className="absolute right-6 top-[72px] z-[70] mt-2 w-48 overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] py-1 shadow-2xl">
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
                                            setIsReportModalOpen(true);
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

                        {/* Compact premium dismissible alert banner */}
                        {(selectedContractReviewBanner || translatedLifecycleBanner)
                            && selectedConversationPolicy
                            && selectedConversationPolicy.bannerTone !== 'none'
                            && (selectedConversationPolicy.contractStatus !== 'unknown' || showUnknownContractBanner)
                            && !isBannerDismissed ? (
                            <div className={`mx-4 md:mx-5 mt-3 rounded-xl border px-3 py-2 text-[11px] flex items-center justify-between gap-2.5 backdrop-blur-md ${getLifecycleBannerClassName(selectedConversationPolicy.bannerTone)} shadow-sm`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-current opacity-95" />
                                    <p className="text-zinc-300 leading-normal truncate">
                                        <span className="font-semibold text-white mr-1">
                                             {selectedContractStatus === 'revision_requested' ? tx('contract.requestRevision') + ':' : tx('common.warning') + ':'}
                                         </span>
                                        {tx(
                                            'pages.messages.lifecycleBanner',
                                            { message: String(translatedLifecycleBanner) },
                                            translatedLifecycleBanner,
                                        )}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsBannerDismissed(true)}
                                    className="p-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all shrink-0"
                                    aria-label="Dismiss banner"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : null}

                    <div ref={messagesParentRef} className="relative z-0 flex flex-1 flex-col overflow-y-auto px-4 py-3 md:px-5 md:py-4">
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
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
                                    <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                                        {tx('pages.messages.today', undefined, 'Today')}
                                    </span>
                                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
                                </div>

                                <div className="relative flex w-full flex-col">
                                    {displayMessages.map((message, idx) => {
                                        const isOwnMessage = message.sender_id === user?.id;
                                        const contractSystemMessageKind = getMessageContractSystemKind(message);
                                        const isContractSystemMessage = Boolean(contractSystemMessageKind);
                                        
                                        // Calculate consecutive grouping
                                        const prevMessage = idx > 0 ? displayMessages[idx - 1] : null;
                                        const nextMessage = idx < displayMessages.length - 1 ? displayMessages[idx + 1] : null;
                                        
                                        const isConsecutivePrev = prevMessage
                                            && prevMessage.sender_id === message.sender_id
                                            && (new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 5 * 60 * 1000)
                                            && !isContractSystemMessage
                                            && !getMessageContractSystemKind(prevMessage);
                                            
                                        const isConsecutiveNext = nextMessage
                                            && nextMessage.sender_id === message.sender_id
                                            && (new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() < 5 * 60 * 1000)
                                            && !isContractSystemMessage
                                            && !getMessageContractSystemKind(nextMessage);

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
                                            <div key={message.id} className={isConsecutivePrev ? 'mt-[3px]' : 'mt-[14px]'}>
                                                <div id={`message-${message.id}`} className={`group/message flex w-full ${isContractSystemMessage ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`relative max-w-[82%] md:max-w-[70%] xl:max-w-[62%] flex flex-col ${isContractSystemMessage ? 'items-center' : isOwnMessage ? 'items-end' : 'items-start'}`}>
                                                        {/* Hover action toolbar (Reply & Delete) */}
                                                        {!isContractSystemMessage && (
                                                            <div
                                                                className={`absolute top-1 z-10 flex items-center gap-1.5 opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 transition-opacity pointer-events-none group-hover/message:pointer-events-auto hidden md:flex ${
                                                                    isOwnMessage ? 'right-full mr-2.5' : 'left-full ml-2.5'
                                                                }`}
                                                            >
                                                                {!isDeletedMessage(message) && canReplyInSelectedConversation ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleReplyToMessage(message)}
                                                                        aria-label={tx('pages.messages.replyAction', undefined, 'Reply to message')}
                                                                        className="h-6 w-6 rounded-full border border-white/[0.08] bg-[#1f1f23] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                                                                    >
                                                                        <CornerUpLeft className="h-3.5 w-3.5" />
                                                                    </button>
                                                                ) : null}

                                                                {isOwnMessage && !message.status && !message.is_deleted && !isProtectedContractEvidenceMessage(message) ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => void handleDeleteMessage(message)}
                                                                        disabled={deletingMessageId === message.id}
                                                                        aria-label={tx('pages.messages.deleteMessage', undefined, 'Delete message')}
                                                                        className="h-6 w-6 rounded-full border border-white/[0.08] bg-[#1f1f23] text-zinc-400 hover:text-red-400 hover:border-red-500/20 hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
                                                                    >
                                                                        {deletingMessageId === message.id ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </button>
                                                                ) : null}
                                                            </div>
                                                        )}


                                                        <div className={`flex items-end gap-2 ${isContractSystemMessage ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                            {!isOwnMessage && !isContractSystemMessage ? (
                                                                !isConsecutiveNext ? (
                                                                    <div className="relative w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.08] overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-zinc-300">
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
                                                                ) : (
                                                                    <div className="w-6 shrink-0" />
                                                                )
                                                            ) : null}

                                                            <div
                                                                className={`min-w-0 break-words ${
                                                                    isDeletedMessage(message)
                                                                        ? 'rounded-full border border-white/[0.06] bg-white/[0.018] text-zinc-500 px-3 py-1.5 text-xs'
                                                                        : isContractSystemMessage
                                                                        ? 'bg-zinc-950/40 border border-white/[0.05] rounded-2xl p-4 min-w-[280px] max-w-[480px] flex flex-col gap-2 shadow-sm'
                                                                        : (hasImageAttachment && (isImageOnlyMessage || shouldRenderImageCaption))
                                                                        ? (isOwnMessage
                                                                            ? `relative ${accentClasses.ownBubbleBg} p-1 overflow-hidden rounded-xl min-w-[95px] ${isConsecutiveNext ? '' : 'rounded-br-sm'} text-white ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-85' : ''}`
                                                                            : `relative border border-white/[0.05] bg-white/[0.025] backdrop-blur-md p-1 overflow-hidden rounded-xl min-w-[95px] ${isConsecutiveNext ? '' : 'rounded-bl-sm'} text-zinc-100`)
                                                                        : isOwnMessage
                                                                        ? `relative ${accentClasses.ownBubbleBg} text-white pt-2.5 pr-4 pb-3.5 pl-4 rounded-xl min-w-[95px] ${isConsecutiveNext ? '' : 'rounded-br-sm'} text-[13px] font-normal leading-relaxed ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-85' : ''}`
                                                                        : `relative border border-white/[0.05] bg-white/[0.025] backdrop-blur-md text-zinc-100 pt-2.5 pr-4 pb-3.5 pl-4 rounded-xl min-w-[95px] ${isConsecutiveNext ? '' : 'rounded-bl-sm'} text-[13px] font-normal leading-relaxed`
                                                                } ${highlightedMessageId === message.id ? `ring-1 ${accentClasses.highlightRing}` : ''}`}
                                                            >
                                                                {replyMetadata ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            scrollToMessageById(replyMetadata.messageId);
                                                                        }}
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

                                                                {isContractSystemMessage ? (
                                                                    (() => {
                                                                        const kind = contractSystemMessageKind || 'delivery';
                                                                        let IconComponent = FileText;
                                                                        let iconColorClass = 'text-violet-400 bg-violet-500/10 border-violet-500/20';
                                                                        
                                                                        if (kind === 'delivery') {
                                                                            IconComponent = FileText;
                                                                            iconColorClass = isFreelancerWorkspace ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';
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

                                                                        let eventTitle = 'System Update';
                                                                        const eventDescription = resolveSystemMessageText(messageText ?? '', kind, tx);
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
                                                                    <div className="relative">
                                                                        <CollapsibleMessageText text={messageText ?? ''} isDeleted={isDeletedMessage(message)} isOwnMessage={isOwnMessage} />
                                                                    </div>
                                                                ) : null}

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
                                                                                        onClick={() => { setLightboxImageUrl(attachmentUrl); }}
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
                                                                                            <div className={`px-3 py-2 text-sm text-left relative ${isOwnMessage ? accentClasses.ownTextMuted : 'text-zinc-200'}`}>
                                                                                                <CollapsibleMessageText text={messageText ?? ''} isDeleted={isDeletedMessage(message)} isOwnMessage={isOwnMessage} />
                                                                                            </div>
                                                                                        ) : null}
                                                                                    </button>
                                                                                );
                                                                            }

                                                                            if (isAudio) {
                                                                                return (
                                                                                    <div key={index} className="flex flex-col gap-1 w-full max-w-sm">
                                                                                        <MessageAudioPlayer
                                                                                            src={attachmentUrl}
                                                                                            rawSource={att.url}
                                                                                            name={att.name}
                                                                                            mimeType={att.type}
                                                                                            isOwn={isOwnMessage}
                                                                                            accentVariant={isFreelancerWorkspace ? 'violet' : 'amber'}
                                                                                        />
                                                                                    </div>
                                                                                );
                                                                            }

                                                                            return (
                                                                                <div key={index} className="flex flex-col gap-1 w-full max-w-sm">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => { void handleOpenAttachment(att); }}
                                                                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors w-full ${
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
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : null}
                                                                {!isContractSystemMessage && !isDeletedMessage(message) && (
                                                                    <div className={`absolute bottom-1 right-2.5 flex items-center gap-1 text-[9px] select-none text-zinc-500`}>
                                                                        <span>{formatMessageTime(message.created_at)}</span>
                                                                        {isOwnMessage && (
                                                                            message.status === 'sending' ? (
                                                                                <Clock className="h-2.5 w-2.5" />
                                                                            ) : message.status === 'failed' ? (
                                                                                <span className="text-red-400 font-bold">!</span>
                                                                            ) : (
                                                                                <CheckCheck className={`h-3 w-3 ${message.is_read ? (isFreelancerWorkspace ? 'text-violet-400' : 'text-amber-400') : 'text-zinc-500/80'}`} />
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
                                    })}
                                </div>

                                {pendingQueue.map((pendingMsg, idx) => (
                                    <div key={`pending-${idx}`} className="flex justify-end w-full opacity-70">
                                        <div className="max-w-[80%]">
                                            <div className={`${accentClasses.ownBubbleBg} text-white px-3 py-2 rounded-xl rounded-br-sm text-[13px]`}>
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

                    <div className="shrink-0 border-t border-white/[0.04] bg-[#070709]/80 px-4 py-2.5 backdrop-blur-md">
                        {contractActionBar ? (
                            <div className="mb-2 flex items-center gap-2 px-1 text-[11px] select-none">
                                <span className="font-semibold uppercase tracking-[0.08em] text-zinc-500 shrink-0">Contract update:</span>
                                <span className="truncate text-zinc-400 font-normal">{contractActionBar.text}</span>
                            </div>
                        ) : null}
                        {replyTarget ? (
                            <div className="mb-3 rounded-xl border border-[#1f2328] bg-[var(--color-bg-elevated)] px-3 py-2">
                                <div className="flex items-start gap-2">
                                    <span className={`mt-0.5 h-8 w-1 rounded-full ${accentClasses.replyStripe}`} aria-hidden="true" />
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs font-semibold ${accentClasses.headerMetaText}`}>{tx('pages.messages.replyingTo', undefined, 'Replying to')} {replyTarget.senderName}</p>
                                        <p className="text-xs text-zinc-400 truncate">{replyTarget.previewText}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReplyTarget(null)}
                                        className="rounded-md p-1 text-zinc-500 hover:bg-[var(--color-bg-muted)] hover:text-white transition-colors"
                                        aria-label={tx('pages.messages.cancelReply', undefined, 'Cancel reply')}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {!canSendInSelectedConversation ? (
                            /* ── Premium Read-Only Lock Panel ── */
                            <div className="flex items-center gap-3 rounded-[20px] border border-white/[0.07] bg-[var(--color-bg-elevated)] px-4 py-3.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[#161719] text-[#55534F]">
                                    <Flag className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium text-[#8A8880]">
                                        {translatedBlockedReason || tx('pages.messages.readOnlyFallback', undefined, 'This conversation is read-only.')}
                                    </p>
                                </div>
                                {selectedWorkspaceContractId && !contractActionBar ? (
                                    <button
                                        type="button"
                                        onClick={() => navigate(getContractWorkspaceRoute(selectedWorkspaceContractId))}
                                        className="shrink-0 rounded-[10px] border border-white/[0.07] bg-[#161719] px-3 py-1.5 text-[13px] font-medium text-[#8A8880] transition-colors hover:border-white/[0.12] hover:bg-[#1a1b1e] hover:text-[#F0EFE8]"
                                    >
                                        {tx('pages.messages.viewWorkspace', undefined, 'View workspace')} ↗
                                    </button>
                                ) : null}
                            </div>
                        ) : (
                            /* ── Normal Composer ── */
                            <ChatInputArea
                                value={newMessage}
                                onChange={(val) => {
                                    setNewMessage(val);
                                    if (val.trim()) startTyping();
                                    else stopTyping();
                                }}
                                onSend={() => {
                                    stopTyping();
                                    void handleSendMessage();
                                }}
                                isSending={isSending}
                                selectedFiles={selectedFile ? [selectedFile] : []}
                                onFileSelect={handleFileChange}
                                onRemoveFile={() => setSelectedFile(null)}
                                canAttachFiles={canAttachInSelectedConversation}
                                isRecording={isRecording}
                                onToggleRecord={() => {
                                    if (!canSendVoiceInSelectedConversation) {
                                        const blockedMessage = translatedBlockedReason || tx('pages.messages.voiceNotesDisabled', undefined, 'Voice notes are disabled for this conversation.');
                                        showToast(tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage), 'warning');
                                        return;
                                    }
                                    if (isRecording) stopRecording();
                                    else startRecording();
                                }}
                                canRecordAudio={canSendVoiceInSelectedConversation}
                                disabled={isSending}
                                placeholder={tx('pages.messages.messagePlaceholder', undefined, 'Type a message...')}
                            />
                        )}
                    </div>

                    </div>

                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="text-center max-w-xs">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-[var(--color-bg-elevated)] text-[#55534F]">
                            <Mail className="h-7 w-7" />
                        </div>
                        <h3 className="text-[18px] font-medium tracking-[-0.01em] text-[#F0EFE8]">
                            {tx('pages.messages.selectConversationTitle', undefined, 'Your messages')}
                        </h3>
                        <p className="mt-2 text-[14px] leading-relaxed text-[#8A8880]">
                            {tx('pages.messages.selectConversationDescription', undefined, 'Select a conversation from the sidebar to start messaging, or wait for someone to reach out.')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const deliverModalTitle = selectedContractStatus === 'revision_requested'
        ? tx('contract.resubmitDelivery', undefined, 'Resubmit Delivery')
        : tx('contract.deliverWork', undefined, 'Deliver Work');

    return (
        <>
            <div className="min-h-screen page-bg-base">
                <SEO {...SEO_CONFIG.messages} url="/messages" noIndex />
                <Header />

                <main className="flex-1 w-full h-[calc(100vh-64px)] flex flex-row overflow-hidden">
                    {renderConversationList()}
                    {renderMessageThread()}
                    {isContractSession && contractSidebarData && (
                        <div className={`transition-all duration-300 ease-in-out border-l border-white/[0.04] bg-[#070709] overflow-y-auto shrink-0 flex flex-col ${
                            showContractPanel 
                                ? 'w-80 lg:w-[380px] xl:w-[420px] opacity-100' 
                                : 'w-0 opacity-0 border-l-0 pointer-events-none'
                        } hidden lg:flex`}>
                            {isContractSidebarDataLoading ? (
                                <div className="flex-1 flex items-center justify-center p-6 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                                </div>
                            ) : (
                                <ContractDetailsSidebar
                                    contract={contractSidebarData}
                                    userRole={selectedContractUserRole}
                                    currentStatus={selectedContractStatus || 'unknown'}
                                    deliverySubmitted={contractDeliverySubmitted}
                                    isActionLoading={isAnyContractActionLoading}
                                    activityEvents={selectedContractActivityEvents}
                                    onDeliver={() => {
                                        setDeliveryActionError(null);
                                        setIsDeliverModalOpen(true);
                                    }}
                                    onRequestChanges={() => void handleRequestContractChanges()}
                                    onAcceptAndPay={() => setIsAcceptModalOpen(true)}
                                    onDispute={() => setIsDisputeModalOpen(true)}
                                    onReview={() => setIsReviewModalOpen(true)}
                                    onOpenSharedFile={(file) => void handleOpenContractSidebarFile(file)}
                                    hasLeftReview={selectedContractHasReview}
                                    onFundEscrow={() => setIsFundEscrowOpen(true)}
                                    isSidebar={true}
                                    onOpenWorkspace={() => selectedWorkspaceContractId && navigate(getContractWorkspaceRoute(selectedWorkspaceContractId))}
                                />
                            )}
                        </div>
                    )}
                </main>
            </div>

            <Modal
                isOpen={isDeliverModalOpen}
                onClose={() => {
                    if (isDeliveringContractWork) return;
                    setIsDeliverModalOpen(false);
                    setDeliveryActionError(null);
                }}
                title={deliverModalTitle}
                size="md"
            >
                <SubmitDeliveryForm
                    deliveryNote={deliveryNote}
                    files={deliveryFiles}
                    isSubmitting={isDeliveringContractWork}
                    actionError={deliveryActionError}
                    submitLabel={selectedContractStatus === 'revision_requested' ? 'Resubmit delivery' : 'Submit delivery'}
                    submittingLabel="Submitting delivery..."
                    onNoteChange={(value) => {
                        if (deliveryActionError) {
                            setDeliveryActionError(null);
                        }
                        setDeliveryNote(value);
                    }}
                    onAddFiles={(files) => {
                        setDeliveryActionError(null);
                        setDeliveryFiles((prev) => [...prev, ...files]);
                    }}
                    onRemoveFile={(index) => setDeliveryFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                    onSubmit={(links, fileStages) => {
                        void handleDeliverContractWork(links, fileStages);
                    }}
                    onCancel={() => {
                        setIsDeliverModalOpen(false);
                        setDeliveryActionError(null);
                        setDeliveryFiles([]);
                    }}
                />
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

            <Modal
                isOpen={isContractWorkspaceOpen}
                onClose={() => setIsContractWorkspaceOpen(false)}
                title={tx('pages.messages.contractWorkspaceTitle', undefined, 'Contract Workspace')}
                size="full"
            >
                <div className="mx-auto max-w-5xl overflow-hidden rounded-[10px] bg-[var(--color-bg-elevated)] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                    {isContractSidebarDataLoading ? (
                        <div className="flex min-h-[420px] items-center justify-center px-6 text-center">
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
                            activityEvents={selectedContractActivityEvents}
                            onDeliver={() => {
                                setDeliveryActionError(null);
                                setIsContractWorkspaceOpen(false);
                                setIsDeliverModalOpen(true);
                            }}
                            onRequestChanges={() => {
                                void handleRequestContractChanges();
                            }}
                            onAcceptAndPay={() => {
                                setIsContractWorkspaceOpen(false);
                                setIsAcceptModalOpen(true);
                            }}
                            onDispute={() => {
                                setIsContractWorkspaceOpen(false);
                                setIsDisputeModalOpen(true);
                            }}
                            onReview={() => {
                                setIsContractWorkspaceOpen(false);
                                setIsReviewModalOpen(true);
                            }}
                            onOpenSharedFile={(file: { url?: string; name: string; type?: string | null; size?: number | string | null; storageBucket?: string | null; storagePath?: string | null }) => {
                                void handleOpenContractSidebarFile(file);
                            }}
                            hasLeftReview={selectedContractHasReview}
                            onFundEscrow={() => {
                                setIsContractWorkspaceOpen(false);
                                setIsFundEscrowOpen(true);
                            }}
                            onOpenWorkspace={() => selectedWorkspaceContractId && navigate(getContractWorkspaceRoute(selectedWorkspaceContractId))}
                        />
                    ) : (
                        <div className="flex min-h-[420px] items-center justify-center px-6 text-center">
                            <p className="text-xs text-on-surface-subtle">
                                {tx('pages.messages.contractSidebarUnavailable', undefined, 'Contract details are not available for this conversation yet.')}
                            </p>
                        </div>
                    )}
                </div>
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
                <div className="space-y-4" style={deleteModalWorkspaceVars}>
                    <p className="text-xs text-zinc-400 mt-1">
                        {tx('pages.messages.deleteMessagePrompt', undefined, 'Choose how you want to delete this message:')}
                    </p>

                    {messagePendingDelete?.content ? (
                        <div className="rounded-xl border border-white/[0.04] bg-white/[0.012] pl-3 py-2 pr-4 text-xs text-zinc-300 border-l-2 border-l-zinc-500 italic max-h-24 overflow-y-auto">
                            {messagePendingDelete.content}
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-2.5">
                        <button
                            type="button"
                            onClick={() => void confirmDeleteMessage('me')}
                            disabled={!!deletingMessageId}
                            className="w-full text-center bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-zinc-200 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
                        >
                            {tx('pages.messages.deleteForMe', undefined, 'Delete for me')}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => void confirmDeleteMessage('everyone')}
                            disabled={!!deletingMessageId}
                            className="w-full text-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-200 hover:text-red-100 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {deletingMessageId ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-200" />
                            ) : null}
                            <span>{tx('pages.messages.deleteForEveryone', undefined, 'Delete for everyone')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMessagePendingDelete(null)}
                            disabled={!!deletingMessageId}
                            className="w-full text-center text-zinc-500 hover:text-zinc-300 text-xs py-1.5 transition-colors font-medium cursor-pointer"
                        >
                            {tx('common.cancel', undefined, 'Cancel')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Fund Escrow Modal */}
            {isFundEscrowOpen && selectedContractMeta && (
                <Modal
                    isOpen={isFundEscrowOpen}
                    onClose={() => setIsFundEscrowOpen(false)}
                    title={tx('payment.fundEscrowTitle', undefined, 'Fund Escrow')}
                    size="md"
                >
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <FundEscrow
                            contract={{
                                id: selectedWorkspaceContractId,
                                budget: selectedContractMeta.amount || 0,
                                freelancer_id: selectedContractMeta.freelancer_id,
                                funded_at: selectedContractMeta.funded_at ?? null
                            } as any}
                            onSuccess={() => {
                                setIsFundEscrowOpen(false);
                                if (selectedContractId) {
                                    syncContractStatusLocally(selectedContractId, 'active');
                                    setContractSessionMetaById((prev) => {
                                        const existing = prev[selectedContractId];
                                        if (!existing) return prev;
                                        return {
                                            ...prev,
                                            [selectedContractId]: {
                                                ...existing,
                                                status: 'active',
                                                funded_at: new Date().toISOString()
                                            }
                                        };
                                    });
                                }
                            }}
                            onError={() => setIsFundEscrowOpen(false)}
                        />
                    </div>
                </Modal>
            )}

            {/* ─── Report User Modal ─────────────────────────────────────── */}
            <Modal
                isOpen={isReportModalOpen}
                onClose={() => {
                    setIsReportModalOpen(false);
                    setReportReason('');
                    setCustomReportReason('');
                    setReportTouched(false);
                }}
                title={tx('pages.messages.reportUserTitle', undefined, 'Report User')}
                size="sm"
            >
                <div className="space-y-4 pt-2">
                    <p className="text-xs text-white/50 leading-relaxed">
                        {tx('pages.messages.reportUserDescription', undefined, 'Tell us why you are reporting this user. Our team will review their profile and recent activity.')}
                    </p>
                    <div className="space-y-2">
                        {[
                            { value: 'spam', label: tx('pages.messages.reportReason.spam', undefined, 'Spam or misleading') },
                            { value: 'inappropriate', label: tx('pages.messages.reportReason.inappropriate', undefined, 'Inappropriate behavior or content') },
                            { value: 'fraud', label: tx('pages.messages.reportReason.fraud', undefined, 'Fraud or scam attempt') },
                            { value: 'harassment', label: tx('pages.messages.reportReason.harassment', undefined, 'Harassment or abuse') },
                            { value: 'other', label: tx('pages.messages.reportReason.other', undefined, 'Other') }
                        ].map((r) => (
                            <label
                                key={r.value}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                    reportReason === r.value ? 'border-violet-500 bg-violet-500/10' : 'border-white/5 bg-white/[0.02]'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="user-report-reason"
                                    value={r.value}
                                    checked={reportReason === r.value}
                                    onChange={() => setReportReason(r.value)}
                                    className="accent-violet-500"
                                />
                                <span className="text-sm font-bold text-white">
                                    {tx(`pages.messages.reportReason.${r.value}`, undefined, r.label)}
                                </span>
                            </label>
                        ))}
                    </div>

                    {reportReason === 'other' && (
                        <div>
                            <textarea
                                value={customReportReason}
                                onChange={(e) => setCustomReportReason(e.target.value)}
                                placeholder={tx('common.reportDescribePlaceholder', undefined, 'Please describe the issue...')}
                                rows={3}
                                className={`w-full resize-none rounded-xl border bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-violet-500 ${
                                    reportTouched && !customReportReason.trim() ? 'border-red-500' : 'border-white/5'
                                }`}
                            />
                            {reportTouched && !customReportReason.trim() && (
                                <p className="text-red-500 text-xs mt-1" role="alert">
                                    {tx('common.reportDescribePlaceholder', undefined, 'Please describe the issue')}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-3 border-t border-white/5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsReportModalOpen(false);
                                setReportReason('');
                                setCustomReportReason('');
                                setReportTouched(false);
                            }}
                            disabled={isSubmittingReport}
                        >
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                                setReportTouched(true);
                                void handleReportUser();
                            }}
                            isLoading={isSubmittingReport}
                            disabled={!reportReason || (reportReason === 'other' && !customReportReason.trim())}
                        >
                            {tx('common.reportSubmitButton', undefined, 'Submit report')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ─── Image Lightbox Modal ─────────────────────────────────── */}
            {lightboxImageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => setLightboxImageUrl(null)}
                    role="dialog"
                    aria-modal="true"
                                                    aria-label={tx('pages.messages.lightbox.ariaLabel', undefined, 'Image preview')}
                                                >
                                                    <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                                                        {/* Control buttons */}
                                                        <div className="absolute -top-12 -right-12 sm:top-0 sm:right-0 flex items-center gap-2 p-2 z-10">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const link = document.createElement('a');
                                                                    link.href = lightboxImageUrl;
                                                                    link.download = 'image';
                                                                    document.body.appendChild(link);
                                                                    link.click();
                                                                    document.body.removeChild(link);
                                                                }}
                                                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                                                aria-label={tx('pages.messages.lightbox.downloadAria', undefined, 'Download image')}
                                                                title={tx('pages.messages.lightbox.downloadTitle', undefined, 'Download')}
                                                            >
                                                                <Download className="h-6 w-6 text-white" />
                                                            </button>
                                                            
                                                            <button
                                                                type="button"
                                                                onClick={() => setLightboxImageUrl(null)}
                                                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                                                aria-label={tx('pages.messages.lightbox.closeAria', undefined, 'Close image preview')}
                                                                title={tx('pages.messages.lightbox.closeTitle', undefined, 'Close')}
                                                            >
                                                                <X className="h-6 w-6 text-white" />
                                                            </button>
                                                        </div>
    
                                                        {/* Image */}
                                                        <img
                                                            src={lightboxImageUrl}
                                                            alt={tx('pages.messages.lightbox.altText', undefined, 'Preview')}
                                                            className="max-w-full max-h-[90vh] rounded-xl object-contain"
                                                            onError={e => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                    </div>
                </div>
            )}
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
