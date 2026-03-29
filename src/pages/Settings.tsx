import { logger } from '@/lib/logger';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowUpRight,
    Bell,
    BriefcaseBusiness,
    Check,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Loader2,
    Plus,
    Shield,
    Sparkles,
    Trash2,
    User,
    Wallet,
} from 'lucide-react';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import ProfileSettings from '../components/settings/ProfileSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import SecuritySettings from '../components/settings/SecuritySettings';

type SettingsTab = 'account' | 'profile' | 'notifications' | 'payment' | 'security';

interface PaymentMethod {
    id: string;
    type: string;
    label: string;
    details: string;
    is_default: boolean;
}

function SettingsPanel({ className = '', children }: { className?: string; children: ReactNode }) {
    return (
        <section className={cn(
            'rounded-lg p-6 border',
            'bg-white dark:bg-[#1a1825]',
            'border-gray-100 dark:border-white/6',
            'shadow-sm dark:shadow-none',
            className
        )}>
            {children}
        </section>
    );
}

function Settings() {
    const { dir, t, tx } = useTranslation();
    const { user, profile, activeMode, signOut } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { tab } = useParams<{ tab: string }>();
    const [searchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState<SettingsTab>('account');

    const tabs = useMemo(() => [
        {
            id: 'account' as SettingsTab,
            label: t.settings.account,
            icon: BriefcaseBusiness,
            description: tx('settings.tabDescriptions.account', undefined, 'Workspace mode, account overview, and setup guidance.'),
        },
        {
            id: 'profile' as SettingsTab,
            label: t.settings.profile,
            icon: User,
            description: tx('settings.tabDescriptions.profile', undefined, 'Identity, bio, avatar, and workspace readiness.'),
        },
        {
            id: 'notifications' as SettingsTab,
            label: t.settings.notifications,
            icon: Bell,
            description: tx('settings.tabDescriptions.notifications', undefined, 'Choose what reaches you and how often.'),
        },
        {
            id: 'payment' as SettingsTab,
            label: t.settings.payment,
            icon: CreditCard,
            description: tx('settings.tabDescriptions.payment', undefined, 'Payout methods, defaults, and transaction-ready details.'),
        },
        {
            id: 'security' as SettingsTab,
            label: t.settings.privacy,
            icon: Shield,
            description: tx('settings.tabDescriptions.security', undefined, 'Session control, account safety, and destructive actions.'),
        },
    ], [
        t.settings.account,
        t.settings.notifications,
        t.settings.payment,
        t.settings.privacy,
        t.settings.profile,
        tx,
    ]);

    useEffect(() => {
        const targetTab = tab || searchParams.get('tab');
        if (targetTab && tabs.some((item) => item.id === targetTab)) {
            setActiveTab(targetTab as SettingsTab);
        }
    }, [searchParams, tab, tabs]);

    const [isSavingPayment, setIsSavingPayment] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [newPaymentForm, setNewPaymentForm] = useState({ type: 'd17', details: '' });

    useEffect(() => {
        if (!user?.id) return;

        setIsLoading(true);

        void (async () => {
            try {
                const { data } = await supabase
                    .from('payment_methods')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });

                if (data?.length) {
                    setPaymentMethods(
                        data.map((payment) => ({
                            id: payment.id,
                            type: payment.type,
                            label: payment.type === 'd17'
                                ? 'D17'
                                : payment.type === 'flouci'
                                    ? 'Flouci'
                                    : tx('settings.bankTransfer', undefined, 'Bank transfer'),
                            details: payment.details,
                            is_default: payment.is_default,
                        }))
                    );
                }
            } catch (error: unknown) {
                logger.error('Error loading payment methods:', error);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [tx, user?.id]);

    const handleSetDefaultPayment = async (id: string) => {
        if (!user?.id) return;

        try {
            await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user.id);
            const { error } = await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
            if (error) throw error;
            setPaymentMethods((prev) => prev.map((payment) => ({ ...payment, is_default: payment.id === id })));
            showToast(tx('settings.toasts.defaultPaymentUpdated', undefined, 'Default payment method updated'), 'success');
        } catch (error) {
            logger.error('Error setting default payment:', error);
            showToast(tx('settings.toasts.genericError', undefined, 'Something went wrong'), 'error');
        }
    };

    const handleDeletePayment = async (id: string) => {
        try {
            const { error } = await supabase.from('payment_methods').delete().eq('id', id);
            if (error) throw error;
            setPaymentMethods((prev) => prev.filter((payment) => payment.id !== id));
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

            setPaymentMethods((prev) => [
                ...prev,
                {
                    id: data.id,
                    type: data.type,
                    label: data.type === 'd17'
                        ? 'D17'
                        : data.type === 'flouci'
                            ? 'Flouci'
                            : tx('settings.bankTransfer', undefined, 'Bank transfer'),
                    details: data.details,
                    is_default: data.is_default,
                },
            ]);

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

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
    const currentTab = tabs.find((item) => item.id === activeTab) ?? tabs[0];
    const dashboardPath = activeMode === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard';
    const accountTypeLabel = profile?.user_type === 'both'
        ? tx('settings.accountTypeBoth', undefined, 'Both')
        : profile?.user_type === 'freelancer'
            ? tx('settings.accountTypeFreelancer', undefined, 'Freelancer')
            : tx('settings.accountTypeClient', undefined, 'Client');

    const identityLabel = profile?.cin_verified
        ? tx('settings.identityVerified', undefined, 'Identity verified')
        : profile?.cin_submitted
            ? tx('settings.identityPending', undefined, 'Under review')
            : tx('settings.verifyIdentity', undefined, 'Verify your identity');

    const identityTone = profile?.cin_verified
        ? 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200'
        : profile?.cin_submitted
            ? 'border-amber-500/20 bg-amber-500/12 text-amber-700 dark:text-amber-200'
            : 'border-primary-500/20 bg-primary-500/12 text-primary-700 dark:text-primary-200';

    const onboardingLabel = profile?.onboarding_completed
        ? tx('settings.setupStatus.complete', undefined, 'Complete')
        : tx('settings.setupStatus.pending', undefined, 'Pending');

    const renderAccountTab = () => (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                        {tx('settings.currentWorkspace', undefined, 'Current workspace')}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#171420] dark:text-white">
                        {activeMode === 'freelancer' ? t.auth.accountPanel.freelancerLabel : t.auth.accountPanel.clientLabel}
                    </p>
                </div>
                <div className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                        {tx('settings.accountType', undefined, 'Account type')}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#171420] dark:text-white">
                        {accountTypeLabel}
                    </p>
                </div>
                <div className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                        {tx('settings.onboardingStatus', undefined, 'Onboarding')}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#171420] dark:text-white">
                        {onboardingLabel}
                    </p>
                </div>
            </div>

            <div className="rounded-[1.75rem] border border-primary-100/70 bg-white/72 p-6 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-wrap items-center gap-3">
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${identityTone}`}>
                        <Shield className="h-3.5 w-3.5" />
                        {identityLabel}
                    </div>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-[#171420] dark:text-white">
                    {tx('settings.accountOverviewTitle', undefined, 'Your workspace identity and setup status')}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                    {tx('settings.accountOverviewDescription', undefined, 'This tab is the control point for how your account is set up. Switch to Profile when you want to edit details or change workspace readiness.')}
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <button type="button" onClick={() => setActiveTab('profile')} className="w-full rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                        <p className="text-sm font-semibold text-[#171420] dark:text-white">{tx('settings.goToProfile', undefined, 'Go to Profile settings')}</p>
                        <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">{tx('settings.accountTabHint', undefined, 'Go to the Profile tab to switch workspace or update your account type.')}</p>
                    </button>

                    <button type="button" onClick={() => navigate(dashboardPath)} className="w-full rounded-2xl border border-primary-100/70 bg-white/75 p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                        <p className="text-sm font-semibold text-[#171420] dark:text-white">{tx('settings.goToDashboard', undefined, 'Go to dashboard')}</p>
                        <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">{tx('settings.goToDashboardDescription', undefined, 'Return to your active workspace and continue where you left off.')}</p>
                    </button>
                </div>

                <button type="button" onClick={() => setActiveTab('notifications')} className="mt-3 w-full rounded-2xl border border-primary-100/70 bg-white/75 p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                    <p className="text-sm font-semibold text-[#171420] dark:text-white">{tx('settings.reviewNotifications', undefined, 'Review notification rules')}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">{tx('settings.reviewNotificationsDescription', undefined, 'Adjust how updates, reviews, and messages reach you.')}</p>
                </button>
            </div>
        </div>
    );

    const renderPaymentTab = () => (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm text-[#6b6880] dark:text-[#8b8aa0]">
                        {tx('settings.paymentSubtitle', undefined, 'Payment and payout methods')}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-primary-200">
                        <Wallet className="h-3.5 w-3.5" />
                        {tx('settings.paymentMethodsCount', { count: paymentMethods.length }, `${paymentMethods.length} payment methods`)}
                    </div>
                </div>

                <Button variant="primary" size="sm" className="rounded-2xl" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddPaymentModalOpen(true)}>
                    {tx('settings.addMethod', undefined, 'Add method')}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary-600" /></div>
            ) : paymentMethods.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-primary-200/70 bg-primary-50/45 p-8 text-center dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm dark:bg-white/10 dark:text-primary-300">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <p className="mt-5 text-base font-semibold text-[#171420] dark:text-white">
                        {tx('settings.noPaymentMethods', undefined, 'No payment method added yet')}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                        {tx('settings.noPaymentMethodsDescription', undefined, 'Add a payout method now so contracts, earnings, and withdrawals are ready when you need them.')}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paymentMethods.map((method) => (
                        <div key={method.id} className="rounded-[1.6rem] border border-primary-100/70 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/8 dark:text-primary-300">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#171420] dark:text-white">{method.label}</p>
                                        <p className="mt-1 text-sm text-[#6b6880] dark:text-[#8b8aa0]">{method.details}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                    {method.is_default ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-primary-500/12 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-200">
                                            <Check className="h-3.5 w-3.5" />
                                            {tx('settings.default', undefined, 'Default')}
                                        </span>
                                    ) : (
                                        <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => handleSetDefaultPayment(method.id)}>
                                            {tx('settings.setDefault', undefined, 'Set as default')}
                                        </Button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleDeletePayment(method.id)}
                                        aria-label={tx('settings.deletePaymentMethod', { label: method.label }, `Delete ${method.label}`)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/15 text-red-500 transition-colors hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderActiveTab = () => {
        if (activeTab === 'account') return renderAccountTab();
        if (activeTab === 'profile') return <ProfileSettings />;
        if (activeTab === 'notifications') return <NotificationSettings />;
        if (activeTab === 'payment') return renderPaymentTab();
        return <SecuritySettings />;
    };

    return (
        <div className="page-shell bg-[#f6f3ff] dark:bg-[#0b0a12] transition-colors duration-300">
            <SEO {...SEO_CONFIG.settings} url="/settings" noIndex />
            <Header />

            <main className="page-shell-content space-y-6">
                <section className="flex flex-col gap-4 rounded-[1.75rem] border border-primary-100/70 bg-white/72 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:flex-row sm:items-end sm:justify-between sm:p-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-primary-200">
                            <Sparkles className="h-3.5 w-3.5" />
                            {tx('settings.heroBadge', undefined, 'Settings workspace')}
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#171420] dark:text-white">
                            {tx('settings.pageTitle', undefined, 'Settings')}
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                            {tx('settings.heroDescription', undefined, 'Keep account details, security, payouts, and notification behavior in one consistent control surface. Update what matters without losing your place in the product.')}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-sm text-[#353149] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#e3def7]">
                                {accountTypeLabel}
                            </span>
                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${identityTone}`}>
                                <Shield className="h-4 w-4" />
                                {identityLabel}
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="rounded-2xl" rightIcon={<ArrowUpRight className="h-4 w-4" />} onClick={() => navigate(dashboardPath)}>
                        {tx('settings.goToDashboard', undefined, 'Go to dashboard')}
                    </Button>
                </section>

                <div className="grid gap-6 xl:grid-cols-[248px_minmax(0,1fr)]">
                    <aside className="xl:sticky xl:top-28 xl:self-start">
                        <SettingsPanel className="p-3">
                            <nav className="space-y-2">
                                {tabs.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveTab(item.id)}
                                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 ${activeTab === item.id
                                            ? 'border border-primary-200 bg-primary-50 text-primary-700 shadow-sm dark:border-primary-500/20 dark:bg-primary-500/[0.08] dark:text-primary-200'
                                            : 'text-[#57536a] hover:bg-primary-50 hover:text-[#171420] dark:text-[#b8b3ca] dark:hover:bg-white/5 dark:hover:text-white'}`}
                                    >
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${activeTab === item.id ? 'bg-primary-600 text-white dark:bg-primary-500' : 'bg-primary-50 text-primary-600 dark:bg-white/8 dark:text-primary-300'}`}>
                                            <item.icon className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold">{item.label}</p>
                                            <p className={`mt-1 truncate text-xs ${activeTab === item.id ? 'text-primary-700/70 dark:text-primary-200/70' : 'text-[#8b8aa0]'}`}>
                                                {item.description}
                                            </p>
                                        </div>
                                        <ArrowIcon className={`h-4 w-4 ${activeTab === item.id ? 'text-primary-600 dark:text-primary-200' : 'text-[#8b8aa0]'}`} />
                                    </button>
                                ))}
                            </nav>
                        </SettingsPanel>
                    </aside>

                    <section className="space-y-6">
                        <div className="premium-panel radius-shell p-6 sm:p-8">
                            <div className="mb-8 border-b border-primary-100/70 pb-6 dark:border-white/10">
                                <h2 className="text-2xl font-semibold tracking-tight text-[#171420] dark:text-white">
                                    {currentTab.label}
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                    {currentTab.description}
                                </p>
                                {activeTab === 'payment' ? (
                                    <Button variant="primary" size="sm" className="rounded-2xl" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddPaymentModalOpen(true)}>
                                        {tx('settings.addMethod', undefined, 'Add method')}
                                    </Button>
                                ) : null}
                            </div>

                            {renderActiveTab()}
                        </div>

                        <Button variant="ghost" className="rounded-2xl text-[#8b8aa0] hover:text-red-500" onClick={handleLogout}>
                            {tx('settings.logout', undefined, 'Sign out')}
                        </Button>
                    </section>
                </div>
            </main>

            <Modal isOpen={isAddPaymentModalOpen} onClose={() => setIsAddPaymentModalOpen(false)} title={tx('settings.addPaymentMethodModalTitle', undefined, 'Add payment method')}>
                <div className="space-y-4">
                    <div>
                        <label className="label">{tx('settings.paymentMethodType', undefined, 'Payment method type')}</label>
                        <select value={newPaymentForm.type} onChange={(event) => setNewPaymentForm({ ...newPaymentForm, type: event.target.value })} className="form-control" disabled={isSavingPayment}>
                            <option value="d17">D17</option>
                            <option value="flouci">Flouci</option>
                            <option value="bank_transfer">{tx('settings.bankTransfer', undefined, 'Bank transfer')}</option>
                        </select>
                    </div>

                    <Input
                        label={tx('settings.paymentDetails', undefined, 'Payment details')}
                        value={newPaymentForm.details}
                        onChange={(event) => setNewPaymentForm({ ...newPaymentForm, details: event.target.value })}
                        disabled={isSavingPayment}
                        placeholder={newPaymentForm.type === 'bank_transfer'
                            ? tx('settings.bankAccountNumber', undefined, 'Bank account number')
                            : tx('settings.phoneNumber', undefined, 'Phone number')}
                    />

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsAddPaymentModalOpen(false)} disabled={isSavingPayment}>
                            {t.common.cancel}
                        </Button>
                        <Button variant="primary" onClick={handleAddPayment} disabled={!newPaymentForm.details || isSavingPayment} isLoading={isSavingPayment}>
                            {tx('settings.add', undefined, 'Add')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Settings;
