import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockInvoke = vi.hoisted(() => vi.fn());

vi.mock('../supabase', () => ({
    supabase: {
        functions: {
            invoke: mockInvoke,
        },
    },
}));

import {
    sendProposalAcceptedEmail,
    sendPaymentReceivedEmail,
    sendNewProposalEmail,
    sendDisputeOpenedEmail,
} from '../email';

describe('email', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockInvoke.mockResolvedValue({ error: null });
    });

    describe('sendProposalAcceptedEmail', () => {
        it('calls invoke with proposal_accepted action', async () => {
            vi.stubEnv('PROD', true);
            await sendProposalAcceptedEmail('contract-1');
            expect(mockInvoke).toHaveBeenCalledWith('send-email', {
                body: { action: 'proposal_accepted', actionData: { contractId: 'contract-1' } },
            });
            vi.unstubAllEnvs();
        });
    });

    describe('sendPaymentReceivedEmail', () => {
        it('calls invoke with payment_received action', async () => {
            vi.stubEnv('PROD', true);
            await sendPaymentReceivedEmail('contract-2');
            expect(mockInvoke).toHaveBeenCalledWith('send-email', {
                body: { action: 'payment_received', actionData: { contractId: 'contract-2' } },
            });
            vi.unstubAllEnvs();
        });
    });

    describe('sendNewProposalEmail', () => {
        it('calls invoke with new_proposal action', async () => {
            vi.stubEnv('PROD', true);
            await sendNewProposalEmail('job-1');
            expect(mockInvoke).toHaveBeenCalledWith('send-email', {
                body: { action: 'new_proposal', actionData: { jobId: 'job-1' } },
            });
            vi.unstubAllEnvs();
        });
    });

    describe('sendDisputeOpenedEmail', () => {
        it('calls invoke with dispute_opened action', async () => {
            vi.stubEnv('PROD', true);
            await sendDisputeOpenedEmail('contract-3');
            expect(mockInvoke).toHaveBeenCalledWith('send-email', {
                body: { action: 'dispute_opened', actionData: { contractId: 'contract-3' } },
            });
            vi.unstubAllEnvs();
        });
    });

    it('does not call invoke in non-production', async () => {
        vi.stubEnv('PROD', false);
        await sendProposalAcceptedEmail('contract-1');
        expect(mockInvoke).not.toHaveBeenCalled();
        vi.unstubAllEnvs();
    });

    it('does not throw when invoke returns error', async () => {
        vi.stubEnv('PROD', true);
        mockInvoke.mockResolvedValue({ error: { message: 'send failed' } });
        await expect(sendProposalAcceptedEmail('contract-1')).resolves.not.toThrow();
        vi.unstubAllEnvs();
    });

    it('does not throw when functions client is unavailable', async () => {
        vi.stubEnv('PROD', true);
        const { supabase } = await import('../supabase');
        const original = supabase.functions;
        (supabase as { functions: undefined }).functions = undefined;
        await expect(sendProposalAcceptedEmail('contract-1')).resolves.not.toThrow();
        (supabase as { functions: typeof original }).functions = original;
        vi.unstubAllEnvs();
    });

    it('does not throw on exception', async () => {
        vi.stubEnv('PROD', true);
        mockInvoke.mockRejectedValue(new Error('network error'));
        await expect(sendProposalAcceptedEmail('contract-1')).resolves.not.toThrow();
        vi.unstubAllEnvs();
    });
});
