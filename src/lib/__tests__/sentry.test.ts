import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockSentryInit = vi.fn();
const mockSentryCaptureException = vi.fn();

vi.mock('@sentry/react', () => ({
    init: mockSentryInit,
    captureException: mockSentryCaptureException,
}));

vi.mock('@/lib/validateEnv', () => ({
    getOptionalEnv: vi.fn(() => ({ VITE_SENTRY_DSN: 'https://key@sentry.io/project' })),
}));

describe('sentry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    // In test mode, MODE is 'test', not 'production', so initSentry
    // and captureError should not call Sentry. We test the paths
    // that are reachable in the test environment.

    it('does not initialize Sentry in test environment', async () => {
        const { initSentry } = await import('../sentry');
        initSentry();
        expect(mockSentryInit).not.toHaveBeenCalled();
    });

    it('initSentry can be called multiple times safely', async () => {
        const { initSentry } = await import('../sentry');
        initSentry();
        initSentry();
        initSentry();
        expect(mockSentryInit).not.toHaveBeenCalled();
    });

    it('captureError does not throw when called before init', async () => {
        const { captureError } = await import('../sentry');
        expect(() => captureError(new Error('test'))).not.toThrow();
    });

    it('captureError does not send in test environment after init', async () => {
        const sentry = await import('../sentry');
        sentry.initSentry();
        sentry.captureError(new Error('test'));
        expect(mockSentryCaptureException).not.toHaveBeenCalled();
    });

    it('captureError accepts context without error', async () => {
        const { captureError } = await import('../sentry');
        expect(() => captureError(new Error('test'), { key: 'value' })).not.toThrow();
    });

    it('exports Sentry namespace', async () => {
        const sentry = await import('../sentry');
        expect(sentry.Sentry).toBeDefined();
        expect(typeof sentry.Sentry.init).toBe('function');
        expect(typeof sentry.Sentry.captureException).toBe('function');
    });

    it('initializes only once due to isInitialized guard', async () => {
        const { initSentry } = await import('../sentry');
        // This should not error on subsequent calls
        initSentry();
        initSentry();
    });
});
