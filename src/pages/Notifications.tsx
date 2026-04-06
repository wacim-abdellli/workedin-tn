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
    message: { background: 'color-mix(in srgb, var(--color-brand-accent) 16%, transparent)', color: 'var(--color-brand-accent)' },
    proposal: { background: 'color-mix(in srgb, var(--color-brand-accent) 16%, transparent)', color: 'var(--color-brand-accent)' },
    payment: { background: 'color-mix(in srgb, var(--color-status-success) 16%, transparent)', color: 'var(--color-status-success)' },
    contract: { background: 'color-mix(in srgb, var(--color-brand-accent) 16%, transparent)', color: 'var(--color-brand-accent)' },
    system: { background: 'color-mix(in srgb, var(--color-background-muted) 16%, transparent)', color: 'var(--color-text-secondary)' },
    review: { background: 'color-mix(in srgb, var(--color-brand-accent) 12%, transparent)', color: 'var(--color-brand-accent)' },
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
        <div className="flex min-h-screen flex-col bg-[var(--color-background-base)]">
            <SEO title={tx('seo.notifications.title', undefined, 'Notifications | Khedma TN')} description={tx('seo.notifications.description', undefined, 'Your notifications')} noIndex />
            <Header />

            <main className="container-custom flex-1 w-full max-w-3xl py-8 sm:py-12">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{t.notifications?.title || 'Notifications'}</h1>
                        {unreadCount > 0 && (
                            <p className="mt-1.5 text-sm font-medium text-[var(--color-text-secondary)]">{tx('notifications.unreadCount', { count: unreadCount }, `${unreadCount} unread`)}</p>
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
                                    <div className="w-10 h-10 rounded-2xl bg-[var(--color-background-subtle)] flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-[var(--color-background-subtle)] rounded w-3/4" />
                                        <div className="h-3 bg-[var(--color-background-subtle)] rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : notifications.length === 0 ? (
                        <div className="card text-center py-20 border border-[var(--color-border-subtle)] bg-[var(--color-background-elevated)] backdrop-blur-sm rounded-3xl shadow-sm">
                            <div className="w-20 h-20 rounded-[28px] shrink-0 flex items-center justify-center mx-auto mb-6 shadow-inner" style={{ background: 'color-mix(in srgb, var(--color-brand-accent) 10%, transparent)' }}>
                                <Bell className="w-8 h-8" style={{ color: 'var(--color-brand-accent)' }} />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{t.notifications?.empty || 'No notifications yet'}</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm mx-auto">{t.notifications?.emptyDesc || "We'll notify you when something important happens with your projects or payments."}</p>
                        </div>
                    ) : (
                        notifications.map((rawNotification) => {
                            const n = getDisplayNotification(rawNotification, tx);
                            return (
                            <div
                                key={n.id}
                                onClick={() => handleClick(n)}
                                className={`card group p-5 cursor-pointer transition-all hover:-translate-y-1 rounded-2xl border shadow-sm relative overflow-hidden ${!n.is_read ? 'border-[var(--color-brand-accent)]/30 shadow-md' : 'border-[var(--color-border-subtle)] bg-[var(--color-background-base)] hover:shadow-md'}`}
                            >
                                {!n.is_read && (
                                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundColor: 'var(--color-brand-accent)' }} />
                                )}
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-[20px] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm" style={TYPE_COLOR[n.type]}>
                                        {iconForType(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <p className={`text-base font-semibold leading-tight z-10 ${!n.is_read ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)]/90'}`}>
                                                {n.title}
                                            </p>
                                            <div className="flex items-center gap-2.5 flex-shrink-0 pt-0.5 z-10">
                                                <span className="text-xs font-medium text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-primary)]/70">{formatDate(n.created_at)}</span>
                                                {!n.is_read && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: 'var(--color-brand-accent)', boxShadow: '0 0 10px var(--color-brand-accent)' }} />}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                    className="p-1.5 -mr-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-status-error)] rounded-full hover:bg-[var(--color-status-error)]/10 transition-colors"
                                                    title={tx('notifications.delete', undefined, 'Delete notification')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {n.body && (
                                            <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed line-clamp-2">{n.body}</p>
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
