import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

const mockMutate = vi.fn();
const mockShowToast = vi.fn();
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
    useToast: () => ({ showToast: mockShowToast }),
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

const mockInChain = vi.fn();

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            in: mockInChain,
        })),
        channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
        removeChannel: vi.fn(),
    },
}));

import ReportsTab from '../ReportsTab';

const baseReport = {
    id: 'r1',
    reported_type: 'job' as const,
    reported_id: 'j1',
    reason: 'Spam content',
    status: 'pending' as const,
    created_at: '2024-06-01',
    reporter: { full_name: 'Reporter A', email: 'r@test.com' },
};

describe('ReportsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseQueryClient.mockReturnValue({ invalidateQueries: mockInvalidateQueries });
        mockMutate.mockReset();
        mockShowToast.mockReset();
        mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
        mockInChain.mockResolvedValue({ data: [] });
    });

    // ─── Loading / Error / Empty ───────────────────────────────────────

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

    // ─── Report count badge ───────────────────────────────────────────

    it('shows report count badge when reports exist', () => {
        mockUseQuery.mockReturnValue({
            data: [{ ...baseReport }], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    // ─── Resolved targets via useEffect ───────────────────────────────

    it('resolves target for user type', async () => {
        mockInChain.mockResolvedValue({ data: [{ id: 'u1', full_name: 'Target User', email: 'target@test.com' }] });
        mockUseQuery.mockReturnValue({
            data: [{ ...baseReport, reported_type: 'user', reported_id: 'u1' }], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        await waitFor(() => {
            expect(screen.getAllByText('Target User').length).toBeGreaterThanOrEqual(1);
        });
        await waitFor(() => {
            expect(screen.getAllByText('target@test.com').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('resolves target for job type', async () => {
        mockInChain.mockResolvedValue({ data: [{ id: 'j1', title: 'Job Title Here' }] });
        mockUseQuery.mockReturnValue({
            data: [{ ...baseReport }], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        await waitFor(() => {
            expect(screen.getAllByText('Job Title Here').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('resolves target for proposal type', async () => {
        mockInChain.mockResolvedValue({
            data: [{ id: 'p1', cover_letter: 'Proposal text', job: { title: 'Design Job' }, freelancer: { full_name: 'Freelancer X' } }],
        });
        mockUseQuery.mockReturnValue({
            data: [{ ...baseReport, reported_type: 'proposal', reported_id: 'p1' }], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        await waitFor(() => {
            expect(screen.getAllByText('Proposal by Freelancer X').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('For job: Design Job').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('handles fetchTargets error gracefully', async () => {
        mockInChain.mockRejectedValue(new Error('Network error'));
        mockUseQuery.mockReturnValue({
            data: [{ ...baseReport, reported_type: 'user', reported_id: 'u1' }], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        await waitFor(() => {
            expect(screen.getAllByText('Loading details...').length).toBeGreaterThanOrEqual(1);
        });
    });

    // ─── Rendering report content ─────────────────────────────────────

    it('renders report with reporter info and reason', () => {
        mockUseQuery.mockReturnValue({ data: [{ ...baseReport }], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        expect(screen.getAllByText(/Reporter A/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Spam content/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Flagged Content/)).toBeInTheDocument();
    });

    it('renders type badge', () => {
        mockUseQuery.mockReturnValue({ data: [{ ...baseReport }], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        const badges = screen.getAllByText('job');
        expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    // ─── Action buttons ───────────────────────────────────────────────

    it('shows Review and Dismiss for pending reports', () => {
        mockUseQuery.mockReturnValue({ data: [{ ...baseReport }], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        expect(screen.getAllByText('Review').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Dismiss').length).toBeGreaterThanOrEqual(1);
    });

    it('shows Reopen for reviewed reports', () => {
        mockUseQuery.mockReturnValue({
            data: [{ ...baseReport, status: 'reviewed' }], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        expect(screen.getAllByText('Reopen').length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText('Review')).not.toBeInTheDocument();
    });

    it('calls mutate with reviewed on Review click', () => {
        mockUseQuery.mockReturnValue({ data: [{ ...baseReport }], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        fireEvent.click(screen.getAllByText('Review')[0]);
        expect(mockMutate).toHaveBeenCalledWith({ id: 'r1', status: 'reviewed' });
    });

    it('calls mutate with dismissed on Dismiss click', () => {
        mockUseQuery.mockReturnValue({ data: [{ ...baseReport }], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        fireEvent.click(screen.getAllByText('Dismiss')[0]);
        expect(mockMutate).toHaveBeenCalledWith({ id: 'r1', status: 'dismissed' });
    });

    it('calls mutate with pending on Reopen click', () => {
        mockUseQuery.mockReturnValue({
            data: [{ ...baseReport, status: 'reviewed' }], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        fireEvent.click(screen.getAllByText('Reopen')[0]);
        expect(mockMutate).toHaveBeenCalledWith({ id: 'r1', status: 'pending' });
    });

    it('disables buttons when mutation is pending', () => {
        mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: true });
        mockUseQuery.mockReturnValue({ data: [{ ...baseReport }], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        expect(screen.getAllByRole('button', { disabled: true }).length).toBeGreaterThanOrEqual(1);
    });

    // ─── Mutation lifecycle (success / error) ─────────────────────────

    it('shows success toast on mutation success', () => {
        mockUseMutation.mockImplementation(({ onSuccess }: { onSuccess: () => void }) => {
            onSuccess();
            return { mutate: mockMutate, isPending: false };
        });
        mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        expect(mockShowToast).toHaveBeenCalledWith('Report status updated', 'success');
    });

    it('invalidates queries on mutation success', () => {
        mockUseMutation.mockImplementation(({ onSuccess }: { onSuccess: () => void }) => {
            onSuccess();
            return { mutate: mockMutate, isPending: false };
        });
        mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-reports'] });
    });

    it('shows error toast on mutation error', () => {
        mockUseMutation.mockImplementation(({ onError }: { onError: (err: Error) => void }) => {
            onError(new Error('Update failed'));
            return { mutate: mockMutate, isPending: false };
        });
        mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        expect(mockShowToast).toHaveBeenCalledWith('Update failed', 'error');
    });

    // ─── Status badges ────────────────────────────────────────────────

    it('renders all status badges with correct labels', () => {
        mockUseQuery.mockReturnValue({
            data: [
                { ...baseReport, id: 'r1', status: 'pending', reason: 'S1' },
                { ...baseReport, id: 'r2', status: 'reviewed', reason: 'S2' },
                { ...baseReport, id: 'r3', status: 'dismissed', reason: 'S3' },
            ], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Reviewed').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Dismissed').length).toBeGreaterThanOrEqual(1);
    });

    // ─── Date formatting ──────────────────────────────────────────────

    it('renders date in en-US locale', () => {
        mockUseQuery.mockReturnValue({ data: [{ ...baseReport }], isLoading: false, isError: false, refetch: vi.fn() });
        render(<ReportsTab />);
        const dates = screen.getAllByText(/6\/1\/2024/);
        expect(dates.length).toBeGreaterThanOrEqual(1);
    });

    // ─── Edge cases ───────────────────────────────────────────────────

    it('renders em-dash for missing reporter', () => {
        mockUseQuery.mockReturnValue({
            data: [{ ...baseReport, reporter: null }], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('renders empty reporter email gracefully', () => {
        mockUseQuery.mockReturnValue({
            data: [{ ...baseReport, reporter: { full_name: 'Reporter B', email: '' } }], isLoading: false, isError: false, refetch: vi.fn(),
        });
        render(<ReportsTab />);
        expect(screen.getAllByText('Reporter B').length).toBeGreaterThanOrEqual(1);
    });

    // ─── Refresh button ───────────────────────────────────────────────

    it('triggers refetch on Refresh click', () => {
        const refetch = vi.fn();
        mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch });
        render(<ReportsTab />);
        fireEvent.click(screen.getByText('Refresh'));
        expect(refetch).toHaveBeenCalled();
    });
});