import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
                setNotifications(DEFAULTS.map(n => ({ ...n, enabled: data[n.key] ?? n.enabled })));
            }
            setLoading(false);
        };
        
        fetchSettings();
    }, [user?.id]);

    const copy = (key: string) => {
        const map: Record<string, { label: string; description: string }> = {
            new_job: { label: tx('settings.notificationSettings.newMatches', undefined, 'New job matches'), description: tx('settings.notificationSettings.newMatchesDesc', undefined, 'Get notified when jobs match your skills') },
            messages: { label: tx('settings.notificationSettings.newMessages', undefined, 'Messages'), description: tx('settings.notificationSettings.newMessagesDesc', undefined, 'Get notified when you receive new messages') },
            payments: { label: tx('settings.notificationSettings.payments', undefined, 'Payments'), description: tx('settings.notificationSettings.paymentsDesc', undefined, 'Get notified when you send or receive payments') },
            reviews: { label: tx('settings.notificationSettings.reviews', undefined, 'Reviews'), description: tx('settings.notificationSettings.reviewsDesc', undefined, 'Get notified when you receive a new review') },
        };
        return map[key] ?? { label: tx('settings.notificationSettings.marketing', undefined, 'Offers and updates'), description: tx('settings.notificationSettings.marketingDesc', undefined, 'Tips and updates from Khedma') };
    };

    const handleToggle = async (key: string) => {
        if (!user?.id) return;
        // Optimistic update
        setNotifications(prev => prev.map(n => n.key === key ? { ...n, enabled: !n.enabled } : n));
        try {
            const settings: Record<string, boolean> = {};
            notifications.forEach(n => { settings[n.key] = n.key === key ? !n.enabled : n.enabled; });
            const { error } = await supabase
                .from('notification_settings')
                .upsert({ user_id: user.id, ...settings, updated_at: new Date().toISOString() });
            if (error) throw error;
        } catch (error) {
            logger.error('Error updating notification:', error);
            // Revert
            setNotifications(prev => prev.map(n => n.key === key ? { ...n, enabled: !n.enabled } : n));
        }
    };

    if (loading) {
        return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>;
    }

    return (
        <div className="space-y-4">
            <p className="text-muted mb-6">{tx('settings.notificationsSubtitle', undefined, 'Choose which notifications you want to receive')}</p>
            {notifications.map(n => (
                <div key={n.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
                    <div>
                        <p className="font-medium text-foreground">{copy(n.key).label}</p>
                        <p className="text-sm text-muted">{copy(n.key).description}</p>
                    </div>
                    <button
                        onClick={() => handleToggle(n.key)}
                        aria-label={n.enabled
                            ? tx('settings.disableNotification', { label: copy(n.key).label }, `Disable ${copy(n.key).label}`)
                            : tx('settings.enableNotification', { label: copy(n.key).label }, `Enable ${copy(n.key).label}`)}
                        aria-pressed={n.enabled}
                        className={`relative w-12 h-6 rounded-full transition-colors ${n.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${n.enabled ? 'end-1' : 'start-1'}`} />
                    </button>
                </div>
            ))}
        </div>
    );
}
