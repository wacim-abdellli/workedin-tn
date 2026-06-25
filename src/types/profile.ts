import type { UserType, AccountMode, AccountStatus, Language, Availability } from './enums';

export interface Profile {
    active_mode?: AccountMode | null;
    id: string;
    user_type: UserType | null;
    email?: string;
    is_admin?: boolean;
    is_super_admin?: boolean;
    account_status?: AccountStatus;
    deleted_at?: string | null;
    deleted_by?: string | null;
    deletion_reason?: string | null;
    username?: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    avatar_url_client?: string;
    avatar_url_freelancer?: string;
    bio?: string;
    location?: string;
    company_name?: string;
    company_website?: string;
    company_industry?: string;
    company_size?: string;
    company_role?: string;
    hiring_needs?: string[];
    project_budget_preference?: string;
    project_timeline_preference?: string;
    communication_preferences?: Record<string, unknown>;
    screening_preferences?: Record<string, unknown>;
    legal_preferences?: Record<string, unknown>;
    preferred_language: Language;
    cin_verified?: boolean;
    phone_verified?: boolean;
    onboarding_completed?: boolean;
    client_onboarding_completed?: boolean;
    freelancer_onboarding_completed?: boolean;
    is_online_for_messages?: boolean;
    created_at: string;
    updated_at: string;
}

export interface Skill {
    id: string;
    name_ar: string;
    name_fr: string;
    name_en: string;
    icon?: string;
}

export interface SkillEntry {
    name: string;
    level: 'beginner' | 'intermediate' | 'expert';
}

export function skillToEntry(skill: Skill, level: SkillEntry['level'] = 'intermediate'): SkillEntry {
    return { name: skill.id, level };
}

export function entryToSkill(entry: SkillEntry, skillsMap: Record<string, Skill>): Skill | null {
    return skillsMap[entry.name] || null;
}

export interface LanguageEntry {
    language: string;
    proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
}

export interface EducationEntry {
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
}

export interface FreelancerProfile {
    id: string;
    title?: string;
    hourly_rate?: number;
    availability?: Availability;
    skills: Skill[] | SkillEntry[];
    languages?: LanguageEntry[];
    education?: EducationEntry[];
    voice_intro_url?: string;
    years_experience?: number;
    tools?: string[];
    industries?: string[];
    portfolio_links?: string[];
    weekly_availability_hours?: number;
    revision_policy?: string;
    project_preferences?: Record<string, unknown>;
    completion_rate: number;
    response_time_hours?: number;
    repeat_clients: number;
    cin_verified: boolean;
    total_earnings: number;
    created_at: string;
    work_samples?: WorkSample[];
}

export interface PortfolioItem {
    id: string;
    freelancer_id: string;
    title: string;
    description?: string;
    client_name?: string;
    media_urls: string[];
    thumbnail_url?: string;
    project_url?: string;
    skills_used?: string[];
    tools_used?: string[];
    completion_date?: string;
    order_index?: number;
    category?: string;
    likes_count?: number;
    views_count?: number;
    created_at: string;
}

export type WorkSample = PortfolioItem;
