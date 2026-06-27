import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import OverviewTab from '../OverviewTab';

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: {},
        tx: (_k: string, _p?: Record<string, string>, fallback?: string) => fallback ?? _k,
        language: 'en',
        dir: 'ltr',
    }),
}));

vi.mock('lucide-react', () => ({
    Users: () => <span />,
    Briefcase: () => <span />,
    DollarSign: () => <span />,
    FileText: () => <span />,
    Activity: () => <span />,
    UserPlus: () => <span />,
    Shield: () => <span />,
    Flag: () => <span />,
    Loader2: () => <span data-testid="loader" />,
}));

vi.mock('../adminTheme', () => ({
    adminPanelClass: 'mock-panel',
    adminPillClass: (tone: string) => `pill-${tone}`,
}));

interface TableDataEntry { count?: number; data?: any[] }

const _tableData = vi.hoisted(() => new Map<string, TableDataEntry>());

function makeBuilder(entry: TableDataEntry) {
    let isHeadQuery = false;
    const builder: any = {
        select: vi.fn((_cols?: string, opts?: { head?: boolean }) => {
            isHeadQuery = opts?.head === true;
            return builder;
        }),
        then: (resolve: (v: any) => void) => {
            if (isHeadQuery) {
                resolve({ count: entry.count ?? 0, error: null });
            } else {
                resolve({ data: entry.data ?? [], error: null });
            }
        },
        catch: () => {},
        in: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        gte: vi.fn(() => builder),
        order: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        not: vi.fn(() => builder),
        lt: vi.fn(() => builder),
        is: vi.fn(() => builder),
    };
    return builder;
}

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn((table: string) => {
            const entry = _tableData.get(table) || { data: [], count: 0 };
            return makeBuilder(entry);
        }),
    },
}));

vi.mock('@/lib/supabaseWithRetry', () => ({
    supabaseWithRetry: vi.fn((fn: () => any) => fn()),
}));

function renderWithClient(ui: React.ReactElement) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('OverviewTab (real query)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        _tableData.clear();
        _tableData.set('profiles', { count: 150 });
        _tableData.set('jobs', { count: 42 });
        _tableData.set('contracts', { count: 18 });
        _tableData.set('identity_verifications', { count: 7 });
        _tableData.set('disputes', { count: 0 });
    });

    afterEach(() => {
        cleanup();
    });

    it('renders stat cards with real queryFn counts', async () => {
        renderWithClient(<OverviewTab />);
        expect(await screen.findByText('Total users')).toBeInTheDocument();
        expect(screen.getByText('Active jobs')).toBeInTheDocument();
        expect(screen.getByText('Active contracts')).toBeInTheDocument();
        expect(screen.getByText('Revenue (TND)')).toBeInTheDocument();
        expect(screen.getAllByText('150').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('42').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('18').length).toBeGreaterThanOrEqual(1);
    });

    it('renders all data sections populated', async () => {
        _tableData.set('identity_verifications', {
            count: 1,
            data: [
                { id: 'v1', submitted_at: '2024-06-01T12:00:00Z', profile: { full_name: 'Alice', email: 'a@test.com' } },
            ],
        });
        _tableData.set('contracts', {
            count: 1,
            data: [
                { id: 'c1', risk_level: 'high', risk_flags: ['large_amount'], created_at: '2024-01-01', title: 'Big project' },
            ],
        });
        _tableData.set('disputes', {
            count: 0,
            data: [
                { id: 'd1', opened_at: '2024-06-15T00:00:00Z', reason: 'Client did not pay' },
            ],
        });
        renderWithClient(<OverviewTab />);
        expect(await screen.findByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('a@test.com')).toBeInTheDocument();
        expect(screen.getAllByText('Big project').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Client did not pay')).toBeInTheDocument();
    });

    it('handles empty data for all sections', async () => {
        _tableData.forEach((_, key) => _tableData.set(key, { count: 0, data: [] }));
        renderWithClient(<OverviewTab />);
        expect(await screen.findByText('No pending requests')).toBeInTheDocument();
        expect(screen.getByText('No medium/high-risk contracts right now.')).toBeInTheDocument();
        expect(screen.getByText('No overdue contract review windows.')).toBeInTheDocument();
        expect(screen.getByText('All open disputes have captured evidence.')).toBeInTheDocument();
    });

    it('shows today activity section', async () => {
        renderWithClient(<OverviewTab />);
        expect(await screen.findByText("Today's Activity")).toBeInTheDocument();
        expect(screen.getByText('New signups')).toBeInTheDocument();
        expect(screen.getByText('New contracts')).toBeInTheDocument();
    });

    it('shows reports placeholder', async () => {
        renderWithClient(<OverviewTab />);
        expect(await screen.findByText('No reports for now')).toBeInTheDocument();
    });

    it('handles null profile in verification requests', async () => {
        _tableData.set('identity_verifications', {
            count: 1,
            data: [
                { id: 'v2', submitted_at: '2024-06-01T12:00:00Z', profile: null },
            ],
        });
        _tableData.set('contracts', { count: 0, data: [] });
        renderWithClient(<OverviewTab />);
        expect(await screen.findByText('User')).toBeInTheDocument();
    });
});
