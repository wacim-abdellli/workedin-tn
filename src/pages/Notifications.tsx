import { useState, useMemo } from 'react';
import { Bell, CheckCheck, MessageSquare, Briefcase, FileText, Wallet, Trash2, Settings, BellOff } from 'lucide-react';
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
        case 'message':  return <MessageSquare className="h-5 w-5" strokeWidth={1.75} />;
        case 'proposal':
        case 'new_proposal':
            return <FileText className="h-5 w-5" strokeWidth={1.75} />;
        case 'payment':  return <Wallet className="h-5 w-5" strokeWidth={1.75} />;
        case 'contract':
        case 'contract_update':
            return <Briefcase className="h-5 w-5" strokeWidth={1.75} />;
        default:         return <Bell className="h-5 w-5" strokeWidth={1.75} />;
    }
}

function badgeStyleForType(type: AppNotification['type'], isUnread: boolean) {
    let styles;
    switch (type) {
        case 'contract':
        case 'contract_update':
            styles = {
                bg: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                shadow: '0 6px 14px rgba(245, 158, 11, 0.35)',
            };
            break;
        case 'proposal':
        case 'new_proposal':
            styles = {
                bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                shadow: '0 6px 14px rgba(139, 92, 246, 0.35)',
            };
            break;
        case 'payment':
            styles = {
                bg: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                shadow: '0 6px 14px rgba(16, 185, 129, 0.35)',
            };
            break;
        case 'message':
            styles = {
                bg: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                shadow: '0 6px 14px rgba(56, 189, 248, 0.35)',
            };
            break;
        case 'system':
        case 'review':
            styles = {
                bg: 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)',
                shadow: '0 6px 14px rgba(244, 63, 94, 0.35)',
            };
            break;
        default:
            styles = {
                bg: 'linear-gradient(135deg, #71717a 0%, #52525b 100%)',
                shadow: '0 6px 14px rgba(113, 113, 122, 0.2)',
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

export default function Notifications() {
    const { t, tx } = useTranslation();
    const navigate = useNavigate();
    const { notifications, unreadCount, isLoading, markAsRead, markAllRead, deleteNotification } = useNotifications();
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'contract' | 'proposal'>('all');

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

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            if (activeTab === 'unread') return !n.is_read;
            if (activeTab === 'contract') return n.type === 'contract' || n.type === 'contract_update';
            if (activeTab === 'proposal') return n.type === 'proposal' || n.type === 'new_proposal';
            return true;
        });
    }, [notifications, activeTab]);

    const grouped = useMemo(() => {
        const today: AppNotification[] = [];
        const yesterday: AppNotification[] = [];
        const older: AppNotification[] = [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = startOfToday - 86400000;

        filteredNotifications.forEach(n => {
            const time = new Date(n.created_at).getTime();
            if (time >= startOfToday) {
                today.push(n);
            } else if (time >= startOfYesterday) {
                yesterday.push(n);
            } else {
                older.push(n);
            }
        });

        return { today, yesterday, older };
    }, [filteredNotifications]);

    const tabs = [
        { id: 'all', label: tx('contracts.tabs.all', undefined, 'All') },
        { id: 'unread', label: tx('messages.filters.unread', undefined, 'Unread') },
        { id: 'contract', label: tx('notificationSettings.contractUpdates', undefined, 'Contracts') },
        { id: 'proposal', label: tx('pages.myProposals.title', undefined, 'Proposals') },
    ] as const;

    const renderGroup = (title: string, items: AppNotification[]) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]/75 px-1">
                    {title}
                </h3>
                <div className="border border-white/[0.05] dark:border-white/[0.05] bg-zinc-900/30 dark:bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden divide-y divide-white/[0.04] dark:divide-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                    {items.map(raw => {
                        const n = getDisplayNotification(raw, tx);
                        return (
                            <div
                                key={n.id}
                                onClick={() => handleClick(n)}
                                className={`group p-4 sm:p-5 cursor-pointer transition-all duration-200 relative flex gap-4 ${
                                    !n.is_read 
                                        ? 'border-l-[4px] border-l-[var(--color-brand-accent)] shadow-[inset_5px_0_18px_-8px_var(--color-brand-accent)] bg-gradient-to-r from-[var(--color-brand-accent)]/[0.03] to-transparent' 
                                        : 'hover:bg-white/[0.015]'
                                }`}
                            >
                                {!n.is_read && (
                                    <div className="absolute inset-0 opacity-[0.015] bg-[var(--color-brand-accent)] pointer-events-none" />
                                )}
                                <div 
                                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md"
                                    style={badgeStyleForType(n.type, !n.is_read)}
                                >
                                    {iconForType(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <p className={`text-[15px] font-semibold leading-snug transition-colors ${!n.is_read ? 'text-[var(--color-text-primary)] font-bold' : 'text-[var(--color-text-primary)]/80 font-medium'}`}>
                                            {n.title}
                                        </p>
                                        <div className="flex items-center gap-2.5 flex-shrink-0 pt-0.5 z-10">
                                            <span className="text-xs font-medium text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-primary)]/70">{formatDate(n.created_at)}</span>
                                            {!n.is_read && (
                                                <span 
                                                    className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" 
                                                    style={{ 
                                                        backgroundColor: 'var(--color-brand-accent)',
                                                        boxShadow: '0 0 8px var(--color-brand-accent)',
                                                    }} 
                                                />
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                className="md:opacity-0 group-hover:opacity-100 p-1.5 -mr-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-status-error)] rounded-full hover:bg-[var(--color-status-error)]/10 hover:scale-105 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] transition-all duration-200"
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
                        );
                    })}
                </div>
            </div>
        );
    };

    const hasNotifications = filteredNotifications.length > 0;

    return (
        <div className="flex min-h-screen flex-col bg-[var(--color-background-base)]">
            <SEO title={tx('seo.notifications.title', undefined, 'Notifications | WorkedIn')} description={tx('seo.notifications.description', undefined, 'Your notifications')} noIndex />
            <Header />

            <main className="container-custom flex-1 w-full max-w-6xl py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                {/* Header Title Section */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{t.notifications?.title || 'Notifications'}</h1>
                        {unreadCount > 0 && (
                            <p className="mt-1.5 text-sm font-medium text-[var(--color-text-secondary)]">{tx('notifications.unreadCount', { count: unreadCount }, `${unreadCount} unread`)}</p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllRead} leftIcon={<CheckCheck className="w-4 h-4" />} className="self-start sm:self-auto border-white/[0.08] hover:bg-white/[0.03]">
                            {t.notifications?.readAll || 'Mark all read'}
                        </Button>
                    )}
                </div>

                {/* 2-Column Grid Layout */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left Column: Filters and Notification List */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Tab-based Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-1.5 border-b border-white/[0.06] dark:border-white/[0.06]" style={{ scrollbarWidth: 'none' }}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-semibold border transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-gradient-to-r from-[var(--color-brand-accent)] to-[color-mix(in_srgb,var(--color-brand-accent)_85%,#fff)] border-[var(--color-brand-accent)] text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                                            : 'bg-transparent border-transparent text-[var(--color-text-secondary)] hover:bg-white/[0.04] hover:text-[var(--color-text-primary)]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Notifications List Box */}
                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="border border-white/[0.05] bg-zinc-900/30 dark:bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden divide-y divide-white/[0.04] dark:divide-white/[0.04]">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="p-5 animate-pulse flex gap-4">
                                            <div className="w-11 h-11 rounded-full bg-[var(--color-background-subtle)] flex-shrink-0" />
                                            <div className="flex-1 space-y-2.5 pt-1.5">
                                                <div className="h-4 bg-[var(--color-background-subtle)] rounded-md w-1/3" />
                                                <div className="h-3 bg-[var(--color-background-subtle)] rounded-md w-2/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : !hasNotifications ? (
                                <div className="card text-center py-16 sm:py-20 border border-white/[0.05] bg-zinc-900/20 dark:bg-black/20 backdrop-blur-sm rounded-3xl">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl shrink-0 flex items-center justify-center mx-auto mb-6 bg-[var(--color-background-subtle)] shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]">
                                        <BellOff className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--color-text-secondary)]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{t.notifications?.empty || 'No notifications'}</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm mx-auto px-4">{tx('notifications.emptyDesc', undefined, "We'll notify you when something important happens with your projects or payments.")}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {renderGroup(tx('common.today', undefined, 'Today'), grouped.today)}
                                    {renderGroup(tx('common.yesterday', undefined, 'Yesterday'), grouped.yesterday)}
                                    {renderGroup(tx('common.older', undefined, 'Older'), grouped.older)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Activity Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="card border border-white/[0.05] bg-zinc-900/30 dark:bg-black/30 backdrop-blur-md p-6 rounded-2xl space-y-4 shadow-lg lg:sticky lg:top-24">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-[var(--color-brand-accent)]/10 text-[var(--color-brand-accent)] shadow-[0_0_8px_rgba(var(--color-brand-accent),0.1)]">
                                    <Bell className="w-4 h-4 animate-bounce" />
                                </div>
                                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                                    {tx('notifications.overview.title', undefined, 'Activity Summary')}
                                </h3>
                            </div>
                            <p className="text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed">
                                {tx('notifications.overview.description', undefined, 'Keep track of all actions, updates, and deliverables on your projects.')}
                            </p>
                            <div className="h-px bg-white/[0.05]" />
                            <div className="space-y-3">
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-[var(--color-text-secondary)]">{tx('notifications.overview.total', undefined, 'Total notifications')}</span>
                                    <span className="font-semibold text-[var(--color-text-primary)]">{notifications.length}</span>
                                </div>
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-[var(--color-text-secondary)]">{tx('notifications.overview.unread', undefined, 'Unread alerts')}</span>
                                    <span className={`font-semibold ${unreadCount > 0 ? 'text-[var(--color-brand-accent)] animate-pulse' : 'text-[var(--color-text-secondary)]'}`}>{unreadCount}</span>
                                </div>
                            </div>
                            <div className="h-px bg-white/[0.05]" />
                            <Button
                                variant="outline"
                                className="w-full justify-center text-xs py-2.5 font-bold transition-all duration-200 border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]"
                                onClick={() => navigate('/settings')}
                                leftIcon={<Settings className="w-3.5 h-3.5" />}
                            >
                                {tx('notifications.overview.settings', undefined, 'Preferences')}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
