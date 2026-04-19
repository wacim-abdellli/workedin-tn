import { describe, expect, it } from 'vitest';

import {
    normalizeContractStatus,
    resolveMessagingLifecyclePolicy,
} from '@/lib/messagingLifecycle';

describe('messagingLifecycle policy', () => {
    it('normalizes canceled alias to cancelled', () => {
        expect(normalizeContractStatus('canceled')).toBe('cancelled');
    });

    it('keeps direct conversations fully enabled', () => {
        const policy = resolveMessagingLifecyclePolicy({ kind: 'direct' });

        expect(policy.kind).toBe('direct');
        expect(policy.isReadOnly).toBe(false);
        expect(policy.canSend).toBe(true);
        expect(policy.canAttachFiles).toBe(true);
        expect(policy.canSendVoiceNotes).toBe(true);
        expect(policy.canReply).toBe(true);
        expect(policy.bannerTone).toBe('none');
    });

    it('locks completed contract conversations to read-only', () => {
        const policy = resolveMessagingLifecyclePolicy({
            kind: 'contract',
            contractStatus: 'completed',
        });

        expect(policy.isReadOnly).toBe(true);
        expect(policy.canSend).toBe(false);
        expect(policy.canAttachFiles).toBe(false);
        expect(policy.canSendVoiceNotes).toBe(false);
        expect(policy.canReply).toBe(false);
        expect(policy.bannerTone).toBe('success');
        expect(policy.blockedReasonFallback).toContain('read-only');
    });

    it('locks cancelled contract conversations to read-only', () => {
        const policy = resolveMessagingLifecyclePolicy({
            kind: 'contract',
            contractStatus: 'cancelled',
        });

        expect(policy.isReadOnly).toBe(true);
        expect(policy.canSend).toBe(false);
        expect(policy.bannerTone).toBe('danger');
    });

    it('locks disputed contracts to read-only with warning banner', () => {
        const policy = resolveMessagingLifecyclePolicy({
            kind: 'contract',
            contractStatus: 'disputed',
        });

        expect(policy.isReadOnly).toBe(true);
        expect(policy.canSend).toBe(false);
        expect(policy.bannerTone).toBe('warning');
    });

    it('keeps pending payment contracts writable with info banner', () => {
        const policy = resolveMessagingLifecyclePolicy({
            kind: 'contract',
            contractStatus: 'pending_payment',
        });

        expect(policy.isReadOnly).toBe(false);
        expect(policy.canSend).toBe(true);
        expect(policy.bannerTone).toBe('info');
    });
});
