import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Send,
    Paperclip,
    MoreVertical,
    Phone,
    Video,
    Archive,
    Trash2,
    Check,
    CheckCheck,
    ChevronLeft,
    Plus,
    FileText,
    User,
    Briefcase,
    Loader2,
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
    markConversationRead,
    subscribeToConversation,
    subscribeToConversations,
    type Conversation,
    type Message,
} from '../services/messages';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function Messages() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
    const messagesChannelRef = useRef<RealtimeChannel | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load conversations on mount
    useEffect(() => {
        if (!user) return;

        const loadConversations = async () => {
            setIsLoadingConversations(true);
            const { data, error } = await getConversations(user.id);

            if (error) {
                showToast(error.message, 'error');
            } else if (data) {
                setConversations(data);
            }

            setIsLoadingConversations(false);
        };

        loadConversations();

        // Subscribe to conversation updates
        conversationsChannelRef.current = subscribeToConversations(user.id, () => {
            // Reload conversations when there's an update
            loadConversations();
        });

        return () => {
            if (conversationsChannelRef.current) {
                conversationsChannelRef.current.unsubscribe();
            }
        };
    }, [user]);

    // Load messages when conversation is selected
    useEffect(() => {
        if (!selectedConversation || !user) return;

        const loadMessages = async () => {
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
                setMessages((prev) => [...prev, newMsg]);

                // Update conversation in list
                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === selectedConversation.id
                            ? {
                                  ...conv,
                                  last_message_text: newMsg.content,
                                  last_message_at: newMsg.created_at,
                              }
                            : conv
                    )
                );
            }
        );

        return () => {
            if (messagesChannelRef.current) {
                messagesChannelRef.current.unsubscribe();
            }
        };
    }, [selectedConversation, user]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !user) return;

        setIsSending(true);

        const { data, error } = await sendMessage({
            conversationId: selectedConversation.id,
            senderId: user.id,
            receiverId: selectedConversation.otherUser.id,
            content: newMessage.trim(),
            contractId: selectedConversation.contract_id,
        });

        if (error) {
            showToast(error.message, 'error');
        } else if (data) {
            // Message will be added via realtime subscription
            setNewMessage('');
        }

        setIsSending(false);
    };

    const handleSelectConversation = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setShowMobileThread(true);

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

    const filteredConversations = conversations.filter((c) => {
        if (filter === 'unread' && c.unread_count === 0) return false;
        if (filter === 'starred') return false; // Starred not implemented yet
        if (searchQuery && !c.otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
            return false;
        return true;
    });

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;

        return date.toLocaleDateString('ar-TN');
    };

    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' });
    };

    const ConversationList = () => (
        <div className="h-full flex flex-col border-l border-gray-200 dark:border-dark-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">الرسائل</h2>
                    <Button variant="primary" size="sm" disabled>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث في المحادثات..."
                        className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-dark-700 rounded-xl text-sm bg-white dark:bg-dark-800 text-foreground"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-dark-700">
                {(['all', 'unread', 'starred'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            filter === f
                                ? 'text-primary-600 border-b-2 border-primary-600'
                                : 'text-muted hover:text-foreground'
                        }`}
                    >
                        {f === 'all' ? 'الكل' : f === 'unread' ? 'غير مقروءة' : 'المميزة'}
                    </button>
                ))}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {isLoadingConversations ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                        <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-muted text-sm">
                            {searchQuery
                                ? 'لا توجد محادثات مطابقة'
                                : 'لا توجد محادثات بعد. ابدأ بإرسال عرض أو التواصل مع موظف.'}
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            className={`p-4 border-b border-gray-100 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors ${
                                selectedConversation?.id === conversation.id
                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                    : ''
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="relative">
                                    {conversation.otherUser.avatar_url ? (
                                        <img
                                            src={conversation.otherUser.avatar_url}
                                            alt={conversation.otherUser.full_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
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
                                                    : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            {conversation.otherUser.full_name}
                                        </h3>
                                        <span className="text-xs text-muted">
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
                                        {conversation.last_message_text || 'لا توجد رسائل بعد'}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        {conversation.unread_count > 0 && (
                                            <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                                {conversation.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const MessageThread = () => (
        <div className="h-full flex flex-col">
            {selectedConversation ? (
                <>
                    {/* Thread Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMobileThread(false)}
                                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {selectedConversation.otherUser.avatar_url ? (
                                <img
                                    src={selectedConversation.otherUser.avatar_url}
                                    alt={selectedConversation.otherUser.full_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
                                    {selectedConversation.otherUser.full_name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-foreground">
                                    {selectedConversation.otherUser.full_name}
                                </h3>
                                <p className="text-xs text-muted">
                                    @{selectedConversation.otherUser.username || 'user'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-muted" disabled>
                                <Phone className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-muted" disabled>
                                <Video className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-muted" disabled>
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-950">
                        {isLoadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted">لا توجد رسائل بعد. ابدأ المحادثة!</p>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${
                                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    <div
                                        className={`max-w-[70%] ${
                                            message.sender_id === user?.id
                                                ? 'bg-primary-600 text-white rounded-2xl rounded-tr-md'
                                                : 'bg-white dark:bg-dark-800 text-foreground rounded-2xl rounded-tl-md shadow-sm'
                                        } px-4 py-3`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                        {message.attachments && message.attachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {message.attachments.map((att, i) => (
                                                    <div
                                                        key={i}
                                                        className={`flex items-center gap-2 p-2 rounded-lg ${
                                                            message.sender_id === user?.id
                                                                ? 'bg-primary-700'
                                                                : 'bg-gray-100 dark:bg-dark-700'
                                                        }`}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        <span className="text-sm flex-1">{att.name}</span>
                                                        <span className="text-xs opacity-70">{att.size}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div
                                            className={`flex items-center justify-end gap-1 mt-1 ${
                                                message.sender_id === user?.id
                                                    ? 'text-primary-100'
                                                    : 'text-muted'
                                            }`}
                                        >
                                            <span className="text-xs">{formatMessageTime(message.created_at)}</span>
                                            {message.sender_id === user?.id &&
                                                (message.is_read ? (
                                                    <CheckCheck className="w-3 h-3" />
                                                ) : (
                                                    <Check className="w-3 h-3" />
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900">
                        <div className="flex items-center gap-3">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-muted" disabled>
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="اكتب رسالتك..."
                                disabled={isSending}
                                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-foreground focus:ring-2 focus:ring-primary-100 focus:border-primary-500 disabled:opacity-50"
                            />
                            <Button
                                variant="primary"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || isSending}
                                isLoading={isSending}
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-dark-900 border-l border-gray-200 dark:border-dark-700">
                    <EmptyState
                        icon={Send}
                        title="اختر محادثة"
                        description="اختر محادثة من القائمة للبدء في المراسلة"
                        illustration={
                            <div className="w-32 h-32 bg-primary-50 dark:bg-primary-900/10 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                <Send className="w-12 h-12 text-primary-500" />
                            </div>
                        }
                    />
                </div>
            )}
        </div>
    );

    const ContactDetails = () => (
        <div className="h-full border-r border-gray-200 dark:border-dark-700 p-6 overflow-y-auto">
            {selectedConversation ? (
                <div className="space-y-6">
                    {/* Profile */}
                    <div className="text-center">
                        {selectedConversation.otherUser.avatar_url ? (
                            <img
                                src={selectedConversation.otherUser.avatar_url}
                                alt={selectedConversation.otherUser.full_name}
                                className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                                {selectedConversation.otherUser.full_name.charAt(0)}
                            </div>
                        )}
                        <h3 className="font-bold text-lg text-foreground">
                            {selectedConversation.otherUser.full_name}
                        </h3>
                        <p className="text-muted">@{selectedConversation.otherUser.username || 'user'}</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/freelancer/${selectedConversation.otherUser.id}`)}
                        >
                            <User className="w-4 h-4 ml-1" />
                            البروفايل
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            <Briefcase className="w-4 h-4 ml-1" />
                            العقود
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200 dark:border-dark-700 space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 text-muted hover:bg-gray-50 dark:hover:bg-dark-800 rounded-xl transition-colors" disabled>
                            <Archive className="w-5 h-5" />
                            <span>أرشفة المحادثة</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" disabled>
                            <Trash2 className="w-5 h-5" />
                            <span>حذف المحادثة</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-muted">اختر محادثة لعرض التفاصيل</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-dark-900">
            <SEO {...SEO_CONFIG.messages} url="/messages" noIndex />
            <Header />

            <div className="h-[calc(100vh-64px)] flex">
                {/* Conversation List - Desktop */}
                <div className={`w-80 shrink-0 hidden lg:block`}>
                    <ConversationList />
                </div>

                {/* Conversation List - Mobile */}
                <div className={`w-full lg:hidden ${showMobileThread ? 'hidden' : 'block'}`}>
                    <ConversationList />
                </div>

                {/* Message Thread */}
                <div className={`flex-1 ${showMobileThread ? 'block' : 'hidden lg:block'}`}>
                    <MessageThread />
                </div>

                {/* Contact Details - Desktop only */}
                <div className="w-80 shrink-0 hidden xl:block">
                    <ContactDetails />
                </div>
            </div>
        </div>
    );
}
