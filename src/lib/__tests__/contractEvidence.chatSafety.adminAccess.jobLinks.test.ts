import { describe, expect, it } from 'vitest';
import { isProtectedContractEvidenceMessage } from '@/lib/contractEvidence';
import { detectContractChatSafetyRisk } from '@/lib/contractChatSafety';
import { hasAdminAccess } from '@/lib/adminAccess';
import {
    normalizeJobReferenceLink,
    isValidJobReferenceLink,
    sanitizeJobReferenceLinks,
    detectJobLinkPlatform,
    getJobReferenceLinkMeta,
    isMissingJobReferenceLinksColumnError,
    MAX_JOB_REFERENCE_LINKS,
} from '@/lib/jobLinks';

describe('contractEvidence', () => {
    it('returns false for null/undefined message', () => {
        expect(isProtectedContractEvidenceMessage(null)).toBe(false);
        expect(isProtectedContractEvidenceMessage(undefined)).toBe(false);
    });

    it('returns false when contract_id is missing', () => {
        expect(isProtectedContractEvidenceMessage({ contract_id: '', content: '[[delivery]]' })).toBe(false);
    });

    it('detects [[delivery]] prefix', () => {
        expect(isProtectedContractEvidenceMessage({ contract_id: 'c1', content: '[[delivery]] work done' })).toBe(true);
    });

    it('detects [[revision_requested]] prefix', () => {
        expect(isProtectedContractEvidenceMessage({ contract_id: 'c1', content: '[[revision_requested]] fix colors' })).toBe(true);
    });

    it('detects [[contract_completed]] prefix', () => {
        expect(isProtectedContractEvidenceMessage({ contract_id: 'c1', content: '[[contract_completed]]' })).toBe(true);
    });

    it('detects [[dispute_opened]] prefix', () => {
        expect(isProtectedContractEvidenceMessage({ contract_id: 'c1', content: '[[dispute_opened]] issue' })).toBe(true);
    });

    it('returns false for regular messages', () => {
        expect(isProtectedContractEvidenceMessage({ contract_id: 'c1', content: 'hello' })).toBe(false);
    });

    it('returns false for empty content', () => {
        expect(isProtectedContractEvidenceMessage({ contract_id: 'c1', content: '' })).toBe(false);
    });
});

describe('contractChatSafety', () => {
    it('returns not blocked for empty content', () => {
        expect(detectContractChatSafetyRisk('')).toEqual({ blocked: false, category: null, reason: null });
    });

    it('returns not blocked for normal messages', () => {
        expect(detectContractChatSafetyRisk('Hello, how are you?')).toEqual({ blocked: false, category: null, reason: null });
    });

    it('blocks WhatsApp links', () => {
        const result = detectContractChatSafetyRisk('Contact me on wa.me/123456');
        expect(result.blocked).toBe(true);
        expect(result.category).toBe('contact_sharing');
    });

    it('blocks Telegram links', () => {
        expect(detectContractChatSafetyRisk('Join t.me/group').blocked).toBe(true);
    });

    it('blocks email addresses', () => {
        expect(detectContractChatSafetyRisk('Email me at test@example.com').blocked).toBe(true);
    });

    it('blocks phone numbers', () => {
        expect(detectContractChatSafetyRisk('Call me at +216 12 345 678').blocked).toBe(true);
    });

    it('blocks off-platform payment requests', () => {
        expect(detectContractChatSafetyRisk('Send me money via bank transfer').blocked).toBe(true);
        expect(detectContractChatSafetyRisk('pay me via crypto').blocked).toBe(true);
    });

    it('blocks payment keywords', () => {
        expect(detectContractChatSafetyRisk('Use my IBAN for payment').blocked).toBe(true);
        expect(detectContractChatSafetyRisk('western union transfer').blocked).toBe(true);
    });

    it('does not block legitimate contract discussions', () => {
        expect(detectContractChatSafetyRisk('The design looks great, please proceed').blocked).toBe(false);
        expect(detectContractChatSafetyRisk('I will deliver by Friday').blocked).toBe(false);
    });
});

describe('adminAccess', () => {
    it('returns true when profile.is_admin is true', () => {
        expect(hasAdminAccess(null, { is_admin: true } as any)).toBe(true);
    });

    it('returns false when profile.is_admin is false', () => {
        expect(hasAdminAccess(null, { is_admin: false } as any)).toBe(false);
    });

    it('returns false for null profile and null user', () => {
        expect(hasAdminAccess(null, null)).toBe(false);
    });

    it('returns true when user app_metadata has is_admin', () => {
        const user = { app_metadata: { is_admin: true } } as any;
        expect(hasAdminAccess(user, null)).toBe(true);
    });

    it('returns true when user app_metadata has role=admin', () => {
        const user = { app_metadata: { role: 'admin' } } as any;
        expect(hasAdminAccess(user, null)).toBe(true);
    });

    it('returns false when app_metadata has neither is_admin nor role', () => {
        const user = { app_metadata: {} } as any;
        expect(hasAdminAccess(user, { is_admin: false } as any)).toBe(false);
    });
});

describe('jobLinks', () => {
    describe('normalizeJobReferenceLink', () => {
        it('adds https:// to bare domains', () => {
            expect(normalizeJobReferenceLink('github.com/user')).toBe('https://github.com/user');
        });

        it('preserves existing protocol', () => {
            expect(normalizeJobReferenceLink('https://example.com/path')).toBe('https://example.com/path');
        });

        it('strips hash fragments', () => {
            expect(normalizeJobReferenceLink('https://example.com/page#section')).toBe('https://example.com/page');
        });

        it('strips trailing slash', () => {
            expect(normalizeJobReferenceLink('https://example.com/')).toBe('https://example.com');
        });

        it('returns empty for invalid URLs', () => {
            expect(normalizeJobReferenceLink('')).toBe('');
            expect(normalizeJobReferenceLink('   ')).toBe('');
        });

        it('rejects non-http protocols', () => {
            expect(normalizeJobReferenceLink('ftp://example.com')).toBe('');
        });
    });

    describe('isValidJobReferenceLink', () => {
        it('returns true for valid URLs', () => {
            expect(isValidJobReferenceLink('https://github.com/user')).toBe(true);
            expect(isValidJobReferenceLink('github.com/user')).toBe(true);
        });

        it('returns false for invalid URLs', () => {
            expect(isValidJobReferenceLink('')).toBe(false);
            expect(isValidJobReferenceLink('not a url')).toBe(false);
        });
    });

    describe('sanitizeJobReferenceLinks', () => {
        it('deduplicates links', () => {
            const result = sanitizeJobReferenceLinks(['https://a.com', 'https://A.com', 'https://b.com']);
            expect(result).toHaveLength(2);
        });

        it('respects maxLinks limit', () => {
            const links = Array.from({ length: 10 }, (_, i) => `https://${i}.com`);
            expect(sanitizeJobReferenceLinks(links, 3)).toHaveLength(3);
        });

        it('filters invalid links', () => {
            const result = sanitizeJobReferenceLinks(['https://valid.com', '', null, undefined, 'also-valid.com']);
            expect(result).toHaveLength(2);
        });

        it('returns empty for null input', () => {
            expect(sanitizeJobReferenceLinks(null)).toEqual([]);
        });

        it('defaults to MAX_JOB_REFERENCE_LINKS', () => {
            expect(MAX_JOB_REFERENCE_LINKS).toBe(8);
        });
    });

    describe('detectJobLinkPlatform', () => {
        it('detects known platforms', () => {
            expect(detectJobLinkPlatform('github.com')).toBe('github');
            expect(detectJobLinkPlatform('www.linkedin.com')).toBe('linkedin');
            expect(detectJobLinkPlatform('drive.google.com')).toBe('google_drive');
            expect(detectJobLinkPlatform('youtube.com')).toBe('youtube');
            expect(detectJobLinkPlatform('youtu.be')).toBe('youtube');
            expect(detectJobLinkPlatform('instagram.com')).toBe('instagram');
            expect(detectJobLinkPlatform('facebook.com')).toBe('facebook');
            expect(detectJobLinkPlatform('x.com')).toBe('x');
            expect(detectJobLinkPlatform('twitter.com')).toBe('x');
            expect(detectJobLinkPlatform('tiktok.com')).toBe('tiktok');
            expect(detectJobLinkPlatform('dropbox.com')).toBe('dropbox');
            expect(detectJobLinkPlatform('behance.net')).toBe('behance');
            expect(detectJobLinkPlatform('figma.com')).toBe('figma');
        });

        it('returns website for unknown platforms', () => {
            expect(detectJobLinkPlatform('example.com')).toBe('website');
        });
    });

    describe('getJobReferenceLinkMeta', () => {
        it('returns meta for valid link', () => {
            const meta = getJobReferenceLinkMeta('https://github.com/user/repo');
            expect(meta).not.toBeNull();
            expect(meta!.platform).toBe('github');
            expect(meta!.hostname).toBe('github.com');
            expect(meta!.platformLabel).toBe('GitHub');
        });

        it('returns null for invalid link', () => {
            expect(getJobReferenceLinkMeta('')).toBeNull();
        });
    });

    describe('isMissingJobReferenceLinksColumnError', () => {
        it('returns true for missing column errors', () => {
            expect(isMissingJobReferenceLinksColumnError({
                message: 'column reference_links does not exist',
                details: '',
                hint: '',
                code: '42703',
            })).toBe(true);
        });

        it('returns true for schema cache errors', () => {
            expect(isMissingJobReferenceLinksColumnError({
                message: 'reference_links schema cache',
            })).toBe(true);
        });

        it('returns false for unrelated errors', () => {
            expect(isMissingJobReferenceLinksColumnError({
                message: 'something else went wrong',
            })).toBe(false);
        });

        it('returns false for null', () => {
            expect(isMissingJobReferenceLinksColumnError(null)).toBe(false);
        });
    });
});
