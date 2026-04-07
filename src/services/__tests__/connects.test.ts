import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/lib/supabase";
import { getConnectsBalance, spendConnects, refundConnects, withdrawProposalWithRefund } from "../connects";

vi.mock("@/lib/supabase", () => ({
    supabase: {
        rpc: vi.fn(),
        from: vi.fn()
    }
}));

describe("connects service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("gets connects balance", async () => {
        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: { connects_balance: 18, connects_used: 2 },
                    error: null
                })
            })
        });
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

        const result = await getConnectsBalance("f-1");
        expect(result).toEqual({ balance: 18, used: 2 });
        expect(supabase.from).toHaveBeenCalledWith("freelancer_profiles");
    });

    it("spends connects", async () => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ error: null, data: { success: true, balance: 16 } } as never);
        const result = await spendConnects("f-1", "proposal-1", 2);
        expect(result).toEqual({ success: true, balance: 16 });
        expect(supabase.rpc).toHaveBeenCalledWith("spend_connects_for_proposal", { p_freelancer_id: "f-1", p_proposal_id: "proposal-1", p_cost: 2 });
    });

    it("withdraws proposal and refunds connects atomically", async () => {
        const mockResult = { success: true, proposal_id: "proposal-1", refunded: 2 };
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ error: null, data: mockResult } as never);

        const result = await withdrawProposalWithRefund("proposal-1");
        expect(result).toEqual(mockResult);
        expect(supabase.rpc).toHaveBeenCalledWith("withdraw_proposal_atomic", {
            p_proposal_id: "proposal-1",
            p_refund: 2
        });
    });

    it("withdrawProposalWithRefund throws on RPC error", async () => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ error: { message: "Proposal not found" }, data: null } as never);
        await expect(withdrawProposalWithRefund("bad-id")).rejects.toMatchObject({ message: "Proposal not found" });
    });

    it("refundConnects is a no-op stub (deprecated)", async () => {
        // refundConnects no longer calls any RPC — it is a deprecated no-op.
        await refundConnects("f-1", "proposal-1");
        expect(supabase.rpc).not.toHaveBeenCalled();
    });
});
