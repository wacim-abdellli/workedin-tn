import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronRight,
  Loader2,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';
import { hardLogout, clearAllAuthData } from '@/lib/authUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { getModeSetupProgress, getModeTarget, getSettingsPath } from '@/lib/accountMode';
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
  cin_verified?: boolean;
  created_at?: string;
  onboarding_completed?: boolean;
} | null;

interface AccountPanelProps {
  isOpen: boolean;
  headerHeight: number;
  user: SupabaseUser;
  profile: HeaderProfile;
  signOut: () => Promise<void>;
  switchingMode?: Mode | null;
  onSwitchingModeChange?: (mode: Mode | null) => void;
  onClose: () => void;
}

export default function AccountPanel({
  isOpen,
  headerHeight,
  user,
  profile,
  signOut,
  switchingMode = null,
  onSwitchingModeChange,
  onClose,
}: AccountPanelProps) {
  const navigate = useNavigate();
  const { activeMode, availableModes, freelancerProfile, switchAccountMode } = useAuth();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const copy = t.auth.accountPanel;
  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Khedma User';
  const avatarUrl = !avatarFailed ? profile?.avatar_url || user.user_metadata?.avatar_url || null : null;
  const [avatarFrom, avatarTo] = getAvatarGradient(displayName);
  const currentTarget = getModeTarget(profile, freelancerProfile, activeMode);
  const setupProgress = getModeSetupProgress(profile, freelancerProfile, activeMode);
  const walletPath = activeMode === 'freelancer' ? '/freelancer/earnings' : '/settings?tab=payment';
  const verificationPath = '/verify-identity';
  const settingsPath = getSettingsPath();
  const profilePath = '/profile';
  const setupActionTo = currentTarget.isOnboarded ? profilePath : currentTarget.path;
  const setupActionLabel = currentTarget.isOnboarded ? copy.manageProfile : copy.completeSetup;
  const isVerified = Boolean(profile?.cin_verified || freelancerProfile?.cin_verified);
  const memberSince = formatMemberSince(profile?.created_at || user.created_at, language);
  const identityLine = [profile?.location, memberSince].filter(Boolean).join(' • ');
  const activeWorkspacePill =
    activeMode === 'freelancer'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';

  const workspaceCards = useMemo(
    () => [
      {
        mode: 'freelancer' as const,
        title: copy.freelancerLabel,
        description: availableModes.includes('freelancer')
          ? freelancerProfile?.title || copy.freelancerDesc
          : copy.completeSetup,
        meta: freelancerProfile
          ? `${freelancerProfile.completion_rate ?? 0}% ${copy.progressLabel.toLowerCase()}`
          : copy.needsSetup,
        icon: BriefcaseBusiness,
        accent: 'purple',
      },
      {
        mode: 'client' as const,
        title: copy.clientLabel,
        description: profile?.onboarding_completed ? copy.clientDesc : copy.completeSetup,
        meta: profile?.onboarding_completed ? copy.ready : copy.needsSetup,
        icon: Building2,
        accent: 'amber',
      },
    ],
    [
      availableModes,
      copy.clientDesc,
      copy.completeSetup,
      copy.freelancerDesc,
      copy.freelancerLabel,
      copy.needsSetup,
      copy.progressLabel,
      copy.ready,
      copy.clientLabel,
      freelancerProfile,
      profile?.onboarding_completed,
    ]
  );

  const handleSwitchMode = async (mode: Mode) => {
    if (mode === activeMode || switchingMode) return;

    onSwitchingModeChange?.(mode);

    try {
      const result = await switchAccountMode(mode);
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      onClose();
      navigate(result.targetPath, {
        state: {
          switching: true,
          workspace: result.mode,
        },
      });
    } catch (error) {
      logger.error('Mode switch failed:', error);
      showToast(copy.switchError, 'error');
    } finally {
      onSwitchingModeChange?.(null);
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
            aria-label={t.common.close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: `${headerHeight}px`,
              left: 0,
              right: 0,
              zIndex: 40,
              maxHeight: `calc(100vh - ${headerHeight}px)`,
              overflowY: 'auto',
            }}
            id="header-account-panel"
            className="w-full border-b border-gray-100 bg-white shadow-lg shadow-gray-200/50 dark:border-white/5 dark:bg-[#0f0e17] dark:shadow-2xl dark:shadow-black/40"
            data-account-panel
          >
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
              <div className="mb-4 flex items-start justify-between md:hidden">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-500 dark:text-purple-300">
                    {copy.sectionLabel}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{displayName}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1.2fr_0.95fr] lg:gap-6">
                <section className="rounded-3xl border border-gray-100 bg-[#fcfbff] p-5 shadow-sm dark:border-white/8 dark:bg-[#171421]">
                  <div className="flex items-start gap-4">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white dark:ring-white/10"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-semibold text-white ring-1 ring-white dark:ring-white/10"
                        style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
                      >
                        {getInitials(displayName)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-500 dark:text-purple-300">
                        {t.nav.profile}
                      </div>
                      <h2 className="mt-2 truncate text-lg font-semibold text-gray-900 dark:text-white">{displayName}</h2>
                      <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                        {profile?.username ? `@${profile.username}` : user.email}
                      </p>
                      {identityLine ? (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                          {profile?.location ? (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              {profile.location}
                            </span>
                          ) : null}
                          {memberSince ? (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarClock className="h-4 w-4" />
                              {memberSince}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {isVerified ? (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {t.common.verified}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    to={profilePath}
                    onClick={onClose}
                    className="mt-5 inline-flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-all hover:border-purple-200 hover:bg-purple-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-purple-500/30 dark:hover:bg-white/10"
                  >
                    <span>{t.publicProfile.editProfile}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </Link>
                </section>

                <section className="rounded-3xl border border-gray-100 bg-[#fcfbff] p-5 shadow-sm dark:border-white/8 dark:bg-[#171421]">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-500">
                    {copy.sectionLabel}
                  </div>

                  <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', activeWorkspacePill)}>
                          {activeMode === 'freelancer' ? copy.freelancerLabel : copy.clientLabel}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {currentTarget.isOnboarded ? copy.ready : copy.needsSetup}
                        </span>
                      </div>
                      <Link
                        to={setupActionTo}
                        onClick={onClose}
                        className="inline-flex min-h-[40px] items-center justify-center rounded-2xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-500 hover:shadow-xl hover:shadow-purple-500/30"
                      >
                        {setupActionLabel}
                      </Link>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {activeMode === 'freelancer' ? copy.freelancerHint : copy.clientHint}
                    </p>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
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
                  </div>

                  <div className="mt-5 text-sm font-semibold text-gray-900 dark:text-white">{copy.switchWorkspace}</div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {workspaceCards.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeMode === item.mode;
                      const isAvailable = availableModes.includes(item.mode);
                      const isSwitchingThis = switchingMode === item.mode;
                      const accentClasses =
                        item.accent === 'purple'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                          : 'border-amber-500 bg-amber-50 dark:bg-amber-950/30';
                      const iconClasses =
                        item.accent === 'purple'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
                      const actionLabel = isActive ? copy.current : isAvailable ? copy.switchAction : copy.enable;

                      return (
                        <button
                          key={item.mode}
                          type="button"
                          onClick={() => void handleSwitchMode(item.mode)}
                          disabled={Boolean(switchingMode) || isActive}
                          className={cn(
                            'rounded-3xl border p-4 text-left transition-all duration-200',
                            'border-gray-200 bg-white hover:border-purple-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-purple-500/40',
                            isActive && accentClasses,
                            isActive && 'cursor-default'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl', iconClasses)}>
                              {isSwitchingThis ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-base font-semibold text-gray-900 dark:text-white">{item.title}</div>
                                <span
                                  className={cn(
                                    'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                    isActive
                                      ? activeWorkspacePill
                                      : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                                  )}
                                >
                                  {isSwitchingThis ? copy.switching : actionLabel}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</p>
                              <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-500">{item.meta}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-500">
                    {profile?.user_type === 'both' ? copy.switchWorkspaceBoth : copy.switchWorkspaceSingle}
                  </p>
                </section>

                <section className="rounded-3xl border border-gray-100 bg-[#fcfbff] p-5 shadow-sm dark:border-white/8 dark:bg-[#171421]">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-500">
                    {copy.tools}
                  </div>

                  <div className="mt-4 space-y-3">
                    <ActionLink
                      to={settingsPath}
                      onClick={onClose}
                      icon={<Settings className="h-4 w-4" />}
                      label={t.nav.settings}
                    />
                    <ActionLink
                      to="/settings?tab=notifications"
                      onClick={onClose}
                      icon={<Bell className="h-4 w-4" />}
                      label={t.settings.notifications}
                    />
                    <ActionLink
                      to={walletPath}
                      onClick={onClose}
                      icon={<Wallet className="h-4 w-4" />}
                      label={activeMode === 'freelancer' ? 'Wallet & earnings' : t.settings.payment}
                    />
                    <ActionLink
                      to={verificationPath}
                      onClick={onClose}
                      icon={<ShieldCheck className="h-4 w-4" />}
                      label={t.settings.cinVerification}
                    />
                  </div>

                  <div className="my-4 h-px bg-gray-200 dark:bg-white/10" />

                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15"
                  >
                    {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    {copy.logoutAction}
                  </button>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-500">{copy.logoutDesc}</p>
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
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-all hover:border-purple-200 hover:bg-purple-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-purple-500/30 dark:hover:bg-white/10"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
          {icon}
        </span>
        <span>{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
    </Link>
  );
}

function formatMemberSince(value: string | undefined, language: string): string | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const locale = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'ar-TN';
  const formatted = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(parsed);

  return `${formatted}`;
}
