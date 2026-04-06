export type UserType = 'freelancer' | 'client' | 'both';
export type AccountMode = 'freelancer' | 'client';
export type AccountStatus = 'active' | 'suspended' | 'archived';
export type Language = 'ar' | 'fr' | 'en';
export type JobStatus = 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type MatchStatus = 'suggested' | 'accepted' | 'rejected';
export type ContractStatus = 'active' | 'completed' | 'cancelled' | 'disputed';
export type PaymentStatus = 'pending' | 'paid' | 'released';
export type PaymentMethod = 'bank_transfer' | 'd17' | 'cash';

// ============================================
// ATTACHMENT & FILE TYPES
// ============================================

export interface Attachment {
    id?: string;
    url: string;
    name: string;
    type: string; // MIME type
    size: number | string; // bytes (number) or formatted string (e.g., "2.5KB")
    uploaded_at?: string;
    uploaded_by?: string;
}

export interface MessageAttachment extends Attachment {
    message_id?: string;
}

export interface ProposalAttachment extends Attachment {
    proposal_id?: string;
}

export interface Profile {
    active_mode?: AccountMode | null;
    id: string;
    user_type: UserType | null; // ✅ FIXED: Allow null (database allows NULL)
    email?: string; // ✅ ADDED: For Settings.tsx compatibility
    is_admin?: boolean;
    account_status?: AccountStatus;
    username?: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    preferred_language: Language;
    cin_verified?: boolean;
    onboarding_completed?: boolean;
    client_onboarding_completed?: boolean;
    freelancer_onboarding_completed?: boolean;
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

/** DB-compatible skill entry — matches the JSONB format in freelancer_profiles.skills */
export interface SkillEntry {
    name: string;  // skill ID (matches Skill.id)
    level: 'beginner' | 'intermediate' | 'expert';
}

/** Convert a frontend Skill to a DB SkillEntry */
export function skillToEntry(skill: Skill, level: SkillEntry['level'] = 'intermediate'): SkillEntry {
    return { name: skill.id, level };
}

/** Convert a DB SkillEntry back to a frontend Skill using a lookup map */
export function entryToSkill(entry: SkillEntry, skillsMap: Record<string, Skill>): Skill | null {
    return skillsMap[entry.name] || null;
}

export type Availability = 'available' | 'busy' | 'offline';

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
    completion_rate: number;
    response_time_hours?: number;
    repeat_clients: number;
    cin_verified: boolean;
    // is_available: boolean; // ❌ REMOVED: Redundant with availability enum
    total_earnings: number;
    created_at: string;
    work_samples?: WorkSample[];
}

export interface PortfolioItem {
    id: string;
    freelancer_id: string;
    title: string;
    description?: string;
    media_urls: string[];
    thumbnail_url?: string;
    project_url?: string;
    skills_used?: string[];
    completion_date?: string;
    category?: string;
    likes_count?: number;
    views_count?: number;
    created_at: string;
}

// Deprecated alias for backward compatibility if needed, but better to use PortfolioItem
export type WorkSample = PortfolioItem;

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

    // Legacy fields being maintained for compatibility or UI convenience
    budget?: number; // Can represent fixed price or max budget
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
    amount: number; // ✅ ADDED: Match database
    escrow_amount?: number; // ✅ ADDED
    escrow_funded?: boolean; // ✅ ADDED
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

export interface Message {
    id: string;
    contract_id: string;
    sender_id: string;
    receiver_id: string; // ✅ ADDED: Required by schema
    content: string;
    attachments?: MessageAttachment[]; // ✅ FIXED: Proper type instead of any[]
    file_url?: string; // Deprecated, kept for backward compatibility
    is_read?: boolean;
    created_at: string;
    sender?: Profile;
    receiver?: Profile;
}

// Tunisian Governorates
export const GOVERNORATES = [
    'تونس',
    'أريانة',
    'بن عروس',
    'منوبة',
    'نابل',
    'زغوان',
    'بنزرت',
    'باجة',
    'جندوبة',
    'الكاف',
    'سليانة',
    'سوسة',
    'المنستير',
    'المهدية',
    'صفاقس',
    'القيروان',
    'القصرين',
    'سيدي بوزيد',
    'قابس',
    'مدنين',
    'تطاوين',
    'قفصة',
    'توزر',
    'قبلي',
] as const;

export type Governorate = typeof GOVERNORATES[number];

// Predefined Skills
export const PREDEFINED_SKILLS: Skill[] = [
    { id: '1', name_ar: 'تصميم جرافيكي', name_fr: 'Design graphique', name_en: 'Graphic Design', icon: 'palette' },
    { id: '2', name_ar: 'برمجة مواقع', name_fr: 'Développement web', name_en: 'Web Development', icon: 'code' },
    { id: '3', name_ar: 'ترجمة', name_fr: 'Traduction', name_en: 'Translation', icon: 'languages' },
    { id: '4', name_ar: 'مونتاج فيديو', name_fr: 'Montage vidéo', name_en: 'Video Editing', icon: 'video' },
    { id: '5', name_ar: 'كتابة محتوى', name_fr: 'Rédaction de contenu', name_en: 'Content Writing', icon: 'pen-tool' },
    { id: '6', name_ar: 'إدخال بيانات', name_fr: 'Saisie de données', name_en: 'Data Entry', icon: 'database' },
    { id: '7', name_ar: 'تسويق رقمي', name_fr: 'Marketing digital', name_en: 'Digital Marketing', icon: 'megaphone' },
    { id: '8', name_ar: 'تصوير', name_fr: 'Photographie', name_en: 'Photography', icon: 'camera' },
    { id: '9', name_ar: 'تصميم UI/UX', name_fr: 'Design UI/UX', name_en: 'UI/UX Design', icon: 'smartphone' },
    { id: '10', name_ar: 'برمجة تطبيقات', name_fr: 'Développement mobile', name_en: 'Mobile Development', icon: 'tablet' },
];
