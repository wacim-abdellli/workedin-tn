import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authUtilsState = vi.hoisted(() => ({
    clearAllAuthData: vi.fn(),
    hardLogout: vi.fn(),
}));

const loggerState = vi.hoisted(() => ({
    error: vi.fn(),
    log: vi.fn(),
}));

const supabaseState = vi.hoisted(() => ({
    updateError: null as null | { message: string },
    reload: vi.fn(),
    alert: vi.fn(),
}));

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
}));

vi.mock('@/lib/authUtils', () => ({
    clearAllAuthData: authUtilsState.clearAllAuthData,
    hardLogout: authUtilsState.hardLogout,
}));

vi.mock('@/lib/logger', () => ({
    logger: loggerState,
}));

vi.mock('@/lib/supabase', () => {
    const builder = {
        update: vi.fn(() => builder),
        eq: vi.fn(async () => ({ error: supabaseState.updateError })),
    };

    return {
        supabase: {
            from: vi.fn(() => builder),
        },
    };
});

import { UserMenu } from '@/components/layout/Header/UserMenu';

describe('UserMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        supabaseState.updateError = null;
        Object.defineProperty(window, 'location', {
            value: { reload: supabaseState.reload },
            writable: true,
        });
        vi.stubGlobal('alert', supabaseState.alert);
    });

    const baseProps = {
        user: {
            id: 'user-1',
            email: 'user@example.com',
            user_metadata: {},
        } as never,
        profile: {
            full_name: 'Amina',
            avatar_url: null,
            user_type: 'freelancer' as const,
            is_admin: true,
        },
        signOut: vi.fn(async () => undefined),
        t: {
            nav: {
                dashboard: 'Dashboard',
                myJobs: 'My jobs',
                messages: 'Messages',
                saved: 'Saved',
                settings: 'Settings',
                logout: 'Logout',
            },
        },
    };

    it('opens the menu, handles mode switching, closes on escape, and falls back avatar errors', async () => {
        render(
            <MemoryRouter>
                <UserMenu {...baseProps} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { expanded: false }));
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('لوحة الإدارة')).toBeInTheDocument();

        const avatar = screen.getByAltText('Amina') as HTMLImageElement;
        fireEvent.error(avatar);
        expect(avatar.src).toContain('/default-avatar.png');

        fireEvent.click(screen.getByText('مستقل'));
        await waitFor(() => {
            expect(supabaseState.reload).toHaveBeenCalled();
        });

        fireEvent.click(screen.getByRole('button', { expanded: true }));
        fireEvent.keyDown(document, { key: 'Escape' });
        await waitFor(() => {
            expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
        });
    });

    it('handles client switching failures and logout flow', async () => {
        supabaseState.updateError = { message: 'boom' };

        render(
            <MemoryRouter>
                <UserMenu
                    {...baseProps}
                    profile={{ ...baseProps.profile, user_type: 'client' }}
                />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { expanded: false }));
        fireEvent.click(screen.getByText('صاحب عمل'));

        await waitFor(() => {
            expect(supabaseState.alert).toHaveBeenCalled();
        });

        fireEvent.click(screen.getByRole('menuitem', { name: 'Logout' }));

        await waitFor(() => {
            expect(authUtilsState.clearAllAuthData).toHaveBeenCalled();
            expect(baseProps.signOut).toHaveBeenCalled();
            expect(authUtilsState.hardLogout).toHaveBeenCalledWith('/login');
        });
    });
});
