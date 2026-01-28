/**
 * Filter-related type definitions
 */

/** Job board filter state */
export interface JobFilters {
    search: string;
    categories: string[];
    jobType: string | null;
    budgetRange: string;
    experienceLevels: string[];
    postedWithin: string;
    sortBy: string;
}

/** Freelancer search filters */
export interface FreelancerFilters {
    search: string;
    categories: string[];
    skills: string[];
    minRating: number;
    rateRange: [number, number];
    availableOnly: boolean;
    verifiedOnly: boolean;
}

/** Filter sidebar props type */
export interface FilterSidebarFilters {
    categories: string[];
    jobType: string | null;
    budgetRange: string;
    experienceLevels: string[];
    postedWithin: string;
    budgetMin?: number;
    budgetMax?: number;
}

/** Admin dashboard tab type */
export type AdminTab = 'overview' | 'users' | 'jobs' | 'reports' | 'settings';

/** Icon component type from Lucide */
export type LucideIconType = React.ComponentType<{
    className?: string;
    size?: number | string;
}>;

/** Stat card props for admin dashboard */
export interface StatCardProps {
    icon: LucideIconType;
    label: string;
    value: string | number;
    trend?: number;
    color: string;
}

/** Tab definition for admin dashboard */
export interface AdminTabDefinition {
    id: AdminTab;
    label: string;
    icon: LucideIconType;
}
