import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Bell,
  CreditCard,
  Shield,
  LogOut,
  Check,
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { Header } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { getVerificationStatus, subscribeToVerificationChanges, type VerificationStatus } from '@/lib/verificationStatus';

type SettingsTab = 'account' | 'notifications' | 'payment' | 'privacy';
type NotificationKey = 'new_job' | 'messages' | 'payments' | 'reviews' | 'marketing';

type NotificationState = Record<NotificationKey, boolean>;

interface PaymentMethodRow {
  id: string;
  type: string;
  details: string;
  is_default: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationState = {
  new_job: true,
  messages: true,
  payments: true,
  reviews: true,
  marketing: false,
};

function accentTokens(accentColor: string) {
  return {
    accentColor,
    accentBg: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
    accentBorder: `color-mix(in srgb, ${accentColor} 35%, #262626)`,
    accentSoft: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
  };
}

function AccountSettings({
  activeMode,
  accountType,
  identityStatus,
  goToPublicProfile,
  goToDashboard,
  goToNotifications,
  accentColor,
}: {
  activeMode: 'client' | 'freelancer';
  accountType: string;
  identityStatus: VerificationStatus;
  goToPublicProfile: () => void;
  goToDashboard: () => void;
  goToNotifications: () => void;
  accentColor: string;
}) {
  const tokens = accentTokens(accentColor);
  const identityVerified = identityStatus === 'verified';
  const identityPending = identityStatus === 'pending';

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
      <h2 className="text-xl font-bold mb-1">Account Overview</h2>
      <p className="text-sm text-gray-400 mb-8">Manage your workspace and general account details.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 transition-colors" style={{ borderColor: tokens.accentBorder }}>
          <p className="text-xs text-gray-500 mb-1">Current workspace</p>
          <p className="text-sm font-semibold text-white">{activeMode === 'freelancer' ? 'Freelancer' : 'Client'}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 transition-colors" style={{ borderColor: tokens.accentBorder }}>
          <p className="text-xs text-gray-500 mb-1">Account type</p>
          <p className="text-sm font-semibold text-white">{accountType}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 transition-colors" style={{ borderColor: tokens.accentBorder }}>
          <p className="text-xs text-gray-500 mb-1">Identity</p>
          <p className={`text-sm font-semibold inline-flex items-center gap-2 ${identityVerified ? 'text-green-400' : identityPending ? 'text-amber-400' : 'text-gray-300'}`}>
            <Check className="w-4 h-4" />
            {identityVerified ? 'Identity Verified' : identityPending ? 'Verification Under Review' : 'Not Verified'}
          </p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-200 mb-3">Quick Actions</h3>

      <button
        type="button"
        onClick={goToPublicProfile}
        className="w-full flex justify-between items-center p-4 border border-[#262626] rounded-xl mb-3 hover:bg-[#1a1a1a] cursor-pointer transition-all"
        style={{ borderColor: tokens.accentBorder }}
      >
        <span className="text-sm text-white">Open public profile editor</span>
        <ExternalLink className="w-4 h-4 text-gray-500" />
      </button>

      <button
        type="button"
        onClick={goToDashboard}
        className="w-full flex justify-between items-center p-4 border border-[#262626] rounded-xl mb-3 hover:bg-[#1a1a1a] cursor-pointer transition-all"
        style={{ borderColor: tokens.accentBorder }}
      >
        <span className="text-sm text-white">Go to dashboard</span>
        <ExternalLink className="w-4 h-4 text-gray-500" />
      </button>

      <button
        type="button"
        onClick={goToNotifications}
        className="w-full flex justify-between items-center p-4 border border-[#262626] rounded-xl hover:bg-[#1a1a1a] cursor-pointer transition-all"
        style={{ borderColor: tokens.accentBorder }}
      >
        <span className="text-sm text-white">Manage notifications</span>
        <ExternalLink className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}

function NotificationSettingsTab({
  userId,
  accentColor,
  showToast,
}: {
  userId?: string;
  accentColor: string;
  showToast: (message: string, variant?: 'success' | 'error' | 'info') => void;
}) {
  const [notifications, setNotifications] = useState<NotificationState>(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<NotificationKey | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const cacheKey = `notif_settings_${userId}`;
    const cached = (() => { try { const r = sessionStorage.getItem(cacheKey); return r ? JSON.parse(r) : null; } catch { return null; } })();
    if (cached) {
      setNotifications(cached);
      setLoading(false);
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('notification_settings')
          .select('new_job, messages, payments, reviews, marketing')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          const next = {
            new_job: data.new_job ?? true,
            messages: data.messages ?? true,
            payments: data.payments ?? true,
            reviews: data.reviews ?? true,
            marketing: data.marketing ?? false,
          };
          setNotifications(next);
          try { sessionStorage.setItem(cacheKey, JSON.stringify(next)); } catch { /* ignore */ }
        }
      } catch (error) {
        logger.error('Failed to load notification settings', error);
        if (!cached) showToast('Failed to load notification settings', 'error');
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, [showToast, userId]);

  const items: Array<{ key: NotificationKey; title: string; description: string }> = [
    { key: 'new_job', title: 'New job matches', description: 'Get notified when jobs match your skills' },
    { key: 'messages', title: 'New messages', description: 'Get notified when you receive new messages' },
    { key: 'payments', title: 'Payments', description: 'Get notified when you send or receive payments' },
    { key: 'reviews', title: 'Reviews', description: 'Get notified when you receive a new review' },
    { key: 'marketing', title: 'Offers and updates', description: 'Tips and updates from WorkedIn' },
  ];

  const persistNotifications = async (nextState: NotificationState) => {
    if (!userId) {
      return;
    }

    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...nextState,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }
  };

  const toggleNotification = async (key: NotificationKey) => {
    const nextState: NotificationState = {
      ...notifications,
      [key]: !notifications[key],
    };

    setNotifications(nextState);
    setSavingKey(key);

    try {
      await persistNotifications(nextState);
    } catch (error) {
      logger.error('Failed to save notification settings', error);
      setNotifications(notifications);
      showToast('Could not save notification settings', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
      <h2 className="text-xl font-bold mb-6">Notifications</h2>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between border-b border-[#262626] pb-4 mb-4 hover:bg-[#1a1a1a] rounded-lg px-2 transition-colors"
          >
            <div className="pe-4">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="text-sm text-gray-400 mt-1">{item.description}</p>
            </div>

            <button
              type="button"
              onClick={() => void toggleNotification(item.key)}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ background: notifications[item.key] ? accentColor : '#262626' }}
              disabled={savingKey === item.key}
              aria-label={`Toggle ${item.title}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function PaymentSettingsTab({
  userId,
  accentColor,
  showToast,
}: {
  userId?: string;
  accentColor: string;
  showToast: (message: string, variant?: 'success' | 'error' | 'info') => void;
}) {
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'd17', details: '' });

  const loadMethods = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('id, type, details, is_default')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setMethods((data ?? []) as PaymentMethodRow[]);
    } catch (error) {
      logger.error('Failed to load payment methods', error);
      showToast('Failed to load payment methods', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMethods();
  }, [userId]);

  const addMethod = async () => {
    if (!userId || !form.details.trim()) {
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          type: form.type,
          details: form.details.trim(),
          is_default: methods.length === 0,
        })
        .select('id, type, details, is_default')
        .single();

      if (error) {
        throw error;
      }

      setMethods((prev) => [...prev, data as PaymentMethodRow]);
      setForm({ type: 'd17', details: '' });
      setAdding(false);
      showToast('Payment method added', 'success');
    } catch (error) {
      logger.error('Failed to add payment method', error);
      showToast('Could not add payment method', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    if (!userId) {
      return;
    }

    try {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMethods((prev) => prev.map((method) => ({ ...method, is_default: method.id === id })));
      showToast('Default payment method updated', 'success');
    } catch (error) {
      logger.error('Failed to set default payment method', error);
      showToast('Could not update default payment method', 'error');
    }
  };

  const removeMethod = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMethods((prev) => prev.filter((method) => method.id !== id));
      showToast('Payment method removed', 'success');
    } catch (error) {
      logger.error('Failed to remove payment method', error);
      showToast('Could not remove payment method', 'error');
    }
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Payment Methods</h2>
        <button
          type="button"
          onClick={() => setAdding((prev) => !prev)}
          className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors"
          style={{ background: accentColor }}
        >
          <Plus className="w-4 h-4" />
          Add method
        </button>
      </div>

      {adding ? (
        <div className="mb-6 border border-[#262626] rounded-xl p-4 bg-[#0a0a0a]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="bg-[#0a0a0a] border border-[#262626] rounded-lg text-white p-3 outline-none"
            >
              <option value="d17">D17</option>
              <option value="flouci">Flouci</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>

            <input
              value={form.details}
              onChange={(event) => setForm((prev) => ({ ...prev, details: event.target.value }))}
              placeholder={form.type === 'bank_transfer' ? 'Bank account number' : 'Phone number'}
              className="sm:col-span-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white p-3 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-lg border border-[#262626] text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void addMethod()}
              disabled={saving || !form.details.trim()}
              className="px-4 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ background: accentColor }}
            >
              {saving ? 'Saving...' : 'Save method'}
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#262626] rounded-2xl bg-[#0a0a0a]">
          <CreditCard className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-lg font-semibold text-white mt-4">No payment method added yet</p>
          <p className="text-sm text-gray-400 mt-2">Add a payout method now so contracts are ready when you need them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-[#0a0a0a]"
              style={{ borderColor: method.is_default ? `color-mix(in srgb, ${accentColor} 50%, #262626)` : '#262626' }}
            >
              <div>
                <p className="text-sm text-white font-semibold uppercase">{method.type.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400 mt-1">{method.details}</p>
              </div>

              <div className="flex items-center gap-2">
                {method.is_default ? (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: `color-mix(in srgb, ${accentColor} 14%, transparent)`, color: accentColor }}
                  >
                    Default
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setDefault(method.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#262626] text-gray-300 hover:text-white"
                  >
                    Set default
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void removeMethod(method.id)}
                  className="p-2 rounded-lg border border-[#262626] text-gray-400 hover:text-red-400"
                  aria-label="Delete payment method"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrivacySettingsTab({
  userId,
  userEmail,
  authProvider,
  accentColor,
  onSignOutAll,
  showToast,
}: {
  userId?: string;
  userEmail?: string;
  authProvider: string;
  accentColor: string;
  onSignOutAll: () => Promise<void>;
  showToast: (message: string, variant?: 'success' | 'error' | 'info') => void;
}) {
  const [submittingDeleteRequest, setSubmittingDeleteRequest] = useState(false);

  const requestDeleteAccount = async () => {
    if (!userId) {
      return;
    }

    setSubmittingDeleteRequest(true);

    try {
      const { data: openRequest } = await supabase
        .from('account_deletion_requests')
        .select('id, status')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_review'])
        .limit(1)
        .maybeSingle();

      if (openRequest) {
        showToast('A deletion request is already in progress', 'info');
        return;
      }

      const { error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: userId,
          source: 'settings_privacy',
          metadata: {
            email: userEmail ?? null,
            provider: authProvider,
          },
        });

      if (error) {
        throw error;
      }

      showToast('Account deletion request submitted', 'info');
    } catch (error) {
      logger.error('Failed to submit account deletion request', error);
      showToast('Could not submit deletion request', 'error');
    } finally {
      setSubmittingDeleteRequest(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
      <h2 className="text-xl font-bold mb-6">Security & Privacy</h2>

      <div className="border border-[#262626] rounded-xl p-4 mb-4 bg-[#0a0a0a]">
        <p className="text-sm font-semibold text-white mb-1">Change password</p>
        <p className="text-sm text-gray-400">
          You signed in with {authProvider}. Password management is handled by your identity provider.
        </p>
      </div>

      <div className="border border-[#262626] rounded-xl p-4 bg-[#0a0a0a]">
        <p className="text-sm font-semibold text-white mb-1">Active sessions</p>
        <p className="text-sm text-gray-400">This device is your current session.</p>
        <button
          type="button"
          onClick={() => void onSignOutAll()}
          className="inline-flex items-center gap-2 border border-[#262626] text-white px-4 py-2 rounded-lg mt-3 transition-colors"
          style={{ borderColor: `color-mix(in srgb, ${accentColor} 45%, #262626)` }}
        >
          <RefreshCw className="w-4 h-4" />
          Sign out from all devices
        </button>
      </div>

      <div className="border border-red-900/50 bg-red-500/5 rounded-xl p-6 mt-8">
        <div className="flex items-center gap-2 text-red-500 font-semibold">
          <AlertTriangle className="w-4 h-4" />
          <span>Delete account</span>
        </div>
        <p className="text-red-200/70 text-sm mt-1">
          Your account and all data will be permanently deleted. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => void requestDeleteAccount()}
          disabled={submittingDeleteRequest}
          className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg mt-4 transition-all disabled:opacity-60"
        >
          {submittingDeleteRequest ? 'Submitting...' : 'Delete my account'}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, activeMode, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [identityStatus, setIdentityStatus] = useState<VerificationStatus>(profile?.cin_verified ? 'verified' : 'missing');

  useEffect(() => {
    if (!user?.id) {
      setIdentityStatus(profile?.cin_verified ? 'verified' : 'missing');
      return;
    }

    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const state = await getVerificationStatus(user.id);
        if (!cancelled) setIdentityStatus(state.status);

        if (state.status === 'verified' && !profile?.cin_verified) {
          await refreshProfile?.();
        }
      } catch (error) {
        logger.error('Failed to load identity verification status in Settings', error);
        if (!cancelled) setIdentityStatus(profile?.cin_verified ? 'verified' : 'missing');
      }
    };

    void fetchStatus();

    const unsubscribe = subscribeToVerificationChanges(user.id, (state) => {
      if (!cancelled) setIdentityStatus(state.status);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user?.id, profile?.cin_verified, refreshProfile]);

  const accentColor = activeMode === 'freelancer' ? '#8B5CF6' : '#F59E0B';

  const navItems: Array<{ id: SettingsTab; label: string; icon: typeof SettingsIcon }> = [
    { id: 'account', label: 'Account', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  const accountType =
    profile?.user_type === 'both'
      ? 'Both'
      : profile?.user_type === 'freelancer'
      ? 'Freelancer'
      : 'Client';

  const dashboardPath = activeMode === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard';
  const publicProfilePath = user?.id
    ? activeMode === 'freelancer'
      ? `/freelancer/${profile?.username || user.id}`
      : `/client/${user.id}`
    : dashboardPath;
  const authProvider = user?.app_metadata?.provider || user?.app_metadata?.providers?.[0] || 'email';
  const workspaceLabel = activeMode === 'freelancer' ? 'Freelancer Mode' : 'Client Mode';

  const handleSignOutAll = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      logger.error('Failed to sign out all sessions', error);
      showToast('Could not sign out all devices', 'error');
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'account') {
      return (
        <AccountSettings
          activeMode={activeMode === 'freelancer' ? 'freelancer' : 'client'}
          accountType={accountType}
          identityStatus={identityStatus}
          goToPublicProfile={() => navigate(publicProfilePath)}
          goToDashboard={() => navigate(dashboardPath)}
          goToNotifications={() => setActiveTab('notifications')}
          accentColor={accentColor}
        />
      );
    }

    if (activeTab === 'notifications') {
      return <NotificationSettingsTab userId={user?.id} accentColor={accentColor} showToast={showToast} />;
    }

    if (activeTab === 'payment') {
      return <PaymentSettingsTab userId={user?.id} accentColor={accentColor} showToast={showToast} />;
    }

    return (
      <PrivacySettingsTab
        userId={user?.id}
        userEmail={user?.email}
        authProvider={String(authProvider)}
        accentColor={accentColor}
        onSignOutAll={handleSignOutAll}
        showToast={showToast}
      />
    );
  };

  return (
    <div className="bg-[#0a0a0a]">
      <Header />

      <div className="min-h-screen w-full bg-[#0a0a0a] text-white p-4 md:p-8 flex justify-center">
        <div className="max-w-6xl w-full flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 shrink-0">
            <div
              className="bg-gradient-to-b from-[#131313] to-[#0d0d0d] border rounded-2xl p-4 relative overflow-hidden"
              style={{ borderColor: `color-mix(in srgb, ${accentColor} 28%, #262626)` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
              <h1 className="text-2xl font-bold mb-2 text-white">Settings</h1>
              <div className="mb-6">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                  style={{
                    color: accentColor,
                    borderColor: `color-mix(in srgb, ${accentColor} 35%, #262626)`,
                    background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: accentColor }}
                  />
                  {workspaceLabel}
                </span>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`group relative flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium border transition-all ${
                        isActive
                          ? ''
                          : 'text-gray-400 border-[#262626] bg-[#101010] hover:bg-[#171717] hover:text-white hover:border-[#3a3a3a]'
                      }`}
                      style={
                        isActive
                          ? {
                              background: `linear-gradient(90deg, color-mix(in srgb, ${accentColor} 14%, transparent) 0%, color-mix(in srgb, ${accentColor} 6%, transparent) 100%)`,
                              color: accentColor,
                              borderColor: `color-mix(in srgb, ${accentColor} 42%, #262626)`,
                              boxShadow: `0 0 0 1px color-mix(in srgb, ${accentColor} 22%, transparent) inset`,
                            }
                          : undefined
                      }
                    >
                      {isActive ? (
                        <span
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                          style={{ background: accentColor }}
                        />
                      ) : null}

                      <Icon className="w-4 h-4 transition-colors" style={isActive ? { color: accentColor } : undefined} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-[#262626] mt-6 pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    navigate('/login', { replace: true });
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          <section className="flex-1">{renderTabContent()}</section>
        </div>
      </div>
    </div>
  );
}
