import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import WithdrawalForm from '../WithdrawalForm';

const showToastMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());

vi.mock('../../../lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: getUserMock,
        },
        rpc: rpcMock,
    },
}));

vi.mock('../../ui/Toast', () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock('../../../i18n', () => ({
    useTranslation: () => ({
        tx: (key: string, _opts?: unknown, fallback?: string) => fallback || key,
        language: 'ar',
    }),
}));

vi.mock('@tanstack/react-query', () => ({
    useMutation: (options: any) => {
        if (options.retryDelay) {
            options.retryDelay(0);
            options.retryDelay(1);
        }
        const mutate = (args: any) => {
            // Resolve promise and catch error internally to avoid unhandled promise rejections in Vitest
            Promise.resolve(options.mutationFn(args))
                .then((res) => {
                    options.onSuccess?.(res);
                })
                .catch((err) => {
                    options.onError?.(err);
                });
        };
        return {
            mutate,
            isPending: false,
        };
    },
}));

vi.mock('../../../lib/currencyUtils', () => ({
    formatCurrency: (val: number) => `$${val}`,
    formatWithdrawalMethod: (method: string) => `Method: ${method}`,
    validateWithdrawalAmount: (amount: number, balance: number, minAmount: number) => {
        if (amount < minAmount) return { valid: false, error: 'Amount too low' };
        if (amount > balance) return { valid: false, error: 'Insufficient balance' };
        return { valid: true, error: null };
    },
}));

vi.mock('../../../lib/phone', () => ({
    formatPhoneAsYouType: (phone: string) => phone,
    normalizePhoneNumber: (phone: string) => `+216${phone}`,
}));

describe('WithdrawalForm component', () => {
    const mockWallet = {
        id: 'wallet-123',
        user_id: 'user-1',
        balance: 500.0,
        pending_balance: 100.0,
        total_earned: 600.0,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        
        getUserMock.mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
        });

        rpcMock.mockResolvedValue({
            data: null,
            error: null,
        });
    });

    afterEach(() => {
    });

    it('renders initial form state correctly', () => {
        const { container } = render(<WithdrawalForm wallet={mockWallet} />);

        expect(screen.getByText('dynamic_key_891367863')).toBeInTheDocument();
        const balanceEl = container.querySelector('.text-2xl.font-bold');
        expect(balanceEl?.textContent?.trim()).toBe('$500');

        expect(screen.getByPlaceholderText('dynamic_key_76026069')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('dynamic_key_215587664')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('ui.tn_xxxxx')).toBeInTheDocument();
    });

    it('triggers onCancel when close button is clicked', () => {
        const onCancelSpy = vi.fn();
        render(<WithdrawalForm wallet={mockWallet} onCancel={onCancelSpy} />);
        
        const closeBtn = screen.getAllByRole('button')[0];
        fireEvent.click(closeBtn);
        expect(onCancelSpy).toHaveBeenCalled();
    });

    it('updates form validation messages when amount is invalid', () => {
        render(<WithdrawalForm wallet={mockWallet} />);
        const amountInput = screen.getByPlaceholderText(/الحد الأدنى/);

        fireEvent.change(amountInput, { target: { value: '5' } });
        expect(screen.getByText('Amount too low')).toBeInTheDocument();

        fireEvent.change(amountInput, { target: { value: '600' } });
        expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
    });

    it('toggles input fields when switching payment method', () => {
        render(<WithdrawalForm wallet={mockWallet} />);

        fireEvent.click(screen.getByText('D17'));
        expect(screen.queryByPlaceholderText('dynamic_key_76026069')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('ui.xx_xxx_xxx')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Method: bank_transfer'));
        expect(screen.getByPlaceholderText('dynamic_key_76026069')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('ui.xx_xxx_xxx')).not.toBeInTheDocument();
    });

    it('submits successful withdrawal request via bank transfer', async () => {
        const onSuccessSpy = vi.fn();
        render(<WithdrawalForm wallet={mockWallet} onSuccess={onSuccessSpy} />);

        fireEvent.change(screen.getByPlaceholderText(/الحد الأدنى/), { target: { value: '100' } });
        fireEvent.change(screen.getByPlaceholderText('dynamic_key_76026069'), { target: { value: 'BIAT' } });
        fireEvent.change(screen.getByPlaceholderText('dynamic_key_215587664'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByPlaceholderText('ui.tn_xxxxx'), { target: { value: 'TN123456' } });

        fireEvent.submit(screen.getByRole('button', { name: 'dynamic_key_2071445136' }));

        await waitFor(() => {
            expect(rpcMock).toHaveBeenCalledWith('request_withdrawal_atomic', expect.objectContaining({
                p_wallet_id: 'wallet-123',
                p_amount: 100,
                p_method: 'bank_transfer',
                p_bank_name: 'BIAT',
                p_bank_account_name: 'John Doe',
                p_bank_iban: 'TN123456',
                p_phone_number: null,
            }));
            expect(showToastMock).toHaveBeenCalledWith('تم إرسال طلب السحب بنجاح', 'success');
        });

        expect(screen.getByText('dynamic_key_300689867')).toBeInTheDocument();
        expect(screen.getByText('$100')).toBeInTheDocument();

        await waitFor(() => {
            expect(onSuccessSpy).toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    it('submits successful withdrawal request via mobile payment (D17)', async () => {
        render(<WithdrawalForm wallet={mockWallet} />);

        fireEvent.click(screen.getByText('D17'));
        fireEvent.change(screen.getByPlaceholderText(/الحد الأدنى/), { target: { value: '50' } });
        fireEvent.change(screen.getByPlaceholderText('ui.xx_xxx_xxx'), { target: { value: '98765432' } });

        fireEvent.submit(screen.getByRole('button', { name: 'dynamic_key_2071445136' }));

        await waitFor(() => {
            expect(rpcMock).toHaveBeenCalledWith('request_withdrawal_atomic', expect.objectContaining({
                p_wallet_id: 'wallet-123',
                p_amount: 50,
                p_method: 'd17',
                p_bank_name: null,
                p_phone_number: '+21698765432',
            }));
        });
    });

    it('blocks submit if bank details are missing', () => {
        render(<WithdrawalForm wallet={mockWallet} />);
        fireEvent.change(screen.getByPlaceholderText(/الحد الأدنى/), { target: { value: '100' } });

        fireEvent.submit(screen.getByRole('button', { name: 'dynamic_key_2071445136' }));
        expect(showToastMock).toHaveBeenCalledWith('الرجاء إدخال بيانات البنك كاملة', 'error');
        expect(rpcMock).not.toHaveBeenCalled();
    });

    it('blocks submit if phone number is missing in mobile method', () => {
        render(<WithdrawalForm wallet={mockWallet} />);
        fireEvent.click(screen.getByText('D17'));
        fireEvent.change(screen.getByPlaceholderText(/الحد الأدنى/), { target: { value: '100' } });

        fireEvent.submit(screen.getByRole('button', { name: 'dynamic_key_2071445136' }));
        expect(showToastMock).toHaveBeenCalledWith('الرجاء إدخال رقم الهاتف', 'error');
        expect(rpcMock).not.toHaveBeenCalled();
    });

    it('handles missing user session error', async () => {
        getUserMock.mockResolvedValue({
            data: { user: null },
            error: null,
        });

        render(<WithdrawalForm wallet={mockWallet} />);
        fireEvent.change(screen.getByPlaceholderText(/الحد الأدنى/), { target: { value: '100' } });
        fireEvent.change(screen.getByPlaceholderText('dynamic_key_76026069'), { target: { value: 'BIAT' } });
        fireEvent.change(screen.getByPlaceholderText('dynamic_key_215587664'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByPlaceholderText('ui.tn_xxxxx'), { target: { value: 'TN123456' } });

        fireEvent.submit(screen.getByRole('button', { name: 'dynamic_key_2071445136' }));

        await waitFor(() => {
            expect(showToastMock).toHaveBeenCalledWith('يجب تسجيل الدخول أولاً', 'error');
        });
    });

    it('handles database RPC error gracefully', async () => {
        rpcMock.mockResolvedValue({
            data: null,
            error: new Error('Insufficient wallet funds'),
        });

        render(<WithdrawalForm wallet={mockWallet} />);
        fireEvent.change(screen.getByPlaceholderText(/الحد الأدنى/), { target: { value: '100' } });
        fireEvent.change(screen.getByPlaceholderText('dynamic_key_76026069'), { target: { value: 'BIAT' } });
        fireEvent.change(screen.getByPlaceholderText('dynamic_key_215587664'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByPlaceholderText('ui.tn_xxxxx'), { target: { value: 'TN123456' } });

        fireEvent.submit(screen.getByRole('button', { name: 'dynamic_key_2071445136' }));

        await waitFor(() => {
            expect(showToastMock).toHaveBeenCalledWith('Insufficient wallet funds', 'error');
        });
    });

    it('handles obscure non-Error rejections during submission', async () => {
        rpcMock.mockRejectedValue('Fatal network error');

        render(<WithdrawalForm wallet={mockWallet} />);
        fireEvent.change(screen.getByPlaceholderText(/الحد الأدنى/), { target: { value: '100' } });
        fireEvent.change(screen.getByPlaceholderText('dynamic_key_76026069'), { target: { value: 'BIAT' } });
        fireEvent.change(screen.getByPlaceholderText('dynamic_key_215587664'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByPlaceholderText('ui.tn_xxxxx'), { target: { value: 'TN123456' } });

        fireEvent.submit(screen.getByRole('button', { name: 'dynamic_key_2071445136' }));

        await waitFor(() => {
            expect(showToastMock).toHaveBeenCalledWith('فشل في إرسال طلب السحب', 'error');
        });
    });

    it('blocks submit if overall amount validation fails', async () => {
        render(<WithdrawalForm wallet={mockWallet} />);
        fireEvent.change(screen.getByPlaceholderText(/الحد الأدنى/), { target: { value: '5' } });
        
        fireEvent.submit(screen.getByRole('button', { name: 'dynamic_key_2071445136' }));

        await waitFor(() => {
            expect(showToastMock).toHaveBeenCalledWith('Amount too low', 'error');
        });
        expect(rpcMock).not.toHaveBeenCalled();
    });
});
