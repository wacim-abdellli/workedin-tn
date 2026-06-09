import { useRef, useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2, MessageSquare, Briefcase, FileText, Wallet, ArrowRight, Play, Award, XCircle, AlertTriangle, Clock, Coins, ShieldCheck, ShieldX, CheckCircle2 } from 'lucide-react';
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

function iconForCategory(category?: AppNotification['category']) {
    switch (category) {
        case 'message':           return <MessageSquare className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'proposal_new':      return <FileText className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'proposal_accepted': return <CheckCircle2 className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'contract_accepted': return <Play className="h-[14px] w-[14px] ltr:translate-x-[0.5px]" strokeWidth={2} />;
        case 'contract_completed':return <Award className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'contract_cancelled':return <XCircle className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'contract_disputed': return <AlertTriangle className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'contract_timeout':  return <Clock className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'payment_released':  return <Wallet className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'payment_funded':    return <Coins className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'system_verified':   return <ShieldCheck className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'system_rejected':   return <ShieldX className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        case 'system_info':       return <Bell className="h-[17px] w-[17px]" strokeWidth={1.75} />;
        default:                  return <Briefcase className="h-[17px] w-[17px]" strokeWidth={1.75} />;
    }
}

function badgeStyleForCategory(category?: AppNotification['category'], isUnread?: boolean) {
    let styles;
    switch (category) {
        // Green/Teal (Success & Payments)
        case 'payment_released':
        case 'payment_funded':
        case 'system_verified':
        case 'contract_completed':
            styles = {
                bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                shadow: '0 4px 10px rgba(16, 185, 129, 0.35)',
            };
            break;

        // Purple/Indigo (Proposals & Actions)
        case 'proposal_new':
        case 'proposal_accepted':
        case 'contract_accepted':
            styles = {
                bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                shadow: '0 4px 10px rgba(139, 92, 246, 0.35)',
            };
            break;

        // Blue (Messages & Updates)
        case 'message':
        case 'contract_update':
            styles = {
                bg: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                shadow: '0 4px 10px rgba(14, 165, 233, 0.35)',
            };
            break;

        // Amber/Orange (Warnings & Reminders)
        case 'contract_timeout':
            styles = {
                bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                shadow: '0 4px 10px rgba(245, 158, 11, 0.35)',
            };
            break;

        // Red/Rose (Disputes, Cancellations, Rejections)
        case 'contract_cancelled':
        case 'contract_disputed':
        case 'system_rejected':
            styles = {
                bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                shadow: '0 4px 10px rgba(244, 63, 94, 0.35)',
            };
            break;

        // Slate (System Info)
        case 'system_info':
        default:
            styles = {
                bg: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                shadow: '0 4px 10px rgba(100, 116, 139, 0.2)',
            };
    }

    if (!isUnread) {
        return {
            background: styles.bg,
            boxShadow: 'none',
            opacity: 0.65,
        };
    }
    return {
        background: styles.bg,
        boxShadow: styles.shadow,
        opacity: 1,
    };
}

export function NotificationBell({
    className = '',
    workspace = 'client',
    isDark = false,
    variant = 'capsule',
}: {
    className?: string;
    workspace?: 'client' | 'freelancer';
    isDark?: boolean;
    variant?: 'capsule' | 'icon';
}) {
    const { t, tx, language } = useTranslation();
    const navigate = useNavigate();
    const { notifications, unreadCount, isLoading, markAsRead, markAllRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [unreadIdsAtOpen, setUnreadIdsAtOpen] = useState<Set<string>>(new Set());
    const dropdownRef = useRef<HTMLDivElement>(null);

    const pal = PALETTE;

    useEffect(() => {
        if (isOpen) {
            const unreads = new Set(notifications.filter(n => !n.is_read).map(n => n.id));
            setUnreadIdsAtOpen(unreads);
            if (unreads.size > 0) {
                markAllRead();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

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
            {/* Bell trigger */}
            <button
                onClick={() => setIsOpen(v => !v)}
                className={
                    variant === 'icon'
                        ? "relative header-icon-btn group"
                        : "group relative flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 active:scale-90"
                }
                style={
                    variant !== 'icon' ? {
                        color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                    } : undefined
                }
                onMouseEnter={variant !== 'icon' ? e => {
                    e.currentTarget.style.background = isDark
                        ? 'color-mix(in srgb, var(--workspace-primary) 14%, transparent)'
                        : 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)';
                    e.currentTarget.style.color = 'var(--workspace-primary)';
                } : undefined}
                onMouseLeave={variant !== 'icon' ? e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
                } : undefined}
                aria-label={`${t.notifications?.title || 'Notifications'}${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
                <Bell className="w-[17px] h-[17px] transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
                {unreadCount > 0 && (
                    <span
                      className={`absolute flex items-center justify-center min-w-[16px] h-4 rounded-full text-[9px] font-black leading-none animate-pulse ${
                        variant === 'icon' ? 'top-1.5 right-1.5' : 'top-0.5 right-0.5'
                      }`}
                      style={{
                        background: 'var(--workspace-primary)',
                        color: '#fff',
                        padding: unreadCount > 9 ? '0 4px' : '0',
                        boxShadow: `0 0 0 2px ${isDark ? '#09090b' : '#ffffff'}, 0 0 10px var(--workspace-primary)`,
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
                          ? 'rgba(20, 20, 22, 0.85)'
                          : 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: isDark 
                          ? '1px solid rgba(255, 255, 255, 0.08)'
                          : '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: isDark 
                          ? '0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                          : '0 24px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800/40 dark:bg-white/[0.04]"
                            >
                                <Bell className="h-3.5 w-3.5 text-zinc-400" />
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
                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition-all text-[var(--workspace-primary)] hover:bg-zinc-800/40 dark:hover:bg-white/[0.03]"
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
                                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/20 dark:bg-white/[0.02]"
                                >
                                    <Bell className="h-7 w-7 text-zinc-500" />
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
                                const isUnread = unreadIdsAtOpen.has(n.id);
                                const isContractRelated = displayNotif.category?.startsWith('contract_') || displayNotif.category?.startsWith('payment_');

                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`group relative cursor-pointer rounded-xl p-3 transition-all duration-200 hover:translate-x-0.5 ${
                                            isUnread 
                                                ? 'border-l-[3.5px] rounded-l-none border-l-[var(--workspace-primary)] shadow-[inset_4px_0_12px_-6px_var(--workspace-primary)] bg-gradient-to-r from-[var(--workspace-primary)]/[0.04] to-transparent' 
                                                : 'hover:bg-zinc-800/10 dark:hover:bg-white/[0.015]'
                                        }`}
                                    >
                                        <div className="relative flex items-start gap-3">
                                            {/* Icon badge */}
                                            <div
                                                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md"
                                                style={badgeStyleForCategory(displayNotif.category, isUnread)}
                                            >
                                                {iconForCategory(displayNotif.category)}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p
                                                        className={`text-[13px] font-bold leading-snug transition-colors ${isUnread ? 'text-[var(--workspace-primary)]' : 'text-[var(--color-text-primary)]'}`}
                                                    >
                                                        {displayNotif.title}
                                                    </p>
                                                    {isUnread && (
                                                        <span
                                                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full animate-pulse"
                                                            style={{
                                                                background: 'var(--workspace-primary)',
                                                                boxShadow: '0 0 8px var(--workspace-primary)',
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                {isContractRelated ? (
                                                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-zinc-800/30 dark:bg-white/[0.03] text-zinc-400 border border-white/[0.02] max-w-full">
                                                        <Briefcase className="w-3 h-3 text-[var(--workspace-primary)] shrink-0" />
                                                        <span className="truncate">{displayNotif.body}</span>
                                                    </div>
                                                ) : (
                                                    <p
                                                        className="mt-1 text-[12px] leading-[1.45] line-clamp-2"
                                                        style={{ color: 'var(--color-text-secondary)' }}
                                                    >
                                                        {displayNotif.body}
                                                    </p>
                                                )}
                                                <p
                                                    className="mt-1.5 text-[10.5px] font-medium text-zinc-500 dark:text-zinc-400"
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
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-bold transition-all text-[var(--workspace-primary)] hover:bg-zinc-800/40 dark:hover:bg-white/[0.03]"
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
