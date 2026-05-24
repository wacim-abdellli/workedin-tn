import { useRef, useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2, MessageSquare, ShieldAlert, Sparkles, Wallet, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { useNotifications } from '@/contexts/NotificationsContext';
import type { AppNotification } from '@/hooks/useRealtimeNotifications';
import { getDisplayNotification } from '@/lib/notificationDisplay';

/* ── Role palettes (matches the sidebar's roleTheme) ───────────── */
const PALETTE = {
    primary: 'var(--accent-color)',
    glow: 'var(--accent-color-shadow)',
    dim: 'var(--accent-color-soft)',
    dimStrong: 'color-mix(in srgb, var(--accent-color) 18%, transparent)',
    stripe: 'color-mix(in srgb, var(--accent-color) 70%, transparent)',
    alpha11: 'color-mix(in srgb, var(--accent-color) 11%, transparent)',
    alpha22: 'color-mix(in srgb, var(--accent-color) 22%, transparent)',
    alpha33: 'color-mix(in srgb, var(--accent-color) 33%, transparent)',
    alpha44: 'color-mix(in srgb, var(--accent-color) 44%, transparent)',
} as const;

function iconForType(type: AppNotification['type']) {
    switch (type) {
        case 'message':      return <MessageSquare className="h-[18px] w-[18px]" />;
        case 'proposal':
        case 'new_proposal': return <Sparkles className="h-[18px] w-[18px]" />;
        case 'payment':      return <Wallet className="h-[18px] w-[18px]" />;
        case 'contract':
        case 'contract_update': return <ShieldAlert className="h-[18px] w-[18px]" />;
        default:             return <Bell className="h-[18px] w-[18px]" />;
    }
}

export function NotificationBell({
    className = '',
    workspace = 'client',
    isDark = false,
}: {
    className?: string;
    workspace?: 'client' | 'freelancer';
    isDark?: boolean;
}) {
    const { t, tx, language } = useTranslation();
    const navigate = useNavigate();
    const { notifications, unreadCount, isLoading, markAsRead, markAllRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const pal = PALETTE;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        function handleScroll(event: Event) {
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) return;
            setIsOpen(false);
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [isOpen]);

    const formatTimeAgo = (dateString: string) => {
        const diffMs = Date.now() - new Date(dateString).getTime();
        const mins  = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMs / 3600000);
        const days  = Math.floor(diffMs / 86400000);
        if (mins < 1) return t.jobs?.time?.now || 'Just now';
        const ago    = t.jobs?.time?.ago    || 'ago';
        const minute = t.jobs?.time?.minute || 'min';
        const hour   = t.jobs?.time?.hour   || 'h';
        const day    = t.jobs?.time?.day    || 'd';
        const pfx    = t.jobs?.time?.ago_prefix ? `${t.jobs.time.ago_prefix} ` : '';
        if (mins  < 60) return language === 'en' ? `${mins}${minute} ${ago}`  : `${pfx}${mins} ${minute} ${ago}`;
        if (hours < 24) return language === 'en' ? `${hours}${hour} ${ago}`   : `${pfx}${hours} ${hour} ${ago}`;
        return language === 'en' ? `${days}${day} ${ago}` : `${pfx}${days} ${day} ${ago}`;
    };

    const handleNotificationClick = async (n: AppNotification) => {
        if (!n.is_read) await markAsRead(n.id);
        if (n.link) navigate(n.link);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Bell trigger - Premium Capsule */}
            <button
                onClick={() => setIsOpen(v => !v)}
                className="relative flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0c0c0e] hover:bg-gray-50 dark:hover:bg-[#141414] hover:border-gray-300 dark:hover:border-white/[0.12] shadow-sm transition-all duration-200"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = isDark ? '#ffffff' : 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.65)' : 'var(--color-text-secondary)';
                }}
                aria-label={`${t.notifications?.title || 'Notifications'}${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
                <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
                {unreadCount > 0 && (
                    <span 
                      className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-4.5 rounded-full text-[9px] font-black shadow-md ring-2 ring-white dark:ring-black"
                      style={{ 
                        background: 'var(--workspace-primary)',
                        color: '#ffffff',
                        padding: unreadCount > 9 ? '0 5px' : '0',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* ── Dropdown ──────────────────────────────────────── */}
            <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute ltr:-right-2 ltr:sm:right-0 rtl:-left-2 rtl:sm:left-0 top-full z-[70] mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-[400px] overflow-hidden rounded-2xl"
                    style={{
                        transformOrigin: 'top right',
                        background: isDark 
                          ? 'linear-gradient(145deg, #161616, #111111)'
                          : 'linear-gradient(145deg, var(--color-background-elevated), var(--color-bg-subtle))',
                        border: isDark 
                          ? '1px solid rgba(255,255,255,0.09)'
                          : '1px solid var(--color-border-default)',
                        boxShadow: isDark 
                          ? '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
                          : '0 24px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                    }}
                >
                    {/* Colored top accent stripe */}
                    <div
                        className="h-[3px] w-full"
                        style={{
                            background: `linear-gradient(90deg, transparent 0%, ${pal.stripe} 40%, ${pal.primary} 60%, transparent 100%)`,
                        }}
                    />

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded-lg"
                                style={{ background: pal.dimStrong }}
                            >
                                <Bell className="h-3.5 w-3.5" style={{ color: pal.primary }} />
                            </div>
                            <h3 className="text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                {t.notifications?.title || 'Notifications'}
                            </h3>
                            {unreadCount > 0 && (
                                <span
                                    className="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black"
                                    style={{ background: pal.primary, color: '#fff', minWidth: 20 }}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all"
                                style={{
                                    color: pal.primary,
                                    background: pal.dim,
                                    border: `1px solid ${pal.alpha33}`,
                                }}
                            >
                                <CheckCheck className="h-3 w-3" />
                                {t.notifications?.readAll || 'Mark all read'}
                            </button>
                        )}
                    </div>

                    {/* Divider */}
                    <div 
                      className="mx-4 h-px"
                      style={{ 
                        background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'var(--color-border-subtle)' 
                      }}
                    />

                    {/* Notification list */}
                    <div className="max-h-[60vh] overflow-y-auto px-2 py-2 space-y-0.5">
                        {isLoading ? (
                            <div className="p-10 text-center">
                                <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin" style={{ color: pal.primary }} />
                                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {tx('dashboard.loading', undefined, 'Loading...')}
                                </p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div
                                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                                    style={{ background: pal.dimStrong }}
                                >
                                    <Bell className="h-7 w-7" style={{ color: pal.primary }} />
                                </div>
                                <p className="font-bold text-[15px]" style={{ color: 'var(--color-text-primary)' }}>
                                    {t.notifications?.empty || 'No notifications'}
                                </p>
                                <p className="mt-1 text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {t.notifications?.caughtUp || "You're all caught up"}
                                </p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map(n => {
                                const displayNotif = getDisplayNotification(n, tx);
                                const isUnread = !n.is_read;

                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className="group relative cursor-pointer rounded-xl p-3 transition-all duration-150"
                                        style={{
                                            background: isUnread ? pal.dim : 'transparent',
                                        }}
                                    >
                                        {/* Hover overlay */}
                                        <div
                                            className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                                            style={{
                                                background: isUnread ? pal.dimStrong : 'var(--color-background-subtle)',
                                                border: `1px solid ${pal.alpha22}`,
                                            }}
                                        />

                                        <div className="relative flex items-start gap-3">
                                            {/* Icon badge */}
                                            <div
                                                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                                style={{
                                                    background: isUnread ? pal.dimStrong : 'var(--color-bg-subtle)',
                                                    color: isUnread ? pal.primary : 'var(--color-text-tertiary)',
                                                    border: `1px solid ${isUnread ? pal.alpha44 : 'var(--color-border-default)'}`,
                                                    boxShadow: isUnread ? `0 4px 12px ${pal.glow}` : 'none',
                                                }}
                                            >
                                                {iconForType(n.type)}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p
                                                        className="text-[13px] font-bold leading-snug"
                                                        style={{ color: 'var(--color-text-primary)' }}
                                                    >
                                                        {displayNotif.title}
                                                    </p>
                                                    {isUnread && (
                                                        <span
                                                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                                            style={{
                                                                background: pal.primary,
                                                                boxShadow: `0 0 8px ${pal.glow}`,
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <p
                                                    className="mt-1 text-[12px] leading-[1.45] line-clamp-2"
                                                    style={{ color: 'var(--color-text-secondary)' }}
                                                >
                                                    {displayNotif.body}
                                                </p>
                                                <p
                                                    className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider"
                                                    style={{ color: isUnread ? pal.primary : 'var(--color-text-tertiary)' }}
                                                >
                                                    {formatTimeAgo(n.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <>
                            <div 
                              className="mx-4 h-px"
                              style={{ 
                                background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'var(--color-border-subtle)' 
                              }}
                            />
                            <div className="p-2">
                                <button
                                    onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-bold uppercase tracking-wide transition-all text-[var(--workspace-primary)] hover:bg-[color-mix(in_srgb,var(--workspace-primary)_10%,transparent)]"
                                >
                                    {t.notifications?.viewAll || tx('notifications.viewAll', undefined, 'View all notifications')}
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}

export default NotificationBell;
