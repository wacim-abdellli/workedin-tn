import { describe, expect, it, vi } from 'vitest';

import { sanitizeHtml, sanitizeText } from '@/lib/sanitization';
import { withTimeout } from '@/lib/withTimeout';

// ── sanitization.ts ─────────────────────────────────────────────────────────

describe('sanitization', () => {
    describe('sanitizeHtml', () => {
        it('strips all tags in plainText mode', () => {
            expect(sanitizeHtml('<script>alert("xss")</script>Hello', 'plainText')).toBe('Hello');
        });

        it('allows safe HTML tags in limitedHtml mode', () => {
            const result = sanitizeHtml('<b>bold</b> and <i>italic</i>', 'limitedHtml');
            expect(result).toContain('bold');
            expect(result).toContain('italic');
        });

        it('strips script tags in limitedHtml mode', () => {
            expect(sanitizeHtml('<script>alert("xss")</script><b>safe</b>', 'limitedHtml')).not.toContain('script');
        });

        it('strips style tags in limitedHtml mode', () => {
            expect(sanitizeHtml('<style>body{display:none}</style><b>safe</b>', 'limitedHtml')).not.toContain('style');
        });

        it('allows links in limitedHtml mode', () => {
            const result = sanitizeHtml('<a href="https://example.com">link</a>', 'limitedHtml');
            expect(result).toContain('link');
        });

        it('defaults to plainText policy', () => {
            expect(sanitizeHtml('<b>test</b>')).toBe('test');
        });
    });

    describe('sanitizeText', () => {
        it('strips all HTML and trims', () => {
            expect(sanitizeText('  <b>hello</b>  ')).toBe('hello');
        });

        it('handles plain text', () => {
            expect(sanitizeText('just text')).toBe('just text');
        });
    });
});

// ── withTimeout.ts ──────────────────────────────────────────────────────────

describe('withTimeout', () => {
    it('resolves when promise completes before timeout', async () => {
        const result = await withTimeout(Promise.resolve('done'), 1000, 'test');
        expect(result).toBe('done');
    });

    it('rejects when timeout fires first', async () => {
        const slow = new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 200));
        await expect(withTimeout(slow, 10, 'SlowOp')).rejects.toThrow('SlowOp timed out after 10ms');
    });

    it('cleans up timeout on success', async () => {
        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
        await withTimeout(Promise.resolve('ok'), 1000, 'test');
        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
    });

    it('cleans up timeout on failure', async () => {
        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
        const failing = Promise.reject(new Error('fail'));
        await expect(withTimeout(failing, 1000, 'test')).rejects.toThrow('fail');
        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
    });

    it('rejects with operation name in error', async () => {
        const slow = new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 200));
        await expect(withTimeout(slow, 10, 'MyOp')).rejects.toThrow('MyOp timed out after 10ms');
    });
});
