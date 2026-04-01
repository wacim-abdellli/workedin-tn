import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/lib/supabase";
import { getNotifications, getUnreadCount, insertNotification, createNotification, markNotificationRead, markAllRead } from "../notifications";

vi.mock("@/lib/supabase", () => ({
    supabase: {
        from: vi.fn()
    }
}));

describe("notifications service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("gets notifications", async () => {
        const mockFn = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({
                            data: [{ id: "notif-1" }],
                            error: null
                        })
                    })
                })
            })
        });
        vi.mocked(supabase.from).mockImplementation(mockFn as any);

        const result = await getNotifications("user-1");
        expect(result).toEqual([{ id: "notif-1" }]);
        expect(supabase.from).toHaveBeenCalledWith("notifications");
    });

    it("gets unread count", async () => {
        const mockFn = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        count: 5,
                        error: null
                    })
                })
            })
        });
        vi.mocked(supabase.from).mockImplementation(mockFn as any);

        const count = await getUnreadCount("user-1");
        expect(count).toBe(5);
        expect(supabase.from).toHaveBeenCalledWith("notifications");
    });

    it("inserts notification", async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        const mockFn = vi.fn().mockReturnValue({ insert: mockInsert });
        vi.mocked(supabase.from).mockImplementation(mockFn as any);

        await insertNotification({ user_id: "user-1", type: "system" as any, title: "Hello", body: "World" });
        expect(mockInsert).toHaveBeenCalledWith({ user_id: "user-1", type: "system", title: "Hello", body: "World", is_read: false });
        expect(supabase.from).toHaveBeenCalledWith("notifications");
    });

    it("creates notification", async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        const mockFn = vi.fn().mockReturnValue({ insert: mockInsert });
        vi.mocked(supabase.from).mockImplementation(mockFn as any);

        await createNotification({ user_id: "user-1", type: "system" as any, title: "Hello", body: "World" });
        expect(mockInsert).toHaveBeenCalledWith({ user_id: "user-1", type: "system", title: "Hello", body: "World", is_read: false });
        expect(supabase.from).toHaveBeenCalledWith("notifications");
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
