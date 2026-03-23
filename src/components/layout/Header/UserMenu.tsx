import { logger } from '@/lib/logger';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BriefcaseBusiness, ChevronDown, Loader2, LogOut, Plus, Settings, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { hardLogout, clearAllAuthData } from '@/lib/authUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { getModeSetupProgress, getModeTarget, getProfilePath } from '@/lib/accountMode';
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

export interface UserMenuProps {
    user: SupabaseUser;
    profile: HeaderProfile;
    isOpen: boolean;
    onToggle: () => void;
}

export interface UserAccountPanelProps {
    user: SupabaseUser;
    profile: HeaderProfile;
    signOut: () => Promise<void>;
    onClose: () => void;
}

export function UserMenu({ user, profile, isOpen, onToggle }: UserMenuProps) {
    const [avatarFailed, setAvatarFailed] = useState(false);
    const { activeMode } = useAuth();
    const { t } = useTranslation();

    const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Khedma User';
    const avatarUrl = !avatarFailed ? profile?.avatar_url || user.user_metadata?.avatar_url || null : null;
    const [avatarFrom, avatarTo] = getAvatarGradient(displayName);
    const accountCopy = t.auth.accountPanel;
    const activeWorkspaceLabel = activeMode === 'freelancer' ? accountCopy.freelancerLabel : accountCopy.clientLabel;
    const activeWorkspacePill = activeMode === 'freelancer'
        ? 'border-violet-500/20 bg-violet-500/12 text-violet-700 dark:text-violet-200'
        : 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200';

    return (
        <div data-account-panel className="flex items-center gap-2">
            <button
                className="relative rounded-2xl border border-transparent bg-transparent p-2.5 transition-all hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f0e17]" />
            </button>

            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    'group flex items-center gap-3 rounded-[22px] border px-2.5 py-2 transition-all duration-200',
                    isOpen
                        ? 'border-violet-400/35 bg-white/90 shadow-lg shadow-violet-500/10 dark:border-violet-500/30 dark:bg-white/10'
                        : 'border-transparent hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                )}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-controls="header-account-panel"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-500/55"
                        onError={() => setAvatarFailed(true)}
                    />
                ) : (
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-violet-500/50"
                        style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
                    >
                        {getInitials(displayName)}
                    </div>
                )}
                <div className="hidden min-w-0 text-left xl:block">
                    <div className="truncate text-sm font-semibold text-[#171420] dark:text-white">{displayName}</div>
                    <span className={cn('mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', activeWorkspacePill)}>
                        {activeWorkspaceLabel}
                    </span>
                </div>
                <ChevronDown
                    className={cn(
                        'hidden h-4 w-4 text-[#7a748f] transition-transform xl:block dark:text-[#a39db7]',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>
        </div>
    );
}

export function UserAccountPanel({ profile, signOut, onClose }: UserAccountPanelProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSwitchingMode, setIsSwitchingMode] = useState<Mode | null>(null);
    const navigate = useNavigate();
    const { activeMode, availableModes, freelancerProfile, switchAccountMode } = useAuth();
    const { t } = useTranslation();
    const { showToast } = useToast();

    const copy = t.auth.accountPanel;
    const activeWorkspaceLabel = activeMode === 'freelancer' ? copy.freelancerLabel : copy.clientLabel;
    const profileActionTo = activeMode === 'freelancer' ? getProfilePath(profile, activeMode) : '/settings?tab=profile';
    const { isOnboarded, path: setupTargetPath } = getModeTarget(profile, freelancerProfile, activeMode);
    const setupProgress = getModeSetupProgress(profile, freelancerProfile, activeMode);
    const setupActionTo = isOnboarded ? profileActionTo : setupTargetPath;
    const setupActionLabel = isOnboarded ? copy.manageProfile : copy.completeSetup;
    const activeWorkspacePill = activeMode === 'freelancer'
        ? 'border-violet-500/20 bg-violet-500/12 text-violet-700 dark:text-violet-200'
        : 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200';
    const currentWorkspaceTone = activeMode === 'freelancer'
        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-400'
        : 'bg-gradient-to-r from-emerald-500 to-teal-400';

    const workspaceCards = useMemo(() => ([
        {
            mode: 'freelancer' as const,
            title: copy.freelancerLabel,
            description: copy.freelancerDesc,
            tone: {
                surface: 'border-violet-300/30 bg-violet-500/[0.07] dark:border-violet-500/20 dark:bg-violet-500/[0.08]',
                icon: 'bg-violet-500/14 text-violet-700 dark:text-violet-200',
                chip: 'border-violet-400/20 bg-violet-500/12 text-violet-700 dark:text-violet-200',
            },
        },
        {
            mode: 'client' as const,
            title: copy.clientLabel,
            description: copy.clientDesc,
            tone: {
                surface: 'border-emerald-300/30 bg-emerald-500/[0.07] dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]',
                icon: 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-200',
                chip: 'border-emerald-400/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200',
            },
        },
    ]), [copy.clientDesc, copy.clientLabel, copy.freelancerDesc, copy.freelancerLabel]);

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

    return (
        <AnimatePresence initial={false}>
            <motion.div
                id="header-account-panel"
                key="header-account-panel"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="premium-panel w-full max-w-[430px] rounded-[30px] border border-slate-200/70 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] dark:border-white/10 dark:shadow-[0_32px_90px_rgba(0,0,0,0.46)]"
                role="dialog"
                aria-label={copy.sectionLabel}
                data-account-panel
            >
                <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-[#171421]/92">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
                                {copy.sectionLabel}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', activeWorkspacePill)}>
                                    {activeWorkspaceLabel}
                                </span>
                                <span className="text-sm font-medium text-[#3c3750] dark:text-[#d9d2eb]">
                                    {isOnboarded ? copy.ready : copy.needsSetup}
                                </span>
                            </div>
                        </div>
                        <Link
                            to={setupActionTo}
                            onClick={onClose}
                            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30"
                        >
                            {setupActionLabel}
                        </Link>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#6f6984] dark:text-[#a39db7]">
                        {activeMode === 'freelancer' ? copy.freelancerHint : copy.clientHint}
                    </p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/8">
                        <div className={cn('h-full rounded-full transition-all duration-300', currentWorkspaceTone)} style={{ width: `${setupProgress}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-xs font-medium text-[#746e88] dark:text-[#a39db7]">
                        <span>{copy.progressLabel}</span>
                        <span>{setupProgress}%</span>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-[#171420] dark:text-white">{copy.switchWorkspace}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#6f6984] dark:text-[#9d97af]">
                            {profile?.user_type === 'both' ? copy.switchWorkspaceBoth : copy.switchWorkspaceSingle}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
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
                                        'group rounded-[24px] border p-4 text-left transition-all duration-200',
                                        'border-slate-200/80 bg-white/78',
                                        !isActive && 'hover:-translate-y-0.5 hover:border-violet-300/40 hover:shadow-sm dark:hover:border-white/15',
                                        'dark:border-white/8 dark:bg-white/[0.04]',
                                        isActive && item.tone.surface,
                                        isActive && 'cursor-default'
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105', item.tone.icon)}>
                                            {item.mode === 'freelancer' ? <User className="h-5 w-5" /> : <BriefcaseBusiness className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm font-bold text-[#171420] dark:text-white">{item.title}</div>
                                                {isActive && (
                                                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]', item.tone.chip)}>
                                                        {actionLabel}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs leading-relaxed text-[#6f6984] dark:text-[#9d97af]">{item.description}</p>
                                            
                                            {!isActive && (
                                                <div className="mt-3">
                                                    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors', item.tone.chip)}>
                                                        {isSwitchingMode === item.mode ? (
                                                            <>
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                {copy.switching}
                                                            </>
                                                        ) : !isAvailable ? (
                                                            <>
                                                                <Plus className="h-3.5 w-3.5" />
                                                                {actionLabel}
                                                            </>
                                                        ) : (
                                                            actionLabel
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-white/75 p-3 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
                    <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a849d] dark:text-[#9d97af]">
                        {copy.tools}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <PanelLink to={profileActionTo} onClick={onClose} icon={<User className="h-[18px] w-[18px]" />} label={copy.profileAction} />
                        <PanelLink to="/settings" onClick={onClose} icon={<Settings className="h-[18px] w-[18px]" />} label={copy.settingsAction} />
                        
                        <div className="my-1 border-t border-slate-200/60 dark:border-white/10" />
                        
                        <button
                            type="button"
                            onClick={() => void handleLogout()}
                            disabled={isLoggingOut}
                            className="group flex min-h-[44px] items-center justify-start gap-3 rounded-2xl border border-transparent bg-transparent px-4 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100/50 text-red-600 transition-colors group-hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:group-hover:bg-red-500/20">
                                {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                            </div>
                            <span>{copy.logoutAction}</span>
                        </button>
                    </div>
                    <p className="mt-3 px-2 text-right text-xs text-[#7b748f] dark:text-[#9d97af]">{copy.logoutDesc}</p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function PanelLink({
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
            className="group flex min-h-[44px] items-center justify-start gap-3 rounded-2xl border border-transparent bg-transparent px-4 text-sm font-semibold text-[#171420] transition-all hover:bg-violet-50/80 dark:text-white dark:hover:bg-white/[0.06]"
        >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100/80 text-[#5a546d] transition-colors group-hover:bg-violet-100 group-hover:text-violet-700 dark:bg-white/10 dark:text-[#a39db7] dark:group-hover:bg-violet-500/20 dark:group-hover:text-violet-300">
                {icon}
            </div>
            <span>{label}</span>
        </Link>
    );
}
