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

// Skill Categories
export type SkillCategory = 
    | 'design'
    | 'development'
    | 'writing'
    | 'marketing'
    | 'video'
    | 'business'
    | 'data'
    | 'other';

export interface SkillWithCategory extends Skill {
    category: SkillCategory;
    isPrimary?: boolean; // Primary skills are most common
}

// Predefined Skills with Categories
export const PREDEFINED_SKILLS: SkillWithCategory[] = [
    // Design - Primary
    { id: '1', name_ar: 'تصميم جرافيكي', name_fr: 'Design graphique', name_en: 'Graphic Design', icon: 'palette', category: 'design', isPrimary: true },
    { id: '9', name_ar: 'تصميم UI/UX', name_fr: 'Design UI/UX', name_en: 'UI/UX Design', icon: 'smartphone', category: 'design', isPrimary: true },
    { id: '101', name_ar: 'تصميم شعارات', name_fr: 'Design de logos', name_en: 'Logo Design', icon: 'award', category: 'design', isPrimary: true },
    { id: '102', name_ar: 'تصميم هوية بصرية', name_fr: 'Identité visuelle', name_en: 'Brand Identity', icon: 'layers', category: 'design', isPrimary: true },
    
    // Design - Secondary
    { id: '103', name_ar: 'تصميم إعلانات', name_fr: 'Design publicitaire', name_en: 'Ad Design', icon: 'image', category: 'design' },
    { id: '104', name_ar: 'تصميم مواقع التواصل', name_fr: 'Design réseaux sociaux', name_en: 'Social Media Design', icon: 'share-2', category: 'design' },
    { id: '105', name_ar: 'رسم توضيحي', name_fr: 'Illustration', name_en: 'Illustration', icon: 'pen-tool', category: 'design' },
    { id: '106', name_ar: 'تصميم طباعة', name_fr: 'Design d\'impression', name_en: 'Print Design', icon: 'printer', category: 'design' },
    { id: '107', name_ar: 'تصميم عروض تقديمية', name_fr: 'Design de présentations', name_en: 'Presentation Design', icon: 'monitor', category: 'design' },
    { id: '108', name_ar: 'تصميم تغليف', name_fr: 'Design d\'emballage', name_en: 'Packaging Design', icon: 'package', category: 'design' },
    
    // Development - Primary
    { id: '2', name_ar: 'برمجة مواقع', name_fr: 'Développement web', name_en: 'Web Development', icon: 'code', category: 'development', isPrimary: true },
    { id: '10', name_ar: 'برمجة تطبيقات', name_fr: 'Développement mobile', name_en: 'Mobile Development', icon: 'tablet', category: 'development', isPrimary: true },
    { id: '201', name_ar: 'React/Next.js', name_fr: 'React/Next.js', name_en: 'React/Next.js', icon: 'code', category: 'development', isPrimary: true },
    { id: '202', name_ar: 'Node.js', name_fr: 'Node.js', name_en: 'Node.js', icon: 'server', category: 'development', isPrimary: true },
    
    // Development - Secondary
    { id: '203', name_ar: 'WordPress', name_fr: 'WordPress', name_en: 'WordPress', icon: 'globe', category: 'development' },
    { id: '204', name_ar: 'Shopify', name_fr: 'Shopify', name_en: 'Shopify', icon: 'shopping-cart', category: 'development' },
    { id: '205', name_ar: 'Python', name_fr: 'Python', name_en: 'Python', icon: 'code', category: 'development' },
    { id: '206', name_ar: 'PHP/Laravel', name_fr: 'PHP/Laravel', name_en: 'PHP/Laravel', icon: 'code', category: 'development' },
    { id: '207', name_ar: 'Flutter', name_fr: 'Flutter', name_en: 'Flutter', icon: 'smartphone', category: 'development' },
    { id: '208', name_ar: 'React Native', name_fr: 'React Native', name_en: 'React Native', icon: 'smartphone', category: 'development' },
    { id: '209', name_ar: 'قواعد بيانات', name_fr: 'Bases de données', name_en: 'Database', icon: 'database', category: 'development' },
    { id: '210', name_ar: 'API Integration', name_fr: 'Intégration API', name_en: 'API Integration', icon: 'link', category: 'development' },
    
    // Writing - Primary
    { id: '5', name_ar: 'كتابة محتوى', name_fr: 'Rédaction de contenu', name_en: 'Content Writing', icon: 'pen-tool', category: 'writing', isPrimary: true },
    { id: '3', name_ar: 'ترجمة', name_fr: 'Traduction', name_en: 'Translation', icon: 'languages', category: 'writing', isPrimary: true },
    { id: '301', name_ar: 'كتابة إعلانية', name_fr: 'Copywriting', name_en: 'Copywriting', icon: 'edit-3', category: 'writing', isPrimary: true },
    
    // Writing - Secondary
    { id: '302', name_ar: 'كتابة مقالات', name_fr: 'Rédaction d\'articles', name_en: 'Article Writing', icon: 'file-text', category: 'writing' },
    { id: '303', name_ar: 'كتابة تقنية', name_fr: 'Rédaction technique', name_en: 'Technical Writing', icon: 'book', category: 'writing' },
    { id: '304', name_ar: 'تدقيق لغوي', name_fr: 'Relecture', name_en: 'Proofreading', icon: 'check-circle', category: 'writing' },
    { id: '305', name_ar: 'كتابة سيناريو', name_fr: 'Écriture de scénario', name_en: 'Scriptwriting', icon: 'film', category: 'writing' },
    { id: '306', name_ar: 'كتابة SEO', name_fr: 'Rédaction SEO', name_en: 'SEO Writing', icon: 'search', category: 'writing' },
    
    // Marketing - Primary
    { id: '7', name_ar: 'تسويق رقمي', name_fr: 'Marketing digital', name_en: 'Digital Marketing', icon: 'megaphone', category: 'marketing', isPrimary: true },
    { id: '401', name_ar: 'إدارة مواقع التواصل', name_fr: 'Gestion réseaux sociaux', name_en: 'Social Media Management', icon: 'share-2', category: 'marketing', isPrimary: true },
    { id: '402', name_ar: 'SEO', name_fr: 'SEO', name_en: 'SEO', icon: 'trending-up', category: 'marketing', isPrimary: true },
    
    // Marketing - Secondary
    { id: '403', name_ar: 'إعلانات فيسبوك', name_fr: 'Publicités Facebook', name_en: 'Facebook Ads', icon: 'target', category: 'marketing' },
    { id: '404', name_ar: 'إعلانات جوجل', name_fr: 'Google Ads', name_en: 'Google Ads', icon: 'search', category: 'marketing' },
    { id: '405', name_ar: 'تسويق بالمحتوى', name_fr: 'Marketing de contenu', name_en: 'Content Marketing', icon: 'file-text', category: 'marketing' },
    { id: '406', name_ar: 'تسويق بالبريد', name_fr: 'Email marketing', name_en: 'Email Marketing', icon: 'mail', category: 'marketing' },
    { id: '407', name_ar: 'تحليلات', name_fr: 'Analytique', name_en: 'Analytics', icon: 'bar-chart-2', category: 'marketing' },
    
    // Video - Primary
    { id: '4', name_ar: 'مونتاج فيديو', name_fr: 'Montage vidéo', name_en: 'Video Editing', icon: 'video', category: 'video', isPrimary: true },
    { id: '8', name_ar: 'تصوير', name_fr: 'Photographie', name_en: 'Photography', icon: 'camera', category: 'video', isPrimary: true },
    { id: '501', name_ar: 'موشن جرافيك', name_fr: 'Motion design', name_en: 'Motion Graphics', icon: 'film', category: 'video', isPrimary: true },
    
    // Video - Secondary
    { id: '502', name_ar: 'تصوير فيديو', name_fr: 'Vidéographie', name_en: 'Videography', icon: 'video', category: 'video' },
    { id: '503', name_ar: 'أنيميشن', name_fr: 'Animation', name_en: 'Animation', icon: 'play', category: 'video' },
    { id: '504', name_ar: 'تعليق صوتي', name_fr: 'Voix off', name_en: 'Voice Over', icon: 'mic', category: 'video' },
    { id: '505', name_ar: 'معالجة صوت', name_fr: 'Édition audio', name_en: 'Audio Editing', icon: 'headphones', category: 'video' },
    
    // Business - Primary
    { id: '601', name_ar: 'مساعد افتراضي', name_fr: 'Assistant virtuel', name_en: 'Virtual Assistant', icon: 'user-check', category: 'business', isPrimary: true },
    { id: '602', name_ar: 'خدمة عملاء', name_fr: 'Service client', name_en: 'Customer Service', icon: 'headphones', category: 'business', isPrimary: true },
    { id: '603', name_ar: 'إدارة مشاريع', name_fr: 'Gestion de projet', name_en: 'Project Management', icon: 'briefcase', category: 'business', isPrimary: true },
    
    // Business - Secondary
    { id: '604', name_ar: 'استشارات أعمال', name_fr: 'Conseil en affaires', name_en: 'Business Consulting', icon: 'trending-up', category: 'business' },
    { id: '605', name_ar: 'محاسبة', name_fr: 'Comptabilité', name_en: 'Accounting', icon: 'dollar-sign', category: 'business' },
    { id: '606', name_ar: 'موارد بشرية', name_fr: 'Ressources humaines', name_en: 'Human Resources', icon: 'users', category: 'business' },
    { id: '607', name_ar: 'مبيعات', name_fr: 'Ventes', name_en: 'Sales', icon: 'shopping-bag', category: 'business' },
    
    // Data - Primary
    { id: '6', name_ar: 'إدخال بيانات', name_fr: 'Saisie de données', name_en: 'Data Entry', icon: 'database', category: 'data', isPrimary: true },
    { id: '701', name_ar: 'تحليل بيانات', name_fr: 'Analyse de données', name_en: 'Data Analysis', icon: 'bar-chart', category: 'data', isPrimary: true },
    
    // Data - Secondary
    { id: '702', name_ar: 'Excel', name_fr: 'Excel', name_en: 'Excel', icon: 'table', category: 'data' },
    { id: '703', name_ar: 'Power BI', name_fr: 'Power BI', name_en: 'Power BI', icon: 'pie-chart', category: 'data' },
    { id: '704', name_ar: 'بحث على الإنترنت', name_fr: 'Recherche web', name_en: 'Web Research', icon: 'search', category: 'data' },
    
    // Other
    { id: '801', name_ar: 'أخرى', name_fr: 'Autre', name_en: 'Other', icon: 'more-horizontal', category: 'other' },
];

// Tool Categories
export type ToolCategory = 
    | 'design'
    | 'development'
    | 'productivity'
    | 'video'
    | 'marketing'
    | 'other';

export interface Tool {
    id: string;
    name_ar: string;
    name_fr: string;
    name_en: string;
    category: ToolCategory;
    isPrimary?: boolean;
}

// Predefined Tools with Categories (120+ tools including languages & frameworks)
export const PREDEFINED_TOOLS: Tool[] = [
    // Design Tools - Primary
    { id: 't1', name_ar: 'Adobe Photoshop', name_fr: 'Adobe Photoshop', name_en: 'Adobe Photoshop', category: 'design', isPrimary: true },
    { id: 't2', name_ar: 'Adobe Illustrator', name_fr: 'Adobe Illustrator', name_en: 'Adobe Illustrator', category: 'design', isPrimary: true },
    { id: 't3', name_ar: 'Figma', name_fr: 'Figma', name_en: 'Figma', category: 'design', isPrimary: true },
    { id: 't4', name_ar: 'Adobe XD', name_fr: 'Adobe XD', name_en: 'Adobe XD', category: 'design', isPrimary: true },
    { id: 't5', name_ar: 'Sketch', name_fr: 'Sketch', name_en: 'Sketch', category: 'design', isPrimary: true },
    { id: 't6', name_ar: 'Canva', name_fr: 'Canva', name_en: 'Canva', category: 'design', isPrimary: true },
    
    // Design Tools - Secondary
    { id: 't7', name_ar: 'Adobe InDesign', name_fr: 'Adobe InDesign', name_en: 'Adobe InDesign', category: 'design' },
    { id: 't8', name_ar: 'CorelDRAW', name_fr: 'CorelDRAW', name_en: 'CorelDRAW', category: 'design' },
    { id: 't9', name_ar: 'Affinity Designer', name_fr: 'Affinity Designer', name_en: 'Affinity Designer', category: 'design' },
    { id: 't10', name_ar: 'Procreate', name_fr: 'Procreate', name_en: 'Procreate', category: 'design' },
    { id: 't11', name_ar: 'Blender', name_fr: 'Blender', name_en: 'Blender', category: 'design' },
    { id: 't12', name_ar: 'Cinema 4D', name_fr: 'Cinema 4D', name_en: 'Cinema 4D', category: 'design' },
    
    // Development - Languages & Core (Primary)
    { id: 't100', name_ar: 'HTML', name_fr: 'HTML', name_en: 'HTML', category: 'development', isPrimary: true },
    { id: 't101', name_ar: 'CSS', name_fr: 'CSS', name_en: 'CSS', category: 'development', isPrimary: true },
    { id: 't102', name_ar: 'JavaScript', name_fr: 'JavaScript', name_en: 'JavaScript', category: 'development', isPrimary: true },
    { id: 't103', name_ar: 'TypeScript', name_fr: 'TypeScript', name_en: 'TypeScript', category: 'development', isPrimary: true },
    { id: 't104', name_ar: 'React', name_fr: 'React', name_en: 'React', category: 'development', isPrimary: true },
    { id: 't105', name_ar: 'Next.js', name_fr: 'Next.js', name_en: 'Next.js', category: 'development', isPrimary: true },
    { id: 't106', name_ar: 'Node.js', name_fr: 'Node.js', name_en: 'Node.js', category: 'development', isPrimary: true },
    { id: 't107', name_ar: 'Python', name_fr: 'Python', name_en: 'Python', category: 'development', isPrimary: true },
    { id: 't108', name_ar: 'PHP', name_fr: 'PHP', name_en: 'PHP', category: 'development', isPrimary: true },
    { id: 't109', name_ar: 'Java', name_fr: 'Java', name_en: 'Java', category: 'development', isPrimary: true },
    
    // Development - Frameworks & Libraries (Secondary)
    { id: 't110', name_ar: 'Vue.js', name_fr: 'Vue.js', name_en: 'Vue.js', category: 'development' },
    { id: 't111', name_ar: 'Angular', name_fr: 'Angular', name_en: 'Angular', category: 'development' },
    { id: 't112', name_ar: 'Svelte', name_fr: 'Svelte', name_en: 'Svelte', category: 'development' },
    { id: 't113', name_ar: 'Laravel', name_fr: 'Laravel', name_en: 'Laravel', category: 'development' },
    { id: 't114', name_ar: 'Django', name_fr: 'Django', name_en: 'Django', category: 'development' },
    { id: 't115', name_ar: 'Flask', name_fr: 'Flask', name_en: 'Flask', category: 'development' },
    { id: 't116', name_ar: 'Express.js', name_fr: 'Express.js', name_en: 'Express.js', category: 'development' },
    { id: 't117', name_ar: 'FastAPI', name_fr: 'FastAPI', name_en: 'FastAPI', category: 'development' },
    { id: 't118', name_ar: 'Spring Boot', name_fr: 'Spring Boot', name_en: 'Spring Boot', category: 'development' },
    { id: 't119', name_ar: 'Ruby on Rails', name_fr: 'Ruby on Rails', name_en: 'Ruby on Rails', category: 'development' },
    
    // Development - Mobile
    { id: 't120', name_ar: 'React Native', name_fr: 'React Native', name_en: 'React Native', category: 'development' },
    { id: 't121', name_ar: 'Flutter', name_fr: 'Flutter', name_en: 'Flutter', category: 'development' },
    { id: 't122', name_ar: 'Swift', name_fr: 'Swift', name_en: 'Swift', category: 'development' },
    { id: 't123', name_ar: 'Kotlin', name_fr: 'Kotlin', name_en: 'Kotlin', category: 'development' },
    { id: 't124', name_ar: 'Ionic', name_fr: 'Ionic', name_en: 'Ionic', category: 'development' },
    
    // Development - CSS Frameworks
    { id: 't130', name_ar: 'Tailwind CSS', name_fr: 'Tailwind CSS', name_en: 'Tailwind CSS', category: 'development' },
    { id: 't131', name_ar: 'Bootstrap', name_fr: 'Bootstrap', name_en: 'Bootstrap', category: 'development' },
    { id: 't132', name_ar: 'Material UI', name_fr: 'Material UI', name_en: 'Material UI', category: 'development' },
    { id: 't133', name_ar: 'Sass/SCSS', name_fr: 'Sass/SCSS', name_en: 'Sass/SCSS', category: 'development' },
    
    // Development - Databases
    { id: 't140', name_ar: 'MySQL', name_fr: 'MySQL', name_en: 'MySQL', category: 'development' },
    { id: 't141', name_ar: 'PostgreSQL', name_fr: 'PostgreSQL', name_en: 'PostgreSQL', category: 'development' },
    { id: 't142', name_ar: 'MongoDB', name_fr: 'MongoDB', name_en: 'MongoDB', category: 'development' },
    { id: 't143', name_ar: 'Redis', name_fr: 'Redis', name_en: 'Redis', category: 'development' },
    { id: 't144', name_ar: 'Firebase', name_fr: 'Firebase', name_en: 'Firebase', category: 'development' },
    { id: 't145', name_ar: 'Supabase', name_fr: 'Supabase', name_en: 'Supabase', category: 'development' },
    
    // Development - Tools & DevOps
    { id: 't150', name_ar: 'Git', name_fr: 'Git', name_en: 'Git', category: 'development' },
    { id: 't151', name_ar: 'GitHub', name_fr: 'GitHub', name_en: 'GitHub', category: 'development' },
    { id: 't152', name_ar: 'GitLab', name_fr: 'GitLab', name_en: 'GitLab', category: 'development' },
    { id: 't153', name_ar: 'Docker', name_fr: 'Docker', name_en: 'Docker', category: 'development' },
    { id: 't154', name_ar: 'Kubernetes', name_fr: 'Kubernetes', name_en: 'Kubernetes', category: 'development' },
    { id: 't155', name_ar: 'Jenkins', name_fr: 'Jenkins', name_en: 'Jenkins', category: 'development' },
    { id: 't156', name_ar: 'VS Code', name_fr: 'VS Code', name_en: 'VS Code', category: 'development' },
    { id: 't157', name_ar: 'Postman', name_fr: 'Postman', name_en: 'Postman', category: 'development' },
    { id: 't158', name_ar: 'Webpack', name_fr: 'Webpack', name_en: 'Webpack', category: 'development' },
    { id: 't159', name_ar: 'Vite', name_fr: 'Vite', name_en: 'Vite', category: 'development' },
    
    // Development - Cloud & Hosting
    { id: 't160', name_ar: 'AWS', name_fr: 'AWS', name_en: 'AWS', category: 'development' },
    { id: 't161', name_ar: 'Azure', name_fr: 'Azure', name_en: 'Azure', category: 'development' },
    { id: 't162', name_ar: 'Google Cloud', name_fr: 'Google Cloud', name_en: 'Google Cloud', category: 'development' },
    { id: 't163', name_ar: 'Vercel', name_fr: 'Vercel', name_en: 'Vercel', category: 'development' },
    { id: 't164', name_ar: 'Netlify', name_fr: 'Netlify', name_en: 'Netlify', category: 'development' },
    { id: 't165', name_ar: 'Heroku', name_fr: 'Heroku', name_en: 'Heroku', category: 'development' },
    
    // Development - CMS & E-commerce
    { id: 't170', name_ar: 'WordPress', name_fr: 'WordPress', name_en: 'WordPress', category: 'development' },
    { id: 't171', name_ar: 'Shopify', name_fr: 'Shopify', name_en: 'Shopify', category: 'development' },
    { id: 't172', name_ar: 'WooCommerce', name_fr: 'WooCommerce', name_en: 'WooCommerce', category: 'development' },
    { id: 't173', name_ar: 'Webflow', name_fr: 'Webflow', name_en: 'Webflow', category: 'development' },
    { id: 't174', name_ar: 'Strapi', name_fr: 'Strapi', name_en: 'Strapi', category: 'development' },
    
    // Video Tools - Primary
    { id: 't40', name_ar: 'Adobe Premiere Pro', name_fr: 'Adobe Premiere Pro', name_en: 'Adobe Premiere Pro', category: 'video', isPrimary: true },
    { id: 't41', name_ar: 'Adobe After Effects', name_fr: 'Adobe After Effects', name_en: 'Adobe After Effects', category: 'video', isPrimary: true },
    { id: 't42', name_ar: 'Final Cut Pro', name_fr: 'Final Cut Pro', name_en: 'Final Cut Pro', category: 'video', isPrimary: true },
    { id: 't43', name_ar: 'DaVinci Resolve', name_fr: 'DaVinci Resolve', name_en: 'DaVinci Resolve', category: 'video', isPrimary: true },
    
    // Video Tools - Secondary
    { id: 't44', name_ar: 'Camtasia', name_fr: 'Camtasia', name_en: 'Camtasia', category: 'video' },
    { id: 't45', name_ar: 'CapCut', name_fr: 'CapCut', name_en: 'CapCut', category: 'video' },
    { id: 't46', name_ar: 'iMovie', name_fr: 'iMovie', name_en: 'iMovie', category: 'video' },
    { id: 't47', name_ar: 'Audacity', name_fr: 'Audacity', name_en: 'Audacity', category: 'video' },
    { id: 't48', name_ar: 'Adobe Audition', name_fr: 'Adobe Audition', name_en: 'Adobe Audition', category: 'video' },
    { id: 't49', name_ar: 'Logic Pro', name_fr: 'Logic Pro', name_en: 'Logic Pro', category: 'video' },
    
    // Marketing Tools - Primary
    { id: 't50', name_ar: 'Google Analytics', name_fr: 'Google Analytics', name_en: 'Google Analytics', category: 'marketing', isPrimary: true },
    { id: 't51', name_ar: 'Google Ads', name_fr: 'Google Ads', name_en: 'Google Ads', category: 'marketing', isPrimary: true },
    { id: 't52', name_ar: 'Facebook Ads', name_fr: 'Facebook Ads', name_en: 'Facebook Ads', category: 'marketing', isPrimary: true },
    { id: 't53', name_ar: 'Mailchimp', name_fr: 'Mailchimp', name_en: 'Mailchimp', category: 'marketing', isPrimary: true },
    { id: 't54', name_ar: 'HubSpot', name_fr: 'HubSpot', name_en: 'HubSpot', category: 'marketing', isPrimary: true },
    
    // Marketing Tools - Secondary
    { id: 't55', name_ar: 'SEMrush', name_fr: 'SEMrush', name_en: 'SEMrush', category: 'marketing' },
    { id: 't56', name_ar: 'Ahrefs', name_fr: 'Ahrefs', name_en: 'Ahrefs', category: 'marketing' },
    { id: 't57', name_ar: 'Hootsuite', name_fr: 'Hootsuite', name_en: 'Hootsuite', category: 'marketing' },
    { id: 't58', name_ar: 'Buffer', name_fr: 'Buffer', name_en: 'Buffer', category: 'marketing' },
    { id: 't59', name_ar: 'Later', name_fr: 'Later', name_en: 'Later', category: 'marketing' },
    { id: 't60', name_ar: 'Salesforce', name_fr: 'Salesforce', name_en: 'Salesforce', category: 'marketing' },
    
    // Productivity Tools - Primary
    { id: 't70', name_ar: 'Microsoft Office', name_fr: 'Microsoft Office', name_en: 'Microsoft Office', category: 'productivity', isPrimary: true },
    { id: 't71', name_ar: 'Google Workspace', name_fr: 'Google Workspace', name_en: 'Google Workspace', category: 'productivity', isPrimary: true },
    { id: 't72', name_ar: 'Notion', name_fr: 'Notion', name_en: 'Notion', category: 'productivity', isPrimary: true },
    { id: 't73', name_ar: 'Trello', name_fr: 'Trello', name_en: 'Trello', category: 'productivity', isPrimary: true },
    { id: 't74', name_ar: 'Asana', name_fr: 'Asana', name_en: 'Asana', category: 'productivity', isPrimary: true },
    { id: 't75', name_ar: 'Slack', name_fr: 'Slack', name_en: 'Slack', category: 'productivity', isPrimary: true },
    
    // Productivity Tools - Secondary
    { id: 't76', name_ar: 'Monday.com', name_fr: 'Monday.com', name_en: 'Monday.com', category: 'productivity' },
    { id: 't77', name_ar: 'ClickUp', name_fr: 'ClickUp', name_en: 'ClickUp', category: 'productivity' },
    { id: 't78', name_ar: 'Airtable', name_fr: 'Airtable', name_en: 'Airtable', category: 'productivity' },
    { id: 't79', name_ar: 'Evernote', name_fr: 'Evernote', name_en: 'Evernote', category: 'productivity' },
    { id: 't80', name_ar: 'Zoom', name_fr: 'Zoom', name_en: 'Zoom', category: 'productivity' },
    { id: 't81', name_ar: 'Microsoft Teams', name_fr: 'Microsoft Teams', name_en: 'Microsoft Teams', category: 'productivity' },
    { id: 't82', name_ar: 'Jira', name_fr: 'Jira', name_en: 'Jira', category: 'productivity' },
    
    // Other
    { id: 't99', name_ar: 'أخرى', name_fr: 'Autre', name_en: 'Other', category: 'other' },
];
