import { createClient } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { MessageAttachment } from '../types';

// Environment variables for Supabase
// You'll need to create a .env file with these values from your Supabase project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds (default: 8000)
 * @returns The promise result or throws if timeout exceeded
 */
export async function withTimeout<T>(
    promise: PromiseLike<T>,
    timeoutMs: number = 8000
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
    }
}

// Helper function to get the current user
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

// Helper function to get freelancer profile
export const getFreelancerProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('freelancer_profiles')
        .select(`
      *,
      profiles (*)
    `)
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

// Helper to upload file to storage
export const uploadFile = async (
    bucket: string,
    path: string,
    file: File
): Promise<string> => {
    const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return data.publicUrl;
};

// ====================
// Contract Helpers
// ====================

// Get contract with related data
export const getContract = async (contractId: string) => {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            *,
            job:jobs (*),
            freelancer:profiles!freelancer_id (id, full_name, avatar_url),
            client:profiles!client_id (id, full_name, avatar_url)
        `)
        .eq('id', contractId)
        .single();

    if (error) throw error;
    return data;
};

// Get contract messages
export const getContractMessages = async (contractId: string) => {
    const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:profiles!sender_id (id, full_name, avatar_url, user_type)
        `)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

// Send message
// FIX: Added receiver_id (required), changed attachment_url to attachments JSONB array
export const sendMessage = async (
    contractId: string,
    senderId: string,
    receiverId: string, // ✅ Required field
    content: string,
    attachments?: MessageAttachment[] // ✅ Proper type instead of any[]
) => {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            contract_id: contractId,
            sender_id: senderId,
            receiver_id: receiverId, // ✅ Required by schema
            content,
            attachments: attachments || [], // ✅ Correct column name (JSONB array)
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Create notification
// FIX: Changed 'message' to 'content', 'read' to 'is_read'
export const createNotification = async (
    userId: string,
    title: string,
    content: string, // ✅ Renamed from 'message' to 'content'
    type: 'message' | 'match' | 'payment' | 'delivery' | 'dispute' | 'system',
    link?: string,
    data?: Record<string, unknown> // ✅ Proper type instead of any
) => {
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            title,
            content, // ✅ Correct column name
            type,
            link,
            is_read: false, // ✅ Correct column name
            data: data || null,
        });

    if (error) throw error;
};

// Subscribe to realtime changes
export const subscribeToContract = (
    contractId: string,
    onMessage: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
    onStatusChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
) => {
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
            onMessage
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'contracts',
                filter: `id=eq.${contractId}`,
            },
            onStatusChange
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
