import React, { useRef } from 'react';
import { Search, X, Loader2, Archive, Mail } from 'lucide-react';
import type { Conversation, AccentClasses, ConversationRoleMeta, ConversationStatusMeta } from './types';

interface ConversationSidebarProps {
    showConversationsList: boolean;
    showMobileThread: boolean;
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    contractStatusById: Record<string, string>;
    contractSessionMetaById: Record<string, any>;
    contractStatusesHydrated: boolean;
    isLoadingConversations: boolean;
    isLoadingMore: boolean;
    hasMoreConversations: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    filter: 'all' | 'unread';
    setFilter: (f: 'all' | 'unread') => void;
    showArchived: boolean;
    setShowArchived: React.Dispatch<React.SetStateAction<boolean>>;
    archivedConversationIds: Set<string>;
    unarchivedConversationIds: Set<string>;
    archiveConversation: (id: string) => void;
    unarchiveConversation: (id: string) => void;
    handleSelectConversation: (c: Conversation) => void;
    prefetchConversationMessages: (id: string) => Promise<void>;
    isFreelancerWorkspace: boolean;
    conversationSummaryLabel: string;
    accentClasses: AccentClasses;
    isUserOnline: (id: string) => boolean;
    getConversationLastPreviewText: (id: string, text: string | null) => string | null;
    getConversationWorkDescriptor: (c: Conversation) => string;
    getConversationRoleMeta: (c: Conversation) => ConversationRoleMeta | null;
    getConversationStatusMeta: (c: Conversation) => ConversationStatusMeta | null;
    showContractPanel: boolean;
    setShowContractPanel: (b: boolean) => void;
    setShowConversationsList: (b: boolean) => void;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    navigate: (path: string) => void;
    getConversationProfilePath: (c: Conversation) => string;
    tx: any;
    language: string;
}

const TERMINAL_STATUSES = new Set(['completed', 'refunded', 'cancelled', 'canceled']);

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    showConversationsList,
    showMobileThread,
    conversations,
    selectedConversation,
    contractStatusById,
    contractSessionMetaById,
    contractStatusesHydrated,
    isLoadingConversations,
    isLoadingMore,
    hasMoreConversations,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    showArchived,
    setShowArchived,
    archivedConversationIds,
    unarchivedConversationIds,
    archiveConversation,
    unarchiveConversation,
    handleSelectConversation,
    prefetchConversationMessages,
    isFreelancerWorkspace,
    conversationSummaryLabel,
    accentClasses,
    isUserOnline,
    getConversationLastPreviewText,
    getConversationWorkDescriptor,
    getConversationRoleMeta,
    getConversationStatusMeta,
    showContractPanel,
    setShowContractPanel,
    setShowConversationsList,
    setPage,
    navigate,
    getConversationProfilePath,
    tx,
    language,
}) => {
    const conversationsParentRef = useRef<HTMLDivElement>(null);
    const deletedMessageLabel = tx('pages.messages.deletedMessage', undefined, 'Message deleted');

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

    // Filter display logic
    const displayConversations = conversations.filter((conversation) => {
        const contractStatus = conversation.contract_id ? contractStatusById[conversation.contract_id] ?? '' : '';
        const isTerminalAndRead = TERMINAL_STATUSES.has(contractStatus) && conversation.unread_count === 0;

        const isArchived = archivedConversationIds.has(conversation.id)
            || (isTerminalAndRead && !unarchivedConversationIds.has(conversation.id));

        if (showArchived && !isArchived) return false;
        if (!showArchived && isArchived) return false;

        if (filter === 'unread' && conversation.unread_count === 0) return false;

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const partnerName = conversation.otherUser.full_name.toLowerCase();
            const lastText = (conversation.last_message_text || '').toLowerCase();
            return partnerName.includes(query) || lastText.includes(query);
        }

        return true;
    });



    return (
        <div 
            onClick={() => {
                if (showContractPanel) {
                    setShowContractPanel(false);
                }
                if (!showConversationsList) {
                    setShowConversationsList(true);
                }
            }}
            className={`transition-all duration-300 ease-in-out border-e border-white/[0.04] bg-[#060607]/92 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden ${
                showConversationsList
                    ? 'w-full md:w-[320px] lg:w-[340px] xl:w-[360px] opacity-100'
                    : 'w-0 md:w-[76px] opacity-100 border-e pointer-events-auto cursor-pointer hover:bg-white/[0.012]'
            } ${showMobileThread ? 'hidden md:flex' : 'flex'}`}>
            {/* Header */}
            {showConversationsList ? (
                <div className="border-b border-white/[0.04] bg-white/[0.008] p-3.5 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-[18px] font-semibold tracking-tight text-zinc-100">{tx('pages.messages.title', undefined, 'Messages')}</h2>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 font-normal">
                                <span className={`h-1.5 w-1.5 rounded-full ${isFreelancerWorkspace ? 'bg-violet-500 animate-pulse' : 'bg-[var(--color-status-warning)] animate-pulse'}`} />
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

            {/* Conversation list */}
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
                                    {/* Archive button */}
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
                                            className="absolute end-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] items-center justify-center text-on-surface-subtle hover:text-on-surface transition-all opacity-0 group-hover/item:opacity-100 hidden md:flex"
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
                                                        className="absolute -bottom-[2px] -end-[2px] z-10 h-3 w-3 rounded-full border-2 border-[#060607] bg-[#14a800] shadow-sm" 
                                                        aria-hidden="true" 
                                                    />
                                                )}
                                                {/* Unread badge overlay in collapsed state */}
                                                {!showConversationsList && conversation.unread_count > 0 && (
                                                    <div className={`absolute -top-[2px] -end-[2px] z-20 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full px-1.5 py-px text-[9px] font-bold leading-none text-white ring-1 ring-[#09090b] ${accentClasses.unreadBadgeBg}`}>
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
                                                                    <span key="unfunded" className="shrink-0 text-[var(--color-status-warning)] font-semibold" title={tx('auto.escrow_not_funded_ye', undefined, 'Escrow not funded yet')}>
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
};
