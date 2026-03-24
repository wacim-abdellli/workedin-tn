import { useState } from 'react';
import { Bell, BriefcaseBusiness, Building2, ChevronDown, Loader2 } from 'lucide-react';
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
  cin_verified?: boolean;
  created_at?: string;
} | null;

export interface UserMenuProps {
  user: SupabaseUser;
  profile: HeaderProfile;
  isOpen: boolean;
  switchingMode?: Mode | null;
  onToggle: () => void;
}

export function UserMenu({ user, profile, isOpen, switchingMode = null, onToggle }: UserMenuProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { activeMode } = useAuth();
  const { t } = useTranslation();

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Khedma User';
  const avatarUrl = !avatarFailed ? profile?.avatar_url || user.user_metadata?.avatar_url || null : null;
  const [avatarFrom, avatarTo] = getAvatarGradient(displayName);
  const accountCopy = t.auth.accountPanel;
  const activeWorkspaceLabel = activeMode === 'freelancer' ? accountCopy.freelancerLabel : accountCopy.clientLabel;
  const RoleIcon = activeMode === 'freelancer' ? BriefcaseBusiness : Building2;
  const isSwitching = switchingMode !== null;

  return (
    <div data-account-panel className="flex items-center gap-2">
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all duration-150 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none dark:hover:bg-white/[0.1]"
        aria-label="Notifications"
        type="button"
      >
        <Bell className="h-4 w-4 text-gray-500 dark:text-gray-300" />
        <span className="absolute right-[11px] top-[11px] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f0e17]" />
      </button>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex min-h-[44px] items-center gap-2 rounded-full border px-2.5 py-1.5 pr-3 transition-all duration-150 shadow-sm',
          isOpen
            ? 'border-purple-200 bg-purple-50 shadow-purple-500/10 dark:border-purple-500/30 dark:bg-purple-950/40 dark:shadow-none'
            : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]'
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
            'hidden items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium md:inline-flex',
            activeMode === 'client'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          )}
        >
          {isSwitching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RoleIcon className="h-3 w-3" />}
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
