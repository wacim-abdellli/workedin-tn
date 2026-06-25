/**
 * Notifications Service — Supabase queries for the notifications table.
 * Real-time subscription is handled by useRealtimeNotifications hook.
 */
import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import type { AppNotification } from '@/hooks/useRealtimeNotifications';

export type { AppNotification };

// --- READ ---

export async function getNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabaseWithRetry(() =>
        supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .neq('type', 'message')
            .order('created_at', { ascending: false })
            .limit(50)
    );

    if (error) throw new Error(error.message);
    return (data ?? []) as AppNotification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseWithRetry(() =>
        supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .neq('type', 'message')
            .eq('is_read', false)
    );

    if (error) throw new Error(error.message);
    return count ?? 0;
}

// --- WRITE ---

// Client-side alias map — aligns with the DB's notification_type_enum.
// Some call sites use shorthand aliases ('proposal', 'contract') that older
// DB versions reject. Always normalize before the RPC call.
const NOTIFICATION_TYPE_ALIASES: Record<string, string> = {
    proposal: 'new_proposal',
    contract: 'contract_update',
};

export async function insertNotification(data: {
    user_id: string;
    type: AppNotification['type'];
    title: string;
    body: string;
    related_id?: string;
    link?: string;
}) {
    const normalizedType = NOTIFICATION_TYPE_ALIASES[data.type] ?? data.type;
    const { error } = await supabaseWithRetry(() =>
        supabase.rpc('create_notification', {
            p_user_id: data.user_id,
            p_type: normalizedType,
            p_title: data.title,
            p_body: data.body,
            p_related_id: data.related_id,
            p_link: data.link
        })
    );
    if (error) throw new Error(error.message);
}

export const createNotification = insertNotification;

export async function markNotificationRead(notificationId: string) {
    const { error } = await supabaseWithRetry(() =>
        supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
    );
    if (error) throw new Error(error.message);
}

export async function markAllRead(userId: string) {
    const { error } = await supabaseWithRetry(() =>
        supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false)
    );
    if (error) throw new Error(error.message);
}

// --- REALTIME ---
// @deprecated Prefer the useRealtimeNotifications hook for new code.
// Kept as a thin export so legacy call sites and existing tests compile.
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
