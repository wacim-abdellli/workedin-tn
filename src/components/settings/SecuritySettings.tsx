import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, KeyRound, Loader2, Smartphone, Trash2 } from 'lucide-react';

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
                {/* Password Change Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" style={{ color: "var(--color-text-tertiary)" }} />
                        <h3 className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {tx('settings.changePasswordTitle', undefined, 'Change password')}
                        </h3>
                    </div>
                    {isEmailAuth ? (
                        <div className="space-y-3 max-w-md">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                                    {tx('settings.newPassword', undefined, 'New password')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                                        placeholder="••••••••"
                                        className="input w-full pe-10"
                                        minLength={8}
                                        dir="ltr"
                                        style={{ 
                                            background: "var(--color-background-base)", 
                                            borderColor: "var(--color-border-subtle)",
                                            color: "var(--color-text-primary)",
                                            fontSize: "0.875rem",
                                            padding: "0.625rem 0.75rem"
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors"
                                        style={{ color: "var(--color-text-tertiary)" }}
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        onMouseEnter={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
                                        onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-tertiary)"}
                                        aria-label={showNewPassword ? t.auth.password.hide : t.auth.password.show}
                                    >
                                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                                    {tx('settings.confirmPassword', undefined, 'Confirm new password')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                                        placeholder="••••••••"
                                        className="input w-full pe-10"
                                        minLength={8}
                                        dir="ltr"
                                        style={{ 
                                            background: "var(--color-background-base)", 
                                            borderColor: "var(--color-border-subtle)",
                                            color: "var(--color-text-primary)",
                                            fontSize: "0.875rem",
                                            padding: "0.625rem 0.75rem"
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors"
                                        style={{ color: "var(--color-text-tertiary)" }}
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        onMouseEnter={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
                                        onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-tertiary)"}
                                        aria-label={showConfirmPassword ? t.auth.password.hide : t.auth.password.show}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                            {passwordError && (
                                <p className="text-xs" style={{ color: "var(--color-status-error)" }}>{passwordError}</p>
                            )}
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleChangePassword}
                                disabled={isChangingPassword || !newPassword || !confirmPassword}
                                leftIcon={isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
                            >
                                {isChangingPassword
                                    ? tx('settings.updatingPassword', undefined, 'Updating...')
                                    : tx('settings.updatePassword', undefined, 'Update password')}
                            </Button>
                        </div>
                    ) : (
                        <div className="max-w-md">
                            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                {tx('settings.oauthPasswordMessage', undefined, `You signed in with ${providerLabel}. Password management is handled by your identity provider.`)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t" style={{ borderColor: "var(--color-border-subtle)" }} />

                {/* Active Sessions */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" style={{ color: "var(--color-text-tertiary)" }} />
                        <h3 className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {tx('settings.activeSessionsTitle', undefined, 'Active sessions')}
                        </h3>
                    </div>
                    <p className="text-sm max-w-md" style={{ color: "var(--color-text-secondary)" }}>
                        {tx('settings.activeSessionsMessage', undefined, 'This device is your only active session')}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        {tx('settings.signOutAllDevices', undefined, 'Sign out from all devices')}
                    </Button>
                </div>

                <div className="border-t" style={{ borderColor: "var(--color-border-subtle)" }} />

                {/* Delete Account */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" style={{ color: "var(--color-status-error)" }} />
                        <h3 className="text-sm font-medium" style={{ color: "var(--color-status-error)" }}>
                            {tx('settings.deleteAccountTitle', undefined, 'Delete account')}
                        </h3>
                    </div>
                    <p className="text-sm max-w-md" style={{ color: "var(--color-text-secondary)" }}>
                        {tx('settings.deleteAccountDescription', undefined, 'Your account and all data will be permanently deleted. This action cannot be undone.')}
                    </p>
                    <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                        {tx('settings.deleteMyAccount', undefined, 'Delete my account')}
                    </Button>
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
