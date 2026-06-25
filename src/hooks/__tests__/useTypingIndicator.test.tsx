import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Simple surface tests for hooks that don't rely on complex dependencies

describe('useTypingIndicator surface tests', () => {
    it('returns initial state', async () => {
        const { useTypingIndicator } = await import('../useTypingIndicator');
        const { result } = renderHook(() => useTypingIndicator('conv-1', 'user-1'));
        expect(result.current.typingUsers).toEqual([]);
        expect(result.current.isTyping).toBe(false);
        expect(typeof result.current.startTyping).toBe('function');
        expect(typeof result.current.stopTyping).toBe('function');
    });

    it('does not throw with null conversationId', async () => {
        const { useTypingIndicator } = await import('../useTypingIndicator');
        expect(() => {
            renderHook(() => useTypingIndicator(null, 'user-1'));
        }).not.toThrow();
    });

    it('does not throw with null currentUserId', async () => {
        const { useTypingIndicator } = await import('../useTypingIndicator');
        expect(() => {
            renderHook(() => useTypingIndicator('conv-1', null));
        }).not.toThrow();
    });
});