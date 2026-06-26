import { render, screen } from '@testing-library/react';
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

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: {},
        tx: (_k: string, _p?: Record<string, string>, fallback?: string) => fallback ?? _k,
        language: 'en',
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
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseQueryClient.mockReturnValue({ invalidateQueries: mockInvalidateQueries });
        mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
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
});
