/**
 * Profiles Service — User and freelancer profile queries
 */
import { supabase, uploadFile } from '@/lib/supabase';
import { sanitizeFreelancerProfileData } from '@/lib/schemaValidation';

// --- READ ---

// getProfileById: reads from the public_profiles VIEW (safe columns only).
// Accessible to anon + authenticated via view-level GRANT.
// Does NOT expose: email, phone, is_admin, account_status, cin_submitted.
export async function getProfileById(userId: string) {
    return supabase
        .from('public_profiles')
        .select('*')
        .eq('id', userId)
        .single();
}

// Full own-profile read — only safe to call when userId === auth.uid().
// Reads the base table (all columns). Protected by profiles_select_own RLS.
export async function getOwnProfile(userId: string) {
    return supabase.from('profiles').select('*').eq('id', userId).single();
}

export async function getFreelancerProfile(userId: string) {
    return supabase.from('freelancer_profiles').select('*').eq('id', userId).single();
}

export async function getFreelancerWithProfile(userId: string) {
    return supabase
        .from('profiles')
        .select(`*, freelancer_profiles(*), portfolio_items(*)`)
        .limit(20, { foreignTable: 'portfolio_items' })
        .eq('id', userId)
        .single();
}

export async function getFreelancers(filters: {
    search?: string;
    skills?: string[];
    availability?: string;
    minRate?: number;
    maxRate?: number;
    locations?: string[];
    excludeId?: string;   // exclude the current user from their own search results
} = {}, page = 1, pageSize = 20) {
    // Use authenticated client — ensures RLS policies allow reading freelancer_profiles
    // Query the public_profiles view — safe columns only, anon-readable.
    let query = supabase
        .from('public_profiles')
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
        // Strip out characters that could break parsing
        const safeSearch = filters.search.replace(/[,"_%]/g, ' ').trim();
        if (safeSearch) {
            query = query.or(`full_name.ilike.%${safeSearch}%,freelancer_profiles.title.ilike.%${safeSearch}%`);
        }
    }

    if (filters.availability && filters.availability !== 'any') {
        query = query.eq('freelancer_profiles.availability', filters.availability);
    }

    if (filters.minRate !== undefined) {
        query = query.gte('freelancer_profiles.hourly_rate', filters.minRate);
    }

    if (filters.maxRate !== undefined) {
        query = query.lte('freelancer_profiles.hourly_rate', filters.maxRate);
    }

    if (filters.skills && filters.skills.length > 0) {
        // Assuming skills is a JSONb or text array column
        // use filter by containing elements. PostgREST allows .cs. for contains.
        query = query.contains('freelancer_profiles.skills', filters.skills);
    }

    if (filters.locations && filters.locations.length > 0) {
        query = query.in('location', filters.locations);
    }

    // Exclude the current user so a freelancer does not see themselves in results.
    if (filters.excludeId) {
        query = query.neq('id', filters.excludeId);
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
        .order('created_at', { ascending: false })
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
    const { data, error } = await supabase.rpc('get_client_stats_v2', { p_client_id: clientId });
    
    if (error) {
        return { totalJobs: 0, totalSpent: 0, rating: 0 };
    }
    
    const stats = (data as any)?.[0] || {};
    return {
        totalJobs: stats.job_count || 0,
        totalSpent: Number(stats.total_spent) || 0,
        rating: Number(stats.avg_rating) || 0,
    };
}
