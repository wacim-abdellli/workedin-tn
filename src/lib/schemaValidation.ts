/**
 * Schema validation helpers to prevent database schema mismatches
 * Ensures only valid columns are sent to Supabase tables
 */
import { logger } from './logger';

// Profile table allowed fields (based on schema_v2.sql)
const PROFILE_ALLOWED_FIELDS = [
    'id',
    'user_type',
    'active_mode',
    'full_name',
    'phone',
    'avatar_url',
    'avatar_url_client',
    'avatar_url_freelancer',
    'bio',
    'location',
    'company_name',
    'company_website',
    'company_industry',
    'company_size',
    'company_role',
    'hiring_needs',
    'project_budget_preference',
    'project_timeline_preference',
    'communication_preferences',
    'screening_preferences',
    'legal_preferences',
    'is_admin',
    'is_super_admin',
    'account_status',
    'deleted_at',
    'deleted_by',
    'deletion_reason',
    'preferred_language',
    'onboarding_completed',
    'client_onboarding_completed',
    'freelancer_onboarding_completed',
    'is_online_for_messages',
    'cin_verified',
    'phone_verified',
    'username',
    'created_at',
    'updated_at',
] as const;

// Freelancer profile allowed fields
const FREELANCER_PROFILE_ALLOWED_FIELDS = [
    'id',
    'title',
    'skills',
    'hourly_rate',
    'availability',
    'bio',
    'portfolio_items_count',
    'total_earnings',
    'completed_jobs',
    'success_rate',
    'average_rating',
    'total_reviews',
    'languages',
    'education',
    'voice_intro_url',
    'years_experience',
    'tools',
    'industries',
    'portfolio_links',
    'weekly_availability_hours',
    'revision_policy',
    'project_preferences',
    'created_at',
    'updated_at',
] as const;

// Fields that should NEVER be in profiles table (managed by Supabase Auth)
const BLOCKED_FIELDS = ['email', 'password', 'password_hash'] as const;

/**
 * Sanitizes profile data before database insert/update
 * Removes fields that don't exist in schema and logs warnings
 */
export const sanitizeProfileData = <T extends Record<string, any>>(data: T): Partial<T> => {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        // Block auth fields
        if (BLOCKED_FIELDS.includes(key as any)) {
            logger.warn(`⚠️ [SchemaValidation] Blocked field "${key}" - managed by Supabase Auth, not profiles table`);
            continue;
        }

        // Only include allowed fields
        if (PROFILE_ALLOWED_FIELDS.includes(key as any)) {
            sanitized[key] = value;
        } else {
            logger.warn(`⚠️ [SchemaValidation] Unknown field "${key}" - not in profiles schema`);
        }
    }

    return sanitized as Partial<T>;
};

/**
 * Sanitizes freelancer profile data before database insert/update
 */
export const sanitizeFreelancerProfileData = <T extends Record<string, any>>(data: T): Partial<T> => {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        if (FREELANCER_PROFILE_ALLOWED_FIELDS.includes(key as any)) {
            sanitized[key] = value;
        } else {
            logger.warn(`⚠️ [SchemaValidation] Unknown field "${key}" - not in freelancer_profiles schema`);
        }
    }

    return sanitized as Partial<T>;
};

/**
 * Type guard to check if a field is allowed in profiles
 */
export const isValidProfileField = (field: string): boolean => {
    return PROFILE_ALLOWED_FIELDS.includes(field as any);
};

/**
 * Type guard to check if a field is blocked (auth-managed)
 */
export const isBlockedField = (field: string): boolean => {
    return BLOCKED_FIELDS.includes(field as any);
};
