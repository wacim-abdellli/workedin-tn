import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

const mockUseQuery = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-query', () => ({
    useQuery: mockUseQuery,
}));

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

import OverviewTab from '../OverviewTab';

describe('OverviewTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading spinner while fetching', () => {
        mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
        render(<OverviewTab />);
        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('renders stat cards with data', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 150, activeJobs: 42, activeContracts: 18, totalRevenue: 0,
                todaySignups: 5, todayContracts: 3, pendingVerifications: 7,
                recentVerificationRequests: [], riskyContracts: [], overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Total users')).toBeInTheDocument();
        expect(screen.getByText('Active jobs')).toBeInTheDocument();
    });

    it('shows pending verifications section', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 7,
                recentVerificationRequests: [
                    { id: 'v1', submitted_at: '2024-06-01T12:00:00Z', profile: { full_name: 'John Doe', email: 'john@test.com' } },
                ],
                riskyContracts: [], overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('Pending Verifications')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@test.com')).toBeInTheDocument();
    });

    it('shows no pending requests when verifications are empty', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 0,
                recentVerificationRequests: [], riskyContracts: [], overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('No pending requests')).toBeInTheDocument();
    });

    it('shows risky contracts section', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 0,
                recentVerificationRequests: [],
                riskyContracts: [{ id: 'c1', risk_level: 'high', risk_flags: ['large_amount', 'new_user'], created_at: '2024-01-01', title: 'Big project' }],
                overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('Risky Contracts')).toBeInTheDocument();
        expect(screen.getByText('Big project')).toBeInTheDocument();
        expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('shows empty risky contracts message', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 0,
                recentVerificationRequests: [], riskyContracts: [], overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('No medium/high-risk contracts right now.')).toBeInTheDocument();
    });

    it('shows overdue reviews section', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 0,
                recentVerificationRequests: [], riskyContracts: [],
                overdueReviews: [{ id: 'r1', review_due_at: '2024-05-01T00:00:00Z', title: 'Design work' }],
                disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('Overdue Reviews')).toBeInTheDocument();
        expect(screen.getByText('Design work')).toBeInTheDocument();
    });

    it('shows disputes missing evidence section', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 0,
                recentVerificationRequests: [], riskyContracts: [], overdueReviews: [],
                disputesMissingEvidence: [{ id: 'd1', opened_at: '2024-06-15T00:00:00Z', reason: 'Client did not pay' }],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('Disputes Missing Evidence')).toBeInTheDocument();
        expect(screen.getByText('Client did not pay')).toBeInTheDocument();
    });

    it('shows all sections with zero data gracefully', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 0,
                recentVerificationRequests: [], riskyContracts: [], overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('No medium/high-risk contracts right now.')).toBeInTheDocument();
        expect(screen.getByText('No overdue contract review windows.')).toBeInTheDocument();
        expect(screen.getByText('All open disputes have captured evidence.')).toBeInTheDocument();
    });

    it('handles undefined data gracefully with defaults', () => {
        mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
        render(<OverviewTab />);
        expect(screen.getByText(/Total users/)).toBeInTheDocument();
        expect(screen.getByText('No pending requests')).toBeInTheDocument();
    });

    it('shows today activity section with signups and contracts', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 12, todayContracts: 7, pendingVerifications: 0,
                recentVerificationRequests: [], riskyContracts: [], overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText("Today's Activity")).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('New signups')).toBeInTheDocument();
        expect(screen.getByText('New contracts')).toBeInTheDocument();
    });

    it('shows risk flags in risky contracts', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 0,
                recentVerificationRequests: [],
                riskyContracts: [{ id: 'c1', risk_level: 'medium', risk_flags: ['large_amount'], created_at: '2024-01-01', title: 'Medium project' }],
                overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('medium')).toBeInTheDocument();
        expect(screen.getByText('large_amount')).toBeInTheDocument();
    });

    it('shows multiple verification requests in list', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 2,
                recentVerificationRequests: [
                    { id: 'v1', submitted_at: '2024-06-01T12:00:00Z', profile: { full_name: 'User One', email: 'u1@test.com' } },
                    { id: 'v2', submitted_at: '2024-06-02T12:00:00Z', profile: { full_name: 'User Two', email: 'u2@test.com' } },
                ],
                riskyContracts: [], overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(screen.getByText('u1@test.com')).toBeInTheDocument();
        expect(screen.getByText('u2@test.com')).toBeInTheDocument();
    });

    it('shows reports placeholder section', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 0,
                recentVerificationRequests: [], riskyContracts: [], overdueReviews: [], disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText(/No reports for now/)).toBeInTheDocument();
    });

    it('shows overdue review with formatted date', () => {
        mockUseQuery.mockReturnValue({
            data: {
                totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0,
                todaySignups: 0, todayContracts: 0, pendingVerifications: 0,
                recentVerificationRequests: [], riskyContracts: [],
                overdueReviews: [{ id: 'r1', review_due_at: '2024-05-01T00:00:00Z', title: 'Design work' }],
                disputesMissingEvidence: [],
            },
            isLoading: false,
        });
        render(<OverviewTab />);
        expect(screen.getByText(/Review due/)).toBeInTheDocument();
    });
});
