import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout } from '../withTimeout';

describe('withTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resolves when promise resolves before timeout', async () => {
        const promise = Promise.resolve('result');
        const result = await withTimeout(promise, 1000, 'test');
        expect(result).toBe('result');
    });

    it('rejects when timeout fires before promise resolves', async () => {
        const promise = new Promise<string>((resolve) => {
            setTimeout(() => resolve('late'), 5000);
        });

        const timeoutPromise = withTimeout(promise, 1000, 'SlowOp');

        vi.advanceTimersByTime(1000);

        await expect(timeoutPromise).rejects.toThrow('SlowOp timed out after 1000ms');
    });

    it('uses default timeout of 15000ms', async () => {
        const promise = new Promise<string>((resolve) => {
            setTimeout(() => resolve('ok'), 20000);
        });

        const timeoutPromise = withTimeout(promise);

        vi.advanceTimersByTime(15000);

        await expect(timeoutPromise).rejects.toThrow('Operation timed out after 15000ms');
    });

    it('uses default operation name "Operation"', async () => {
        const promise = new Promise<never>((resolve) => {
            setTimeout(() => resolve(undefined), 20000);
        });

        const timeoutPromise = withTimeout(promise, 100);

        vi.advanceTimersByTime(100);

        await expect(timeoutPromise).rejects.toThrow('Operation timed out');
    });

    it('rejects when promise rejects before timeout', async () => {
        const promise = Promise.reject(new Error('promise error'));

        await expect(withTimeout(promise, 1000, 'test')).rejects.toThrow('promise error');
    });

    it('cleans up timeout on successful resolve', async () => {
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        const promise = Promise.resolve('done');

        await withTimeout(promise, 1000, 'test');

        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
    });

    it('cleans up timeout on rejection', async () => {
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        const promise = Promise.reject(new Error('fail'));

        try {
            await withTimeout(promise, 1000, 'test');
        } catch {
            // expected
        }

        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
    });
});
