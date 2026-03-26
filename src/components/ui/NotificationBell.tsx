import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2, MessageSquare, ShieldAlert, Sparkles, Wallet } from 'lucide-react';

import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;  // DB column name
  type: 'new_job' | 'new_proposal' | 'message' | 'payment' | 'review' | 'contract_update' | 'milestone' | 'system';
  is_read: boolean; // DB column name
  link?: string;
  created_at: string;
}

export function NotificationBell({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
      } catch (error) {
        logger.error('Error fetching notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 10));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.common.time.now;
    if (diffMins < 60) return language === 'en' ? `${diffMins}${t.common.time.minute} ${t.common.time.ago}` : `${t.common.time.ago} ${diffMins} ${t.common.time.minute}`;
    if (diffHours < 24) return language === 'en' ? `${diffHours}${t.common.time.hour} ${t.common.time.ago}` : `${t.common.time.ago} ${diffHours} ${t.common.time.hour}`;
    return language === 'en' ? `${diffDays}${t.common.time.day} ${t.common.time.ago}` : `${t.common.time.ago} ${diffDays} ${t.common.time.day}`;
  };

  const iconForType = (type: Notification['type']) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'new_proposal':
      case 'new_job': return <Sparkles className="h-4 w-4" />;
      case 'payment': return <Wallet className="h-4 w-4" />;
      case 'contract_update':
      case 'milestone': return <ShieldAlert className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="header-icon-btn relative border border-primary-100/70 bg-white/80 dark:border-white/8 dark:bg-white/5"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/30 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="glass-card absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-[28px] shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-gray-100/80 px-4 py-4 dark:border-white/8">
            <h3 className="font-bold text-dark-900 dark:text-white">{t.notifications.title}</h3>
            {unreadCount > 0 ? (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-300"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t.notifications.readAll}
              </button>
            ) : null}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <div className="p-12 text-center text-dark-500">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary-600/50" />
                <p className="text-sm">{t.common.loading}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-500 dark:bg-white/5 dark:text-primary-300">
                  <Bell className="h-7 w-7" />
                </div>
                <p className="font-semibold text-dark-900 dark:text-white">{t.notifications.empty}</p>
                <p className="mt-1 text-sm font-medium text-primary-600 dark:text-primary-300">{t.notifications.caughtUp}</p>
                <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">{t.notifications.emptyDesc}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`cursor-pointer border-b border-gray-50 px-4 py-4 transition-colors last:border-b-0 hover:bg-primary-50/60 dark:border-white/5 dark:hover:bg-white/5 ${!notification.is_read ? 'bg-primary-50/70 dark:bg-primary-900/10' : ''}`}
                  onClick={() => {
                    if (!notification.is_read) markAsRead(notification.id);
                    if (notification.link) window.history.pushState({}, '', notification.link);
                  }}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/5 dark:text-primary-300">
                      {iconForType(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-dark-900 dark:text-white">{notification.title}</p>
                        {!notification.is_read ? <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-500" /> : null}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-dark-500 dark:text-dark-400">{notification.content}</p>
                      <p className="mt-2 text-[11px] font-medium text-dark-400">{formatTimeAgo(notification.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
