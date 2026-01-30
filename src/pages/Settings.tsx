import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Bell,
    CreditCard,
    Shield,
    ChevronLeft,
    ChevronRight,
    Save,
    Camera,
    Trash2,
    Plus,
    Check,
    Loader2,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import OptimizedImage from '../components/common/OptimizedImage';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

type SettingsTab = 'profile' | 'notifications' | 'payment' | 'security';

interface NotificationSetting {
    id: string;
    label: string;
    description: string;
    key: string;
    enabled: boolean;
}

interface PaymentMethod {
    id: string;
    type: string;
    label: string;
    details: string;
    is_default: boolean;
}

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'payment', label: 'طرق الدفع', icon: CreditCard },
    { id: 'security', label: 'الأمان', icon: Shield },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSetting[] = [
    { id: '1', key: 'new_job', label: 'وظائف جديدة مطابقة', description: 'إشعار عند وجود فرص عمل تناسب مهاراتك', enabled: true },
    { id: '2', key: 'messages', label: 'الرسائل', description: 'إشعار عند استلام رسائل جديدة', enabled: true },
    { id: '3', key: 'payments', label: 'المدفوعات', description: 'إشعار عند استلام أو إرسال مدفوعات', enabled: true },
    { id: '4', key: 'reviews', label: 'التقييمات', description: 'إشعار عند استلام تقييم جديد', enabled: true },
    { id: '5', key: 'marketing', label: 'العروض والتحديثات', description: 'نصائح وعروض من خدمة.تن', enabled: false },
];

function Settings() {
    const { dir } = useTranslation();
    const { user, profile, signOut, refreshProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        bio: '',
        location: '',
    });

    // Notifications state
    const [notifications, setNotifications] = useState<NotificationSetting[]>(DEFAULT_NOTIFICATION_SETTINGS);

    // Payment methods state
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    // New payment method form
    const [newPaymentForm, setNewPaymentForm] = useState({
        type: 'd17',
        details: '',
    });

    const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

    // Load data on mount
    useEffect(() => {
        if (profile) {
            setProfileForm({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                email: '', // Email not stored in profile, would come from auth
                bio: profile.bio || '',
                location: profile.location || '',
            });
        }
        loadSettings();
    }, [profile]);

    const loadSettings = async () => {
        if (!user?.id) return;
        setIsLoading(true);

        try {
            // Load notification settings
            const { data: notifData } = await supabase
                .from('notification_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (notifData) {
                setNotifications(DEFAULT_NOTIFICATION_SETTINGS.map(n => ({
                    ...n,
                    enabled: notifData[n.key] ?? n.enabled,
                })));
            }

            // Load payment methods
            const { data: paymentData } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (paymentData && paymentData.length > 0) {
                setPaymentMethods(paymentData.map(p => ({
                    id: p.id,
                    type: p.type,
                    label: p.type === 'd17' ? 'D17' : p.type === 'flouci' ? 'Flouci' : 'تحويل بنكي',
                    details: p.details,
                    is_default: p.is_default,
                })));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profileForm.full_name,
                    bio: profileForm.bio,
                    location: profileForm.location,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            // Refresh the profile in auth context
            await refreshProfile?.();
            showToast('تم حفظ التغييرات بنجاح', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('حدث خطأ في حفظ التغييرات', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleNotification = async (key: string) => {
        if (!user?.id) return;

        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
        );

        try {
            // Upsert notification settings
            const settings: Record<string, boolean> = {};
            notifications.forEach(n => {
                settings[n.key] = n.key === key ? !n.enabled : n.enabled;
            });

            const { error } = await supabase
                .from('notification_settings')
                .upsert({
                    user_id: user.id,
                    ...settings,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error updating notification:', error);
            // Revert on error
            setNotifications((prev) =>
                prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
            );
        }
    };

    const handleSetDefaultPayment = async (id: string) => {
        if (!user?.id) return;

        try {
            // Remove default from all
            await supabase
                .from('payment_methods')
                .update({ is_default: false })
                .eq('user_id', user.id);

            // Set new default
            const { error } = await supabase
                .from('payment_methods')
                .update({ is_default: true })
                .eq('id', id);

            if (error) throw error;

            setPaymentMethods((prev) =>
                prev.map((p) => ({ ...p, is_default: p.id === id }))
            );
            showToast('تم تحديث طريقة الدفع الافتراضية', 'success');
        } catch (error) {
            console.error('Error setting default payment:', error);
            showToast('حدث خطأ', 'error');
        }
    };

    const handleDeletePayment = async (id: string) => {
        try {
            const { error } = await supabase
                .from('payment_methods')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
            showToast('تم حذف طريقة الدفع', 'success');
        } catch (error) {
            console.error('Error deleting payment method:', error);
            showToast('حدث خطأ في الحذف', 'error');
        }
    };

    const handleAddPayment = async () => {
        if (!user?.id || !newPaymentForm.details) return;

        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .insert({
                    user_id: user.id,
                    type: newPaymentForm.type,
                    details: newPaymentForm.details,
                    is_default: paymentMethods.length === 0,
                })
                .select()
                .single();

            if (error) throw error;

            setPaymentMethods(prev => [...prev, {
                id: data.id,
                type: data.type,
                label: data.type === 'd17' ? 'D17' : data.type === 'flouci' ? 'Flouci' : 'تحويل بنكي',
                details: data.details,
                is_default: data.is_default,
            }]);

            setNewPaymentForm({ type: 'd17', details: '' });
            setIsAddPaymentModalOpen(false);
            showToast('تم إضافة طريقة الدفع', 'success');
        } catch (error) {
            console.error('Error adding payment method:', error);
            showToast('حدث خطأ في الإضافة', 'error');
        }
    };

    const handleDeleteAccount = async () => {
        showToast('تم إرسال طلب حذف الحساب. سيتم معالجته خلال 48 ساعة.', 'info');
        setIsDeleteModalOpen(false);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/avatar.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            await supabase
                .from('profiles')
                .update({ avatar_url: urlData.publicUrl })
                .eq('id', user.id);

            await refreshProfile?.();
            showToast('تم تحديث الصورة الشخصية', 'success');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToast('حدث خطأ في رفع الصورة', 'error');
        }
    };

    const renderProfileTab = () => (
        <div className="space-y-6">
            {/* Avatar and User Info */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    {profile?.avatar_url ? (
                        <OptimizedImage
                            src={profile.avatar_url}
                            alt={profileForm.full_name}
                            className="w-24 h-24 rounded-2xl"
                            imgClassName="object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold">
                            {profileForm.full_name.charAt(0) || 'U'}
                        </div>
                    )}
                    <label className="absolute -bottom-2 -end-2 w-8 h-8 bg-primary-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors cursor-pointer">
                        <Camera className="w-4 h-4" />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                    </label>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg">{profileForm.full_name || 'المستخدم'}</h3>
                    <p className="text-muted">{profileForm.phone}</p>
                    {/* User Type and Status Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {/* User Type Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${profile?.user_type === 'freelancer'
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                            : profile?.user_type === 'client'
                                ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400'
                                : profile?.user_type === 'both'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}>
                            <User className="w-3 h-3" />
                            {profile?.user_type === 'freelancer' ? 'مستقل'
                                : profile?.user_type === 'client' ? 'صاحب مشروع'
                                    : profile?.user_type === 'both' ? 'كلاهما'
                                        : 'غير محدد'}
                        </span>

                        {/* Verification Status Badge */}
                        {profile?.cin_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <Check className="w-3 h-3" />
                                هوية موثقة
                            </span>
                        ) : profile?.cin_submitted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                قيد المراجعة
                            </span>
                        ) : (
                            <button
                                onClick={() => navigate('/verify-identity')}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Shield className="w-3 h-3" />
                                وثّق هويتك
                            </button>
                        )}

                        {/* Onboarding Status - show button to complete if not done */}
                        {profile?.onboarding_completed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                <Check className="w-3 h-3" />
                                الملف مكتمل
                            </span>
                        ) : (
                            <button
                                onClick={() => navigate(profile?.user_type === 'client' ? '/onboarding/client' : '/onboarding/freelancer')}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                            >
                                <User className="w-3 h-3" />
                                أكمل ملفك الشخصي
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Completion Widget */}
            {(() => {
                // Calculate profile completion
                const fields = [
                    { key: 'full_name', label: 'الاسم', value: profile?.full_name },
                    { key: 'avatar_url', label: 'الصورة الشخصية', value: profile?.avatar_url },
                    { key: 'location', label: 'الموقع', value: profile?.location },
                    { key: 'bio', label: 'نبذة عني', value: profile?.bio },
                    { key: 'user_type', label: 'نوع الحساب', value: profile?.user_type },
                    { key: 'cin_submitted', label: 'توثيق الهوية', value: profile?.cin_submitted },
                    { key: 'onboarding_completed', label: 'إكمال الملف', value: profile?.onboarding_completed },
                ];
                const completed = fields.filter(f => f.value).length;
                const total = fields.length;
                const percentage = Math.round((completed / total) * 100);
                const missing = fields.filter(f => !f.value);

                return (
                    <div className={`p-4 rounded-2xl border-2 ${percentage === 100
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-sm">اكتمال الملف الشخصي</span>
                            <span className={`text-lg font-bold ${percentage === 100 ? 'text-green-600' : 'text-orange-600'
                                }`}>{percentage}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'
                                    }`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        {missing.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-xs text-muted">المطلوب:</span>
                                {missing.slice(0, 3).map(m => (
                                    <span key={m.key} className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 rounded border">{m.label}</span>
                                ))}
                                {missing.length > 3 && (
                                    <span className="text-xs text-muted">+{missing.length - 3} آخرين</span>
                                )}
                            </div>
                        )}
                    </div>
                );
            })()}
            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="الاسم الكامل"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                />
                <Input
                    label="رقم الهاتف"
                    value={profileForm.phone}
                    disabled
                />
                <Input
                    label="البريد الإلكتروني (اختياري)"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="email@example.com"
                />
                <Input
                    label="الموقع"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                />
            </div>

            {/* User Type Selection */}
            <div className="mt-6">
                <label className="block text-sm font-medium text-foreground mb-3">نوع الحساب</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { type: 'freelancer', label: 'مستقل', desc: 'أقدم خدماتي' },
                        { type: 'client', label: 'صاحب مشروع', desc: 'أبحث عن مستقلين' },
                        { type: 'both', label: 'كلاهما', desc: 'الاثنين معاً' },
                    ].map(({ type, label, desc }) => (
                        <button
                            key={type}
                            type="button"
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Settings: Switching to', type, 'user?.id:', user?.id);
                                if (!user?.id) {
                                    showToast('خطأ: لا يوجد مستخدم', 'error');
                                    return;
                                }
                                try {
                                    const { error } = await supabase
                                        .from('profiles')
                                        .update({ user_type: type })
                                        .eq('id', user.id);

                                    if (error) {
                                        console.error('Supabase update error:', error);
                                        showToast('فشل التحديث: ' + error.message, 'error');
                                        return;
                                    }

                                    await refreshProfile();
                                    showToast('تم تحديث نوع الحساب بنجاح!', 'success');
                                } catch (err: any) {
                                    console.error('Exception:', err);
                                    showToast('خطأ غير متوقع: ' + err.message, 'error');
                                }
                            }}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${profile?.user_type === type
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                }`}
                        >
                            <span className={`font-medium block ${profile?.user_type === type ? 'text-primary-600' : ''}`}>{label}</span>
                            <span className="text-xs text-muted">{desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">نبذة عني</label>
                <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows={4}
                    className="input-base w-full resize-none"
                    placeholder="اكتب نبذة مختصرة عن نفسك..."
                />
            </div>

            <div className="flex justify-end">
                <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                >
                    حفظ التغييرات
                </Button>
            </div>
        </div>
    );

    const renderNotificationsTab = () => (
        <div className="space-y-4">
            <p className="text-muted mb-6">اختر الإشعارات التي تريد استلامها</p>

            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-xl"
                >
                    <div>
                        <p className="font-medium text-foreground">{notification.label}</p>
                        <p className="text-sm text-muted">{notification.description}</p>
                    </div>
                    <button
                        onClick={() => handleToggleNotification(notification.key)}
                        className={`
                            relative w-12 h-6 rounded-full transition-colors
                            ${notification.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'}
                        `}
                    >
                        <span
                            className={`
                                absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
                                ${notification.enabled ? 'end-1' : 'start-1'}
                            `}
                        />
                    </button>
                </div>
            ))}
        </div>
    );

    const renderPaymentTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-muted">طرق الدفع والاستلام</p>
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setIsAddPaymentModalOpen(true)}
                >
                    إضافة طريقة
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
            ) : (
                <div className="space-y-4">
                    {paymentMethods.map((method) => (
                        <div
                            key={method.id}
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-dark-700 rounded-xl"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-dark-800 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{method.label}</p>
                                    <p className="text-sm text-muted">{method.details}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {method.is_default ? (
                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        افتراضي
                                    </span>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSetDefaultPayment(method.id)}
                                    >
                                        تعيين كافتراضي
                                    </Button>
                                )}
                                <button
                                    onClick={() => handleDeletePayment(method.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {paymentMethods.length === 0 && !isLoading && (
                <div className="text-center py-12 bg-gray-50 dark:bg-dark-800 rounded-xl">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted">لم تضف أي طريقة دفع بعد</p>
                </div>
            )}
        </div>
    );

    const renderSecurityTab = () => (
        <div className="space-y-6">
            {/* Password Change */}
            <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <h3 className="font-bold mb-2 text-foreground">تغيير كلمة المرور</h3>
                <p className="text-muted text-sm mb-4">لا توجد كلمة مرور - أنت تستخدم تسجيل الدخول عبر الهاتف</p>
                <Button variant="outline" disabled>
                    إضافة كلمة مرور
                </Button>
            </div>

            {/* Session Info */}
            <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <h3 className="font-bold mb-2 text-foreground">الجلسات النشطة</h3>
                <p className="text-muted text-sm mb-4">هذا الجهاز هو الجهاز النشط الوحيد</p>
                <Button variant="outline" onClick={handleLogout}>
                    تسجيل الخروج من كل الأجهزة
                </Button>
            </div>

            {/* Delete Account */}
            <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
                <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">حذف الحساب</h3>
                <p className="text-red-600 dark:text-red-300 text-sm mb-4">
                    سيتم حذف حسابك وجميع بياناتك بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
                </p>
                <Button
                    variant="danger"
                    onClick={() => setIsDeleteModalOpen(true)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                >
                    حذف حسابي
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
            <SEO {...SEO_CONFIG.settings} url="/settings" noIndex />
            <Header />

            <div className="container-custom py-8">
                <h1 className="text-2xl font-bold mb-8">الإعدادات</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <nav className="space-y-2">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-start transition-colors
                                        ${activeTab === tab.id
                                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                            : 'hover:bg-gray-100 dark:hover:bg-dark-800 text-muted'
                                        }
                                    `}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                    <ArrowIcon className="w-4 h-4 ms-auto" />
                                </button>
                            ))}
                        </nav>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                            <span className="font-medium">تسجيل الخروج</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="card">
                            <h2 className="text-xl font-bold mb-6">
                                {TABS.find((t) => t.id === activeTab)?.label}
                            </h2>

                            {activeTab === 'profile' && renderProfileTab()}
                            {activeTab === 'notifications' && renderNotificationsTab()}
                            {activeTab === 'payment' && renderPaymentTab()}
                            {activeTab === 'security' && renderSecurityTab()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Account Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="تأكيد حذف الحساب"
            >
                <div className="space-y-4">
                    <p className="text-muted">
                        هل أنت متأكد من رغبتك في حذف حسابك؟ سيتم حذف جميع بياناتك بشكل نهائي.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            إلغاء
                        </Button>
                        <Button variant="danger" onClick={handleDeleteAccount}>
                            نعم، احذف حسابي
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add Payment Method Modal */}
            <Modal
                isOpen={isAddPaymentModalOpen}
                onClose={() => setIsAddPaymentModalOpen(false)}
                title="إضافة طريقة دفع"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">نوع طريقة الدفع</label>
                        <select
                            value={newPaymentForm.type}
                            onChange={(e) => setNewPaymentForm({ ...newPaymentForm, type: e.target.value })}
                            className="input-base w-full"
                        >
                            <option value="d17">D17</option>
                            <option value="flouci">Flouci</option>
                            <option value="bank_transfer">تحويل بنكي</option>
                        </select>
                    </div>
                    <Input
                        label="تفاصيل الدفع"
                        value={newPaymentForm.details}
                        onChange={(e) => setNewPaymentForm({ ...newPaymentForm, details: e.target.value })}
                        placeholder={newPaymentForm.type === 'bank_transfer' ? 'رقم الحساب البنكي' : 'رقم الهاتف'}
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsAddPaymentModalOpen(false)}>
                            إلغاء
                        </Button>
                        <Button variant="primary" onClick={handleAddPayment} disabled={!newPaymentForm.details}>
                            إضافة
                        </Button>
                    </div>
                </div>
            </Modal>

            <Footer />
        </div>
    );
}

export default Settings;
