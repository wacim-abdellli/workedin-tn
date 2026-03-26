import type { NavigateFunction } from 'react-router-dom';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { FreelancerProfile, Profile, UserType } from '@/types';
import { promoteUserTypeForWorkspace, getWorkspaceTargetRoute } from '@/lib/workspaceRoutes';
import { useWorkspaceStore, type Workspace } from '@/lib/workspaceState';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

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
  const token = await getToken();
  const res = await fetch(`${SUPA_URL}/rest/v1/freelancer_profiles`, {
    method: 'POST',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates',
    },
    body: JSON.stringify({ id: userId, skills: [], availability: 'available' }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

async function syncWorkspaceToBackend(
  userId: string,
  workspace: Workspace,
  currentUserType: UserType | null | undefined
) {
  const nextUserType = promoteUserTypeForWorkspace(currentUserType, workspace);
  const token = await getToken();

  if (workspace === 'freelancer') {
    await ensureFreelancerShell(userId);
  }

  const res = await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      active_mode: workspace,
      user_type: nextUserType,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

