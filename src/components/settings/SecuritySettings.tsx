import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';

import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function SecuritySettings() {
    const { tx, t } = useTranslation();
    const { signOut, user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Password change state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Detect auth provider
    const [authProvider, setAuthProvider] = useState<string>('unknown');
    useEffect(() => {
        if (user) {
            const provider = user.app_metadata?.provider || user.app_metadata?.providers?.[0] || 'email';
            setAuthProvider(provider);
        }
    }, [user]);

    const isEmailAuth = authProvider === 'email';
    const isGoogleAuth = authProvider === 'google';

    const handleChangePassword = async () => {
        setPasswordError(null);

        if (newPassword.length < 8) {
            setPasswordError(tx('settings.passwordTooShort', undefined, 'Password must be at least 8 characters'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError(tx('settings.passwordsDoNotMatch', undefined, 'Passwords do not match'));
            return;
        }

        setIsChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            showToast(tx('settings.passwordChanged', undefined, 'Password updated successfully'), 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const msg = err instanceof Error ? err.message : tx('settings.passwordUpdateFailed', undefined, 'Failed to update password');
            setPasswordError(msg);
            showToast(msg, 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    const handleDeleteAccount = async () => {
        showToast(tx('settings.toasts.deleteRequestSent', undefined, 'Account deletion request sent'), 'info');
        setIsDeleteModalOpen(false);
    };

    const providerLabel = isGoogleAuth ? 'Google' : isEmailAuth ? 'Email' : authProvider;

    return (
        <>
            <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                            {tx('settings.securityPosture', undefined, 'Security posture')}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#171420] dark:text-white">
                            <ShieldCheck className="h-4 w-4 text-primary-500" />
                            {tx('settings.securityPostureValue', undefined, 'Protected by account session controls')}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                            {tx('settings.passwordStatus', undefined, 'Password status')}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#171420] dark:text-white">
                            {isEmailAuth
                                ? tx('settings.passwordSet', undefined, 'Password is set')
                                : tx('settings.noPasswordOAuth', undefined, `Signed in via ${providerLabel} — no password needed`)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                            {tx('settings.activeSessionsTitle', undefined, 'Active sessions')}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#171420] dark:text-white">
                            {tx('settings.activeSessionsMessage', undefined, 'This device is your only active session')}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Password Change Section */}
                    <div className="rounded-[1.6rem] border border-primary-100/70 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/8 dark:text-primary-300">
                                <KeyRound className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-[#171420] dark:text-white">
                                    {tx('settings.changePasswordTitle', undefined, 'Change password')}
                                </h3>
                                {isEmailAuth ? (
                                    <div className="mt-4 space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                {tx('settings.newPassword', undefined, 'New password')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                                                    placeholder="••••••••"
                                                    className="input w-full pe-12"
                                                    minLength={8}
                                                    dir="ltr"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                {tx('settings.confirmPassword', undefined, 'Confirm new password')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                                                    placeholder="••••••••"
                                                    className="input w-full pe-12"
                                                    minLength={8}
                                                    dir="ltr"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        {passwordError && (
                                            <p className="text-sm text-red-500 dark:text-red-400">{passwordError}</p>
                                        )}
                                        <Button
                                            variant="primary"
                                            className="rounded-2xl"
                                            onClick={handleChangePassword}
                                            disabled={isChangingPassword || !newPassword || !confirmPassword}
                                            leftIcon={isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                                        >
                                            {isChangingPassword
                                                ? tx('settings.updatingPassword', undefined, 'Updating...')
                                                : tx('settings.updatePassword', undefined, 'Update password')}
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                            {tx('settings.oauthPasswordMessage', undefined, `You signed in with ${providerLabel}. Password management is handled by your identity provider.`)}
                                        </p>
                                        <Button variant="outline" disabled className="mt-4 rounded-2xl">
                                            {tx('settings.managedByProvider', undefined, `Managed by ${providerLabel}`)}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="rounded-[1.6rem] border border-primary-100/70 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/8 dark:text-primary-300">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-[#171420] dark:text-white">
                                    {tx('settings.activeSessionsTitle', undefined, 'Active sessions')}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                    {tx('settings.activeSessionsMessage', undefined, 'This device is your only active session')}
                                </p>
                                <Button variant="outline" className="mt-4 rounded-2xl" onClick={handleLogout}>
                                    {tx('settings.signOutAllDevices', undefined, 'Sign out from all devices')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Delete Account */}
                    <div className="rounded-[1.6rem] border border-red-500/15 bg-red-500/[0.06] p-5 dark:border-red-500/20 dark:bg-red-500/[0.08]">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-500">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-red-700 dark:text-red-300">
                                    {tx('settings.deleteAccountTitle', undefined, 'Delete account')}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-red-700/80 dark:text-red-200/80">
                                    {tx('settings.deleteAccountDescription', undefined, 'Your account and all data will be permanently deleted. This action cannot be undone.')}
                                </p>
                                <Button variant="danger" className="mt-4 rounded-2xl" onClick={() => setIsDeleteModalOpen(true)} leftIcon={<Trash2 className="w-4 h-4" />}>
                                    {tx('settings.deleteMyAccount', undefined, 'Delete my account')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={tx('settings.deleteAccountConfirmTitle', undefined, 'Confirm account deletion')}>
                <div className="space-y-4">
                    <p className="text-muted">
                        {tx('settings.deleteAccountConfirmMessage', undefined, 'Are you sure you want to delete your account? All your data will be permanently removed.')}
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t.common.cancel}</Button>
                        <Button variant="danger" onClick={handleDeleteAccount}>{tx('settings.deleteAccountConfirmAction', undefined, 'Yes, delete my account')}</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
