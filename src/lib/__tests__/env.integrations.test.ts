import { beforeEach, describe, expect, it, vi } from 'vitest';

const integrationState = vi.hoisted(() => ({
    invoke: vi.fn(),
    posthogInit: vi.fn(),
    posthogCapture: vi.fn(),
    loggerLog: vi.fn(),
    loggerError: vi.fn(),
}));

vi.mock('posthog-js', () => ({
    default: {
        init: integrationState.posthogInit,
        capture: integrationState.posthogCapture,
    },
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        log: integrationState.loggerLog,
        error: integrationState.loggerError,
    },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        functions: {
            invoke: integrationState.invoke,
        },
    },
}));

const originalEnv = { ...import.meta.env };

function setEnv(overrides: Record<string, unknown>) {
    Object.assign(import.meta.env, originalEnv, overrides);
}

describe('env and integrations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        setEnv({
            DEV: false,
            PROD: false,
            MODE: 'test',
            VITE_POSTHOG_KEY: '',
            VITE_POSTHOG_HOST: '',
            VITE_SUPABASE_URL: '',
            VITE_SUPABASE_ANON_KEY: '',
            VITE_GOOGLE_ANALYTICS_ID: '',
            VITE_SENTRY_DSN: '',
        });

        integrationState.invoke.mockResolvedValue({ data: {}, error: null });
    });

    it('handles Flouci payments in dev mode and prod mode', async () => {
        setEnv({ DEV: true, PROD: false, MODE: 'development' });
        const devFlouci = await import('@/lib/flouci');

        const devPayment = await devFlouci.initiatePayment({
            amount: 5000,
            success_link: 'https://app.test/success?x=1',
            fail_link: 'https://app.test/fail',
            developer_tracking_id: 'track-1',
            session_timeout_secs: 300,
        });

        expect(devPayment.payment_id).toContain('mock_');
        expect(devPayment.link).toContain('payment_id=');

        expect(await devFlouci.verifyPayment('mock_payment')).toMatchObject({
            status: 'SUCCESS',
            payment_id: 'mock_payment',
        });
        expect(await devFlouci.verifyPayment('other-payment')).toMatchObject({
            status: 'FAILED',
            payment_id: 'other-payment',
        });
        expect(devFlouci.isFlouciConfigured()).toBe(true);
        expect(devFlouci.getFlouciStatus()).toEqual({
            configured: true,
            devMode: true,
            usingEdgeFunctions: false,
        });

        vi.resetModules();
        setEnv({ DEV: false, PROD: true, MODE: 'production' });
        integrationState.invoke
            .mockResolvedValueOnce({
                data: {
                    payment_id: 'payment-1',
                    link: 'https://flouci.test/pay/1',
                },
                error: null,
            })
            .mockResolvedValueOnce({
                data: {
                    verification: {
                        status: 'SUCCESS',
                        payment_id: 'payment-1',
                        amount: 5000,
                        created_at: '2026-03-23T00:00:00.000Z',
                    },
                    completion: {
                        success: true,
                        data: { transactionId: 'tx-1' },
                    },
                },
                error: null,
            })
            .mockResolvedValueOnce({
                data: {
                    status: 'SUCCESS',
                    amount: 5000,
                    developer_tracking_id: 'track-1',
                    created_at: '2026-03-23T00:00:00.000Z',
                },
                error: null,
            });

        const prodFlouci = await import('@/lib/flouci');

        expect(await prodFlouci.initiatePayment({
            amount: 5000,
            success_link: 'https://app.test/success',
            fail_link: 'https://app.test/fail',
            developer_tracking_id: 'track-1',
            session_timeout_secs: 300,
            contract_id: 'contract-1',
            transaction_amount: 50,
        })).toEqual({
            payment_id: 'payment-1',
            link: 'https://flouci.test/pay/1',
        });

        expect(integrationState.invoke).toHaveBeenNthCalledWith(1, 'flouci-initiate-payment', {
            body: {
                amount: 5000,
                success_link: 'https://app.test/success',
                fail_link: 'https://app.test/fail',
                developer_tracking_id: 'track-1',
                session_timeout_secs: 300,
                contract_id: 'contract-1',
                transaction_amount: 50,
            },
        });

        expect(await prodFlouci.verifyPayment('payment-1', {
            complete_payment: true,
            transaction_id: 'tx-1',
        })).toEqual({
            status: 'SUCCESS',
            payment_id: 'payment-1',
            amount: 5000,
            created_at: '2026-03-23T00:00:00.000Z',
            completion: {
                success: true,
                data: { transactionId: 'tx-1' },
            },
        });

        expect(await prodFlouci.verifyPayment('payment-1')).toEqual({
            status: 'SUCCESS',
            payment_id: 'payment-1',
            amount: 5000,
            developer_tracking_id: 'track-1',
            created_at: '2026-03-23T00:00:00.000Z',
        });

        expect(prodFlouci.isFlouciConfigured()).toBe(true);
        expect(prodFlouci.getFlouciStatus()).toEqual({
            configured: true,
            devMode: false,
            usingEdgeFunctions: true,
        });
    });

    it('surfaces Flouci edge-function failures', async () => {
        setEnv({ DEV: false, PROD: true, MODE: 'production' });
        integrationState.invoke
            .mockResolvedValueOnce({
                data: null,
                error: { message: 'invoke failed' },
            })
            .mockResolvedValueOnce({
                data: { error: 'payment rejected' },
                error: null,
            })
            .mockResolvedValueOnce({
                data: null,
                error: { message: 'verify failed' },
            });

        const flouci = await import('@/lib/flouci');

        await expect(flouci.initiatePayment({
            amount: 1000,
            success_link: 'https://app.test/success',
            fail_link: 'https://app.test/fail',
            developer_tracking_id: 'track-2',
            session_timeout_secs: 300,
        })).rejects.toThrow('invoke failed');

        await expect(flouci.initiatePayment({
            amount: 1000,
            success_link: 'https://app.test/success',
            fail_link: 'https://app.test/fail',
            developer_tracking_id: 'track-3',
            session_timeout_secs: 300,
        })).rejects.toThrow('payment rejected');

        await expect(flouci.verifyPayment('payment-2')).rejects.toThrow(/.+/);
        expect(integrationState.loggerError).toHaveBeenCalled();
    });

    it('validates env vars and exposes optional env safely', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const validateEnvModule = await import('@/lib/validateEnv');

        setEnv({
            MODE: 'development',
            VITE_SUPABASE_URL: '',
            VITE_SUPABASE_ANON_KEY: '',
        });

        expect(validateEnvModule.validateEnv()).toEqual({
            VITE_SUPABASE_URL: '',
            VITE_SUPABASE_ANON_KEY: '',
        });
        expect(warnSpy).toHaveBeenCalled();

        setEnv({
            MODE: 'production',
            VITE_SUPABASE_URL: '',
            VITE_SUPABASE_ANON_KEY: '',
        });

        expect(() => validateEnvModule.validateEnv()).toThrow(/Missing required environment variables/);

        setEnv({
            MODE: 'production',
            VITE_SUPABASE_URL: 'https://supabase.test',
            VITE_SUPABASE_ANON_KEY: 'anon-key',
            VITE_GOOGLE_ANALYTICS_ID: 'ga-id',
            VITE_SENTRY_DSN: 'dsn',
        });

        expect(validateEnvModule.validateEnv()).toEqual({
            VITE_SUPABASE_URL: 'https://supabase.test',
            VITE_SUPABASE_ANON_KEY: 'anon-key',
        });
        // Flouci/Resend secrets are Edge Function secrets — not VITE_ vars.
        expect(validateEnvModule.getOptionalEnv()).toEqual({
            VITE_GOOGLE_ANALYTICS_ID: 'ga-id',
            VITE_SENTRY_DSN: 'dsn',
        });

        warnSpy.mockRestore();
    });

    it('initializes and tracks analytics events', async () => {
        setEnv({
            PROD: true,
            DEV: false,
            MODE: 'production',
            VITE_POSTHOG_KEY: 'ph-key',
            VITE_POSTHOG_HOST: 'https://posthog.test',
        });

        const analytics = await import('@/lib/analytics');

        analytics.initAnalytics();
        analytics.trackEvent('proposal_submitted', { source: 'job-board' });
        analytics.trackPageView();

        expect(integrationState.posthogInit).toHaveBeenCalledWith('ph-key', {
            api_host: 'https://posthog.test',
        });
        expect(integrationState.posthogCapture).toHaveBeenNthCalledWith(1, 'proposal_submitted', {
            source: 'job-board',
        });
        expect(integrationState.posthogCapture).toHaveBeenNthCalledWith(2, '$pageview');
    });
});
