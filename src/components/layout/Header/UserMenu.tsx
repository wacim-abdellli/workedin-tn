import { logger } from '@/lib/logger';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    Briefcase,
    Heart,
    LogOut,
    MessageSquare,
    Settings,
    Shield,
    User,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { hardLogout, clearAllAuthData } from '@/lib/authUtils';
import { useAuth } from '@/contexts/AuthContext';
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

export function UserMenu({ user, profile, signOut, t }: UserMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { activeMode, availableModes, freelancerProfile, switchAccountMode } = useAuth();

    const isAdmin = profile?.is_admin === true;
    const dashboardPath = getDashboardPath(activeMode);

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

    return (
        <>
            <button
                className="relative rounded-xl p-2 transition-colors hover:bg-gray-800/50"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-gray-400" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-gray-900" />
            </button>

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                >
                    <img
                        src={profile?.avatar_url || user.user_metadata?.avatar_url || '/default-avatar.png'}
                        alt={profile?.full_name || user.email || 'User'}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-violet-500"
                        onError={(event) => {
                            (event.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
                    />
                    <span className="hidden text-sm font-medium text-gray-900 dark:text-white 2xl:block">
                        {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                </button>

                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 z-[60] mt-2 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-gray-900/95"
                            role="menu"
                        >
                            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                                <p className="truncate font-semibold text-gray-900 dark:text-white">
                                    {profile?.full_name || user.email}
                                </p>
                                <p className="truncate text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            </div>

                            <div className="border-b border-gray-200 p-2 dark:border-gray-700">
                                <div className="flex items-center justify-between rounded-xl bg-gray-100 p-2 dark:bg-gray-800">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                            void handleSwitchMode('freelancer');
                                        }}
                                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                            activeMode === 'freelancer'
                                                ? 'bg-violet-600 text-white shadow-lg'
                                                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        Ù…Ø³ØªÙ‚Ù„
                                        {!availableModes.includes('freelancer') ? <span className="text-[10px] opacity-70">+</span> : null}
                                    </button>
                                    <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                            void handleSwitchMode('client');
                                        }}
                                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                            activeMode === 'client'
                                                ? 'bg-emerald-600 text-white shadow-lg'
                                                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <Briefcase className="h-3.5 w-3.5" />
                                        ØµØ§Ø­Ø¨ Ø¹Ù…Ù„
                                        {!availableModes.includes('client') ? <span className="text-[10px] opacity-70">+</span> : null}
                                    </button>
                                </div>
                                <p className="px-2 pt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                    {profile?.user_type === 'both'
                                        ? 'Ù†ÙØ³ Ø§Ù„Ø­Ø³Ø§Ø¨ØŒ Ù…Ø³Ø§Ø­ØªØ§ Ø¹Ù…Ù„.'
                                        : 'Ø§Ù„ØªØ¨Ø¯ÙŠÙ„ Ø³ÙŠØ¶ÙŠÙ Ø§Ù„Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø£Ø®Ø±Ù‰ Ø¥Ù„Ù‰ Ù†ÙØ³ Ø§Ù„Ø­Ø³Ø§Ø¨.'}
                                </p>
                            </div>

                            <div className="py-2" role="none">
                                {isAdmin ? (
                                    <>
                                        <UserMenuItem icon={Shield} to="/admin" onClick={() => setMenuOpen(false)}>
                                            Ù„ÙˆØ­Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©
                                        </UserMenuItem>
                                        <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                                    </>
                                ) : null}

                                <UserMenuItem icon={User} to={dashboardPath} onClick={() => setMenuOpen(false)}>
                                    {t.nav.dashboard}
                                </UserMenuItem>
                                <UserMenuItem icon={Briefcase} to="/my-jobs" onClick={() => setMenuOpen(false)}>
                                    {t.nav.myJobs}
                                </UserMenuItem>
                                <UserMenuItem icon={MessageSquare} to="/messages" onClick={() => setMenuOpen(false)}>
                                    {t.nav.messages}
                                </UserMenuItem>
                                <UserMenuItem icon={Heart} to="/saved" onClick={() => setMenuOpen(false)}>
                                    {t.nav.saved}
                                </UserMenuItem>
                                <UserMenuItem icon={Settings} to="/settings" onClick={() => setMenuOpen(false)}>
                                    {t.nav.settings}
                                </UserMenuItem>
                            </div>

                            <div className="border-t border-gray-200 p-2 dark:border-gray-700">
                                <button
                                    disabled={isLoggingOut}
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-900/20"
                                    role="menuitem"
                                >
                                    {isLoggingOut ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600/30 border-t-red-600" />
                                    ) : (
                                        <LogOut className="h-4 w-4" />
                                    )}
                                    <span className="font-medium">
                                        {isLoggingOut ? 'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø®Ø±ÙˆØ¬...' : t.nav.logout}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

interface UserMenuItemProps {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    onClick?: () => void;
}

function UserMenuItem({ to, icon: Icon, children, onClick }: UserMenuItemProps) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-2 text-gray-700 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:text-gray-300 dark:hover:bg-violet-900/20 dark:hover:text-violet-400"
            role="menuitem"
        >
            <Icon className="h-4 w-4" />
            <span>{children}</span>
        </Link>
    );
}
