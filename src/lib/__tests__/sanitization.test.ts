import { describe, expect, it, vi } from 'vitest';

// Mock DOMPurify - simulate basic tag stripping
vi.mock('dompurify', () => ({
    default: {
        sanitize: vi.fn((input: string, config?: Record<string, unknown>) => {
            const allowedTags = (config?.ALLOWED_TAGS as string[]) ?? [];
            if (allowedTags.length === 0) {
                // plainText mode: strip ALL HTML tags
                return input.replace(/<[^>]*>/g, '');
            }
            // limitedHtml mode: only keep allowed tags
            const tagPattern = /<(\/?)(\w+)[^>]*>/g;
            return input.replace(tagPattern, (match, slash, tagName) => {
                return allowedTags.includes(tagName.toLowerCase()) ? match : '';
            });
        }),
    },
}));

import { sanitizeHtml, sanitizeText } from '../sanitization';

describe('sanitization', () => {
    describe('sanitizeHtml', () => {
        it('strips all HTML in plainText mode (default)', () => {
            expect(sanitizeHtml('<b>hello</b>')).toBe('hello');
        });

        it('strips all HTML in explicit plainText mode', () => {
            expect(sanitizeHtml('<script>alert(1)</script>hello', 'plainText')).toBe('alert(1)hello');
        });

        it('allows safe tags in limitedHtml mode', () => {
            const result = sanitizeHtml('<b>bold</b> and <i>italic</i>', 'limitedHtml');
            expect(result).toContain('bold');
            expect(result).toContain('italic');
        });

        it('strips script tags in limitedHtml mode', () => {
            const result = sanitizeHtml('<script>alert(1)</script><b>safe</b>', 'limitedHtml');
            expect(result).not.toContain('script');
            expect(result).toContain('safe');
        });

        it('handles empty input', () => {
            expect(sanitizeHtml('')).toBe('');
        });

        it('handles non-HTML input', () => {
            expect(sanitizeHtml('just text')).toBe('just text');
        });

        it('defaults to plainText policy', () => {
            const result = sanitizeHtml('<p>paragraph</p>');
            expect(result).toBe('paragraph');
        });
    });

    describe('sanitizeText', () => {
        it('strips all HTML and trims', () => {
            expect(sanitizeText('  <b>hello</b>  ')).toBe('hello');
        });

        it('strips script tags but preserves text content', () => {
            const result = sanitizeText('<script>alert(1)</script>safe');
            // DOMPurify strips tags but keeps text content between them
            expect(result).toBe('alert(1)safe');
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('</script>');
        });

        it('handles plain text', () => {
            expect(sanitizeText('no html here')).toBe('no html here');
        });

        it('handles empty string', () => {
            expect(sanitizeText('')).toBe('');
        });

        it('trims whitespace', () => {
            expect(sanitizeText('  spaced  ')).toBe('spaced');
        });
    });
});
