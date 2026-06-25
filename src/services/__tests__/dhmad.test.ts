import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockInvoke = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
    supabase: {
        functions: {
            invoke: mockInvoke,
        },
    },
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));

import {
    createEscrow,
    releaseEscrow,
    refundEscrow,
    getEscrowStatus,
    createCheckoutSession,
} from '@/services/dhmad';

describe('dhmad service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('DEV mode (import.meta.env.DEV = true)', () => {
        beforeEach(() => {
            vi.stubEnv('DEV', true);
        });

        afterEach(() => {
            vi.unstubAllEnvs();
        });

        it('createEscrow returns mock escrow with pending status', async () => {
            const result = await createEscrow({
                amount: 500,
                buyer_id: 'client-1',
                seller_id: 'freelancer-1',
                contract_id: 'contract-1',
                description: 'Web development project',
            });

            expect(result.escrow_id).toMatch(/^dhmad_mock_/);
            expect(result.status).toBe('pending');
            expect(result.amount).toBe(500);
            expect(result.payment_url).toContain('sandbox.dhmad.tn/pay/');
            expect(result.created_at).toBeDefined();
        });

        it('releaseEscrow returns mock released response', async () => {
            const result = await releaseEscrow('escrow-1', 'contract-1');
            expect(result.success).toBe(true);
            expect(result.escrow_id).toBe('escrow-1');
            expect(result.status).toBe('released');
            expect(result.released_at).toBeDefined();
        });

        it('refundEscrow returns mock refunded response', async () => {
            const result = await refundEscrow('escrow-1', 'contract-1', 'Client cancelled');
            expect(result.success).toBe(true);
            expect(result.escrow_id).toBe('escrow-1');
            expect(result.status).toBe('refunded');
            expect(result.refunded_at).toBeDefined();
        });

        it('getEscrowStatus returns mock funded status', async () => {
            const result = await getEscrowStatus('escrow-1');
            expect(result.escrow_id).toBe('escrow-1');
            expect(result.status).toBe('funded');
            expect(result.amount).toBe(0);
        });

        it('createCheckoutSession returns mock session with redirect URL', async () => {
            const result = await createCheckoutSession(
                'escrow-1',
                'accept_pay',
                'client@example.com',
                'https://workedin.tn/contracts/1'
            );
            expect(result.session_id).toMatch(/^mock_session_/);
            expect(result.url).toContain('session_id=');
            expect(result.url).toContain('status=completed');
        });
    });

    describe('PROD mode (import.meta.env.DEV = false)', () => {
        beforeEach(() => {
            vi.stubEnv('DEV', false);
        });

        afterEach(() => {
            vi.unstubAllEnvs();
        });

        it('createEscrow invokes edge function and returns data', async () => {
            const mockResponse = {
                escrow_id: 'escrow-prod-1',
                status: 'pending' as const,
                amount: 500,
                payment_url: 'https://dhmad.tn/pay/escrow-prod-1',
                created_at: '2026-01-01T00:00:00.000Z',
            };
            mockInvoke.mockResolvedValue({ data: mockResponse, error: null });

            const result = await createEscrow({
                amount: 500,
                buyer_id: 'client-1',
                seller_id: 'freelancer-1',
                contract_id: 'contract-1',
                description: 'Test',
            });

            expect(mockInvoke).toHaveBeenCalledWith('dhmad-create-escrow', {
                body: {
                    amount: 500,
                    buyer_id: 'client-1',
                    seller_id: 'freelancer-1',
                    contract_id: 'contract-1',
                    description: 'Test',
                },
            });
            expect(result).toEqual(mockResponse);
        });

        it('createEscrow throws on edge function error', async () => {
            mockInvoke.mockResolvedValue({ data: null, error: new Error('edge failed') });

            await expect(createEscrow({
                amount: 100,
                buyer_id: 'c1',
                seller_id: 's1',
                contract_id: 'ct1',
                description: 'desc',
            })).rejects.toThrow('payment.startFailed');
        });

        it('createEscrow throws when data is null', async () => {
            mockInvoke.mockResolvedValue({ data: null, error: null });

            await expect(createEscrow({
                amount: 100,
                buyer_id: 'c1',
                seller_id: 's1',
                contract_id: 'ct1',
                description: 'desc',
            })).rejects.toThrow('payment.startFailed');
        });

        it('releaseEscrow invokes edge function', async () => {
            mockInvoke.mockResolvedValue({
                data: { success: true, escrow_id: 'e1', status: 'released', released_at: '2026-01-01T00:00:00.000Z' },
                error: null,
            });

            const result = await releaseEscrow('e1', 'c1');
            expect(mockInvoke).toHaveBeenCalledWith('dhmad-release-escrow', {
                body: { escrow_id: 'e1', contract_id: 'c1' },
            });
            expect(result.status).toBe('released');
        });

        it('releaseEscrow throws on error', async () => {
            mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') });
            await expect(releaseEscrow('e1', 'c1')).rejects.toThrow('payment.releaseFailed');
        });

        it('refundEscrow invokes edge function', async () => {
            mockInvoke.mockResolvedValue({
                data: { success: true, escrow_id: 'e1', status: 'refunded', refunded_at: '2026-01-01T00:00:00.000Z' },
                error: null,
            });

            const result = await refundEscrow('e1', 'c1', 'reason');
            expect(mockInvoke).toHaveBeenCalledWith('dhmad-refund-escrow', {
                body: { escrow_id: 'e1', contract_id: 'c1', reason: 'reason' },
            });
            expect(result.status).toBe('refunded');
        });

        it('refundEscrow throws on error', async () => {
            mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') });
            await expect(refundEscrow('e1', 'c1', 'r')).rejects.toThrow('payment.refundFailed');
        });

        it('getEscrowStatus invokes edge function', async () => {
            mockInvoke.mockResolvedValue({
                data: { escrow_id: 'e1', status: 'funded', amount: 200, created_at: '2026-01-01T00:00:00.000Z' },
                error: null,
            });

            const result = await getEscrowStatus('e1');
            expect(mockInvoke).toHaveBeenCalledWith('dhmad-get-escrow-status', {
                body: { escrow_id: 'e1' },
            });
            expect(result.status).toBe('funded');
        });

        it('getEscrowStatus throws on error', async () => {
            mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') });
            await expect(getEscrowStatus('e1')).rejects.toThrow('payment.statusFailed');
        });

        it('createCheckoutSession invokes edge function', async () => {
            mockInvoke.mockResolvedValue({
                data: { session_id: 'sess-1', url: 'https://dhmad.tn/checkout/sess-1' },
                error: null,
            });

            const result = await createCheckoutSession('e1', 'accept_pay', 'a@b.com', 'https://redirect');
            expect(mockInvoke).toHaveBeenCalledWith('dhmad-checkout-session', {
                body: { escrow_id: 'e1', action: 'accept_pay', user_email: 'a@b.com', redirect_url: 'https://redirect' },
            });
            expect(result.session_id).toBe('sess-1');
        });

        it('createCheckoutSession throws on error', async () => {
            mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') });
            await expect(createCheckoutSession('e1', 'complete', 'a@b.com', 'https://r')).rejects.toThrow('payment.sessionFailed');
        });

        it('createCheckoutSession throws when data is null', async () => {
            mockInvoke.mockResolvedValue({ data: null, error: null });
            await expect(createCheckoutSession('e1', 'dispute', 'a@b.com', 'https://r')).rejects.toThrow('payment.sessionFailed');
        });
    });
});
