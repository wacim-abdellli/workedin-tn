import { describe, expect, it } from 'vitest';

import { hasAdminAccess } from '@/lib/adminAccess';

describe('adminAccess', () => {
    it('allows admin access from the server-controlled profile flag', () => {
        expect(
            hasAdminAccess(
                null,
                {
                    id: 'user-1',
                    user_type: 'client',
                    full_name: 'Admin',
                    preferred_language: 'en',
                    created_at: '',
                    updated_at: '',
                    is_admin: true,
                }
            )
        ).toBe(true);
    });

    it('allows admin access from server-controlled app_metadata', () => {
        expect(
            hasAdminAccess(
                {
                    app_metadata: { is_admin: true },
                } as never,
                null
            )
        ).toBe(true);

        expect(
            hasAdminAccess(
                {
                    app_metadata: { role: 'admin' },
                } as never,
                null
            )
        ).toBe(true);
    });

    it('does not grant admin access from email alone', () => {
        expect(
            hasAdminAccess(
                {
                    email: 'admin@example.com',
                    app_metadata: {},
                } as never,
                {
                    id: 'user-1',
                    user_type: 'client',
                    full_name: 'User',
                    preferred_language: 'en',
                    created_at: '',
                    updated_at: '',
                    is_admin: false,
                }
            )
        ).toBe(false);
    });
});
