import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
    from: vi.fn(),
}));

const capturedSelects = vi.hoisted(() => ({
    freelancerProfiles: '',
    reviews: '',
    publicProfiles: '',
}));

vi.mock('@/lib/supabase', () => ({
    supabase: supabaseMock,
}));

vi.mock('@/lib/logger', () => ({
    logger: { error: vi.fn() },
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: null }),
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        language: 'en',
        t: {
            footer: { city: 'Tunis, Tunisia' },
            seo: {
                freelancerProfile: {
                    titleSuffix: 'Freelancer',
                    descriptionFallback: 'Freelancer profile',
                },
            },
            reviews: { client: 'Client' },
        },
        tx: (_key: string, _params?: Record<string, string>, fallback?: string) => fallback ?? _key,
    }),
}));

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
}));

vi.mock('@/components/common/SEO', () => ({
    default: () => null,
}));

vi.mock('@/components/settings/ReportButton', () => ({
    default: () => <div>Report</div>,
}));

vi.mock('@/components/freelancer/ContactModal', () => ({
    default: () => <div>Contact Modal</div>,
}));

vi.mock('@/components/freelancer/InviteToJobModal', () => ({
    default: () => <div>Invite To Job Modal</div>,
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({
        showToast: vi.fn(),
    }),
}));

vi.mock('@/components/common', () => ({
    OptimizedImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('@/components/freelancer/profile/ProfileHeader', () => ({
    default: ({ freelancer }: { freelancer: { full_name: string } }) => <div>{freelancer.full_name}</div>,
}));

vi.mock('@/components/freelancer/profile/AboutSection', () => ({
    default: () => <div>About</div>,
}));

vi.mock('@/components/freelancer/profile/SkillsSection', () => ({
    default: () => <div>Skills</div>,
}));

vi.mock('@/components/freelancer/profile/PortfolioSection', () => ({
    default: () => <div>Portfolio</div>,
}));

vi.mock('@/components/freelancer/profile/ReviewsSection', () => ({
    default: () => <div>Reviews</div>,
}));

vi.mock('@/components/freelancer/profile/ProfileSidebar', () => ({
    default: () => <div>Sidebar</div>,
}));

vi.mock('@/components/freelancer/profile/ProfileSkeleton', () => ({
    default: () => <div>Loading...</div>,
}));

import FreelancerProfile from '@/pages/FreelancerProfile';

describe('FreelancerProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedSelects.freelancerProfiles = '';
        capturedSelects.reviews = '';
        capturedSelects.publicProfiles = '';

        supabaseMock.from.mockImplementation((table: string) => {
            if (table === 'public_profiles') {
                return {
                    select: vi.fn((selection: string) => {
                        capturedSelects.publicProfiles = selection;
                        return {
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { id: 'freelancer-1' },
                                    error: null,
                                }),
                            }),
                        };
                    }),
                };
            }

            if (table === 'freelancer_profiles') {
                return {
                    select: vi.fn((selection: string) => {
                        capturedSelects.freelancerProfiles = selection;
                        return {
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'freelancer-1',
                                        title: 'Frontend Developer',
                                        skills: ['React'],
                                        availability: 'available',
                                        hourly_rate: 80,
                                        success_rate: 100,
                                        jobs_completed: 12,
                                        response_time_hours: 3,
                                        repeat_clients: 2,
                                        total_earnings: 5000,
                                        cin_verified: true,
                                        profile_views: 14,
                                        profile: {
                                            full_name: 'Safe Freelancer',
                                            username: 'safe-freelancer',
                                            avatar_url: null,
                                            bio: 'Public bio',
                                            location: 'Tunis',
                                            created_at: '2026-01-01T00:00:00.000Z',
                                            user_type: 'freelancer',
                                        },
                                    },
                                    error: null,
                                }),
                            }),
                        };
                    }),
                };
            }

            if (table === 'portfolio_items') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                };
            }

            if (table === 'reviews') {
                return {
                    select: vi.fn((selection: string) => {
                        capturedSelects.reviews = selection;
                        return {
                            eq: vi.fn().mockReturnValue({
                                order: vi.fn().mockResolvedValue({
                                    data: [
                                        {
                                            id: 'review-1',
                                            rating: 5,
                                            comment: 'Great work',
                                            created_at: '2026-02-01T00:00:00.000Z',
                                            skills_rating: 5,
                                            reviewer: {
                                                full_name: 'Client Reviewer',
                                                avatar_url: null,
                                            },
                                            contract: {
                                                job: {
                                                    title: 'Marketplace cleanup',
                                                },
                                            },
                                        },
                                    ],
                                    error: null,
                                }),
                            }),
                        };
                    }),
                };
            }

            throw new Error(`Unexpected table: ${table}`);
        });
    });

    it('uses public_profiles for username lookup and public reviewer/profile embedding', async () => {
        render(
            <MemoryRouter initialEntries={['/freelancer/safe-freelancer']}>
                <Routes>
                    <Route path="/freelancer/:usernameOrId" element={<FreelancerProfile />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Safe Freelancer')).toBeInTheDocument();
        });

        expect(supabaseMock.from).toHaveBeenCalledWith('public_profiles');
        expect(capturedSelects.publicProfiles).toBe('id');
        expect(capturedSelects.freelancerProfiles).toContain('profile:public_profiles!id');
        expect(capturedSelects.reviews).toContain('reviewer:public_profiles!reviewer_id');
        expect(capturedSelects.reviews).not.toContain('reviewer:profiles');
    });
});
