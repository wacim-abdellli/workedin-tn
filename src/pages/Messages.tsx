import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Search,
    Send,
    Paperclip,
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
    WifiOff,
    Clock,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import EmptyState from '../components/ui/EmptyState';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
    getConversations,
    getMessages,
    deleteMessage,
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
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useReadReceipts } from '../hooks/useReadReceipts';
import { useTranslation } from '../i18n';
import ErrorBoundary from '../components/ErrorBoundary';

// Helper functions for offline file handling
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
    const arr = base64.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

type ThreadMessage = Message & {
    status?: 'sending' | 'failed';
};

const MAX_CACHED_CONVERSATIONS = 50;
const MAX_CACHED_MESSAGES = 200;

const getConversationsCacheKey = (userId: string) => `messages:conversations:${userId}`;
const getMessagesCacheKey = (conversationId: string) => `messages:thread:${conversationId}`;

const readSessionCache = <T,>(key: string): T | null => {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : null;
    } catch {
        return null;
    }
};

const writeSessionCache = (key: string, value: unknown) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore session storage write failures.
    }
};

const sortConversationsByActivity = (items: Conversation[]) => {
    return [...items].sort(
        (a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
    );
};

const isDeletedMessage = (message: ThreadMessage | null | undefined) => Boolean(message?.is_deleted);

const getMessageDisplayText = (message: ThreadMessage | null | undefined, deletedLabel: string) => {
    if (!message) return null;
    return isDeletedMessage(message) ? deletedLabel : message.content;
};

const getThreadPreview = (threadMessages: ThreadMessage[], deletedLabel: string) => {
    const lastMessage = threadMessages[threadMessages.length - 1] ?? null;

    return {
        last_message_text: getMessageDisplayText(lastMessage, deletedLabel),
        last_message_at: lastMessage?.created_at ?? null,
    };
};

function MessagesComponent() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const { tx, language } = useTranslation();
    const deletedMessageLabel = tx('pages.messages.deletedMessage', undefined, 'Message deleted');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    const conversationsParentRef = useRef<HTMLDivElement>(null);
    const messagesParentRef = useRef<HTMLDivElement>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ThreadMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
    const [showMobileThread, setShowMobileThread] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingQueue, setPendingQueue] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
     const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording, audioBlob } = useAudioRecorder();

    const [deletedForMeMessageIds, setDeletedForMeMessageIds] = useState<Set<string>>(new Set());
    const [messagePendingDelete, setMessagePendingDelete] = useState<ThreadMessage | null>(null);

    const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
    const messagesChannelRef = useRef<RealtimeChannel | null>(null);
    const messageRequestIdRef = useRef(0);
    const messageCacheRef = useRef<Record<string, ThreadMessage[]>>({});
    const prefetchedConversationIdsRef = useRef<Set<string>>(new Set());

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

    // Sync pending queue when back online
    useEffect(() => {
        if (isOnline && pendingQueue.length > 0 && selectedConversation && user) {
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
                                    name: tx('pages.messages.voiceMemo', undefined, 'Voice memo'), 
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
                                    name: tx('pages.messages.voiceMemo', undefined, 'Voice memo'), 
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

    const handleSelectConversation = async (conversation: Conversation) => {
        if (selectedConversation?.id === conversation.id) return;

        setSelectedConversation(conversation);
        setShowMobileThread(true);

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
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
                )
            );
        }
    };

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


    useEffect(() => {
        if (!user?.id) return;

        const cachedConversations = readSessionCache<Conversation[]>(getConversationsCacheKey(user.id));
        if (cachedConversations && cachedConversations.length > 0) {
            setConversations(cachedConversations);
            setIsLoadingConversations(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id || conversations.length === 0) return;
        writeSessionCache(
            getConversationsCacheKey(user.id),
            conversations.slice(0, MAX_CACHED_CONVERSATIONS)
        );

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
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            } else if (data) {
                if (append) {
                    setConversations(prev => {
                        const existingIds = new Set(prev.map(c => c.id));
                        const uniqueNew = data.filter(c => !existingIds.has(c.id));
                        return sortConversationsByActivity([...prev, ...uniqueNew]);
                    });
                } else {
                    setConversations(sortConversationsByActivity(data));
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
    }, [user?.id, page]);

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
                setMessages(data as ThreadMessage[]);
                messageCacheRef.current[selectedConversation.id] = data as ThreadMessage[];
            }

            setIsLoadingMessages(false);

            // Mark conversation as read
            const { error: readError } = await markConversationRead(selectedConversation.id, user.id);
            if (!readError && messageRequestIdRef.current === requestId) {
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
                    last_message_text: getMessageDisplayText(newMsg, deletedMessageLabel),
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

    // Subscribe to ALL new messages for this user (not just selected conversation)
    // This ensures new conversations appear in the sidebar immediately
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
                    
                    // Update or add conversation to the list
                    setConversations(prev => {
                        const convIdx = prev.findIndex(c => c.id === newMsg.conversation_id);
                        
                        if (convIdx > -1) {
                            // Conversation exists - update it and move to top
                            const updated = [...prev];
                            const conv = updated[convIdx];
                            updated.splice(convIdx, 1); // Remove from current position
                            
                            // Update last message info
                            conv.last_message_text = newMsg.content;
                            conv.last_message_at = newMsg.created_at;
                            
                            // Increment unread count if it's not the currently selected conversation
                            if (selectedConversation?.id !== newMsg.conversation_id) {
                                const isParticipant1 = conv.participant_1 === user.id;
                                if (isParticipant1) {
                                    conv.unread_count_1 = (conv.unread_count_1 || 0) + 1;
                                } else {
                                    conv.unread_count_2 = (conv.unread_count_2 || 0) + 1;
                                }
                            }
                            
                            // Add to top of list
                            return [conv, ...updated];
                        } else {
                            // Reload from server when a completely new conversation arrives using existing fetch triggers
                            setPage((prevPage) => prevPage === 0 ? prevPage : 0);
                            // We can't safely call loadConversations from here since it's defined elsewhere,
                            // but setting page triggers reload if needed, or we can just fetch the single new conversation.
                            return prev;
                        }
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

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile && !audioBlob) || !selectedConversation || !user) return;

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
                        audioBase64 = await blobToBase64(audioBlob);
                        audioFileName = `voice_memo_${Date.now()}.webm`;
                        audioType = audioBlob.type || 'audio/webm';
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
                content: newMessage.trim(),
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
            if (audioBlob) cancelRecording();
            if (selectedFile) setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            showToast(tx('pages.messages.offline.queued', undefined, 'You are offline. Message queued and will send when reconnected.'), 'info');
            return;
        }

        stopTyping();

        const activeConversation = selectedConversation;
        const messageContent = newMessage.trim();
        const fileToSend = selectedFile;
        const recordedAudio = audioBlob;
        const optimisticId = `temp_${Date.now()}`;
        const optimisticCreatedAt = new Date().toISOString();
        const previewText = messageContent
            || (recordedAudio
                ? tx('pages.messages.voiceMemo', undefined, 'Voice memo')
                : fileToSend?.name || tx('pages.messages.attachmentLabel', undefined, 'Attachment'));
        const previousPreview = {
            last_message_text: activeConversation.last_message_text,
            last_message_at: activeConversation.last_message_at,
        };

        const optimisticMessage: ThreadMessage = {
            id: optimisticId,
            conversation_id: activeConversation.id,
            sender_id: user.id,
            receiver_id: activeConversation.otherUser.id,
            content: messageContent,
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
                const fileName = `voice_memo_${Date.now()}.webm`;
                const audioFile = new File([recordedAudio], fileName, { type: recordedAudio.type || 'audio/webm' });
                uploadTasks.push((async () => {
                    const { url, error } = await uploadMessageAttachment(audioFile, activeConversation.id);
                    if (error || !url) {
                        throw new Error(`${tx('pages.messages.errors.audioUpload', undefined, 'Failed to upload audio')}: ${error?.message || 'Unknown error'}`);
                    }
                    return {
                        name: tx('pages.messages.voiceMemo', undefined, 'Voice memo'),
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
                content: messageContent,
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
            showToast(message, 'error');
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setIsSending(false);
            setTimeout(() => setUploadProgress(0), 1500); // clear progress bar after short delay
        }
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

    // Filter conversations based on search and filter
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

    // Filter out messages deleted for the current user
    const displayMessages = messages.filter((message) => !deletedForMeMessageIds.has(message.id));

     const messagesVirtualizer = useVirtualizer({
        count: displayMessages.length,
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
            <div className="border-b border-[var(--color-border-default)] px-4 py-5">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">{tx('pages.messages.inbox', undefined, 'Inbox')}</p>
                        <h2 className="text-[1.9rem] font-bold tracking-tight text-[var(--color-text-primary)]">{tx('pages.messages.title', undefined, 'Messages')}</h2>
                    </div>
                    <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(profile?.user_type === 'client' ? '/find-freelancers' : '/jobs')}
                        title={tx('pages.messages.newConversation', undefined, 'Start a new conversation')}
                        className="h-11 w-11 rounded-full border border-[var(--color-border-default)] p-0 shadow-sm hover:shadow-md text-[var(--color-text-primary)] transition-all bg-[var(--color-background-elevated)]"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tx('pages.messages.searchPlaceholder', undefined, 'Search conversations...')}
                        className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-background-base)] py-3 pe-10 ps-4 text-sm text-[var(--color-text-primary)] shadow-sm focus:border-[var(--color-border-strong)] focus:ring-1 focus:ring-[var(--color-border-strong)]/20 placeholder:text-[var(--color-text-secondary)] transition-colors"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[var(--color-border-default)] px-4 py-3">
                {(['all', 'unread'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-3 text-sm font-medium transition-all rounded-lg ${
                            filter === f
                                ? 'shadow-sm border border-[color-mix(in_srgb,var(--workspace-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--workspace-primary)_15%,transparent)] text-[var(--workspace-primary)]'
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
                        <div className="text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--workspace-primary)] mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">{tx('pages.messages.loadingConversations', undefined, 'Loading conversations...')}</p>
                        </div>
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
                            onMouseEnter={() => { void prefetchConversationMessages(conversation.id); }}
                            onFocus={() => { void prefetchConversationMessages(conversation.id); }}
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
                                    ? 'border-[color-mix(in_srgb,var(--workspace-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--workspace-primary)_10%,transparent)] shadow-md'
                                    : 'border-border bg-card hover:border-border-strong hover:bg-surface hover:shadow-sm'
                             }`}
                        >
                            {selectedConversation?.id === conversation.id ? <div className="absolute inset-y-4 start-0 w-1 rounded-full bg-[var(--workspace-primary)]" /> : null}
                            <div className="flex items-start gap-3">
                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--workspace-primary)] to-[var(--workspace-primary-mid)] font-bold text-white shadow-sm">
                                    <span aria-hidden="true">{conversation.otherUser.full_name.charAt(0)}</span>
                                    {conversation.otherUser.avatar_url && (
                                        <img
                                            src={conversation.otherUser.avatar_url}
                                            alt={conversation.otherUser.full_name}
                                            className="absolute inset-0 h-12 w-12 rounded-full object-cover ring-2 ring-card"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
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
                                        } ${conversation.last_message_text === deletedMessageLabel ? 'italic' : ''}`}
                                    >
                                        {conversation.last_message_text || tx('pages.messages.noMessagesYet', undefined, 'No messages yet')}
                                    </p>
                                    <div className="flex items-center justify-between mt-3 gap-2">
                                        <div className="flex items-center gap-2 flex-1">
                                            {conversation.unread_count > 0 && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--workspace-primary)] text-xs text-white shadow-sm font-semibold shrink-0" aria-label={`${conversation.unread_count} ${tx('pages.messages.unreadMessages', undefined, 'unread messages')}`}>
                                                {conversation.unread_count}
                                                <span className="sr-only">{tx('pages.messages.unreadMessages', undefined, 'unread messages')}</span>
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
                                aria-label="Back" className="lg:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="relative flex w-11 h-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--workspace-primary)] to-[var(--workspace-primary-mid)] font-bold text-white">
                                <span aria-hidden="true">{selectedConversation.otherUser.full_name.charAt(0)}</span>
                                {selectedConversation.otherUser.avatar_url && (
                                    <img
                                        src={selectedConversation.otherUser.avatar_url}
                                        alt={selectedConversation.otherUser.full_name}
                                        className="absolute inset-0 w-11 h-11 rounded-full object-cover ring-2 ring-border"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground">{selectedConversation.otherUser.full_name}</h3>
                                    {!isOnline && (
                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                            <WifiOff className="w-3 h-3" />
                                            {tx('pages.messages.offline.badge', undefined, 'Offline')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">@{selectedConversation.otherUser.username || 'user'}</p>
                            </div>
                        </div>

                    </div>

                    {/* Messages Container */}
                    <div ref={messagesParentRef} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col relative">
                        {isLoadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-[var(--workspace-primary)] mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">{tx('pages.messages.loadingMessages', undefined, 'Loading messages...')}</p>
                                </div>
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
                                    const message = displayMessages[virtualRow.index];
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
                                    className={`group/message flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} rtl:flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300 w-full`}
                                >
                                    <div className={`relative max-w-xs lg:max-w-md ${message.sender_id === user?.id ? '' : 'mr-2'}`}>
                                        {message.sender_id === user?.id && !message.status && !message.is_deleted && (
                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteMessage(message)}
                                                disabled={deletingMessageId === message.id}
                                                aria-label={tx('pages.messages.deleteMessage', undefined, 'Delete message')}
                                                className="absolute -top-2 -start-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-100 shadow-sm transition hover:text-destructive lg:opacity-0 lg:group-hover/message:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {deletingMessageId === message.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        )}
                                        <div
                                            className={`rounded-2xl px-4 py-2 transition-all duration-200 ${
                                                isDeletedMessage(message)
                                                    ? 'border border-dashed border-border bg-card text-muted-foreground rounded-2xl'
                                                    : message.sender_id === user?.id
                                                    ? `bg-[var(--workspace-primary)] text-white rounded-br-none shadow-md hover:shadow-lg ${message.status === 'failed' ? 'ring-1 ring-red-400/60' : ''} ${message.status === 'sending' ? 'opacity-80' : ''}`
                                                    : 'bg-surface text-foreground rounded-bl-none border border-border shadow-sm hover:shadow-md'
                                            }`}
                                        >
                                            <p className={`text-sm break-words ${isDeletedMessage(message) ? 'italic' : ''}`}>
                                                {getMessageDisplayText(message, deletedMessageLabel)}
                                            </p>
                                            {!isDeletedMessage(message) && message.attachments && message.attachments.length > 0 && (
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
                                                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-background-elevated)]"
                                                            >
                                                                <FileText className="w-4 h-4 shrink-0" />
                                                                <span className="text-xs truncate">{att.name}</span>
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-end' : 'text-start'} text-muted-foreground flex items-center justify-${message.sender_id === user?.id ? 'end' : 'start'} gap-1`}>
                                            <span>{formatMessageTime(message.created_at)}</span>
                                            {message.sender_id === user?.id && message.status === 'sending' && (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            )}
                                            {message.sender_id === user?.id && message.status === 'failed' && (
                                                <span className="text-[var(--color-status-error)]">
                                                    {tx('pages.messages.sendFailed', undefined, 'Failed')}
                                                </span>
                                            )}
                                            {message.sender_id === user?.id && !message.status && !message.is_deleted && (
                                                <span className="flex items-center">
                                                    {message.is_read ? (
                                                        <span style={{ color: 'var(--color-brand-secondary)' }} title="Read">✓✓</span>
                                                    ) : (
                                                        <span className="text-[var(--color-text-secondary)]" title="Delivered">✓</span>
                                                    )}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Pending Queue Offline Messages */}
                        {pendingQueue.map((pendingMsg, idx) => (
                            <div key={`pending-${idx}`} className="flex justify-end rtl:flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-300 w-full opacity-60 mb-4">
                                <div className="max-w-xs lg:max-w-md">
                                    <div className="rounded-2xl px-4 py-2 transition-all duration-200 bg-[var(--workspace-primary)] text-white rounded-br-none shadow-md">
                                        <p className="text-sm break-words">{pendingMsg.content}</p>
                                        {(pendingMsg.fileName || pendingMsg.audioFileName || pendingMsg.offlineFile || pendingMsg.offlineAudio) && (
                                            <div className="mt-2 text-xs italic opacity-80 flex items-center gap-1">
                                                <Paperclip className="w-3 h-3" />
                                                <span>{pendingMsg.fileName || pendingMsg.audioFileName || pendingMsg.offlineFileName || pendingMsg.offlineFile?.name || tx('pages.messages.offline.attachmentPending', undefined, 'Attachment pending')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs mt-1 text-end text-muted-foreground flex items-center justify-end gap-1">
                                        <Clock className="w-3 h-3" /> {tx('pages.messages.offline.statusWaiting', undefined, 'Pending connection...')}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                        <div className="px-6 py-2 border-t border-border/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-[var(--workspace-primary)] rounded-full animate-pulse" />
                                    <div className="w-2 h-2 bg-[var(--workspace-primary)] rounded-full animate-pulse animation-delay-200" />
                                    <div className="w-2 h-2 bg-[var(--workspace-primary)] rounded-full animate-pulse animation-delay-400" />
                                </div>
                                <span>
                                    {typingUsers.length === 1 
                                        ? `${selectedConversation?.otherUser.full_name || 'Someone'} ${tx('pages.messages.typingIndicator.singular', undefined, 'is typing...')}`
                                        : `${typingUsers.length} ${tx('pages.messages.typingIndicator.plural', undefined, 'people are typing...')}`
                                    }
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="border-t border-border bg-card px-6 py-4">
                        {(selectedFile || audioBlob || isRecording) && (
                            <div className="mb-3">
                                {isRecording ? (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)]/30">
                                        <div className="w-2 h-2 rounded-full bg-[var(--color-status-error)] animate-pulse" />
                                        <span className="text-sm text-[var(--color-status-error)]">Recording: {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                        <button onClick={stopRecording} aria-label={tx('pages.messages.a11y.stopRecording', undefined, 'Stop recording')} className="ml-auto p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--color-status-error)]/20 rounded-full transition-colors">
                                            <Square className="w-4 h-4 fill-[var(--color-status-error)]" />
                                        </button>
                                    </div>
                                ) : audioBlob ? (
                                    <div className="flex flex-col gap-2 p-2 rounded-lg bg-surface border border-border">
                                        <div className="flex items-center gap-2">
                                            <FileAudio className="w-5 h-5 text-[var(--workspace-primary)]" />
                                            <span className="text-sm flex-1">{tx('pages.messages.voiceMemo', undefined, 'Voice memo')} • {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                            <button onClick={cancelRecording} disabled={isSending} aria-label={tx('pages.messages.a11y.removeAttachedItem', undefined, 'Remove attached item')} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-background rounded-full transition-colors disabled:opacity-50">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {isSending && uploadProgress > 0 && (
                                            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-[var(--workspace-primary)] h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ) : selectedFile ? (
                                    <div className="flex flex-col gap-2 p-2 rounded-lg bg-surface border border-border">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-[var(--workspace-primary)]" />
                                            <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                                            <button onClick={() => setSelectedFile(null)} disabled={isSending} aria-label={tx('pages.messages.a11y.removeAttachedItem', undefined, 'Remove attached item')} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-background rounded-full transition-colors disabled:opacity-50">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {isSending && uploadProgress > 0 && (
                                            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-[var(--workspace-primary)] h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}
                        
                        <div className="flex items-end gap-2">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf,.doc,.docx" />
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSending || !!selectedFile}
                                aria-label={tx('pages.messages.a11y.attachFile', undefined, 'Attach file')} className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isSending}
                                aria-label={isRecording
                                    ? tx('pages.messages.a11y.stopRecording', undefined, 'Stop recording')
                                    : tx('pages.messages.a11y.startRecording', undefined, 'Start recording')}
                                className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${isRecording ? 'bg-[var(--color-status-error)] text-[var(--color-text-primary)] animate-pulse' : 'hover:bg-[var(--color-background-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                            >
                                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                            </button>
                            
                            <input
                                type="text"
                                ref={messageInputRef}
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    // Trigger typing indicator
                                    if (e.target.value.trim()) {
                                        startTyping();
                                    } else {
                                        stopTyping();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        stopTyping();
                                        void handleSendMessage();
                                    }
                                }}
                                onBlur={stopTyping}
                                placeholder={
                                    selectedConversation 
                                        ? `${tx('pages.messages.messageTo', undefined, 'Message')} ${selectedConversation.otherUser.full_name}...`
                                        : tx('pages.messages.messagePlaceholder', undefined, 'Write your message...')
                                }
                                disabled={isSending || isRecording}
                                className="flex-1 bg-surface border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                            />
                            
                            <Button
                                variant="primary"
                                onClick={handleSendMessage}
                                disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || isSending || isRecording}
                                isLoading={isSending}
                                className="p-2.5 rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
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
                            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--workspace-primary)] to-[var(--workspace-primary-mid)] text-3xl font-bold text-white shadow-sm">
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

                </div>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">{tx('pages.messages.selectConversationDetails', undefined, 'Select a conversation to view details')}</p>
                </div>
            )}
        </div>
    );

        return (
        <>
            <div className="min-h-screen bg-background text-foreground">
                <SEO {...SEO_CONFIG.messages} url="/messages" noIndex />
                <Header />

                <div className="h-[calc(100vh-64px)] flex overflow-hidden">
                    {/* Sidebar - Conversations List (Responsive) */}
                    <div className={`shrink-0 border-e border-border flex-col bg-background w-full lg:w-80 ${showMobileThread ? 'hidden lg:flex' : 'flex'}`}>
                        {renderConversationList()}
                    </div>

                    {/* Main Message Area */}
                    <div className={`flex-1 flex flex-col overflow-hidden ${showMobileThread ? 'flex' : 'hidden lg:flex'}`}>
                        {renderMessageThread()}
                    </div>

                    {/* Right Sidebar - Contact Details */}
                    <div className="w-80 shrink-0 border-s border-border bg-background hidden xl:flex flex-col">
                        {renderContactDetails()}
                    </div>
                </div>
            </div>

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
                <div className="space-y-5">
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
                            className="w-full"
                        >
                            {tx('pages.messages.deleteForMe', undefined, 'Delete for me')}
                        </Button>
                        
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => void confirmDeleteMessage('everyone')}
                            isLoading={!!deletingMessageId}
                            disabled={!!deletingMessageId}
                            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
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


