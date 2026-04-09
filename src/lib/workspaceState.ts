import { create } from 'zustand';

export type Workspace = 'client' | 'freelancer';

interface WorkspaceState {
  activeWorkspace: Workspace;
  isSwitching: boolean;
  setWorkspace: (workspace: Workspace) => void;
  setSwitching: (value: boolean) => void;
}

// NOTE: Do NOT persist this store. The activeWorkspace is always derived from
// the authenticated user's DB profile via syncWorkspaceFromProfile() in
// AuthContext on every login. Persisting it under a shared localStorage key
// caused cross-user session bleed: user B's workspace value would be read by
// user A's session before auth finished loading, triggering spurious redirects.
export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  activeWorkspace: 'client',
  isSwitching: false,
  setWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  setSwitching: (value) => set({ isSwitching: value }),
}));

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

export function clearWorkspaceForUser() {
  try { localStorage.removeItem(WS_KEY); } catch { /* ignore */ }
}
