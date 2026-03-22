/**
 * Jobs Service — All job-related Supabase queries
 */
import { supabase } from '@/lib/supabase';
import type { Skill } from '@/types';

export interface JobFilters {
    category?: string;
    jobType?: 'fixed_price' | 'hourly';
    experienceLevel?: string;
    budgetMin?: number;
    budgetMax?: number;
    search?: string;
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

// --- READ ---

export async function getJobs(filters: JobFilters = {}, page = 1, pageSize = 20) {
    let query = supabase
        .from('jobs')
        .select('*, client:profiles!client_id(id, full_name, avatar_url, location)', { count: 'exact' })
        .eq('status', filters.status || 'open')
        .order('created_at', { ascending: false });

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.jobType) query = query.eq('job_type', filters.jobType);
    if (filters.experienceLevel) query = query.eq('experience_level', filters.experienceLevel);
    if (filters.budgetMin) query = query.gte('budget_min', filters.budgetMin);
    if (filters.budgetMax) query = query.lte('budget_max', filters.budgetMax);
    if (filters.search) query = query.ilike('title', `%${filters.search}%`);

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    return query;
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
