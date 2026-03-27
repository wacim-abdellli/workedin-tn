import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    User, BriefcaseBusiness, Bell, CreditCard, Shield,
    ChevronLeft, ChevronRight, Plus, Check, Loader2,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
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

function Settings() {
    const { dir, t, tx } = useTranslation();
    const { user, profile, activeMode, signOut } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { tab } = useParams<{ tab: string }>();
    const [searchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const tabs = useMemo(() => [
        { id: 'account' as SettingsTab, label: t.settings.account, icon: BriefcaseBusiness },
        { id: 'profile' as SettingsTab, label: t.settings.profile, icon: User },
        { id: 'notifications' as SettingsTab, label: t.settings.notifications, icon: Bell },
        { id: 'payment' as SettingsTab, label: t.settings.payment, icon: CreditCard },
        { id: 'security' as SettingsTab, label: t.settings.privacy, icon: Shield },
    ], [t.settings.account, t.settings.notifications, t.settings.payment, t.settings.privacy, t.settings.profile]);

    useEffect(() => {
        const targetTab = tab || searchParams.get('tab');
        if (targetTab && tabs.some(t => t.id === targetTab)) {
            setActiveTab(targetTab as SettingsTab);
        }
    }, [searchParams, tab, tabs]);

    // Payment state (stays here — not extracted)
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
                    setPaymentMethods(data.map(p => ({
                        id: p.id, type: p.type,
                        label: p.type === 'd17' ? 'D17' : p.type === 'flouci' ? 'Flouci' : tx('settings.bankTransfer', undefined, 'Bank transfer'),
                        details: p.details, is_default: p.is_default,
                    })));
                }
            } catch (err: unknown) {
                logger.error('Error loading payment methods:', err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [user?.id]);

    const handleSetDefaultPayment = async (id: string) => {
        if (!user?.id) return;
        try {
            await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user.id);
            const { error } = await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
            if (error) throw error;
            setPaymentMethods(prev => prev.map(p => ({ ...p, is_default: p.id === id })));
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
            setPaymentMethods(prev => prev.filter(p => p.id !== id));
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
                .insert({ user_id: user.id, type: newPaymentForm.type, details: newPaymentForm.details, is_default: paymentMethods.length === 0 })
                .select().single();
            if (error) throw error;
            setPaymentMethods(prev => [...prev, {
                id: data.id, type: data.type,
                label: data.type === 'd17' ? 'D17' : data.type === 'flouci' ? 'Flouci' : tx('settings.bankTransfer', undefined, 'Bank transfer'),
                details: data.details, is_default: data.is_default,
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

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

    // Account tab — workspace switcher summary (read-only, delegates actions to ProfileSettings)
    const renderAccountTab = () => (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">{t.auth.accountPanel.sectionLabel}</p>
                <h4 className="mt-2 text-lg font-semibold text-foreground">{t.auth.accountPanel.switchWorkspace}</h4>
                <p className="mt-1 text-sm text-muted">{profile?.user_type === 'both' ? t.auth.accountPanel.switchWorkspaceBoth : t.auth.accountPanel.switchWorkspaceSingle}</p>
                <div className="mt-4 rounded-2xl border border-gray-200/80 bg-gray-50/90 p-4 dark:border-white/8 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${activeMode === 'freelancer' ? 'border-violet-500/20 bg-violet-500/12 text-violet-700 dark:text-violet-200' : 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200'}`}>
                                {activeMode === 'freelancer' ? t.auth.accountPanel.freelancerLabel : t.auth.accountPanel.clientLabel}
                            </span>
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-sm text-muted">{tx('settings.accountTabHint', undefined, 'Go to the Profile tab to switch workspace or update your account type.')}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTab('profile')}>
                    {tx('settings.goToProfile', undefined, 'Go to Profile settings')}
                </Button>
            </div>
        </div>
    );

    const renderPaymentTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-muted">{tx('settings.paymentSubtitle', undefined, 'Payment and payout methods')}</p>
                <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddPaymentModalOpen(true)}>
                    {tx('settings.addMethod', undefined, 'Add method')}
                </Button>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
            ) : (
                <div className="space-y-4">
                    {paymentMethods.map(method => (
                        <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-dark-700 rounded-xl">
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
                                        <Check className="w-3 h-3" />{tx('settings.default', undefined, 'Default')}
                                    </span>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={() => handleSetDefaultPayment(method.id)}>
                                        {tx('settings.setDefault', undefined, 'Set as default')}
                                    </Button>
                                )}
                                <button onClick={() => handleDeletePayment(method.id)} aria-label={tx('settings.deletePaymentMethod', { label: method.label }, `Delete ${method.label}`)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <ChevronRight className="w-4 h-4" />
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
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-start transition-colors ${activeTab === tab.id ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'}`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                    <ArrowIcon className="w-4 h-4 ms-auto" />
                                </button>
                            ))}
                        </nav>
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
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                            {activeTab === 'account' && renderAccountTab()}
                            {activeTab === 'profile' && <ProfileSettings />}
                            {activeTab === 'notifications' && <NotificationSettings />}
                            {activeTab === 'payment' && renderPaymentTab()}
                            {activeTab === 'security' && <SecuritySettings />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Payment Method Modal */}
            <Modal isOpen={isAddPaymentModalOpen} onClose={() => setIsAddPaymentModalOpen(false)} title={tx('settings.addPaymentMethodModalTitle', undefined, 'Add payment method')}>
                <div className="space-y-4">
                    <div>
                        <label className="label">{tx('settings.paymentMethodType', undefined, 'Payment method type')}</label>
                        <select value={newPaymentForm.type} onChange={e => setNewPaymentForm({ ...newPaymentForm, type: e.target.value })} className="form-control" disabled={isSavingPayment}>
                            <option value="d17">D17</option>
                            <option value="flouci">Flouci</option>
                            <option value="bank_transfer">{tx('settings.bankTransfer', undefined, 'Bank transfer')}</option>
                        </select>
                    </div>
                    <Input
                        label={tx('settings.paymentDetails', undefined, 'Payment details')}
                        value={newPaymentForm.details}
                        onChange={e => setNewPaymentForm({ ...newPaymentForm, details: e.target.value })}
                        disabled={isSavingPayment}
                        placeholder={newPaymentForm.type === 'bank_transfer' ? tx('settings.bankAccountNumber', undefined, 'Bank account number') : tx('settings.phoneNumber', undefined, 'Phone number')}
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsAddPaymentModalOpen(false)} disabled={isSavingPayment}>{t.common.cancel}</Button>
                        <Button variant="primary" onClick={handleAddPayment} disabled={!newPaymentForm.details || isSavingPayment} isLoading={isSavingPayment}>{tx('settings.add', undefined, 'Add')}</Button>
                    </div>
                </div>
            </Modal>

            <Footer />
        </div>
    );
}

export default Settings;
