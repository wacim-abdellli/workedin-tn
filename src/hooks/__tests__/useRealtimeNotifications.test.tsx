import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealtimeNotifications } from '../useRealtimeNotifications';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import * as toastModule from '@/components/ui/Toast';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        channel: vi.fn(),
        removeChannel: vi.fn(),
    }
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: vi.fn()
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useRealtimeNotifications', () => {
    const mockShowToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        vi.mocked(toastModule.useToast).mockReturnValue({ showToast: mockShowToast } as any);
    });

    it('does not fetch or subscribe if userId is undefined', () => {
        const { result } = renderHook(() => useRealtimeNotifications(undefined), { wrapper });
        expect(result.current.isLoading).toBe(false);
        expect(supabase.from).not.toHaveBeenCalled();
        expect(supabase.channel).not.toHaveBeenCalled();
    });

    it('fetches notifications and subscribes to channel', async () => {
        const mockData = [
            { id: '1', title: 'Test 1', is_read: false },
            { id: '2', title: 'Test 2', is_read: true }
        ];

        const mockLimit = vi.fn().mockResolvedValue({
            data: mockData,
            error: null
        });
        const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockNeq = vi.fn().mockReturnValue({ order: mockOrder });
        const mockEq = vi.fn().mockReturnValue({ neq: mockNeq });
        const mockSelect = vi.fn().mockReturnValue({
            eq: mockEq
        });

        vi.mocked(supabase.from).mockImplementation((() => ({ select: mockSelect })) as any);

        const mockSubscribe = vi.fn();
        const channel = {
            on: vi.fn(),
            subscribe: mockSubscribe,
        };
        channel.on.mockReturnValue(channel);
        vi.mocked(supabase.channel).mockReturnValue(channel as any);

        const { result } = renderHook(() => useRealtimeNotifications('user-1'), { wrapper });

        expect(supabase.channel).toHaveBeenCalledWith('notifications:user-1');
        
        await waitFor(() => {
            expect(result.current.notifications).toEqual(mockData);
        });
        
        expect(result.current.unreadCount).toBe(1);
        expect(mockNeq).toHaveBeenCalledWith('type', 'message');
    });

    it('marks notification as read', async () => {
        const mockData = [
            { id: '1', title: 'Test 1', is_read: false },
        ];
        queryClient.setQueryData(['notifications', 'user-1'], mockData);

        const mockEq = vi.fn().mockResolvedValue({ error: null });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
        vi.mocked(supabase.from).mockImplementation((() => ({ update: mockUpdate })) as any);

        const { result } = renderHook(() => useRealtimeNotifications('user-1'), { wrapper });

        await result.current.markAsRead('1');

        expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
        expect(mockEq).toHaveBeenCalledWith('id', '1');

        const currentData = queryClient.getQueryData<any[]>(['notifications', 'user-1']);
        expect(currentData?.[0].is_read).toBe(true);
    });

    it('marks all as read', async () => {
        const mockData = [
            { id: '1', title: 'Test 1', is_read: false },
            { id: '2', title: 'Test 2', is_read: false }
        ];
        queryClient.setQueryData(['notifications', 'user-1'], mockData);

        const mockEq2 = vi.fn().mockResolvedValue({ error: null });
        const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
        vi.mocked(supabase.from).mockImplementation((() => ({ update: mockUpdate })) as any);

        const { result } = renderHook(() => useRealtimeNotifications('user-1'), { wrapper });

        await result.current.markAllRead();

        expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
        expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-1');
        expect(mockEq2).toHaveBeenCalledWith('is_read', false);

        const currentData = queryClient.getQueryData<any[]>(['notifications', 'user-1']);
        expect(currentData?.[0].is_read).toBe(true);
        expect(currentData?.[1].is_read).toBe(true);
    });

    it('handles postgres_changes INSERT event', async () => {
        let triggerEvent: ((payload: unknown) => void) | undefined;

        const channel = {
            on: vi.fn(),
            subscribe: vi.fn(),
        };
        channel.on
            .mockImplementationOnce((event, filter, callback) => {
                triggerEvent = callback;
                return channel;
            })
            .mockImplementationOnce(() => channel);
        vi.mocked(supabase.channel).mockReturnValue(channel as any);

        renderHook(() => useRealtimeNotifications('user-1'), { wrapper });

        // Trigger the insert
        triggerEvent?.({
            new: { id: '3', title: 'New Notification', is_read: false, type: 'system' }
        });

        // The query cache should have prepended the new item
        const data = queryClient.getQueryData<any[]>(['notifications', 'user-1']);
        expect(data?.[0].id).toBe('3');
        expect(mockShowToast).not.toHaveBeenCalled();
    });
});
