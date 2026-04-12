import { describe, expect, it } from 'vitest';
import { isValidOptionalPhone, normalizeOptionalPhone, normalizePhoneNumber, sanitizePhoneInput } from '../phone';

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
});
