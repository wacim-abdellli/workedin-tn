import { supabase } from './supabase';
import * as Sentry from '@sentry/react';

export type VerificationStatus = 
  | 'missing'
  | 'pending'
  | 'verified'
  | 'rejected';

export interface VerificationState {
  status: VerificationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  verificationId?: string;
}

function normalizeVerificationStatus(status: string | null | undefined): VerificationStatus {
  const normalized = String(status ?? '').trim().toLowerCase();

  if (!normalized) return 'missing';

  if (['approved', 'accepted', 'verified', 'complete', 'completed', 'success'].includes(normalized)) {
    return 'verified';
  }

  if (['pending', 'in_review', 'under_review', 'reviewing', 'submitted'].includes(normalized)) {
    return 'pending';
  }

  if (['rejected', 'requires_resubmit', 'resubmit_required', 'failed', 'denied'].includes(normalized)) {
    return 'rejected';
  }

  return 'missing';
}

/**
 * Single source of truth for identity verification status.
 * Used by both user and admin to prevent state divergence.
 * 
 * NEVER checks profiles.cin_submitted or profiles.verified 
 * except as final fallback for legacy data.
 */
export async function getVerificationStatus(
  userId: string
): Promise<VerificationState> {
  try {
    // 1. Fetch latest verification request (primary source of truth)
    const { data: verification, error: verifyError } = await supabase
      .from('identity_verifications')
      .select('id, status, submitted_at, reviewed_at, rejection_reason')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verifyError) {
      Sentry.captureException(verifyError, {
        tags: { context: 'getVerificationStatus' },
        extra: { userId }
      });
      throw verifyError;
    }

    // 2. If verification row exists, it's the ground truth
    if (verification) {
      const status = normalizeVerificationStatus(verification.status);

      return {
        status,
        verificationId: verification.id,
        submittedAt: verification.submitted_at,
        reviewedAt: verification.reviewed_at || undefined,
        rejectionReason: verification.rejection_reason || undefined
      };
    }

    // 3. No verification row exists - check profile for legacy verified flag
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('cin_verified')
      .eq('id', userId)
      .single();

    if (profileError) {
      Sentry.captureException(profileError, {
        tags: { context: 'getVerificationStatus_profileFallback' },
        extra: { userId }
      });
      // If profile fetch fails, return missing
      return { status: 'missing' };
    }

    // If the profile already reflects verified identity but no verification record exists, treat as verified.
    if (profile?.cin_verified) {
      return { status: 'verified' };
    }

    // 4. No verification row and not verified = missing
    return { status: 'missing' };

  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'getVerificationStatus_catch' },
      extra: { userId }
    });
    
    // Safe fallback: return missing on any error
    return { status: 'missing' };
  }
}

/**
 * Fetches all pending verifications for admin queue.
 * Returns only real pending rows from identity_verifications table.
 */
export async function getPendingVerifications() {
  const { data, error } = await supabase
    .from('identity_verifications')
    .select(`
      id,
      user_id,
      cin_number,
      cin_front_url,
      cin_back_url,
      selfie_url,
      submitted_at,
      profiles!inner (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .in('status', ['pending', 'in_review'])
    .order('submitted_at', { ascending: true });

  if (error) {
    Sentry.captureException(error, {
      tags: { context: 'getPendingVerifications' }
    });
    throw error;
  }

  return (data || []).map(v => ({
    ...v,
    profile: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
  }));
}

/**
 * Real-time subscription helper for verification status changes.
 * Used by both user and admin to keep UI in sync.
 */
export function subscribeToVerificationChanges(
  userId: string,
  onStatusChange: (state: VerificationState) => void
) {
  const channel = supabase
    .channel(`verification:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'identity_verifications',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        // Refetch status when any change occurs
        const newState = await getVerificationStatus(userId);
        onStatusChange(newState);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Admin real-time subscription for pending queue changes
 */
export function subscribeToPendingQueue(
  onQueueChange: () => void
) {
  const channel = supabase
    .channel('verification_queue')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'identity_verifications',
      },
      onQueueChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
