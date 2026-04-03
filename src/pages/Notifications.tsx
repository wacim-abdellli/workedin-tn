import type { CSSProperties } from 'react';
import { Bell, CheckCheck, MessageSquare, ShieldAlert, Sparkles, Wallet, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import Button from '@/components/ui/Button';
import SEO from '@/components/common/SEO';
import { useNotifications } from '@/contexts/NotificationsContext';
import type { AppNotification } from '@/hooks/useRealtimeNotifications';
import { useTranslation } from '@/i18n';
import { getDisplayNotification } from '@/lib/notificationDisplay';

function iconForType(type: AppNotification['type']) {
    switch (type) {
        case 'message':  return <MessageSquare className="h-5 w-5" />;
        case 'proposal': return <Sparkles className="h-5 w-5" />;
        case 'payment':  return <Wallet className="h-5 w-5" />;
        case 'contract': return <ShieldAlert className="h-5 w-5" />;
        default:         return <Bell className="h-5 w-5" />;
    }
}

const TYPE_COLOR: Record<AppNotification['type'], CSSProperties> = {
    message: { background: 'color-mix(in srgb, var(--workspace-primary) 16%, transparent)', color: 'var(--workspace-primary)' },
    proposal: { background: 'color-mix(in srgb, var(--workspace-primary) 16%, transparent)', color: 'var(--workspace-primary-mid)' },
    payment: { background: 'rgba(34,197,94,0.14)', color: 'rgb(74, 222, 128)' },
    contract: { background: 'color-mix(in srgb, var(--brand-accent) 16%, transparent)', color: 'var(--brand-accent)' },
    system: { background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' },
    review: { background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)', color: 'var(--workspace-primary-mid)' },
};

export default function Notifications() {
    const { t, tx } = useTranslation();
    const navigate = useNavigate();
    const { notifications, unreadCount, isLoading, markAsRead, markAllRead, deleteNotification } = useNotifications();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const diffMs = Date.now() - date.getTime();
        const mins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMs / 3600000);
        const days = Math.floor(diffMs / 86400000);
        if (mins < 1) return tx('notifications.time.justNow', undefined, 'Just now');
        if (mins < 60) return tx('notifications.time.minutesAgo', { count: mins }, `${mins}m ago`);
        if (hours < 24) return tx('notifications.time.hoursAgo', { count: hours }, `${hours}h ago`);
        if (days < 7) return tx('notifications.time.daysAgo', { count: days }, `${days}d ago`);
        return date.toLocaleDateString();
    };

    const handleClick = async (n: AppNotification) => {
        if (!n.is_read) await markAsRead(n.id);
        if (n.link) navigate(n.link);
    };

    return (
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-[#090610]">
            <SEO title={tx('seo.notifications.title', undefined, 'Notifications | Khedma TN')} description={tx('seo.notifications.description', undefined, 'Your notifications')} noIndex />
            <Header />

            <main className="container-custom flex-1 w-full max-w-3xl py-8 sm:py-12">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.notifications?.title || 'Notifications'}</h1>
                        {unreadCount > 0 && (
                            <p className="mt-1.5 text-sm font-medium text-muted">{tx('notifications.unreadCount', { count: unreadCount }, `${unreadCount} unread`)}</p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllRead} leftIcon={<CheckCheck className="w-4 h-4" />}>
                            {t.notifications?.readAll || 'Mark all read'}
                        </Button>
                    )}
                </div>

                <div className="space-y-3 pb-12">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="card p-4 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-white/10 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                                        <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : notifications.length === 0 ? (
                        <div className="card text-center py-20 border border-white/5 bg-white/40 dark:bg-[#120d1e]/40 backdrop-blur-sm rounded-3xl shadow-sm">
                            <div className="w-20 h-20 bg-primary-50 dark:bg-primary-500/10 rounded-[28px] shrink-0 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Bell className="w-8 h-8 text-primary-500 dark:text-primary-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">{t.notifications?.empty || 'No notifications yet'}</h3>
                            <p className="text-sm text-muted mt-2 max-w-sm mx-auto">{t.notifications?.emptyDesc || "We'll notify you when something important happens with your projects or payments."}</p>
                        </div>
                    ) : (
                        notifications.map((rawNotification) => {
                            const n = getDisplayNotification(rawNotification, tx);
                            return (
                            <div
                                key={n.id}
                                onClick={() => handleClick(n)}
                                className={`card group p-5 cursor-pointer transition-all hover:-translate-y-1 rounded-2xl border shadow-sm ${!n.is_read ? 'border-primary-200 dark:border-primary-500/30 bg-primary-50/50 dark:bg-primary-900/10 shadow-[0_0_15px_rgba(124,58,237,0.05)]' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:shadow-md'}`}
                            >
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-[20px] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm" style={TYPE_COLOR[n.type]}>
                                        {iconForType(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <p className={`text-base font-semibold leading-tight text-foreground ${!n.is_read ? 'text-primary-700 dark:text-white' : 'dark:text-white/90'}`}>
                                                {n.title}
                                            </p>
                                            <div className="flex items-center gap-2.5 flex-shrink-0 pt-0.5">
                                                <span className="text-xs font-medium text-muted transition-colors group-hover:text-foreground/70">{formatDate(n.created_at)}</span>
                                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 shadow-[0_0_8px_rgba(124,58,237,0.6)]" />}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                    className="p-1.5 -mr-1.5 text-muted hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    title={tx('notifications.delete', undefined, 'Delete notification')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {n.body && (
                                            <p className="text-sm text-muted mt-1.5 leading-relaxed line-clamp-2 dark:text-white/60">{n.body}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
