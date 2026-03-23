import { logger } from '@/lib/logger';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    BriefcaseBusiness,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Heart,
    LayoutDashboard,
    LogOut,
    MessageSquareText,
    Plus,
    Settings,
    Shield,
    User,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { hardLogout, clearAllAuthData } from '@/lib/authUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { getDashboardPath, getOnboardingPath, isModeOnboarded, promoteUserTypeForMode } from '@/lib/accountMode';

export interface UserMenuProps {
    user: SupabaseUser;
    profile: {
        full_name?: string;
        avatar_url?: string;
        user_type?: 'freelancer' | 'client' | 'both' | null;
        id?: string;
        username?: string;
        is_admin?: boolean;
    } | null;
    signOut: () => Promise<void>;
    t: {
        nav: {
            dashboard: string;
            myJobs: string;
            messages: string;
            saved: string;
            settings: string;
            logout: string;
        };
    };
}

const menuCopy = {
    en: {
        account: 'Account',
        dualRole: '2 workspaces',
        workspaces: 'Workspaces',
        workspacesBothHint: 'Switch roles without leaving this account.',
        workspacesSingleHint: 'Add the other workspace on this account when you need it.',
        freelancerDescription: 'Find work, send proposals, and track delivery.',
        clientDescription: 'Post projects, review proposals, and pay through escrow.',
        current: 'Current',
        switch: 'Switch',
        enable: 'Enable',
        quickAccess: 'Quick access',
        dashboardDescription: 'Overview, activity, and milestones',
        myJobsFreelancerDescription: 'Proposals, contracts, and active work',
        myJobsClientDescription: 'Posted jobs, proposals, and hiring',
        messagesDescription: 'Project conversations and updates',
        savedDescription: 'Saved jobs and shortlisted talent',
        settingsDescription: 'Profile, security, and payout settings',
        admin: 'Admin',
        adminDescription: 'Moderation and platform controls',
        logoutDescription: 'Sign out safely on this device',
    },
    ar: {
        account: 'الحساب',
        dualRole: 'مساحتا عمل',
        workspaces: 'مساحات العمل',
        workspacesBothHint: 'بدّل بين المستقل والعميل بدون مغادرة نفس الحساب.',
        workspacesSingleHint: 'يمكنك إضافة مساحة العمل الأخرى إلى نفس الحساب في أي وقت.',
        freelancerDescription: 'اعرض خدماتك، أرسل عروضك، وتابع التنفيذ.',
        clientDescription: 'انشر المشاريع، راجع العروض، وادفع عبر الضمان.',
        current: 'الحالي',
        switch: 'تبديل',
        enable: 'تفعيل',
        quickAccess: 'وصول سريع',
        dashboardDescription: 'نظرة عامة على النشاط والأرباح',
        myJobsFreelancerDescription: 'العروض، العقود، والأعمال النشطة',
        myJobsClientDescription: 'المشاريع المنشورة، العروض، والتوظيف',
        messagesDescription: 'محادثات المشاريع والتحديثات',
        savedDescription: 'الوظائف والعناصر المحفوظة',
        settingsDescription: 'الملف، الأمان، وإعدادات الدفع',
        admin: 'الإدارة',
        adminDescription: 'التحكم والإشراف على المنصة',
        logoutDescription: 'تسجيل خروج آمن من هذا الجهاز',
    },
    fr: {
        account: 'Compte',
        dualRole: '2 espaces',
        workspaces: 'Espaces de travail',
        workspacesBothHint: 'Passez du mode freelance au mode client sans quitter ce compte.',
        workspacesSingleHint: "Ajoutez l'autre espace a ce meme compte quand vous en avez besoin.",
        freelancerDescription: 'Trouvez des missions, envoyez des propositions et suivez la livraison.',
        clientDescription: 'Publiez des projets, comparez les propositions et payez via escrow.',
        current: 'Actif',
        switch: 'Basculer',
        enable: 'Activer',
        quickAccess: 'Acces rapide',
        dashboardDescription: "Vue d'ensemble, activite et gains",
        myJobsFreelancerDescription: 'Propositions, contrats et missions en cours',
        myJobsClientDescription: 'Projets publies, propositions et recrutements',
        messagesDescription: 'Conversations et mises a jour projet',
        savedDescription: 'Offres et talents enregistres',
        settingsDescription: 'Profil, securite et paiements',
        admin: 'Admin',
        adminDescription: 'Moderation et controles plateforme',
        logoutDescription: 'Deconnexion securisee sur cet appareil',
    },
} as const;

export function UserMenu({ user, profile, signOut, t }: UserMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { activeMode, availableModes, freelancerProfile, switchAccountMode } = useAuth();
    const { language, dir, t: i18n } = useTranslation();

    const copy = menuCopy[language];
    const isAdmin = profile?.is_admin === true;
    const dashboardPath = getDashboardPath(activeMode);
    const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
    const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Khedma User';
    const avatarUrl = !avatarFailed ? profile?.avatar_url || user.user_metadata?.avatar_url || null : null;
    const [avatarFrom, avatarTo] = getAvatarGradient(displayName);
    const workspacePillClass =
        activeMode === 'freelancer'
            ? 'border-violet-500/25 bg-violet-500/12 text-violet-200 dark:text-violet-200'
            : 'border-emerald-500/25 bg-emerald-500/12 text-emerald-200 dark:text-emerald-200';

    const quickLinks = useMemo(
        () => [
            {
                to: dashboardPath,
                label: t.nav.dashboard,
                description: copy.dashboardDescription,
                icon: LayoutDashboard,
            },
            {
                to: '/my-jobs',
                label: t.nav.myJobs,
                description:
                    activeMode === 'freelancer'
                        ? copy.myJobsFreelancerDescription
                        : copy.myJobsClientDescription,
                icon: BriefcaseBusiness,
            },
            {
                to: '/messages',
                label: t.nav.messages,
                description: copy.messagesDescription,
                icon: MessageSquareText,
            },
            {
                to: '/saved',
                label: t.nav.saved,
                description: copy.savedDescription,
                icon: Heart,
            },
            {
                to: '/settings',
                label: t.nav.settings,
                description: copy.settingsDescription,
                icon: Settings,
            },
        ],
        [activeMode, copy.dashboardDescription, copy.messagesDescription, copy.myJobsClientDescription, copy.myJobsFreelancerDescription, copy.savedDescription, copy.settingsDescription, dashboardPath, t.nav.dashboard, t.nav.messages, t.nav.myJobs, t.nav.saved, t.nav.settings]
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [menuOpen]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setMenuOpen(false);

        try {
            clearAllAuthData();
            await Promise.race([
                signOut(),
                new Promise((resolve) => setTimeout(resolve, 2000)),
            ]);
        } catch (error) {
            logger.error('Logout error:', error);
        }

        hardLogout('/login');
    };

    const handleSwitchMode = async (mode: 'freelancer' | 'client') => {
        if (activeMode === mode) {
            setMenuOpen(false);
            return;
        }

        try {
            await switchAccountMode(mode);

            const nextUserType = promoteUserTypeForMode(profile?.user_type, mode);
            const nextProfile = profile ? { ...profile, user_type: nextUserType } : null;
            const nextPath = isModeOnboarded(nextProfile, freelancerProfile, mode)
                ? getDashboardPath(mode)
                : getOnboardingPath(mode);

            setMenuOpen(false);
            navigate(nextPath);
        } catch (error) {
            logger.error('Mode switch failed:', error);
        }
    };

    const workspaceCards = [
        {
            mode: 'freelancer' as const,
            title: i18n.auth.freelancer,
            description: copy.freelancerDescription,
            icon: User,
            activeClasses:
                'border-violet-500/35 bg-violet-500/12 shadow-[0_18px_40px_rgba(124,58,237,0.18)]',
            iconClasses: 'bg-violet-500/16 text-violet-200',
            labelClasses: 'border-violet-400/25 bg-violet-500/14 text-violet-200',
        },
        {
            mode: 'client' as const,
            title: i18n.auth.client,
            description: copy.clientDescription,
            icon: BriefcaseBusiness,
            activeClasses:
                'border-emerald-500/35 bg-emerald-500/12 shadow-[0_18px_40px_rgba(16,185,129,0.18)]',
            iconClasses: 'bg-emerald-500/16 text-emerald-200',
            labelClasses: 'border-emerald-400/25 bg-emerald-500/14 text-emerald-200',
        },
    ];

    return (
        <>
            <button
                className="relative rounded-xl p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f0e17]" />
            </button>

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen((open) => !open)}
                    className={cn(
                        'flex items-center gap-2 rounded-2xl border px-2.5 py-2 transition-all duration-200',
                        menuOpen
                            ? 'border-violet-400/35 bg-white/90 shadow-lg shadow-violet-500/10 dark:border-violet-500/30 dark:bg-white/10'
                            : 'border-transparent hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-violet-500/60"
                            onError={() => setAvatarFailed(true)}
                        />
                    ) : (
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-violet-500/50"
                            style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
                        >
                            {getInitials(displayName)}
                        </div>
                    )}
                    <div className="hidden min-w-0 text-left xl:block">
                        <div className="truncate text-sm font-semibold text-[#171420] dark:text-white">
                            {displayName}
                        </div>
                        <div className="truncate text-xs text-[#7a748f] dark:text-[#a39db7]">
                            {activeMode === 'freelancer' ? i18n.auth.freelancer : i18n.auth.client}
                        </div>
                    </div>
                    <ChevronDown
                        className={cn(
                            'hidden h-4 w-4 text-[#7a748f] transition-transform xl:block dark:text-[#a39db7]',
                            menuOpen && 'rotate-180'
                        )}
                    />
                </button>

                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -12, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.96 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="absolute right-0 z-[70] mt-3 w-[380px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#151320]/95 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
                            role="menu"
                            dir={dir}
                        >
                            <div className="border-b border-slate-200/70 p-4 dark:border-white/8">
                                <div className="rounded-[24px] border border-white/60 bg-gradient-to-br from-violet-500/12 via-white to-amber-400/8 p-4 shadow-sm dark:border-white/8 dark:from-violet-500/12 dark:via-white/5 dark:to-amber-400/10">
                                    <div className="flex items-start gap-3">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={displayName}
                                                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/70 dark:ring-white/10"
                                                onError={() => setAvatarFailed(true)}
                                            />
                                        ) : (
                                            <div
                                                className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-semibold text-white ring-2 ring-white/70 dark:ring-white/10"
                                                style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
                                            >
                                                {getInitials(displayName)}
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
                                                    {copy.account}
                                                </span>
                                                {profile?.user_type === 'both' ? (
                                                    <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-200">
                                                        {copy.dualRole}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <h3 className="mt-2 truncate text-lg font-semibold tracking-[-0.02em] text-[#171420] dark:text-white">
                                                {displayName}
                                            </h3>
                                            <p className="truncate text-sm text-[#67627c] dark:text-[#a6a0b9]">
                                                {user.email}
                                            </p>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', workspacePillClass)}>
                                                    {activeMode === 'freelancer' ? i18n.auth.freelancer : i18n.auth.client}
                                                </span>
                                                {profile?.username ? (
                                                    <span className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-[#5d586f] dark:border-white/10 dark:bg-white/5 dark:text-[#bab4cb]">
                                                        @{profile.username}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-slate-200/70 p-4 dark:border-white/8">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-[#171420] dark:text-white">
                                            {copy.workspaces}
                                        </h4>
                                        <p className="mt-1 text-xs leading-relaxed text-[#6f6984] dark:text-[#9d97af]">
                                            {profile?.user_type === 'both' ? copy.workspacesBothHint : copy.workspacesSingleHint}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    {workspaceCards.map((item) => {
                                        const isActive = activeMode === item.mode;
                                        const isAvailable = availableModes.includes(item.mode);
                                        const statusLabel = isActive
                                            ? copy.current
                                            : isAvailable
                                                ? copy.switch
                                                : copy.enable;

                                        return (
                                            <button
                                                key={item.mode}
                                                type="button"
                                                onClick={() => void handleSwitchMode(item.mode)}
                                                disabled={isActive}
                                                className={cn(
                                                    'group rounded-[22px] border p-3 text-left transition-all duration-200',
                                                    'border-slate-200/80 bg-slate-50/80 hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-white',
                                                    'dark:border-white/8 dark:bg-white/[0.04] dark:hover:border-white/15 dark:hover:bg-white/[0.06]',
                                                    isActive && item.activeClasses,
                                                    isActive && 'cursor-default'
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', item.iconClasses)}>
                                                        <item.icon className="h-[18px] w-[18px]" />
                                                    </div>
                                                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', item.labelClasses)}>
                                                        {!isActive && !isAvailable ? <Plus className="h-3 w-3" /> : null}
                                                        {statusLabel}
                                                    </span>
                                                </div>

                                                <div className="mt-3">
                                                    <div className="text-sm font-semibold text-[#171420] dark:text-white">
                                                        {item.title}
                                                    </div>
                                                    <p className="mt-1 text-xs leading-relaxed text-[#6f6984] dark:text-[#9d97af]">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-3">
                                <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a849d] dark:text-[#9d97af]">
                                    {copy.quickAccess}
                                </div>

                                <div className="space-y-1">
                                    {isAdmin ? (
                                        <UserMenuLink
                                            to="/admin"
                                            icon={Shield}
                                            label={copy.admin}
                                            description={copy.adminDescription}
                                            arrowIcon={ArrowIcon}
                                            onClick={() => setMenuOpen(false)}
                                        />
                                    ) : null}

                                    {quickLinks.map((item) => (
                                        <UserMenuLink
                                            key={item.to}
                                            to={item.to}
                                            icon={item.icon}
                                            label={item.label}
                                            description={item.description}
                                            arrowIcon={ArrowIcon}
                                            onClick={() => setMenuOpen(false)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-200/70 p-3 dark:border-white/8">
                                <button
                                    disabled={isLoggingOut}
                                    onClick={handleLogout}
                                    className="flex w-full items-center justify-between rounded-[22px] border border-red-200/70 bg-red-50/90 px-4 py-3 text-left transition-all hover:border-red-300 hover:bg-red-100/80 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/15"
                                    role="menuitem"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/12 text-red-600 dark:text-red-300">
                                            {isLoggingOut ? (
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500" />
                                            ) : (
                                                <LogOut className="h-[18px] w-[18px]" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-red-700 dark:text-red-300">
                                                {isLoggingOut ? i18n.auth.loggingOut : t.nav.logout}
                                            </div>
                                            <div className="text-xs text-red-600/80 dark:text-red-200/70">
                                                {copy.logoutDescription}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowIcon className="h-4 w-4 text-red-500/80" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

interface UserMenuLinkProps {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    arrowIcon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
}

function UserMenuLink({ to, icon: Icon, label, description, arrowIcon: ArrowIcon, onClick }: UserMenuLinkProps) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="group flex items-center gap-3 rounded-[20px] px-3 py-3 transition-all hover:bg-violet-50/90 dark:hover:bg-white/[0.05]"
            role="menuitem"
        >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#49445d] transition-colors group-hover:bg-violet-100 group-hover:text-violet-700 dark:bg-white/[0.06] dark:text-[#c1bcd0] dark:group-hover:bg-violet-500/10 dark:group-hover:text-violet-200">
                <Icon className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#171420] dark:text-white">
                    {label}
                </div>
                <div className="truncate text-xs text-[#6f6984] dark:text-[#9d97af]">
                    {description}
                </div>
            </div>
            <ArrowIcon className="h-4 w-4 text-[#9d97af] transition-transform group-hover:translate-x-0.5 dark:text-[#8e88a4]" />
        </Link>
    );
}
