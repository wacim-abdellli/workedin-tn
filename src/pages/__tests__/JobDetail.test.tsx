import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n';

const queryMocks = vi.hoisted(() => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: queryMocks.useQuery,
    useMutation: queryMocks.useMutation,
    useQueryClient: queryMocks.useQueryClient,
}));

const authState = vi.hoisted(() => ({
    user: { id: 'freelancer-1' } as { id: string } | null,
    freelancerProfile: { skills: [{ name: 'React' }] },
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => authState,
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/logger', () => ({
    logger: { error: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ jobId: 'job-1' }),
        useNavigate: () => vi.fn(),
    };
});

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
    Footer: () => <div>Footer</div>,
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
        <button onClick={onClick}>{children}</button>
    ),
}));

vi.mock('@/components/proposals/ProposalModal', () => ({
    default: () => <div>Proposal modal</div>,
}));

vi.mock('@/components/jobs/SimilarJobCard', () => ({
    default: ({ job }: { job: { title: string } }) => <div>{job.title}</div>,
}));

vi.mock('@/components/common/OptimizedImage', () => ({
    default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('@/services/jobs', () => ({
    getJobById: vi.fn(),
    incrementJobViews: vi.fn(),
    getSimilarJobs: vi.fn(),
}));

vi.mock('@/services/profiles', () => ({
    getFavoriteStatus: vi.fn(),
    getClientStats: vi.fn(),
    toggleFavorite: vi.fn(),
}));

vi.mock('@/services/proposals', () => ({
    getMyProposal: vi.fn(),
    createProposal: vi.fn(),
    withdrawProposal: vi.fn(),
}));

import JobDetail from '@/pages/JobDetail';
import * as jobsService from '@/services/jobs';

function buildSafeJob(clientName: string) {
    return {
        id: 'job-1',
        client_id: 'client-1',
        title: 'Build a polished marketplace',
        description: 'We need a React expert to ship launch fixes.',
        category: 'development',
        job_type: 'fixed_price',
        budget_min: 500,
        budget_max: 900,
        experience_level: 'expert',
        required_skills: ['React'],
        visibility: 'public',
        status: 'open',
        proposals_count: 7,
        views_count: 21,
        posted_at: '2026-03-22T00:00:00.000Z',
        client: {
            id: 'client-1',
            full_name: clientName,
            avatar_url: null,
            location: 'Tunis',
            created_at: '2026-01-01T00:00:00.000Z',
        },
    };
}

describe('JobDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.user = { id: 'freelancer-1' };
        authState.freelancerProfile = { skills: [{ name: 'React' }] };
        queryMocks.useQueryClient.mockReturnValue({
            invalidateQueries: vi.fn(),
            setQueryData: vi.fn(),
        });
        queryMocks.useMutation.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        });
        queryMocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (!queryKey || queryKey.length === 0) {
                return { data: null, isLoading: false, error: null };
            }
            switch (queryKey[0]) {
                case 'job':
                    return {
                        data: buildSafeJob('Khedmetna Client'),
                        isLoading: false,
                    };
                case 'savedStatus':
                    return { data: false };
                case 'myProposal':
                    return { data: null };
                case 'similarJobs':
                    return { data: [{ id: 'job-2', title: 'API cleanup' }] };
                case 'clientStats':
                    return { data: { totalJobs: 5, totalSpent: 1200, rating: 4.8 } };
                default:
                    return { data: null };
            }
        });
    });

    it('renders the job detail page with job content and similar jobs', () => {
        render(
            <HelmetProvider>
                <I18nProvider>
                    <MemoryRouter>
                        <JobDetail />
                    </MemoryRouter>
                </I18nProvider>
            </HelmetProvider>
        );

        expect(screen.getByRole('heading', { name: 'Build a polished marketplace' })).toBeInTheDocument();
        expect(screen.getByText('We need a React expert to ship launch fixes.')).toBeInTheDocument();
        expect(screen.getByText('API cleanup')).toBeInTheDocument();
        expect(screen.getByText('Khedmetna Client')).toBeInTheDocument();
        expect(screen.getByText('Report This Job')).toBeInTheDocument();
    });

    it('renders the public client card from a safe client shape without email or phone', () => {
        queryMocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (!queryKey || queryKey.length === 0) {
                return { data: null, isLoading: false, error: null };
            }
            switch (queryKey[0]) {
                case 'job':
                    return {
                        data: buildSafeJob('Safe Public Client'),
                        isLoading: false,
                    };
                case 'savedStatus':
                    return { data: false };
                case 'myProposal':
                    return { data: null };
                case 'similarJobs':
                    return { data: [{ id: 'job-2', title: 'API cleanup' }] };
                case 'clientStats':
                    return { data: { totalJobs: 5, totalSpent: 1200, rating: 4.8 } };
                default:
                    return { data: null };
            }
        });

        render(
            <HelmetProvider>
                <I18nProvider>
                    <MemoryRouter>
                        <JobDetail />
                    </MemoryRouter>
                </I18nProvider>
            </HelmetProvider>
        );

        expect(screen.getByText('Safe Public Client')).toBeInTheDocument();
        expect(screen.getByText('Tunis')).toBeInTheDocument();
        expect(screen.queryByText(/@/)).not.toBeInTheDocument();
        expect(screen.queryByText(/\+216/)).not.toBeInTheDocument();
    });

    it('does not increment views for the job owner self-view', () => {
        authState.user = { id: 'client-1' };
        authState.freelancerProfile = null;

        render(
            <HelmetProvider>
                <I18nProvider>
                    <MemoryRouter>
                        <JobDetail />
                    </MemoryRouter>
                </I18nProvider>
            </HelmetProvider>
        );

        expect(jobsService.incrementJobViews).not.toHaveBeenCalled();
    });
});

