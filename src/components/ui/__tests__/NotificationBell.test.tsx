import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
    user: { id: 'user-1' },
}));

const loggerState = vi.hoisted(() => ({
    error: vi.fn(),
}));

const supabaseState = vi.hoisted(() => ({
    listResult: {
        data: [
            {
                id: 'n1',
                user_id: 'user-1',
                title: 'New message',
                message: 'You have a message',
                type: 'message',
                read: false,
                link: '/messages',
                created_at: '2026-03-23T00:00:00.000Z',
            },
            {
                id: 'n2',
                user_id: 'user-1',
                title: 'Payment',
                message: 'Payment released',
                type: 'payment',
                read: true,
                created_at: '2026-03-22T23:00:00.000Z',
            },
        ],
        error: null as unknown,
    },
    updateError: null as unknown,
    insertCallback: null as ((payload: { new: unknown }) => void) | null,
    removeChannel: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: authState.user }),
}));

vi.mock('@/lib/logger', () => ({
    logger: loggerState,
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        language: 'en',
        t: {
            common: {
                loading: 'Loading',
                time: {
                    now: 'now',
                    minute: 'm',
                    hour: 'h',
                    day: 'd',
                    ago: 'ago',
                },
            },
            notifications: {
                title: 'Notifications',
                readAll: 'Read all',
                empty: 'No notifications',
                emptyDesc: 'Nothing new yet',
                viewAll: 'View all',
            },
        },
    }),
}));

vi.mock('@/lib/supabase', () => {
    const updateBuilder = {
        eq: vi.fn(async () => ({ error: supabaseState.updateError })),
    };

    const listBuilder = {
        select: vi.fn(() => listBuilder),
        eq: vi.fn(() => listBuilder),
        order: vi.fn(() => listBuilder),
        limit: vi.fn(async () => supabaseState.listResult),
        update: vi.fn(() => updateBuilder),
    };

    return {
        supabase: {
            from: vi.fn(() => listBuilder),
            channel: vi.fn((name: string) => {
                const channel = {
                    on: vi.fn((event: string, config: unknown, callback: (payload: { new: unknown }) => void) => {
                        void event;
                        void config;
                        supabaseState.insertCallback = callback;
                        return channel;
                    }),
                    subscribe: vi.fn(() => ({ name })),
                };
                return channel;
            }),
            removeChannel: supabaseState.removeChannel,
        },
    };
});

import NotificationBell from '@/components/ui/NotificationBell';

describe('NotificationBell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.user = { id: 'user-1' };
        supabaseState.listResult = {
            data: [
                {
                    id: 'n1',
                    user_id: 'user-1',
                    title: 'New message',
                    message: 'You have a message',
                    type: 'message',
                    read: false,
                    link: '/messages',
                    created_at: '2026-03-23T00:00:00.000Z',
                },
                {
                    id: 'n2',
                    user_id: 'user-1',
                    title: 'Payment',
                    message: 'Payment released',
                    type: 'payment',
                    read: true,
                    created_at: '2026-03-22T23:00:00.000Z',
                },
            ],
            error: null,
        };
        supabaseState.updateError = null;
        supabaseState.insertCallback = null;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const getBellButton = () => screen.getByRole('button');

    it('loads notifications, marks reads, and reacts to realtime inserts', async () => {
        render(<NotificationBell />);

        await waitFor(() => {
            expect(getBellButton()).toBeInTheDocument();
        });

        fireEvent.click(getBellButton());

        expect(await screen.findByText('New message')).toBeInTheDocument();
        expect(screen.getByText('Payment')).toBeInTheDocument();
        expect(screen.getByText('Read all')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Read all'));
        fireEvent.click(screen.getByText('New message'));

        expect(supabaseState.insertCallback).toBeTypeOf('function');
        supabaseState.insertCallback?.({
            new: {
                id: 'n3',
                user_id: 'user-1',
                title: 'Delivery',
                message: 'Work delivered',
                type: 'delivery',
                read: false,
                created_at: '2026-03-23T00:10:00.000Z',
            },
        });

        expect(await screen.findByText('Delivery')).toBeInTheDocument();

        fireEvent.mouseDown(document.body);
        await waitFor(() => {
            expect(screen.queryByText('View all')).not.toBeInTheDocument();
        });
    });

    it('handles empty and error states cleanly', async () => {
        supabaseState.listResult = { data: null, error: new Error('load failed') };

        render(<NotificationBell />);

        fireEvent.click(await screen.findByRole('button'));

        expect(await screen.findByText('No notifications')).toBeInTheDocument();
        expect(loggerState.error).toHaveBeenCalled();
    });
});
