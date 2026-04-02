import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface TypingState {
  userId: string;
  userName: string;
  conversationId: string;
  timestamp: number;
}

export function useTypingIndicator(conversationId: string | null, currentUserId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingState[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingBroadcast = useRef<number>(0);

  // Cleanup typing indicator
  const stopTyping = () => {
    if (isTyping && conversationId && currentUserId) {
      supabase.channel(`typing:${conversationId}`)
        .send({
          type: 'broadcast',
          event: 'stop_typing',
          payload: {
            userId: currentUserId,
            conversationId,
          }
        });
      setIsTyping(false);
    }
  };

  // Start typing indicator
  const startTyping = () => {
    if (!conversationId || !currentUserId) return;

    const now = Date.now();
    
    // Throttle typing broadcasts to every 3 seconds
    if (now - lastTypingBroadcast.current < 3000) return;
    
    lastTypingBroadcast.current = now;

    supabase.channel(`typing:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'start_typing',
        payload: {
          userId: currentUserId,
          conversationId,
          timestamp: now,
        }
      });

    setIsTyping(true);

    // Auto-stop typing after 5 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(stopTyping, 5000);
  };

  // Subscribe to typing events
  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([]);
      return;
    }

    channelRef.current = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'start_typing' }, (payload) => {
        const { userId, timestamp } = payload.payload;
        
        // Ignore own typing events
        if (userId === currentUserId) return;

        setTypingUsers(prev => {
          const filtered = prev.filter(user => user.userId !== userId);
          return [...filtered, {
            userId,
            userName: 'User', // TODO: Get actual user name
            conversationId,
            timestamp,
          }];
        });
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        const { userId } = payload.payload;
        
        setTypingUsers(prev => prev.filter(user => user.userId !== userId));
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, currentUserId]);

  // Cleanup old typing indicators (older than 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < 10000)
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isTyping,
  };
}