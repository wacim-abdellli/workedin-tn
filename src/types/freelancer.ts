import type { Skill, SkillEntry } from './index';

export interface FreelancerUsernameLookupRow {
    id: string;
}

export type FreelancerSkillValue =
    | string
    | { name?: SkillEntry['name'] | null; level?: SkillEntry['level'] | null }
    | null;

export interface FreelancerProfileOwnerRow {
    full_name: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    created_at: string;
    phone: string | null;
    user_type: string | null;
}

export interface FreelancerProfilePublicRow {
    id: string;
    title: string | null;
    voice_intro_url: string | null;
    hourly_rate: number | null;
    availability: FreelancerData['availability'] | null;
    skills: FreelancerSkillValue[] | null;
    languages: FreelancerData['languages'] | null;
    education: FreelancerData['education'] | null;
    certifications: FreelancerData['certifications'] | null;
    years_experience: number | null;
    tools: string[] | null;
    industries: string[] | null;
    portfolio_links: string[] | null;
    weekly_availability_hours: number | null;
    revision_policy: string | null;
    project_preferences: Record<string, unknown> | null;
    jobs_completed: number | null;
    response_time_hours: number | null;
    repeat_clients: number | null;
    total_earnings: number | null;
    success_rate: number | null;
    profile_views: number | null;
    cin_verified: boolean | null;
    profile: FreelancerProfileOwnerRow | null;
}

export interface PortfolioItemRow {
    id: string;
    title: string | null;
    thumbnail_url: string | null;
    description: string | null;
    project_url: string | null;
    skills_used: string[] | null;
    media_urls: string[] | null;
}

export interface FreelancerReviewRow {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    skills_rating: Record<string, number> | null;
    reviewer: {
        full_name: string | null;
        avatar_url: string | null;
    } | Array<{
        full_name: string | null;
        avatar_url: string | null;
    }> | null;
    contract: {
        job: {
            title: string | null;
        } | Array<{
            title: string | null;
        }> | null;
    } | Array<{
        job: {
            title: string | null;
        } | Array<{
            title: string | null;
        }> | null;
    }> | null;
}

export interface FreelancerData {
    id: string;
    full_name: string;
    username?: string;
    title: string | null;
    avatar_url: string | null;
    cover_url?: string | null;
    bio: string;
    location: string;
    joined_at: string;
    voice_intro_url: string | null;
    hourly_rate: number;
    availability: 'available' | 'busy' | 'offline';
    skills: Skill[];
    languages: Array<{ language: string; proficiency: string }>;
    education: Array<{ institution: string; degree: string; field: string; startYear: string; endYear: string }>;
    certifications: Array<{ name: string; issuer: string; year: string }>;
    years_experience?: number;
    tools?: string[];
    industries?: string[];
    portfolio_links?: string[];
    weekly_availability_hours?: number;
    revision_policy?: string;
    project_preferences?: Record<string, unknown>;
    stats: {
        jobs_completed: number;
        rating: number;
        reviews_count: number;
        response_time_hours: number;
        completion_rate: number;
        repeat_clients: number;
        total_earnings: number;
        success_rate: number;
        profile_views: number;
    };
    verifications: {
        cin: boolean;
        phone: boolean;
        email: boolean;
        payment: boolean;
    };
    work_samples: Array<{
        id: string;
        title: string;
        thumbnail_url: string;
        description?: string;
        skills_used?: string[];
        project_url?: string;
        media_urls?: string[];
    }>;
    reviews: Array<{
        id: string;
        client_name: string;
        client_avatar?: string;
        rating: number;
        comment: string;
        created_at: string;
        job_title: string;
        skills_rating?: Record<string, number>;
    }>;
}
