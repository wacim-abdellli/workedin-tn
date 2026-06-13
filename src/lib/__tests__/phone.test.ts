import { describe, expect, it } from 'vitest';
import { isValidOptionalPhone, normalizeOptionalPhone, normalizePhoneNumber, sanitizePhoneInput, formatPhoneAsYouType } from '../phone';

describe('phone helpers', () => {
    it('normalizes common separators and keeps leading +', () => {
        expect(normalizePhoneNumber('+216 (25) 777-877')).toBe('+21625777877');
    });

    it('sanitizes live input by removing symbols and preserving leading +', () => {
        expect(sanitizePhoneInput('+216 (25)-777_877')).toBe('+21625777877');
    });

    it('converts leading 00 prefix while typing', () => {
        expect(sanitizePhoneInput('00216 25 777 877')).toBe('+21625777877');
    });

    it('normalizes 00 prefix to +', () => {
        expect(normalizePhoneNumber('00216 25 777 877')).toBe('+21625777877');
    });

    it('returns undefined for empty optional phone', () => {
        expect(normalizeOptionalPhone('   ')).toBeUndefined();
    });

    it('accepts local and international valid numbers', () => {
        expect(isValidOptionalPhone('25777877')).toBe(true);
        expect(isValidOptionalPhone('+21625777877')).toBe(true);
    });

    it('rejects invalid characters and invalid lengths', () => {
        expect(isValidOptionalPhone('+216-ABC-777')).toBe(false);
        expect(isValidOptionalPhone('123')).toBe(false);
        expect(isValidOptionalPhone('+12345678901234567')).toBe(false);
    });

    describe('formatPhoneAsYouType', () => {
        it('handles empty input', () => {
            expect(formatPhoneAsYouType('')).toBe('');
        });

        it('auto-prepends +216 for Tunisian numbers starting with a digit', () => {
            expect(formatPhoneAsYouType('2')).toBe('+216 2');
            expect(formatPhoneAsYouType('98')).toBe('+216 98');
            expect(formatPhoneAsYouType('987')).toBe('+216 98 7');
            expect(formatPhoneAsYouType('98765432')).toBe('+216 98 765 432');
        });

        it('converts leading 00 to prefix', () => {
            expect(formatPhoneAsYouType('0021625')).toBe('+216 25');
        });

        it('respects manually typed +216 prefix', () => {
            expect(formatPhoneAsYouType('+216')).toBe('+216');
            expect(formatPhoneAsYouType('+2169')).toBe('+216 9');
            expect(formatPhoneAsYouType('+21698765432')).toBe('+216 98 765 432');
        });

        it('recovers fixed prefix on deletions/backspaces', () => {
            expect(formatPhoneAsYouType('+21')).toBe('+216 21');
            expect(formatPhoneAsYouType('+2')).toBe('+216 2');
            expect(formatPhoneAsYouType('+')).toBe('+216');
        });

        it('forces Tunisian prefix even for other country codes', () => {
            expect(formatPhoneAsYouType('+33')).toBe('+216 33');
            expect(formatPhoneAsYouType('+336')).toBe('+216 33 6');
            expect(formatPhoneAsYouType('+33612')).toBe('+216 33 612');
            expect(formatPhoneAsYouType('+33612345')).toBe('+216 33 612 345');
        });
    });
});

