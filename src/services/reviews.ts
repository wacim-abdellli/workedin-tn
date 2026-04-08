import { supabase } from '@/lib/supabase';

export async function submitReview(
    contractId: string,
    rating: number,
    comment?: string | null,
) {
    return supabase.rpc('submit_review_atomic', {
        p_contract_id: contractId,
        p_rating: rating,
        p_comment: comment?.trim() || null,
    });
}
