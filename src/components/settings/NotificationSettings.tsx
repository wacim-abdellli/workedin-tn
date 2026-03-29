import { useEffect, useMemo, useState } from 'react';
import { Bell, BriefcaseBusiness, CreditCard, Loader2, MailOpen, MessageSquare, Megaphone, Star } from 'lucide-react';

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

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                        {tx('settings.notificationsEnabled', undefined, 'Enabled')}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#171420] dark:text-white">{enabledCount}</p>
                </div>
                <div className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                        {tx('settings.notificationsTotal', undefined, 'Available rules')}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#171420] dark:text-white">{notifications.length}</p>
                </div>
                <div className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                        {tx('settings.notificationChannel', undefined, 'Channel')}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#171420] dark:text-white">
                        <MailOpen className="h-4 w-4 text-primary-500" />
                        {tx('settings.notificationChannelValue', undefined, 'In-app + email-ready')}
                    </p>
                </div>
            </div>

            <div>
                <p className="text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                    {tx('settings.notificationsSubtitle', undefined, 'Choose which notifications you want to receive')}
                </p>
            </div>

            <div className="space-y-4">
                {notifications.map((item) => {
                    const Icon = iconMap[item.key as keyof typeof iconMap] || Bell;
                    const content = copy(item.key);

                    return (
                        <div key={item.id} className="flex items-start justify-between gap-4 rounded-[1.6rem] border border-primary-100/70 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="flex min-w-0 items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/8 dark:text-primary-300">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#171420] dark:text-white">{content.label}</p>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">{content.description}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleToggle(item.key)}
                                aria-label={item.enabled
                                    ? tx('settings.disableNotification', { label: content.label }, `Disable ${content.label}`)
                                    : tx('settings.enableNotification', { label: content.label }, `Enable ${content.label}`)}
                                aria-pressed={item.enabled}
                                className={`relative inline-flex h-7 w-14 shrink-0 rounded-full transition-colors ${item.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-white/15'}`}
                            >
                                <span
                                    className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start] duration-200"
                                    style={{ insetInlineStart: item.enabled ? '2.05rem' : '0.25rem' }}
                                />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
