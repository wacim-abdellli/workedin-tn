import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MilestonesTab } from '../MilestonesSection';
import type { WorkspaceModel, ContractMilestone } from '../types';

vi.mock('lucide-react', () => ({
    AlertCircle: () => <svg data-testid="lucide-alert-circle" />,
    AlertTriangle: () => <svg data-testid="lucide-alert-triangle" />,
    CheckCircle: () => <svg data-testid="lucide-check-circle" />,
    GitPullRequest: () => <svg data-testid="lucide-git-pull" />,
    Info: () => <svg data-testid="lucide-info" />,
    X: () => <svg data-testid="lucide-x" />,
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        tx: (key: string, _opts?: unknown, fallback?: string) => fallback || key,
    }),
}));

vi.mock('../../ui', () => ({
    CountdownTimer: ({ targetDate, className }: { targetDate: string; className?: string }) => (
        <span data-testid="countdown-timer" data-date={targetDate} className={className}>
            {new Date(targetDate).toLocaleDateString()}
        </span>
    ),
}));

vi.mock('../contractUtils', () => ({
    ns: (s: string | null | undefined) => (s || '').toLowerCase().trim(),
    fmtDate: (date: string | null | undefined, fallback?: string) => {
        if (!date) return fallback || '';
        return new Date(date).toLocaleDateString();
    },
    fmtAmount: (amount: number | null | undefined) => {
        if (amount == null) return '';
        return `${amount.toLocaleString()} TND`;
    },
    labelClass: 'mock-label-class',
}));

vi.mock('../sidebarPrimitives', () => ({
    CompactEmpty: ({ title, text }: { title: string; text: string }) => (
        <div data-testid="compact-empty">
            <span data-testid="empty-title">{title}</span>
            <span data-testid="empty-text">{text}</span>
        </div>
    ),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

const baseModel: WorkspaceModel = {
    st: 'active',
    status: { label: 'Active', tone: 'text-green', accent: 'bg-green', icon: <svg /> },
    milestones: [],
    reviewFiles: [],
    finalFiles: [],
    reviewLinks: [],
    finalLinks: [],
    sharedFiles: [],
    lockedFinalFilesCount: 0,
    completedMilestones: 0,
    progressPct: 0,
    revLeft: 2,
    revMax: 2,
    revUsed: 0,
    isEscrowFunded: true,
    showFreelancerDeliver: false,
    showClientReview: false,
    showReviewConfirmation: false,
    showLeaveReview: false,
    canDispute: true,
    nextMove: { icon: <svg />, title: 'Next', body: 'Body', primaryLabel: 'Go', tone: 'text-green' },
    otherParty: { full_name: 'Alice' },
    allFileCount: 0,
    lastRevisionNote: null,
    reviewDueAt: null,
    amount: 1000,
    fundedAt: null,
    deliverySubmittedAt: null,
};

const roleTheme = {
    accent: '#E8A020',
    accentBg: 'bg-[#E8A020]',
    accentText: 'text-[#E8A020]',
    accentBorder: 'border-[#E8A020]',
    accentFill: 'bg-[#3D2A00]/60',
    roleLabel: 'Client',
    roleBadge: 'border-[#E8A020]/20',
    headerStripe: 'from-[#E8A020]/12',
    primaryBtn: 'bg-zinc-100',
    focusRingColor: 'focus-visible:ring-[#E8A020]',
    tabAccent: 'bg-[#E8A020]',
    tabActiveBg: 'bg-[#E8A020]/15',
};

describe('MilestonesTab', () => {
    it('renders section title', () => {
        render(<MilestonesTab model={baseModel} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByText(/milestones/)).toBeInTheDocument();
        expect(screen.getByText(/escrowLifecycle/)).toBeInTheDocument();
    });

    it('renders all five escrow phases', () => {
        render(<MilestonesTab model={baseModel} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByText(/escrowFundedPhase/)).toBeInTheDocument();
        expect(screen.getByText(/workInProgressPhase/)).toBeInTheDocument();
        expect(screen.getByText(/deliverySubmittedPhase/)).toBeInTheDocument();
        expect(screen.getByText(/clientApprovedPhase/)).toBeInTheDocument();
        expect(screen.getByText(/paymentReleasedPhase/)).toBeInTheDocument();
    });

    it('shows completed badge on phases that are done', () => {
        const model = { ...baseModel, st: 'completed' as const };
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="client" />);
        const completed = screen.getAllByText(/completed/);
        expect(completed.length).toBeGreaterThanOrEqual(5);
    });

    it('renders milestones list when milestones exist', () => {
        const milestones: ContractMilestone[] = [
            { id: 'm1', title: 'First milestone', amount: 500, due_date: '2025-07-01', status: 'completed' },
            { id: 'm2', title: 'Second milestone', amount: 500, due_date: '2025-08-01', status: 'active' },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 1 };
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByText(/contractMilestones/)).toBeInTheDocument();
        expect(screen.getByText('First milestone')).toBeInTheDocument();
        expect(screen.getByText('Second milestone')).toBeInTheDocument();
    });

    it('shows paid status for completed milestones', () => {
        const milestones: ContractMilestone[] = [
            { id: 'm1', title: 'Done milestone', amount: 500, status: 'completed' },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 1 };
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByText(/paid/)).toBeInTheDocument();
    });

    it('shows approve button for client when milestone is submitted', () => {
        const milestones: ContractMilestone[] = [
            { id: 'm1', title: 'Submitted milestone', amount: 500, status: 'submitted' },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 0 };
        const onAccept = vi.fn();
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="client" onAcceptMilestone={onAccept} />);
        const approveBtn = screen.getByText(/approve/);
        expect(approveBtn).toBeInTheDocument();
        fireEvent.click(approveBtn);
        expect(onAccept).toHaveBeenCalledWith('m1');
    });

    it('hides approve button for freelancer when milestone is submitted', () => {
        const milestones: ContractMilestone[] = [
            { id: 'm1', title: 'Submitted milestone', amount: 500, status: 'submitted' },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 0 };
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="freelancer" />);
        expect(screen.queryByText(/approve/)).not.toBeInTheDocument();
    });

    it('shows hold payout button when clearance is pending and user is client', () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const milestones: ContractMilestone[] = [
            { id: 'm1', title: 'Pending clearance', amount: 500, status: 'completed', escrow_pending_clearance_until: futureDate },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 1 };
        const onHold = vi.fn();
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="client" onHoldMilestoneClearance={onHold} />);
        const holdBtns = screen.getAllByText(/holdPayout/);
        expect(holdBtns.length).toBeGreaterThanOrEqual(1);
        fireEvent.click(holdBtns[holdBtns.length - 1]);
        expect(onHold).toHaveBeenCalledWith('m1');
    });

    it('shows frozen badge when milestone has disputed clearance', () => {
        const milestones: ContractMilestone[] = [
            { id: 'm1', title: 'Disputed milestone', amount: 500, status: 'completed', escrow_hold_disputed: true },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 1 };
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByText(/frozen/)).toBeInTheDocument();
    });

    it('shows empty state when no milestones exist', () => {
        render(<MilestonesTab model={baseModel} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByTestId('compact-empty')).toBeInTheDocument();
        expect(screen.getByTestId('empty-title')).toHaveTextContent(/noCustomMilestones/);
    });

    it('shows milestone status text for active milestones', () => {
        const milestones: ContractMilestone[] = [
            { id: 'm1', title: 'Active milestone', amount: 500, status: 'active' },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 0 };
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('shows pending text when milestone has no status', () => {
        const milestones: ContractMilestone[] = [
            { id: 'm1', title: 'Null status milestone', amount: 500, status: null },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 0 };
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByText(/pending/)).toBeInTheDocument();
    });

    it('renders milestone with description fallback as title', () => {
        const milestones: ContractMilestone[] = [
            { id: 'm1', description: 'Desc as title', amount: 500, status: 'active' },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 0 };
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByText('Desc as title')).toBeInTheDocument();
    });

    it('renders countdown timer for pending clearance milestones', () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const milestones: ContractMilestone[] = [
            { id: 'm1', title: 'Clearance milestone', amount: 500, status: 'completed', escrow_pending_clearance_until: futureDate },
        ];
        const model = { ...baseModel, milestones, completedMilestones: 1 };
        render(<MilestonesTab model={model} rt={roleTheme as any} userRole="freelancer" />);
        expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();
        expect(screen.getByTestId('countdown-timer')).toHaveAttribute('data-date', futureDate);
    });
});
