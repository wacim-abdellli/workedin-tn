import type { NavigateFunction } from 'react-router-dom';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { FreelancerProfile, Profile, UserType } from '@/types';
import { promoteUserTypeForWorkspace, getWorkspaceTargetRoute } from '@/lib/workspaceRoutes';
import { useWorkspaceStore, type Workspace } from '@/lib/workspaceState';

interface SwitchWorkspaceArgs {
  userId: string;
  targetWorkspace: Workspace;
  currentUserType: UserType | null | undefined;
  profile: Partial<Pick<Profile, 'id' | 'user_type' | 'active_mode' | 'full_name' | 'location' | 'onboarding_completed' | 'username'>> | null;
  freelancerProfile: FreelancerProfile | null;
  navigate: NavigateFunction;
}

export async function switchWorkspace({
  userId,
  targetWorkspace,
  currentUserType,
  profile,
  freelancerProfile,
  navigate,
}: SwitchWorkspaceArgs): Promise<{ targetRoute: string; isOnboarded: boolean }> {
  const store = useWorkspaceStore.getState();

  store.setSwitching(true);
  store.setWorkspace(targetWorkspace);

  if (targetWorkspace === 'freelancer' && !freelancerProfile) {
    void ensureFreelancerShell(userId);
  }

  const nextProfile = {
    ...profile,
    id: profile?.id ?? userId,
    user_type: promoteUserTypeForWorkspace(currentUserType, targetWorkspace),
    active_mode: targetWorkspace,
  } as Profile;

  const target = getWorkspaceTargetRoute(nextProfile, freelancerProfile, targetWorkspace);
  sessionStorage.setItem('workspace_switched', targetWorkspace);

  navigate(target.path, {
    state: {
      switching: true,
      workspace: targetWorkspace,
    },
  });

  window.setTimeout(() => {
    useWorkspaceStore.getState().setSwitching(false);
  }, 300);

  void syncWorkspaceToBackend(userId, targetWorkspace, currentUserType).catch((error) => {
    logger.warn('Background workspace sync failed:', error);
  });

  return {
    targetRoute: target.path,
    isOnboarded: target.isOnboarded,
  };
}

async function ensureFreelancerShell(userId: string) {
  const { error } = await supabase.from('freelancer_profiles').upsert(
    {
      id: userId,
      skills: [],
      availability: 'available',
    },
    {
      onConflict: 'id',
    }
  );

  if (error) {
    throw error;
  }
}

async function syncWorkspaceToBackend(
  userId: string,
  workspace: Workspace,
  currentUserType: UserType | null | undefined
) {
  const nextUserType = promoteUserTypeForWorkspace(currentUserType, workspace);

  if (workspace === 'freelancer') {
    await ensureFreelancerShell(userId);
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      active_mode: workspace,
      user_type: nextUserType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}
