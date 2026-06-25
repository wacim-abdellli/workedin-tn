import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('logger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('always calls console.error for error level', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { logger } = await import('../logger');
        logger.error('test error');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('formats messages with [WorkedIn] prefix', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { logger } = await import('../logger');
        logger.error('formatted msg');
        const call = spy.mock.calls[0][0];
        expect(call).toContain('[WorkedIn]');
        expect(call).toContain('[ERROR]');
        spy.mockRestore();
    });

    it('error accepts additional args', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { logger } = await import('../logger');
        logger.error('err', { detail: 'extra' });
        const call = spy.mock.calls[0];
        expect(call[0]).toContain('err');
        expect(call[1]).toEqual({ detail: 'extra' });
        spy.mockRestore();
    });

    it('default export is same as named export', async () => {
        const mod = await import('../logger');
        expect(mod.default).toBe(mod.logger);
    });

    it('logger has all expected methods', async () => {
        const { logger } = await import('../logger');
        expect(typeof logger.log).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.group).toBe('function');
        expect(typeof logger.groupEnd).toBe('function');
        expect(typeof logger.table).toBe('function');
    });
});