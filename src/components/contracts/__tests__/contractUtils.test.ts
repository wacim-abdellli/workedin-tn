import { describe, expect, it } from 'vitest';
import { ns, fmtDate, fmtTime, fmtSize, fmtAmount, getLoomEmbedUrl, roleTheme, focusRing, labelClass, monoClass } from '../contractUtils';

describe('ns', () => {
    it('lowercases and trims a string', () => {
        expect(ns('  Hello World  ')).toBe('hello world');
    });

    it('returns empty string for null', () => {
        expect(ns(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(ns(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
        expect(ns('')).toBe('');
    });
});

describe('fmtDate', () => {
    it('formats a valid ISO date', () => {
        const result = fmtDate('2025-06-15T10:00:00Z');
        expect(result).toBe(new Date('2025-06-15T10:00:00Z').toLocaleDateString());
    });

    it('returns fallback for null', () => {
        expect(fmtDate(null)).toBe('No due date');
    });

    it('returns custom fallback for undefined', () => {
        expect(fmtDate(undefined, 'TBD')).toBe('TBD');
    });

    it('returns fallback for invalid date string', () => {
        expect(fmtDate('not-a-date')).toBe('No due date');
    });
});

describe('fmtTime', () => {
    it('formats a valid ISO date to time', () => {
        const d = new Date('2025-06-15T14:30:00Z');
        const result = fmtTime(d.toISOString());
        const expected = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        expect(result).toBe(expected);
    });

    it('returns empty string for null', () => {
        expect(fmtTime(null)).toBe('');
    });

    it('returns empty string for invalid date', () => {
        expect(fmtTime('garbage')).toBe('');
    });
});

describe('fmtSize', () => {
    it('returns null for 0', () => {
        expect(fmtSize(0)).toBeNull();
    });

    it('returns null for negative numbers', () => {
        expect(fmtSize(-100)).toBeNull();
    });

    it('returns bytes for < 1024', () => {
        expect(fmtSize(500)).toBe('500 B');
    });

    it('returns KB for < 1048576', () => {
        expect(fmtSize(2048)).toBe('2.0 KB');
    });

    it('returns MB for >= 1048576', () => {
        expect(fmtSize(2097152)).toBe('2.0 MB');
    });

    it('handles string input', () => {
        expect(fmtSize('1024')).toBe('1.0 KB');
    });

    it('returns null for null', () => {
        expect(fmtSize(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(fmtSize(undefined)).toBeNull();
    });

    it('returns null for non-finite numbers', () => {
        expect(fmtSize(NaN)).toBeNull();
        expect(fmtSize(Infinity)).toBeNull();
    });
});

describe('fmtAmount', () => {
    it('formats a number with TND suffix', () => {
        const result = fmtAmount(1500);
        expect(result).toMatch(/TND$/);
        expect(result).not.toBe('0 TND');
    });

    it('handles zero', () => {
        expect(fmtAmount(0)).toBe('0 TND');
    });

    it('handles null', () => {
        expect(fmtAmount(null)).toBe('0 TND');
    });

    it('handles undefined', () => {
        expect(fmtAmount(undefined)).toBe('0 TND');
    });

    it('formats decimal amounts', () => {
        const result = fmtAmount(99.99);
        expect(result).toMatch(/TND$/);
        expect(result).toContain('99');
    });
});

describe('getLoomEmbedUrl', () => {
    it('extracts ID from loom.com/share/ URL', () => {
        expect(getLoomEmbedUrl('https://www.loom.com/share/abc123def456')).toBe('https://www.loom.com/embed/abc123def456');
    });

    it('extracts ID from loom.com/embed/ URL', () => {
        expect(getLoomEmbedUrl('https://www.loom.com/embed/xyz789')).toBe('https://www.loom.com/embed/xyz789');
    });

    it('returns null for non-Loom URLs', () => {
        expect(getLoomEmbedUrl('https://example.com')).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(getLoomEmbedUrl('')).toBeNull();
    });
});

describe('roleTheme', () => {
    it('returns amber theme for client role', () => {
        const theme = roleTheme('client');
        expect(theme.accent).toBe('#E8A020');
        expect(theme.roleLabel).toBe('Client');
        expect(theme.accentBg).toBe('bg-[#E8A020]');
    });

    it('returns violet theme for freelancer role', () => {
        const theme = roleTheme('freelancer');
        expect(theme.accent).toBe('#9B8FF0');
        expect(theme.roleLabel).toBe('Freelancer');
        expect(theme.accentBg).toBe('bg-[#9B8FF0]');
    });

    it('uses custom role label when provided', () => {
        const theme = roleTheme('client', 'Buyer');
        expect(theme.roleLabel).toBe('Buyer');
    });
});

describe('CSS constants', () => {
    it('focusRing contains expected classes', () => {
        expect(focusRing).toContain('focus-visible:outline-none');
    });

    it('labelClass contains expected classes', () => {
        expect(labelClass).toContain('uppercase');
    });

    it('monoClass contains expected classes', () => {
        expect(monoClass).toContain('font-mono');
    });
});
