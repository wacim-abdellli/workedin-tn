import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
    useQuery: vi.fn(),
    initiatePayment: vi.fn(),
    removeChannel: vi.fn(),
}));

const authState = vi.hoisted(() => ({
    user: { id: 'wallet-user' } as { id: string } | null,
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: mocks.useQuery,
}));

vi.mock('recharts', async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
        ...original,
        ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    };
});

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => authState,
}));

vi.mock('@/lib/flouci', () => ({
    initiatePayment: mocks.initiatePayment,
}));

const mockShowToast = vi.fn();

vi.mock('@/lib/supabase', () => {
    const channel = {
        on: vi.fn(() => channel),
        subscribe: vi.fn(() => ({ id: 'wallet:wallet-user' })),
    };
    return {
        supabase: {
            channel: vi.fn(() => channel),
            removeChannel: mocks.removeChannel,
            rpc: vi.fn(),
        },
    };
});

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: { wallet: { title: 'My Wallet' }, common: {} },
        tx: (_key: string, _params?: Record<string, string>, fallback?: string) => fallback ?? _key,
        language: 'en',
    }),
}));

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
}));

vi.mock('@/components/common/SEO', () => ({
    default: () => null,
}));

vi.mock('@/components/common/ErrorBoundary', () => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({ children, onClick, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => (
        <button onClick={onClick} {...props}>
            {children}
        </button>
    ),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/services/payments', () => ({
    getWallet: vi.fn(),
    getTransactions: vi.fn(),
    getWithdrawals: vi.fn(),
}));

vi.mock('@/services/contracts', () => ({
    getContractsByUser: vi.fn(),
}));

import Wallet from '@/pages/Wallet';

const mockWallet = {
    id: 'wallet-1',
    user_id: 'wallet-user',
    balance: 500,
    pending_balance: 100,
    currency: 'TND',
    total_earned: 3000,
    total_withdrawn: 2000,
    total_fees_paid: 50,
    created_at: '2026-04-08T00:00:00.000Z',
    updated_at: '2026-04-08T00:00:00.000Z',
};

const mockTransaction = (id: string, overrides = {}) => ({
    id,
    user_id: 'wallet-user',
    type: 'escrow_release',
    amount: 150,
    description: 'Payment for project',
    status: 'completed',
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    wallet_id: 'wallet-1',
    related_contract_id: null,
    metadata: null,
    ...overrides,
});

const mockWithdrawal = (id: string, overrides = {}) => ({
    id,
    wallet_id: 'wallet-1',
    user_id: 'wallet-user',
    amount: 200,
    fee: 2,
    net_amount: 198,
    method: 'bank_transfer',
    status: 'completed',
    created_at: '2026-06-01T00:00:00.000Z',
    ...overrides,
});

const defaultQueryHandler = (queryKey: unknown[]) => {
    switch (queryKey[0]) {
        case 'wallet':
            return { data: mockWallet, isLoading: false, refetch: vi.fn() };
        case 'transactions':
            return { data: { data: [], count: 0 }, isLoading: false };
        case 'withdrawals':
            return { data: [], isLoading: false, refetch: vi.fn() };
        case 'wallet-contracts':
        case 'wallet-chart-transactions':
            return { data: [] };
        default:
            return { data: null, isLoading: false };
    }
};

describe('Wallet', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.user = { id: 'wallet-user' };
        mocks.initiatePayment.mockRejectedValue(new Error('Gateway down'));
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => defaultQueryHandler(queryKey));
    });

    // ─── Loading state ────────────────────────────────────────────────

    it('shows loading skeleton when wallet is loading', () => {
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'wallet') return { data: undefined, isLoading: true, refetch: vi.fn() };
            return defaultQueryHandler(queryKey);
        });
        const { container } = render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThanOrEqual(1);
    });

    // ─── Overview tab (default) ────────────────────────────────────────

    it('renders balance hero with wallet balance', () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText('My Wallet')).toBeInTheDocument();
        expect(screen.getAllByText(/500/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getAllByText('Transactions').length).toBeGreaterThanOrEqual(1);
    });

    it('renders stats row with wallet data', () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/3,000/)).toBeInTheDocument();
        expect(screen.getByText(/2,000/)).toBeInTheDocument();
    });

    it('renders locked funds section with empty state', () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/wallet\.lockedFunds/)).toBeInTheDocument();
    });

    it('renders chart container in overview', () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders quick links section for client mode', () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getAllByText(/Deposit Funds/).length).toBeGreaterThanOrEqual(1);
    });

    it('navigates to transactions tab on transactions button click', () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getAllByText('Transactions')[0]);
        expect(screen.getByText(/Transaction History/)).toBeInTheDocument();
    });

    // ─── Transactions tab ─────────────────────────────────────────────

    it('shows transactions tab header when tab=transactions', () => {
        render(
            <MemoryRouter initialEntries={['/wallet?tab=transactions']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/Transaction History/)).toBeInTheDocument();
    });

    it('renders transaction rows with correct data', () => {
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'transactions') {
                return { data: { data: [mockTransaction('t1'), mockTransaction('t2')], count: 2 }, isLoading: false };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=transactions']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/Transaction History/)).toBeInTheDocument();
        expect(screen.getAllByText(/Payment for project/).length).toBeGreaterThanOrEqual(1);
    });

    it('renders empty state when no transactions', () => {
        render(
            <MemoryRouter initialEntries={['/wallet?tab=transactions']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/No transactions yet/)).toBeInTheDocument();
    });

    it('shows pagination when multiple pages', () => {
        const lotsOfTx = Array.from({ length: 15 }, (_, i) => mockTransaction(`t${i}`));
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'transactions') {
                return { data: { data: lotsOfTx.slice(0, 10), count: 15 }, isLoading: false };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=transactions']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
        expect(screen.getByText(/Next/)).toBeInTheDocument();
    });

    it('paginates when Next is clicked', () => {
        const lotsOfTx = Array.from({ length: 15 }, (_, i) => mockTransaction(`t${i}`));
        let currentPage = 1;
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'transactions') {
                currentPage = queryKey[2] as number;
                return { data: { data: lotsOfTx.slice(0, 10), count: 15 }, isLoading: false };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=transactions']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
        fireEvent.click(screen.getByText(/Next/));
        expect(currentPage).toBe(2);
    });

    it('renders withdrawal history table', () => {
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'withdrawals') {
                return { data: [mockWithdrawal('w1')], isLoading: false, refetch: vi.fn() };
            }
            if (queryKey[0] === 'transactions') {
                return { data: { data: [], count: 0 }, isLoading: false };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=transactions']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/Withdrawal History/)).toBeInTheDocument();
        expect(screen.getAllByText(/Bank transfer/).length).toBeGreaterThanOrEqual(1);
    });

    // ─── Deposit flow (existing) ──────────────────────────────────────

    it('uses the canonical Flouci initiation helper with the wallet deposit payload', async () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Deposit Funds' }));
        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '125' } });
        const depositButtons = screen.getAllByRole('button', { name: 'Deposit Funds' });
        fireEvent.click(depositButtons[depositButtons.length - 1]);
        await waitFor(() => {
            expect(mocks.initiatePayment).toHaveBeenCalledWith({
                amount: 125000,
                success_link: `${window.location.origin}/payment/success`,
                fail_link: `${window.location.origin}/payment/failed`,
            });
        });
        await waitFor(() => {
            expect(screen.getByText('Gateway down')).toBeInTheDocument();
        });
    });

    it('shows deposit amount validation error', async () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Deposit Funds' }));
        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
        const depositButtons = screen.getAllByRole('button', { name: 'Deposit Funds' });
        fireEvent.click(depositButtons[depositButtons.length - 1]);
        await waitFor(() => {
            expect(screen.getByText(/Amount must be between/)).toBeInTheDocument();
        });
    });

    // ─── Recent transactions on overview ──────────────────────────────

    it('shows recent transactions on overview', () => {
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'transactions') {
                return { data: { data: [mockTransaction('t1')], count: 1 }, isLoading: false };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/Recent Transactions/)).toBeInTheDocument();
    });

    // ─── Real-time subscription ───────────────────────────────────────

    it('subscribes to real-time wallet updates on mount and unsubscribes on unmount', () => {
        const { unmount } = render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(mocks.removeChannel).not.toHaveBeenCalled();
        unmount();
        expect(mocks.removeChannel).toHaveBeenCalledTimes(1);
    });
});