import { useEffect, useMemo, useState } from 'react';
import { Bell, BriefcaseBusiness, CreditCard, Loader2, MailOpen, MessageSquare, Megaphone, Star, Zap } from 'lucide-react';

import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface NotificationSetting {
    id: string;
    key: string;
    label: string;
    description: string;
    enabled: boolean;
}

const DEFAULTS: NotificationSetting[] = [
    { id: '1', key: 'new_job', label: 'وظائف جديدة مطابقة', description: 'إشعار عند وجود فرص عمل تناسب مهاراتك', enabled: true },
    { id: '2', key: 'messages', label: 'الرسائل', description: 'إشعار عند استلام رسائل جديدة', enabled: true },
    { id: '3', key: 'payments', label: 'المدفوعات', description: 'إشعار عند استلام أو إرسال مدفوعات', enabled: true },
    { id: '4', key: 'reviews', label: 'التقييمات', description: 'إشعار عند استلام تقييم جديد', enabled: true },
    { id: '5', key: 'marketing', label: 'العروض والتحديثات', description: 'نصائح وعروض من خدمة.تن', enabled: false },
];

export default function NotificationSettings() {
    const { tx } = useTranslation();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationSetting[]>(DEFAULTS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const fetchSettings = async () => {
            const { data } = await supabase
                .from('notification_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setNotifications(DEFAULTS.map((item) => ({ ...item, enabled: data[item.key] ?? item.enabled })));
            }

            setLoading(false);
        };

        void fetchSettings();
    }, [user?.id]);

    const copy = (key: string) => {
        const map: Record<string, { label: string; description: string }> = {   
            new_job: {
                label: tx('settings.notificationSettings.newMatches', undefined, 'New job matches'),
                description: tx('settings.notificationSettings.newMatchesDesc', undefined, 'Get notified when jobs match your skills'),
            },
            messages: {
                label: tx('settings.notificationSettings.newMessages', undefined, 'Messages'),
                description: tx('settings.notificationSettings.newMessagesDesc', undefined, 'Get notified when you receive new messages'),
            },
            payments: {
                label: tx('settings.notificationSettings.payments', undefined, 'Payments'),
                description: tx('settings.notificationSettings.paymentsDesc', undefined, 'Get notified when you send or receive payments'),
            },
            reviews: {
                label: tx('settings.notificationSettings.reviews', undefined, 'Reviews'),
                description: tx('settings.notificationSettings.reviewsDesc', undefined, 'Get notified when you receive a new review'),
            },
        };

        return map[key] ?? {
            label: tx('settings.notificationSettings.marketing', undefined, 'Offers and updates'),
            description: tx('settings.notificationSettings.marketingDesc', undefined, 'Tips and updates from Khedma'),
        };
    };

    const iconMap = useMemo(
        () => ({
            new_job: BriefcaseBusiness,
            messages: MessageSquare,
            payments: CreditCard,
            reviews: Star,
            marketing: Megaphone,
        }),
        []
    );

    const handleToggle = async (key: string) => {
        if (!user?.id) return;

        setNotifications((prev) => prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item)));

        try {
            const settings: Record<string, boolean> = {};
            notifications.forEach((item) => {
                settings[item.key] = item.key === key ? !item.enabled : item.enabled;
            });

            const { error } = await supabase
                .from('notification_settings')
                .upsert({ user_id: user.id, ...settings, updated_at: new Date().toISOString() });

            if (error) throw error;
        } catch (error) {
            logger.error('Error updating notification:', error);
            setNotifications((prev) => prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item)));
        }
    };

    const enabledCount = notifications.filter((item) => item.enabled).length;   
    const allEnabled = enabledCount === notifications.length;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-brand/20 blur-xl animate-pulse"></div>
                    <Loader2 className="h-8 w-8 animate-spin text-brand relative z-10" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative">
            {/* Top Stats Row */}
            <div className="grid gap-3 lg:grid-cols-3 relative z-10">
                <div className={`group relative overflow-hidden flex flex-col justify-between p-4 rounded-xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${allEnabled ? 'border-brand/40 bg-brand/10 hover:border-brand/50' : 'border-white/10 bg-white dark:bg-slate-900/[0.02] hover:border-brand/30 hover:bg-brand/5'}`}>
                    <div className={`absolute -right-10 -top-4 h-32 w-32 rounded-full blur-[40px] pointer-events-none transition-all ${allEnabled ? 'bg-brand/30' : 'bg-brand/10 group-hover:bg-brand/20'}`} />
                    <div>
                        <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${allEnabled ? 'bg-brand/40 text-brand-foreground shadow-inner' : 'bg-brand/20 text-brand'}`}>
                                <Bell className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest text-foreground/80">
                                {tx('settings.notificationsEnabled', undefined, 'Active rules')}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-base font-black text-foreground drop-shadow-sm">{enabledCount} <span className="text-base font-bold text-muted-foreground">/ {notifications.length}</span></p>
                    </div>
                </div>

                <div className="group relative overflow-hidden flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-white dark:bg-slate-900/[0.02] backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/5">
                    <div className="absolute -right-10 -top-4 h-32 w-32 rounded-full bg-blue-500/10 blur-[40px] pointer-events-none transition-all group-hover:bg-blue-500/20" />
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                                <Zap className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest text-foreground/80">
                                {tx('settings.notificationsTotal', undefined, 'Delivery speed')}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-base font-bold text-foreground">Real-time</p>
                        <p className="text-sm font-medium text-muted-foreground/80 mt-1">Instant push updates</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-white dark:bg-slate-900/[0.02] backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-purple-500/5">
                    <div className="absolute -right-10 -top-4 h-32 w-32 rounded-full bg-purple-500/10 blur-[40px] pointer-events-none transition-all group-hover:bg-purple-500/20" />
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                                <MailOpen className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest text-foreground/80">
                                {tx('settings.notificationChannel', undefined, 'Channels')}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-base font-bold text-foreground">In-App & Email</p>
                        <p className="text-sm font-medium text-muted-foreground/80 mt-1">Omnichannel delivery</p>
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-card/80 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
                <div className="absolute -left-40 top-20 h-[400px] w-[400px] rounded-full bg-brand/5 blur-[120px] pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 mb-4 text-center sm:text-start">
                    <h3 className="text-base font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                        Notification Preferences
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground/90 max-w-2xl">
                        {tx('settings.notificationsSubtitle', undefined, 'Choose exactly what you want to be notified about. We recommend keeping important alerts enabled.')}
                    </p>
                </div>

                <div className="relative z-10 space-y-4">
                    {notifications.map((item) => {
                        const Icon = iconMap[item.key as keyof typeof iconMap] || Bell;
                        const content = copy(item.key);

                        return (
                            <div 
                                key={item.id} 
                                onClick={() => handleToggle(item.key)}
                                className={`group flex items-center justify-between gap-3 rounded-xl border p-5 transition-all duration-300 cursor-pointer ${item.enabled ? 'border-brand/40 bg-brand/5 shadow-[0_0_30px_-10px_rgba(var(--brand),0.2)]' : 'border-white/5 bg-white dark:bg-slate-900/[0.01] hover:border-white/20 hover:bg-white dark:bg-slate-900/[0.03]'}`}
                            >
                                <div className="flex min-w-0 items-center gap-3">    
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-inner transition-colors duration-500 ${item.enabled ? 'bg-brand/20 text-brand border border-brand/30' : 'bg-white dark:bg-slate-900/5 text-muted-foreground border border-white/10'}`}>
                                        <Icon className={`h-6 w-6 ${item.enabled ? 'drop-shadow-[0_0_8px_rgba(var(--brand),0.8)]' : ''}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-base font-bold transition-colors duration-300 ${item.enabled ? 'text-foreground' : 'text-foreground/70'}`}>{content.label}</p>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground/80">{content.description}</p>
                                    </div>
                                </div>

                                <div className="shrink-0 flex items-center justify-center">
                                    <div className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-500 shadow-inner ${item.enabled ? 'bg-brand shadow-[0_0_15px_rgba(var(--brand),0.6)]' : 'bg-black/40 border border-white/10'}`}>
                                        <span
                                            className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-900 shadow-lg transition-transform duration-500 ease-in-out ${item.enabled ? 'translate-x-7' : 'translate-x-1'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}