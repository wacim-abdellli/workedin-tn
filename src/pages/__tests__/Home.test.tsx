import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseAnonMock = vi.hoisted(() => ({
    from: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    supabaseAnon: supabaseAnonMock,
}));

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
    Footer: () => <div>Footer</div>,
}));

vi.mock('@/components/common/SEO', () => ({
    default: () => null,
    SEO_CONFIG: { home: {} },
}));

vi.mock('@/components/home/HeroSection', () => ({
    default: ({ stats }: { stats: { freelancers: number } }) => <div>Freelancers: {stats.freelancers}</div>,
}));

vi.mock('@/components/home/ValuePropositions', () => ({ default: () => <div>Value props</div> }));
vi.mock('@/components/home/HowItWorksSection', () => ({ default: () => <div>How it works</div> }));
vi.mock('@/components/home/CategoriesSection', () => ({ default: () => <div>Categories</div> }));
vi.mock('@/components/home/LiveCounterSection', () => ({
    default: ({ stats }: { stats: { jobs: number; contracts: number } }) => (
        <div>Jobs {stats.jobs} Contracts {stats.contracts}</div>
    ),
}));
vi.mock('@/components/home/TestimonialsSection', () => ({ default: () => <div>Testimonials</div> }));
vi.mock('@/components/home/CTASection', () => ({ default: () => <div>CTA</div> }));

import Home from '@/pages/Home';

function createCountQuery(count: number) {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count }),
    };
}

describe('Home', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        supabaseAnonMock.from.mockImplementation((table: string) => {
            if (table === 'jobs') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn()
                        .mockReturnValueOnce({
                            eq: vi.fn().mockResolvedValue({ count: 11 }),
                        }),
                };
            }

            if (table === 'public_profiles') {
                return createCountQuery(7);
            }

            if (table === 'contracts') {
                return {
                    select: vi.fn().mockResolvedValue({ count: 3 }),
                };
            }

            throw new Error(`Unexpected table: ${table}`);
        });
    });

    it('uses public_profiles for guest freelancer stats instead of raw profiles', async () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Freelancers: 7')).toBeInTheDocument();
        });

        expect(supabaseAnonMock.from).toHaveBeenCalledWith('public_profiles');
        expect(supabaseAnonMock.from).not.toHaveBeenCalledWith('profiles');
    });
});
