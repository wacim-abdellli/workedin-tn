import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    User,
    BriefcaseBusiness,
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
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { getWorkspaceOnboardingPath, getWorkspaceSetupProgress, isWorkspaceReady } from '@/lib/workspaceRoutes';
import { switchWorkspace } from '@/lib/switchWorkspace';

type SettingsTab = 'account' | 'profile' | 'notifications' | 'payment' | 'security';

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
    const { dir, t, tx } = useTranslation();
    const { user, profile, freelancerProfile, activeMode, signOut, refreshProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { tab } = useParams<{ tab: string }>();
    const [searchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = useMemo(() => {
        void TABS;

        return [
            { id: 'account', label: t.settings.account, icon: BriefcaseBusiness },
            { id: 'profile', label: t.settings.profile, icon: User },
            { id: 'notifications', label: t.settings.notifications, icon: Bell },
            { id: 'payment', label: t.settings.payment, icon: CreditCard },
            { id: 'security', label: t.settings.privacy, icon: Shield },
        ];
    }, [t.settings.account, t.settings.notifications, t.settings.payment, t.settings.privacy, t.settings.profile]);

    useEffect(() => {
        const targetTab = tab || searchParams.get('tab');
        if (targetTab && tabs.some(t => t.id === targetTab)) {
            setActiveTab(targetTab as SettingsTab);
        }
    }, [searchParams, tab, tabs]);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingPayment, setIsSavingPayment] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState<'freelancer' | 'client' | null>(null);

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

    const notificationCopy = (key: string) => {
        if (key === 'new_job') {
            return {
                label: tx('settings.notificationSettings.newMatches', undefined, 'New job matches'),
                description: tx('settings.notificationSettings.newMatchesDesc', undefined, 'Get notified when jobs match your skills'),
            };
        }
        if (key === 'messages') {
            return {
                label: tx('settings.notificationSettings.newMessages', undefined, 'Messages'),
                description: tx('settings.notificationSettings.newMessagesDesc', undefined, 'Get notified when you receive new messages'),
            };
        }
        if (key === 'payments') {
            return {
                label: tx('settings.notificationSettings.payments', undefined, 'Payments'),
                description: tx('settings.notificationSettings.paymentsDesc', undefined, 'Get notified when you send or receive payments'),
            };
        }
        if (key === 'reviews') {
            return {
                label: tx('settings.notificationSettings.reviews', undefined, 'Reviews'),
                description: tx('settings.notificationSettings.reviewsDesc', undefined, 'Get notified when you receive a new review'),
            };
        }
        return {
            label: tx('settings.notificationSettings.marketing', undefined, 'Offers and updates'),
            description: tx('settings.notificationSettings.marketingDesc', undefined, 'Tips and updates from Khedma'),
        };
    };

    // Keep form fields synced with profile updates.
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
    }, [profile]);

    // Load settings once per authenticated user, not on every profile object refresh.
    useEffect(() => {
        if (!user?.id) return;
        void loadSettings();
    }, [user?.id]);

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
                        label: p.type === 'd17' ? 'D17' : p.type === 'flouci' ? 'Flouci' : tx('settings.bankTransfer', undefined, 'Bank transfer'),
                    details: p.details,
                    is_default: p.is_default,
                })));
            }
        } catch (error) {
            logger.error('Error loading settings:', error);
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
            showToast(tx('settings.toasts.profileSaved', undefined, 'Profile updated successfully'), 'success');
        } catch (error) {
            logger.error('Error saving profile:', error);
            showToast(tx('settings.toasts.profileSaveError', undefined, 'Failed to save profile changes'), 'error');
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
            logger.error('Error updating notification:', error);
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
            showToast(tx('settings.toasts.defaultPaymentUpdated', undefined, 'Default payment method updated'), 'success');
        } catch (error) {
            logger.error('Error setting default payment:', error);
            showToast(tx('settings.toasts.genericError', undefined, 'Something went wrong'), 'error');
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
            showToast(tx('settings.toasts.paymentDeleted', undefined, 'Payment method deleted'), 'success');
        } catch (error) {
            logger.error('Error deleting payment method:', error);
            showToast(tx('settings.toasts.paymentDeleteError', undefined, 'Failed to delete payment method'), 'error');
        }
    };

    const handleAddPayment = async () => {
        if (!user?.id || !newPaymentForm.details) return;

        setIsSavingPayment(true);

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
                label: data.type === 'd17' ? 'D17' : data.type === 'flouci' ? 'Flouci' : tx('settings.bankTransfer', undefined, 'Bank transfer'),
                details: data.details,
                is_default: data.is_default,
            }]);

            setNewPaymentForm({ type: 'd17', details: '' });
            setIsAddPaymentModalOpen(false);
            showToast(tx('settings.toasts.paymentAdded', undefined, 'Payment method added'), 'success');
        } catch (error) {
            logger.error('Error adding payment method:', error);
            showToast(tx('settings.toasts.paymentAddError', undefined, 'Failed to add payment method'), 'error');
        } finally {
            setIsSavingPayment(false);
        }
    };

    const handleDeleteAccount = async () => {
        showToast(tx('settings.toasts.deleteRequestSent'), 'info');
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
            showToast(tx('settings.toasts.avatarUpdated', undefined, 'Profile image updated'), 'success');
        } catch (error) {
            logger.error('Error uploading avatar:', error);
            showToast(tx('settings.toasts.avatarUpdateError', undefined, 'Failed to upload profile image'), 'error');
        }
    };

    const handleWorkspaceSelection = async (type: 'freelancer' | 'client' | 'both') => {
        const userId = user?.id;
        if (!userId) return;

        if (type !== 'both') {
            setIsSwitchingWorkspace(type);
        }

        if (type !== 'both') {
            try {
                await switchWorkspace({
                    userId,
                    targetWorkspace: type,
                    currentUserType: profile?.user_type ?? 'client',
                    profile,
                    freelancerProfile,
                    navigate,
                });
            } catch (error) {
                logger.error('Workspace selection error:', error);
                showToast(t.auth.accountPanel.switchError, 'error');
            } finally {
                window.setTimeout(() => setIsSwitchingWorkspace(null), 350);
            }
            return;
        }

        try {
            if (type === 'both') {
                const { error } = await supabase
                    .from('profiles')
                    .update({ user_type: 'both' })
                    .eq('id', userId);

                if (error) throw error;

                if (!freelancerProfile) {
                    const { error: freelancerError } = await supabase
                        .from('freelancer_profiles')
                        .upsert({
                            id: userId,
                            skills: [],
                            availability: 'available',
                        });

                    if (freelancerError) throw freelancerError;
                }

                await refreshProfile();
                showToast(tx('settings.toasts.workspaceBothEnabled', undefined, 'Both workspaces are now enabled on your account.'), 'success');
                return;
            }

            showToast(tx('settings.toasts.workspaceUpdated', undefined, 'Workspace updated successfully.'), 'success');
        } catch (error) {
            logger.error('Workspace selection error:', error);
            const errorMessage = error instanceof Error ? error.message : tx('common.error', undefined, 'An unexpected error occurred');
            showToast(t.common.error + ': ' + errorMessage, 'error');
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
                        <div
                            className="flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${getAvatarGradient(profileForm.full_name || 'User').join(', ')})` }}
                        >
                            {getInitials(profileForm.full_name || 'User')}
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
                    <h3 className="font-bold text-lg">{profileForm.full_name || tx('settings.userFallback', undefined, 'User')}</h3>
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
                            {profile?.user_type === 'freelancer' ? tx('settings.accountTypeFreelancer', undefined, 'Freelancer')
                                : profile?.user_type === 'client' ? tx('settings.accountTypeClient', undefined, 'Client')
                                    : profile?.user_type === 'both' ? tx('settings.accountTypeBoth', undefined, 'Both')
                                        : tx('settings.accountTypeUnknown', undefined, 'Not set')}
                        </span>

                        {/* Verification Status Badge */}
                        {profile?.cin_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <Check className="w-3 h-3" />
                                {tx('settings.identityVerified', undefined, 'Identity verified')}
                            </span>
                        ) : profile?.cin_submitted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {tx('settings.identityPending', undefined, 'Under review')}
                            </span>
                        ) : (
                            <button
                                onClick={() => navigate('/verify-identity')}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Shield className="w-3 h-3" />
                                {tx('settings.verifyIdentity', undefined, 'Verify your identity')}
                            </button>
                        )}

                        {/* Onboarding Status - show button to complete if not done */}
                        {isWorkspaceReady(profile, freelancerProfile, activeMode) ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                <Check className="w-3 h-3" />
                                {tx('settings.profileComplete', undefined, 'Profile complete')}
                            </span>
                        ) : (
                            <button
                                onClick={() => navigate(getWorkspaceOnboardingPath(activeMode))}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                            >
                                <User className="w-3 h-3" />
                                {tx('settings.completeProfile', undefined, 'Complete your profile')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Completion Widget */}
            {(() => {
                // Calculate profile completion
                const fields = [
                    { key: 'full_name', label: tx('settings.completion.fullName', undefined, 'Name'), value: profile?.full_name },
                    { key: 'avatar_url', label: tx('settings.completion.avatar', undefined, 'Profile photo'), value: profile?.avatar_url },
                    { key: 'location', label: tx('settings.completion.location', undefined, 'Location'), value: profile?.location },
                    { key: 'bio', label: tx('settings.completion.bio', undefined, 'Bio'), value: profile?.bio },
                    { key: 'user_type', label: tx('settings.completion.accountType', undefined, 'Account type'), value: profile?.user_type },
                    { key: 'cin_submitted', label: tx('settings.completion.identityVerification', undefined, 'Identity verification'), value: profile?.cin_submitted },
                    { key: 'onboarding_completed', label: tx('settings.completion.onboarding', undefined, 'Onboarding'), value: profile?.onboarding_completed },
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
                            <span className="font-medium text-sm">{tx('settings.profileCompletionTitle', undefined, 'Profile completion')}</span>
                            <span className={`text-lg font-bold ${percentage === 100 ? 'text-green-600' : 'text-orange-600'
                                }`}>{percentage}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-[width] duration-300 ${percentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'
                                    }`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        {missing.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-xs text-muted">{tx('settings.requiredLabel', undefined, 'Required:')}</span>
                                {missing.slice(0, 3).map(m => (
                                    <span key={m.key} className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 rounded border">{m.label}</span>
                                ))}
                                {missing.length > 3 && (
                                    <span className="text-xs text-muted">{tx('settings.moreRequired', { count: missing.length - 3 }, `+${missing.length - 3} more`)}</span>
                                )}
                            </div>
                        )}
                    </div>
                );
            })()}
            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label={tx('settings.fullName', undefined, 'Full name')}
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                />
                <Input
                    label={tx('settings.phoneNumberLabel', undefined, 'Phone number')}
                    value={profileForm.phone}
                    disabled
                />
                <Input
                    label={tx('settings.emailOptionalLabel', undefined, 'Email (optional)')}
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder={tx('settings.emailPlaceholder', undefined, 'email@example.com')}
                />
                <Input
                    label={tx('settings.location', undefined, 'Location')}
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                />
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">{t.auth.accountPanel.sectionLabel}</p>
                        <h4 className="mt-2 text-lg font-semibold text-foreground">{t.auth.accountPanel.switchWorkspace}</h4>
                        <p className="mt-1 text-sm text-muted">
                            {profile?.user_type === 'both'
                                ? t.auth.accountPanel.switchWorkspaceBoth
                                : t.auth.accountPanel.switchWorkspaceSingle}
                        </p>
                    </div>
                    {!isWorkspaceReady(profile, freelancerProfile, activeMode) ? (
                        <Button variant="primary" onClick={() => navigate(getWorkspaceOnboardingPath(activeMode))}>
                            {t.auth.accountPanel.completeSetup}
                        </Button>
                    ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200/80 bg-gray-50/90 p-4 dark:border-white/8 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${activeMode === 'freelancer'
                                ? 'border-violet-500/20 bg-violet-500/12 text-violet-700 dark:text-violet-200'
                                : 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200'
                                }`}>
                                {activeMode === 'freelancer' ? t.auth.accountPanel.freelancerLabel : t.auth.accountPanel.clientLabel}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {isWorkspaceReady(profile, freelancerProfile, activeMode)
                                    ? t.auth.accountPanel.ready
                                    : t.auth.accountPanel.needsSetup}
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-muted">
                            {getWorkspaceSetupProgress(profile, freelancerProfile, activeMode)}%
                        </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                        <div
                            className={`h-full rounded-full transition-[width] duration-300 ${activeMode === 'freelancer'
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-400'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                }`}
                            style={{ width: `${getWorkspaceSetupProgress(profile, freelancerProfile, activeMode)}%` }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-muted">{t.auth.accountPanel.progressLabel}</p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                        {
                            type: 'freelancer' as const,
                            label: t.auth.accountPanel.freelancerLabel,
                            desc: t.auth.accountPanel.freelancerDesc,
                            tone: 'border-violet-300/30 bg-violet-500/[0.05] dark:border-violet-500/20 dark:bg-violet-500/[0.08]',
                            chip: 'border-violet-400/20 bg-violet-500/12 text-violet-700 dark:text-violet-200',
                        },
                        {
                            type: 'client' as const,
                            label: t.auth.accountPanel.clientLabel,
                            desc: t.auth.accountPanel.clientDesc,
                            tone: 'border-emerald-300/30 bg-emerald-500/[0.05] dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]',
                            chip: 'border-emerald-400/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200',
                        },
                    ].map(({ type, label, desc, tone, chip }) => {
                        const isActive = activeMode === type;
                        const isAvailable = profile?.user_type === 'both' || profile?.user_type === type;
                        const actionLabel = isActive
                            ? t.auth.accountPanel.current
                            : isAvailable
                                ? t.auth.accountPanel.switchAction
                                : t.auth.accountPanel.enable;

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void handleWorkspaceSelection(type);
                                }}
                                disabled={isActive || isSwitchingWorkspace !== null}
                                className={`rounded-2xl border p-4 text-left transition-colors ${isActive
                                    ? tone
                                    : 'border-gray-200 bg-white hover:border-primary-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-primary-500/30'
                                    } ${isActive ? 'cursor-default' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">{label}</div>
                                        <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
                                    </div>
                                    <span className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${chip}`}>
                                        {isSwitchingWorkspace === type ? (
                                            <>
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {t.auth.accountPanel.switching}
                                            </>
                                        ) : actionLabel}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* User Type Selection */}
            <div className="hidden mt-6">
                <label className="block text-sm font-medium text-foreground mb-3">{tx('settings.accountType', undefined, 'Account type')}</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { type: 'freelancer', label: tx('settings.accountTypeFreelancer', undefined, 'Freelancer'), desc: tx('settings.accountTypeFreelancerDesc', undefined, 'Offer my services') },
                        { type: 'client', label: tx('settings.accountTypeClient', undefined, 'Client'), desc: tx('settings.accountTypeClientDesc', undefined, 'Hire freelancers') },
                        { type: 'both', label: tx('settings.accountTypeBoth', undefined, 'Both'), desc: tx('settings.accountTypeBothDesc', undefined, 'Use both modes') },
                    ].map(({ type, label, desc }) => (
                        <button
                            key={type}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void handleWorkspaceSelection(type as 'freelancer' | 'client' | 'both');
                            }}
                            className={`p-3 rounded-xl border-2 transition-colors text-center ${((type === 'both' && profile?.user_type === 'both') || (type !== 'both' && activeMode === type))
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                }`}
                        >
                            <span className={`font-medium block ${((type === 'both' && profile?.user_type === 'both') || (type !== 'both' && activeMode === type)) ? 'text-primary-600' : ''}`}>{label}</span>
                            <span className="text-xs text-muted">{desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="label">{tx('settings.bioLabel', undefined, 'Bio')}</label>
                <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows={4}
                    className="input-base w-full resize-none"
                    placeholder={tx('settings.bioPlaceholder', undefined, 'Write a short bio about yourself...')}
                />
            </div>

            <div className="flex justify-end">
                <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                >
                    {tx('settings.saveChanges', undefined, 'Save changes')}
                </Button>
            </div>
        </div>
    );

    const renderAccountTab = () => (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">{t.auth.accountPanel.sectionLabel}</p>
                        <h4 className="mt-2 text-lg font-semibold text-foreground">{t.auth.accountPanel.switchWorkspace}</h4>
                        <p className="mt-1 text-sm text-muted">
                            {profile?.user_type === 'both'
                                ? t.auth.accountPanel.switchWorkspaceBoth
                                : t.auth.accountPanel.switchWorkspaceSingle}
                        </p>
                    </div>
                    {!isWorkspaceReady(profile, freelancerProfile, activeMode) ? (
                        <Button variant="primary" onClick={() => navigate(getWorkspaceOnboardingPath(activeMode))}>
                            {t.auth.accountPanel.completeSetup}
                        </Button>
                    ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200/80 bg-gray-50/90 p-4 dark:border-white/8 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${activeMode === 'freelancer'
                                ? 'border-violet-500/20 bg-violet-500/12 text-violet-700 dark:text-violet-200'
                                : 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200'
                                }`}>
                                {activeMode === 'freelancer' ? t.auth.accountPanel.freelancerLabel : t.auth.accountPanel.clientLabel}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {isWorkspaceReady(profile, freelancerProfile, activeMode)
                                    ? t.auth.accountPanel.ready
                                    : t.auth.accountPanel.needsSetup}
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-muted">
                            {getWorkspaceSetupProgress(profile, freelancerProfile, activeMode)}%
                        </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                        <div
                            className={`h-full rounded-full transition-[width] duration-300 ${activeMode === 'freelancer'
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-400'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                }`}
                            style={{ width: `${getWorkspaceSetupProgress(profile, freelancerProfile, activeMode)}%` }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-muted">{t.auth.accountPanel.progressLabel}</p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                        {
                            type: 'freelancer' as const,
                            label: t.auth.accountPanel.freelancerLabel,
                            desc: t.auth.accountPanel.freelancerDesc,
                            tone: 'border-violet-300/30 bg-violet-500/[0.05] dark:border-violet-500/20 dark:bg-violet-500/[0.08]',
                            chip: 'border-violet-400/20 bg-violet-500/12 text-violet-700 dark:text-violet-200',
                        },
                        {
                            type: 'client' as const,
                            label: t.auth.accountPanel.clientLabel,
                            desc: t.auth.accountPanel.clientDesc,
                            tone: 'border-emerald-300/30 bg-emerald-500/[0.05] dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]',
                            chip: 'border-emerald-400/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200',
                        },
                    ].map(({ type, label, desc, tone, chip }) => {
                        const isActive = activeMode === type;
                        const isAvailable = profile?.user_type === 'both' || profile?.user_type === type;
                        const actionLabel = isActive
                            ? t.auth.accountPanel.current
                            : isAvailable
                                ? t.auth.accountPanel.switchAction
                                : t.auth.accountPanel.enable;

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void handleWorkspaceSelection(type);
                                }}
                                disabled={isActive || isSwitchingWorkspace !== null}
                                className={`rounded-2xl border p-4 text-left transition-colors ${isActive
                                    ? tone
                                    : 'border-gray-200 bg-white hover:border-primary-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-primary-500/30'
                                    } ${isActive ? 'cursor-default' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">{label}</div>
                                        <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
                                    </div>
                                    <span className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${chip}`}>
                                        {isSwitchingWorkspace === type ? (
                                            <>
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {t.auth.accountPanel.switching}
                                            </>
                                        ) : actionLabel}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderNotificationsTab = () => (
        <div className="space-y-4">
            <p className="text-muted mb-6">{tx('settings.notificationsSubtitle', undefined, 'Choose which notifications you want to receive')}</p>

            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-xl"
                >
                    <div>
                        <p className="font-medium text-foreground">{notificationCopy(notification.key).label}</p>
                        <p className="text-sm text-muted">{notificationCopy(notification.key).description}</p>
                    </div>
                    <button
                        onClick={() => handleToggleNotification(notification.key)}
                        aria-label={notification.enabled
                            ? tx('settings.disableNotification', { label: notificationCopy(notification.key).label }, `Disable ${notificationCopy(notification.key).label}`)
                            : tx('settings.enableNotification', { label: notificationCopy(notification.key).label }, `Enable ${notificationCopy(notification.key).label}`)}
                        aria-pressed={notification.enabled}
                        className={`
                            relative w-12 h-6 rounded-full transition-colors
                            ${notification.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'}
                        `}
                    >
                        <span
                            className={`
                                absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
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
                <p className="text-muted">{tx('settings.paymentSubtitle', undefined, 'Payment and payout methods')}</p>
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setIsAddPaymentModalOpen(true)}
                >
                    {tx('settings.addMethod', undefined, 'Add method')}
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
                                        {tx('settings.default', undefined, 'Default')}
                                    </span>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSetDefaultPayment(method.id)}
                                    >
                                        {tx('settings.setDefault', undefined, 'Set as default')}
                                    </Button>
                                )}
                                <button
                                    onClick={() => handleDeletePayment(method.id)}
                                    aria-label={tx('settings.deletePaymentMethod', { label: method.label }, `Delete ${method.label}`)}
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
                    <p className="text-muted">{tx('settings.noPaymentMethods', undefined, 'No payment method added yet')}</p>
                </div>
            )}
        </div>
    );

    const renderSecurityTab = () => (
        <div className="space-y-6">
            {/* Password Change */}
            <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <h3 className="font-bold mb-2 text-foreground">{tx('settings.changePasswordTitle', undefined, 'Change password')}</h3>
                <p className="text-muted text-sm mb-4">{tx('settings.noPasswordMessage', undefined, 'No password set - you are using phone sign in')}</p>
                <Button variant="outline" disabled>
                    {tx('settings.addPassword', undefined, 'Add password')}
                </Button>
            </div>

            {/* Session Info */}
            <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <h3 className="font-bold mb-2 text-foreground">{tx('settings.activeSessionsTitle', undefined, 'Active sessions')}</h3>
                <p className="text-muted text-sm mb-4">{tx('settings.activeSessionsMessage', undefined, 'This device is your only active session')}</p>
                <Button variant="outline" onClick={handleLogout}>
                    {tx('settings.signOutAllDevices', undefined, 'Sign out from all devices')}
                </Button>
            </div>

            {/* Delete Account */}
            <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
                <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">{tx('settings.deleteAccountTitle', undefined, 'Delete account')}</h3>
                <p className="text-red-600 dark:text-red-300 text-sm mb-4">
                    {tx('settings.deleteAccountDescription', undefined, 'Your account and all data will be permanently deleted. This action cannot be undone.')}
                </p>
                <Button
                    variant="danger"
                    onClick={() => setIsDeleteModalOpen(true)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                >
                    {tx('settings.deleteMyAccount', undefined, 'Delete my account')}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="page-shell transition-colors duration-300">
            <SEO {...SEO_CONFIG.settings} url="/settings" noIndex />
            <Header />

            <div className="page-shell-content">
                <h1 className="text-2xl font-bold mb-8">{tx('settings.pageTitle', undefined, 'Settings')}</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <nav className="sticky top-28 space-y-2 rounded-[28px] border border-gray-100 bg-white p-3 shadow-sm dark:border-white/5 dark:bg-[#1a1825]">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-start transition-colors
                                        ${activeTab === tab.id
                                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
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
                            className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-white px-4 py-3 text-red-600 transition-colors hover:bg-red-50/80 dark:border-red-500/20 dark:bg-[#1a1825] dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                            <ChevronRight className="w-5 h-5" />
                            <span className="font-medium">{tx('settings.logout', undefined, 'Sign out')}</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1825] sm:p-8">
                            <h2 className="mb-6 text-xl font-bold text-[#1a1825] dark:text-white">
                                {tabs.find((t) => t.id === activeTab)?.label}
                            </h2>

                            {activeTab === 'account' && renderAccountTab()}
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
                title={tx('settings.deleteAccountConfirmTitle', undefined, 'Confirm account deletion')}
            >
                <div className="space-y-4">
                    <p className="text-muted">
                        {tx('settings.deleteAccountConfirmMessage', undefined, 'Are you sure you want to delete your account? All your data will be permanently removed.')}
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            {t.common.cancel}
                        </Button>
                        <Button variant="danger" onClick={handleDeleteAccount}>
                            {tx('settings.deleteAccountConfirmAction', undefined, 'Yes, delete my account')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add Payment Method Modal */}
            <Modal
                isOpen={isAddPaymentModalOpen}
                onClose={() => setIsAddPaymentModalOpen(false)}
                title={tx('settings.addPaymentMethodModalTitle', undefined, 'Add payment method')}
            >
                <div className="space-y-4">
                    <div>
                        <label className="label">{tx('settings.paymentMethodType', undefined, 'Payment method type')}</label>
                        <select
                            value={newPaymentForm.type}
                            onChange={(e) => setNewPaymentForm({ ...newPaymentForm, type: e.target.value })}
                            className="form-control"
                            disabled={isSavingPayment}
                        >
                            <option value="d17">D17</option>
                            <option value="flouci">Flouci</option>
                            <option value="bank_transfer">{tx('settings.bankTransfer', undefined, 'Bank transfer')}</option>
                        </select>
                    </div>
                    <Input
                        label={tx('settings.paymentDetails', undefined, 'Payment details')}
                        value={newPaymentForm.details}
                        onChange={(e) => setNewPaymentForm({ ...newPaymentForm, details: e.target.value })}
                        disabled={isSavingPayment}
                        placeholder={newPaymentForm.type === 'bank_transfer'
                            ? tx('settings.bankAccountNumber', undefined, 'Bank account number')
                            : tx('settings.phoneNumber', undefined, 'Phone number')}
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsAddPaymentModalOpen(false)} disabled={isSavingPayment}>
                            {t.common.cancel}
                        </Button>
                        <Button variant="primary" onClick={handleAddPayment} disabled={!newPaymentForm.details || isSavingPayment} isLoading={isSavingPayment}>
                            {tx('settings.add', undefined, 'Add')}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Footer />
        </div>
    );
}

export default Settings;
