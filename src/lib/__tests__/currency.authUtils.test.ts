import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    calculateNetAfterFee,
    calculatePlatformFee,
    calculateTotalWithFee,
    formatCurrency,
    formatCurrencyCompact,
    formatTransactionStatus,
    formatTransactionType,
    formatWithdrawalMethod,
    formatWithdrawalStatus,
    getStatusColor,
    isCreditTransaction,
    isDebitTransaction,
    millimesToTnd,
    tndToMillimes,
    validateWithdrawalAmount,
} from '@/lib/currencyUtils';
import { clearAllAuthData, hardLogout, hasLingeringAuthTokens } from '@/lib/authUtils';

describe('currencyUtils', () => {
    it('formats Tunisian dinar values and converts millimes', () => {
        expect(formatCurrency(125.5)).toContain('125');
        expect(formatCurrency(125.5)).toContain('500');
        expect(formatCurrency(125.5, false)).not.toContain('د');

        expect(formatCurrencyCompact(125)).toContain('125');
        expect(formatCurrencyCompact(125.5)).toContain('500');

        expect(tndToMillimes(12.345)).toBe(12345);
        expect(millimesToTnd(12345)).toBe(12.345);
    });

    it('calculates fees and totals', () => {
        expect(calculatePlatformFee(100)).toBe(10);
        expect(calculatePlatformFee(199.999, 0.15)).toBe(30);

        expect(calculateTotalWithFee(100)).toEqual({
            originalAmount: 100,
            feeAmount: 10,
            totalAmount: 110,
        });

        expect(calculateNetAfterFee(100)).toBe(90);
        expect(calculateNetAfterFee(99.999, 0.2)).toBe(79.999);
    });

    it('validates withdrawal rules across failure and success paths', () => {
        expect(validateWithdrawalAmount(0, 50)).toEqual({
            valid: false,
            error: expect.any(String),
        });

        expect(validateWithdrawalAmount(10, 50, 20)).toEqual({
            valid: false,
            error: expect.stringContaining('20'),
        });

        expect(validateWithdrawalAmount(100, 50)).toEqual({
            valid: false,
            error: expect.any(String),
        });

        expect(validateWithdrawalAmount(25, 50)).toEqual({
            valid: true,
        });
    });

    it('formats transaction labels, withdrawal labels, and colors with fallbacks', () => {
        expect(formatTransactionType('deposit')).not.toBe('deposit');
        expect(formatTransactionType('escrow_fund', 'en')).toBe('Escrow funding');
        expect(formatTransactionType('escrow_release', 'en')).toBe('Escrow release');
        expect(formatTransactionType('platform_fee', 'en')).toBe('Platform fee');
        expect(formatTransactionType('release', 'en')).toBe('Escrow release');
        expect(formatTransactionType('fee', 'en')).toBe('Platform fee');
        expect(formatTransactionType('custom-type')).toBe('custom-type');

        expect(formatTransactionStatus('completed')).not.toBe('completed');
        expect(formatTransactionStatus('custom-status')).toBe('custom-status');

        expect(formatWithdrawalStatus('approved')).not.toBe('approved');
        expect(formatWithdrawalStatus('manual')).toBe('manual');

        expect(formatWithdrawalMethod('bank_transfer')).not.toBe('bank_transfer');
        expect(formatWithdrawalMethod('crypto')).toBe('crypto');

        expect(isCreditTransaction('deposit')).toBe(true);
        expect(isCreditTransaction('escrow_release')).toBe(true);
        expect(isCreditTransaction('release')).toBe(true);
        expect(isDebitTransaction('escrow_fund')).toBe(true);
        expect(isDebitTransaction('platform_fee')).toBe(true);
        expect(isDebitTransaction('fee')).toBe(true);
        expect(isDebitTransaction('refund')).toBe(false);

        expect(getStatusColor('completed')).toContain('text-green-600');
        expect(getStatusColor('unknown')).toBe('text-gray-600 bg-gray-100');
    });
});

describe('authUtils', () => {
    const originalLocation = window.location;
    let replaceMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = 'sb-session=value';
        document.cookie = 'supabase-auth=value';
        document.cookie = 'plain=value';

        localStorage.setItem('sb-project-auth-token', 'abc');
        localStorage.setItem('supabase.refresh', 'def');
        localStorage.setItem('plain-key', 'keep');

        sessionStorage.setItem('auth-cache', 'ghi');
        sessionStorage.setItem('token-cache', 'jkl');
        sessionStorage.setItem('plain-session', 'keep');

        replaceMock = vi.fn();
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                ...originalLocation,
                replace: replaceMock,
            },
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = 'sb-session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = 'supabase-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = 'plain=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });

    it('clears auth-related browser storage and auth cookies', () => {
        clearAllAuthData();

        expect(localStorage.getItem('sb-project-auth-token')).toBeFalsy();
        expect(localStorage.getItem('supabase.refresh')).toBeFalsy();

        expect(sessionStorage.getItem('auth-cache')).toBeFalsy();
        expect(sessionStorage.getItem('token-cache')).toBeFalsy();

        expect(document.cookie).toContain('plain=value');
        expect(document.cookie).not.toContain('sb-session=value');
        expect(document.cookie).not.toContain('supabase-auth=value');
        expect(hasLingeringAuthTokens()).toBe(false);
    });

    it('performs a hard logout and redirects to the requested path', () => {
        hardLogout('/goodbye');

        expect(replaceMock).toHaveBeenCalledWith('/goodbye');
        expect(localStorage.getItem('sb-project-auth-token')).toBeFalsy();
        expect(sessionStorage.getItem('auth-cache')).toBeFalsy();
    });
});
