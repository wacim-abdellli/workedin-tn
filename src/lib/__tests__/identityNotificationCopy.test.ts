import { describe, expect, it } from 'vitest';
import {
    normalizeIdentityNotificationLanguage,
    getIdentityNotificationCopy,
} from '../identityNotificationCopy';

describe('identityNotificationCopy', () => {
    describe('normalizeIdentityNotificationLanguage', () => {
        it('returns ar for "ar"', () => {
            expect(normalizeIdentityNotificationLanguage('ar')).toBe('ar');
        });

        it('returns en for "en"', () => {
            expect(normalizeIdentityNotificationLanguage('en')).toBe('en');
        });

        it('returns fr for "fr"', () => {
            expect(normalizeIdentityNotificationLanguage('fr')).toBe('fr');
        });

        it('defaults to en for unknown language', () => {
            expect(normalizeIdentityNotificationLanguage('de')).toBe('en');
        });

        it('defaults to en for null', () => {
            expect(normalizeIdentityNotificationLanguage(null)).toBe('en');
        });

        it('defaults to en for undefined', () => {
            expect(normalizeIdentityNotificationLanguage(undefined)).toBe('en');
        });

        it('defaults to en for empty string', () => {
            expect(normalizeIdentityNotificationLanguage('')).toBe('en');
        });
    });

    describe('getIdentityNotificationCopy', () => {
        it('returns submitted copy in English', () => {
            const copy = getIdentityNotificationCopy('submitted', 'en');
            expect(copy.title).toBeTruthy();
            expect(copy.body).toBeTruthy();
        });

        it('returns approved copy in Arabic', () => {
            const copy = getIdentityNotificationCopy('approved', 'ar');
            expect(copy.title).toContain('تم قبول');
        });

        it('returns rejected copy in French', () => {
            const copy = getIdentityNotificationCopy('rejected', 'fr');
            expect(copy.title).toBeTruthy();
        });

        it('defaults to English for unknown language', () => {
            const copy = getIdentityNotificationCopy('submitted', 'de');
            expect(copy.title).toBe('Identity verification request received');
        });

        it('defaults to English for null language', () => {
            const copy = getIdentityNotificationCopy('approved', null);
            expect(copy.title).toBe('Your identity has been verified');
        });
    });
});
