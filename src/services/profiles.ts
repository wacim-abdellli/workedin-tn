/**
 * Profiles Service — User and freelancer profile queries
 */
import { supabase, uploadFile } from '@/lib/supabase';
import { sanitizeFreelancerProfileData } from '@/lib/schemaValidation';

// --- READ ---

export async function getProfileById(userId: string) {
    return supabase.from('profiles').select('*').eq('id', userId).single();
}

export async function getFreelancerProfile(userId: string) {
    return supabase.from('freelancer_profiles').select('*').eq('id', userId).single();
}

export async function getFreelancerWithProfile(userId: string) {
    return supabase
        .from('profiles')
        .select(`*, freelancer_profiles(*), portfolio_items(*)`)
        .eq('id', userId)
        .single();
}

export async function getFreelancers(filters: {
    search?: string;
    skills?: string[];
    availability?: string;
    minRate?: number;
    maxRate?: number;
} = {}, page = 1, pageSize = 20) {
    // Use authenticated client — ensures RLS policies allow reading freelancer_profiles
    let query = supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            avatar_url,
            location,
            user_type,
            freelancer_profiles!inner (
                id,
                title,
                hourly_rate,
                availability,
                skills,
                jobs_completed,
                success_rate,
                cin_verified
            )
        `, { count: 'exact' })
        .in('user_type', ['freelancer', 'both']);

    if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%`);
    }

    if (filters.availability) {
        query = query.eq('freelancer_profiles.availability', filters.availability);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    return query;
}

// --- WRITE ---

export async function updateProfile(userId: string, data: Record<string, unknown>) {
    return supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', userId);
}

export async function updateFreelancerProfile(userId: string, data: Record<string, unknown>) {
    const safeData = sanitizeFreelancerProfileData(data);
    return supabase
        .from('freelancer_profiles')
        .upsert({ id: userId, ...safeData, updated_at: new Date().toISOString() }, { onConflict: 'id' });
}

export async function uploadAvatar(userId: string, file: File) {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    return uploadFile('avatars', path, file);
}

// --- FAVORITES ---

export async function getFavoriteStatus(userId: string, jobId: string) {
    return supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('job_id', jobId)
        .maybeSingle();
}

export async function toggleFavorite(userId: string, jobId: string, isSaved: boolean) {
    if (isSaved) {
        return supabase.from('favorites').delete().eq('user_id', userId).eq('job_id', jobId);
    }
    return supabase.from('favorites').insert({ user_id: userId, job_id: jobId });
}

export async function getSavedJobs(userId: string) {
    return supabase
        .from('favorites')
        .select('job_id, jobs(*)')
        .eq('user_id', userId)
        .not('job_id', 'is', null);
}

// --- REVIEWS ---

export async function getReviewsByUser(userId: string) {
    return supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });
}

export async function getClientStats(clientId: string) {
    const [jobsResult, contractsResult, reviewsResult] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
        supabase.from('contracts').select('total_amount').eq('client_id', clientId).eq('status', 'completed'),
        supabase.from('reviews').select('rating').eq('reviewee_id', clientId),
    ]);

    const totalSpent = contractsResult.data?.reduce((sum, c) => sum + (c.total_amount || 0), 0) || 0;
    const avgRating = reviewsResult.data?.length
        ? reviewsResult.data.reduce((sum, r) => sum + r.rating, 0) / reviewsResult.data.length
        : 0;

    return {
        totalJobs: jobsResult.count || 0,
        totalSpent,
        rating: avgRating,
    };
}
