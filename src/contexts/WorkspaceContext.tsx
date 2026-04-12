import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useWorkspaceStore } from '../lib/workspaceState';

export const WorkspaceContext = createContext<{
  isFreelancer: boolean;
  isClient: boolean;
  accentColor: string;
  accentClass: string;
}>({
  isFreelancer: true,
  isClient: false,
  accentColor: '#8b5cf6',
  accentClass: 'purple',
});
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const value = useMemo(
    () => ({
      isFreelancer: activeWorkspace === 'freelancer',
      isClient: activeWorkspace === 'client',
      accentColor: activeWorkspace === 'freelancer' ? '#8b5cf6' : '#f59e0b',
      accentClass: activeWorkspace === 'freelancer' ? 'purple' : 'amber',
    }),
    [activeWorkspace],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
