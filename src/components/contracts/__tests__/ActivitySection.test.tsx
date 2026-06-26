import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityTab } from '../ActivitySection';
import type { ContractActivityEvent, ContractSidebarData, WorkspaceModel } from '../types';

vi.mock('lucide-react', () => ({
    Clock: () => <svg data-testid="lucide-clock" />,
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        tx: (key: string, _opts?: unknown, fallback?: string) => fallback || key,
    }),
}));

vi.mock('../contractUtils', () => ({
    fmtTime: (date: string | null | undefined) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString();
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
    PartyAvatar: () => <span data-testid="party-avatar" />,
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

const baseContract: ContractSidebarData = {
    amount: 1000,
    deliverySubmittedAt: '2025-06-15T12:00:00Z',
    reviewDueAt: '2025-06-20T12:00:00Z',
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

describe('ActivityTab', () => {
    it('renders section title', () => {
        render(<ActivityTab events={[]} model={baseModel} contract={baseContract as any} rt={roleTheme as any} />);
        expect(screen.getByText(/activityLog/)).toBeInTheDocument();
        expect(screen.getByText(/contractEventHistory/)).toBeInTheDocument();
    });

    it('renders list of events when provided', () => {
        const events: ContractActivityEvent[] = [
            { id: 'e1', text: 'Event one', timestamp: '2025-06-15T12:00:00Z', actorRole: 'system', kind: 'system', system: true },
            { id: 'e2', text: 'Event two', timestamp: '2025-06-16T12:00:00Z', actorRole: 'client', kind: 'message', actorName: 'Bob' },
        ];
        render(<ActivityTab events={events} model={baseModel} contract={baseContract as any} rt={roleTheme as any} />);
        expect(screen.getByText('Event one')).toBeInTheDocument();
        expect(screen.getByText('Event two')).toBeInTheDocument();
    });

    it('renders fallback events when no events provided and contract has deliverySubmittedAt', () => {
        render(<ActivityTab events={[]} model={baseModel} contract={baseContract as any} rt={roleTheme as any} />);
        expect(screen.queryByTestId('compact-empty')).not.toBeInTheDocument();
        expect(screen.getByText(/eventWorkDelivered/)).toBeInTheDocument();
    });

    it('shows empty state when no events and no fallback data', () => {
        const emptyContract: ContractSidebarData = { amount: null };
        render(<ActivityTab events={[]} model={baseModel} contract={emptyContract as any} rt={roleTheme as any} />);
        expect(screen.getByTestId('compact-empty')).toBeInTheDocument();
        expect(screen.getByTestId('empty-title')).toHaveTextContent(/noActivityYet/);
    });

    it('renders fallback completed event when model.st is completed', () => {
        const completedModel = { ...baseModel, st: 'completed' as const };
        const contract: ContractSidebarData = { amount: null, deliverySubmittedAt: '2025-06-15T12:00:00Z' };
        render(<ActivityTab events={[]} model={completedModel} contract={contract as any} rt={roleTheme as any} />);
        expect(screen.getByText(/eventWorkAccepted/)).toBeInTheDocument();
    });

    it('renders review confirmation fallback event when showReviewConfirmation is true', () => {
        const model = { ...baseModel, showReviewConfirmation: true, deliverySubmittedAt: null };
        const contract: ContractSidebarData = { amount: null };
        render(<ActivityTab events={[]} model={model} contract={contract as any} rt={roleTheme as any} />);
        expect(screen.getByText(/reviewStarsPlaceholder/)).toBeInTheDocument();
    });

    it('renders system events without avatar', () => {
        const events: ContractActivityEvent[] = [
            { id: 'e1', text: 'System event', timestamp: '2025-06-15T12:00:00Z', actorRole: 'system', kind: 'system', system: true },
        ];
        render(<ActivityTab events={events} model={baseModel} contract={baseContract as any} rt={roleTheme as any} />);
        expect(screen.getByText('System event')).toBeInTheDocument();
        expect(screen.queryByTestId('party-avatar')).not.toBeInTheDocument();
    });

    it('renders user events with avatar', () => {
        const events: ContractActivityEvent[] = [
            { id: 'e1', text: 'User event', timestamp: '2025-06-15T12:00:00Z', actorRole: 'client', kind: 'message', actorName: 'Alice' },
        ];
        render(<ActivityTab events={events} model={baseModel} contract={baseContract as any} rt={roleTheme as any} />);
        expect(screen.getByText('User event')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('renders event with timestamp', () => {
        const events: ContractActivityEvent[] = [
            { id: 'e1', text: 'Timed event', timestamp: '2025-06-15T12:00:00Z', actorRole: 'client', kind: 'message', actorName: 'Alice' },
        ];
        render(<ActivityTab events={events} model={baseModel} contract={baseContract as any} rt={roleTheme as any} />);
        const timeText = new Date('2025-06-15T12:00:00Z').toLocaleTimeString();
        expect(screen.getByText(timeText)).toBeInTheDocument();
    });
});
