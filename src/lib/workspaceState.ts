import { create } from 'zustand';

export type Workspace = 'client' | 'freelancer';

interface WorkspaceState {
  activeWorkspace: Workspace;
  isSwitching: boolean;
  setWorkspace: (workspace: Workspace) => void;
  setSwitching: (value: boolean) => void;
}

const PROFILE_CACHE_KEY = 'wi_profile_cache';

/** Read Supabase auth user id from localStorage without async (avoids theme flash on reload). */
export function getPersistedSupabaseUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('sb-') || key.includes('anon')) {
        continue;
      }
      if (!key.endsWith('-auth-token')) {
        continue;
      }
      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const currentSession = parsed.currentSession as Record<string, unknown> | undefined;
      const legacySession = parsed.session as Record<string, unknown> | undefined;
      const user = (parsed.user ??
        currentSession?.user ??
        legacySession?.user) as { id?: string } | undefined;
      const id = user?.id;
      if (typeof id === 'string' && id.length > 0) {
        return id;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readWorkspaceHintFromProfileCache(userId: string): Workspace | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as {
      userId?: string;
      profile?: {
        active_mode?: string | null;
        user_type?: string | null;
      };
      freelancerProfile?: { title?: string | null } | null;
    };
    if (parsed?.userId !== userId) {
      return null;
    }
    const mode = parsed.profile?.active_mode;
    if (mode === 'freelancer' || mode === 'client') {
      return mode;
    }
    const ut = parsed.profile?.user_type;
    if (ut === 'freelancer') {
      return 'freelancer';
    }
    if (ut === 'client') {
      return 'client';
    }
    if (ut === 'both') {
      return parsed.freelancerProfile?.title ? 'freelancer' : 'client';
    }
    return null;
  } catch {
    return null;
  }
}

// ── Per-user workspace persistence ──────────────────────────────────────────
// Saves the active workspace keyed by userId so reload restores the correct
// mode without waiting for the DB round-trip.
const WS_KEY = 'wi_workspace';

export function saveWorkspaceForUser(userId: string, workspace: Workspace) {
  try {
    localStorage.setItem(WS_KEY, JSON.stringify({ userId, workspace }));
  } catch { /* ignore */ }
}

export function loadWorkspaceForUser(userId: string): Workspace | null {
  try {
    const raw = localStorage.getItem(WS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.userId !== userId) return null;
    return parsed.workspace === 'freelancer' ? 'freelancer' : 'client';
  } catch {
    return null;
  }
}

function getInitialActiveWorkspace(): Workspace {
  const userId = getPersistedSupabaseUserId();
  if (!userId) {
    return 'client';
  }
  return loadWorkspaceForUser(userId) ?? readWorkspaceHintFromProfileCache(userId) ?? 'client';
}

// NOTE: Zustand state is not fully persisted (see wi_workspace). We only seed
// synchronously from localStorage/sessionStorage so the first paint matches
// the signed-in user's workspace and App.tsx does not flash workspace-client.
export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  activeWorkspace: getInitialActiveWorkspace(),
  isSwitching: false,
  setWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  setSwitching: (value) => set({ isSwitching: value }),
}));

export function clearWorkspaceForUser() {
  try { localStorage.removeItem(WS_KEY); } catch { /* ignore */ }
}
