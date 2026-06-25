import { describe, expect, it, vi } from 'vitest';

import {
    normalizePortfolioTextArray,
    splitPortfolioSkillsAndTools,
    composePortfolioSkillsFallback,
    LEGACY_PORTFOLIO_TOOL_PREFIX,
} from '@/lib/portfolioTools';
import {
    getErrorMessageText,
    extractMissingProfilesColumn,
    PROFILES_UPDATE_MAX_RETRIES,
} from '@/lib/profileHydrationUtils';
import {
    dashboardQueryKeys,
    invalidateFreelancerDashboardQueries,
    invalidateClientDashboardQueries,
} from '@/lib/dashboardQueries';

// ── portfolioTools.ts ───────────────────────────────────────────────────────

describe('portfolioTools', () => {
    describe('normalizePortfolioTextArray', () => {
        it('returns empty for null', () => {
            expect(normalizePortfolioTextArray(null)).toEqual([]);
        });

        it('returns empty for undefined', () => {
            expect(normalizePortfolioTextArray(undefined)).toEqual([]);
        });

        it('returns empty for non-array', () => {
            expect(normalizePortfolioTextArray('not-an-array' as any)).toEqual([]);
        });

        it('trims and deduplicates', () => {
            expect(normalizePortfolioTextArray(['  React  ', 'react', 'Vue'])).toEqual(['React', 'Vue']);
        });

        it('filters empty strings', () => {
            expect(normalizePortfolioTextArray(['', '  ', 'React'])).toEqual(['React']);
        });

        it('filters non-string values', () => {
            expect(normalizePortfolioTextArray([123, null, 'React', undefined])).toEqual(['React']);
        });
    });

    describe('splitPortfolioSkillsAndTools', () => {
        it('separates legacy tool entries from skills', () => {
            const result = splitPortfolioSkillsAndTools(
                ['React', `${LEGACY_PORTFOLIO_TOOL_PREFIX}VS Code`, 'TypeScript'],
                [],
            );
            expect(result.skills).toEqual(['React', 'TypeScript']);
            expect(result.tools).toEqual(['VS Code']);
        });

        it('merges tools arrays', () => {
            const result = splitPortfolioSkillsAndTools(
                ['React'],
                ['Figma'],
            );
            expect(result.skills).toEqual(['React']);
            expect(result.tools).toEqual(['Figma']);
        });

        it('handles null inputs', () => {
            expect(splitPortfolioSkillsAndTools(null, null)).toEqual({ skills: [], tools: [] });
        });
    });

    describe('composePortfolioSkillsFallback', () => {
        it('encodes tools with legacy prefix', () => {
            const result = composePortfolioSkillsFallback(['React'], ['Figma']);
            expect(result).toContain('React');
            expect(result).toContain(`${LEGACY_PORTFOLIO_TOOL_PREFIX}Figma`);
        });

        it('filters legacy entries from skills and re-encodes tools', () => {
            const result = composePortfolioSkillsFallback(
                ['React', `${LEGACY_PORTFOLIO_TOOL_PREFIX}VS Code`],
                ['Figma'],
            );
            expect(result).toContain('React');
            expect(result).toContain(`${LEGACY_PORTFOLIO_TOOL_PREFIX}Figma`);
            expect(result).not.toContain(`${LEGACY_PORTFOLIO_TOOL_PREFIX}VS Code`);
        });

        it('handles null inputs', () => {
            expect(composePortfolioSkillsFallback(null, null)).toEqual([]);
        });
    });
});

// ── profileHydrationUtils.ts ────────────────────────────────────────────────

describe('profileHydrationUtils', () => {
    describe('PROFILES_UPDATE_MAX_RETRIES', () => {
        it('is 6', () => {
            expect(PROFILES_UPDATE_MAX_RETRIES).toBe(6);
        });
    });

    describe('getErrorMessageText', () => {
        it('extracts message from Error', () => {
            expect(getErrorMessageText(new Error('fail'))).toBe('fail');
        });

        it('extracts message from object', () => {
            expect(getErrorMessageText({ message: 'obj error' })).toBe('obj error');
        });

        it('converts string to string', () => {
            expect(getErrorMessageText('raw string')).toBe('raw string');
        });

        it('returns empty for null', () => {
            expect(getErrorMessageText(null)).toBe('');
        });

        it('returns empty for undefined', () => {
            expect(getErrorMessageText(undefined)).toBe('');
        });

        it('stringifies number', () => {
            expect(getErrorMessageText(42)).toBe('42');
        });
    });

    describe('extractMissingProfilesColumn', () => {
        it('extracts column from schema cache error', () => {
            expect(extractMissingProfilesColumn(
                new Error('could not find the "phone_verified" column of "profiles"'),
            )).toBe('phone_verified');
        });

        it('extracts column from relation error', () => {
            expect(extractMissingProfilesColumn(
                new Error('column "new_col" of relation "profiles" does not exist'),
            )).toBe('new_col');
        });

        it('returns null for unrelated error', () => {
            expect(extractMissingProfilesColumn(new Error('something else'))).toBeNull();
        });

        it('returns null for error without profiles', () => {
            expect(extractMissingProfilesColumn(new Error('column "x" of relation "jobs" does not exist'))).toBeNull();
        });
    });
});

// ── dashboardQueries.ts ─────────────────────────────────────────────────────

describe('dashboardQueries', () => {
    describe('dashboardQueryKeys', () => {
        it('generates freelancer stats key', () => {
            expect(dashboardQueryKeys.freelancerStats('u1')).toEqual(['freelancerDashboardStats', 'u1']);
        });

        it('generates client stats key', () => {
            expect(dashboardQueryKeys.clientStats('u1')).toEqual(['clientDashboardStats', 'u1']);
        });
    });

    describe('invalidateFreelancerDashboardQueries', () => {
        it('skips when userId is null', async () => {
            const qc = { invalidateQueries: vi.fn() };
            await invalidateFreelancerDashboardQueries(qc as any, null);
            expect(qc.invalidateQueries).not.toHaveBeenCalled();
        });

        it('invalidates when userId provided', async () => {
            const qc = { invalidateQueries: vi.fn() };
            await invalidateFreelancerDashboardQueries(qc as any, 'u1');
            expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['freelancerDashboardStats', 'u1'] });
        });
    });

    describe('invalidateClientDashboardQueries', () => {
        it('skips when userId is undefined', async () => {
            const qc = { invalidateQueries: vi.fn() };
            await invalidateClientDashboardQueries(qc as any, undefined);
            expect(qc.invalidateQueries).not.toHaveBeenCalled();
        });

        it('invalidates when userId provided', async () => {
            const qc = { invalidateQueries: vi.fn() };
            await invalidateClientDashboardQueries(qc as any, 'u1');
            expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['clientDashboardStats', 'u1'] });
        });
    });
});
