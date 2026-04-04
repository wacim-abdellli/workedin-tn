import { createClient } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { MessageAttachment } from '../types';

// Environment variables for Supabase
// You'll need to create a .env file with these values from your Supabase project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Anon-only client for public queries (jobs, freelancers) — isolated from user session churn.
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sb-anon',
    },
});

// Purge stale session synchronously before client reads localStorage
if (typeof window !== 'undefined') {
    try {
        const sbKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
        sbKeys.forEach(k => {
            try {
                const raw = localStorage.getItem(k);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const expiresAt = parsed?.expires_at;
                    if (expiresAt && Date.now() / 1000 > expiresAt) {
                        localStorage.removeItem(k);
                    }
                }
            } catch {
                // Ignore malformed localStorage records while cleaning stale sessions.
            }
        });
    } catch {
        // Ignore localStorage access failures in restricted environments.
    }
}

// Create Supabase client with minimal config to avoid hangs
// Supabase handles token storage securely via httpOnly cookies when appropriate
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
        headers: {
            'x-client-info': 'khedma-tn',
        },
    },
});

// Expose supabase client to window for debugging
if (typeof window !== 'undefined') {
    (window as any).supabase = supabase;
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds (default: 15000)
 * @returns The promise result or throws if timeout exceeded
 */
export async function withTimeout<T>(
    promise: PromiseLike<T>,
    timeoutMs: number = 15000,
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

export function isMissingStorageBucketError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const errorRecord = error as Record<string, unknown>;
    const message = typeof errorRecord.message === 'string' ? errorRecord.message.toLowerCase() : '';
    const statusCode =
        typeof errorRecord.statusCode === 'number'
            ? errorRecord.statusCode
            : typeof errorRecord.status === 'number'
                ? errorRecord.status
                : undefined;

    return statusCode === 404 || message.includes('bucket not found');
}

export function isStoragePermissionError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const errorRecord = error as Record<string, unknown>;
    const message = typeof errorRecord.message === 'string' ? errorRecord.message.toLowerCase() : '';
    const code = typeof errorRecord.code === 'string' ? errorRecord.code : '';
    const statusCode =
        typeof errorRecord.statusCode === 'number'
            ? errorRecord.statusCode
            : typeof errorRecord.status === 'number'
                ? errorRecord.status
                : undefined;

    return code === '42501' || statusCode === 400 || statusCode === 403 || message.includes('row-level security') || message.includes('not authorized');
}

export function getStorageConfigErrorMessage(bucket: string): string {
    return `Storage bucket "${bucket}" is not configured yet.`;
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
    // Calculate timeout based on file size
    // Base time: 5 seconds + 5ms per KB for mobile 3G compatibility (100MB = 500s)
    // Minimum 15s for small files, maximum 600s (10 minutes) for large files
    const fileSizeKB = file.size / 1024;
    const calculatedTimeout = Math.min(Math.max(5000 + (fileSizeKB * 5), 15000), 600000);
    
    const { error } = await withTimeout(
        supabase.storage
            .from(bucket)
            .upload(path, file, { upsert: true }),
        calculatedTimeout,
        `Upload ${bucket}/${path}`
    );

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
