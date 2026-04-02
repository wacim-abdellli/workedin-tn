import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseReadReceiptsProps {
  conversationId: string | null;
  currentUserId: string | null;
  messages: any[];
}

export function useReadReceipts({ conversationId, currentUserId, messages }: UseReadReceiptsProps) {
  
  // Mark messages as read when they become visible
  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!currentUserId || !conversationId || messageIds.length === 0) return;

    try {
      // Mark individual messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds)
        .eq('receiver_id', currentUserId);

      // Update conversation unread count
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant_1, participant_2, unread_count_1, unread_count_2')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        const isParticipant1 = conversation.participant_1 === currentUserId;
        const updateField = isParticipant1 ? 'unread_count_1' : 'unread_count_2';
        
        await supabase
          .from('conversations')
          .update({ [updateField]: 0 })
          .eq('id', conversationId);
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  // Auto-mark visible unread messages as read
  useEffect(() => {
    if (!conversationId || !currentUserId || !messages.length) return;

    const unreadMessageIds = messages
      .filter(msg => 
        msg.receiver_id === currentUserId && 
        !msg.is_read && 
        msg.sender_id !== currentUserId
      )
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      // Delay to ensure user actually sees the messages
      const timeout = setTimeout(() => {
        markMessagesAsRead(unreadMessageIds);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [conversationId, currentUserId, messages]);

  return {
    markMessagesAsRead,
  };
}