import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

function shouldShowIncomingToast(_notification: AppNotification) {
    // Don't show any toast popups for incoming notifications
    // All notifications will only appear in the notification bell
    // This prevents annoying popups interrupting user workflow
    return false;
}

export interface AppNotification {
    id: string;
    user_id: string;
    type: 'message' | 'proposal' | 'contract' | 'payment' | 'system' | 'review';
    title: string;
    body: string;
    is_read: boolean;
    related_id: string | null;
    link: string | null;
    created_at: string;
}

export const NOTIFICATIONS_QUERY_KEY = (userId: string) => ['notifications', userId] as const;

async function fetchNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .neq('type', 'message')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw new Error(error.message);
    return (data ?? []) as AppNotification[];
}

export function useRealtimeNotifications(userId: string | undefined) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const queryKey = userId ? NOTIFICATIONS_QUERY_KEY(userId) : null;

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: queryKey ?? ['notifications', '__none__'],
        queryFn: () => fetchNotifications(userId!),
        enabled: Boolean(userId),
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });

    // Subscribe to realtime INSERT and UPDATE events
    useEffect(() => {
        if (!userId) return;

        let channel: RealtimeChannel | null = null;

        channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const incoming = payload.new as AppNotification;

                    if (incoming.type === 'message') return;

                    // Prepend to React Query cache — no refetch needed
                    queryClient.setQueryData<AppNotification[]>(
                        NOTIFICATIONS_QUERY_KEY(userId),
                        (prev = []) => [incoming, ...prev].slice(0, 50)
                    );

                    if (shouldShowIncomingToast(incoming)) {
                        showToast(incoming.title, 'info');
                    }
                }
            )
            // Subscribe to UPDATE events to catch deleted message notifications
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const updated = payload.new as AppNotification;

                    if (updated.type === 'message') return;

                    // Update the notification in cache with new content
                    queryClient.setQueryData<AppNotification[]>(
                        NOTIFICATIONS_QUERY_KEY(userId),
                        (prev = []) => prev.map(n => n.id === updated.id ? updated : n)
                    );
                }
            )
            .subscribe();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [userId, queryClient, showToast]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!userId) return;

        // Optimistic update
        queryClient.setQueryData<AppNotification[]>(
            NOTIFICATIONS_QUERY_KEY(userId),
            (prev = []) => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    }, [userId, queryClient]);

    const markAllRead = useCallback(async () => {
        if (!userId) return;

        // Optimistic update
        queryClient.setQueryData<AppNotification[]>(
            NOTIFICATIONS_QUERY_KEY(userId),
            (prev = []) => prev.map(n => ({ ...n, is_read: true }))
        );

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
    }, [userId, queryClient]);

    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!userId) return;

        // Save previous state for rollback
        const previousNotifications = queryClient.getQueryData<AppNotification[]>(NOTIFICATIONS_QUERY_KEY(userId));

        // Optimistic update
        queryClient.setQueryData<AppNotification[]>(
            NOTIFICATIONS_QUERY_KEY(userId),
            (prev = []) => prev.filter(n => n.id !== notificationId)
        );

        const { data, error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .select('id');

        if (error || !data || data.length === 0) {
            console.error('Failed to delete notification:', error || '0 rows affected (RLS constraint)');
            if (previousNotifications) {
                queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_QUERY_KEY(userId), previousNotifications);
            }
            showToast('Failed to delete notification', 'error');
        }
    }, [userId, queryClient, showToast]);

    return { notifications, unreadCount, isLoading, markAsRead, markAllRead, deleteNotification };
}
