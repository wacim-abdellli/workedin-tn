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
  Clock,
  Wallet,
  Building2,
  Info,
} from 'lucide-react';

import { Header } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { getVerificationStatus, subscribeToVerificationChanges, type VerificationStatus } from '@/lib/verificationStatus';
import { useTranslation } from '@/i18n';
import {
  type PaymentMethodRow,
  getPaymentMethods,
  buildPaymentMethodInsert,
  getPaymentMethodLabel,
  getPaymentMethodDetails,
} from '@/services/payments';

type SettingsTab = 'account' | 'notifications' | 'payment' | 'privacy';
type NotificationKey = 'new_job' | 'messages' | 'payments' | 'reviews' | 'marketing';

type NotificationState = Record<NotificationKey, boolean>;

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
  const { tx } = useTranslation();
  const tokens = accentTokens(accentColor);
  const identityVerified = identityStatus === 'verified';
  const identityPending = identityStatus === 'pending';

  return (
    <div className="surface-card border rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
      <h2 className="text-xl font-bold mb-1 text-on-surface">{tx('pages.settings.account.overviewTitle', undefined, 'Account Overview')}</h2>
      <p className="text-sm text-on-surface-muted mb-8">{tx('pages.settings.account.overviewDescription', undefined, 'Manage your workspace and general account details.')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="surface-sunken border rounded-xl p-4 transition-colors" style={{ borderColor: tokens.accentBorder }}>
          <p className="text-xs text-on-surface-subtle mb-1">{tx('pages.settings.account.currentWorkspace', undefined, 'Current workspace')}</p>
          <p className="text-sm font-semibold text-on-surface">{activeMode === 'freelancer' ? 'Freelancer' : 'Client'}</p>
        </div>
        <div className="surface-sunken border rounded-xl p-4 transition-colors" style={{ borderColor: tokens.accentBorder }}>
          <p className="text-xs text-on-surface-subtle mb-1">{tx('pages.settings.account.accountType', undefined, 'Account type')}</p>
          <p className="text-sm font-semibold text-on-surface">{accountType}</p>
        </div>
        <div className="surface-sunken border rounded-xl p-4 transition-colors" style={{ borderColor: tokens.accentBorder }}>
          <p className="text-xs text-on-surface-subtle mb-1">Identity</p>
          <p className={`text-sm font-semibold inline-flex items-center gap-2 ${identityVerified ? 'text-green-500' : identityPending ? 'text-amber-500' : 'text-on-surface-muted'}`}>
            <Check className="w-4 h-4" />
            {identityVerified ? 'Identity Verified' : identityPending ? 'Verification Under Review' : 'Not Verified'}
          </p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-on-surface-muted mb-3">{tx('pages.settings.account.quickActions', undefined, 'Quick Actions')}</h3>

      <button
        type="button"
        onClick={goToPublicProfile}
        className="w-full flex justify-between items-center p-4 border border-surface rounded-xl mb-3 hover-surface cursor-pointer transition-all"
        style={{ borderColor: tokens.accentBorder }}
      >
        <span className="text-sm text-on-surface">{tx('pages.settings.account.openPublicProfileEditor', undefined, 'Open public profile editor')}</span>
        <ExternalLink className="w-4 h-4 text-on-surface-subtle" />
      </button>

      <button
        type="button"
        onClick={goToDashboard}
        className="w-full flex justify-between items-center p-4 border border-surface rounded-xl mb-3 hover-surface cursor-pointer transition-all"
        style={{ borderColor: tokens.accentBorder }}
      >
        <span className="text-sm text-on-surface">{tx('pages.settings.account.goToDashboard', undefined, 'Go to dashboard')}</span>
        <ExternalLink className="w-4 h-4 text-on-surface-subtle" />
      </button>

      <button
        type="button"
        onClick={goToNotifications}
        className="w-full flex justify-between items-center p-4 border border-surface rounded-xl hover-surface cursor-pointer transition-all"
        style={{ borderColor: tokens.accentBorder }}
      >
        <span className="text-sm text-on-surface">{tx('pages.settings.account.manageNotifications', undefined, 'Manage notifications')}</span>
        <ExternalLink className="w-4 h-4 text-on-surface-subtle" />
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
  const { tx } = useTranslation();
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
        if (!cached) showToast(tx('pages.settings.notifications.toasts.loadError', undefined, 'Failed to load notification settings'), 'error');
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
      showToast(tx('pages.settings.notifications.toasts.saveError', undefined, 'Could not save notification settings'), 'error');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="surface-card border rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
      <h2 className="text-xl font-bold mb-6 text-on-surface">Notifications</h2>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between border-b border-surface pb-4 mb-4 hover-surface rounded-lg px-2 transition-colors"
          >
            <div className="pe-4">
              <p className="text-sm font-medium text-on-surface">{item.title}</p>
              <p className="text-sm text-on-surface-muted mt-1">{item.description}</p>
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
  const { tx } = useTranslation();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ iban: '', bankName: '', accountName: '', label: '' });
  const resetForm = () => setForm({ iban: '', bankName: '', accountName: '', label: '' });
  const formIsValid = form.iban.trim().length > 0;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    void getPaymentMethods(userId).then(({ data, error }) => {
      if (error) {
        logger.error('Failed to load payment methods', error);
        showToast(tx('pages.settings.payment.toasts.loadError', undefined, 'Failed to load payment methods'), 'error');
      } else {
        setMethods((data ?? []) as PaymentMethodRow[]);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const addMethod = async () => {
    if (!userId || !formIsValid) return;
    setSaving(true);
    try {
      const payload = buildPaymentMethodInsert(userId, {
        type: 'bank_transfer',
        is_default: methods.length === 0,
        details: {
          iban: form.iban.trim(),
          bank_name: form.bankName.trim(),
          bank_account_name: form.accountName.trim(),
          label: form.label.trim(),
        },
      });
      const { data, error } = await supabase.from('payment_methods').insert(payload).select('*').single();
      if (error) throw error;
      setMethods((prev) => [...prev, data as PaymentMethodRow]);
      resetForm(); setAdding(false);
      showToast(tx('pages.settings.payment.toasts.added', undefined, 'Payout method saved'), 'success');
    } catch (err) {
      logger.error('Failed to add payment method', err);
      showToast(tx('pages.settings.payment.toasts.addError', undefined, 'Could not save payout method'), 'error');
    } finally { setSaving(false); }
  };

  const setDefault = async (id: string) => {
    if (!userId) return;
    try {
      await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', userId);
      const { error } = await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
      if (error) throw error;
      setMethods((prev) => prev.map((m) => ({ ...m, is_default: m.id === id })));
      showToast(tx('pages.settings.payment.toasts.defaultUpdated', undefined, 'Default updated'), 'success');
    } catch (err) { logger.error('Failed to set default', err); }
  };

  const removeMethod = async (id: string) => {
    try {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
      setMethods((prev) => prev.filter((m) => m.id !== id));
      showToast(tx('pages.settings.payment.toasts.removed', undefined, 'Payout method removed'), 'success');
    } catch (err) { logger.error('Failed to remove method', err); }
  };

  return (
    <div className="space-y-6">

      {/* ── Section 1: Payment Gateway ─────────────────────────── */}
      <div className="surface-card border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
        <h2 className="text-xl font-bold text-on-surface mb-1">Payment Gateway</h2>
        <p className="text-sm text-on-surface-muted mb-5">How clients fund contracts on WorkedIn.</p>

        {/* Dhmad — live */}
        <div className="rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: 'color-mix(in srgb,#8B5CF6 35%,var(--color-border-default))', background: 'color-mix(in srgb,#8B5CF6 6%,transparent)' }}>
          {/* Dhmad logo */}
          <div className="w-20 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1.5 bg-white">
            <img src="/logos/dhmad.svg" alt="Dhmad" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-on-surface">Dhmad Escrow</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-on-surface-muted mt-0.5">Secure escrow — funds held until work is approved. Used for all contracts.</p>
          </div>
          <button type="button" onClick={() => navigate('/wallet')} className="flex items-center gap-1.5 shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-surface hover:bg-surface transition-colors text-on-surface-muted hover:text-on-surface">
            Wallet <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Coming soon gateways */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'flouci', logo: '/logos/flouci.svg', label: 'Flouci', desc: 'Mobile wallet · 250K+ users' },
            { id: 'd17', logo: '/logos/d17.svg', label: 'D17 — DigiPostBank', desc: 'E-dinar · Government-backed' },
          ].map((g) => (
            <div key={g.id} className="rounded-xl border border-dashed border-surface p-3 flex items-center gap-3 opacity-60">
              {/* Logo */}
              <div className="w-20 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1.5 bg-white">
                <img src={g.logo} alt={g.label} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-on-surface-muted">{g.label}</p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/10 text-amber-500">
                    <Clock className="w-2.5 h-2.5" />Soon
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-subtle">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Payout methods ──────────────────────────────── */}
      <div className="surface-card border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Payout Methods</h2>
            <p className="text-sm text-on-surface-muted mt-0.5">Where you receive your earnings when you withdraw from your wallet.</p>
          </div>
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-white px-3 py-2 rounded-lg text-sm font-medium shrink-0" style={{ background: accentColor }}>
              <Plus className="w-4 h-4" />Add
            </button>
          )}
        </div>

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-5 border border-amber-500/15 bg-amber-500/5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Bank transfer (IBAN) is the only available payout channel right now. D17 and Flouci payouts are coming soon.
          </p>
        </div>

        {adding && (
          <div className="mb-5 border border-surface rounded-xl p-4 surface-sunken space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={form.iban} onChange={(e) => setForm((p) => ({ ...p, iban: e.target.value }))} placeholder="IBAN — TN59 …" className="sm:col-span-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] p-3 outline-none text-sm" />
              <input value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="Bank name" className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] p-3 outline-none text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.accountName} onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))} placeholder="Account holder name" className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] p-3 outline-none text-sm" />
              <input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="Friendly label (optional)" className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] p-3 outline-none text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setAdding(false); resetForm(); }} className="px-4 py-2 rounded-lg border border-surface text-on-surface-muted hover:text-on-surface text-sm">Cancel</button>
              <button type="button" onClick={() => void addMethod()} disabled={saving || !formIsValid} className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50" style={{ background: accentColor }}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-10 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} /></div>
        ) : methods.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-surface rounded-xl">
            <Shield className="w-10 h-10 text-on-surface-subtle mx-auto mb-3" />
            <p className="text-sm font-semibold text-on-surface">No payout method yet</p>
            <p className="text-xs text-on-surface-muted mt-1">Add a bank account to receive your earnings.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-4 rounded-xl border surface-sunken" style={{ borderColor: m.is_default ? `color-mix(in srgb,${accentColor} 50%,var(--color-border-default))` : 'var(--color-border-default)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb,${accentColor} 10%,transparent)` }}>
                  <CreditCard className="w-4 h-4" style={{ color: accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{getPaymentMethodLabel(m.type, m.label)}</p>
                  <p className="text-xs text-on-surface-muted font-mono mt-0.5">{getPaymentMethodDetails(m) || '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.is_default ? (
                    <span className="text-[10px] px-2 py-1 rounded-full font-semibold" style={{ background: `color-mix(in srgb,${accentColor} 14%,transparent)`, color: accentColor }}>Default</span>
                  ) : (
                    <button type="button" onClick={() => void setDefault(m.id)} className="text-[11px] px-2.5 py-1 rounded-lg border border-surface text-on-surface-muted hover:text-on-surface">Set default</button>
                  )}
                  <button type="button" onClick={() => void removeMethod(m.id)} className="p-1.5 rounded-lg border border-surface text-on-surface-muted hover:text-red-500" aria-label="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
  const { tx } = useTranslation();
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
        showToast(tx('pages.settings.privacy.toasts.deleteRequestInProgress', undefined, 'A deletion request is already in progress'), 'info');
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

      showToast(tx('pages.settings.privacy.toasts.deleteRequestSubmitted', undefined, 'Account deletion request submitted'), 'info');
    } catch (error) {
      logger.error('Failed to submit account deletion request', error);
      showToast(tx('pages.settings.privacy.toasts.deleteRequestError', undefined, 'Could not submit deletion request'), 'error');
    } finally {
      setSubmittingDeleteRequest(false);
    }
  };

  return (
    <div className="surface-card border rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
      <h2 className="text-xl font-bold mb-6 text-on-surface">{tx('pages.settings.privacy.title', undefined, 'Security & Privacy')}</h2>

      <div className="border border-surface rounded-xl p-4 mb-4 surface-sunken">
        <p className="text-sm font-semibold text-on-surface mb-1">{tx('pages.settings.privacy.changePassword', undefined, 'Change password')}</p>
        <p className="text-sm text-on-surface-muted">
          You signed in with {authProvider}. Password management is handled by your identity provider.
        </p>
      </div>

      <div className="border border-surface rounded-xl p-4 surface-sunken">
        <p className="text-sm font-semibold text-on-surface mb-1">{tx('pages.settings.privacy.activeSessions', undefined, 'Active sessions')}</p>
        <p className="text-sm text-on-surface-muted">{tx('pages.settings.privacy.currentSession', undefined, 'This device is your current session.')}</p>
        <button
          type="button"
          onClick={() => void onSignOutAll()}
          className="inline-flex items-center gap-2 border border-surface text-on-surface px-4 py-2 rounded-lg mt-3 transition-colors hover-surface"
          style={{ borderColor: `color-mix(in srgb, ${accentColor} 45%, var(--color-border-default))` }}
        >
          <RefreshCw className="w-4 h-4" />
          {tx('pages.settings.privacy.signOutAllDevices', undefined, 'Sign out from all devices')}
        </button>
      </div>

      <div className="border border-red-900/50 bg-red-500/5 rounded-xl p-6 mt-8">
        <div className="flex items-center gap-2 text-red-500 font-semibold">
          <AlertTriangle className="w-4 h-4" />
          <span>{tx('pages.settings.privacy.deleteAccount', undefined, 'Delete account')}</span>
        </div>
        <p className="text-red-200/70 text-sm mt-1">
          {tx('pages.settings.privacy.deleteAccountWarning', undefined, 'Your account and all data will be permanently deleted. This action cannot be undone.')}
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
  const { tx } = useTranslation();

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
      showToast(tx('pages.settings.privacy.toasts.signOutAllError', undefined, 'Could not sign out all devices'), 'error');
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
    <div className="page-bg-base">
      <Header />

      <div className="min-h-screen w-full page-bg-base p-4 md:p-8 flex justify-center">
        <div className="max-w-6xl w-full flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 shrink-0">
            <div
              className="surface-card border rounded-2xl p-4 relative overflow-hidden"
              style={{ borderColor: `color-mix(in srgb, ${accentColor} 28%, var(--color-border-default))` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 80%)` }} />
              <h1 className="text-2xl font-bold mb-2 text-on-surface">Settings</h1>
              <div className="mb-6">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                  style={{
                    color: accentColor,
                    borderColor: `color-mix(in srgb, ${accentColor} 35%, var(--color-border-default))`,
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
                          : 'text-on-surface-muted border-surface surface-sunken hover-surface hover:text-on-surface'
                      }`}
                      style={
                        isActive
                          ? {
                              background: `linear-gradient(90deg, color-mix(in srgb, ${accentColor} 14%, transparent) 0%, color-mix(in srgb, ${accentColor} 6%, transparent) 100%)`,
                              color: accentColor,
                              borderColor: `color-mix(in srgb, ${accentColor} 42%, var(--color-border-default))`,
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

              <div className="border-t border-surface mt-6 pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    navigate('/login', { replace: true });
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium text-on-surface-subtle hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{tx('pages.settings.actions.signOut', undefined, 'Sign Out')}</span>
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
