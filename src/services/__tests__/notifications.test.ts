import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/lib/supabase";
import { getNotifications, getUnreadCount, insertNotification, createNotification, markNotificationRead, markAllRead } from "../notifications";

vi.mock("@/lib/supabase", () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}));

describe("notifications service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("gets notifications", async () => {
        const mockLimit = vi.fn().mockResolvedValue({
            data: [{ id: "notif-1" }],
            error: null
        });
        const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockNeq = vi.fn().mockReturnValue({ order: mockOrder });
        const mockEq = vi.fn().mockReturnValue({ neq: mockNeq });
        const mockFn = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: mockEq
            })
        });
        vi.mocked(supabase.from).mockImplementation(mockFn as any);

        const result = await getNotifications("user-1");
        expect(result).toEqual([{ id: "notif-1" }]);
        expect(supabase.from).toHaveBeenCalledWith("notifications");
        expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(mockNeq).toHaveBeenCalledWith('type', 'message');
    });

    it("gets unread count", async () => {
        const mockUnreadEq = vi.fn().mockResolvedValue({
            count: 5,
            error: null
        });
        const mockNeq = vi.fn().mockReturnValue({ eq: mockUnreadEq });
        const mockUserEq = vi.fn().mockReturnValue({ neq: mockNeq });
        const mockFn = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: mockUserEq
            })
        });
        vi.mocked(supabase.from).mockImplementation(mockFn as any);

        const count = await getUnreadCount("user-1");
        expect(count).toBe(5);
        expect(supabase.from).toHaveBeenCalledWith("notifications");
        expect(mockUserEq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(mockNeq).toHaveBeenCalledWith('type', 'message');
        expect(mockUnreadEq).toHaveBeenCalledWith('is_read', false);
    });

    it("inserts notification", async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as any);

        await insertNotification({ user_id: "user-1", type: "system" as any, title: "Hello", body: "World" });
        expect(supabase.rpc).toHaveBeenCalledWith('create_notification', {
            p_user_id: "user-1",
            p_type: "system",
            p_title: "Hello",
            p_body: "World",
            p_related_id: undefined,
            p_link: undefined
        });
    });

    it("creates notification", async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as any);

        await createNotification({ user_id: "user-1", type: "system" as any, title: "Hello", body: "World" });
        expect(supabase.rpc).toHaveBeenCalledWith('create_notification', {
            p_user_id: "user-1",
            p_type: "system",
            p_title: "Hello",
            p_body: "World",
            p_related_id: undefined,
            p_link: undefined
        });
    });

    it("marks notification read", async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFn = vi.fn().mockReturnValue({ update: mockUpdate });
        vi.mocked(supabase.from).mockImplementation(mockFn as any);

        await markNotificationRead("notif-1");
        expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
        expect(mockEq).toHaveBeenCalledWith('id', 'notif-1');
        expect(supabase.from).toHaveBeenCalledWith("notifications");
    });

    it("marks all read", async () => {
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });
        const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
        const mockFn = vi.fn().mockReturnValue({ update: mockUpdate });
        vi.mocked(supabase.from).mockImplementation(mockFn as any);

        await markAllRead("user-1");
        expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
        expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-1');
        expect(mockEq2).toHaveBeenCalledWith('is_read', false);
        expect(supabase.from).toHaveBeenCalledWith("notifications");
    });
});
