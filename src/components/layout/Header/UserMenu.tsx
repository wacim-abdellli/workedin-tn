import { useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { cn } from '@/lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { useWorkspaceStore } from '@/lib/workspaceState';

type Mode = 'freelancer' | 'client';

type HeaderProfile = {
  active_mode?: Mode | null;
  full_name?: string;
  avatar_url?: string;
  user_type?: 'freelancer' | 'client' | 'both' | null;
  id?: string;
  username?: string;
  is_admin?: boolean;
  bio?: string;
  location?: string;
  cin_verified?: boolean;
  created_at?: string;
} | null;

export interface UserMenuProps {
  user: SupabaseUser;
  profile: HeaderProfile;
  isOpen: boolean;
  onToggle: () => void;
}

export function UserMenu({ user, profile, isOpen, onToggle }: UserMenuProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Khedma User';
  const avatarUrl = !avatarFailed ? profile?.avatar_url || user.user_metadata?.avatar_url || null : null;
  const [avatarFrom, avatarTo] = getAvatarGradient(displayName);

  return (
    <div data-account-panel className="flex items-center gap-2">
      <button
        className="relative hidden md:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-gray-500 dark:text-gray-400 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/5"
        aria-label="Notifications"
        type="button"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f0e17]" />
      </button>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 pl-1 pr-2 py-1 transition-all duration-150 rounded-full border max-w-[180px]',
          isOpen
            ? 'border-purple-200 bg-purple-50 shadow-sm dark:border-purple-500/30 dark:bg-purple-950/30'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'
        )}
        aria-expanded={isOpen}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-7 w-7 rounded-full object-cover shrink-0"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
          >
            {getInitials(displayName)}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[80px] hidden lg:block">
          {displayName}
        </span>
        <span
          className={cn(
            'hidden items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold md:flex shrink-0',
            activeWorkspace === 'client'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
          )}
        >
          {activeWorkspace === 'client' ? 'Client' : 'Pro'}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
    </div>
  );
}
