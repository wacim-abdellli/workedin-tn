import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';

interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'message' | 'match' | 'payment' | 'delivery' | 'dispute' | 'system';
    read: boolean;
    link?: string;
    created_at: string;
}

interface NotificationBellProps {
    className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
    const { user } = useAuth();
    const { t, language } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    useEffect(() => {
        if (!user?.id) return;

        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;

                setNotifications(data || []);
                setUnreadCount(data?.filter((n) => !n.read).length || 0);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                // Optionally show toast or just keep empty
                setNotifications([]);
                setUnreadCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();

        // Subscribe to new notifications
        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user?.id)
                .eq('read', false);

            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Get icon for notification type
    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'message':
                return '💬';
            case 'match':
                return '🎯';
            case 'payment':
                return '💰';
            case 'delivery':
                return '📦';
            case 'dispute':
                return '⚠️';
            default:
                return '🔔';
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t.common.time.now;

        let val = 0;
        let unit = '';

        if (diffMins < 60) {
            val = diffMins;
            unit = t.common.time.minute;
        } else if (diffHours < 24) {
            val = diffHours;
            unit = t.common.time.hour;
        } else {
            val = diffDays;
            unit = t.common.time.day;
        }

        // English format: "5m ago" (suffix)
        // Arabic/French format: "ago 5 mins" (prefix)
        if (language === 'en') {
            return `${val}${unit} ${t.common.time.ago}`;
        } else {
            return `${t.common.time.ago} ${val} ${unit}`;
        }
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 transition-all text-dark-500 hover:text-dark-900 dark:text-dark-300 dark:hover:text-white"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 end-0 min-w-[20px] h-5 px-1 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse border-2 border-white dark:border-dark-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full end-0 mt-3 w-80 sm:w-96 bg-white dark:bg-dark-900 rounded-2xl shadow-xl dark:shadow-black/50 border border-gray-100 dark:border-dark-700 overflow-hidden z-50 animate-slide-up transform origin-top-right">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-700 bg-white/50 dark:bg-dark-900/50 backdrop-blur">
                        <h3 className="font-bold text-dark-900 dark:text-white">{t.notifications.title}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline flex items-center gap-1 font-medium"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                {t.notifications.readAll}
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-12 text-center text-dark-500">
                                <Loader2 className="animate-spin w-8 h-8 text-primary-600/50 mx-auto mb-3" />
                                <p className="text-sm">{t.common.loading}</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center text-dark-400">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-dark-300" />
                                </div>
                                <p className="font-medium text-dark-900 dark:text-white mb-1">{t.notifications.empty}</p>
                                <p className="text-sm text-dark-500">{t.notifications.emptyDesc}</p>
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`
                                            flex gap-4 p-4 border-b border-gray-50 dark:border-dark-800 cursor-pointer
                                            hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors group
                                            ${!notification.read ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''}
                                        `}
                                        onClick={() => {
                                            if (!notification.read) markAsRead(notification.id);
                                            if (notification.link) {
                                                window.location.href = notification.link;
                                            }
                                        }}
                                    >
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-1">
                                            <span className="text-2xl filter drop-shadow-sm">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <p className={`text-sm font-semibold ${!notification.read ? 'text-dark-900 dark:text-white' : 'text-dark-700 dark:text-dark-300'}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5 shadow-sm shadow-primary-500/50" />
                                                )}
                                            </div>
                                            <p className="text-xs text-dark-500 dark:text-dark-400 line-clamp-2 leading-relaxed mb-1.5">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-dark-400 font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                                                {formatTimeAgo(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <a
                            href="/notifications"
                            className="block text-center py-3 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-800 border-t border-gray-100 dark:border-dark-700 transition-colors"
                        >
                            {t.notifications.viewAll}
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
