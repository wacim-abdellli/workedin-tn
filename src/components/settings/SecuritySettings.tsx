import { Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
                {/* Password */}
                <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                    <h3 className="font-bold mb-2 text-foreground">{tx('settings.changePasswordTitle', undefined, 'Change password')}</h3>
                    <p className="text-muted text-sm mb-4">{tx('settings.noPasswordMessage', undefined, 'No password set - you are using phone sign in')}</p>
                    <Button variant="outline" disabled>{tx('settings.addPassword', undefined, 'Add password')}</Button>
                </div>

                {/* Sessions */}
                <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                    <h3 className="font-bold mb-2 text-foreground">{tx('settings.activeSessionsTitle', undefined, 'Active sessions')}</h3>
                    <p className="text-muted text-sm mb-4">{tx('settings.activeSessionsMessage', undefined, 'This device is your only active session')}</p>
                    <Button variant="outline" onClick={handleLogout}>{tx('settings.signOutAllDevices', undefined, 'Sign out from all devices')}</Button>
                </div>

                {/* Delete account */}
                <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
                    <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">{tx('settings.deleteAccountTitle', undefined, 'Delete account')}</h3>
                    <p className="text-red-600 dark:text-red-300 text-sm mb-4">
                        {tx('settings.deleteAccountDescription', undefined, 'Your account and all data will be permanently deleted. This action cannot be undone.')}
                    </p>
                    <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)} leftIcon={<Trash2 className="w-4 h-4" />}>
                        {tx('settings.deleteMyAccount', undefined, 'Delete my account')}
                    </Button>
                </div>
            </div>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={tx('settings.deleteAccountConfirmTitle', undefined, 'Confirm account deletion')}>
                <div className="space-y-4">
                    <p className="text-muted">{tx('settings.deleteAccountConfirmMessage', undefined, 'Are you sure you want to delete your account? All your data will be permanently removed.')}</p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t.common.cancel}</Button>
                        <Button variant="danger" onClick={handleDeleteAccount}>{tx('settings.deleteAccountConfirmAction', undefined, 'Yes, delete my account')}</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
