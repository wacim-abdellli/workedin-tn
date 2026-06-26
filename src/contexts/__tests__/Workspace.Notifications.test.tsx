import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import React from 'react';

// Mock dependencies
let activeWorkspaceMock = 'client';
vi.mock('@/lib/workspaceState', () => ({
    useWorkspaceStore: vi.fn((selector) => {
        const state = { activeWorkspace: activeWorkspaceMock };
        return selector ? selector(state) : state;
    }),
}));

const realtimeNotificationsMock = {
    notifications: [] as any[],
    unreadCount: 0,
    isLoading: false,
    markAsRead: vi.fn(),
    markAllRead: vi.fn(),
    deleteNotification: vi.fn(),
};
vi.mock('@/hooks/useRealtimeNotifications', () => ({
    useRealtimeNotifications: vi.fn(() => ({
        notifications: realtimeNotificationsMock.notifications,
        unreadCount: realtimeNotificationsMock.unreadCount,
        isLoading: realtimeNotificationsMock.isLoading,
        markAsRead: realtimeNotificationsMock.markAsRead,
        markAllRead: realtimeNotificationsMock.markAllRead,
        deleteNotification: realtimeNotificationsMock.deleteNotification,
    })),
}));

const authUserMock = { id: 'user-123' };
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({ user: authUserMock })),
}));

import { WorkspaceProvider, useWorkspace } from '../WorkspaceContext';
import { NotificationsProvider, useNotifications } from '../NotificationsContext';

describe('WorkspaceContext & useWorkspace', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns client workspace values when activeWorkspace is client', () => {
        activeWorkspaceMock = 'client';
        const wrapper = ({ children }: { children: ReactNode }) => (
            <WorkspaceProvider>{children}</WorkspaceProvider>
        );
        const { result } = renderHook(() => useWorkspace(), { wrapper });

        expect(result.current.isClient).toBe(true);
        expect(result.current.isFreelancer).toBe(false);
        expect(result.current.accentColor).toBe('#f59e0b');
        expect(result.current.accentClass).toBe('amber');
    });

    it('returns freelancer workspace values when activeWorkspace is freelancer', () => {
        activeWorkspaceMock = 'freelancer';
        const wrapper = ({ children }: { children: ReactNode }) => (
            <WorkspaceProvider>{children}</WorkspaceProvider>
        );
        const { result } = renderHook(() => useWorkspace(), { wrapper });

        expect(result.current.isClient).toBe(false);
        expect(result.current.isFreelancer).toBe(true);
        expect(result.current.accentColor).toBe('#8b5cf6');
        expect(result.current.accentClass).toBe('purple');
    });
});

describe('NotificationsContext & useNotifications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        realtimeNotificationsMock.notifications = [];
        realtimeNotificationsMock.unreadCount = 0;
        realtimeNotificationsMock.isLoading = false;
        activeWorkspaceMock = 'client';
    });

    it('filters client and freelancer notifications based on active workspace mode', () => {
        activeWorkspaceMock = 'client';
        realtimeNotificationsMock.notifications = [
            {
                id: 'notif-1',
                title: 'New proposal submitted',
                body: 'submitted a proposal',
                type: 'new_proposal',
                link: 'role=client',
                is_read: false,
            },
            {
                id: 'notif-2',
                title: 'Your proposal was accepted',
                body: 'proposal accepted',
                type: 'proposal',
                link: 'role=freelancer',
                is_read: false,
            },
            {
                id: 'notif-3',
                title: 'General notification',
                body: 'something happened',
                type: 'system',
                link: 'general',
                is_read: false,
            }
        ];
        realtimeNotificationsMock.unreadCount = 3;

        const wrapper = ({ children }: { children: ReactNode }) => (
            <NotificationsProvider>{children}</NotificationsProvider>
        );
        const { result } = renderHook(() => useNotifications(), { wrapper });

        // In client mode, freelancer-exclusive notifications (notif-2) should be filtered out
        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.notifications.map(n => n.id)).toEqual(['notif-1', 'notif-3']);
        expect(result.current.unreadCount).toBe(2);
    });

    it('filters out client notifications when active workspace is freelancer', () => {
        activeWorkspaceMock = 'freelancer';
        realtimeNotificationsMock.notifications = [
            {
                id: 'notif-1',
                title: 'New proposal submitted',
                body: 'submitted a proposal',
                type: 'new_proposal',
                link: 'role=client',
                is_read: false,
            },
            {
                id: 'notif-2',
                title: 'Your proposal was accepted',
                body: 'proposal accepted',
                type: 'proposal',
                link: 'role=freelancer',
                is_read: false,
            }
        ];
        realtimeNotificationsMock.unreadCount = 2;

        const wrapper = ({ children }: { children: ReactNode }) => (
            <NotificationsProvider>{children}</NotificationsProvider>
        );
        const { result } = renderHook(() => useNotifications(), { wrapper });

        // In freelancer mode, client-exclusive notifications (notif-1) should be filtered out
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].id).toBe('notif-2');
        expect(result.current.unreadCount).toBe(1);
    });
});
