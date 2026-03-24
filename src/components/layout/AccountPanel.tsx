import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BriefcaseBusiness, Loader2, LogOut, Plus, Settings, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';
import { hardLogout, clearAllAuthData } from '@/lib/authUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { getModeSetupProgress, getModeTarget, getProfilePath, getSettingsPath } from '@/lib/accountMode';
import { useToast } from '@/components/ui/Toast';

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

interface AccountPanelProps {
  isOpen: boolean;
  headerHeight: number;
  user: SupabaseUser;
  profile: HeaderProfile;
  signOut: () => Promise<void>;
  onClose: () => void;
}

export default function AccountPanel({
  isOpen,
  headerHeight,
  profile,
  signOut,
  onClose,
}: AccountPanelProps) {
  const navigate = useNavigate();
  const { activeMode, availableModes, freelancerProfile, switchAccountMode } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState<Mode | null>(null);

  const copy = t.auth.accountPanel;
  const currentTarget = getModeTarget(profile, freelancerProfile, activeMode);
  const setupProgress = getModeSetupProgress(profile, freelancerProfile, activeMode);
  const profileActionTo = getProfilePath(profile, activeMode);
  const settingsActionTo = getSettingsPath();
  const setupActionTo = currentTarget.isOnboarded ? profileActionTo : currentTarget.path;
  const setupActionLabel = currentTarget.isOnboarded ? copy.manageProfile : copy.completeSetup;

  const activeWorkspacePill = activeMode === 'freelancer'
    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';

  const workspaceCards = useMemo(
    () => [
      {
        mode: 'freelancer' as const,
        title: copy.freelancerLabel,
        description: copy.freelancerDesc,
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        iconWrap: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      },
      {
        mode: 'client' as const,
        title: copy.clientLabel,
        description: copy.clientDesc,
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        iconWrap: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      },
    ],
    [copy.clientDesc, copy.clientLabel, copy.freelancerDesc, copy.freelancerLabel]
  );

  const handleSwitchMode = async (mode: Mode) => {
    if (mode === activeMode || isSwitchingMode) return;

    setIsSwitchingMode(mode);

    try {
      const result = await switchAccountMode(mode);
      onClose();
      showToast(result.mode === 'freelancer' ? copy.switchedFreelancer : copy.switchedClient, 'success');
      navigate(result.targetPath);
    } catch (error) {
      logger.error('Mode switch failed:', error);
      showToast(copy.switchError, 'error');
    } finally {
      setIsSwitchingMode(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    onClose();

    try {
      clearAllAuthData();
      await Promise.race([signOut(), new Promise((resolve) => setTimeout(resolve, 2000))]);
    } catch (error) {
      logger.error('Logout error:', error);
    }

    hardLogout('/login');
  };

  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close account panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ position: 'fixed', top: `${headerHeight}px`, left: 0, right: 0, zIndex: 40 }}
            id="header-account-panel"
            className="w-full border-b border-gray-100 bg-white shadow-xl shadow-gray-200/50 dark:border-white/5 dark:bg-[#0f0e17] dark:shadow-black/60"
            data-account-panel
          >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-6 rounded-[32px] border border-gray-100 bg-[#fcfbff] p-4 shadow-sm dark:border-white/8 dark:bg-[#14121f] lg:grid-cols-[1.05fr_1.2fr_0.9fr]">
                <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171421]">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-500 dark:text-purple-300">
                  {copy.sectionLabel}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', activeWorkspacePill)}>
                    {activeMode === 'freelancer' ? copy.freelancerLabel : copy.clientLabel}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {currentTarget.isOnboarded ? copy.ready : copy.needsSetup}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {activeMode === 'freelancer' ? copy.freelancerHint : copy.clientHint}
                </p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      activeMode === 'freelancer'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-400'
                        : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                    )}
                    style={{ width: `${setupProgress}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span>{copy.progressLabel}</span>
                  <span>{setupProgress}%</span>
                </div>
                <Link
                  to={setupActionTo}
                  onClick={onClose}
                  className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-500 hover:shadow-xl hover:shadow-purple-500/30"
                >
                  {setupActionLabel}
                </Link>
                </section>

                <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171421]">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{copy.switchWorkspace}</div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {profile?.user_type === 'both' ? copy.switchWorkspaceBoth : copy.switchWorkspaceSingle}
                </p>
                <div className="mt-5 grid gap-3">
                  {workspaceCards.map((item) => {
                    const isActive = activeMode === item.mode;
                    const isAvailable = availableModes.includes(item.mode);
                    const actionLabel = isActive ? copy.current : isAvailable ? copy.switchAction : copy.enable;

                    return (
                      <button
                        key={item.mode}
                        type="button"
                        onClick={() => void handleSwitchMode(item.mode)}
                        disabled={isActive || isSwitchingMode !== null}
                        className={cn(
                          'rounded-3xl border px-4 py-4 text-left transition-all duration-200',
                          'border-gray-200 bg-[#faf9fe] hover:border-purple-200 hover:shadow-sm dark:border-white/10 dark:bg-[#171421] dark:hover:border-purple-500/30',
                          isActive && 'border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-950/20',
                          isActive && 'cursor-default'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl', item.iconWrap)}>
                            {item.mode === 'freelancer' ? <User className="h-5 w-5" /> : <BriefcaseBusiness className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</div>
                              <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', item.badge)}>
                                {isSwitchingMode === item.mode ? copy.switching : actionLabel}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</p>
                            {!isActive ? (
                              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-300">
                                {isSwitchingMode === item.mode ? <Loader2 className="h-4 w-4 animate-spin" /> : !isAvailable ? <Plus className="h-4 w-4" /> : null}
                                {actionLabel}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                </section>

                <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171421]">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-500">
                  {copy.tools}
                </div>
                <div className="mt-4 grid gap-3">
                  <ActionLink to={profileActionTo} onClick={onClose} icon={<User className="h-4 w-4" />} label={copy.profileAction} />
                  <ActionLink to={settingsActionTo} onClick={onClose} icon={<Settings className="h-4 w-4" />} label={copy.settingsAction} />
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                    className="mt-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15"
                  >
                    {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    {copy.logoutAction}
                  </button>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-500">{copy.logoutDesc}</p>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ActionLink({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center gap-3 rounded-2xl border border-gray-200 bg-[#faf9fe] px-4 py-3 text-sm font-semibold text-gray-800 transition-all hover:border-purple-200 hover:bg-purple-50 dark:border-white/10 dark:bg-[#171421] dark:text-white dark:hover:border-purple-500/30 dark:hover:bg-white/[0.04]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
