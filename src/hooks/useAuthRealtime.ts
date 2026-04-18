import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { Profile } from '../types';

interface UseAuthRealtimeParams {
  userId: string | undefined;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setFreelancerProfile: (p: null) => void;
  setSession: (s: null) => void;
  setUser: (u: null) => void;
  setIsProfileReady: (r: boolean) => void;
  setIsLoading: (l: boolean) => void;
  clearProfileCache: () => void;
  clearWorkspaceForUser: () => void;
  withModeAwareAvatar: (profile: Profile) => Profile;
}

export function useAuthRealtime({
  userId,
  setProfile,
  setFreelancerProfile,
  setSession,
  setUser,
  setIsProfileReady,
  setIsLoading,
  clearProfileCache,
  clearWorkspaceForUser,
  withModeAwareAvatar,
}: UseAuthRealtimeParams) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Partial<Profile> | null;
          if (!updated) return;

          const nextStatus = updated.account_status;

          if (nextStatus === 'suspended' || nextStatus === 'archived') {
            logger.warn('[Auth] Account status changed to restricted state. Signing out immediately:', nextStatus);
            setProfile((prev) => (prev ? withModeAwareAvatar({ ...prev, ...updated } as Profile) : prev));
            setFreelancerProfile(null);
            setSession(null);
            setUser(null);
            setIsProfileReady(true);
            setIsLoading(false);
            clearProfileCache();
            clearWorkspaceForUser();
            void supabase.auth.signOut({ scope: 'local' }).catch((error) => {
              logger.warn('[Auth] Forced signout after suspension failed:', error);
            });
            return;
          }

          setProfile((prev) => {
            if (!prev) return prev;
            const next = withModeAwareAvatar({ ...prev, ...updated } as Profile);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    userId,
    setProfile,
    setFreelancerProfile,
    setSession,
    setUser,
    setIsProfileReady,
    setIsLoading,
    clearProfileCache,
    clearWorkspaceForUser,
    withModeAwareAvatar,
  ]);
}
