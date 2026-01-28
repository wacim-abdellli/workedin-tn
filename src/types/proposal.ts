/**
 * Proposal-related type definitions
 */

/** Status of a proposal */
export type ProposalStatus = 'new' | 'shortlisted' | 'rejected' | 'archived' | 'hired';

/** Attachment on a proposal */
export interface ProposalAttachment {
    name: string;
    size: string;
    url?: string;
}

/** Freelancer info within a proposal */
export interface ProposalFreelancer {
    full_name: string;
    title: string;
    avatar_url: string | null;
    country: string;
    rating: number;
    reviews_count: number;
    jobs_completed: number;
    success_rate: number;
    is_verified: boolean;
    is_online: boolean;
    bio: string;
}

/** A proposal submitted by a freelancer for a job */
export interface Proposal {
    id: string;
    job_id?: string;
    freelancer_id?: string;
    freelancer: ProposalFreelancer;
    cover_letter: string;
    bid_amount: number;
    duration: number;
    created_at: string;
    status: ProposalStatus;
    attachments: ProposalAttachment[];
}

/** Filters for proposal listing */
export interface ProposalFilters {
    status?: ProposalStatus;
    minBid?: number;
    maxBid?: number;
    minRating?: number;
    verifiedOnly?: boolean;
    sortBy?: 'newest' | 'oldest' | 'lowest_bid' | 'highest_bid' | 'rating';
}

/** Job stats summary */
export interface JobStats {
    proposals: number;
    interviewing: number;
    shortlisted: number;
    hired: number;
}

/** Job summary for proposal context */
export interface JobSummary {
    title: string;
    status: string;
    budget_min: number;
    budget_max: number;
    job_type: 'fixed_price' | 'hourly';
    duration: string;
    created_at: string;
    stats: JobStats;
}

/** Extended freelancer data for profiles */
export interface ExtendedFreelancerData {
    id: string;
    full_name: string;
    username?: string;
    title: string | null;
    avatar_url: string | null;
    cover_url?: string | null;
    bio: string;
    location: string;
    joined_at: string;
    hourly_rate?: number;
    is_available?: boolean;
    voice_intro_url?: string;
    skills?: Array<{ id: string; name: string }>;
    stats: {
        rating: number;
        reviews_count: number;
        jobs_completed: number;
        success_rate: number;
        on_time_delivery: number;
    };
    portfolio: PortfolioItemData[];
    reviews: ReviewData[];
}

/** Portfolio item display data */
export interface PortfolioItemData {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    category: string;
    media_urls: string[];
}

/** Review display data */
export interface ReviewData {
    id: string;
    client_name: string;
    client_avatar?: string;
    rating: number;
    comment: string;
    created_at: string;
    job_title: string;
    skills_rating?: Record<string, number>;
}
