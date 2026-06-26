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

vi.mock('@/services/reports', () => ({
    getReports: vi.fn(),
    updateReportStatus: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'admin-1' } }),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({ children, onClick, disabled, variant }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: string }) => (
        <button onClick={onClick} disabled={disabled} data-variant={variant}>{children}</button>
    ),
}));

vi.mock('@/components/common/SkeletonList', () => ({
    default: ({ count }: { count: number }) => <div data-testid="skeleton" data-count={count} />,
}));

vi.mock('@/components/ui/ErrorBoundary', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

vi.mock('lucide-react', () => ({
    Flag: () => <span />,
    RefreshCw: () => <span />,
    Check: () => <span />,
    X: () => <span />,
}));

vi.mock('../adminTheme', () => ({
    adminPanelClass: 'mock-panel',
    adminPillClass: (tone: string) => `pill-${tone}`,
    adminTableHeadClass: 'mock-th',
    adminTableRowClass: 'mock-tr',
    adminTableShellClass: 'mock-shell',
}));

vi.mock('../AdminSelect', () => ({
    default: ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
        <select value={value} onChange={(e) => onChange(e.target.value)} data-testid="status-filter">
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    ),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [] }) })) },
}));

import ReportsTab from '../ReportsTab';

describe('ReportsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseQueryClient.mockReturnValue({ invalidateQueries: mockInvalidateQueries });
        mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    });

    it('shows loading skeleton while fetching', () => {
        mockUseQuery.mockReturnValue({ data: [], isLoading: true, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('shows error state', () => {
        mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: true, refetch: vi.fn() });
        render(<ReportsTab />);
        expect(screen.getByText('Failed to load reports')).toBeInTheDocument();
    });

    it('shows empty state when no reports', () => {
        mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        expect(screen.getByText('No reports found')).toBeInTheDocument();
    });

    it('renders report content', () => {
        const mockReports = [
            { id: 'r1', reported_type: 'job', reported_id: 'j1', reason: 'Spam content', status: 'pending', created_at: '2024-06-01', reporter: { full_name: 'Reporter A', email: 'r@test.com' } },
        ];
        mockUseQuery.mockReturnValue({ data: mockReports, isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        const reporters = screen.getAllByText(/Reporter A/);
        expect(reporters.length).toBeGreaterThanOrEqual(1);
        const reasons = screen.getAllByText(/Spam content/);
        expect(reasons.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Flagged Content/)).toBeInTheDocument();
    });

    it('shows action buttons for pending reports', () => {
        mockUseQuery.mockReturnValue({
            data: [{ id: 'r1', reported_type: 'job', reported_id: 'j1', reason: 'Spam', status: 'pending', created_at: '2024-06-01', reporter: { full_name: 'R', email: 'r@t.com' } }],
            isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        const reviews = screen.getAllByText('Review');
        expect(reviews.length).toBeGreaterThanOrEqual(1);
        const dismisses = screen.getAllByText('Dismiss');
        expect(dismisses.length).toBeGreaterThanOrEqual(1);
    });

    it('shows reopen for non-pending reports', () => {
        mockUseQuery.mockReturnValue({
            data: [{ id: 'r1', reported_type: 'job', reported_id: 'j1', reason: 'Spam', status: 'reviewed', created_at: '2024-06-01', reporter: { full_name: 'R', email: 'r@t.com' } }],
            isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        const reopens = screen.getAllByText('Reopen');
        expect(reopens.length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText('Review')).not.toBeInTheDocument();
    });
});
