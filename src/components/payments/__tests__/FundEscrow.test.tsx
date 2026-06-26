import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import FundEscrow from '../FundEscrow';

const showToastMock = vi.hoisted(() => vi.fn());
const createEscrowMock = vi.hoisted(() => vi.fn());

vi.mock('../../../lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
        },
        rpc: vi.fn(),
    },
}));

vi.mock('../../ui/Toast', () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock('../../../services/dhmad', () => ({
    createEscrow: createEscrowMock,
}));

vi.mock('../../../i18n', () => ({
    useTranslation: () => ({
        tx: (key: string, _opts?: unknown, fallback?: string) => fallback || key,
        language: 'en',
    }),
}));

vi.mock('../../../lib/currencyUtils', () => ({
    formatCurrency: (val: number) => `$${val}`,
    calculateTotalWithFee: (budget: number, percentage: number) => ({
        originalAmount: budget,
        feeAmount: budget * percentage,
        totalAmount: budget + budget * percentage,
    }),
}));

import { supabase } from '../../../lib/supabase';

describe('FundEscrow component', () => {
    const mockContract = {
        id: 'contract-1',
        budget: 500,
        freelancer_id: 'freelancer-123',
        funded_at: null as string | null,
    };

    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_SANDBOX_MODE', 'false');
        
        // Mock window.location
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                href: '',
                origin: 'https://test-workedin.tn',
                hostname: 'test-workedin.tn',
            },
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
    });

    it('renders success state directly if contract is already funded', () => {
        const fundedContract = { ...mockContract, funded_at: '2026-06-25T12:00:00Z' };
        render(<FundEscrow contract={fundedContract} />);
        expect(screen.getByText('Escrow funded successfully')).toBeInTheDocument();
    });

    it('toggles project budget breakdown details', () => {
        render(<FundEscrow contract={mockContract} />);

        // Starts with total charge amount text only, details hidden
        expect(screen.getByText('$525')).toBeInTheDocument(); // 500 + 5% fee (25)
        expect(screen.queryByText(/Project budget/)).not.toBeInTheDocument();

        // Click Show details
        fireEvent.click(screen.getByRole('button', { name: /show details/i }));
        expect(screen.getByText(/Project budget/)).toBeInTheDocument();
        expect(screen.getByText(/Platform fee/)).toBeInTheDocument();

        // Click Hide details
        fireEvent.click(screen.getByRole('button', { name: /hide details/i }));
        expect(screen.queryByText(/Project budget/)).not.toBeInTheDocument();
    });

    it('navigates to confirm page and allows returning back', () => {
        render(<FundEscrow contract={mockContract} />);

        // Click Fund escrow now
        fireEvent.click(screen.getByRole('button', { name: /fund escrow now/i }));
        expect(screen.getByText('Confirm Funding')).toBeInTheDocument();
        expect(screen.getByText('Confirm & Pay $525')).toBeInTheDocument();

        // Click back button to return to initial screen
        const backBtn = screen.getAllByRole('button')[0];
        fireEvent.click(backBtn);
        expect(screen.queryByText('Confirm Funding')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /fund escrow now/i })).toBeInTheDocument();
    });

    it('runs successfully in Sandbox mode calling sandbox RPC directly', async () => {
        vi.stubEnv('VITE_SANDBOX_MODE', 'true');
        
        const userMock = { id: 'client-1' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: { user: userMock } as any,
            error: null,
        });

        vi.mocked(supabase.rpc).mockResolvedValue({
            data: null,
            error: null,
        });

        const onSuccessSpy = vi.fn();

        render(<FundEscrow contract={mockContract} onSuccess={onSuccessSpy} />);

        // Open confirm and submit payment
        fireEvent.click(screen.getByRole('button', { name: /fund escrow now/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm & pay/i }));

        await waitFor(() => {
            expect(supabase.auth.getUser).toHaveBeenCalled();
            expect(supabase.rpc).toHaveBeenCalledWith('sandbox_fund_escrow', {
                p_contract_id: 'contract-1',
            });
            expect(showToastMock).toHaveBeenCalledWith('Escrow funded successfully', 'success');
            expect(onSuccessSpy).toHaveBeenCalled();
            expect(createEscrowMock).not.toHaveBeenCalled();
        });
    });

    it('runs successfully in Production mode redirecting to payment URL', async () => {
        const userMock = { id: 'client-1' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: { user: userMock } as any,
            error: null,
        });

        createEscrowMock.mockResolvedValue({
            escrow_id: 'escrow-abc',
            payment_url: 'https://dhmad.tn/pay/escrow-abc',
        });

        const onSuccessSpy = vi.fn();

        render(<FundEscrow contract={mockContract} onSuccess={onSuccessSpy} />);

        // Open confirm and submit payment
        fireEvent.click(screen.getByRole('button', { name: /fund escrow now/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm & pay/i }));

        await waitFor(() => {
            expect(createEscrowMock).toHaveBeenCalledWith({
                amount: 525,
                buyer_id: 'client-1',
                seller_id: 'freelancer-123',
                contract_id: 'contract-1',
                description: 'Escrow for contract contract-1',
            });
            expect(showToastMock).toHaveBeenCalledWith('Redirecting to secure payment...', 'success');
            expect(window.location.href).toBe('https://dhmad.tn/pay/escrow-abc');
            expect(onSuccessSpy).toHaveBeenCalled();
        });
    });

    it('redirects to local payment success route in Production if no payment URL is provided', async () => {
        const userMock = { id: 'client-1' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: { user: userMock } as any,
            error: null,
        });

        createEscrowMock.mockResolvedValue({
            escrow_id: 'escrow-abc',
            payment_url: null,
        });

        render(<FundEscrow contract={mockContract} />);

        fireEvent.click(screen.getByRole('button', { name: /fund escrow now/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm & pay/i }));

        await waitFor(() => {
            expect(window.location.href).toBe('https://test-workedin.tn/payment/success?contract_id=contract-1');
        });
    });

    it('shows toast error when auth session is missing', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: { user: null },
            error: null,
        });

        const onErrorSpy = vi.fn();

        render(<FundEscrow contract={mockContract} onError={onErrorSpy} />);

        fireEvent.click(screen.getByRole('button', { name: /fund escrow now/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm & pay/i }));

        await waitFor(() => {
            expect(showToastMock).toHaveBeenCalledWith('auth.loginRequired', 'error');
            expect(onErrorSpy).toHaveBeenCalledWith('auth.loginRequired');
        });
    });

    it('handles sandbox RPC errors gracefully', async () => {
        vi.stubEnv('VITE_SANDBOX_MODE', 'true');
        
        const userMock = { id: 'client-1' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: { user: userMock } as any,
            error: null,
        });

        vi.mocked(supabase.rpc).mockResolvedValue({
            data: null,
            error: { message: 'Database RPC rate limit hit' } as any,
        });

        render(<FundEscrow contract={mockContract} />);

        fireEvent.click(screen.getByRole('button', { name: /fund escrow now/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm & pay/i }));

        await waitFor(() => {
            expect(showToastMock).toHaveBeenCalledWith('Database RPC rate limit hit', 'error');
        });
    });

    it('handles generic raw objects or details in payment errors', async () => {
        const userMock = { id: 'client-1' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: { user: userMock } as any,
            error: null,
        });

        // Satisfies `'message' in error` guard check by specifying dummy message key
        createEscrowMock.mockRejectedValue({
            message: '',
            details: 'Account balance insufficient on the gateway side',
        });

        render(<FundEscrow contract={mockContract} />);

        fireEvent.click(screen.getByRole('button', { name: /fund escrow now/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm & pay/i }));

        await waitFor(() => {
            expect(showToastMock).toHaveBeenCalledWith('Account balance insufficient on the gateway side', 'error');
        });
    });

    it('handles generic Error exceptions', async () => {
        const userMock = { id: 'client-1' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: { user: userMock } as any,
            error: null,
        });

        createEscrowMock.mockRejectedValue(new Error('Gateway timeout'));

        render(<FundEscrow contract={mockContract} />);

        fireEvent.click(screen.getByRole('button', { name: /fund escrow now/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm & pay/i }));

        await waitFor(() => {
            expect(showToastMock).toHaveBeenCalledWith('Gateway timeout', 'error');
        });
    });

    it('handles raw fallback translation when error description is completely empty', async () => {
        const userMock = { id: 'client-1' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: { user: userMock } as any,
            error: null,
        });

        createEscrowMock.mockRejectedValue('completely obscure error');

        render(<FundEscrow contract={mockContract} />);

        fireEvent.click(screen.getByRole('button', { name: /fund escrow now/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm & pay/i }));

        await waitFor(() => {
            expect(showToastMock).toHaveBeenCalledWith('Failed to start payment. Please try again.', 'error');
        });
    });
});
