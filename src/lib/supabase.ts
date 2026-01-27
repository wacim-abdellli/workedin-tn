import { createClient } from '@supabase/supabase-js';

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
export const sendMessage = async (
    contractId: string,
    senderId: string,
    content: string,
    attachmentUrl?: string
) => {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            contract_id: contractId,
            sender_id: senderId,
            content,
            attachment_url: attachmentUrl || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Create notification
export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: 'message' | 'match' | 'payment' | 'delivery' | 'dispute' | 'system',
    link?: string
) => {
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            title,
            message,
            type,
            link,
            read: false,
        });

    if (error) throw error;
};

// Subscribe to realtime changes
export const subscribeToContract = (
    contractId: string,
    onMessage: (payload: any) => void,
    onStatusChange: (payload: any) => void
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
