import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContractData } from '../types';
import type { ActionContext } from '../contractActions';

const mockState = vi.hoisted(() => ({
    rpcResults: {} as Record<string, { data?: unknown; error?: Error | null }>,
    rpcCalls: [] as Array<{ fn: string; params: unknown }>,
    sendMessage: vi.fn(),
    releaseEscrow: vi.fn(),
    refundEscrow: vi.fn(),
    canFreelancerDeliverForStatus: vi.fn(() => true),
    canClientAcceptForStatus: vi.fn(() => true),
    canClientRequestChangesForStatus: vi.fn(() => true),
    canOpenDisputeForStatus: vi.fn(() => true),
    hasRecordedDeliveryEvidence: vi.fn(() => false),
}));

vi.mock('@/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        rpc: vi.fn(async (fn: string, params: unknown) => {
            mockState.rpcCalls.push({ fn, params });
            return mockState.rpcResults[fn] ?? { data: null, error: null };
        }),
        from: vi.fn(() => ({
            update: vi.fn(() => ({
                eq: vi.fn(async () => ({ error: null })),
            })),
        })),
    },
}));

vi.mock('@/services/messages', () => ({
    sendContractMessage: mockState.sendMessage,
}));

vi.mock('@/services/dhmad', () => ({
    releaseEscrow: mockState.releaseEscrow,
    refundEscrow: mockState.refundEscrow,
}));

vi.mock('@/lib/contractWorkflow', () => ({
    canFreelancerDeliverForStatus: mockState.canFreelancerDeliverForStatus,
    canClientAcceptForStatus: mockState.canClientAcceptForStatus,
    canClientRequestChangesForStatus: mockState.canClientRequestChangesForStatus,
    canOpenDisputeForStatus: mockState.canOpenDisputeForStatus,
    hasRecordedDeliveryEvidence: mockState.hasRecordedDeliveryEvidence,
}));

// Import AFTER mocks
const {
    deliverWork,
    acceptWork,
    requestChanges,
    openDispute,
    holdClearancePayment,
    cancelContract,
    deliverMilestoneWork,
    acceptMilestoneWork,
    holdMilestoneClearance,
} = await import('../contractActions');

function makeContract(overrides: Partial<ContractData> = {}): ContractData {
    return {
        id: 'contract-1',
        job_id: 'job-1',
        freelancer_id: 'freelancer-1',
        client_id: 'client-1',
        status: 'active',
        payment_status: 'pending',
        started_at: '2026-03-01T00:00:00.000Z',
        ...overrides,
    };
}

function makeCtx(overrides: Partial<ActionContext> = {}): ActionContext {
    const contract = overrides.contract ?? makeContract();
    return {
        contract,
        contractId: contract.id,
        userId: 'freelancer-1',
        userRole: 'freelancer',
        setContract: vi.fn(),
        invalidateQueries: vi.fn(async () => {}),
        ...overrides,
    };
}

describe('contractActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockState.rpcResults = {};
        mockState.rpcCalls = [];
        mockState.sendMessage.mockResolvedValue({ error: null });
        mockState.releaseEscrow.mockResolvedValue({});
        mockState.refundEscrow.mockResolvedValue({});
        mockState.canFreelancerDeliverForStatus.mockReturnValue(true);
        mockState.canClientAcceptForStatus.mockReturnValue(true);
        mockState.canClientRequestChangesForStatus.mockReturnValue(true);
        mockState.canOpenDisputeForStatus.mockReturnValue(true);
        mockState.hasRecordedDeliveryEvidence.mockReturnValue(false);
    });

    describe('deliverWork', () => {
        it('throws if userRole is not freelancer', async () => {
            const ctx = makeCtx({ userRole: 'client' });
            await expect(deliverWork(ctx, 'note')).rejects.toThrow('Only freelancers can deliver work');
        });

        it('throws if status not deliverable', async () => {
            mockState.canFreelancerDeliverForStatus.mockReturnValue(false);
            const ctx = makeCtx();
            await expect(deliverWork(ctx, 'note')).rejects.toThrow('not ready for delivery');
        });

        it('throws if no counterparty', async () => {
            const ctx = makeCtx({ contract: makeContract({ freelancer_id: '', client_id: '' }) });
            await expect(deliverWork(ctx, 'note')).rejects.toThrow('Unable to determine message recipient');
        });

        it('calls RPC, sends message, and updates contract', async () => {
            mockState.rpcResults.submit_contract_delivery_atomic = {
                data: { status: 'delivery_submitted', delivery_note: 'Done' },
                error: null,
            };
            const ctx = makeCtx();
            await deliverWork(ctx, 'All done');

            expect(mockState.rpcCalls).toContainEqual({
                fn: 'submit_contract_delivery_atomic',
                params: expect.objectContaining({
                    p_contract_id: 'contract-1',
                    p_delivery_note: 'All done',
                }),
            });
            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                contract_id: 'contract-1',
                sender_id: 'freelancer-1',
                receiver_id: 'client-1',
                message_type: 'delivery',
            }));
            expect(ctx.setContract).toHaveBeenCalled();
            expect(ctx.invalidateQueries).toHaveBeenCalled();
        });

        it('sends [[delivery]] prefix when note is empty', async () => {
            mockState.rpcResults.submit_contract_delivery_atomic = { data: { status: 'active' }, error: null };
            const ctx = makeCtx();
            await deliverWork(ctx, '');

            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                content: '[[delivery]]',
            }));
        });

        it('throws on RPC error', async () => {
            mockState.rpcResults.submit_contract_delivery_atomic = { error: new Error('rpc fail') };
            const ctx = makeCtx();
            await expect(deliverWork(ctx, 'note')).rejects.toThrow('rpc fail');
        });

        it('throws on message error', async () => {
            mockState.rpcResults.submit_contract_delivery_atomic = { data: {}, error: null };
            mockState.sendMessage.mockResolvedValue({ error: new Error('msg fail') });
            const ctx = makeCtx();
            await expect(deliverWork(ctx, 'note')).rejects.toThrow('msg fail');
        });
    });

    describe('acceptWork', () => {
        it('throws if userRole is not client', async () => {
            const ctx = makeCtx({ userRole: 'freelancer' });
            await expect(acceptWork(ctx)).rejects.toThrow('Only clients can accept work');
        });

        it('throws if cannot accept for status', async () => {
            mockState.canClientAcceptForStatus.mockReturnValue(false);
            const ctx = makeCtx({ userRole: 'client' });
            await expect(acceptWork(ctx)).rejects.toThrow('Work must be delivered');
        });

        it('releases escrow and calls release RPC', async () => {
            mockState.rpcResults.release_contract_payment_atomic = { data: null, error: null };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ status: 'delivery_submitted', dhmad_escrow_id: 'escrow-1' }),
            });

            await acceptWork(ctx);

            expect(mockState.releaseEscrow).toHaveBeenCalledWith('escrow-1', 'contract-1');
            expect(mockState.rpcCalls).toContainEqual({
                fn: 'release_contract_payment_atomic',
                params: { p_contract_id: 'contract-1' },
            });
            expect(ctx.setContract).toHaveBeenCalled();
        });

        it('sends system message after acceptance', async () => {
            mockState.rpcResults.release_contract_payment_atomic = { data: null, error: null };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ status: 'delivery_submitted' }),
            });

            await acceptWork(ctx);

            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                message_type: 'system',
                content: 'Work has been accepted and payment released',
            }));
        });

        it('throws if release RPC fails', async () => {
            mockState.rpcResults.release_contract_payment_atomic = { error: new Error('release fail') };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ status: 'delivery_submitted' }),
            });

            await expect(acceptWork(ctx)).rejects.toThrow('release fail');
        });

        it('throws if escrow release fails', async () => {
            mockState.releaseEscrow.mockRejectedValue(new Error('escrow fail'));
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ status: 'delivery_submitted', dhmad_escrow_id: 'escrow-1' }),
            });

            await expect(acceptWork(ctx)).rejects.toThrow('payment.releaseFailed');
        });
    });

    describe('requestChanges', () => {
        it('throws if userRole is not client', async () => {
            const ctx = makeCtx({ userRole: 'freelancer' });
            await expect(requestChanges(ctx, 'feedback')).rejects.toThrow('Only clients can request changes');
        });

        it('throws if cannot request changes for status', async () => {
            mockState.canClientRequestChangesForStatus.mockReturnValue(false);
            const ctx = makeCtx({ userRole: 'client' });
            await expect(requestChanges(ctx, 'feedback')).rejects.toThrow('Changes can only be requested');
        });

        it('throws if revision limit reached', async () => {
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({
                    status: 'delivery_submitted',
                    revision_requests_count: 2,
                    max_revision_rounds: 2,
                }),
            });
            await expect(requestChanges(ctx, 'feedback')).rejects.toThrow('Revision limit reached');
        });

        it('calls RPC, sends feedback message, and updates contract', async () => {
            mockState.rpcResults.request_contract_revision_atomic = { data: null, error: null };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ status: 'delivery_submitted' }),
            });

            await requestChanges(ctx, 'Needs more work');

            expect(mockState.rpcCalls).toContainEqual({
                fn: 'request_contract_revision_atomic',
                params: expect.objectContaining({ p_reason: 'Needs more work' }),
            });
            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                message_type: 'feedback',
                content: 'Changes requested: Needs more work',
            }));
            expect(ctx.setContract).toHaveBeenCalled();
        });

        it('throws on RPC error', async () => {
            mockState.rpcResults.request_contract_revision_atomic = { error: new Error('revision fail') };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ status: 'delivery_submitted' }),
            });
            await expect(requestChanges(ctx, 'feedback')).rejects.toThrow('revision fail');
        });
    });

    describe('openDispute', () => {
        it('throws if cannot dispute for status', async () => {
            mockState.canOpenDisputeForStatus.mockReturnValue(false);
            const ctx = makeCtx();
            await expect(openDispute(ctx, 'reason')).rejects.toThrow('cannot be opened');
        });

        it('calls RPC, sends dispute message, and updates contract', async () => {
            mockState.rpcResults.open_dispute_atomic = { data: null, error: null };
            const ctx = makeCtx();

            await openDispute(ctx, 'Quality issue');

            expect(mockState.rpcCalls).toContainEqual({
                fn: 'open_dispute_atomic',
                params: expect.objectContaining({ p_reason: 'Quality issue' }),
            });
            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                message_type: 'dispute',
            }));
            expect(ctx.setContract).toHaveBeenCalled();
        });

        it('logs warning but does not throw if message fails', async () => {
            mockState.rpcResults.open_dispute_atomic = { data: null, error: null };
            mockState.sendMessage.mockResolvedValue({ error: new Error('msg fail') });
            const ctx = makeCtx();

            await openDispute(ctx, 'reason');
            expect(ctx.setContract).toHaveBeenCalled();
        });

        it('throws on RPC error', async () => {
            mockState.rpcResults.open_dispute_atomic = { error: new Error('dispute fail') };
            const ctx = makeCtx();
            await expect(openDispute(ctx, 'reason')).rejects.toThrow('dispute fail');
        });
    });

    describe('holdClearancePayment', () => {
        it('throws if userRole is not client', async () => {
            const ctx = makeCtx({ userRole: 'freelancer' });
            await expect(holdClearancePayment(ctx, 'reason')).rejects.toThrow('Only clients can suspend clearance');
        });

        it('throws if clearance window not active', async () => {
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ escrow_pending_clearance_until: null }),
            });
            await expect(holdClearancePayment(ctx, 'reason')).rejects.toThrow('Clearance window is not active');
        });

        it('calls RPC and sends dispute message', async () => {
            mockState.rpcResults.hold_clearance_payment_dispute = { data: null, error: null };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ escrow_pending_clearance_until: '2026-04-01T00:00:00.000Z' }),
            });

            await holdClearancePayment(ctx, 'Disagreement');

            expect(mockState.rpcCalls).toContainEqual({
                fn: 'hold_clearance_payment_dispute',
                params: expect.objectContaining({ p_dispute_reason: 'Disagreement' }),
            });
            expect(ctx.setContract).toHaveBeenCalled();
        });

        it('throws on RPC error', async () => {
            mockState.rpcResults.hold_clearance_payment_dispute = { error: new Error('hold fail') };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ escrow_pending_clearance_until: '2026-04-01T00:00:00.000Z' }),
            });
            await expect(holdClearancePayment(ctx, 'reason')).rejects.toThrow('hold fail');
        });
    });

    describe('cancelContract', () => {
        it('throws if status not cancellable', async () => {
            const ctx = makeCtx({ contract: makeContract({ status: 'completed' }) });
            await expect(cancelContract(ctx, 'reason')).rejects.toThrow('cannot be cancelled');
        });

        it('calls RPC and updates contract to cancelled', async () => {
            mockState.rpcResults.cancel_contract_atomic = { data: null, error: null };
            const ctx = makeCtx({ contract: makeContract({ status: 'active' }) });

            await cancelContract(ctx, 'No longer needed');

            expect(mockState.rpcCalls).toContainEqual({
                fn: 'cancel_contract_atomic',
                params: expect.objectContaining({ p_reason: 'No longer needed' }),
            });
            expect(ctx.setContract).toHaveBeenCalled();
        });

        it('sends cancellation message to counterparty', async () => {
            mockState.rpcResults.cancel_contract_atomic = { data: null, error: null };
            const ctx = makeCtx({
                userRole: 'freelancer',
                contract: makeContract({ status: 'active' }),
            });

            await cancelContract(ctx, 'Changed plans');

            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                content: expect.stringContaining('Changed plans'),
                message_type: 'system',
            }));
        });

        it('refunds escrow if result indicates needs_refund', async () => {
            mockState.rpcResults.cancel_contract_atomic = {
                data: { needs_refund: true, dhmad_escrow_id: 'escrow-1' },
                error: null,
            };
            const ctx = makeCtx({ contract: makeContract({ status: 'active' }) });

            await cancelContract(ctx, 'refund please');

            expect(mockState.refundEscrow).toHaveBeenCalledWith('escrow-1', 'contract-1', 'refund please');
        });

        it('does not throw if refund fails', async () => {
            mockState.rpcResults.cancel_contract_atomic = {
                data: { needs_refund: true, dhmad_escrow_id: 'escrow-1' },
                error: null,
            };
            mockState.refundEscrow.mockRejectedValue(new Error('refund fail'));
            const ctx = makeCtx({ contract: makeContract({ status: 'active' }) });

            await cancelContract(ctx, 'reason');
            expect(ctx.setContract).toHaveBeenCalled();
        });

        it('throws on RPC error', async () => {
            mockState.rpcResults.cancel_contract_atomic = { error: new Error('cancel fail') };
            const ctx = makeCtx({ contract: makeContract({ status: 'active' }) });
            await expect(cancelContract(ctx, 'reason')).rejects.toThrow('cancel fail');
        });

        it('allows cancellation from pending_payment status', async () => {
            mockState.rpcResults.cancel_contract_atomic = { data: null, error: null };
            const ctx = makeCtx({ contract: makeContract({ status: 'pending_payment' }) });

            await cancelContract(ctx, 'reason');
            expect(ctx.setContract).toHaveBeenCalled();
        });
    });

    describe('deliverMilestoneWork', () => {
        it('throws if userRole is not freelancer', async () => {
            const ctx = makeCtx({ userRole: 'client' });
            await expect(deliverMilestoneWork(ctx, 'ms-1', 'note')).rejects.toThrow('Only freelancers can deliver work');
        });

        it('calls milestone-specific RPC', async () => {
            mockState.rpcResults.submit_milestone_delivery_atomic = {
                data: { contract_status: 'active', delivery_note: 'Done' },
                error: null,
            };
            const ctx = makeCtx();

            await deliverMilestoneWork(ctx, 'ms-1', 'Milestone done');

            expect(mockState.rpcCalls).toContainEqual({
                fn: 'submit_milestone_delivery_atomic',
                params: expect.objectContaining({
                    p_milestone_id: 'ms-1',
                    p_delivery_note: 'Milestone done',
                }),
            });
        });

        it('updates milestone status in contract', async () => {
            mockState.rpcResults.submit_milestone_delivery_atomic = { data: {}, error: null };
            const contract = makeContract({
                milestones: [{ id: 'ms-1', status: 'pending' }, { id: 'ms-2', status: 'pending' }],
            });
            const ctx = makeCtx({ contract });

            await deliverMilestoneWork(ctx, 'ms-1', 'done');

            expect(ctx.setContract).toHaveBeenCalled();
            const updater = (ctx.setContract as ReturnType<typeof vi.fn>).mock.calls[0][0];
            const updated = updater(contract);
            expect(updated.milestones[0].status).toBe('submitted');
            expect(updated.milestones[1].status).toBe('pending');
        });

        it('sends delivery message with note', async () => {
            mockState.rpcResults.submit_milestone_delivery_atomic = { data: {}, error: null };
            const ctx = makeCtx();

            await deliverMilestoneWork(ctx, 'ms-1', 'Looks great');

            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                content: expect.stringContaining('Looks great'),
                message_type: 'delivery',
            }));
        });

        it('sends default message when note is empty', async () => {
            mockState.rpcResults.submit_milestone_delivery_atomic = { data: {}, error: null };
            const ctx = makeCtx();

            await deliverMilestoneWork(ctx, 'ms-1', '');

            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                content: expect.stringContaining('ready for review'),
            }));
        });
    });

    describe('acceptMilestoneWork', () => {
        it('throws if userRole is not client', async () => {
            const ctx = makeCtx({ userRole: 'freelancer' });
            await expect(acceptMilestoneWork(ctx, 'ms-1')).rejects.toThrow('Only clients can accept work');
        });

        it('releases escrow from milestone if available', async () => {
            mockState.rpcResults.release_milestone_payment_atomic = {
                data: { contract_completed: false },
                error: null,
            };
            const contract = makeContract({
                milestones: [{ id: 'ms-1', dhmad_escrow_id: 'ms-escrow-1' }],
            });
            const ctx = makeCtx({ userRole: 'client', contract });

            await acceptMilestoneWork(ctx, 'ms-1');

            expect(mockState.releaseEscrow).toHaveBeenCalledWith('ms-escrow-1', 'contract-1');
        });

        it('falls back to contract escrow if milestone has none', async () => {
            mockState.rpcResults.release_milestone_payment_atomic = {
                data: { contract_completed: false },
                error: null,
            };
            const contract = makeContract({
                dhmad_escrow_id: 'contract-escrow-1',
                milestones: [{ id: 'ms-1' }],
            });
            const ctx = makeCtx({ userRole: 'client', contract });

            await acceptMilestoneWork(ctx, 'ms-1');

            expect(mockState.releaseEscrow).toHaveBeenCalledWith('contract-escrow-1', 'contract-1');
        });

        it('skips escrow release if no escrow ID', async () => {
            mockState.rpcResults.release_milestone_payment_atomic = {
                data: { contract_completed: false },
                error: null,
            };
            const contract = makeContract({ milestones: [{ id: 'ms-1' }] });
            const ctx = makeCtx({ userRole: 'client', contract });

            await acceptMilestoneWork(ctx, 'ms-1');

            expect(mockState.releaseEscrow).not.toHaveBeenCalled();
        });

        it('marks contract completed when all milestones approved', async () => {
            mockState.rpcResults.release_milestone_payment_atomic = {
                data: { contract_completed: true },
                error: null,
            };
            const contract = makeContract({
                milestones: [{ id: 'ms-1', status: 'submitted' }],
            });
            const ctx = makeCtx({ userRole: 'client', contract });

            await acceptMilestoneWork(ctx, 'ms-1');

            expect(ctx.setContract).toHaveBeenCalled();
        });

        it('throws if escrow release fails', async () => {
            mockState.releaseEscrow.mockRejectedValue(new Error('escrow fail'));
            const contract = makeContract({
                milestones: [{ id: 'ms-1', dhmad_escrow_id: 'escrow-1' }],
            });
            const ctx = makeCtx({ userRole: 'client', contract });

            await expect(acceptMilestoneWork(ctx, 'ms-1')).rejects.toThrow('payment.releaseFailed');
        });

        it('sends payment message after acceptance', async () => {
            mockState.rpcResults.release_milestone_payment_atomic = {
                data: { contract_completed: false },
                error: null,
            };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ milestones: [{ id: 'ms-1' }] }),
            });

            await acceptMilestoneWork(ctx, 'ms-1');

            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                message_type: 'payment',
            }));
        });
    });

    describe('holdMilestoneClearance', () => {
        it('throws if userRole is not client', async () => {
            const ctx = makeCtx({ userRole: 'freelancer' });
            await expect(holdMilestoneClearance(ctx, 'ms-1', 'reason')).rejects.toThrow('Only clients can suspend clearance');
        });

        it('calls RPC and updates milestone with hold', async () => {
            mockState.rpcResults.hold_milestone_clearance_payment = { data: null, error: null };
            const contract = makeContract({
                milestones: [{ id: 'ms-1', status: 'approved' }],
            });
            const ctx = makeCtx({ userRole: 'client', contract });

            await holdMilestoneClearance(ctx, 'ms-1', 'Disagreement');

            expect(mockState.rpcCalls).toContainEqual({
                fn: 'hold_milestone_clearance_payment',
                params: expect.objectContaining({ p_milestone_id: 'ms-1', p_reason: 'Disagreement' }),
            });
            expect(ctx.setContract).toHaveBeenCalled();
        });

        it('throws on RPC error', async () => {
            mockState.rpcResults.hold_milestone_clearance_payment = { error: new Error('hold fail') };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ milestones: [{ id: 'ms-1' }] }),
            });
            await expect(holdMilestoneClearance(ctx, 'ms-1', 'reason')).rejects.toThrow('hold fail');
        });

        it('sends dispute message after hold', async () => {
            mockState.rpcResults.hold_milestone_clearance_payment = { data: null, error: null };
            const ctx = makeCtx({
                userRole: 'client',
                contract: makeContract({ milestones: [{ id: 'ms-1' }] }),
            });

            await holdMilestoneClearance(ctx, 'ms-1', 'Issue');

            expect(mockState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                message_type: 'dispute',
            }));
        });
    });
});
