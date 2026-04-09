import { useEffect, useMemo, useState } from 'react';
import { Bell, BriefcaseBusiness, CreditCard, Loader2, MessageSquare, Megaphone, Star } from 'lucide-react';

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
    { id: '1', key: 'new_job', label: 'ÙˆØ¸Ø§Ø¦Ù Ø¬Ø¯ÙŠØ¯Ø© Ù…Ø·Ø§Ø¨Ù‚Ø©', description: 'Ø¥Ø´Ø¹Ø§Ø± Ø¹Ù†Ø¯ ÙˆØ¬ÙˆØ¯ ÙØ±Øµ Ø¹Ù…Ù„ ØªÙ†Ø§Ø³Ø¨ Ù…Ù‡Ø§Ø±Ø§ØªÙƒ', enabled: true },
    { id: '2', key: 'messages', label: 'Ø§Ù„Ø±Ø³Ø§Ø¦Ù„', description: 'Ø¥Ø´Ø¹Ø§Ø± Ø¹Ù†Ø¯ Ø§Ø³ØªÙ„Ø§Ù… Ø±Ø³Ø§Ø¦Ù„ Ø¬Ø¯ÙŠØ¯Ø©', enabled: true },
    { id: '3', key: 'payments', label: 'Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª', description: 'Ø¥Ø´Ø¹Ø§Ø± Ø¹Ù†Ø¯ Ø§Ø³ØªÙ„Ø§Ù… Ø£Ùˆ Ø¥Ø±Ø³Ø§Ù„ Ù…Ø¯ÙÙˆØ¹Ø§Øª', enabled: true },
    { id: '4', key: 'reviews', label: 'Ø§Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª', description: 'Ø¥Ø´Ø¹Ø§Ø± Ø¹Ù†Ø¯ Ø§Ø³ØªÙ„Ø§Ù… ØªÙ‚ÙŠÙŠÙ… Ø¬Ø¯ÙŠØ¯', enabled: true },
    { id: '5', key: 'marketing', label: 'Ø§Ù„Ø¹Ø±ÙˆØ¶ ÙˆØ§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª', description: 'Ù†ØµØ§Ø¦Ø­ ÙˆØ¹Ø±ÙˆØ¶ Ù…Ù† Ø®Ø¯Ù…Ø©.ØªÙ†', enabled: false },
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
            description: tx('settings.notificationSettings.marketingDesc', undefined, 'Tips and updates from Khedmetna'),
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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--workspace-primary)" }} />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {notifications.map((item) => {
                const Icon = iconMap[item.key as keyof typeof iconMap] || Bell;
                const content = copy(item.key);

                return (
                    <div 
                        key={item.id} 
                        className="flex items-center justify-between gap-4 p-4 rounded-lg border"
                        style={{
                            borderColor: "var(--color-border-subtle)",
                            background: "var(--color-background-elevated)",
                        }}
                    >
                        <div className="flex min-w-0 items-start gap-3">    
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5" style={{ background: "var(--color-background-subtle)" }}>
                                <Icon className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{content.label}</p>
                                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>{content.description}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleToggle(item.key)}
                            className="shrink-0 flex items-center justify-center"
                            aria-label={`Toggle ${content.label}`}
                        >
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200" style={{ background: item.enabled ? "var(--workspace-primary)" : "var(--color-background-subtle)" }}>
                                <span
                                    className="inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ease-in-out"
                                    style={{ 
                                        background: "var(--color-background-elevated)", 
                                        transform: item.enabled ? "translateX(1.5rem)" : "translateX(0.25rem)" 
                                    }}
                                />
                            </div>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

