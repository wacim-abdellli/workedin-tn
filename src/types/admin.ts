export type AdminUserMode = 'client' | 'freelancer';

export interface AdminUserRow {
    id: string;
    full_name: string | null;
    email: string | null;
    user_type: string | null;
    active_mode: AdminUserMode | null;
    cin_verified: boolean | null;
    is_admin: boolean | null;
    created_at: string;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    type: string;
    status: string;
    last_active: string;
    active_mode: AdminUserMode | null;
    cin_verified: boolean;
    is_admin: boolean;
}

export interface AdminJobClientRow {
    full_name: string | null;
    email: string | null;
}

export interface AdminJobRow {
    id: string;
    title: string;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    hourly_rate: number | null;
    created_at: string;
    client: AdminJobClientRow | AdminJobClientRow[] | null;
}

export interface AdminJob {
    id: string;
    title: string;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    hourly_rate: number | null;
    created_at: string;
    client: {
        full_name: string;
        email: string;
    } | null;
}

export type IdentityVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface IdentityVerificationProfile {
    full_name: string | null;
    email: string | null;
    phone?: string | null;
    location?: string | null;
    avatar_url?: string | null;
}

export interface IdentityVerification {
    id: string;
    user_id: string;
    cin_number?: string | null;
    document_type: string;
    front_image_url: string | null;
    back_image_url: string | null;
    selfie_url: string | null;
    status: IdentityVerificationStatus;
    submitted_at: string;
    profile: IdentityVerificationProfile | null;
}

export interface IdentityVerificationPrimaryRow {
    id: string;
    user_id: string;
    cin_number?: string | null;
    cin_front_url: string | null;
    cin_back_url: string | null;
    selfie_url: string | null;
    status: IdentityVerificationStatus;
    submitted_at: string;
    profile: IdentityVerificationProfile | IdentityVerificationProfile[] | null;
}

export interface IdentityVerificationLegacyRow {
    id: string;
    user_id: string;
    cin_number?: string | null;
    document_type: string | null;
    front_image_url: string | null;
    back_image_url: string | null;
    status: IdentityVerificationStatus;
    submitted_at: string;
    profile: IdentityVerificationProfile | IdentityVerificationProfile[] | null;
}
