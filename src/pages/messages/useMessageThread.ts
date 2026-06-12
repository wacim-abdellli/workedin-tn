import { useState, useEffect, useRef, useCallback } from 'react';

import {
    getMessages,
    deleteMessage,
    sendMessage,
    uploadMessageAttachment,
    markConversationRead,
    subscribeToConversation,
    type Conversation,
} from '../../services/messages';
import {
    getThreadPreview,
    type ThreadMessage,
} from '../../lib/messageUtils';
import {
    serializeReplyMetadataIntoContent,
    type ReplyMetadata,
} from '../../lib/messageReplies';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useReadReceipts } from '../../hooks/useReadReceipts';
import {
    fileToBase64,
    base64ToFile,
    blobToBase64,
    buildVoiceMemoFile,
} from '../../lib/audioProcessing';
import { detectContractChatSafetyRisk } from '../../lib/contractChatSafety';

const getMessagesCacheKey = (conversationId: string) => `messages:thread:${conversationId}`;

const readSessionCache = <T,>(key: string): T | null => {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : null;
    } catch { return null; }
};

const writeSessionCache = (key: string, value: unknown) => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

interface UseMessageThreadProps {
    user: any;
    profile: any;
    selectedConversation: Conversation | null;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    selectedConversationPolicy: any;
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    tx: any;
    isOnline: boolean;
}

export function useMessageThread({
    user,
    profile,
    selectedConversation,
    setConversations,
    selectedConversationPolicy,
    showToast,
    tx,
    isOnline
}: UseMessageThreadProps) {
    const deletedMessageLabel = tx('pages.messages.deletedMessage', undefined, 'Message deleted');

    const [messages, setMessages] = useState<ThreadMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const [pendingQueue, setPendingQueue] = useState<any[]>([]);
    const [replyTarget, setReplyTarget] = useState<ReplyMetadata | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [deletedForMeMessageIds, setDeletedForMeMessageIds] = useState<Set<string>>(new Set());
    const [messagePendingDelete, setMessagePendingDelete] = useState<ThreadMessage | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const messageRequestIdRef = useRef(0);
    const messageCacheRef = useRef<Record<string, ThreadMessage[]>>({});
    const messagesChannelRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    const messagesParentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const replyHighlightTimeoutRef = useRef<number | null>(null);

    const {
        isRecording,
        recordingTime,
        startRecording,
        stopRecording,
        cancelRecording,
        audioBlob,
        error: audioRecorderError,
    } = useAudioRecorder();

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
        }
    });

    const cacheMessagesForConversation = (conversationId: string, msgs: ThreadMessage[]) => {
        messageCacheRef.current[conversationId] = msgs;
        writeSessionCache(getMessagesCacheKey(conversationId), msgs);
    };

    const prefetchConversationMessages = useCallback(async (conversationId: string) => {
        if (messageCacheRef.current[conversationId]) return;
        const cached = readSessionCache<ThreadMessage[]>(getMessagesCacheKey(conversationId));
        if (cached) {
            messageCacheRef.current[conversationId] = cached;
            return;
        }

        const { data } = await getMessages(conversationId);
        if (data) {
            const threadMessages = data as ThreadMessage[];
            messageCacheRef.current[conversationId] = threadMessages;
            writeSessionCache(getMessagesCacheKey(conversationId), threadMessages);
        }
    }, []);

    const updateConversationPreview = useCallback((conversationId: string, updater: (conv: Conversation) => Conversation) => {
        setConversations((prev) => prev.map((c) => c.id === conversationId ? updater(c) : c));
    }, [setConversations]);

    const getReplyPreviewTextForMessage = useCallback((message: ThreadMessage) => {
        if (message.is_deleted) return deletedMessageLabel;
        const content = message.content || '';
        // If content is empty but attachments exist
        if (!content && message.attachments && message.attachments.length > 0) {
            return tx('pages.messages.attachmentLabel', undefined, 'Attachment');
        }
        return content;
    }, [deletedMessageLabel, tx]);

    // Handle audio error toast
    useEffect(() => {
        if (!audioRecorderError) return;
        showToast(audioRecorderError.message, 'error');
    }, [audioRecorderError, showToast]);

    // Reset thread state when switching conversations
    useEffect(() => {
        setReplyTarget(null);
        setNewMessage('');
        setSelectedFile(null);
        if (audioBlob) {
            cancelRecording();
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [selectedConversation?.id, audioBlob, cancelRecording]);

    // Cleanup draft localstorage, load draft
    useEffect(() => {
        if (!selectedConversation) return;
        const draftKey = `draft_${selectedConversation.id}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            setNewMessage(savedDraft);
        } else {
            setNewMessage('');
        }
    }, [selectedConversation?.id]);

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

    const MAX_RECORDING_SECONDS = 5 * 60; // 5 minutes max
    useEffect(() => {
        if (isRecording && recordingTime >= MAX_RECORDING_SECONDS) {
            stopRecording();
            showToast(tx('pages.messages.errors.recordingLimit', undefined, 'Recording limit reached (5 minutes)'), 'warning');
        }
    }, [recordingTime, isRecording, stopRecording, showToast, tx]);

    // Auto-scroll logic
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        const parent = messagesParentRef.current;
        if (!parent) return;

        window.requestAnimationFrame(() => {
            parent.scrollTo({ top: parent.scrollHeight, behavior });
        });
    }, []);

    const isUserViewingBottom = useCallback(() => {
        const parent = messagesParentRef.current;
        if (!parent) return false;
        return (parent.scrollHeight - parent.scrollTop - parent.clientHeight) < 500;
    }, []);

    useEffect(() => {
        if (isUserViewingBottom()) {
            scrollToBottom('auto');
        }
    }, [messages, isUserViewingBottom, scrollToBottom]);

    useEffect(() => {
        if (!selectedConversation || messages.length === 0 || isLoadingMessages) return;
        scrollToBottom('auto');
    }, [selectedConversation?.id, messages.length, isLoadingMessages, scrollToBottom]);

    useEffect(() => {
        if (!selectedConversation) return;
        const frame = window.requestAnimationFrame(() => {
            messageInputRef.current?.focus();
        });
        return () => window.cancelAnimationFrame(frame);
    }, [selectedConversation?.id, isSending]);

    // Load messages when selected conversation changes
    useEffect(() => {
        if (!selectedConversation || !user) return;

        let cancelled = false;

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

            if (cancelled || messageRequestIdRef.current !== requestId) return;

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

            // Mark read
            const { error: readError } = await markConversationRead(selectedConversation.id, user.id);
            if (!readError && !cancelled && messageRequestIdRef.current === requestId) {
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

        void loadMessages();

        // Subscribe to thread channel
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
            cancelled = true;
            if (messagesChannelRef.current) {
                messagesChannelRef.current.unsubscribe();
            }
        };
    }, [selectedConversation?.id, user?.id, updateConversationPreview, getReplyPreviewTextForMessage, deletedMessageLabel, showToast]);

    // Offline sync
    useEffect(() => {
        if (isOnline && pendingQueue.length > 0 && selectedConversation && user) {
            const selectedLifecyclePolicy = selectedConversationPolicy;
            if (selectedLifecyclePolicy && !selectedLifecyclePolicy.canSend) {
                return;
            }

            const syncQueue = async () => {
                const currentQueue = [...pendingQueue];
                setPendingQueue([]);
                
                for (const pendingMsg of currentQueue) {
                    try {
                        const attachments = [];
                        
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
                
                localStorage.removeItem(`pendingQueue_${selectedConversation.id}`);
                showToast(tx('pages.messages.offline.synced', undefined, 'Offline messages synced successfully'), 'success');
            };
            
            syncQueue();
        }
    }, [isOnline, selectedConversation?.id, user, pendingQueue, selectedConversationPolicy, tx, showToast]);

    // Load offline pending from storage
    useEffect(() => {
        if (selectedConversation) {
            const savedQueue = localStorage.getItem(`pendingQueue_${selectedConversation.id}`);
            if (savedQueue) {
                try {
                    const parsed = JSON.parse(savedQueue);
                    setPendingQueue(parsed);
                } catch { /* ignore */ }
            } else {
                setPendingQueue([]);
            }
        }
    }, [selectedConversation?.id]);

    useEffect(() => {
        return () => {
            if (replyHighlightTimeoutRef.current) {
                window.clearTimeout(replyHighlightTimeoutRef.current);
            }
        };
    }, []);

    const handleSendMessage = async () => {
        const messageContent = newMessage.trim();
        const replyTargetSnapshot = replyTarget;
        const serializedMessageContent = serializeReplyMetadataIntoContent(messageContent, replyTargetSnapshot);

        if ((!messageContent && !selectedFile && !audioBlob) || !selectedConversation || !user) return;

        if (selectedConversationPolicy && !selectedConversationPolicy.canSend) {
            const blockedMessage = selectedConversationPolicy.blockedReasonFallback
                || tx('contract.blockedReasons.readOnly', undefined, 'This conversation is read-only right now.');
            showToast(tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage), 'warning');
            return;
        }

        if (selectedFile && selectedConversationPolicy && !selectedConversationPolicy.canAttachFiles) {
            const blockedMessage = selectedConversationPolicy.blockedReasonFallback
                || tx('contract.blockedReasons.noAttachments', undefined, 'Attachments are disabled for this conversation.');
            showToast(tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage), 'warning');
            return;
        }

        if (audioBlob && selectedConversationPolicy && !selectedConversationPolicy.canSendVoiceNotes) {
            const blockedMessage = selectedConversationPolicy.blockedReasonFallback
                || tx('contract.blockedReasons.noVoiceNotes', undefined, 'Voice notes are disabled for this conversation.');
            showToast(tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage), 'warning');
            return;
        }

        if (selectedConversation.contract_id && messageContent) {
            const safetyResult = detectContractChatSafetyRisk(messageContent);
            if (safetyResult.blocked) {
                showToast(tx('contract.chatSafetyBlocked', { message: safetyResult.reason || '' }, safetyResult.reason || 'This message is blocked by contract safety rules.'), 'warning');
                return;
            }
        }

        if (!isOnline) {
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
            
            let fileBase64: string | null = null;
            let fileName: string | null = null;
            let fileType: string | null = null;
            let fileSize: number | null = null;
            
            let audioBase64: string | null = null;
            let audioFileName: string | null = null;
            let audioType: string | null = null;
            
            try {
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
        if (fileToSend || recordedAudio) {
            progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 500);
        }

        const attachments: any[] = [];

        try {
            const uploadTasks: Promise<any>[] = [];

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

                    return prev.map(m => m.id === optimisticId ? persistedMessage : m);
                });
                cacheMessagesForConversation(activeConversation.id, messages);
            }
        } catch (error: any) {
            console.error('[Messages] Failed to send message:', error);
            showToast(error.message || tx('pages.messages.errors.sendFailed', undefined, 'Failed to send message'), 'error');
            
            // Revert optimistic message
            setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
            updateConversationPreview(activeConversation.id, (conversation) => ({
                ...conversation,
                last_message_text: activeConversation.last_message_text,
                last_message_at: activeConversation.last_message_at,
            }));
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setIsSending(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteMessage = (message: ThreadMessage) => {
        if (!selectedConversation || !user || message.sender_id !== user.id || message.status === 'sending') {
            return;
        }
        setMessagePendingDelete(message);
    };

    const confirmDeleteMessage = async (deleteType: 'me' | 'everyone') => {
        const message = messagePendingDelete;
        if (!message || !selectedConversation || !user) return;

        setMessagePendingDelete(null);

        const previousMessages = messages;
        let nextMessages: ThreadMessage[];
        
        if (deleteType === 'everyone') {
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

    const buildReplyMetadataFromMessage = useCallback((message: ThreadMessage): ReplyMetadata => {
        return {
            messageId: message.id,
            senderName: message.sender?.full_name || tx('common.unknownUser', undefined, 'Unknown User'),
            previewText: message.is_deleted ? deletedMessageLabel : message.content || '',
        };
    }, [deletedMessageLabel, tx]);

    const scrollToMessageById = useCallback((messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(messageId);
            
            if (replyHighlightTimeoutRef.current) {
                window.clearTimeout(replyHighlightTimeoutRef.current);
            }
            replyHighlightTimeoutRef.current = window.setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2000);
        }
    }, []);

    const handleReplyToMessage = useCallback((message: ThreadMessage) => {
        setReplyTarget(buildReplyMetadataFromMessage(message));
        messageInputRef.current?.focus();
    }, [buildReplyMetadataFromMessage]);

    return {
        messages,
        setMessages,
        newMessage,
        setNewMessage,
        isLoadingMessages,
        isSending,
        uploadProgress,
        deletingMessageId,
        replyTarget,
        setReplyTarget,
        highlightedMessageId,
        deletedForMeMessageIds,
        messagePendingDelete,
        setMessagePendingDelete,
        selectedFile,
        setSelectedFile,
        isRecording,
        recordingTime,
        startRecording,
        stopRecording,
        cancelRecording,
        audioBlob,
        typingUsers,
        startTyping,
        stopTyping,
        messagesEndRef,
        messageInputRef,
        messagesParentRef,
        fileInputRef,
        handleSendMessage,
        handleDeleteMessage,
        confirmDeleteMessage,
        handleReplyToMessage,
        scrollToMessageById,
        prefetchConversationMessages,
        pendingQueue,
    };
}
