import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, KeyRound, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';

import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function SecuritySettings() {
    const { tx, t } = useTranslation();
    const { signOut } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleDeleteAccount = async () => {
        showToast(tx('settings.toasts.deleteRequestSent'), 'info');
        setIsDeleteModalOpen(false);
    };

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
                            {tx('settings.noPasswordMessage', undefined, 'No password set - you are using phone sign in')}
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
                    <div className="rounded-[1.6rem] border border-primary-100/70 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/8 dark:text-primary-300">
                                <KeyRound className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-[#171420] dark:text-white">
                                    {tx('settings.changePasswordTitle', undefined, 'Change password')}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                    {tx('settings.noPasswordMessage', undefined, 'No password set - you are using phone sign in')}
                                </p>
                                <Button variant="outline" disabled className="mt-4 rounded-2xl">
                                    {tx('settings.addPassword', undefined, 'Add password')}
                                </Button>
                            </div>
                        </div>
                    </div>

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
