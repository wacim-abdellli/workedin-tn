import { describe, expect, it } from 'vitest';

import {
    ROUTES,
    getClientJobProposalsRoute,
    getJobDetailRoute,
    getJobEditRoute,
    getContractWorkspaceRoute,
} from '@/lib/routes';
import {
    resolvePortfolioMediaUrl,
    getPortfolioImageUrl,
    normalizePortfolioMediaFields,
} from '@/lib/portfolioMedia';

// ── routes.ts ───────────────────────────────────────────────────────────────

describe('routes', () => {
    it('defines expected routes', () => {
        expect(ROUTES.home).toBe('/');
        expect(ROUTES.login).toBe('/login');
        expect(ROUTES.signup).toBe('/signup');
        expect(ROUTES.dashboard).toBe('/dashboard');
        expect(ROUTES.jobs).toBe('/jobs');
        expect(ROUTES.messages).toBe('/messages');
        expect(ROUTES.settings).toBe('/settings');
        expect(ROUTES.contractWorkspace).toBe('/workspace/:contractId');
    });

    it('generates client job proposals route', () => {
        expect(getClientJobProposalsRoute('job-1')).toBe('/client/jobs/job-1/proposals');
    });

    it('generates job detail route', () => {
        expect(getJobDetailRoute('job-2')).toBe('/jobs/job-2');
    });

    it('generates job edit route', () => {
        expect(getJobEditRoute('job-3')).toBe('/jobs/job-3/edit');
    });

    it('generates contract workspace route with encoding', () => {
        expect(getContractWorkspaceRoute('contract-4')).toBe('/workspace/contract-4');
    });

    it('encodes special characters in contract id', () => {
        expect(getContractWorkspaceRoute('c/1')).toBe('/workspace/c%2F1');
    });
});

// ── portfolioMedia.ts ───────────────────────────────────────────────────────

describe('portfolioMedia', () => {
    describe('resolvePortfolioMediaUrl', () => {
        it('returns absolute URLs as-is', () => {
            expect(resolvePortfolioMediaUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
        });

        it('returns http URLs as-is', () => {
            expect(resolvePortfolioMediaUrl('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
        });

        it('returns data URIs as-is', () => {
            expect(resolvePortfolioMediaUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
        });

        it('returns empty for null', () => {
            expect(resolvePortfolioMediaUrl(null)).toBe('');
        });

        it('returns empty for undefined', () => {
            expect(resolvePortfolioMediaUrl(undefined)).toBe('');
        });

        it('returns empty for empty string', () => {
            expect(resolvePortfolioMediaUrl('')).toBe('');
        });

        it('returns empty for path traversal', () => {
            expect(resolvePortfolioMediaUrl('../secret/file.jpg')).toBe('');
        });

        it('returns empty for non-string', () => {
            expect(resolvePortfolioMediaUrl(123 as any)).toBe('');
        });
    });

    describe('getPortfolioImageUrl', () => {
        it('returns first valid URL', () => {
            expect(getPortfolioImageUrl('https://example.com/thumb.jpg', [])).toBe('https://example.com/thumb.jpg');
        });

        it('falls back to media URLs', () => {
            expect(getPortfolioImageUrl(null, ['https://example.com/media.jpg'])).toBe('https://example.com/media.jpg');
        });

        it('returns empty when no valid URLs', () => {
            expect(getPortfolioImageUrl(null, [null, undefined, ''])).toBe('');
        });
    });

    describe('normalizePortfolioMediaFields', () => {
        it('returns unchanged when already normalized', () => {
            const result = normalizePortfolioMediaFields(
                'https://example.com/thumb.jpg',
                ['https://example.com/media1.jpg'],
            );
            expect(result.changed).toBe(false);
            expect(result.normalizedThumbnailUrl).toBe('https://example.com/thumb.jpg');
        });

        it('detects change when thumbnail is missing', () => {
            const result = normalizePortfolioMediaFields(
                null,
                ['https://example.com/media.jpg'],
            );
            expect(result.changed).toBe(true);
            expect(result.normalizedThumbnailUrl).toBe('https://example.com/media.jpg');
        });

        it('deduplicates media URLs', () => {
            const result = normalizePortfolioMediaFields(
                'https://example.com/img.jpg',
                ['https://example.com/img.jpg', 'https://other.com/img2.jpg'],
            );
            expect(result.normalizedMediaUrls).toHaveLength(2);
        });
    });
});
