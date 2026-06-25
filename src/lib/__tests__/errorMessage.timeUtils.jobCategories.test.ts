import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '@/lib/errorMessage';
import { timeAgo } from '@/lib/timeUtils';
import {
    JOB_CATEGORIES,
    getLocalizedLabel,
    getJobCategories,
    getCategoryName,
    getSubcategoryName,
} from '@/lib/jobCategories';

describe('getErrorMessage', () => {
    it('returns message from Error instances', () => {
        expect(getErrorMessage(new Error('fail'), 'fallback')).toBe('fail');
    });

    it('returns fallback for empty Error message', () => {
        expect(getErrorMessage(new Error(''), 'fallback')).toBe('fallback');
    });

    it('returns message from object with message property', () => {
        expect(getErrorMessage({ message: 'rpc error' }, 'fallback')).toBe('rpc error');
    });

    it('returns fallback for object with empty message', () => {
        expect(getErrorMessage({ message: '' }, 'fallback')).toBe('fallback');
    });

    it('returns fallback for null', () => {
        expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    });

    it('returns fallback for undefined', () => {
        expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
    });

    it('returns fallback for string error', () => {
        expect(getErrorMessage('some string', 'fallback')).toBe('fallback');
    });

    it('returns fallback for number error', () => {
        expect(getErrorMessage(42, 'fallback')).toBe('fallback');
    });

    it('returns message from object with non-string message', () => {
        expect(getErrorMessage({ message: 123 }, 'fallback')).toBe('fallback');
    });
});

describe('timeAgo', () => {
    const tx = (key: string, params?: { count?: number }) => {
        if (key === 'pages.jobDetail.timeAgo.justNow') return 'just now';
        if (key === 'pages.jobDetail.timeAgo.minute') return `${params?.count}m ago`;
        if (key === 'pages.jobDetail.timeAgo.hour') return `${params?.count}h ago`;
        if (key === 'pages.jobDetail.timeAgo.day') return `${params?.count}d ago`;
        if (key === 'pages.jobDetail.timeAgo.week') return `${params?.count}w ago`;
        return key;
    };

    it('returns just now for invalid date', () => {
        expect(timeAgo('not-a-date', tx)).toBe('just now');
    });

    it('returns just now for recent date (< 60s)', () => {
        const recent = new Date(Date.now() - 30_000).toISOString();
        expect(timeAgo(recent, tx)).toBe('just now');
    });

    it('returns minutes for 1-59 minutes ago', () => {
        const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
        expect(timeAgo(fiveMinAgo, tx)).toBe('5m ago');
    });

    it('returns hours for 1-23 hours ago', () => {
        const threeHoursAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
        expect(timeAgo(threeHoursAgo, tx)).toBe('3h ago');
    });

    it('returns days for 1-6 days ago', () => {
        const twoDaysAgo = new Date(Date.now() - 2 * 86400_000).toISOString();
        expect(timeAgo(twoDaysAgo, tx)).toBe('2d ago');
    });

    it('returns weeks for 7+ days ago', () => {
        const threeWeeksAgo = new Date(Date.now() - 21 * 86400_000).toISOString();
        expect(timeAgo(threeWeeksAgo, tx)).toBe('3w ago');
    });
});

describe('jobCategories', () => {
    it('exports a non-empty JOB_CATEGORIES array', () => {
        expect(Array.isArray(JOB_CATEGORIES)).toBe(true);
        expect(JOB_CATEGORIES.length).toBeGreaterThan(0);
    });

    it('every category has id, label, and subcategories', () => {
        for (const cat of JOB_CATEGORIES) {
            expect(typeof cat.id).toBe('string');
            expect(cat.label).toHaveProperty('ar');
            expect(cat.label).toHaveProperty('fr');
            expect(cat.label).toHaveProperty('en');
            expect(Array.isArray(cat.subcategories)).toBe(true);
            expect(cat.subcategories.length).toBeGreaterThan(0);
        }
    });

    it('getLocalizedLabel returns correct language', () => {
        const label = { ar: 'عربي', fr: 'French', en: 'English' };
        expect(getLocalizedLabel(label, 'ar')).toBe('عربي');
        expect(getLocalizedLabel(label, 'fr')).toBe('French');
        expect(getLocalizedLabel(label, 'en')).toBe('English');
    });

    it('getLocalizedLabel falls back to en for unknown language', () => {
        const label = { ar: 'عربي', fr: 'French', en: 'English' };
        expect(getLocalizedLabel(label, 'de' as any)).toBe('English');
    });

    it('getJobCategories returns localized names', () => {
        const cats = getJobCategories('fr');
        expect(cats.length).toBe(JOB_CATEGORIES.length);
        for (const cat of cats) {
            expect(typeof cat.name).toBe('string');
            expect(cat.name.length).toBeGreaterThan(0);
            expect(Array.isArray(cat.subcategories)).toBe(true);
        }
    });

    it('getCategoryName returns name for valid id', () => {
        const name = getCategoryName('design', 'en');
        expect(name).toBe('Design and Creative');
    });

    it('getCategoryName returns id for unknown category', () => {
        expect(getCategoryName('nonexistent', 'en')).toBe('nonexistent');
    });

    it('getCategoryName returns empty for undefined', () => {
        expect(getCategoryName(undefined, 'en')).toBe('');
    });

    it('getSubcategoryName returns name for valid ids', () => {
        const name = getSubcategoryName('design', 'logo_design', 'en');
        expect(name).toBe('Logo Design');
    });

    it('getSubcategoryName returns subcategoryId for unknown subcategory', () => {
        expect(getSubcategoryName('design', 'unknown_sub', 'en')).toBe('unknown_sub');
    });

    it('getSubcategoryName returns empty for missing params', () => {
        expect(getSubcategoryName(undefined, 'logo_design', 'en')).toBe('');
        expect(getSubcategoryName('design', undefined, 'en')).toBe('');
    });
});
