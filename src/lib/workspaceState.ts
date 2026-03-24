import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Workspace = 'client' | 'freelancer';

interface WorkspaceState {
  activeWorkspace: Workspace;
  isSwitching: boolean;
  setWorkspace: (workspace: Workspace) => void;
  setSwitching: (value: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspace: 'client',
      isSwitching: false,
      setWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      setSwitching: (value) => set({ isSwitching: value }),
    }),
    {
      name: 'khedma-workspace',
      partialize: (state) => ({ activeWorkspace: state.activeWorkspace }),
    }
  )
);
