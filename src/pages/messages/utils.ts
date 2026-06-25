import type { Conversation, ConversationScope } from '../../services/messages';

const ENABLE_MESSAGES_SESSION_CACHE = false;

export const MAX_CACHED_MESSAGES = 200;

export const getMessagesCacheKey = (conversationId: string) => `messages:thread:${conversationId}`;

export const resolveConversationScopes = (activeMode: string | null | undefined): ConversationScope[] => {
    if (activeMode === 'freelancer') return ['freelancer', 'contract', 'shared'];
    if (activeMode === 'client') return ['client', 'contract', 'shared'];
    return ['client', 'freelancer', 'contract', 'shared'];
};

export const isConversationVisibleInMode = (
    conversation: Conversation,
    userId: string | undefined,
    activeMode: string | null | undefined,
): boolean => {
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

export const resolveModeCacheKey = (activeMode: string | null | undefined): string => {
    if (activeMode === 'client' || activeMode === 'freelancer') return activeMode;
    return 'all';
};

export const readSessionCache = <T,>(key: string): T | null => {
    if (!ENABLE_MESSAGES_SESSION_CACHE) return null;
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : null;
    } catch { return null; }
};

export const writeSessionCache = (key: string, value: unknown): void => {
    if (!ENABLE_MESSAGES_SESSION_CACHE) return;
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
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
export const getCounterpartyRoleFromConversation = (
    conversation: Conversation,
    userId: string | undefined,
    activeMode: string | null | undefined,
): 'client' | 'freelancer' | null => {
    if (userId) {
        const isParticipant1 = conversation.participant_1 === userId;
        const myInbox = isParticipant1
            ? conversation.inbox_participant_1
            : conversation.inbox_participant_2;

        if (myInbox === 'client') return 'freelancer';
        if (myInbox === 'freelancer') return 'client';
        if (myInbox === 'contract') {
            if (activeMode === 'client') return 'freelancer';
            if (activeMode === 'freelancer') return 'client';
        }
    }

    const scope = conversation.conversation_scope;
    if (scope === 'client') return 'freelancer';
    if (scope === 'freelancer') return 'client';
    if (scope === 'contract') {
        if (activeMode === 'client') return 'freelancer';
        if (activeMode === 'freelancer') return 'client';
    }
    return null;
};

export const resolveAccentClasses = (isFreelancerWorkspace: boolean) => ({
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
});
