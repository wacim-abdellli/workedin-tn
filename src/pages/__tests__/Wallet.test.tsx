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
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/services/payments', () => ({
    getWallet: vi.fn(),
    getTransactions: vi.fn(),
    getWithdrawals: vi.fn(),
}));

import Wallet from '@/pages/Wallet';

describe('Wallet deposit flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.user = { id: 'wallet-user' };
        mocks.initiatePayment.mockRejectedValue(new Error('Gateway down'));
        mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            switch (queryKey[0]) {
                case 'wallet':
                    return {
                        data: {
                            id: 'wallet-1',
                            user_id: 'wallet-user',
                            balance: 500,
                            pending_balance: 0,
                            currency: 'TND',
                            total_earned: 0,
                            total_withdrawn: 0,
                            total_fees_paid: 0,
                            created_at: '2026-04-08T00:00:00.000Z',
                            updated_at: '2026-04-08T00:00:00.000Z',
                        },
                        isLoading: false,
                        refetch: vi.fn(),
                    };
                case 'transactions':
                    return {
                        data: { data: [], count: 0 },
                        isLoading: false,
                    };
                case 'withdrawals':
                    return {
                        data: [],
                        isLoading: false,
                        refetch: vi.fn(),
                    };
                default:
                    return { data: null, isLoading: false };
            }
        });
    });

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
});
