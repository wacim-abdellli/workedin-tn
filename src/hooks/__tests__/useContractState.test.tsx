import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const hookState = vi.hoisted(() => ({
    tableResults: {} as Record<string, unknown>,
    updateCalls: [] as unknown[],
    rpcCalls: [] as Array<{ fn: string; params: unknown }>,
    rpcErrors: {} as Record<string, Error | null>,
    sendMessage: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

vi.mock('@/services/messages', () => ({
    sendContractMessage: hookState.sendMessage,
}));

vi.mock('@/lib/supabase', () => {
    const createBuilder = (table: string) => {
        const builder = {
            select: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            single: vi.fn(async () => hookState.tableResults[table] ?? { data: null, error: null }),
            insert: vi.fn(() => builder),
            update: vi.fn((value: unknown) => {
                hookState.updateCalls.push({ table, value });
                return builder;
            }),
            then: (resolve: (value: unknown) => unknown) =>
                Promise.resolve(resolve(hookState.tableResults[table] ?? { data: null, error: null })),
        };

        return builder;
    };

    return {
        supabase: {
            from: vi.fn((table: string) => createBuilder(table)),
            rpc: vi.fn(async (fn: string, params: unknown) => {
                hookState.rpcCalls.push({ fn, params });
                return { error: hookState.rpcErrors[fn] ?? null };
            }),
        },
    };
});

import { logger } from '@/lib/logger';
import { useContractState } from '@/hooks/useContractState';

describe('useContractState', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        hookState.tableResults = {
            contracts: {
                data: {
                    id: 'contract-1',
                    job_id: 'job-1',
                    freelancer_id: 'freelancer-1',
                    client_id: 'client-1',
                    status: 'active',
                    payment_status: 'pending',
                    started_at: '2026-03-01T00:00:00.000Z',
                },
                error: null,
            },
        };
        hookState.updateCalls = [];
        hookState.rpcCalls = [];
        hookState.rpcErrors = {};
        hookState.sendMessage.mockResolvedValue({ error: null });
    });

    it('refreshes contract state and allows freelancer delivery actions', async () => {
        const { result } = renderHook(() =>
            useContractState({
                contractId: 'contract-1',
                userId: 'freelancer-1',
                userRole: 'freelancer',
            })
        );

        await act(async () => {
            await result.current.refresh();
        });

        expect(result.current.contract?.id).toBe('contract-1');
        expect(result.current.canDeliver).toBe(true);
        expect(result.current.canAccept).toBe(false);
        expect(result.current.canDispute).toBe(true);

        await act(async () => {
            await result.current.deliverWork('Ready for review');
        });

        expect(hookState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
            contract_id: 'contract-1',
            sender_id: 'freelancer-1',
            receiver_id: 'client-1',
            message_type: 'delivery',
        }));
        expect(hookState.rpcCalls).toContainEqual({
            fn: 'submit_contract_delivery_atomic',
            params: {
                p_contract_id: 'contract-1',
                p_delivery_note: 'Ready for review',
                p_review_assets: [],
                p_final_assets: [],
            },
        });
        expect(result.current.contract).toEqual(expect.objectContaining({
            status: 'active',
            delivery_note: 'Ready for review',
        }));
        expect(result.current.isDelivering).toBe(false);
    });

    it('supports client acceptance, feedback, and disputes', async () => {
        hookState.tableResults.contracts = {
            data: {
                id: 'contract-1',
                job_id: 'job-1',
                freelancer_id: 'freelancer-1',
                client_id: 'client-1',
                status: 'delivery_submitted',
                payment_status: 'pending',
                delivery_note: 'submitted',
                started_at: '2026-03-01T00:00:00.000Z',
            },
            error: null,
        };

        const { result } = renderHook(() =>
            useContractState({
                contractId: 'contract-1',
                userId: 'client-1',
                userRole: 'client',
            })
        );

        await act(async () => {
            await result.current.refresh();
        });

        await act(async () => {
            await result.current.requestChanges('Please adjust spacing');
        });

        expect(hookState.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
            sender_id: 'client-1',
            receiver_id: 'freelancer-1',
            message_type: 'feedback',
        }));

        const acceptHook = renderHook(() =>
            useContractState({
                contractId: 'contract-1',
                userId: 'client-1',
                userRole: 'client',
            })
        );

        await act(async () => {
            await acceptHook.result.current.refresh();
        });

        await act(async () => {
            await acceptHook.result.current.acceptWork();
        });

        expect(hookState.rpcCalls).toContainEqual({
            fn: 'release_contract_payment_atomic',
            params: { p_contract_id: 'contract-1' },
        });
        expect(acceptHook.result.current.contract).toEqual(expect.objectContaining({
            status: 'completed',
            payment_status: 'released',
            completed_at: expect.any(String),
        }));

        const disputeHook = renderHook(() =>
            useContractState({
                contractId: 'contract-1',
                userId: 'client-1',
                userRole: 'client',
            })
        );

        await act(async () => {
            await disputeHook.result.current.refresh();
        });

        await waitFor(() => {
            expect(disputeHook.result.current.contract?.id).toBe('contract-1');
        });

        await act(async () => {
            await disputeHook.result.current.openDispute('Milestone disagreement');
        });

        expect(hookState.rpcCalls).toContainEqual({
            fn: 'open_dispute_atomic',
            params: {
                p_contract_id: 'contract-1',
                p_reason: 'Milestone disagreement',
            },
        });
        expect(disputeHook.result.current.contract).toEqual(expect.objectContaining({
            status: 'disputed',
            dispute_reason: 'Milestone disagreement',
        }));
        expect(disputeHook.result.current.isDisputing).toBe(false);
    });

    it('surfaces refresh errors and blocks invalid role transitions', async () => {
        hookState.tableResults.contracts = {
            data: null,
            error: new Error('fetch failed'),
        };

        const { result } = renderHook(() =>
            useContractState({
                contractId: 'contract-1',
                userId: 'client-1',
                userRole: 'client',
            })
        );

        await act(async () => {
            await result.current.refresh();
        });

        expect(logger.error).toHaveBeenCalled();
        await waitFor(() => {
            expect(result.current.error).toBeInstanceOf(Error);
            expect(result.current.isLoading).toBe(false);
        });

        await expect(result.current.deliverWork('Nope')).rejects.toThrow();
    });

    it('surfaces release RPC failures during client acceptance', async () => {
        hookState.rpcErrors.release_contract_payment_atomic = new Error('release failed');
        hookState.tableResults.contracts = {
            data: {
                id: 'contract-1',
                job_id: 'job-1',
                freelancer_id: 'freelancer-1',
                client_id: 'client-1',
                status: 'delivery_submitted',
                payment_status: 'pending',
                delivery_note: 'submitted',
                started_at: '2026-03-01T00:00:00.000Z',
            },
            error: null,
        };

        const { result } = renderHook(() =>
            useContractState({
                contractId: 'contract-1',
                userId: 'client-1',
                userRole: 'client',
            })
        );

        await act(async () => {
            await result.current.refresh();
        });

        await expect(result.current.acceptWork()).rejects.toThrow('release failed');

        expect(hookState.rpcCalls).toContainEqual({
            fn: 'release_contract_payment_atomic',
            params: { p_contract_id: 'contract-1' },
        });
        expect(hookState.sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({
            contract_id: 'contract-1',
            message_type: 'system',
        }));
        expect(result.current.contract).toEqual(expect.objectContaining({
            status: 'delivery_submitted',
            payment_status: 'pending',
        }));
        expect(result.current.isAccepting).toBe(false);
    });
});
