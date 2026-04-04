import { useEffect, useRef } from 'react';
import { markConversationRead } from '@/services/messages';

interface UseReadReceiptsProps {
  conversationId: string | null;
  currentUserId: string | null;
  messages: Array<{ id: string; receiver_id: string; sender_id: string; is_read?: boolean }>;
  onMarkedRead?: (messageIds: string[]) => void;
}

export function useReadReceipts({
  conversationId,
  currentUserId,
  messages,
  onMarkedRead,
}: UseReadReceiptsProps) {
  const lastMarkedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !currentUserId || messages.length === 0) return;

    const unreadMessageIds = messages
      .filter((msg) => msg.receiver_id === currentUserId && !msg.is_read && msg.sender_id !== currentUserId)
      .map((msg) => msg.id)
      .sort();

    if (unreadMessageIds.length === 0) {
      lastMarkedSignatureRef.current = null;
      return;
    }

    const signature = `${conversationId}:${unreadMessageIds.join(',')}`;
    if (lastMarkedSignatureRef.current === signature) return;

    const timeout = setTimeout(async () => {
      const { error } = await markConversationRead(conversationId, currentUserId);
      if (!error) {
        lastMarkedSignatureRef.current = signature;
        onMarkedRead?.(unreadMessageIds);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [conversationId, currentUserId, messages, onMarkedRead]);

  return null;
}
