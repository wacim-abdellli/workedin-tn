import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAdminStats } from "../useAdminData";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
    supabase: {
        from: vi.fn(),
    }
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useAdminStats", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it("fetches admin stats correctly", async () => {
        const mockGte = vi.fn().mockResolvedValue({ count: 5, error: null });
        const mockIn = vi.fn().mockResolvedValue({ count: 10, error: null });
        const mockEq = vi.fn().mockResolvedValue({ count: 15, error: null });
        
        const mockSelect = vi.fn().mockImplementation((col) => {
            return {
                in: mockIn,
                eq: mockEq,
                gte: mockGte,
                in_progress: mockIn,
                then: (cb: any) => cb({ count: 20, error: null }) // for simple select no chaining
            };
        });

        vi.mocked(supabase.from).mockReturnValue({
            select: mockSelect
        } as any);

        const { result } = renderHook(() => useAdminStats(), { wrapper });

        // By default stats are 0, wait for them to load by calling fetch
        // oh wait useadminstats returns [stats, fetchStats, isLoading] or something
        // let me verify what it returns
    });
});
