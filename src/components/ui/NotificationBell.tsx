import { useRef, useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2, MessageSquare, ShieldAlert, Sparkles, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import { useNotifications } from '@/contexts/NotificationsContext';
import type { AppNotification } from '@/hooks/useRealtimeNotifications';
import { getDisplayNotification } from '@/lib/notificationDisplay';

function iconForType(type: AppNotification['type']) {
    switch (type) {
        case 'message':  return <MessageSquare className="h-4 w-4" />;
        case 'proposal':
        case 'new_proposal':
            return <Sparkles className="h-4 w-4" />;
        case 'payment':  return <Wallet className="h-4 w-4" />;
        case 'contract':
        case 'contract_update':
            return <ShieldAlert className="h-4 w-4" />;
        default:         return <Bell className="h-4 w-4" />;
    }
}

export function NotificationBell({ className = '' }: { className?: string }) {
    const { t, tx, language } = useTranslation();
    const navigate = useNavigate();
    const { notifications, unreadCount, isLoading, markAsRead, markAllRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleScroll(event: Event) {
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
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
        const mins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMs / 3600000);
        const days = Math.floor(diffMs / 86400000);
        
        if (mins < 1) return t.jobs?.time?.now || 'Just now';
        
        const ago = t.jobs?.time?.ago || 'ago';
        const agoPrefix = t.jobs?.time?.ago_prefix || '';
        const minute = t.jobs?.time?.minute || 'min';
        const hour = t.jobs?.time?.hour || 'h';
        const day = t.jobs?.time?.day || 'd';
        const prefixStr = agoPrefix ? `${agoPrefix} ` : '';
        
        if (mins < 60) return language === 'en' ? `${mins}${minute} ${ago}` : `${prefixStr}${mins} ${minute} ${ago}`;
        if (hours < 24) return language === 'en' ? `${hours}${hour} ${ago}` : `${prefixStr}${hours} ${hour} ${ago}`;
        return language === 'en' ? `${days}${day} ${ago}` : `${prefixStr}${days} ${day} ${ago}`;
    };

    const handleNotificationClick = async (n: AppNotification) => {
        if (!n.is_read) await markAsRead(n.id);
        if (n.link) navigate(n.link);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(v => !v)}
                className="header-icon-btn relative"
                aria-label={t.notifications?.title || 'Notifications'}
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 ltr:-right-1 rtl:-left-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/30 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="header-dropdown-surface absolute ltr:-right-2 ltr:sm:right-0 rtl:-left-2 rtl:sm:left-0 top-full z-50 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 origin-top">
                    <div className="flex items-center justify-between border-b border-border/80 px-4 py-4 dark:border-white/8">
                        <h3 className="font-bold text-dark-900 dark:text-white">{t.notifications?.title || 'Notifications'}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-hover dark:text-brand-mid"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                {t.notifications?.readAll || 'Mark all read'}
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto px-2 pb-2 space-y-1 mt-2">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-brand/50" />
                                <p className="text-sm text-muted">{tx('dashboard.loading', undefined, 'Loading...')}</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand bg-card dark:text-brand-mid">
                                    <Bell className="h-7 w-7" />
                                </div>
                                <p className="font-semibold text-dark-900 dark:text-white">{t.notifications?.empty || 'No notifications'}</p>
                                <p className="mt-1 text-sm font-medium text-brand dark:text-brand-mid">{t.notifications?.caughtUp || "You're all caught up"}</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map(n => {
                                // Translate notification to user's language
                                const displayNotif = getDisplayNotification(n, tx);
                                
                                return (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`cursor-pointer rounded-2xl border p-3 transition-all duration-300 hover:shadow-sm ${
                                        !n.is_read
                                            ? 'border-brand/30 bg-brand-light/70 dark:border-brand/30 dark:bg-brand/10'
                                            : 'border-transparent hover:border-border hover:bg-brand-light/40 dark:hover:border-white/10 dark:hover:bg-white/5 bg-card/50'
                                    }`}
                                >
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-light text-brand bg-card dark:text-brand-mid">
                                            {iconForType(n.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-sm font-semibold text-dark-900 dark:text-white">{displayNotif.title}</p>
                                                {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-brand flex-shrink-0" />}
                                            </div>
                                            <p className="mt-1 text-xs leading-relaxed text-dark-500 dark:text-dark-400">{displayNotif.body}</p>
                                            <p className="mt-2 text-[11px] font-medium text-dark-400">{formatTimeAgo(n.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="border-t border-border dark:border-white/8 px-4 py-3">
                            <button
                                onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                                className="w-full text-center text-xs font-medium text-brand hover:text-brand-hover dark:text-brand-mid"
                            >
                                {t.notifications?.viewAll || tx('notifications.viewAll', undefined, 'View all notifications')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
