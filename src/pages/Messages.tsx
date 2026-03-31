import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Search,
    Send,
    Paperclip,
    MoreVertical,
    Phone,
    Video,
    Archive,
    Trash2,
    ChevronLeft,
    Plus,
    FileText,
    User,
    Briefcase,
    Loader2,
    Mic,
    Square,
    X,
    FileAudio,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
    getConversations,
    getMessages,
    sendMessage,
    uploadMessageAttachment,
    markConversationRead,
    subscribeToConversation,
    subscribeToConversations,
    type Conversation,
    type Message,
} from '../services/messages';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTranslation } from '../i18n';

export default function Messages() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const { tx, language } = useTranslation();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    const conversationsParentRef = useRef<HTMLDivElement>(null);
    const messagesParentRef = useRef<HTMLDivElement>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
    const [showMobileThread, setShowMobileThread] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording, audioBlob } = useAudioRecorder();

    const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
    const messagesChannelRef = useRef<RealtimeChannel | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!selectedConversation) return;

        const frame = window.requestAnimationFrame(() => {
            messageInputRef.current?.focus();
        });

        return () => window.cancelAnimationFrame(frame);
    }, [selectedConversation?.id, isSending]);

    const handleSelectConversation = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setShowMobileThread(true);
        
        // Load draft for this conversation
        const draft = localStorage.getItem(`draft_${conversation.id}`);
        setNewMessage(draft || '');

        // Mark as read and update UI
        if (user && conversation.unread_count > 0) {
            await markConversationRead(conversation.id, user.id);
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
                )
            );
        }
    };

    // Auto-select conversation from URL param ?conversation=ID
    useEffect(() => {
        const targetId = searchParams.get('conversation');
        if (!targetId || conversations.length === 0) return;
        const match = conversations.find(c => c.id === targetId);
        if (match) {
            handleSelectConversation(match);
            // Clean the URL param without re-navigating
            navigate('/messages', { replace: true });
        }
    }, [searchParams, conversations]);

    // Load conversations
    useEffect(() => {
        if (!user) return;

        const loadConversations = async (currentPage: number, append: boolean = false) => {
            if (!append && conversations.length === 0) setIsLoadingConversations(true);
            if (append) setIsLoadingMore(true);

            const limit = 20;
            const { data, count, error } = await getConversations(user.id, currentPage, limit);

            if (error) {
                showToast(error.message, 'error');
            } else if (data) {
                if (append) {
                    setConversations(prev => {
                        const existingIds = new Set(prev.map(c => c.id));
                        const uniqueNew = data.filter(c => !existingIds.has(c.id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setConversations(data);
                }
                setHasMoreConversations((currentPage + 1) * limit < (count || 0));
            }

            setIsLoadingConversations(false);
            setIsLoadingMore(false);
        };

        loadConversations(page, page > 0);

        // Only setup subscription on initial mount/page 0 to avoid duplicates
        if (page === 0) {
            conversationsChannelRef.current = subscribeToConversations(user.id, (payload) => {
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
                            return updated.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
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
    }, [user?.id, page]);

    // Load messages when conversation is selected
    useEffect(() => {
        if (!selectedConversation || !user) return;

        const loadMessages = async () => {
            // If we are switching conversations, set loading to true
            setIsLoadingMessages(true);
            const { data, error } = await getMessages(selectedConversation.id);

            if (error) {
                showToast(error.message, 'error');
            } else if (data) {
                setMessages(data);
            }

            setIsLoadingMessages(false);

            // Mark conversation as read
            await markConversationRead(selectedConversation.id, user.id);
        };

        loadMessages();

        // Subscribe to new messages in this conversation
        messagesChannelRef.current = subscribeToConversation(
            selectedConversation.id,
            (payload) => {
                const newMsg = payload.new as Message;
                
                setMessages((prev) => {
                    // Deduplicate: Don't add if message with this ID already exists
                    if (prev.some(m => m.id === newMsg.id)) {
                        return prev;
                    }
                    return [...prev, newMsg];
                });

                // Update conversation in list - move to top and update last message
                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === selectedConversation.id
                            ? {
                                  ...conv,
                                  last_message_text: newMsg.content,
                                  last_message_at: newMsg.created_at,
                                  // Increment unread count if we receive a message from the other user
                                  unread_count: newMsg.sender_id !== user?.id ? (conv.unread_count || 0) + 1 : conv.unread_count,
                              }
                            : conv
                    )
                    // Sort to keep selected conversation at top
                    .sort((a, b) => {
                        if (a.id === selectedConversation.id) return -1;
                        if (b.id === selectedConversation.id) return 1;
                        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
                    })
                );
            }
        );

        return () => {
            if (messagesChannelRef.current) {
                messagesChannelRef.current.unsubscribe();
            }
        };
    }, [selectedConversation?.id, user?.id]);

    // Save draft when message changes
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

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile && !audioBlob) || !selectedConversation || !user) return;

        setIsSending(true);

        const attachments = [];

        if (audioBlob) {
            const fileName = `voice_memo_${Date.now()}.webm`;
            const audioFile = new File([audioBlob], fileName, { type: audioBlob.type || 'audio/webm' });
            const { url, error } = await uploadMessageAttachment(audioFile, selectedConversation.id);
            if (error) {
                 showToast(`${tx('pages.messages.errors.audioUpload', undefined, 'Failed to upload audio')}: ${error.message}`, 'error');
                 setIsSending(false);
                 return;
            }
            if (url) attachments.push({ name: tx('pages.messages.voiceMemo', undefined, 'Voice memo'), url, type: audioFile.type, size: audioFile.size });
        }

        if (selectedFile) {
            const { url, error } = await uploadMessageAttachment(selectedFile, selectedConversation.id);
            if (error) {
                 showToast(`${tx('pages.messages.errors.fileUpload', undefined, 'Failed to upload file')}: ${error.message}`, 'error');
                  setIsSending(false);
                  return;
             }
             if (url) attachments.push({ name: selectedFile.name, url, type: selectedFile.type, size: selectedFile.size });
        }

        const { data, error } = await sendMessage({
            conversationId: selectedConversation.id,
            senderId: user.id,
            receiverId: selectedConversation.otherUser.id,
            content: newMessage.trim(),
            contractId: selectedConversation.contract_id,
            attachments: attachments.length > 0 ? attachments : undefined
        });

        if (error) {
            showToast(error.message, 'error');
        } else if (data) {
            setNewMessage('');
            if (audioBlob) {
                cancelRecording();
            }
            if (selectedFile) {
                setSelectedFile(null);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
            messageInputRef.current?.focus();
        }
        setIsSending(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showToast(tx('pages.messages.errors.fileTooLarge', undefined, 'File size must be less than 10 MB'), 'error');
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
        }
    };

    const filteredConversations = conversations.filter((c) => {
        if (filter === 'unread' && c.unread_count === 0) return false;
        if (searchQuery && !c.otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
            return false;
        return true;
    });

    const conversationsVirtualizer = useVirtualizer({
        count: filteredConversations.length,
        getScrollElement: () => conversationsParentRef.current,
        estimateSize: () => 80,
        overscan: 5,
    });

    const messagesVirtualizer = useVirtualizer({
        count: messages.length,
        getScrollElement: () => messagesParentRef.current,
        estimateSize: () => 60,
        overscan: 10,
    });

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

    const renderConversationList = () => (
        <div className="flex h-full flex-col border-e border-border bg-surface backdrop-blur-xl">
            {/* Header */}
            <div className="border-b border-border px-4 py-5">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand/80">Inbox</p>
                        <h2 className="text-[1.9rem] font-bold tracking-tight text-foreground">{tx('pages.messages.title', undefined, 'Messages')}</h2>
                    </div>
                    <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(profile?.user_type === 'client' ? '/find-freelancers' : '/jobs')}
                        title={tx('pages.messages.newConversation', undefined, 'Start a new conversation')}
                        className="h-11 w-11 rounded-full border border-brand/20 p-0 shadow-lg hover:shadow-xl text-white transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tx('pages.messages.searchPlaceholder', undefined, 'Search conversations...')}
                        className="w-full rounded-xl border border-border bg-input/bg py-3 pe-10 ps-4 text-sm text-foreground shadow-sm focus:border-brand focus:ring-1 focus:ring-brand/50 placeholder:text-muted-foreground transition-colors"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border px-4 py-3">
                {(['all', 'unread'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-3 text-sm font-medium transition-all rounded-lg ${
                            filter === f
                                ? 'bg-brand/15 text-brand shadow-sm border border-brand/20'
                                : 'text-muted hover:bg-surface hover:text-foreground border border-transparent'
                        }`}
                    >
                        {f === 'all' ? tx('pages.messages.filters.all', undefined, 'All') : tx('pages.messages.filters.unread', undefined, 'Unread')}
                    </button>
                ))}
            </div>

            {/* Conversation List */}
            <div ref={conversationsParentRef} className="flex-1 overflow-y-auto px-3 py-4 relative">
                {isLoadingConversations ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-brand" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                        <EmptyState
                            icon={Send}
                            title={searchQuery ? tx('pages.messages.empty.noMatchingTitle', undefined, 'No matching conversations') : tx('pages.messages.empty.noConversationsTitle', undefined, 'No conversations yet')}
                            description={searchQuery
                                ? tx('pages.messages.empty.noMatchingDescription', undefined, 'Try a different name or clear your search.')
                                : tx('pages.messages.empty.noConversationsDescription', undefined, 'Start by sending a proposal or contacting a freelancer.')}
                        />
                    </div>
                ) : (
                    <div style={{ height: `${conversationsVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        {conversationsVirtualizer.getVirtualItems().map((virtualRow) => {
                            const conversation = filteredConversations[virtualRow.index];
                            return (
                        <div
                            key={conversation.id}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                                paddingBottom: '12px'
                            }}
                        >
                        <div
                            onClick={() => handleSelectConversation(conversation)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleSelectConversation(conversation);
                                }
                            }}
                            className={`group relative h-full overflow-hidden rounded-2xl border p-4 transition-all duration-300 cursor-pointer animate-in fade-in ${
                                 selectedConversation?.id === conversation.id
                                    ? 'border-brand/30 bg-brand/10 shadow-md'
                                    : 'border-border bg-card hover:border-border-strong hover:bg-surface hover:shadow-sm'
                             }`}
                        >
                            {selectedConversation?.id === conversation.id ? <div className="absolute inset-y-4 start-0 w-1 rounded-full bg-brand" /> : null}
                            <div className="flex items-start gap-3">
                                <div className="relative">
                                    {conversation.otherUser.avatar_url ? (
                                        <img
                                            src={conversation.otherUser.avatar_url}
                                            alt={conversation.otherUser.full_name}
                                            className="h-12 w-12 rounded-full object-cover ring-2 ring-card"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-mid font-bold text-brand-text shadow-sm">
                                            {conversation.otherUser.full_name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3
                                            className={`font-medium truncate ${
                                                conversation.unread_count > 0
                                                    ? 'text-foreground font-bold'
                                                    : 'text-foreground'
                                            }`}
                                        >
                                            {conversation.otherUser.full_name}
                                        </h3>
                                        <span className="text-xs text-muted transition-colors group-hover:text-foreground/70">
                                            {formatTime(conversation.last_message_at)}
                                        </span>
                                    </div>
                                    <p
                                        className={`text-sm truncate ${
                                            conversation.unread_count > 0
                                                ? 'text-foreground'
                                                : 'text-muted'
                                        }`}
                                    >
                                        {conversation.last_message_text || tx('pages.messages.noMessagesYet', undefined, 'No messages yet')}
                                    </p>
                                    <div className="flex items-center justify-between mt-3 gap-2">
                                        <div className="flex items-center gap-2 flex-1">
                                            {conversation.unread_count > 0 && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs text-brand-text shadow-sm font-semibold shrink-0">
                                                    {conversation.unread_count}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground truncate">
                                                {conversation.message_count ? `${conversation.message_count} ${conversation.message_count === 1 ? tx('pages.messages.singleMessage', undefined, 'message') : tx('pages.messages.multipleMessages', undefined, 'messages')}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                            );
                        })}
                    </div>
                )}
                
                {hasMoreConversations && filteredConversations.length > 0 && !searchQuery && (
                    <div className="pt-4 pb-2 flex justify-center">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPage(p => p + 1)}
                            disabled={isLoadingMore}
                        >
                            {isLoadingMore ? tx('common.loading', undefined, 'Loading...') : tx('pages.messages.loadMore', undefined, 'Load more conversations')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderMessageThread = () => (
        <div className="flex flex-col h-full bg-background">
            {selectedConversation ? (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMobileThread(false)}
                                className="lg:hidden p-2 hover:bg-surface rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {selectedConversation.otherUser.avatar_url ? (
                                <img
                                    src={selectedConversation.otherUser.avatar_url}
                                    alt={selectedConversation.otherUser.full_name}
                                    className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
                                />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-brand-mid flex items-center justify-center font-bold text-brand-text">
                                    {selectedConversation.otherUser.full_name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-foreground">{selectedConversation.otherUser.full_name}</h3>
                                <p className="text-sm text-muted-foreground">@{selectedConversation.otherUser.username || 'user'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-surface rounded-lg transition-colors" disabled>
                                <Phone className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <button className="p-2 hover:bg-surface rounded-lg transition-colors" disabled>
                                <Video className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <button className="p-2 hover:bg-surface rounded-lg transition-colors" disabled>
                                <MoreVertical className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div ref={messagesParentRef} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col relative">
                        {isLoadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-brand" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Send className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                                    <p className="text-muted-foreground">{tx('pages.messages.emptyThread', undefined, 'No messages yet. Start the conversation!')}</p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: `${messagesVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                                {messagesVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const message = messages[virtualRow.index];
                                    return (
                                        <div
                                            key={message.id}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                                paddingBottom: '16px'
                                            }}
                                        >
                                <div
                                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} rtl:flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300 w-full`}
                                >
                                    <div className={`max-w-xs lg:max-w-md ${message.sender_id === user?.id ? '' : 'mr-2'}`}>
                                        <div
                                            className={`rounded-2xl px-4 py-2 transition-all duration-200 ${
                                                message.sender_id === user?.id
                                                    ? 'bg-brand text-brand-text rounded-br-none shadow-md hover:shadow-lg'
                                                    : 'bg-surface text-foreground rounded-bl-none border border-border shadow-sm hover:shadow-md'
                                            }`}
                                        >
                                            <p className="text-sm break-words">{message.content}</p>
                                            {message.attachments && message.attachments.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    {message.attachments.map((att, i) => {
                                                        const isImage = att.type?.startsWith('image/');
                                                        if (isImage) {
                                                            return (
                                                                <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                                                                    <img src={att.url} alt={att.name} className="w-full rounded-lg" />
                                                                </a>
                                                            );
                                                        }
                                                        const isAudio = att.type?.startsWith('audio/');
                                                        if (isAudio) {
                                                            return <audio key={i} controls src={att.url} className="w-full max-w-xs" />;
                                                        }
                                                        return (
                                                            <a
                                                                key={i}
                                                                href={att.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/5"
                                                            >
                                                                <FileText className="w-4 h-4 shrink-0" />
                                                                <span className="text-xs truncate">{att.name}</span>
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-end' : 'text-start'} text-muted-foreground`}>
                                            {formatMessageTime(message.created_at)}
                                            {message.sender_id === user?.id && (message.is_read ? ' ✓✓' : ' ✓')}
                                        </p>
                                    </div>
                                </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-border bg-card px-6 py-4">
                        {(selectedFile || audioBlob || isRecording) && (
                            <div className="mb-3">
                                {isRecording ? (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-sm text-red-600 dark:text-red-400">Recording: {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                        <button onClick={stopRecording} className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors">
                                            <Square className="w-4 h-4 fill-red-600 dark:fill-red-400" />
                                        </button>
                                    </div>
                                ) : audioBlob ? (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border">
                                        <FileAudio className="w-5 h-5 text-brand" />
                                        <span className="text-sm flex-1">{tx('pages.messages.voiceMemo', undefined, 'Voice memo')} • {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                        <button onClick={cancelRecording} className="p-1 hover:bg-background rounded transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : selectedFile ? (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border">
                                        <FileText className="w-5 h-5 text-brand" />
                                        <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                                        <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-background rounded transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        )}
                        
                        <div className="flex items-end gap-2">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf,.doc,.docx" />
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSending || !!selectedFile}
                                className="p-2 hover:bg-surface rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isSending}
                                className={`p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-surface text-muted-foreground hover:text-foreground'}`}
                            >
                                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                            </button>
                            
                            <input
                                type="text"
                                ref={messageInputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        void handleSendMessage();
                                    }
                                }}
                                placeholder={tx('pages.messages.messagePlaceholder', undefined, 'Write your message...')}
                                disabled={isSending || isRecording || !!selectedFile || !!audioBlob}
                                className="flex-1 bg-surface border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                            />
                            
                            <Button
                                variant="primary"
                                onClick={handleSendMessage}
                                disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || isSending || isRecording}
                                isLoading={isSending}
                                className="p-2.5 rounded-lg text-brand-text hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <Send className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">{tx('pages.messages.selectConversationTitle', undefined, 'Select a conversation')}</h3>
                        <p className="text-muted-foreground">{tx('pages.messages.selectConversationDescription', undefined, 'Choose a conversation to start messaging')}</p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderContactDetails = () => (
        <div className="h-full overflow-y-auto border-s border-border bg-background/95 backdrop-blur-sm p-6">
            {selectedConversation ? (
                <div className="space-y-6">
                    {/* Profile */}
                    <div className="rounded-2xl border border-border bg-card px-5 py-7 text-center shadow-sm">
                        {selectedConversation.otherUser.avatar_url ? (
                            <img
                                src={selectedConversation.otherUser.avatar_url}
                                alt={selectedConversation.otherUser.full_name}
                                className="mx-auto mb-4 h-24 w-24 rounded-full object-cover ring-2 ring-border"
                            />
                        ) : (
                            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-mid text-3xl font-bold text-brand-text shadow-sm">
                                {selectedConversation.otherUser.full_name.charAt(0)}
                            </div>
                        )}
                        <h3 className="font-bold text-lg text-foreground">
                            {selectedConversation.otherUser.full_name}
                        </h3>
                        <p className="text-muted-foreground">@{selectedConversation.otherUser.username || tx('pages.messages.userFallback', undefined, 'user')}</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/freelancer/${selectedConversation.otherUser.id}`)}
                            className="border-border text-foreground hover:bg-surface hover:border-border transition-colors"
                        >
                            <User className="w-4 h-4 ms-1" />
                            {tx('pages.messages.profileAction', undefined, 'Profile')}
                        </Button>
                        <Button variant="outline" size="sm" disabled className="border-border text-muted-foreground opacity-50">
                            <Briefcase className="w-4 h-4 ms-1" />
                            {tx('pages.messages.contractsAction', undefined, 'Contracts')}
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
                        <button className="flex w-full items-center gap-3 rounded-lg p-3 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" disabled>
                            <Archive className="w-5 h-5" />
                            <span>{tx('pages.messages.archiveConversation', undefined, 'Archive conversation')}</span>
                        </button>
                        <button className="flex w-full items-center gap-3 rounded-lg p-3 text-destructive transition-colors hover:bg-destructive/10" disabled>
                            <Trash2 className="w-5 h-5" />
                            <span>{tx('pages.messages.deleteConversation', undefined, 'Delete conversation')}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">{tx('pages.messages.selectConversationDetails', undefined, 'Select a conversation to view details')}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO {...SEO_CONFIG.messages} url="/messages" noIndex />
            <Header />

            <div className="h-[calc(100vh-64px)] flex overflow-hidden">
                {/* Sidebar - Conversations List */}
                <div className={`w-80 shrink-0 border-e border-border flex flex-col bg-background hidden lg:flex ${showMobileThread ? 'hidden' : ''}`}>
                    {renderConversationList()}
                </div>

                {/* Mobile Sidebar */}
                <div className={`w-full border-e border-border flex flex-col bg-background lg:hidden ${showMobileThread ? 'hidden' : 'flex'}`}>
                    {renderConversationList()}
                </div>

                {/* Main Message Area */}
                <div className={`flex-1 flex flex-col overflow-hidden ${showMobileThread ? 'block' : 'hidden lg:flex'}`}>
                    {renderMessageThread()}
                </div>

                {/* Right Sidebar - Contact Details */}
                <div className="w-80 shrink-0 border-s border-border bg-background hidden xl:flex flex-col">
                    {renderContactDetails()}
                </div>
            </div>
        </div>
    );
}
