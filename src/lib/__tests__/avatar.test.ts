import { describe, expect, it } from 'vitest';

import { resolveAccountAvatarUrl } from '@/lib/avatar';

describe('avatar source of truth', () => {
    it('uses only profile avatar url when available', () => {
        expect(resolveAccountAvatarUrl('https://avatar.example/profile.png', false)).toBe('https://avatar.example/profile.png');
    });

    it('returns null when profile avatar is missing', () => {
        expect(resolveAccountAvatarUrl(null, false)).toBeNull();
        expect(resolveAccountAvatarUrl(undefined, false)).toBeNull();
    });

    it('returns null when avatar load already failed', () => {
        expect(resolveAccountAvatarUrl('https://avatar.example/profile.png', true)).toBeNull();
    });
});
