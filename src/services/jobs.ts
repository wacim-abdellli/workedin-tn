/**
 * Jobs Service — All job-related Supabase queries
 */
import { supabase } from '@/lib/supabase';
import type { Skill } from '@/types';

export interface JobFilters {
    search?: string;
    categories?: string[];
    jobType?: string | null;
    budgetRange?: string | null;
    experienceLevels?: string[];
    postedWithin?: string;
    sortBy?: string;
    status?: string;
}

export interface CreateJobInput {
    client_id: string;
    title: string;
    description: string;
    category: string;
    job_type: 'fixed_price' | 'hourly';
    budget_min?: number | null;
    budget_max?: number | null;
    hourly_rate?: number | null;
    duration: string;
    experience_level: string;
    visibility: string;
    attachments?: string[];
    required_skills?: Skill[];
}

const BUDGET_RANGES = [
    { value: '0-50', min: 0, max: 50 },
    { value: '50-100', min: 50, max: 100 },
    { value: '100-250', min: 100, max: 250 },
    { value: '250-500', min: 250, max: 500 },
    { value: '500+', min: 500, max: 999999 },
];

// --- READ ---

export async function getJobs(filters: JobFilters = {}, page = 1, pageSize = 10) {
    let query = supabase
        .from('jobs')
        .select('*, client:profiles!client_id(id, full_name, avatar_url, location)', { count: 'exact' })
        .eq('status', filters.status || 'open')
        .eq('visibility', 'public');

    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    if (filters.categories && filters.categories.length > 0) query = query.in('category', filters.categories);
    if (filters.jobType) query = query.eq('job_type', filters.jobType);
    if (filters.experienceLevels && filters.experienceLevels.length > 0) query = query.in('experience_level', filters.experienceLevels);
    
    if (filters.budgetRange) {
        const range = BUDGET_RANGES.find(r => r.value === filters.budgetRange);
        if (range) {
            query = query.gte('budget_min', range.min).lte('budget_min', range.max);
        }
    }

    if (filters.postedWithin && filters.postedWithin !== 'any') {
        const now = new Date();
        let since: Date;
        switch (filters.postedWithin) {
            case '24h': since = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
            case '3d': since = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); break;
            case '1w': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case '1m': since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
            default: since = new Date(0);
        }
        query = query.gte('posted_at', since.toISOString());
    }

    switch (filters.sortBy) {
        case 'budget_high': query = query.order('budget_max', { ascending: false, nullsFirst: false }); break;
        case 'budget_low': query = query.order('budget_min', { ascending: true }); break;
        case 'proposals_high': query = query.order('proposals_count', { ascending: false }); break;
        case 'proposals_low': query = query.order('proposals_count', { ascending: true }); break;
        default: query = query.order('posted_at', { ascending: false });
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
}

export async function getCategoryCounts(categories: string[]) {
    const counts: Record<string, number> = {};
    await Promise.all(
        categories.map(async (cat) => {
            const { count } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'open')
                .eq('visibility', 'public')
                .eq('category', cat);
            counts[cat] = count || 0;
        })
    );
    return counts;
}

export async function getJobById(jobId: string) {
    return supabase
        .from('jobs')
        .select(`*, client:profiles!client_id(id, full_name, avatar_url, location, created_at)`)
        .eq('id', jobId)
        .single();
}

export async function getJobsByClient(clientId: string) {
    return supabase
        .from('jobs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
}

export async function getSimilarJobs(jobId: string, category: string, limit = 3) {
    return supabase
        .from('jobs')
        .select('*')
        .eq('category', category)
        .eq('status', 'open')
        .neq('id', jobId)
        .limit(limit);
}

// --- WRITE ---

export async function createJob(data: CreateJobInput) {
    return supabase.from('jobs').insert({ ...data, status: 'open' }).select('id').single();
}

export async function updateJob(jobId: string, data: Partial<CreateJobInput>) {
    return supabase.from('jobs').update(data).eq('id', jobId);
}

export async function incrementJobViews(jobId: string, currentViews: number) {
    return supabase.from('jobs').update({ views_count: currentViews + 1 }).eq('id', jobId);
}
