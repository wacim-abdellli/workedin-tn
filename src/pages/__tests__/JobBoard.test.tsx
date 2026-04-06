import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryMocks = vi.hoisted(() => ({
    useInfiniteQuery: vi.fn(),
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
    useInfiniteQuery: queryMocks.useInfiniteQuery,
    useQuery: queryMocks.useQuery,
    useMutation: queryMocks.useMutation,
    useQueryClient: queryMocks.useQueryClient,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: null }),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: {
            jobs: {
                sort: {
                    newest: 'Newest',
                    budgetHigh: 'Budget high',
                    budgetLow: 'Budget low',
                    proposalsHigh: 'Proposals high',
                    proposalsLow: 'Proposals low',
                },
                searchPlaceholder: 'Search jobs',
                filters: {
                    title: 'Filters',
                    budget: { title: 'Budget' },
                    jobType: { hourly: 'Hourly' },
                },
                stats: { availableJobs: 'jobs available' },
                empty: {
                    title: 'No jobs',
                    subtitle: 'Try changing filters',
                    action: 'Clear filters',
                },
                loadMore: 'Load more',
                save: 'Save',
                unsave: 'Saved',
                savedJobs: {
                    title: 'Saved jobs',
                    viewAll: 'View all',
                },
            },
            auth: { login: 'Login' },
        },
        tx: (_key: string, _params?: Record<string, string>, fallback?: string) => fallback ?? _key,
        language: 'en',
        dir: 'ltr',
    }),
}));

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
    Footer: () => <div>Footer</div>,
}));

vi.mock('@/components/jobs', () => ({
    FilterSidebar: () => <div>Filters</div>,
    JobCard: ({ job, onClick }: { job: { title: string }; onClick: () => void }) => (
        <button onClick={onClick}>{job.title}</button>
    ),
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
}));

vi.mock('@/components/common/SEO', () => ({
    default: () => null,
    SEO_CONFIG: { jobs: {} },
}));

vi.mock('@/components/common', () => ({
    SkeletonCard: () => <div>Loading</div>,
}));

vi.mock('@/components/common/EmptyState', () => ({
    default: ({ title }: { title: string }) => <div>{title}</div>,
}));

import JobBoard from '@/pages/JobBoard';

describe('JobBoard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryMocks.useQueryClient.mockReturnValue({
            invalidateQueries: vi.fn(),
        });
        queryMocks.useMutation.mockReturnValue({
            mutate: vi.fn(),
        });
        queryMocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'categoryCounts') {
                return { data: { design: 2, development: 5 } };
            }

            return { data: [], enabled: false };
        });
        queryMocks.useInfiniteQuery.mockReturnValue({
            data: {
                pages: [
                    {
                        count: 12,
                        data: [
                            {
                                id: 'job-1',
                                title: 'Frontend rebuild',
                                description: 'Ship a better job board',
                                job_type: 'fixed_price',
                                budget_min: 100,
                                budget_max: 300,
                                required_skills: ['React'],
                                proposals_count: 2,
                                posted_at: '2026-03-20T00:00:00.000Z',
                            },
                        ],
                    },
                ],
            },
            fetchNextPage: vi.fn(),
            hasNextPage: true,
            isFetching: false,
            isFetchingNextPage: false,
        });
    });

    it('renders fetched jobs and requests the next page from Load more', () => {
        const fetchNextPage = vi.fn();
        queryMocks.useInfiniteQuery.mockReturnValue({
            data: {
                pages: [
                    {
                        count: 12,
                        data: [
                            {
                                id: 'job-1',
                                title: 'Frontend rebuild',
                                description: 'Ship a better job board',
                                job_type: 'fixed_price',
                                budget_min: 100,
                                budget_max: 300,
                                required_skills: ['React'],
                                proposals_count: 2,
                                posted_at: '2026-03-20T00:00:00.000Z',
                            },
                        ],
                    },
                ],
            },
            fetchNextPage,
            hasNextPage: true,
            isFetching: false,
            isFetchingNextPage: false,
        });

        render(
            <MemoryRouter>
                <JobBoard />
            </MemoryRouter>
        );

        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Frontend rebuild' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
        expect(fetchNextPage).toHaveBeenCalledTimes(1);
    });
});
