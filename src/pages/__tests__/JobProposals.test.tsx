import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryMocks = vi.hoisted(() => ({
    useMutation: vi.fn(),
}));

const routeMocks = vi.hoisted(() => ({
    navigate: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
    showToast: vi.fn(),
}));

const emailMocks = vi.hoisted(() => ({
    sendProposalAcceptedEmail: vi.fn(),
}));

const loggerMocks = vi.hoisted(() => ({
    error: vi.fn(),
}));

const supabaseState = vi.hoisted(() => {
    const state = {
        fromCalls: [] as string[],
        selectCalls: [] as Array<{ table: string; columns: string; options?: unknown }>,
        eqCalls: [] as Array<{ table: string; column: string; value: unknown }>,
        orderCalls: [] as Array<{ table: string; column: string; options?: unknown }>,
        rpcCalls: [] as Array<{ fn: string; params: unknown }>,
        tableResults: {} as Record<string, { data: unknown; error: unknown }>,
        rpcResults: {} as Record<string, { data: unknown; error: unknown }>,
    };

    const reset = () => {
        state.fromCalls = [];
        state.selectCalls = [];
        state.eqCalls = [];
        state.orderCalls = [];
        state.rpcCalls = [];
        state.tableResults = {
            jobs: {
                data: {
                    id: 'job-1',
                    title: 'Build landing page',
                    status: 'open',
                    budget_min: 300,
                    budget_max: 500,
                    job_type: 'fixed_price',
                    duration: '1 week',
                    created_at: '2026-04-07T00:00:00.000Z',
                    client_id: 'client-1',
                },
                error: null,
            },
            proposals: {
                data: [
                    {
                        id: 'proposal-1',
                        job_id: 'job-1',
                        freelancer_id: 'freelancer-1',
                        cover_letter: 'I can help',
                        bid_amount: 450,
                        estimated_duration: 7,
                        created_at: '2026-04-07T00:00:00.000Z',
                        status: 'new',
                        attachments: [],
                        freelancer: {
                            id: 'freelancer-1',
                            full_name: 'Freelancer One',
                            avatar_url: null,
                            location: 'Tunis',
                        },
                        freelancer_profile: {
                            title: 'Frontend Engineer',
                            average_rating: 4.8,
                            total_reviews: 12,
                            completed_jobs: 9,
                            success_rate: 97,
                        },
                    },
                ],
                error: null,
            },
            contracts: {
                data: null,
                error: { message: 'not found' },
            },
        };
        state.rpcResults = {
            hire_proposal_atomic: {
                data: { contract_id: 'contract-77' },
                error: null,
            },
            notify_proposal_accepted: {
                data: { ok: true },
                error: null,
            },
        };
    };

    return { state, reset };
});

vi.mock('@tanstack/react-query', () => ({
    useMutation: queryMocks.useMutation,
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => routeMocks.navigate,
    };
});

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({
        children,
        onClick,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
    }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('@/components/proposals/ProposalCard', () => ({
    default: ({
        proposal,
        onHire,
    }: {
        proposal: { id: string; freelancer?: { full_name?: string } };
        onHire: (proposalId: string) => void;
    }) => (
        <div>
            <span>{proposal.freelancer?.full_name}</span>
            <button onClick={() => onHire(proposal.id)}>Hire</button>
        </div>
    ),
}));

vi.mock('@/components/proposals/ProposalFiltersSidebar', () => ({
    default: () => <div>Filters</div>,
}));

vi.mock('@/components/proposals/JobSummaryCard', () => ({
    default: () => <div>Job summary</div>,
}));

vi.mock('@/components/proposals/ProposalDetailModal', () => ({
    default: () => null,
}));

vi.mock('@/components/ui/EmptyState', () => ({
    default: () => <div>Empty</div>,
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: toastMocks.showToast }),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'client-1' },
    }),
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: {
            jobProposals: {
                loadJobError: 'Failed to load job',
                loadProposalsError: 'Failed to load proposals',
                hireSuccess: 'Proposal hired successfully',
                hireError: 'Failed to hire proposal',
                defaultUser: 'Unknown user',
                defaultCountry: 'Unknown country',
                loading: 'Loading...',
                open: 'Open',
                proposals: 'proposals',
                interviews: 'interviews',
                shortlist: 'Shortlist',
                share: 'Share',
                edit: 'Edit',
                filterAndShow: 'Filter',
                allProposals: 'All proposals',
                new: 'New',
                archived: 'Archived',
                noProposals: 'No proposals',
                noProposalsDesc: 'No proposals yet',
                shareProject: 'Share project',
            },
        },
    }),
}));

vi.mock('@/lib/email', () => ({
    sendProposalAcceptedEmail: emailMocks.sendProposalAcceptedEmail,
}));

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}));

vi.mock('@/lib/supabase', () => {
    const builders = new Map<string, ReturnType<typeof createBuilder>>();

    function getTableResult(table: string) {
        return supabaseState.state.tableResults[table] ?? { data: null, error: null };
    }

    function createBuilder(table: string) {
        const builder = {
            select: vi.fn((columns: string, options?: unknown) => {
                supabaseState.state.selectCalls.push({ table, columns, options });
                return builder;
            }),
            eq: vi.fn((column: string, value: unknown) => {
                supabaseState.state.eqCalls.push({ table, column, value });
                return builder;
            }),
            in: vi.fn(() => builder),
            order: vi.fn((column: string, options?: unknown) => {
                supabaseState.state.orderCalls.push({ table, column, options });
                return builder;
            }),
            update: vi.fn(() => builder),
            single: vi.fn(async () => getTableResult(table)),
            then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(getTableResult(table))),
        };

        builders.set(table, builder);
        return builder;
    }

    return {
        supabase: {
            from: vi.fn((table: string) => {
                supabaseState.state.fromCalls.push(table);
                return builders.get(table) ?? createBuilder(table);
            }),
            rpc: vi.fn(async (fn: string, params: unknown) => {
                supabaseState.state.rpcCalls.push({ fn, params });
                return supabaseState.state.rpcResults[fn] ?? { data: null, error: null };
            }),
        },
        withTimeout: async <T,>(value: PromiseLike<T> | T) => await value,
    };
});

import JobProposals from '@/pages/JobProposals';

function renderJobProposals() {
    return render(
        <MemoryRouter initialEntries={['/client/jobs/job-1/proposals']}>
            <Routes>
                <Route path="/client/jobs/:jobId/proposals" element={<JobProposals />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('JobProposals', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        supabaseState.reset();
        queryMocks.useMutation.mockImplementation((options: {
            mutationFn: (proposalId: string) => Promise<unknown>;
            onSuccess?: (value: { id: string }) => void;
            onError?: (error: unknown) => void;
        }) => ({
            mutate: async (proposalId: string) => {
                try {
                    const result = await options.mutationFn(proposalId);
                    options.onSuccess?.(result as { id: string });
                } catch (error) {
                    options.onError?.(error);
                }
            },
            isPending: false,
        }));
    });

    it('loads proposal freelancer data from public_profiles and uses the narrow notify rpc on hire', async () => {
        renderJobProposals();

        await waitFor(() => {
            expect(screen.getAllByText(/Freelancer One/i)[0]).toBeInTheDocument();
        });

        expect(supabaseState.state.selectCalls).toEqual(expect.arrayContaining([
            expect.objectContaining({
                table: 'proposals',
                columns: expect.stringContaining('freelancer:public_profiles!freelancer_id'),
            }),
        ]));

        fireEvent.click(screen.getByRole('button', { name: 'Hire' }));

        await waitFor(() => {
            expect(supabaseState.state.rpcCalls).toEqual([
                {
                    fn: 'hire_proposal_atomic',
                    params: { p_proposal_id: 'proposal-1' },
                },
                {
                    fn: 'notify_proposal_accepted',
                    params: { p_contract_id: 'contract-77' },
                },
                {
                    fn: 'notify_unselected_proposals',
                    params: {
                        p_job_id: 'job-1',
                        p_accepted_proposal_id: 'proposal-1',
                        p_contract_id: 'contract-77',
                    },
                },
                {
                    fn: 'get_or_create_conversation',
                    params: {
                        user1: 'client-1',
                        user2: 'freelancer-1',
                        p_contract_id: 'contract-77',
                        p_scope: 'contract',
                    },
                },
            ]);
        });

        await screen.findByRole('button', { name: /Open Chat/i });
        fireEvent.click(screen.getByRole('button', { name: /Open Chat/i }));

        expect(supabaseState.state.rpcCalls.some((call) => call.fn === 'create_notification')).toBe(false);
        expect(toastMocks.showToast).toHaveBeenCalledWith('Proposal hired successfully', 'success');
        expect(routeMocks.navigate).toHaveBeenCalledWith(
            '/messages?contract=contract-77&with=freelancer-1',
            {
                state: {
                    contractId: 'contract-77',
                    otherUserId: 'freelancer-1',
                },
            }
        );

        await waitFor(() => {
            expect(emailMocks.sendProposalAcceptedEmail).toHaveBeenCalledWith('contract-77');
        });
    });
});
