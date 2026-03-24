import { createContext, useContext, type ReactNode } from 'react';
import { useWorkspaceStore } from '../lib/workspaceState';

export const WorkspaceContext = createContext<{
  isFreelancer: boolean;
  isClient: boolean;
  accentColor: string;
  accentClass: string;
}>({
  isFreelancer: false,
  isClient: true,
  accentColor: '#f59e0b',
  accentClass: 'amber',
});
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { activeWorkspace } = useWorkspaceStore();
  const value = {
    isFreelancer: activeWorkspace === 'freelancer',
    isClient: activeWorkspace === 'client',
    accentColor: activeWorkspace === 'freelancer' ? '#8b5cf6' : '#f59e0b',
    accentClass: activeWorkspace === 'freelancer' ? 'purple' : 'amber',
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
