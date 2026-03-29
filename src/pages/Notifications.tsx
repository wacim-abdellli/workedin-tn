import { Bell, CheckCheck, MessageSquare, ShieldAlert, Sparkles, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '@/components/layout';
import Button from '@/components/ui/Button';
import SEO from '@/components/common/SEO';
import { useNotifications } from '@/contexts/NotificationsContext';
import type { AppNotification } from '@/hooks/useRealtimeNotifications';
import { useTranslation } from '@/i18n';

function iconForType(type: AppNotification['type']) {
    switch (type) {
        case 'message':  return <MessageSquare className="h-5 w-5" />;
        case 'proposal': return <Sparkles className="h-5 w-5" />;
        case 'payment':  return <Wallet className="h-5 w-5" />;
        case 'contract': return <ShieldAlert className="h-5 w-5" />;
        default:         return <Bell className="h-5 w-5" />;
    }
}

const TYPE_COLOR: Record<AppNotification['type'], string> = {
    message:  'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    proposal: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
    payment:  'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300',
    contract: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    system:   'bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-300',
    review:   'bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
};

export default function Notifications() {
    const { t, tx } = useTranslation();
    const navigate = useNavigate();
    const { notifications, unreadCount, isLoading, markAsRead, markAllRead } = useNotifications();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const diffMs = Date.now() - date.getTime();
        const mins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMs / 3600000);
        const days = Math.floor(diffMs / 86400000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const handleClick = async (n: AppNotification) => {
        if (!n.is_read) await markAsRead(n.id);
        if (n.link) navigate(n.link);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0e17]">
            <SEO title={tx('seo.notifications.title', undefined, 'Notifications | Khedma TN')} description={tx('seo.notifications.description', undefined, 'Your notifications')} noIndex />
            <Header />

            <div className="container-custom py-8 max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t.notifications?.title || 'Notifications'}</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-muted mt-1">{unreadCount} unread</p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllRead} leftIcon={<CheckCheck className="w-4 h-4" />}>
                            {t.notifications?.readAll || 'Mark all read'}
                        </Button>
                    )}
                </div>

                <div className="space-y-2">
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
                        <div className="card text-center py-16">
                            <div className="w-16 h-16 bg-primary-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-primary-500 dark:text-primary-300" />
                            </div>
                            <p className="font-semibold text-foreground">{t.notifications?.empty || 'No notifications yet'}</p>
                            <p className="text-sm text-muted mt-1">{t.notifications?.emptyDesc || "We'll notify you when something happens"}</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => handleClick(n)}
                                className={`card p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${!n.is_read ? 'border-primary-200 dark:border-primary-500/30 bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[n.type]}`}>
                                        {iconForType(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className={`text-sm font-semibold text-foreground ${!n.is_read ? 'text-primary-700 dark:text-primary-300' : ''}`}>
                                                {n.title}
                                            </p>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-xs text-muted">{formatDate(n.created_at)}</span>
                                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                                            </div>
                                        </div>
                                        {n.body && (
                                            <p className="text-sm text-muted mt-1 leading-relaxed">{n.body}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
