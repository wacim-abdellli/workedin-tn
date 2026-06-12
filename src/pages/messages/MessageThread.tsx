import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    ArrowLeft,
    ChevronLeft,
    Menu,
    FileText,
    MoreVertical,
    User,
    Mail,
    Flag,
    AlertCircle,
    X,
    Send,
    Image as ImageIcon,
    Clock,
    CheckCheck,
    Paperclip,
    Download,
    Loader2,
    CornerUpLeft,
    Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { validateUploadSelection, validateUploadPayload } from '../../lib/uploadPolicy';
import { normalizeMimeType } from '../../lib/audioProcessing';
import {
    isImageAttachment,
    isAudioAttachment,
    formatAttachmentSize,
    getAttachmentExtensionLabel,
    resolveMessageAttachmentUrl,
    openBlobAsPreviewOrDownload,
    _truncateText,
    isDeletedMessage,
    shouldHideAttachmentUrlText,
    getMessageDisplayText,
    getMessageContractSystemKind,
    getMessageReplyMetadata,
    getLifecycleBannerClassName,
    extractMessageAttachmentPath,
    resolveContractSystemMessage,
    resolveSystemMessageText,
} from '../../lib/messageUtils';
import { parseReplyMetadataFromContent } from '../../lib/messageReplies';
import { CollapsibleMessageText } from '../../components/chat/CollapsibleMessageText';
import { MessageAudioPlayer } from '../../components/chat/MessageAudioPlayer';
import { ChatInputArea } from '../../components/chat/ChatInputArea';
import { getContractWorkspaceRoute } from '../../lib/routes';
import type { Conversation, ThreadMessage, AccentClasses, ConversationRoleMeta, ConversationStatusMeta, ReplyMetadata } from './types';


interface MessageThreadProps {
    user: any;
    profile: any;
    selectedConversation: Conversation | null;
    isContractSession: boolean;
    isFreelancerWorkspace: boolean;
    accentClasses: AccentClasses;
    
    // Message state & handlers from hook
    messages: ThreadMessage[];
    isLoadingMessages: boolean;
    displayMessages: ThreadMessage[];
    pendingQueue: any[];
    typingUsers: any[];
    newMessage: string;
    setNewMessage: (val: string) => void;
    isSending: boolean;
    replyTarget: ReplyMetadata | null;
    setReplyTarget: (val: ReplyMetadata | null) => void;
    highlightedMessageId: string | null;
    messagePendingDelete: ThreadMessage | null;
    setMessagePendingDelete: (val: ThreadMessage | null) => void;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    isRecording: boolean;
    recordingTime: number;
    startRecording: () => void;
    stopRecording: () => void;
    cancelRecording: () => void;
    audioBlob: Blob | null;
    startTyping: () => void;
    stopTyping: () => void;
    handleSendMessage: () => Promise<void>;
    handleDeleteMessage: (message: ThreadMessage) => void;
    handleReplyToMessage: (message: ThreadMessage) => void;
    scrollToMessageById: (messageId: string) => void;
    
    // Page state & controllers
    showMobileThread: boolean;
    setShowMobileThread: (val: boolean) => void;
    showConversationsList: boolean;
    setShowConversationsList: React.Dispatch<React.SetStateAction<boolean>>;
    showContractPanel: boolean;
    setShowContractPanel: React.Dispatch<React.SetStateAction<boolean>>;
    setIsContractWorkspaceOpen: (val: boolean) => void;
    
    // Contract workflow info
    selectedContractStatus: string | null;
    selectedContractUserRole: 'client' | 'freelancer' | 'system' | null;
    selectedContractReviewBanner: string | null;
    selectedConversationPolicy: any;
    showUnknownContractBanner: boolean;
    contractActionBar: any;
    selectedWorkspaceContractId: string | null;
    
    // Actions & UI triggers
    setIsReportModalOpen: (val: boolean) => void;
    setIsDeliverModalOpen: (val: boolean) => void;
    setIsAcceptModalOpen: (val: boolean) => void;
    setIsDisputeModalOpen: (val: boolean) => void;
    setIsReviewModalOpen: (val: boolean) => void;
    setIsFundEscrowOpen: (val: boolean) => void;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    
    // Refs
    messagesParentRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    messageInputRef: React.RefObject<HTMLTextAreaElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    
    // Helpers
    isUserOnline: (userId: string) => boolean;
    getConversationRoleMeta: (c: Conversation) => ConversationRoleMeta | null;
    getConversationStatusMeta: (c: Conversation) => ConversationStatusMeta | null;
    getConversationWorkDescriptor: (c: Conversation) => string;
    getConversationProfilePath: (c: Conversation) => string;
    
    // General context
    tx: any;
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    navigate: any;
    isOnline: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
    user,
    profile,
    selectedConversation,
    isContractSession,
    isFreelancerWorkspace,
    accentClasses,
    messages: _messages,
    isLoadingMessages,
    displayMessages,
    pendingQueue,
    typingUsers,
    newMessage,
    setNewMessage,
    isSending,
    replyTarget,
    setReplyTarget,
    highlightedMessageId,
    messagePendingDelete: _messagePendingDelete,
    setMessagePendingDelete: _setMessagePendingDelete,
    selectedFile,
    setSelectedFile,
    isRecording,
    recordingTime: _recordingTime,
    startRecording,
    stopRecording,
    cancelRecording: _cancelRecording,
    audioBlob: _audioBlob,
    startTyping,
    stopTyping,
    handleSendMessage,
    handleDeleteMessage,
    handleReplyToMessage,
    scrollToMessageById,
    showMobileThread,
    setShowMobileThread,
    showConversationsList,
    setShowConversationsList,
    showContractPanel,
    setShowContractPanel,
    setIsContractWorkspaceOpen,
    selectedContractStatus,
    selectedContractUserRole: _selectedContractUserRole,
    selectedContractReviewBanner,
    selectedConversationPolicy,
    showUnknownContractBanner,
    contractActionBar,
    selectedWorkspaceContractId,
    setIsReportModalOpen,
    setIsDeliverModalOpen: _setIsDeliverModalOpen,
    setIsAcceptModalOpen: _setIsAcceptModalOpen,
    setIsDisputeModalOpen: _setIsDisputeModalOpen,
    setIsReviewModalOpen: _setIsReviewModalOpen,
    setIsFundEscrowOpen: _setIsFundEscrowOpen,
    setConversations,
    messagesParentRef,
    messagesEndRef,
    messageInputRef: _messageInputRef,
    fileInputRef: _fileInputRef,
    isUserOnline,
    getConversationRoleMeta,
    getConversationStatusMeta,
    getConversationWorkDescriptor,
    getConversationProfilePath,
    tx,
    showToast,
    navigate,
    isOnline: _isOnline,
}) => {
    const deletedMessageLabel = tx('pages.messages.deletedMessage');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const canAttachInSelectedConversation = selectedConversationPolicy?.canAttachFiles ?? true;
    const canSendInSelectedConversation = selectedConversationPolicy?.canSend ?? true;
    const canSendVoiceInSelectedConversation = selectedConversationPolicy?.canSendVoiceNotes ?? true;
    const canReplyInSelectedConversation = selectedConversationPolicy?.canReply ?? false;

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

    // Reset banner dismissed state when conversation changes
    useEffect(() => {
        setIsBannerDismissed(false);
    }, [selectedConversation?.id]);

    // Handle menu click outside
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

    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const language = profile?.language || 'en';
        return date.toLocaleTimeString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const handleOpenAttachment = useCallback(async (attachment: NonNullable<ThreadMessage['attachments']>[number]) => {
        const sourceUrl = resolveMessageAttachmentUrl(attachment.url);
        if (!sourceUrl) {
            showToast(tx('pages.messages.errors.invalidAttachment'), 'error');
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
                showToast(tx('pages.messages.errors.openAttachment'), 'error');
            }
        }
    }, [showToast, tx]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!canAttachInSelectedConversation) {
                const blockedMessage = translatedBlockedReason
                    || tx('pages.messages.readOnlyPlaceholder', undefined, 'This conversation is right now read-only.');
                showToast(
                    tx(
                        'messages.readOnlyThread',
                        { message: blockedMessage }
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
                showToast(validation.reason || tx('pages.messages.errors.fileUnsupported'), 'error');
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
                    showToast(payloadValidation.reason || tx('pages.messages.errors.fileUnsupported'), 'error');
                    e.target.value = '';
                    return;
                }
            } catch (error) {
                console.error('[Messages] Failed to inspect attachment payload:', error);
                showToast(tx('pages.messages.errors.fileInspectionFailed'), 'error');
                e.target.value = '';
                return;
            }

            setSelectedFile(file);
        }
    };

    return (
        <div className={`${showMobileThread ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#070709] relative`}>
            {selectedConversation ? (
                <div className={`flex h-full min-h-0 flex-1 ${isContractSession ? 'bg-[#070709]' : ''}`}>
                    <div className={`relative flex min-w-0 flex-1 flex-col overflow-hidden ${isContractSession ? 'border-s border-white/[0.04] bg-[#070709]' : ''}`}>
                        <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] ${accentClasses.threadAmbientGlow}`} />
                        <div className="relative z-20 border-b border-white/[0.04] bg-[#070709]/70 px-4 py-2.5 backdrop-blur-md md:px-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowMobileThread(false)}
                                        aria-label={tx('common.back')}
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
                                        title={showConversationsList ? tx('nav.drafts') : tx('nav.messages')}
                                    >
                                        {showConversationsList ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                                    </button>

                                    <div className="relative h-10 w-10 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => navigate(getConversationProfilePath(selectedConversation))}
                                            aria-label={tx('pages.messages.profileAction')}
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
                                                className="absolute -bottom-[3px] -end-[3px] z-10 h-3.5 w-3.5 rounded-full border-[2.5px] border-[#070709] bg-[#14a800] shadow-sm" 
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
                                            <span>{showContractPanel ? tx('contract.files.locked') : tx('contract.workspaceTitle')}</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setIsMenuOpen((prev) => !prev)}
                                        aria-label={tx('common.close')}
                                        className="rounded-lg p-2 text-on-surface-muted transition-colors hover-surface hover:text-on-surface"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {isMenuOpen ? (
                                <div ref={menuRef} className="absolute end-6 top-[72px] z-[70] mt-2 w-48 overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] py-1 shadow-2xl">
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
                                            <span>{tx('pages.messages.profileAction')}</span>
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
                                            <span>{tx('pages.messages.markUnread')}</span>
                                        </span>
                                    </button>

                                    <div className="my-1 border-t border-surface" />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsReportModalOpen(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-[var(--color-status-error)] transition-colors hover:bg-[var(--color-status-error)]/10"
                                    >
                                        <span className="flex items-center gap-3">
                                            <Flag className="w-4 h-4" />
                                            <span>{tx('pages.messages.reportUser')}</span>
                                        </span>
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        {/* Compact premium dismissible alert banner */}
                        {translatedLifecycleBanner
                            && selectedConversationPolicy
                            && selectedConversationPolicy.bannerTone !== 'none'
                            && (selectedConversationPolicy.contractStatus !== 'unknown' || showUnknownContractBanner)
                            && !isBannerDismissed ? (
                            <div className={`mx-4 md:mx-5 mt-3 rounded-xl border px-3 py-2 text-[11px] flex items-center justify-between gap-2.5 backdrop-blur-md ${getLifecycleBannerClassName(selectedConversationPolicy.bannerTone)} shadow-sm`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-current opacity-95" />
                                    <p className="text-zinc-300 leading-normal truncate">
                                        <span className="font-semibold text-white me-1">
                                            {selectedContractStatus === 'revision_requested' ? tx('contract.requestRevision') + ':' : tx('common.warning') + ':'}
                                        </span>
                                        {tx(
                                            'messages.lifecycleBanner',
                                            { message: String(translatedLifecycleBanner) }
                                        )}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsBannerDismissed(true)}
                                    className="p-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all shrink-0"
                                    aria-label={tx('common.close')}
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
                                        <p className="mt-3 text-sm text-on-surface-subtle">{tx('pages.messages.empty.noConversationsTitle')}</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-3 flex items-center gap-3">
                                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
                                        <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                                            {tx('common.today')}
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
                                            
                                            const isConsecutivePrev = prevMessage
                                                && prevMessage.sender_id === message.sender_id
                                                && (new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 5 * 60 * 1000)
                                                && !isContractSystemMessage
                                                && !getMessageContractSystemKind(prevMessage);
                                                
                                            const messageText = getMessageDisplayText(message, deletedMessageLabel);
const replyMetadata = getMessageReplyMetadata(message, tx);
const shouldRenderMessageText = Boolean(messageText) && !shouldHideAttachmentUrlText(message);
                                            const attachments = message.attachments ?? [];
                                            const hasAttachments = attachments.length > 0;
                                            const imageAttachmentCount = attachments.filter((attachment) => isImageAttachment(attachment)).length;
                                            const hasImageAttachment = imageAttachmentCount > 0;
                                            const firstImageAttachmentIndex = attachments.findIndex((attachment) => isImageAttachment(attachment));
                                            const shouldRenderImageCaption = shouldRenderMessageText && hasImageAttachment;
                                            const shouldRenderStandaloneText = shouldRenderMessageText && !shouldRenderImageCaption;

                                            return (
                                                <div key={message.id} className={isConsecutivePrev ? 'mt-[3px]' : 'mt-[14px]'}>
                                                    <div id={`message-${message.id}`} className={`group/message flex w-full ${isContractSystemMessage ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`relative max-w-[82%] md:max-w-[70%] xl:max-w-[62%] flex flex-col ${isContractSystemMessage ? 'items-center' : isOwnMessage ? 'items-end' : 'items-start'}`}>
                                                            {/* Hover action toolbar (Reply & Delete) */}
                                                            {!isContractSystemMessage && (
                                                                <div
                                                                    className={`absolute top-1 z-10 flex items-center gap-1.5 opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 transition-opacity pointer-events-none group-hover/message:pointer-events-auto hidden md:flex ${
                                                                        isOwnMessage ? 'end-full me-2.5' : 'start-full ms-2.5'
                                                                    }`}
                                                                >
                                                                    {!isDeletedMessage(message) && canReplyInSelectedConversation ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleReplyToMessage(message)}
                                                                            title={tx('pages.messages.reply')}
                                                                            className="h-6 w-6 rounded-full border border-white/[0.06] bg-[#070709] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                                                        >
                                                                            <CornerUpLeft className="h-3 w-3" />
                                                                        </button>
                                                                    ) : null}
                                                                    {isOwnMessage && message.status !== 'sending' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteMessage(message)}
                                                                            title={tx('pages.messages.delete')}
                                                                            className="h-6 w-6 rounded-full border border-white/[0.06] bg-[#070709] flex items-center justify-center text-zinc-400 hover:text-[var(--color-status-error)] transition-colors"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Reply target citation preview block */}
                                                            {!isContractSystemMessage && replyMetadata && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => scrollToMessageById(replyMetadata.messageId)}
                                                                    className={`mb-1 flex items-stretch gap-1.5 rounded-lg border text-start text-[10.5px] transition-all max-w-full truncate ${
                                                                        isOwnMessage
                                                                            ? `${accentClasses.ownReplyCard} border-white/[0.06]`
                                                                            : 'bg-white/[0.012] border-white/[0.04] hover:bg-white/[0.02]'
                                                                    }`}
                                                                >
                                                                    <span className={`w-0.5 shrink-0 rounded-s-md ${accentClasses.replyStripe}`} />
                                                                    <div className="px-2 py-1 overflow-hidden min-w-0">
                                                                        <p className="font-semibold text-zinc-300 truncate">{replyMetadata.senderName}</p>
                                                                        <p className="text-zinc-500 truncate text-[10px] mt-0.5">{replyMetadata.previewText}</p>
                                                                    </div>
                                                                </button>
                                                            )}

                                                            {/* Bubble container */}
                                                            <div
                                                                className={`rounded-[18px] border transition-all ${
                                                                    highlightedMessageId === message.id
                                                                        ? `ring-1 ${accentClasses.highlightRing} duration-300`
                                                                        : 'duration-150'
                                                                } ${
                                                                    isContractSystemMessage
                                                                        ? 'border-transparent bg-transparent py-1.5 text-center text-zinc-500 text-[11px] font-medium leading-relaxed max-w-full'
                                                                        : isOwnMessage
                                                                        ? `relative ${accentClasses.ownBubbleBg} text-white border-transparent pt-2.5 pb-3.5 pr-4 pl-4 rounded-xl min-w-[95px] rounded-ee-sm text-[13px]`
                                                                        : `relative border border-white/[0.05] bg-white/[0.015] backdrop-blur-md text-zinc-100 pt-2.5 pb-3.5 pr-4 pl-4 rounded-xl min-w-[95px] rounded-ss-sm text-[13px]`
                                                                }`}
                                                            >
                                                                {isContractSystemMessage ? (
                                                                    (() => {
                                                                        const parsed = resolveContractSystemMessage(messageText || '');
                                                                        const systemMessage = parsed ? resolveSystemMessageText(parsed.text, parsed.kind, tx) : undefined;
                                                                        const eventDescription = systemMessage || (messageText || '');
                                                                        const milestoneIdMatch = (messageText || '').match(/milestone:([a-f0-9-]+)/i);
                                                                        const milestoneId = milestoneIdMatch ? milestoneIdMatch[1] : null;

                                                                        return (
                                                                            <div className="flex flex-col items-center gap-1.5 max-w-full">
                                                                                <div className="flex items-center gap-1.5 text-zinc-500 select-none text-[10.5px]">
                                                                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                                                                    <span>{tx('contract.actions.systemUpdate')}</span>
                                                                                </div>
                                                                                {milestoneId ? (
                                                                                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-full text-zinc-300">
                                                                                        <span>{eventDescription.replace(/milestone:[a-f0-9-]+/i, '').trim()}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-zinc-300 text-center font-normal px-4 max-w-md break-words">
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
                                                                                        aria-label={tx('pages.messages.a11y.openImageAttachment')}
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
                                                                                        aria-label={tx('pages.messages.a11y.openAttachment')}
                                                                                    >
                                                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isOwnMessage ? accentClasses.ownAttachmentIcon : `bg-[var(--color-bg-muted)] ${accentClasses.neutralAttachmentIcon}`}`}>
                                                                                            <FileText className="w-5 h-5" />
                                                                                        </div>

                                                                                        <div className="min-w-0 flex-1 text-start">
                                                                                            <p className="font-semibold text-sm truncate text-on-surface">{att.name || tx('pages.messages.attachmentLabel')}</p>
                                                                                            <p className="text-xs opacity-70 text-on-surface-muted">{fileMetaLabel}</p>
                                                                                        </div>

                                                                                        <Download className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity ms-auto shrink-0 text-on-surface-muted" />
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : null}
                                                                {!isContractSystemMessage && !isDeletedMessage(message) && (
                                                                    <div className={`absolute bottom-1 end-2.5 flex items-center gap-1 text-[9px] select-none text-zinc-500`}>
                                                                        <span>{formatMessageTime(message.created_at)}</span>
                                                                        {isOwnMessage && (
                                                                            message.status === 'sending' ? (
                                                                                <Clock className="h-2.5 w-2.5" />
                                                                            ) : message.status === 'failed' ? (
                                                                                <span className="text-[var(--color-status-error)] font-bold">!</span>
                                                                            ) : (
                                                                                <CheckCheck className={`h-3 w-3 ${message.is_read ? (isFreelancerWorkspace ? 'text-violet-400' : 'text-[var(--color-status-warning)]') : 'text-zinc-500/80'}`} />
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}
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
                                                <div className={`${accentClasses.ownBubbleBg} text-white px-3 py-2 rounded-xl rounded-ee-sm text-[13px]`}>
                                                    <p className="text-sm break-words">{parseReplyMetadataFromContent(pendingMsg.content).bodyText || tx('pages.messages.attachmentLabel')}</p>
                                                    {(pendingMsg.fileName || pendingMsg.audioFileName || pendingMsg.offlineFile || pendingMsg.offlineAudio) ? (
                                                        <div className="mt-2 text-xs italic opacity-90 flex items-center gap-1">
                                                            <Paperclip className="w-3 h-3" />
                                                            <span>{pendingMsg.fileName || pendingMsg.audioFileName || pendingMsg.offlineFileName || pendingMsg.offlineFile?.name || tx('pages.messages.offline.attachmentPending')}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <p className="mt-1 text-[11px] text-zinc-600 flex items-center justify-end gap-1">
                                                    <Clock className="w-3 h-3" /> {tx('pages.messages.offline.statusWaiting')}
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
                                            ? `${selectedConversation.otherUser.full_name} ${tx('pages.messages.typingIndicator.singular')}`
                                            : `${typingUsers.length} ${tx('pages.messages.typingIndicator.plural')}`}
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        <div className="shrink-0 border-t border-white/[0.04] bg-[#070709]/80 px-4 py-2.5 backdrop-blur-md">
                            {contractActionBar ? (
                                <div className="mb-2 flex items-center gap-2 px-1 text-[11px] select-none">
                                    <span className="font-semibold uppercase tracking-[0.08em] text-zinc-500 shrink-0">{tx('contract.actions.systemUpdate')}:</span>
                                    <span className="truncate text-zinc-400 font-normal">{contractActionBar.text}</span>
                                </div>
                            ) : null}
                            {replyTarget ? (
                                <div className="mb-3 rounded-xl border border-[#1f2328] bg-[var(--color-bg-elevated)] px-3 py-2">
                                    <div className="flex items-start gap-2">
                                        <span className={`mt-0.5 h-8 w-1 rounded-full ${accentClasses.replyStripe}`} aria-hidden="true" />
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-semibold ${accentClasses.headerMetaText}`}>{tx('pages.messages.replyingTo')} {replyTarget.senderName}</p>
                                            <p className="text-xs text-zinc-400 truncate">{replyTarget.previewText}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setReplyTarget(null)}
                                            className="rounded-md p-1 text-zinc-500 hover:bg-[var(--color-bg-muted)] hover:text-white transition-colors"
                                            aria-label={tx('pages.messages.cancelReply')}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {!canSendInSelectedConversation ? (
                                <div className="flex items-center gap-3 rounded-[20px] border border-white/[0.07] bg-[var(--color-bg-elevated)] px-4 py-3.5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[#161719] text-[#55534F]">
                                        <Flag className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-medium text-[#8A8880]">
                                            {translatedBlockedReason || tx('pages.messages.readOnlyRightNow', undefined, 'This conversation is read-only right now.')}
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
                                    placeholder={tx('pages.messages.messagePlaceholder')}
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
                            {tx('pages.messages.selectConversationTitle')}
                        </h3>
                        <p className="mt-2 text-[14px] leading-relaxed text-[#8A8880]">
                            {tx('pages.messages.selectConversationDescription')}
                        </p>
                    </div>
                </div>
            )}

            {/* Lightbox image view Modal */}
            {lightboxImageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => setLightboxImageUrl(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={tx('contract.files.preview')}
                >
                    <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <div className="absolute -top-12 -end-12 sm:top-0 sm:end-0 flex items-center gap-2 p-2 z-10">
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
                                aria-label={tx('contract.files.copy')}
                                title={tx('common.download', undefined, 'Download')}
                            >
                                <Download className="h-6 w-6 text-white" />
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setLightboxImageUrl(null)}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                aria-label={tx('common.close')}
                                title={tx('common.close')}
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>

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
        </div>
    );
};
