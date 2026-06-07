/**
 * ConversationListPanel.tsx
 * The left sidebar showing the conversations list, search, filter chips, and archive toggle.
 * Extracted from the Messages.tsx God Component.
 */
import { Search, X, Loader2, Mail, Archive } from 'lucide-react';
import type { Conversation } from '../../services/messages';
import { useTranslation } from '../../i18n';

type ContractStatusById = Record<string, string>;

interface ConversationRoleMeta {
    label: string;
    className: string;
    textColor?: string;
}

interface ConversationStatusMeta {
    label: string;
    className: string;
    textColor?: string;
}

interface ConversationListPanelProps {
    showMobileThread: boolean;
    searchQuery: string;
    filter: 'all' | 'unread';
    showArchived: boolean;
    isLoading: boolean;
    contractStatusesHydrated: boolean;
    displayConversations: Conversation[];
    hasMoreConversations: boolean;
    isLoadingMore: boolean;
    selectedConversation: Conversation | null;
    archivedConversationIds: Set<string>;
    unarchivedConversationIds: Set<string>;
    contractStatusById: ContractStatusById;
    contractSessionMetaById?: Record<string, any>;
    conversationSummaryLabel: string;
    accentClasses: {
        searchSurface: string;
        contractToggleActive: string;
        conversationHoverSurface: string;
        selectedConversationSurface: string;
        avatarHoverRing: string;
        headerAvatarHoverRing: string;
        unreadBadgeBg: string;
    };
    TERMINAL_STATUSES: Set<string>;
    onSearchChange: (query: string) => void;
    onFilterChange: (f: 'all' | 'unread') => void;
    onSelectConversation: (c: Conversation) => void;
    onPrefetchConversation: (id: string) => void;
    onLoadMore: () => void;
    onArchive: (id: string) => void;
    onUnarchive: (id: string) => void;
    onToggleArchived: () => void;
    onNavigateToProfile: (c: Conversation) => void;
    isUserOnline: (userId: string) => boolean;
    getConversationLastPreviewText: (conversationId: string, rawText: string | null | undefined) => string | null;
    getConversationWorkDescriptor: (c: Conversation) => string;
    getConversationRoleMeta: (c: Conversation) => ConversationRoleMeta | null;
    getConversationStatusMeta: (c: Conversation) => ConversationStatusMeta | null;
    formatTime: (ts: string | null) => string;
    deletedMessageLabel: string;
}

export const ConversationListPanel = ({
    showMobileThread,
    searchQuery,
    filter,
    showArchived,
    isLoading,
    contractStatusesHydrated,
    displayConversations,
    hasMoreConversations,
    isLoadingMore,
    selectedConversation,
    archivedConversationIds,
    unarchivedConversationIds,
    contractStatusById,
    contractSessionMetaById,
    conversationSummaryLabel,
    accentClasses,
    TERMINAL_STATUSES,
    onSearchChange,
    onFilterChange,
    onSelectConversation,
    onPrefetchConversation,
    onLoadMore,
    onArchive,
    onUnarchive,
    onToggleArchived,
    onNavigateToProfile,
    isUserOnline,
    getConversationLastPreviewText,
    getConversationWorkDescriptor,
    getConversationRoleMeta,
    getConversationStatusMeta,
    formatTime,
    deletedMessageLabel,
}: ConversationListPanelProps) => {
    const { tx } = useTranslation();

    return (
        <div className={`${showMobileThread ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] flex-col shrink-0`}>
            {/* Header */}
            <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-on-surface">
                            {tx('pages.messages.title', undefined, 'Messages')}
                        </h2>
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
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={tx('pages.messages.searchPlaceholder', undefined, 'Search conversations...')}
                        className="w-full border-0 bg-transparent p-0 text-sm text-on-surface outline-none placeholder:text-on-surface-subtle focus:outline-none focus:ring-0"
                    />
                    {searchQuery && (
                        <button type="button" onClick={() => onSearchChange('')} className="text-on-surface-subtle hover:text-on-surface transition-colors">
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
                                onClick={() => onFilterChange(f)}
                                className={`rounded-lg px-3 py-1 text-[11px] font-medium transition-all ${
                                    filter === f
                                        ? `${accentClasses.contractToggleActive} border`
                                        : 'text-on-surface-subtle hover:text-on-surface hover:bg-[var(--color-bg-muted)] border border-transparent'
                                }`}
                            >
                                {f === 'all' ? tx('pages.messages.filterAll', undefined, 'All') : tx('pages.messages.filterUnread', undefined, 'Unread')}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Conversation list */}
            <div
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}
            >
                {(isLoading || !contractStatusesHydrated) ? (
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
                            const contractStatus = conversation.contract_id ? contractStatusById[conversation.contract_id] ?? '' : '';
                            const isTerminalAndRead = TERMINAL_STATUSES.has(contractStatus) && conversation.unread_count === 0;
                            const isArchived = archivedConversationIds.has(conversation.id)
                                || (isTerminalAndRead && !unarchivedConversationIds.has(conversation.id));
                            const previewText = getConversationLastPreviewText(conversation.id, conversation.last_message_text)
                                || ((conversation.message_count ?? 0) > 0
                                    ? tx('pages.messages.attachmentLabel', undefined, 'Attachment')
                                    : tx('pages.messages.noMessagesYet', undefined, 'No messages yet'));

                            const workDesc = getConversationWorkDescriptor(conversation);
                            const roleMeta = getConversationRoleMeta(conversation);
                            const statusMeta = getConversationStatusMeta(conversation);

                            return (
                                <div key={conversation.id} className="group/item relative px-2 py-1">
                                    {/* Archive/Unarchive hover button */}
                                    <button
                                        type="button"
                                        title={isArchived ? tx('pages.messages.unarchive', undefined, 'Unarchive') : tx('pages.messages.archive', undefined, 'Archive')}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isArchived) onUnarchive(conversation.id);
                                            else onArchive(conversation.id);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] items-center justify-center text-on-surface-subtle hover:text-on-surface transition-all opacity-0 group-hover/item:opacity-100 hidden md:flex"
                                        aria-label={isArchived ? 'Unarchive conversation' : 'Archive conversation'}
                                    >
                                        <Archive className="h-3 w-3" />
                                    </button>

                                    <div
                                        onClick={() => onSelectConversation(conversation)}
                                        onMouseEnter={() => onPrefetchConversation(conversation.id)}
                                        onFocus={() => onPrefetchConversation(conversation.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                onSelectConversation(conversation);
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
                                            <div className="relative shrink-0 h-11 w-11">
                                                <button
                                                    type="button"
                                                    onClick={(event) => { event.stopPropagation(); onNavigateToProfile(conversation); }}
                                                    aria-label={tx('pages.messages.profileAction', undefined, 'View profile')}
                                                    className={`relative block h-11 w-11 overflow-hidden rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] flex items-center justify-center text-sm font-semibold text-on-surface-muted transition-all hover:ring-2 ${accentClasses.avatarHoverRing}`}
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
                                                {isUserOnline(conversation.otherUser.id) && (
                                                    <div
                                                        className="absolute -bottom-[2px] -right-[2px] z-10 h-3.5 w-3.5 rounded-full border-[2.5px] border-[var(--color-bg-subtle)] bg-[#14a800] shadow-sm"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden gap-[4px]">
                                                {/* Row 1 — Person name + time + unread badge */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`truncate text-[13.5px] font-semibold leading-tight ${conversation.unread_count > 0 ? 'text-on-surface' : 'text-on-surface-muted'}`}>
                                                        {conversation.otherUser.full_name}
                                                    </p>
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

                                                {/* Row 2 — Role + status + project name text */}
                                                <div className="flex items-center gap-1.5 min-w-0 text-[11px] font-medium leading-none text-zinc-500">
                                                    {(() => {
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
                                                        const sessionMeta = conversation.contract_id ? contractSessionMetaById?.[conversation.contract_id] : null;
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
                                                <p className={`truncate text-[11px] leading-tight ${conversation.unread_count > 0 ? 'text-on-surface-muted' : 'text-on-surface-subtle'} ${previewText === deletedMessageLabel ? 'italic' : ''}`}>
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

                {/* Load more */}
                {hasMoreConversations && displayConversations.length > 0 && !searchQuery && !showArchived ? (
                    <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
                        <button
                            type="button"
                            onClick={onLoadMore}
                            disabled={isLoadingMore}
                            className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-3 py-2 text-[12px] text-on-surface-muted transition-colors hover:bg-[var(--color-bg-muted)] disabled:opacity-50"
                        >
                            {isLoadingMore ? tx('common.loading', undefined, 'Loading...') : tx('pages.messages.loadMore', undefined, 'Load more')}
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Archive toggle */}
            <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-2.5">
                <button
                    type="button"
                    onClick={onToggleArchived}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-all ${
                        showArchived
                            ? `${accentClasses.contractToggleActive} border`
                            : 'text-on-surface-subtle hover:text-on-surface hover:bg-[var(--color-bg-muted)] border border-transparent'
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
};
