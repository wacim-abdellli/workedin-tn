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
    Mic,
    Square,
    X,
    FileAudio,
    Image as ImageIcon,
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
    const { user } = useAuth();
    const { showToast } = useToast();
    const { tx, language } = useTranslation();
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
            cancelRecording();
        }

        if (selectedFile) {
            const { url, error } = await uploadMessageAttachment(selectedFile, selectedConversation.id);
            if (error) {
                 showToast(`${tx('pages.messages.errors.fileUpload', undefined, 'Failed to upload file')}: ${error.message}`, 'error');
                 setIsSending(false);
                 return;
            }
            if (url) attachments.push({ name: selectedFile.name, url, type: selectedFile.type, size: selectedFile.size });
            setSelectedFile(null);
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
        }
        setIsSending(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showToast(tx('pages.messages.errors.fileTooLarge', undefined, 'File size must be less than 10 MB'), 'error');
                return;
            }
            setSelectedFile(file);
        }
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

    const ConversationList = () => (
        <div className="h-full flex flex-col border-e border-border">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">{tx('pages.messages.title', undefined, 'Messages')}</h2>
                    <Button variant="primary" size="sm" disabled>
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
                        className="w-full pe-10 ps-4 py-2 border border-border rounded-xl text-sm bg-card text-foreground"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                {(['all', 'unread'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            filter === f
                                ? 'text-primary-600 border-b-2 border-primary-600'
                                : 'text-muted hover:text-foreground'
                        }`}
                    >
                        {f === 'all' ? tx('pages.messages.filters.all', undefined, 'All') : tx('pages.messages.filters.unread', undefined, 'Unread')}
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
                        <EmptyState
                            icon={Send}
                            title={searchQuery ? tx('pages.messages.empty.noMatchingTitle', undefined, 'No matching conversations') : tx('pages.messages.empty.noConversationsTitle', undefined, 'No conversations yet')}
                            description={searchQuery
                                ? tx('pages.messages.empty.noMatchingDescription', undefined, 'Try a different name or clear your search.')
                                : tx('pages.messages.empty.noConversationsDescription', undefined, 'Start by sending a proposal or contacting a freelancer.')}
                        />
                    </div>
                ) : (
                    filteredConversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleSelectConversation(conversation);
                                }
                            }}
                            className={`p-4 border-b border-border cursor-pointer hover:bg-secondary transition-colors ${
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
                                                    : 'text-foreground'
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
                                        {conversation.last_message_text || tx('pages.messages.noMessagesYet', undefined, 'No messages yet')}
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
                    <div className="p-4 border-b border-border bg-card flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMobileThread(false)}
                                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
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
                                    @{selectedConversation.otherUser.username || tx('pages.messages.userFallback', undefined, 'user')}
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                        {isLoadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted">{tx('pages.messages.emptyThread', undefined, 'No messages yet. Start the conversation!')}</p>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex rtl:flex-row-reverse ${
                                        message.sender_id === user?.id
                                            ? 'justify-end rtl:justify-start'
                                            : 'justify-start rtl:justify-end'
                                    }`}
                                >
                                    <div
                                        className={`max-w-[70%] ${
                                            message.sender_id === user?.id
                                                ? 'self-end rtl:self-start bg-primary-600 text-white rounded-2xl rounded-se-md'
                                                : 'self-start rtl:self-end bg-card text-foreground rounded-2xl rounded-ss-md shadow-sm'
                                         } px-4 py-3`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                        {message.attachments && message.attachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {message.attachments.map((att, i) => {
                                                    const isImage = att.type?.startsWith('image/');
                                                    const isAudio = att.type?.startsWith('audio/');
                                                    
                                                    if (isImage) {
                                                        return (
                                                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block max-w-[250px] sm:max-w-xs transition-opacity hover:opacity-90">
                                                                <img src={att.url} alt={att.name} className="w-full h-auto rounded-lg object-cover" />
                                                            </a>
                                                        );
                                                    }
                                                    
                                                    if (isAudio) {
                                                        return (
                                                            <audio key={i} controls src={att.url} className="w-full max-w-[250px] h-11" />
                                                        );
                                                    }

                                                    return (
                                                        <a
                                                            key={i}
                                                            href={att.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-2 p-2.5 rounded-xl transition-colors ${
                                                                message.sender_id === user?.id
                                                                    ? 'bg-primary-700 hover:bg-primary-800 text-white'
                                                                    : 'bg-secondary hover:bg-secondary-hover text-foreground'
                                                            }`}
                                                        >
                                                            <FileText className="w-5 h-5 shrink-0" />
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="text-sm font-medium truncate">{att.name}</span>
                                                            </div>
                                                        </a>
                                                    );
                                                })}
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

                    {/* Previews */}
                    {(selectedFile || audioBlob || isRecording) && (
                        <div className="p-3 border-t border-border bg-card">
                            {isRecording ? (
                                <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-100 dark:border-red-900/30">
                                    <div className="flex items-center gap-3 text-red-500">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-sm font-medium">{tx('pages.messages.recording', undefined, 'Recording...')} 00:{recordingTime.toString().padStart(2, '0')}</span>
                                    </div>
                                    <button onClick={stopRecording} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                        <Square className="w-4 h-4 fill-current" />
                                    </button>
                                </div>
                            ) : audioBlob ? (
                                <div className="flex items-center gap-3 bg-secondary rounded-xl p-3 border border-border">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                        <FileAudio className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate">{tx('pages.messages.voiceMemo', undefined, 'Voice memo')}</span>
                                        <span className="text-xs text-muted">00:{recordingTime.toString().padStart(2, '0')}</span>
                                    </div>
                                    <button onClick={cancelRecording} className="p-2 text-muted hover:text-foreground hover:bg-background rounded-lg transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : selectedFile ? (
                                <div className="flex items-center gap-3 bg-secondary rounded-xl p-3 border border-border">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                        {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" /> : <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                                        <span className="text-xs text-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <button onClick={() => setSelectedFile(null)} className="p-2 text-muted hover:text-foreground hover:bg-background rounded-lg transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 sm:p-4 border-t border-border bg-card">
                        <div className="flex flex-wrap sm:flex-nowrap items-end gap-2 sm:gap-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*,application/pdf,.doc,.docx"
                            />
                            
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                {!isRecording && !audioBlob && (
                                    <button 
                                        className="p-2.5 sm:p-3 hover:bg-secondary rounded-xl text-muted hover:text-foreground transition-colors" 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSending || !!selectedFile}
                                        title={tx('pages.messages.attachFile', undefined, 'Attach file')}
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                )}
                                
                                {!selectedFile && !audioBlob && (
                                    <button 
                                        className={`p-2.5 sm:p-3 rounded-xl transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-secondary text-muted hover:text-foreground'}`}
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={isSending}
                                        title={isRecording ? tx('pages.messages.stopRecording', undefined, 'Stop recording') : tx('pages.messages.recordVoice', undefined, 'Record voice message')}
                                    >
                                        {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 bg-secondary rounded-xl py-1 px-2 border border-border focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-500 transition-all flex items-center min-h-[46px] sm:min-h-[50px]">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder={tx('pages.messages.messagePlaceholder', undefined, 'Write your message...')}
                                    disabled={isSending || isRecording || !!selectedFile || !!audioBlob}
                                    className="w-full bg-transparent border-none focus:ring-0 text-foreground text-sm py-2 px-2 disabled:opacity-50"
                                />
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleSendMessage}
                                disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || isSending || isRecording}
                                isLoading={isSending}
                                className="shrink-0 h-[46px] w-[46px] sm:h-[50px] sm:w-[50px] rounded-xl p-0 flex items-center justify-center shadow-sm"
                            >
                                <Send className="w-5 h-5 rtl:rotate-180" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-full flex items-center justify-center bg-background border-s border-border">
                    <EmptyState
                        icon={Send}
                        title={tx('pages.messages.selectConversationTitle', undefined, 'Select a conversation')}
                        description={tx('pages.messages.selectConversationDescription', undefined, 'Choose a conversation from the list to start messaging')}
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
        <div className="h-full border-s border-border p-6 overflow-y-auto">
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
                        <p className="text-muted">@{selectedConversation.otherUser.username || tx('pages.messages.userFallback', undefined, 'user')}</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/freelancer/${selectedConversation.otherUser.id}`)}
                        >
                            <User className="w-4 h-4 ms-1" />
                            {tx('pages.messages.profileAction', undefined, 'Profile')}
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            <Briefcase className="w-4 h-4 ms-1" />
                            {tx('pages.messages.contractsAction', undefined, 'Contracts')}
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-border space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 text-muted hover:bg-secondary rounded-xl transition-colors" disabled>
                            <Archive className="w-5 h-5" />
                            <span>{tx('pages.messages.archiveConversation', undefined, 'Archive conversation')}</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" disabled>
                            <Trash2 className="w-5 h-5" />
                            <span>{tx('pages.messages.deleteConversation', undefined, 'Delete conversation')}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-muted">{tx('pages.messages.selectConversationDetails', undefined, 'Select a conversation to view details')}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-card">
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

