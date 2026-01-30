import type { Skill } from './index';

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
