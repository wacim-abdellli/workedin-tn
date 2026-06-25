import type { JobStatus, MatchStatus, ContractStatus, PaymentStatus, PaymentMethod } from './enums';
import type { Profile, FreelancerProfile, Skill } from './profile';

export interface Job {
    id: string;
    client_id: string;
    title: string;
    description: string;
    category?: string;
    subcategory?: string;
    job_type: 'fixed_price' | 'hourly';
    budget_min?: number;
    budget_max?: number;
    hourly_rate?: number;
    duration?: 'less_than_1_month' | '1_3_months' | '3_6_months' | 'more_than_6_months';
    experience_level?: 'beginner' | 'intermediate' | 'expert';
    visibility?: 'public' | 'invite_only';
    status: JobStatus;
    required_skills: Skill[];
    attachments?: string[];
    proposals_count: number;
    views_count: number;
    posted_at?: string;
    created_at: string;
    updated_at: string;
    budget?: number;
    currency?: string;
    deadline?: string;
    payment_method?: PaymentMethod;
}

export interface JobMatch {
    id: string;
    job_id: string;
    freelancer_id: string;
    match_score: number;
    status: MatchStatus;
    created_at: string;
    freelancer?: FreelancerProfile & Profile;
}

export interface Contract {
    id: string;
    job_id: string;
    freelancer_id: string;
    client_id: string;
    amount: number;
    escrow_amount?: number;
    funded_at?: string | null;
    status: ContractStatus;
    payment_status: PaymentStatus;
    payment_method?: PaymentMethod;
    started_at: string;
    completed_at?: string;
    job?: Job;
    freelancer?: FreelancerProfile & Profile;
    client?: Profile;
}

export interface Review {
    id: string;
    contract_id: string;
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    comment?: string;
    created_at: string;
    reviewer?: Profile;
}
