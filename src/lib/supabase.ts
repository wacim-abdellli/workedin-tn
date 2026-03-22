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
        detectSessionInUrl: false, // We handle code exchange manually in AuthCallback
        flowType: 'pkce',
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
    timeoutMs: number = 8000,
    operationName: string = 'Operation'
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
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

/**
 * Direct insert via REST API - completely bypasses the Supabase JS client
 * which hangs on both .insert() and .getSession() calls.
 * Reads auth token directly from localStorage.
 */
export async function directInsert<T = any>(
    table: string,
    data: Record<string, unknown>
): Promise<{ data: T | null; error: { message: string; code: string } | null }> {
    // Extract the project ref from the Supabase URL (e.g., "wvgkezmboewtlpnyjnyd")
    const ref = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
    if (!ref) {
        return { data: null, error: { message: 'Invalid Supabase URL', code: 'CONFIG_ERROR' } };
    }

    // Read auth token directly from localStorage - bypasses buggy JS client
    const storageKey = `sb-${ref}-auth-token`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
        return { data: null, error: { message: 'Not authenticated (no session in storage)', code: 'AUTH_ERROR' } };
    }

    let accessToken: string;
    try {
        const parsed = JSON.parse(raw);
        accessToken = parsed.access_token;
        if (!accessToken) {
            return { data: null, error: { message: 'No access token in session', code: 'AUTH_ERROR' } };
        }
    } catch {
        return { data: null, error: { message: 'Invalid session data', code: 'AUTH_ERROR' } };
    }

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error', code: String(response.status) }));
            return {
                data: null,
                error: {
                    message: errorBody.message || `HTTP ${response.status}`,
                    code: errorBody.code || String(response.status),
                },
            };
        }

        const result = await response.json();
        // PostgREST returns an array; return first item
        return { data: Array.isArray(result) ? result[0] : result, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message, code: 'FETCH_ERROR' } };
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
