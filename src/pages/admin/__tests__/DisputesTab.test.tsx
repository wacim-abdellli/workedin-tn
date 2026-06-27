import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

const mockUseQuery = vi.hoisted(() => vi.fn());
const mockUseMutation = vi.hoisted(() => vi.fn());
const mockUseQueryClient = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
    useQuery: mockUseQuery,
    useMutation: mockUseMutation,
    useQueryClient: mockUseQueryClient,
    QueryClient: vi.fn(),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

let mockLanguage = 'en';

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: {},
        tx: (_k: string, _p?: Record<string, string>, fallback?: string) => fallback ?? _k,
        get language() {
            return mockLanguage;
        },
        dir: 'ltr',
    }),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn(),
    },
}));

vi.mock('@/services/dhmad', () => ({
    releaseEscrow: vi.fn(),
    refundEscrow: vi.fn(),
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({ children, onClick, disabled, variant }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: string }) => (
        <button onClick={onClick} disabled={disabled} data-variant={variant}>{children}</button>
    ),
}));

vi.mock('lucide-react', () => ({
    AlertTriangle: () => <span />,
    RefreshCw: () => <span />,
    Check: () => <span />,
    X: () => <span />,
    Eye: () => <span />,
    Loader2: () => <span data-testid="loader" />,
}));

vi.mock('../adminTheme', () => ({
    adminPanelClass: 'mock-panel',
    adminPillClass: (tone: string) => `pill-${tone}`,
    adminInsetClass: 'mock-inset',
}));

import DisputesTab from '../DisputesTab';

const mockDispute = {
    id: 'd1',
    contract_id: 'c1',
    opened_at: '2024-06-01T12:00:00Z',
    reason: 'Freelancer did not deliver',
    status: 'open',
    evidence_captured_at: '2024-06-01T13:00:00Z',
    evidence_snapshot: { milestones: { total: 3, completed: 2 }, messages: { attachment_message_count: 5, protected_event_count: 1 } },
    contract: { id: 'c1', amount: 500, dhmad_escrow_id: 'esc-1', job: { title: 'Website design' } },
    opener: { full_name: 'Client A', email: 'client@test.com' },
};

describe('DisputesTab', () => {
    let mutationVariables: any = null;

    beforeEach(() => {
        vi.clearAllMocks();
        mockLanguage = 'en';
        mutationVariables = null;
        mockUseQueryClient.mockReturnValue({ invalidateQueries: mockInvalidateQueries });
        mockUseMutation.mockImplementation(({ mutationFn, onSuccess }) => {
            return {
                mutate: async (variables: any, options?: any) => {
                    mutationVariables = variables;
                    try {
                        await mutationFn(variables);
                        if (onSuccess) onSuccess();
                        if (options?.onSettled) options.onSettled();
                    } catch (err) {
                        // ignore
                    }
                },
                isPending: false,
            };
        });
    });

    it('shows loading state', () => {
        mockUseQuery.mockReturnValue({ data: [], isLoading: true, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('shows empty state when no disputes', () => {
        mockUseQuery.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByText('No open disputes')).toBeInTheDocument();
    });

    it('renders dispute details', () => {
        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByText('Website design')).toBeInTheDocument();
        expect(screen.getByText(/Opened by/)).toBeInTheDocument();
        expect(screen.getByText(/Client A/)).toBeInTheDocument();
        expect(screen.getByText(/Freelancer did not deliver/)).toBeInTheDocument();
    });

    it('shows evidence captured badge', () => {
        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByText('Evidence captured')).toBeInTheDocument();
    });

    it('shows evidence missing badge when not captured', () => {
        const noEvidence = { ...mockDispute, evidence_captured_at: null };
        mockUseQuery.mockReturnValue({ data: [noEvidence], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByText('Evidence missing')).toBeInTheDocument();
    });

    it('shows milestones count', () => {
        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByText(/2\/3/)).toBeInTheDocument();
    });

    it('shows evidence files count', () => {
        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByText(/Evidence files/)).toBeInTheDocument();
    });

    it('shows protected events count', () => {
        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByText(/Protected events/)).toBeInTheDocument();
    });

    it('renders resolution buttons', () => {
        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByText('For freelancer')).toBeInTheDocument();
        expect(screen.getByText('For client')).toBeInTheDocument();
    });

    it('shows contract amount', () => {
        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        expect(screen.getByText(/500/)).toBeInTheDocument();
    });

    it('handles refresh action', () => {
        const refetch = vi.fn();
        mockUseQuery.mockReturnValue({ data: [], isLoading: false, refetch });
        render(<DisputesTab />);
        fireEvent.click(screen.getByText('Refresh'));
        expect(refetch).toHaveBeenCalled();
    });

    it('handles view contract action', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);
        fireEvent.click(screen.getByText('View contract'));
        expect(openSpy).toHaveBeenCalledWith('/contracts/c1', '_blank');
        openSpy.mockRestore();
    });

    it('resolves dispute for freelancer with escrow', async () => {
        const { releaseEscrow } = await import('@/services/dhmad');
        const { supabase } = await import('@/lib/supabase');
        
        vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);

        fireEvent.click(screen.getByText('For freelancer'));

        await waitFor(() => {
            expect(releaseEscrow).toHaveBeenCalledWith('esc-1', 'c1');
            expect(supabase.rpc).toHaveBeenCalledWith('resolve_dispute', {
                p_dispute_id: 'd1',
                p_resolution: 'resolved_freelancer',
                p_admin_note: 'Dispute resolved for freelancer',
            });
            expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-disputes'] });
        });
    });

    it('resolves dispute for client with escrow', async () => {
        const { refundEscrow } = await import('@/services/dhmad');
        const { supabase } = await import('@/lib/supabase');
        
        vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);

        fireEvent.click(screen.getByText('For client'));

        await waitFor(() => {
            expect(refundEscrow).toHaveBeenCalledWith('esc-1', 'c1', 'Dispute resolved for client');
            expect(supabase.rpc).toHaveBeenCalledWith('resolve_dispute', {
                p_dispute_id: 'd1',
                p_resolution: 'resolved_client',
                p_admin_note: 'Dispute resolved for client',
            });
            expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-disputes'] });
        });
    });

    it('resolves dispute without escrow ID', async () => {
        const { releaseEscrow } = await import('@/services/dhmad');
        const { supabase } = await import('@/lib/supabase');
        
        vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

        const disputeNoEscrow = {
            ...mockDispute,
            contract: { ...mockDispute.contract, dhmad_escrow_id: undefined },
        };

        mockUseQuery.mockReturnValue({ data: [disputeNoEscrow], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);

        fireEvent.click(screen.getByText('For freelancer'));

        await waitFor(() => {
            expect(releaseEscrow).not.toHaveBeenCalled();
            expect(supabase.rpc).toHaveBeenCalled();
        });
    });

    it('handles RPC error when resolving dispute', async () => {
        const { supabase } = await import('@/lib/supabase');
        vi.mocked(supabase.rpc).mockResolvedValue({ error: new Error('RPC error') });

        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });
        render(<DisputesTab />);

        fireEvent.click(screen.getByText('For freelancer'));
        
        await waitFor(() => {
            expect(supabase.rpc).toHaveBeenCalled();
        });
    });

    it('renders French and Arabic localized text', () => {
        mockUseQuery.mockReturnValue({ data: [mockDispute], isLoading: false, refetch: vi.fn() });

        mockLanguage = 'fr';
        const { rerender } = render(<DisputesTab />);
        expect(screen.getByText('Litiges ouverts')).toBeInTheDocument();
        expect(screen.getByText('Actualiser')).toBeInTheDocument();

        mockLanguage = 'ar';
        rerender(<DisputesTab />);
        expect(screen.getByText('نزاعات مفتوحة')).toBeInTheDocument();
        expect(screen.getByText('تحديث')).toBeInTheDocument();
    });

    it('executes queryFn and fetches open disputes from supabase', async () => {
        let queryFnToTest: any = null;
        mockUseQuery.mockImplementation((options: any) => {
            queryFnToTest = options.queryFn;
            return { data: [], isLoading: false, refetch: vi.fn() };
        });

        render(<DisputesTab />);

        expect(queryFnToTest).toBeDefined();

        const { supabase } = await import('@/lib/supabase');
        
        const builder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [mockDispute], error: null }),
        };
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await queryFnToTest();
        expect(supabase.from).toHaveBeenCalledWith('disputes');
        expect(builder.select).toHaveBeenCalled();
        expect(builder.eq).toHaveBeenCalledWith('status', 'open');
        expect(builder.order).toHaveBeenCalledWith('opened_at', { ascending: true });
        expect(result).toEqual([mockDispute]);
    });

    it('handles queryFn supabase error path', async () => {
        let queryFnToTest: any = null;
        mockUseQuery.mockImplementation((options: any) => {
            queryFnToTest = options.queryFn;
            return { data: [], isLoading: false, refetch: vi.fn() };
        });

        render(<DisputesTab />);

        const { supabase } = await import('@/lib/supabase');
        const builder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('Query error') }),
        };
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(queryFnToTest()).rejects.toThrow('Query error');
    });
});
