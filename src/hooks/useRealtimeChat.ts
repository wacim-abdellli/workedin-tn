import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sendContractMessage as sendMessageRecord } from '../services/messages';
import type { Message, MessageAttachment } from '../types';

interface ChatMessage extends Omit<Message, 'sender'> {
    status?: 'sending' | 'sent' | 'error';
    sender?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        user_type: string;
    } | null;
}

interface UseRealtimeChatOptions {
    contractId: string;
    userId: string;
    enabled?: boolean;
}

interface UseRealtimeChatReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    error: Error | null;
    sendMessage: (content: string, receiverId: string, attachments?: MessageAttachment[]) => Promise<void>;
    isSending: boolean;
    isTyping: boolean;
    setTyping: (typing: boolean) => void;
    otherUserTyping: boolean;
    hasMoreMessages: boolean;
    loadMoreMessages: () => Promise<void>;
}

const MESSAGES_PER_PAGE = 50;

export function useRealtimeChat({
    contractId,
    userId,
    enabled = true,
}: UseRealtimeChatOptions): UseRealtimeChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [totalMessageCount, setTotalMessageCount] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);

    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const fetchMessages = useCallback(async (offset: number = 0) => {
        if (!contractId || !enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            // Get total count first
            if (offset === 0) {
                const { count, error: countError } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('contract_id', contractId);

                if (countError) throw countError;
                setTotalMessageCount(count || 0);
            }

            const { data, error: fetchError } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:profiles!sender_id (
                        id,
                        full_name,
                        avatar_url,
                        user_type
                    )
                `)
                .eq('contract_id', contractId)
                .order('created_at', { ascending: true })
                .range(offset, offset + MESSAGES_PER_PAGE - 1);

            if (fetchError) throw fetchError;

            const newMessages = (data || []) as ChatMessage[];
            
            if (offset === 0) {
                setMessages(newMessages);
            } else {
                // Prepend older messages
                setMessages(prev => [...newMessages, ...prev]);
            }
            
            // Check if there are more messages to load
            setHasMoreMessages((offset + MESSAGES_PER_PAGE) < (totalMessageCount || 0));
        } catch (err) {
            logger.error('Error fetching messages:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [contractId, enabled, totalMessageCount]);

    useEffect(() => {
        if (!contractId || !enabled) return;

        fetchMessages();

        // Cache for sender profiles to avoid N+1 queries on realtime inserts
        const senderCacheRef = useRef<Map<string, ChatMessage['sender']>>(new Map());

        const channel = supabase
            .channel(`contract:${contractId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `contract_id=eq.${contractId}`,
                },
                async (payload) => {
                    const senderId = payload.new.sender_id;
                    
                    // Check cache first to avoid N+1 queries
                    let sender = senderCacheRef.current.get(senderId);
                    
                    if (!sender) {
                        const { data: senderData } = await supabase
                            .from('profiles')
                            .select('id, full_name, avatar_url, user_type')
                            .eq('id', senderId)
                            .single();
                        
                        if (senderData) {
                            sender = {
                                id: senderData.id,
                                full_name: senderData.full_name,
                                avatar_url: senderData.avatar_url,
                                user_type: senderData.user_type,
                            };
                            senderCacheRef.current.set(senderId, sender);
                        }
                    }

                    const newMessage: ChatMessage = {
                        ...payload.new as Message,
                        sender: sender || null,
                    };

                    setMessages((prev) => {
                        if (prev.some((message) => message.id === newMessage.id)) {
                            return prev;
                        }
                        return [...prev, newMessage];
                    });
                }
            )
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const otherTyping = Object.values(state).some(
                    (users) =>
                        Array.isArray(users) &&
                        users.some(
                            (presence) =>
                                (presence as { user_id?: string; typing?: boolean }).user_id !== userId &&
                                (presence as { typing?: boolean }).typing
                        )
                );
                setOtherUserTyping(otherTyping);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: userId,
                        typing: false,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [contractId, userId, enabled, fetchMessages]);

    const sendMessage = useCallback(
        async (content: string, receiverId: string, attachments?: MessageAttachment[]) => {
            if (!content.trim() && (!attachments || attachments.length === 0)) return;
            if (!contractId || !userId || !receiverId) return;

            const optimisticId = 'temp-' + Date.now();
            const optimisticMsg: ChatMessage = {
                id: optimisticId,
                contract_id: contractId,
                sender_id: userId,
                receiver_id: receiverId,
                content: content.trim(),
                attachments: attachments || [],
                created_at: new Date().toISOString(),
                is_read: false,
                status: 'sending'
            };

            setMessages(prev => [...prev, optimisticMsg]);
            setIsSending(true);

            let attempt = 0;
            const maxRetries = 3;

            while (attempt < maxRetries) {
                try {
                    const { error: insertError } = await sendMessageRecord({
                        contract_id: contractId,
                        sender_id: userId,
                        receiver_id: receiverId,
                        content: content.trim(),
                        attachments: attachments || [],
                    });

                    if (insertError) throw insertError;
                    
                    // Success! Remove optimistic message since Realtime will duplicate it
                    setMessages(prev => prev.filter(m => m.id !== optimisticId));
                    break;
                } catch (err) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        logger.error('Error sending message:', err);
                        setMessages(prev => 
                            prev.map(m => m.id === optimisticId ? { ...m, status: 'error' } : m)
                        );
                        break;
                    }
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
                }
            }
            
            setIsSending(false);
        },
        [contractId, userId]
    );

    const setTyping = useCallback(
        (typing: boolean) => {
            setIsTyping(typing);

            // Always clear existing timeout to prevent memory leaks
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }

            if (channelRef.current) {
                channelRef.current.track({
                    user_id: userId,
                    typing,
                    online_at: new Date().toISOString(),
                });
            }

            if (typing) {
                // Set a new timeout to auto-disable typing after 3 seconds
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                    typingTimeoutRef.current = null;
                    
                    // Notify channel that typing has stopped
                    if (channelRef.current) {
                        channelRef.current.track({
                            user_id: userId,
                            typing: false,
                            online_at: new Date().toISOString(),
                        });
                    }
                }, 3000);
            }
        },
        [userId]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const loadMoreMessages = useCallback(async () => {
        if (!hasMoreMessages) return;
        // Load older messages (before current first message)
        await fetchMessages(messages.length);
    }, [messages.length, hasMoreMessages, fetchMessages]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        isSending,
        isTyping,
        setTyping,
        otherUserTyping,
        hasMoreMessages,
        loadMoreMessages,
    };
}

export default useRealtimeChat;
