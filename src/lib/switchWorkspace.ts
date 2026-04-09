import type { NavigateFunction } from 'react-router-dom';

import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import type { FreelancerProfile, Profile, UserType } from '@/types';
import { getWorkspaceTargetRoute, promoteUserTypeForWorkspace } from '@/lib/workspaceRoutes';
import { useWorkspaceStore, saveWorkspaceForUser, type Workspace } from '@/lib/workspaceState';

interface SwitchWorkspaceArgs {
  userId: string;
  targetWorkspace: Workspace;
  currentUserType: UserType | null | undefined;
  profile: Partial<
    Pick<
      Profile,
      'id' | 'user_type' | 'active_mode' | 'full_name' | 'location' | 'onboarding_completed' | 'username'
    >
  > | null;
  freelancerProfile: FreelancerProfile | null;
  navigate: NavigateFunction;
}

let workspaceSyncInFlight = false;
let pendingWorkspaceSync:
  | {
      userId: string;
      workspace: Workspace;
      currentUserType: UserType | null | undefined;
    }
  | null = null;
let visibilityListenerAttached = false;

function isDocumentVisible() {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}

function attachWorkspaceVisibilityListener() {
  if (visibilityListenerAttached || typeof document === 'undefined') return;

  document.addEventListener('visibilitychange', () => {
    if (!isDocumentVisible() || workspaceSyncInFlight || !pendingWorkspaceSync) return;

    const nextSync = pendingWorkspaceSync;
    pendingWorkspaceSync = null;
    void runWorkspaceSync(nextSync.userId, nextSync.workspace, nextSync.currentUserType);
  });

  visibilityListenerAttached = true;
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

  // Persist immediately so reload restores the correct workspace before DB responds
  saveWorkspaceForUser(userId, targetWorkspace);

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

  navigate('/', {
    state: {
      switching: true,
      workspace: targetWorkspace,
    },
  });

  // Delay scroll so it fires after navigation + re-render
  window.setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 50);

  window.setTimeout(() => {
    useWorkspaceStore.getState().setSwitching(false);
  }, 300);

  attachWorkspaceVisibilityListener();
  void runWorkspaceSync(userId, targetWorkspace, currentUserType);

  return {
    targetRoute: target.path,
    isOnboarded: target.isOnboarded,
  };
}

async function ensureFreelancerShell(userId: string) {
  await supabaseWithRetry(() =>
    supabase.from('freelancer_profiles').upsert(
      { id: userId, skills: [], availability: 'available' },
      {
        onConflict: 'id',
        ignoreDuplicates: true,
      }
    )
  , { throwOnError: false }
  );
}

async function runWorkspaceSync(
  userId: string,
  workspace: Workspace,
  currentUserType: UserType | null | undefined
) {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

  if (workspaceSyncInFlight) {
    pendingWorkspaceSync = { userId, workspace, currentUserType };
    return;
  }

  if (!isDocumentVisible()) {
    pendingWorkspaceSync = { userId, workspace, currentUserType };
    return;
  }

  workspaceSyncInFlight = true;

  try {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) return;

      await syncWorkspaceToBackend(userId, workspace, currentUserType);
    } catch {
      // silent - background workspace sync is non-critical
    }
  } finally {
    workspaceSyncInFlight = false;

    if (pendingWorkspaceSync && isDocumentVisible()) {
      const nextSync = pendingWorkspaceSync;
      pendingWorkspaceSync = null;
      void runWorkspaceSync(nextSync.userId, nextSync.workspace, nextSync.currentUserType);
    }
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

  await supabaseWithRetry(() =>
    supabase
      .from('profiles')
      .update({
        active_mode: workspace,
        user_type: nextUserType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  , { throwOnError: false });
}
