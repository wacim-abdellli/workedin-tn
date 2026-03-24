import { useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';

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
} | null;

export interface UserMenuProps {
  user: SupabaseUser;
  profile: HeaderProfile;
  isOpen: boolean;
  onToggle: () => void;
}

export function UserMenu({ user, profile, isOpen, onToggle }: UserMenuProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { activeMode } = useAuth();
  const { t } = useTranslation();

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Khedma User';
  const avatarUrl = !avatarFailed ? profile?.avatar_url || user.user_metadata?.avatar_url || null : null;
  const [avatarFrom, avatarTo] = getAvatarGradient(displayName);
  const accountCopy = t.auth.accountPanel;
  const activeWorkspaceLabel = activeMode === 'freelancer' ? accountCopy.freelancerLabel : accountCopy.clientLabel;

  return (
    <div data-account-panel className="flex items-center gap-2">
      <button
        className="relative rounded-full border border-gray-200 bg-gray-100 p-2 transition-all duration-150 hover:bg-gray-200 dark:border-white/10 dark:bg-white/8 dark:hover:bg-white/12"
        aria-label="Notifications"
        type="button"
      >
        <Bell className="h-4 w-4 text-gray-500 dark:text-gray-300" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f0e17]" />
      </button>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all duration-150',
          isOpen
            ? 'border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-950/40'
            : 'border-gray-200 bg-gray-100 hover:bg-gray-200 dark:border-white/10 dark:bg-white/8 dark:hover:bg-white/12'
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="header-account-panel"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-white dark:ring-white/10"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ring-1 ring-white dark:ring-white/10"
            style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
          >
            {getInitials(displayName)}
          </div>
        )}
        <div className="hidden min-w-0 text-left md:block">
          <div className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{displayName}</div>
        </div>
        <span
          className={cn(
            'hidden rounded-full px-2 py-0.5 text-xs font-medium md:block',
            activeMode === 'client'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          )}
        >
          {activeWorkspaceLabel}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200 dark:text-gray-500',
            isOpen && 'rotate-180'
          )}
        />
      </button>
    </div>
  );
}
