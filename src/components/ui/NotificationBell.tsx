import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

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

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        return `منذ ${diffDays} يوم`;
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -end-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full end-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                            >
                                <CheckCheck className="w-4 h-4" />
                                قراءة الكل
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2" />
                                جاري التحميل...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                لا توجد إشعارات
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`
                                        flex gap-3 p-4 border-b border-gray-50 cursor-pointer
                                        hover:bg-gray-50 transition-colors
                                        ${!notification.read ? 'bg-primary-50/50' : ''}
                                    `}
                                    onClick={() => {
                                        if (!notification.read) markAsRead(notification.id);
                                        if (notification.link) {
                                            window.location.href = notification.link;
                                        }
                                    }}
                                >
                                    {/* Icon */}
                                    <span className="text-xl">
                                        {getNotificationIcon(notification.type)}
                                    </span>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-600 truncate">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatTimeAgo(notification.created_at)}
                                        </p>
                                    </div>

                                    {/* Unread indicator */}
                                    {!notification.read && (
                                        <span className="w-2 h-2 bg-primary-600 rounded-full self-center" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <a
                            href="/notifications"
                            className="block text-center py-3 text-sm text-primary-600 hover:bg-gray-50 border-t border-gray-100"
                        >
                            عرض كل الإشعارات
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
