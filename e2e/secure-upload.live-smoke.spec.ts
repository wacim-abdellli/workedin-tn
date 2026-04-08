import { test, expect } from '@playwright/test';

/**
 * Secure Upload Live Smoke — Direct API variant.
 *
 * Calls the secure-upload Edge Function directly via the Playwright request
 * context using the stored authenticated session. No UI navigation required,
 * making this immune to form-wizard layout changes.
 *
 * Requires:
 *   - storageState populated by auth.setup.ts (e2e/.auth/client.json)
 *   - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set in the test environment
 *
 * Replaces the previous wizard-navigation approach that was fragile due to
 * multi-step form selectors and multi-language button text.
 */
test.describe('Secure Upload Live Smoke', () => {
    test.use({ storageState: 'e2e/.auth/client.json' });

    test('secure-upload Edge Function accepts a valid authenticated file upload', async ({ page }) => {
        const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';

        if (!supabaseUrl || !supabaseAnonKey) {
            test.skip(true, 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — skipping live smoke');
            return;
        }

        // Navigate to any authenticated page to hydrate the localStorage session.
        await page.goto('/');

        // Extract the live Supabase access token from localStorage.
        const accessToken: string | null = await page.evaluate(() => {
            for (const key of Object.keys(localStorage)) {
                if (!key.startsWith('sb-')) continue;
                try {
                    const parsed = JSON.parse(localStorage.getItem(key) ?? '');
                    if (typeof parsed?.access_token === 'string') return parsed.access_token;
                } catch { /* skip malformed entries */ }
            }
            return null;
        });

        expect(accessToken, 'Auth session must be present — run auth.setup.ts first').toBeTruthy();

        // POST directly to the secure-upload Edge Function — no UI wizard needed.
        const response = await page.request.post(
            `${supabaseUrl}/functions/v1/secure-upload`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    apikey: supabaseAnonKey,
                    'x-client-info': 'khedma-tn-e2e',
                },
                multipart: {
                    bucket: 'attachments',
                    path: `smoke-test/e2e-${Date.now()}.txt`,
                    file: {
                        name: 'e2e-smoke.txt',
                        mimeType: 'text/plain',
                        buffer: Buffer.from('playwright secure-upload smoke test'),
                    },
                },
            },
        );

        expect(response.status()).toBe(200);

        const payload = await response.json();
        expect(payload.bucket).toBe('attachments');
        expect(String(payload.path)).toMatch(/^smoke-test\/e2e-\d+\.txt$/);
    });
});
