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
