import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
    useQuery: vi.fn(),
    initiatePayment: vi.fn(),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ error: null }),
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
            rpc: mocks.rpc,
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

import { useWorkspaceStore } from '@/lib/workspaceState';
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
        useWorkspaceStore.setState({ activeWorkspace: 'client' });
    });

    afterEach(() => {
        vi.useRealTimers();
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

    it('redirects to payment link on successful deposit initiation', async () => {
        mocks.initiatePayment.mockResolvedValueOnce({ link: 'https://pay.example.com/checkout' });
        const originalLocation = window.location.href;
        delete (window as any).location;
        window.location = { ...window.location, href: originalLocation };
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
            expect(window.location.href).toBe('https://pay.example.com/checkout');
        });
        window.location.href = originalLocation;
    });

    it('shows error when initiatePayment returns no link', async () => {
        mocks.initiatePayment.mockResolvedValueOnce({});
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
            expect(screen.getByText('Payment link was not generated')).toBeInTheDocument();
        });
    });

    it('shows deposit button disabled during loading', async () => {
        mocks.initiatePayment.mockImplementationOnce(() => new Promise(() => {}));
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
            expect(screen.getByText('Processing…')).toBeInTheDocument();
        });
    });

    it('fills deposit amount via preset button', () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Deposit Funds' }));
        fireEvent.click(screen.getByText('250'));
        const input = screen.getByRole('spinbutton') as HTMLInputElement;
        expect(input.value).toBe('250');
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

    // ─── Freelancer mode ─────────────────────────────────────────────

    it('shows withdraw tab for freelancer mode', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getAllByText('Withdraw').length).toBeGreaterThanOrEqual(1);
    });

    it('shows Request Withdrawal quick link for freelancer mode', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/Request Withdrawal/)).toBeInTheDocument();
    });

    it('navigates to transactions tab via quick links Transactions section button', () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('Full payment history'));
        expect(screen.getByText(/Transaction History/)).toBeInTheDocument();
    });

    it('navigates to deposit tab via quick links Deposit Funds button', () => {
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('Top up your wallet'));
        expect(screen.getAllByText(/Deposit Funds/).length).toBeGreaterThanOrEqual(2);
    });

    it('navigates to withdraw tab via freelancer quick link', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('Move earnings to bank'));
        expect(screen.getAllByText(/Request Withdrawal/).length).toBeGreaterThanOrEqual(2);
    });

    it('calls onSuccess after withdrawal submission completes', async () => {
        vi.useFakeTimers();
        try {
            useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
            mocks.rpc.mockResolvedValueOnce({ error: null });
            render(
                <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                    <Wallet />
                </MemoryRouter>
            );
            fireEvent.click(screen.getByText('50 TND'));
            fireEvent.change(screen.getByPlaceholderText(/e\.g\. BNA/), { target: { value: 'My Bank' } });
            fireEvent.change(screen.getByPlaceholderText(/Full name/), { target: { value: 'John Doe' } });
            fireEvent.change(screen.getByLabelText('IBAN'), { target: { value: 'TN591234567890123456789012' } });
            const submitButtons = screen.getAllByText(/Request Withdrawal/);
            fireEvent.click(submitButtons[submitButtons.length - 1]);
            await act(async () => { vi.advanceTimersByTime(2500); });
            expect(screen.getByText('Overview')).toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    // ─── Locked funds with data ──────────────────────────────────────

    it('renders locked funds section with locked contracts', () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'wallet-contracts') {
                return {
                    data: [{
                        id: 'c1',
                        title: 'Website Design',
                        status: 'delivery_submitted',
                        payment_status: 'in_escrow',
                        amount: '1500',
                        escrow_pending_clearance_until: null,
                        review_due_at: futureDate,
                        client: { full_name: 'Client A' },
                        freelancer: { full_name: 'Freelancer X' },
                    }],
                };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText('Website Design')).toBeInTheDocument();
        expect(screen.getByText(/Freelancer X/)).toBeInTheDocument();
    });

    it('shows countdown timer with clearance hold contract', () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'wallet-contracts') {
                return {
                    data: [{
                        id: 'c1',
                        title: 'Website Design',
                        status: 'active',
                        payment_status: 'in_escrow',
                        amount: '1500',
                        escrow_pending_clearance_until: futureDate,
                        review_due_at: null,
                        client: { full_name: 'Client A' },
                        freelancer: { full_name: 'Freelancer X' },
                    }],
                };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText('Clearing Hold')).toBeInTheDocument();
        expect(screen.getByText(/h \d+m/)).toBeInTheDocument();
    });

    it('shows frozen disputed badge for disputed contracts', () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'wallet-contracts') {
                return {
                    data: [{
                        id: 'c1',
                        title: 'Disputed Contract',
                        status: 'disputed',
                        payment_status: 'in_escrow',
                        amount: '500',
                        escrow_pending_clearance_until: null,
                        review_due_at: null,
                        client: { full_name: 'Client A' },
                        freelancer: { full_name: 'Freelancer X' },
                    }],
                };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/Frozen/)).toBeInTheDocument();
    });

    // ─── WithdrawPanel ───────────────────────────────────────────────

    it('shows withdraw panel when Withdraw tab is active', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getAllByText(/Request Withdrawal/).length).toBeGreaterThanOrEqual(1);
    });

    it('shows available balance in withdraw panel', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getAllByText(/500/).length).toBeGreaterThanOrEqual(1);
    });

    it('shows MIN withdrawal preset buttons', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText('50 TND')).toBeInTheDocument();
        expect(screen.getByText('100 TND')).toBeInTheDocument();
        expect(screen.getByText('200 TND')).toBeInTheDocument();
        expect(screen.getByText('500 TND')).toBeInTheDocument();
    });

    it('fills amount when preset button is clicked', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('100 TND'));
        const input = screen.getByRole('spinbutton') as HTMLInputElement;
        expect(input.value).toBe('100');
    });

    it('shows fee and net amount calculation', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('200 TND'));
        expect(screen.getByText(/You withdraw/)).toBeInTheDocument();
    });

    it('shows MAX button that fills full balance', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('MAX'));
        const input = screen.getByRole('spinbutton') as HTMLInputElement;
        expect(input.value).toBe('500');
    });

    // ─── WithdrawPanel form validation and submission ────────────────

    it('shows bank validation errors on submit with empty bank fields', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('50 TND'));
        const submitButtons = screen.getAllByText(/Request Withdrawal/);
        fireEvent.click(submitButtons[submitButtons.length - 1]);
        expect(screen.getByText('Bank name is required')).toBeInTheDocument();
        expect(screen.getByText('Account holder name is required')).toBeInTheDocument();
        expect(screen.getByText('IBAN is required')).toBeInTheDocument();
    });

    it('shows IBAN validation error for invalid IBAN', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('50 TND'));
        const bankNameInput = screen.getByPlaceholderText(/e\.g\. BNA/);
        fireEvent.change(bankNameInput, { target: { value: 'My Bank' } });
        const holderInput = screen.getByPlaceholderText(/Full name/);
        fireEvent.change(holderInput, { target: { value: 'John Doe' } });
        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'TN12' } });
        const submitButtons = screen.getAllByText(/Request Withdrawal/);
        fireEvent.click(submitButtons[submitButtons.length - 1]);
        expect(screen.getByText('IBAN must start with TN')).toBeInTheDocument();
    });

    it('submits withdrawal request successfully', async () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        mocks.rpc.mockResolvedValueOnce({ error: null });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('50 TND'));
        const bankNameInput = screen.getByPlaceholderText(/e\.g\. BNA/);
        fireEvent.change(bankNameInput, { target: { value: 'My Bank' } });
        const holderInput = screen.getByPlaceholderText(/Full name/);
        fireEvent.change(holderInput, { target: { value: 'John Doe' } });
        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'TN591234567890123456789012' } });
        const submitButtons = screen.getAllByText(/Request Withdrawal/);
        fireEvent.click(submitButtons[submitButtons.length - 1]);
        await waitFor(() => {
            expect(mocks.rpc).toHaveBeenCalledWith('request_withdrawal_atomic', expect.objectContaining({
                p_wallet_id: 'wallet-1',
                p_amount: 50,
                p_method: 'bank_transfer',
            }));
        });
        expect(screen.getByText('Request Submitted!')).toBeInTheDocument();
        expect(mockShowToast).toHaveBeenCalledWith(
            'Withdrawal request submitted successfully',
            'success',
        );
    });

    it('shows error toast when withdrawal submission fails', async () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        mocks.rpc.mockResolvedValueOnce({ error: new Error('Insufficient balance') });
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('50 TND'));
        const bankNameInput = screen.getByPlaceholderText(/e\.g\. BNA/);
        fireEvent.change(bankNameInput, { target: { value: 'My Bank' } });
        const holderInput = screen.getByPlaceholderText(/Full name/);
        fireEvent.change(holderInput, { target: { value: 'John Doe' } });
        const ibanInput = screen.getByLabelText('IBAN');
        fireEvent.change(ibanInput, { target: { value: 'TN591234567890123456789012' } });
        const submitButtons = screen.getAllByText(/Request Withdrawal/);
        fireEvent.click(submitButtons[submitButtons.length - 1]);
        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                'Failed to submit withdrawal request',
                'error',
            );
        });
    });

    // ─── Chart with data ──────────────────────────────────────────────

    it('renders chart with transaction data', () => {
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'wallet-chart-transactions') {
                return { data: [{ id: 't1', amount: 100, type: 'escrow_release', created_at: '2026-06-01', status: 'completed' }] };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText('Spending History')).toBeInTheDocument();
    });

    // ─── View All button in recent transactions ───────────────────────

    it('navigates to transactions tab via View All button', () => {
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'transactions') {
                return { data: { data: [mockTransaction('t1'), mockTransaction('t2')], count: 2 }, isLoading: false };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('View all →'));
        expect(screen.getByText('Transaction History')).toBeInTheDocument();
    });

    // ─── Recent transactions with debit/credit display ───────────────

    it('renders debit transaction with minus sign', () => {
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'transactions') {
                return { data: { data: [mockTransaction('t1', { type: 'withdrawal', amount: 50 })], count: 1 }, isLoading: false };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getAllByText(/50\.000/).length).toBeGreaterThanOrEqual(1);
    });

    // ─── Active Escrow badge for locked contracts ───────────────

    it('shows Active Escrow badge for simple locked contract without clearance/review/dispute', () => {
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'wallet-contracts') {
                return {
                    data: [{
                        id: 'c1', title: 'Simple Locked Contract',
                        status: 'active', payment_status: 'in_escrow', amount: '500',
                        escrow_pending_clearance_until: null, review_due_at: null,
                        client: { full_name: 'Client A' },
                        freelancer: { full_name: 'Freelancer X' },
                    }],
                };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText('Simple Locked Contract')).toBeInTheDocument();
        expect(screen.getByText('Active Escrow')).toBeInTheDocument();
    });

    // ─── CountdownTimer >24h path ───────────────────────────────

    it('shows days countdown for lock time more than 24h away', () => {
        const farFuture = new Date(Date.now() + 172800000).toISOString();
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'wallet-contracts') {
                return {
                    data: [{
                        id: 'c1', title: 'Long Hold',
                        status: 'active', payment_status: 'in_escrow', amount: '1000',
                        escrow_pending_clearance_until: farFuture, review_due_at: null,
                        client: { full_name: 'Client A' },
                        freelancer: { full_name: 'Freelancer X' },
                    }],
                };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText(/Long Hold/)).toBeInTheDocument();
        expect(screen.getByText(/\d+d \d+h/)).toBeInTheDocument();
    });

    // ─── Freelancer chart earning data ──────────────────────────

    it('renders earning chart for freelancer mode', () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'wallet-chart-transactions') {
                return { data: [{ id: 't1', amount: 200, type: 'escrow_release', created_at: new Date().toISOString(), status: 'completed' }] };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText('Earnings Growth')).toBeInTheDocument();
    });

    // ─── Client chart spending data ─────────────────────────────

    it('renders spending chart for client mode', () => {
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'wallet-chart-transactions') {
                return { data: [{ id: 't1', amount: 150, type: 'escrow_fund', created_at: new Date().toISOString(), status: 'completed' }] };
            }
            return defaultQueryHandler(queryKey);
        });
        render(
            <MemoryRouter initialEntries={['/wallet']}>
                <Wallet />
            </MemoryRouter>
        );
        expect(screen.getByText('Spending History')).toBeInTheDocument();
    });

    // ─── Pagination Previous button ─────────────────────────────

    it('navigates to previous page when Previous is clicked', () => {
        const lotsOfTx = Array.from({ length: 15 }, (_, i) => mockTransaction(`t${i}`));
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'transactions') {
                const p = queryKey[2] as number || 1;
                const start = (p - 1) * 10;
                return { data: { data: lotsOfTx.slice(start, start + 10), count: 15 }, isLoading: false };
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
        expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
        fireEvent.click(screen.getByText(/Previous/));
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    // ─── WithdrawPanel: non-Error thrown in catch ───────────────

    it('handles withdrawal submission with non-Error throw', async () => {
        useWorkspaceStore.setState({ activeWorkspace: 'freelancer' });
        mocks.rpc.mockRejectedValueOnce('Some string error');
        render(
            <MemoryRouter initialEntries={['/wallet?tab=withdraw']}>
                <Wallet />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText('50 TND'));
        fireEvent.change(screen.getByPlaceholderText(/e\.g\. BNA/), { target: { value: 'My Bank' } });
        fireEvent.change(screen.getByPlaceholderText(/Full name/), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText('IBAN'), { target: { value: 'TN591234567890123456789012' } });
        const submitButtons = screen.getAllByText(/Request Withdrawal/);
        fireEvent.click(submitButtons[submitButtons.length - 1]);
        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith('Failed to submit withdrawal request', 'error');
        });
    });

    // ─── DepositPanel: non-Error thrown in catch ────────────────

    it('shows generic error when deposit throws a non-Error', async () => {
        mocks.initiatePayment.mockRejectedValueOnce('string error');
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
            expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
        });
    });
});