import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Message, MessageAttachment } from '../types';

interface ChatMessage extends Omit<Message, 'sender'> {
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
}

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

    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Fetch initial messages
    const fetchMessages = useCallback(async () => {
        if (!contractId || !enabled) return;

        setIsLoading(true);
        setError(null);

        try {
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
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            setMessages(data || []);
        } catch (err) {
            logger.error('Error fetching messages:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [contractId, enabled]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!contractId || !enabled) return;

        // Fetch initial data
        fetchMessages();

        // Create real-time channel
        const channel = supabase
            .channel(`contract:${contractId}`)
            // Listen for new messages
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `contract_id=eq.${contractId}`,
                },
                async (payload) => {
                    // Fetch the sender profile for the new message
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, user_type')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMessage: ChatMessage = {
                        ...payload.new as Message,
                        sender: sender ? {
                            id: sender.id,
                            full_name: sender.full_name,
                            avatar_url: sender.avatar_url,
                            user_type: sender.user_type,
                        } : null,
                    };

                    setMessages((prev) => {
                        // Avoid duplicates
                        if (prev.some((m) => m.id === newMessage.id)) {
                            return prev;
                        }
                        return [...prev, newMessage];
                    });
                }
            )
            // Listen for typing indicators via presence
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const otherTyping = Object.values(state).some(
                    (users) =>
                        Array.isArray(users) &&
                        users.some(
                            (u) =>
                                (u as any).user_id !== userId && (u as any).typing
                        )
                );
                setOtherUserTyping(otherTyping);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track presence
                    await channel.track({
                        user_id: userId,
                        typing: false,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;

        // Cleanup
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [contractId, userId, enabled, fetchMessages]);

    // Send message function
    const sendMessage = useCallback(
        async (content: string, receiverId: string, attachments?: MessageAttachment[]) => {
            if (!content.trim() && (!attachments || attachments.length === 0)) return;
            if (!contractId || !userId || !receiverId) return;

            setIsSending(true);

            try {
                const { error: insertError } = await supabase
                    .from('messages')
                    .insert({
                        contract_id: contractId,
                        sender_id: userId,
                        receiver_id: receiverId, // ✅ ADDED: Required by schema
                        content: content.trim(),
                        attachments: attachments || [],
                    });

                if (insertError) throw insertError;

                // Message will be added via real-time subscription
            } catch (err) {
                logger.error('Error sending message:', err);
                throw err;
            } finally {
                setIsSending(false);
            }
        },
        [contractId, userId]
    );

    // Update typing status
    const setTyping = useCallback(
        (typing: boolean) => {
            setIsTyping(typing);

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Update presence
            if (channelRef.current) {
                channelRef.current.track({
                    user_id: userId,
                    typing,
                    online_at: new Date().toISOString(),
                });
            }

            // Auto-clear typing after 3 seconds
            if (typing) {
                typingTimeoutRef.current = setTimeout(() => {
                    setTyping(false);
                }, 3000);
            }
        },
        [userId]
    );

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        isSending,
        isTyping,
        setTyping,
        otherUserTyping,
    };
}

export default useRealtimeChat;
