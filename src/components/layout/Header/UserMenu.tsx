import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, User, LogOut, Settings,
    Briefcase, MessageSquare, Heart, Shield
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { hardLogout, clearAllAuthData } from '@/lib/authUtils';
import { supabase } from '@/lib/supabase';

export interface UserMenuProps {
    user: SupabaseUser;
    profile: {
        full_name?: string;
        avatar_url?: string;
        user_type?: 'freelancer' | 'client' | 'both' | null;
        id?: string;
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

    // Check if user is admin
    const isAdmin = profile?.is_admin || false;

    // ... (existing useEffects)

    // Close menu when clicking outside
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

    // Close menu on Escape key
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
        // ... (existing handleLogout)
        setIsLoggingOut(true);
        setMenuOpen(false);

        try {
            // Step 1: Clear storage immediately (synchronous)
            clearAllAuthData();

            // Step 2: Try calling signOut with timeout
            await Promise.race([
                signOut(),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);
        } catch (error) {
            logger.error('Logout error:', error);
        }

        // Step 3: ALWAYS do hard redirect regardless of success/failure
        hardLogout('/login');
    };

    return (
        <>
            {/* Notification Bell */}
            <button
                className="relative p-2 hover:bg-gray-800/50 rounded-xl transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-gray-900" />
            </button>

            {/* User Menu Dropdown */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2 transition-colors"
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                >
                    <img
                        src={profile?.avatar_url || user.user_metadata?.avatar_url || '/default-avatar.png'}
                        alt={profile?.full_name || user.email || 'User'}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
                    />
                    <span className="hidden 2xl:block font-medium text-gray-900 dark:text-white text-sm">
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
                            className="absolute right-0 mt-2 w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-[60]"
                            role="menu"
                        >
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                    {profile?.full_name || user.email}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                            </div>

                            {/* Upwork-style Mode Switcher */}
                            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-100 dark:bg-gray-800">
                                    <button
                                        type="button"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            logger.log('Switching to freelancer, user.id:', user.id);
                                            try {
                                                const { error } = await supabase
                                                    .from('profiles')
                                                    .update({ user_type: 'freelancer' })
                                                    .eq('id', user.id);
                                                if (error) {
                                                    logger.error('Update error:', error);
                                                    alert('فشل التحديث: ' + error.message);
                                                } else {
                                                    window.location.reload();
                                                }
                                            } catch (err) {
                                                logger.error('Exception:', err);
                                            }
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${profile?.user_type === 'freelancer'
                                            ? 'bg-violet-600 text-white shadow-lg'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <User className="w-3.5 h-3.5" />
                                        مستقل
                                    </button>
                                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                                    <button
                                        type="button"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            logger.log('Switching to client, user.id:', user.id);
                                            try {
                                                const { error } = await supabase
                                                    .from('profiles')
                                                    .update({ user_type: 'client' })
                                                    .eq('id', user.id);
                                                if (error) {
                                                    logger.error('Update error:', error);
                                                    alert('فشل التحديث: ' + error.message);
                                                } else {
                                                    window.location.reload();
                                                }
                                            } catch (err) {
                                                logger.error('Exception:', err);
                                            }
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${profile?.user_type === 'client'
                                            ? 'bg-emerald-600 text-white shadow-lg'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <Briefcase className="w-3.5 h-3.5" />
                                        صاحب عمل
                                    </button>
                                </div>
                            </div>

                            <div className="py-2" role="none">
                                {/* Admin Link */}
                                {isAdmin && (
                                    <>
                                        <UserMenuItem icon={Shield} to="/admin" onClick={() => setMenuOpen(false)}>
                                            لوحة الإدارة
                                        </UserMenuItem>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                    </>
                                )}

                                <UserMenuItem icon={User} to="/dashboard" onClick={() => setMenuOpen(false)}>
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

                            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    disabled={isLoggingOut}
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    role="menuitem"
                                >
                                    {isLoggingOut ? (
                                        <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                                    ) : (
                                        <LogOut className="w-4 h-4" />
                                    )}
                                    <span className="font-medium">
                                        {isLoggingOut ? 'جاري الخروج...' : t.nav.logout}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >
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
            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            role="menuitem"
        >
            <Icon className="w-4 h-4" />
            <span>{children}</span>
        </Link>
    );
}
