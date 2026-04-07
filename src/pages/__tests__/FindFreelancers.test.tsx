import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getFreelancersMock = vi.fn();

vi.mock('@/services/profiles', () => ({
    getFreelancers: (...args: unknown[]) => getFreelancersMock(...args),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'freelancer-self' },
        profile: { user_type: 'freelancer' },
        freelancerProfile: { availability: 'available' },
    }),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: {
            findFreelancers: {
                searchPlaceholder: 'Search freelancers',
                availableNow: 'Available now',
                availableNowDesc: 'Only show available talent',
                category: 'Category',
                skills: 'Skills',
                hourlyRate: 'Hourly rate',
                verifiedOnly: 'Verified only',
                verifiedOnlyDesc: 'Show verified freelancers',
                clearFilters: 'Clear filters',
                hero: {
                    badge: 'Top talent',
                    title: 'Find',
                    titleHighlight: 'freelancers',
                    subtitle: 'Browse safe public profiles.',
                    subtitleDesktop: '',
                },
                heroStats: {
                    talentPool: 'Talent Pool',
                    verified: 'Verified',
                    fastReplies: 'Fast Replies',
                },
                filterToggle: 'Filters',
                filterTitle: 'Filters',
                clearAll: 'Clear all',
                sort: {
                    label: 'Sort',
                    recommended: 'Recommended',
                    rating: 'Rating',
                    priceLow: 'Price low',
                },
                resultsCount: '{{count}} results',
                activeFilters: 'active',
                resultStats: {
                    availableNow: 'Available now',
                    averageRate: 'Average rate',
                    topRating: 'Top rating',
                },
                noResults: {
                    title: 'No freelancers',
                    description: 'Try a different search',
                    action: 'Reset',
                },
                save: 'Save',
                saved: 'Saved',
            },
        },
        tx: (_key: string, _params?: Record<string, string>, fallback?: string) => fallback ?? _key,
    }),
}));

vi.mock('@/components/common/SEO', () => ({
    default: () => null,
    SEO_CONFIG: { findFreelancers: {} },
}));

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
        <button onClick={onClick}>{children}</button>
    ),
}));

vi.mock('@/components/common', () => ({
    SkeletonList: () => <div>Loading list</div>,
    SkeletonProfile: () => <div>Loading profile</div>,
}));

vi.mock('@/components/ui/EmptyState', () => ({
    default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/components/freelancers/FreelancerCard', () => ({
    default: ({ freelancer }: { freelancer: { name: string } }) => <div>{freelancer.name}</div>,
}));

vi.mock('@/lib/marketplaceAccess', () => ({
    canSaveFreelancer: () => ({ allowed: true }),
    getAccessMessage: () => 'Access denied',
}));

import FindFreelancers from '@/pages/FindFreelancers';

describe('FindFreelancers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getFreelancersMock.mockResolvedValue({
            data: [
                {
                    id: 'freelancer-other',
                    full_name: 'Other Freelancer',
                    avatar_url: null,
                    location: 'Tunis',
                    freelancer_profiles: [
                        {
                            title: 'React Expert',
                            hourly_rate: 50,
                            skills: ['React'],
                            success_rate: 98,
                            jobs_completed: 12,
                            cin_verified: true,
                            availability: 'available',
                        },
                    ],
                },
            ],
            error: null,
        });
    });

    it('uses the safe discovery service with excludeId set to the logged-in freelancer', async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <FindFreelancers />
                </MemoryRouter>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(getFreelancersMock).toHaveBeenCalledWith({ search: undefined, excludeId: 'freelancer-self' });
        });

        await waitFor(() => {
            expect(screen.getByText('Other Freelancer')).toBeInTheDocument();
        });
        expect(screen.queryByText('freelancer-self')).not.toBeInTheDocument();
    });
});
