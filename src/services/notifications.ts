/**
 * Notifications Service — Notification Supabase queries
 */
import { supabase } from '@/lib/supabase';

// --- READ ---

export async function getNotifications(userId: string) {
    return supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
}

export async function getUnreadCount(userId: string) {
    return supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
}

// --- WRITE ---

export async function createNotification(data: {
    user_id: string;
    type: string;
    content: string;
    link?: string;
}) {
    return supabase.from('notifications').insert({ ...data, is_read: false });
}

export async function markNotificationRead(notificationId: string) {
    return supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllRead(userId: string) {
    return supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

// --- REALTIME ---

export function subscribeToNotifications(userId: string, callback: (payload: unknown) => void) {
    return supabase
        .channel(`notifications:${userId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
        }, callback)
        .subscribe();
}
