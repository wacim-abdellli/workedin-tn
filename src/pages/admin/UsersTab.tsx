import { useMemo, useState } from 'react';
import { Ban, Eye, Loader2, Search, ShieldOff, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/i18n';
import type { AdminUser, AdminUserRow } from '@/types/admin';

export const ADMIN_USERS_QUERY_KEY = ['admin-users'] as const;

interface ConfirmActionState {
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id,full_name,email,user_type,active_mode,cin_verified,is_admin,created_at')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('fetchAdminUsers error:', error);
            throw new Error(`Failed to fetch users: ${error.message}`);
        }

        const rows = (data ?? []) as AdminUserRow[];

        return rows.map((user) => ({
            id: user.id,
            name: user.full_name || '',
            email: user.email || '',
            type: user.user_type || 'client',
            status: 'active',
            last_active: user.created_at,
            active_mode: user.active_mode ?? null,
            cin_verified: Boolean(user.cin_verified),
            is_admin: Boolean(user.is_admin),
        }));
    } catch (error) {
        // Ignore abort errors in development (React StrictMode)
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Query aborted (likely React StrictMode)');
            return [];
        }
        throw error;
    }
}

export default function UsersTab() {
    const { showToast } = useToast();
    const { language } = useTranslation();
    const queryClient = useQueryClient();
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
    const tr = (ar: string, en: string, fr?: string) => {
        if (language === 'ar') return ar;
        if (language === 'fr') return fr || en;
        return en;
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState<'all' | 'freelancer' | 'client'>('all');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [userActionLoadingId, setUserActionLoadingId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmActionState>({
        isOpen: false,
        title: '',
        message: '',
        actionType: 'primary',
        onConfirm: () => {},
    });

    const panelClass = 'card border border-border bg-card shadow-sm';
    const tableShellClass = 'hidden md:block card p-0 overflow-hidden border-border bg-card';
    const tableHeadClass = 'bg-surface border-b border-border sticky top-0 z-10 backdrop-blur';
    const tableRowClass = 'group hover:bg-surface transition-colors border-b border-border/50 last:border-0';
    const iconActionClass = 'p-2 rounded-xl bg-surface hover:bg-border text-muted transition-colors';
    const inputClass = 'w-full h-12 pe-11 ps-4 border rounded-xl bg-input border-input focus:border-input-focus text-foreground placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30';
    const selectClass = 'h-12 px-4 border rounded-xl bg-input border-input focus:border-input-focus text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30';

    const closeConfirm = () => setConfirmAction((prev) => ({ ...prev, isOpen: false }));

    const { data: users = [], isLoading, isError } = useQuery({
        queryKey: ADMIN_USERS_QUERY_KEY,
        queryFn: fetchAdminUsers,
        retry: 1,
        staleTime: 30000, // Cache for 30 seconds
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const updateUsersCache = (updater: (prev: AdminUser[]) => AdminUser[]) => {
        queryClient.setQueryData<AdminUser[]>(ADMIN_USERS_QUERY_KEY, (prev = []) => updater(prev));
    };

    const toggleUserModeMutation = useMutation({
        mutationFn: async (user: AdminUser) => {
            const nextMode: 'client' | 'freelancer' = user.active_mode === 'freelancer' ? 'client' : 'freelancer';
            const { error } = await supabase
                .from('profiles')
                .update({
                    active_mode: nextMode,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);
            if (error) throw error;

            return { userId: user.id, nextMode };
        },
        onSuccess: ({ userId, nextMode }) => {
            updateUsersCache((prev) => prev.map((user) => (
                user.id === userId ? { ...user, active_mode: nextMode } : user
            )));
            setSelectedUser((prev) => (prev?.id === userId ? { ...prev, active_mode: nextMode } : prev));
            showToast(
                tr('تم تحويل وضع المستخدم إلى', 'User mode switched to', 'Mode utilisateur bascule vers') +
                ` ${nextMode === 'freelancer' ? tr('مستقل', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}`,
                'success'
            );
        },
        onError: (error) => {
            console.error('Toggle user mode error:', error);
            showToast(tr('فشل تغيير وضع المستخدم', 'Failed to switch user mode', 'Echec du changement de mode utilisateur'), 'error');
        },
        onSettled: () => {
            setUserActionLoadingId(null);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (user: AdminUser) => {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);
            if (error) throw error;

            return user.id;
        },
        onSuccess: (userId) => {
            updateUsersCache((prev) => prev.filter((user) => user.id !== userId));
            setSelectedUser((prev) => (prev?.id === userId ? null : prev));
            showToast(tr('تم حذف المستخدم بنجاح', 'User deleted successfully', 'Utilisateur supprime avec succes'), 'success');
        },
        onError: (error) => {
            console.error('Delete user error:', error);
            showToast(tr('تعذر حذف المستخدم', 'Unable to delete user', 'Impossible de supprimer l utilisateur'), 'error');
        },
        onSettled: () => {
            setUserActionLoadingId(null);
        },
    });

    const revokeVerificationMutation = useMutation({
        mutationFn: async (user: AdminUser) => {
            const results = await Promise.all([
                supabase
                    .from('profiles')
                    .update({
                        cin_verified: false,
                        cin_submitted: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', user.id),
                supabase
                    .from('freelancer_profiles')
                    .update({ cin_verified: false })
                    .eq('id', user.id),
                supabase
                    .from('identity_verifications')
                    .delete()
                    .eq('user_id', user.id),
            ]);
            const firstError = results.find(r => r.error);
            if (firstError?.error) throw firstError.error;

            return user.id;
        },
        onSuccess: (userId) => {
            updateUsersCache((prev) => prev.map((user) => (
                user.id === userId ? { ...user, cin_verified: false } : user
            )));
            setSelectedUser((prev) => (prev?.id === userId ? { ...prev, cin_verified: false } : prev));
            showToast(tr('تم إلغاء التوثيق بنجاح', 'Verification revoked successfully', 'Verification revoquee avec succes'), 'success');
        },
        onError: (error) => {
            console.error('Revoke verification error:', error);
            showToast(tr('تعذر إلغاء التوثيق', 'Unable to revoke verification', 'Impossible de revoquer la verification'), 'error');
        },
        onSettled: () => {
            setUserActionLoadingId(null);
        },
    });

    const filteredUsers = useMemo(() => users.filter((user) => {
        if (userFilter !== 'all' && user.type !== userFilter) return false;
        if (searchQuery && !user.name.includes(searchQuery) && !user.email.includes(searchQuery)) return false;
        return true;
    }), [searchQuery, userFilter, users]);

    const formatAdminDate = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    };

    const getDisplayName = (user: AdminUser) => user.name || tr('مستخدم', 'User', 'Utilisateur');

    const handleToggleUserMode = (user: AdminUser) => {
        setUserActionLoadingId(user.id);
        toggleUserModeMutation.mutate(user);
    };

    const handleDeleteUser = (user: AdminUser) => {
        setConfirmAction({
            isOpen: true,
            title: tr('حذف المستخدم', 'Delete User', 'Supprimer l utilisateur'),
            message: `${tr('هل تريد حذف المستخدم', 'Do you want to delete user', 'Voulez-vous supprimer l utilisateur')} ${getDisplayName(user)}? ${tr('هذا الإجراء لا يمكن التراجع عنه.', 'This action cannot be undone.', 'Cette action est irreversible.')}`,
            actionType: 'danger',
            onConfirm: () => {
                setUserActionLoadingId(user.id);
                deleteUserMutation.mutate(user);
            },
        });
    };

    const handleRevokeVerification = (user: AdminUser) => {
        setConfirmAction({
            isOpen: true,
            title: tr('إلغاء التوثيق', 'Revoke Verification', 'Revoquer la verification'),
            message: tr('هل أنت متأكد من إلغاء توثيق هذا المستخدم؟ سيحتاج لتقديم هويته مجدداً.', 'Are you sure you want to revoke verification for this user? They will need to submit their ID again.', 'Etes-vous sur de vouloir revoquer la verification de cet utilisateur ?'),
            actionType: 'warning',
            onConfirm: () => {
                setUserActionLoadingId(user.id);
                revokeVerificationMutation.mutate(user);
            },
        });
    };

    return (
        <ErrorBoundary
            titleAr="فشل تحميل قسم المستخدمين — حاول التحديث"
            titleFr="Echec du chargement des utilisateurs — essayez de rafraichir"
            titleEn="Failed to load Users tab — try refreshing"
        >
            <div className="space-y-6">
                <div className={panelClass}>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={tr('بحث بالاسم أو البريد...', 'Search by name or email...', 'Rechercher par nom ou email...')}
                                className={inputClass}
                            />
                        </div>
                        <select
                            value={userFilter}
                            onChange={(event) => setUserFilter(event.target.value as typeof userFilter)}
                            className={`${selectClass} min-w-[180px]`}
                        >
                            <option value="all">{tr('جميع المستخدمين', 'All users', 'Tous les utilisateurs')}</option>
                            <option value="freelancer">{tr('موظفين حرين', 'Freelancers', 'Freelances')}</option>
                            <option value="client">{tr('عملاء', 'Clients', 'Clients')}</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                        <p className="text-muted">{tr('جاري تحميل المستخدمين...', 'Loading users...', 'Chargement des utilisateurs...')}</p>
                    </div>
                ) : isError ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <p className="text-red-500 font-medium">{tr('تعذر تحميل المستخدمين', 'Failed to load users', 'Impossible de charger les utilisateurs')}</p>
                        <p className="text-sm text-muted mt-1">{tr('تحقق من صلاحيات قاعدة البيانات (is_admin = true)', 'Check database permissions (is_admin = true)', 'Verifiez les permissions base de donnees (is_admin = true)')}</p>
                    </div>
                ) : (
                    <>
                        <div className={tableShellClass}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className={tableHeadClass}>
                                        <tr>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('المستخدم', 'User', 'Utilisateur')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('النوع', 'Type', 'Type')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('الحالة', 'Status', 'Statut')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('آخر نشاط', 'Last activity', 'Derniere activite')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('إجراءات', 'Actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-muted">
                                                    <Search className="w-8 h-8 mx-auto mb-2 text-muted/50" />
                                                    <p className="font-medium">{tr('لا يوجد مستخدمون مطابقون', 'No users match your search', 'Aucun utilisateur ne correspond')}</p>
                                                </td>
                                            </tr>
                                        ) : filteredUsers.map((user) => (
                                            <tr key={user.id} className={tableRowClass}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-cyan-700/20">
                                                            {getDisplayName(user).charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground whitespace-nowrap">{getDisplayName(user)}</p>
                                                            <p className="text-sm text-muted whitespace-nowrap">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${user.type === 'freelancer'
                                                        ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                                        : 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300'
                                                        }`}>
                                                        {user.type === 'freelancer' ? tr('موظف حر', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}
                                                    </span>
                                                    <span className="ms-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300">
                                                        {tr('الوضع', 'Mode', 'Mode')}: {user.active_mode === 'freelancer' ? tr('مستقل', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${user.cin_verified
                                                        ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                        : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                                        }`}>
                                                        {user.cin_verified ? tr('موثق', 'Verified', 'Verifie') : tr('غير موثق', 'Unverified', 'Non verifie')}
                                                    </span>
                                                    {user.is_admin && (
                                                        <span className="ms-2 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">{tr('مشرف', 'Admin', 'Admin')}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted whitespace-nowrap">{formatAdminDate(user.last_active)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedUser(user)}
                                                            className={`${iconActionClass} hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-500/10`}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {user.cin_verified && (
                                                            <button
                                                                disabled={userActionLoadingId === user.id}
                                                                onClick={() => handleRevokeVerification(user)}
                                                                title={tr('إلغاء التوثيق', 'Revoke Verification', 'Revoquer la verification')}
                                                                className={`${iconActionClass} hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 disabled:opacity-50`}
                                                            >
                                                                <ShieldOff className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            disabled={userActionLoadingId === user.id}
                                                            onClick={() => handleToggleUserMode(user)}
                                                            className={`${iconActionClass} hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-50`}
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            disabled={userActionLoadingId === user.id}
                                                            onClick={() => handleDeleteUser(user)}
                                                            className={`${iconActionClass} hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="md:hidden space-y-4">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className={`${panelClass} p-4`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold shrink-0">
                                                {getDisplayName(user).charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{getDisplayName(user)}</p>
                                                <p className="text-xs text-muted">{user.email}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {user.cin_verified ? tr('موثق', 'Verified', 'Verifie') : tr('غير موثق', 'Unverified', 'Non verifie')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm text-muted">{tr('النوع', 'Type', 'Type')}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.type === 'freelancer'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {user.type === 'freelancer' ? tr('موظف حر', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm text-muted">{tr('الوضع النشط', 'Active mode', 'Mode actif')}</span>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                            {user.active_mode === 'freelancer' ? tr('مستقل', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 mb-4">
                                        <span className="text-sm text-muted">{tr('آخر نشاط', 'Last activity', 'Derniere activite')}</span>
                                        <span className="text-sm text-foreground">{formatAdminDate(user.last_active)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                                        <Button size="sm" variant="outline" className="flex-1 justify-center" onClick={() => setSelectedUser(user)}>
                                            <Eye className="w-4 h-4 ml-1" />
                                            {tr('عرض', 'View', 'Voir')}
                                        </Button>
                                        {user.cin_verified && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-amber-600 hover:bg-amber-50 flex-1 justify-center"
                                                disabled={userActionLoadingId === user.id}
                                                onClick={() => handleRevokeVerification(user)}
                                            >
                                                <ShieldOff className="w-4 h-4 ml-1" />
                                                {tr('إلغاء', 'Revoke', 'Revoquer')}
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-yellow-600 hover:bg-yellow-50 flex-1 justify-center"
                                            disabled={userActionLoadingId === user.id}
                                            onClick={() => handleToggleUserMode(user)}
                                        >
                                            <Ban className="w-4 h-4 ml-1" />
                                            {tr('تبديل', 'Switch', 'Basculer')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:bg-red-50 flex-1 justify-center"
                                            disabled={userActionLoadingId === user.id}
                                            onClick={() => handleDeleteUser(user)}
                                        >
                                            <Trash2 className="w-4 h-4 ml-1" />
                                            {tr('حذف', 'Delete', 'Supprimer')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl card bg-card border-border shadow-xl">
                        <div className="flex items-start justify-between gap-3 mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{tr('تفاصيل المستخدم', 'User details', 'Details utilisateur')}</h3>
                                <p className="text-sm text-muted">{selectedUser.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 rounded-lg hover:bg-surface"
                                aria-label={tr('إغلاق', 'Close', 'Fermer')}
                            >
                                <X className="w-4 h-4 text-muted" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <p><strong>{tr('الاسم', 'Name', 'Nom')}:</strong> {getDisplayName(selectedUser)}</p>
                            <p><strong>{tr('البريد', 'Email', 'Email')}:</strong> {selectedUser.email || '-'}</p>
                            <p><strong>{tr('نوع الحساب', 'Account type', 'Type de compte')}:</strong> {selectedUser.type}</p>
                            <p><strong>{tr('الوضع النشط', 'Active mode', 'Mode actif')}:</strong> {selectedUser.active_mode || tr('عميل', 'Client', 'Client')}</p>
                            <p><strong>{tr('توثيق الهوية', 'Identity verification', 'Verification d identite')}:</strong> {selectedUser.cin_verified ? tr('نعم', 'Yes', 'Oui') : tr('لا', 'No', 'Non')}</p>
                            <p><strong>{tr('مشرف', 'Admin', 'Admin')}:</strong> {selectedUser.is_admin ? tr('نعم', 'Yes', 'Oui') : tr('لا', 'No', 'Non')}</p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                disabled={userActionLoadingId === selectedUser.id}
                                onClick={() => handleToggleUserMode(selectedUser)}
                            >
                                <Ban className="w-4 h-4 ml-1" />
                                {tr('تبديل الوضع', 'Switch mode', 'Basculer le mode')}
                            </Button>
                            <Button
                                variant="danger"
                                disabled={userActionLoadingId === selectedUser.id}
                                onClick={() => handleDeleteUser(selectedUser)}
                            >
                                <Trash2 className="w-4 h-4 ml-1" />
                                {tr('حذف المستخدم', 'Delete user', 'Supprimer l utilisateur')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={confirmAction.isOpen} onClose={closeConfirm} title={confirmAction.title} size="md">
                <div className="space-y-6 pt-2">
                    <p className="text-muted leading-relaxed font-medium">{confirmAction.message}</p>
                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                        <Button variant="ghost" className="text-muted hover:bg-surface" onClick={closeConfirm}>
                            {tr('إلغاء', 'Cancel', 'Annuler')}
                        </Button>
                        <Button
                            variant={confirmAction.actionType === 'danger' ? 'danger' : 'primary'}
                            className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}
                            onClick={() => {
                                closeConfirm();
                                confirmAction.onConfirm();
                            }}
                        >
                            {tr('تأكيد', 'Confirm', 'Confirmer')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </ErrorBoundary>
    );
}
