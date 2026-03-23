import { logger } from '@/lib/logger';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight, Heart, LayoutDashboard, Loader2, LogOut, MessageSquareText, Plus, Settings, Shield, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { hardLogout, clearAllAuthData } from '@/lib/authUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { getDashboardPath, getOnboardingPath, getProfilePath, isModeOnboarded, promoteUserTypeForMode } from '@/lib/accountMode';
import { useToast } from '@/components/ui/Toast';

type Mode = 'freelancer' | 'client';

export interface UserMenuProps {
    user: SupabaseUser;
    profile: {
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
    signOut: () => Promise<void>;
    t: {
        nav: {
            dashboard: string;
            myJobs: string;
            messages: string;
            profile: string;
            saved: string;
            settings: string;
            logout: string;
        };
    };
}

const copy = {
    en: {
        account: 'Account',
        dual: 'Dual workspace',
        currentWorkspace: 'Current workspace',
        ready: 'Ready',
        setup: 'Needs setup',
        hintFreelancer: 'Complete the essentials once here, then refine the rest later in Settings.',
        hintClient: 'Finish the client basics here first, then manage the full profile later in Settings.',
        completeSetup: 'Complete setup',
        manageProfile: 'Manage profile',
        workspaces: 'Switch workspace',
        workspacesBoth: 'Use the same account to hire and work without creating a second login.',
        workspacesSingle: 'Enable the second workspace here whenever you need it.',
        freelancerDesc: 'Pitch for work, manage delivery, and get paid in TND.',
        clientDesc: 'Post projects, review proposals, and pay through escrow.',
        current: 'Current',
        switch: 'Switch',
        enable: 'Enable',
        switching: 'Switching',
        main: 'Important',
        more: 'More',
        profileFreelancer: 'Portfolio, profile, and trust signals',
        profileClient: 'Company details, trust signals, and billing',
        dashboardDesc: 'Overview, activity, and milestones',
        jobsFreelancer: 'Proposals, contracts, and active work',
        jobsClient: 'Posted jobs, proposals, and hiring',
        messages: 'Project conversations and updates',
        saved: 'Saved jobs and shortlisted talent',
        settings: 'Profile, security, and payout settings',
        admin: 'Admin',
        adminDesc: 'Moderation and platform controls',
        switchedFreelancer: 'Freelancer workspace is now active.',
        switchedClient: 'Client workspace is now active.',
        switchError: 'We could not switch your workspace right now.',
        logoutDesc: 'Sign out safely on this device',
    },
    ar: {
        account: 'الحساب',
        dual: 'مساحتا عمل',
        currentWorkspace: 'المساحة الحالية',
        ready: 'جاهزة',
        setup: 'تحتاج إكمالاً',
        hintFreelancer: 'أكمل أساسيات ملفك هنا أولاً، وبعدها يمكنك تحسين كل شيء لاحقاً من الإعدادات.',
        hintClient: 'أضف بيانات العميل الأساسية هنا أولاً، ثم عد لاحقاً إلى الإعدادات للتفاصيل الكاملة.',
        completeSetup: 'أكمل الإعداد',
        manageProfile: 'إدارة الملف',
        workspaces: 'تبديل مساحة العمل',
        workspacesBoth: 'استعمل نفس الحساب للعمل كمستقل أو كعميل بدون تسجيل جديد.',
        workspacesSingle: 'فعّل مساحة العمل الثانية من هنا متى احتجتها.',
        freelancerDesc: 'اعثر على العمل، أرسل العروض، وتابع التنفيذ حتى الدفع.',
        clientDesc: 'انشر المشاريع، راجع العروض، وادفع عبر الضمان.',
        current: 'الحالية',
        switch: 'تبديل',
        enable: 'تفعيل',
        switching: 'جارٍ التبديل',
        main: 'الأهم',
        more: 'المزيد',
        profileFreelancer: 'الملف العام، الأعمال السابقة، وإشارات الثقة',
        profileClient: 'بيانات العميل، إشارات الثقة، والفوترة',
        dashboardDesc: 'نظرة عامة على النشاط والمراحل',
        jobsFreelancer: 'العروض، العقود، والأعمال الجارية',
        jobsClient: 'المشاريع المنشورة، العروض، والتوظيف',
        messages: 'محادثات المشاريع والتحديثات',
        saved: 'العناصر والفرص المحفوظة',
        settings: 'الملف، الأمان، والدفع',
        admin: 'الإدارة',
        adminDesc: 'أدوات الإشراف والتحكم بالمنصة',
        switchedFreelancer: 'تم تفعيل مساحة المستقل.',
        switchedClient: 'تم تفعيل مساحة العميل.',
        switchError: 'تعذر تبديل مساحة العمل حالياً.',
        logoutDesc: 'تسجيل خروج آمن من هذا الجهاز',
    },
    fr: {
        account: 'Compte',
        dual: 'Double espace',
        currentWorkspace: 'Espace actuel',
        ready: 'Pret',
        setup: 'A completer',
        hintFreelancer: 'Completez l essentiel ici, puis peaufinez le reste plus tard dans les parametres.',
        hintClient: 'Renseignez les bases du profil client ici, puis ajustez le detail plus tard dans les parametres.',
        completeSetup: 'Completer',
        manageProfile: 'Gerer le profil',
        workspaces: 'Changer d espace',
        workspacesBoth: 'Utilisez le meme compte pour recruter et travailler en freelance.',
        workspacesSingle: 'Activez le second espace ici quand vous en avez besoin.',
        freelancerDesc: 'Trouvez des missions, envoyez des propositions et suivez la livraison.',
        clientDesc: 'Publiez des projets, comparez les propositions et payez via escrow.',
        current: 'Actif',
        switch: 'Basculer',
        enable: 'Activer',
        switching: 'Changement',
        main: 'Essentiel',
        more: 'Plus',
        profileFreelancer: 'Profil public, portfolio et signaux de confiance',
        profileClient: 'Infos client, confiance et facturation',
        dashboardDesc: "Vue d'ensemble, activite et jalons",
        jobsFreelancer: 'Propositions, contrats et missions en cours',
        jobsClient: 'Projets publies, propositions et recrutements',
        messages: 'Conversations et mises a jour projet',
        saved: 'Offres et talents enregistres',
        settings: 'Profil, securite et paiements',
        admin: 'Admin',
        adminDesc: 'Moderation et controle plateforme',
        switchedFreelancer: 'L espace freelance est actif.',
        switchedClient: 'L espace client est actif.',
        switchError: "Impossible de changer d'espace pour le moment.",
        logoutDesc: 'Deconnexion securisee sur cet appareil',
    },
} as const;

export function UserMenu({ user, profile, signOut, t }: UserMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSwitchingMode, setIsSwitchingMode] = useState<Mode | null>(null);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { activeMode, availableModes, freelancerProfile, switchAccountMode } = useAuth();
    const { language, dir, t: i18n } = useTranslation();
    const { showToast } = useToast();

    const text = copy[language as keyof typeof copy] ?? copy.en;
    const isAdmin = profile?.is_admin === true;
    const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
    const dashboardPath = getDashboardPath(activeMode);
    const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Khedma User';
    const avatarUrl = !avatarFailed ? profile?.avatar_url || user.user_metadata?.avatar_url || null : null;
    const [avatarFrom, avatarTo] = getAvatarGradient(displayName);
    const activeWorkspaceLabel = activeMode === 'freelancer' ? i18n.auth.freelancer : i18n.auth.client;
    const profileActionTo = activeMode === 'freelancer' ? getProfilePath(profile, activeMode) : '/settings?tab=profile';
    const isOnboarded = isModeOnboarded(profile, freelancerProfile, activeMode);
    const setupChecks = activeMode === 'freelancer'
        ? [Boolean(profile?.full_name), Boolean(profile?.location), Boolean(freelancerProfile?.title), Array.isArray(freelancerProfile?.skills) && freelancerProfile.skills.length > 0]
        : [Boolean(profile?.full_name), Boolean(profile?.location), Boolean(profile?.bio && profile.bio.length > 20)];
    const setupProgress = Math.max(isOnboarded ? 100 : 0, Math.round((setupChecks.filter(Boolean).length / setupChecks.length) * 100));
    const setupActionTo = isOnboarded ? profileActionTo : getOnboardingPath(activeMode);
    const setupActionLabel = isOnboarded ? text.manageProfile : text.completeSetup;
    const activeWorkspacePill = activeMode === 'freelancer'
        ? 'border-violet-500/20 bg-violet-500/12 text-violet-700 dark:text-violet-200'
        : 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200';

    const primaryActions = useMemo(() => ([
        { to: dashboardPath, label: t.nav.dashboard, description: text.dashboardDesc, icon: LayoutDashboard },
        { to: profileActionTo, label: t.nav.profile, description: activeMode === 'freelancer' ? text.profileFreelancer : text.profileClient, icon: User },
        { to: '/messages', label: t.nav.messages, description: text.messages, icon: MessageSquareText },
        { to: '/settings', label: t.nav.settings, description: text.settings, icon: Settings },
    ]), [activeMode, dashboardPath, profileActionTo, t.nav.dashboard, t.nav.messages, t.nav.profile, t.nav.settings, text.dashboardDesc, text.messages, text.profileClient, text.profileFreelancer, text.settings]);

    const secondaryActions = useMemo(() => {
        const base = [
            { to: '/my-jobs', label: t.nav.myJobs, description: activeMode === 'freelancer' ? text.jobsFreelancer : text.jobsClient, icon: BriefcaseBusiness },
            { to: '/saved', label: t.nav.saved, description: text.saved, icon: Heart },
        ];
        return isAdmin ? [...base, { to: '/admin', label: text.admin, description: text.adminDesc, icon: Shield }] : base;
    }, [activeMode, isAdmin, t.nav.myJobs, t.nav.saved, text.admin, text.adminDesc, text.jobsClient, text.jobsFreelancer, text.saved]);

    const workspaces = [
        { mode: 'freelancer' as const, title: i18n.auth.freelancer, description: activeMode === 'freelancer' ? text.hintFreelancer : text.freelancerDesc, icon: User, accent: 'violet' as const },
        { mode: 'client' as const, title: i18n.auth.client, description: activeMode === 'client' ? text.hintClient : text.clientDesc, icon: BriefcaseBusiness, accent: 'emerald' as const },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
        };
        if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        if (menuOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [menuOpen]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setMenuOpen(false);
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
            const nextMode = await switchAccountMode(mode);
            const nextType = promoteUserTypeForMode(profile?.user_type, nextMode);
            const nextProfile = profile ? { ...profile, user_type: nextType, active_mode: nextMode } : { user_type: nextType, active_mode: nextMode };
            const nextPath = isModeOnboarded(nextProfile, freelancerProfile, nextMode) ? getDashboardPath(nextMode) : getOnboardingPath(nextMode);
            setMenuOpen(false);
            showToast(nextMode === 'freelancer' ? text.switchedFreelancer : text.switchedClient, 'success');
            navigate(nextPath);
        } catch (error) {
            logger.error('Mode switch failed:', error);
            showToast(text.switchError, 'error');
        } finally {
            setIsSwitchingMode(null);
        }
    };

    return (
        <>
            <button className="relative rounded-2xl border border-transparent bg-transparent p-2.5 transition-all hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/5" aria-label="Notifications">
                <Bell className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f0e17]" />
            </button>

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen((open) => !open)}
                    className={cn('group flex items-center gap-3 rounded-[22px] border px-2.5 py-2 transition-all duration-200', menuOpen ? 'border-violet-400/35 bg-white/90 shadow-lg shadow-violet-500/10 dark:border-violet-500/30 dark:bg-white/10' : 'border-transparent hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/5')}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-500/55" onError={() => setAvatarFailed(true)} />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-violet-500/50" style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}>{getInitials(displayName)}</div>
                    )}
                    <div className="hidden min-w-0 text-left xl:block">
                        <div className="truncate text-sm font-semibold text-[#171420] dark:text-white">{displayName}</div>
                        <span className={cn('mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', activeWorkspacePill)}>{activeWorkspaceLabel}</span>
                    </div>
                    <ChevronDown className={cn('hidden h-4 w-4 text-[#7a748f] transition-transform xl:block dark:text-[#a39db7]', menuOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -12, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.96 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="premium-panel absolute right-0 z-[70] mt-3 max-h-[min(85vh,760px)] w-[420px] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-[30px] border border-slate-200/70 shadow-[0_28px_70px_rgba(15,23,42,0.18)] dark:border-white/10 dark:shadow-[0_32px_90px_rgba(0,0,0,0.48)]"
                            role="menu"
                            dir={dir}
                        >
                            <div className="border-b border-slate-200/70 p-4 dark:border-white/8">
                                <div className="rounded-[26px] border border-white/60 bg-white/78 p-4 shadow-sm dark:border-white/10 dark:bg-[#171421]/92">
                                    <div className="flex items-start gap-3">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={displayName} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/70 dark:ring-white/10" onError={() => setAvatarFailed(true)} />
                                        ) : (
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-semibold text-white ring-2 ring-white/70 dark:ring-white/10" style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}>{getInitials(displayName)}</div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">{text.account}</span>
                                                {profile?.user_type === 'both' ? <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-200">{text.dual}</span> : null}
                                            </div>
                                            <h3 className="mt-2 truncate text-lg font-semibold tracking-[-0.02em] text-[#171420] dark:text-white">{displayName}</h3>
                                            <p className="truncate text-sm text-[#67627c] dark:text-[#a6a0b9]">{user.email}</p>
                                            {profile?.username ? (
                                                <span className="mt-3 inline-flex rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-[#5d586f] dark:border-white/10 dark:bg-white/5 dark:text-[#bab4cb]">
                                                    @{profile.username}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3">
                                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/85 px-3.5 py-3 dark:border-white/8 dark:bg-white/[0.04]">
                                            <div>
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7f7893] dark:text-[#938da7]">{text.currentWorkspace}</div>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', activeWorkspacePill)}>{activeWorkspaceLabel}</span>
                                                    <span className="text-sm font-medium text-[#3c3750] dark:text-[#d9d2eb]">{isOnboarded ? text.ready : text.setup}</span>
                                                </div>
                                            </div>
                                            <Link to={setupActionTo} onClick={() => setMenuOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30">
                                                {setupActionLabel}
                                            </Link>
                                        </div>

                                        <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-3.5 dark:border-white/8 dark:bg-white/[0.04]">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-semibold text-[#171420] dark:text-white">{activeWorkspaceLabel}</p>
                                                <span className="text-sm font-semibold text-[#645d79] dark:text-[#d7d0ea]">{setupProgress}%</span>
                                            </div>
                                            <p className="mt-2 text-xs leading-relaxed text-[#6f6984] dark:text-[#a39db7]">{activeMode === 'freelancer' ? text.hintFreelancer : text.hintClient}</p>
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/8">
                                                <div className={cn('h-full rounded-full transition-all duration-300', activeMode === 'freelancer' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400')} style={{ width: `${setupProgress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-slate-200/70 p-4 dark:border-white/8">
                                <div className="mb-3">
                                    <h4 className="text-sm font-semibold text-[#171420] dark:text-white">{text.workspaces}</h4>
                                    <p className="mt-1 text-xs leading-relaxed text-[#6f6984] dark:text-[#9d97af]">{profile?.user_type === 'both' ? text.workspacesBoth : text.workspacesSingle}</p>
                                </div>
                                <div className="space-y-2.5">
                                    {workspaces.map((item) => {
                                        const isActive = activeMode === item.mode;
                                        const isAvailable = availableModes.includes(item.mode);
                                        const label = isActive ? text.current : isAvailable ? text.switch : text.enable;
                                        const accentClasses = item.accent === 'violet'
                                            ? { active: 'border-violet-500/35 bg-violet-500/10 shadow-[0_18px_40px_rgba(124,58,237,0.18)]', icon: 'bg-violet-500/14 text-violet-600 dark:text-violet-200', chip: 'border-violet-400/20 bg-violet-500/12 text-violet-700 dark:text-violet-200' }
                                            : { active: 'border-emerald-500/35 bg-emerald-500/10 shadow-[0_18px_40px_rgba(16,185,129,0.18)]', icon: 'bg-emerald-500/14 text-emerald-600 dark:text-emerald-200', chip: 'border-emerald-400/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200' };

                                        return (
                                            <button
                                                key={item.mode}
                                                type="button"
                                                onClick={() => void handleSwitchMode(item.mode)}
                                                disabled={isActive || isSwitchingMode !== null}
                                                aria-label={`${label} ${item.title}`}
                                                className={cn('w-full rounded-[24px] border p-4 text-left transition-all duration-200', 'border-slate-200/80 bg-white/78 hover:-translate-y-0.5 hover:border-violet-300/40 dark:border-white/8 dark:bg-white/[0.04] dark:hover:border-white/15', isActive && accentClasses.active, isActive && 'cursor-default')}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl', accentClasses.icon)}>
                                                        <item.icon className="h-[18px] w-[18px]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="text-sm font-semibold text-[#171420] dark:text-white">{item.title}</div>
                                                            <span className={cn('inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', accentClasses.chip)}>
                                                                {isSwitchingMode === item.mode ? <><Loader2 className="h-3 w-3 animate-spin" />{text.switching}</> : !isActive && !isAvailable ? <><Plus className="h-3 w-3" />{label}</> : label}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-xs leading-relaxed text-[#6f6984] dark:text-[#9d97af]">{item.description}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a849d] dark:text-[#9d97af]">{text.main}</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {primaryActions.map((item) => (
                                        <ActionTile key={item.to} to={item.to} icon={item.icon} label={item.label} description={item.description} onClick={() => setMenuOpen(false)} />
                                    ))}
                                </div>
                                <div className="mt-4 px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a849d] dark:text-[#9d97af]">{text.more}</div>
                                <div className="space-y-1">
                                    {secondaryActions.map((item) => (
                                        <ActionRow key={item.to} to={item.to} icon={item.icon} label={item.label} description={item.description} arrowIcon={ArrowIcon} onClick={() => setMenuOpen(false)} />
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-200/70 p-3 dark:border-white/8">
                                <button disabled={isLoggingOut} onClick={handleLogout} className="flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left transition-all hover:bg-red-50/90 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-500/10" role="menuitem">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/12 text-red-600 dark:text-red-300">{isLoggingOut ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <LogOut className="h-[18px] w-[18px]" />}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-red-700 dark:text-red-300">{isLoggingOut ? i18n.auth.loggingOut : t.nav.logout}</div>
                                        <div className="text-xs text-red-600/80 dark:text-red-200/70">{text.logoutDesc}</div>
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

function ActionTile({ to, icon: Icon, label, description, onClick }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string; description: string; onClick?: () => void; }) {
    return (
        <Link to={to} onClick={onClick} className="group rounded-[22px] border border-slate-200/80 bg-white/82 p-4 transition-all hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-white dark:border-white/8 dark:bg-white/[0.04] dark:hover:border-white/15 dark:hover:bg-white/[0.06]" role="menuitem">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#49445d] transition-colors group-hover:bg-violet-100 group-hover:text-violet-700 dark:bg-white/[0.06] dark:text-[#c1bcd0] dark:group-hover:bg-violet-500/10 dark:group-hover:text-violet-200"><Icon className="h-[18px] w-[18px]" /></div>
            <div className="mt-4">
                <div className="truncate text-sm font-semibold text-[#171420] dark:text-white">{label}</div>
                <div className="mt-1 text-xs leading-relaxed text-[#6f6984] dark:text-[#9d97af]">{description}</div>
            </div>
        </Link>
    );
}

function ActionRow({ to, icon: Icon, label, description, arrowIcon: ArrowIcon, onClick }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string; description: string; arrowIcon: React.ComponentType<{ className?: string }>; onClick?: () => void; }) {
    return (
        <Link to={to} onClick={onClick} className="group flex items-center gap-3 rounded-[20px] px-3 py-3 transition-all hover:bg-violet-50/90 dark:hover:bg-white/[0.05]" role="menuitem">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#49445d] transition-colors group-hover:bg-violet-100 group-hover:text-violet-700 dark:bg-white/[0.06] dark:text-[#c1bcd0] dark:group-hover:bg-violet-500/10 dark:group-hover:text-violet-200"><Icon className="h-[18px] w-[18px]" /></div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#171420] dark:text-white">{label}</div>
                <div className="truncate text-xs text-[#6f6984] dark:text-[#9d97af]">{description}</div>
            </div>
            <ArrowIcon className="h-4 w-4 text-[#9d97af] transition-transform group-hover:translate-x-0.5 dark:text-[#8e88a4]" />
        </Link>
    );
}
