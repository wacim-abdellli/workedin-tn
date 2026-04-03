import { supabase } from '@/lib/supabase';

export type CreateNotificationInput = {
    userId: string;
    type: string;
    title: string;
    body?: string;
    link?: string | null;
    relatedId?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
    const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: input.userId,
        p_type: input.type,
        p_title: input.title,
        p_body: input.body ?? '',
        p_link: input.link ?? null,
        p_related_id: input.relatedId ?? null,
    });

    if (error) throw error;
    return data;
}
