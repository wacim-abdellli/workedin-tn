import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useScrollReveal } from '../useScrollReveal';

describe('useScrollReveal', () => {
    it('returns ref and isVisible false initially', () => {
        const { result } = renderHook(() => useScrollReveal());
        expect(result.current.ref).toBeDefined();
        expect(result.current.isVisible).toBe(false);
    });

    it('returns a mutable ref object', () => {
        const { result } = renderHook(() => useScrollReveal());
        expect(result.current.ref).toHaveProperty('current');
    });

    it('accepts custom options without throwing', () => {
        expect(() => {
            renderHook(() =>
                useScrollReveal({ threshold: 0.5, rootMargin: '10px', once: false })
            );
        }).not.toThrow();
    });

    it('uses default options when none provided', () => {
        // Hook should not throw with no args
        expect(() => renderHook(() => useScrollReveal())).not.toThrow();
    });
});
