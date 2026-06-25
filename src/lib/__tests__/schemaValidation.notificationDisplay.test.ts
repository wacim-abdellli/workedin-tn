import { describe, expect, it } from 'vitest';

import { getDisplayNotification } from '@/lib/notificationDisplay';
import { sanitizeProfileData, sanitizeFreelancerProfileData, isValidProfileField, isBlockedField } from '@/lib/schemaValidation';
import type { AppNotification } from '@/hooks/useRealtimeNotifications';

// ── schemaValidation.ts ─────────────────────────────────────────────────────

describe('schemaValidation', () => {
    describe('sanitizeProfileData', () => {
        it('keeps allowed fields', () => {
            const result = sanitizeProfileData({ full_name: 'Ahmed', location: 'Tunis' });
            expect(result).toEqual({ full_name: 'Ahmed', location: 'Tunis' });
        });

        it('strips blocked fields', () => {
            const result = sanitizeProfileData({ full_name: 'Ahmed', email: 'test@test.com', password: 'secret' } as any);
            expect(result).not.toHaveProperty('email');
            expect(result).not.toHaveProperty('password');
        });

        it('strips unknown fields', () => {
            const result = sanitizeProfileData({ full_name: 'Ahmed', random_field: 'value' } as any);
            expect(result).not.toHaveProperty('random_field');
        });

        it('handles empty object', () => {
            expect(sanitizeProfileData({})).toEqual({});
        });
    });

    describe('sanitizeFreelancerProfileData', () => {
        it('keeps allowed freelancer fields', () => {
            const result = sanitizeFreelancerProfileData({ title: 'Developer', skills: ['React'] });
            expect(result).toEqual({ title: 'Developer', skills: ['React'] });
        });

        it('strips unknown freelancer fields', () => {
            const result = sanitizeFreelancerProfileData({ title: 'Developer', fake_field: 'nope' } as any);
            expect(result).not.toHaveProperty('fake_field');
        });
    });

    describe('isValidProfileField', () => {
        it('returns true for known fields', () => {
            expect(isValidProfileField('full_name')).toBe(true);
            expect(isValidProfileField('avatar_url')).toBe(true);
        });

        it('returns false for unknown fields', () => {
            expect(isValidProfileField('nonexistent')).toBe(false);
        });
    });

    describe('isBlockedField', () => {
        it('blocks auth fields', () => {
            expect(isBlockedField('email')).toBe(true);
            expect(isBlockedField('password')).toBe(true);
            expect(isBlockedField('password_hash')).toBe(true);
        });

        it('allows profile fields', () => {
            expect(isBlockedField('full_name')).toBe(false);
        });
    });
});

// ── notificationDisplay.ts ───────────────────────────────────────────────────

const dummyTx = (key: string, _params?: Record<string, string | number>, fallback?: string) => fallback ?? key;

function makeNotification(overrides: Partial<AppNotification> & { type: AppNotification['type'] }): AppNotification {
    return {
        id: 'n1',
        title: '',
        body: '',
        read: false,
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

describe('notificationDisplay', () => {
    describe('getDisplayNotification', () => {
        it('passes through unchanged when no patterns match', () => {
            const n = makeNotification({ type: 'system', title: 'Random Title', body: 'Random body' });
            expect(getDisplayNotification(n, dummyTx)).toEqual(expect.objectContaining({ title: 'Random Title' }));
        });

        it('returns message category for message type', () => {
            const n = makeNotification({ type: 'message', title: 'Hello', body: 'Hi' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('message');
        });

        it('categorizes proposal accepted', () => {
            const n = makeNotification({ type: 'proposal', title: 'Accepted', body: 'proposal accepted on My Project' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('proposal_accepted');
        });

        it('categorizes proposal new', () => {
            const n = makeNotification({ type: 'proposal', title: 'New', body: 'A freelancer submitted proposal' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('proposal_new');
        });

        it('categorizes payment released', () => {
            const n = makeNotification({ type: 'payment', title: 'Payment', body: 'Payment released' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('payment_released');
        });

        it('categorizes payment funded', () => {
            const n = makeNotification({ type: 'payment', title: 'Payment', body: 'Escrow funded' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('payment_funded');
        });

        it('categorizes system verified', () => {
            const n = makeNotification({ type: 'system', title: 'Verified', body: 'Your account is now verified' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('system_verified');
        });

        it('categorizes system rejected', () => {
            const n = makeNotification({ type: 'system', title: 'Rejected', body: 'Your account has been suspended' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('system_rejected');
        });

        it('categorizes contract_update as contract_update', () => {
            const n = makeNotification({ type: 'contract', title: 'Contract Updated', body: 'Something changed' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('contract_update');
        });

        it('categorizes contract cancelled', () => {
            const n = makeNotification({ type: 'contract', title: 'Contract Cancelled', body: 'Contract cancelled by client' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('contract_cancelled');
        });

        it('categorizes contract disputed', () => {
            const n = makeNotification({ type: 'contract', title: 'Contract Dispute', body: 'A dispute was filed' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('contract_disputed');
        });

        it('categorizes contract accepted', () => {
            const n = makeNotification({ type: 'contract', title: 'Contract Started', body: 'Contract is now active' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('contract_accepted');
        });

        it('categorizes contract completed', () => {
            const n = makeNotification({ type: 'contract', title: 'Contract Completed', body: 'Work is done' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('contract_completed');
        });

        it('categorizes contract timeout', () => {
            const n = makeNotification({ type: 'contract', title: 'Contract Updated', body: 'Review window expired' });
            expect(getDisplayNotification(n, dummyTx).category).toBe('contract_timeout');
        });
    });
});
