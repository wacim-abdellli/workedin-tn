import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletedSummary, ContractPulse, ReviewCountdown, EscrowLifecycleStepper, NextMoveCard } from '../ControlSections';

vi.mock('lucide-react', () => ({
    CheckCircle: () => <svg data-testid="lucide-check-circle" />,
    Clock: () => <svg data-testid="lucide-clock" />,
    Lock: () => <svg data-testid="lucide-lock" />,
    Timer: () => <svg data-testid="lucide-timer" />,
    GitPullRequest: () => <svg data-testid="lucide-git-pull" />,
    MessageSquare: () => <svg data-testid="lucide-message" />,
    Check: () => <svg data-testid="lucide-check" />,
    ShieldAlert: () => <svg data-testid="lucide-shield" />,
    AlertCircle: () => <svg data-testid="lucide-alert" />,
    PackageCheck: () => <svg data-testid="lucide-package" />,
    User: () => <svg data-testid="lucide-user" />,
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        tx: (key: string, _opts?: unknown, fallback?: string) => fallback || key,
    }),
}));

const baseModel = {
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
    nextMove: { icon: <svg />, title: 'Next step', body: 'Do something', primaryLabel: 'Primary action', tone: 'text-emerald' },
    otherParty: { full_name: 'Alice', avatar_url: null },
    allFileCount: 0,
    lastRevisionNote: null,
    reviewDueAt: null,
    amount: 1000,
    fundedAt: '2025-06-01T00:00:00Z',
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

describe('CompletedSummary', () => {
    it('renders amount and status', () => {
        render(<CompletedSummary model={baseModel as any} rt={roleTheme as any} onReview={() => {}} />);
        expect(screen.getByText(/amountReleased/)).toBeInTheDocument();
        expect(screen.getByText(/escrowFunded/)).toBeInTheDocument();
    });

    it('shows leave review button when showLeaveReview is true', () => {
        const model = { ...baseModel, showLeaveReview: true };
        render(<CompletedSummary model={model as any} rt={roleTheme as any} onReview={() => {}} />);
        expect(screen.getByText(/leaveReviewLink/)).toBeInTheDocument();
    });
});

describe('ContractPulse', () => {
    it('renders other party name', () => {
        render(<ContractPulse model={baseModel as any} rt={roleTheme as any} userRole="client" />);
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('renders nothing when no other party', () => {
        const model = { ...baseModel, otherParty: null };
        const { container } = render(<ContractPulse model={model as any} rt={roleTheme as any} userRole="client" />);
        expect(container.innerHTML).toBe('');
    });

    it('shows send message button when onGoToMessages is provided', () => {
        render(<ContractPulse model={baseModel as any} rt={roleTheme as any} userRole="freelancer" onGoToMessages={() => {}} />);
        expect(screen.getByText(/sendMessage/)).toBeInTheDocument();
    });
});

describe('ReviewCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    });

    it('shows expired when target is in past', () => {
        render(<ReviewCountdown targetIso="2025-06-14T12:00:00Z" />);
        expect(screen.getByText(/reviewPeriodExpired/)).toBeInTheDocument();
    });

    it('shows remaining time when target is in future', () => {
        render(<ReviewCountdown targetIso="2025-06-20T12:00:00Z" />);
        expect(screen.getByText(/reviewDue/)).toBeInTheDocument();
    });
});

describe('EscrowLifecycleStepper', () => {
    it('renders all four steps', () => {
        render(<EscrowLifecycleStepper model={baseModel as any} paymentStatus="in_escrow" />);
        expect(screen.getByText(/stepHired/)).toBeInTheDocument();
        expect(screen.getByText(/stepFunded/)).toBeInTheDocument();
        expect(screen.getByText(/stepDelivered/)).toBeInTheDocument();
        expect(screen.getByText(/stepPaymentApproved/)).toBeInTheDocument();
    });

    it('shows payment cleared when released', () => {
        render(<EscrowLifecycleStepper model={baseModel as any} paymentStatus="released" />);
        expect(screen.getByText(/stepPaymentCleared/)).toBeInTheDocument();
    });
});

describe('NextMoveCard', () => {
    const handlers = {
        onDeliver: vi.fn(),
        onRequestChanges: vi.fn(),
        onAcceptAndPay: vi.fn(),
        onDispute: vi.fn(),
        onReview: vi.fn(),
    };

    it('renders next move title', () => {
        render(<NextMoveCard model={baseModel as any} rt={roleTheme as any} userRole="freelancer" {...handlers} />);
        expect(screen.getByText('Next step')).toBeInTheDocument();
    });

    it('shows primary action button', () => {
        render(<NextMoveCard model={{ ...baseModel, nextMove: { ...baseModel.nextMove, primaryLabel: 'Primary action', primaryAction: 'deliver' }, showFreelancerDeliver: true } as any} rt={roleTheme as any} userRole="freelancer" {...handlers} />);
        expect(screen.getByText('Primary action')).toBeInTheDocument();
    });

    it('shows dispute button when canDispute', () => {
        render(<NextMoveCard model={baseModel as any} rt={roleTheme as any} userRole="freelancer" {...handlers} />);
        expect(screen.getByText(/dispute/)).toBeInTheDocument();
    });
});
