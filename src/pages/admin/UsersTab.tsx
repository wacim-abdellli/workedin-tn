import { useMemo, useState, useCallback } from 'react';
import { Ban, Eye, Loader2, Search, ShieldOff, Trash2, X, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { createNotification } from '@/lib/createNotification';
import { getIdentityNotificationCopy, normalizeIdentityNotificationLanguage } from '@/lib/identityNotificationCopy';
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
    const { tx } = useTranslation();
    const queryClient = useQueryClient();

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
    const [revokeModal, setRevokeModal] = useState<{ isOpen: boolean; user: AdminUser | null; reason: string }>({
        isOpen: false,
        user: null,
        reason: '',
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
                tx('dashboard.admin.users.userModeSwitchedTo', undefined, 'User mode switched to') +
                ` ${nextMode === 'freelancer' ? tx('dashboard.admin.users.freelancer', undefined, 'Freelancer') : tx('dashboard.admin.users.client', undefined, 'Client')}`,
                'success'
            );
        },
        onError: (error) => {
            console.error('Toggle user mode error:', error);
            showToast(tx('dashboard.admin.users.failedToSwitchUserMode', undefined, 'Failed to switch user mode'), 'error');
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
            showToast(tx('dashboard.admin.users.userDeletedSuccessfully', undefined, 'User deleted successfully'), 'success');
        },
        onError: (error) => {
            console.error('Delete user error:', error);
            showToast(tx('dashboard.admin.users.unableToDeleteUser', undefined, 'Unable to delete user'), 'error');
        },
        onSettled: () => {
            setUserActionLoadingId(null);
        },
    });

    const revokeVerificationMutation = useMutation({
        mutationFn: async ({ user, reason }: { user: AdminUser, reason: string }) => {
            const { data: recipientProfile } = await supabase
                .from('profiles')
                .select('preferred_language')
                .eq('id', user.id)
                .maybeSingle();
            const notificationCopy = getIdentityNotificationCopy('rejected', normalizeIdentityNotificationLanguage(recipientProfile?.preferred_language));

            const lang = normalizeIdentityNotificationLanguage(recipientProfile?.preferred_language);
            const reasonLabel = lang === 'ar' ? '\nالسبب: ' : lang === 'fr' ? '\nRaison: ' : '\nReason: ';
            const finalBody = reason ? `${notificationCopy.body}${reasonLabel}${reason}` : notificationCopy.body;

            // Use atomic RPC function to prevent race conditions
            const { data: rpcData, error: rpcError } = await supabase.rpc('revoke_verification_status', {
                p_user_id: user.id
            });

            if (rpcError) {
                throw rpcError;
            }

            console.log('[UsersTab] Verification revoked atomically:', rpcData);

            // Send notification separately (non-critical, can fail silently)
            const notificationError = await createNotification({
                userId: user.id,
                type: 'system',
                title: notificationCopy.title,
                body: finalBody,
            })
                .then(() => null)
                .catch((error) => error);

            // Log notification errors for debugging, but don't fail the operation
            if (notificationError) {
                console.warn('[Admin] Notification insert failed (non-critical):', notificationError);
            }

            return user.id;
        },
        onSuccess: (userId) => {
            updateUsersCache((prev) => prev.map((user) => (
                user.id === userId ? { ...user, cin_verified: false } : user
            )));
            setSelectedUser((prev) => (prev?.id === userId ? { ...prev, cin_verified: false } : prev));
            // User will be notified via notification center
        },
        onError: (error) => {
            console.error('Revoke verification error:', error);
            showToast(tx('dashboard.admin.users.unableToRevokeVerification', undefined, 'Unable to revoke verification'), 'error');
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
        try {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;
            
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) 
                return tx('dashboard.admin.users.justNow', undefined, 'Just now');
            if (diffMins < 60) 
                return `${diffMins}${tx('dashboard.admin.users.minutesAbbr', undefined, 'm')}`;
            if (diffHours < 24) 
                return `${diffHours}${tx('dashboard.admin.users.hoursAbbr', undefined, 'h')}`;
            if (diffDays < 7) 
                return `${diffDays}${tx('dashboard.admin.users.daysAbbr', undefined, 'd')}`;
            if (diffDays < 30) 
                return `${Math.floor(diffDays / 7)}${tx('dashboard.admin.users.weeksAbbr', undefined, 'w')}`;
            
            return `${Math.floor(diffDays / 30)}${tx('dashboard.admin.users.monthsAbbr', undefined, 'mo')}`;
        } catch (error) {
            return value;
        }
    };

    const getDisplayName = (user: AdminUser) => user.name || tx('dashboard.admin.users.user', undefined, 'User');

    const handleToggleUserMode = (user: AdminUser) => {
        setUserActionLoadingId(user.id);
        toggleUserModeMutation.mutate(user);
    };

    const handleDeleteUser = (user: AdminUser) => {
        setConfirmAction({
            isOpen: true,
            title: tx('dashboard.admin.users.deleteUser', undefined, 'Delete User'),
            message: `${tx('dashboard.admin.users.deleteUserConfirm', undefined, 'Do you want to delete user')} ${getDisplayName(user)}? ${tx('dashboard.admin.users.actionCannotBeUndone', undefined, 'This action cannot be undone.')}`,
            actionType: 'danger',
            onConfirm: () => {
                setUserActionLoadingId(user.id);
                deleteUserMutation.mutate(user);
            },
        });
    };

    const handleRevokeVerification = (user: AdminUser) => {
        setRevokeModal({
            isOpen: true,
            user,
            reason: '',
        });
    };

    const closeRevokeModal = useCallback(() => {
        setRevokeModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    const confirmRevokeVerification = () => {
        const { user, reason } = revokeModal;
        if (!user) return;
        
        setRevokeModal((prev) => ({ ...prev, isOpen: false }));
        setUserActionLoadingId(user.id);
        revokeVerificationMutation.mutate({ user, reason });
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
                                placeholder={tx('dashboard.admin.users.searchByNameOrEmail', undefined, 'Search by name or email...')}
                                className={inputClass}
                            />
                        </div>
                        <select
                            value={userFilter}
                            onChange={(event) => setUserFilter(event.target.value as typeof userFilter)}
                            className={`${selectClass} min-w-[180px]`}
                        >
                            <option value="all">{tx('dashboard.admin.users.allUsers', undefined, 'All users')}</option>
                            <option value="freelancer">{tx('dashboard.admin.users.freelancers', undefined, 'Freelancers')}</option>
                            <option value="client">{tx('dashboard.admin.users.clients', undefined, 'Clients')}</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                        <p className="text-muted">{tx('dashboard.admin.users.loadingUsers', undefined, 'Loading users...')}</p>
                    </div>
                ) : isError ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <p className="text-red-500 font-medium">{tx('dashboard.admin.users.failedToLoadUsers', undefined, 'Failed to load users')}</p>
                        <p className="text-sm text-muted mt-1">{tx('dashboard.admin.users.checkDatabasePermissions', undefined, 'Check database permissions (is_admin = true)')}</p>
                    </div>
                ) : (
                    <>
                        <div className={tableShellClass}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className={tableHeadClass}>
                                        <tr>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.users.user', undefined, 'User')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.users.type', undefined, 'Type')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.users.status', undefined, 'Status')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.users.lastActivity', undefined, 'Last activity')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.users.actions', undefined, 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12">
                                                    <EmptyState
                                                        icon={Users}
                                                        title={tx('dashboard.admin.users.noUsersMatch', undefined, 'No users match your search')}
                                                        description={tx('dashboard.admin.users.tryAdjustingSearch', undefined, 'Try adjusting your search criteria or filters')}
                                                        action={{
                                                            label: tx('dashboard.admin.users.clearSearch', undefined, 'Clear search'),
                                                            onClick: () => setSearchQuery(''),
                                                            variant: 'outline',
                                                        }}
                                                    />
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
                                                        {user.type === 'freelancer' ? tx('dashboard.admin.users.freelancer', undefined, 'Freelancer') : tx('dashboard.admin.users.client', undefined, 'Client')}
                                                    </span>
                                                    <span className="ms-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300">
                                                        {tx('dashboard.admin.users.mode', undefined, 'Mode')}: {user.active_mode === 'freelancer' ? tx('dashboard.admin.users.freelancer', undefined, 'Freelancer') : tx('dashboard.admin.users.client', undefined, 'Client')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${user.cin_verified
                                                        ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                        : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                                        }`}>
                                                        {user.cin_verified ? tx('dashboard.admin.users.verified', undefined, 'Verified') : tx('dashboard.admin.users.unverified', undefined, 'Unverified')}
                                                    </span>
                                                    {user.is_admin && (
                                                        <span className="ms-2 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">{tx('dashboard.admin.users.admin', undefined, 'Admin')}</span>
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
                                                            title={tx('dashboard.admin.users.revokeVerification', undefined, 'Revoke Verification')}
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
                                            {user.cin_verified ? tx('dashboard.admin.users.verified', undefined, 'Verified') : tx('dashboard.admin.users.unverified', undefined, 'Unverified')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm text-muted">{tx('dashboard.admin.users.type', undefined, 'Type')}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.type === 'freelancer'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {user.type === 'freelancer' ? tx('dashboard.admin.users.freelancer', undefined, 'Freelancer') : tx('dashboard.admin.users.client', undefined, 'Client')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm text-muted">{tx('dashboard.admin.users.activeMode', undefined, 'Active mode')}</span>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                            {user.active_mode === 'freelancer' ? tx('dashboard.admin.users.freelancer', undefined, 'Freelancer') : tx('dashboard.admin.users.client', undefined, 'Client')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 mb-4">
                                        <span className="text-sm text-muted">{tx('dashboard.admin.users.lastActivity', undefined, 'Last activity')}</span>
                                        <span className="text-sm text-foreground">{formatAdminDate(user.last_active)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                                        <Button size="sm" variant="outline" className="flex-1 justify-center" onClick={() => setSelectedUser(user)}>
                                            <Eye className="w-4 h-4 ml-1" />
                                            {tx('dashboard.admin.users.view', undefined, 'View')}
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
                                                {tx('dashboard.admin.users.revoke', undefined, 'Revoke')}
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
                                            {tx('dashboard.admin.users.switch', undefined, 'Switch')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:bg-red-50 flex-1 justify-center"
                                            disabled={userActionLoadingId === user.id}
                                            onClick={() => handleDeleteUser(user)}
                                        >
                                            <Trash2 className="w-4 h-4 ml-1" />
                                            {tx('dashboard.admin.users.delete', undefined, 'Delete')}
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
                                <h3 className="text-lg font-bold text-foreground">{tx('dashboard.admin.users.userDetails', undefined, 'User details')}</h3>
                                <p className="text-sm text-muted">{selectedUser.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 rounded-lg hover:bg-surface"
                                aria-label={tx('dashboard.admin.users.close', undefined, 'Close')}
                            >
                                <X className="w-4 h-4 text-muted" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <p><strong>{tx('dashboard.admin.users.name', undefined, 'Name')}:</strong> {getDisplayName(selectedUser)}</p>
                            <p><strong>{tx('dashboard.admin.users.email', undefined, 'Email')}:</strong> {selectedUser.email || '-'}</p>
                            <p><strong>{tx('dashboard.admin.users.accountType', undefined, 'Account type')}:</strong> {selectedUser.type}</p>
                            <p><strong>{tx('dashboard.admin.users.activeMode', undefined, 'Active mode')}:</strong> {selectedUser.active_mode || tx('dashboard.admin.users.client', undefined, 'Client')}</p>
                            <p><strong>{tx('dashboard.admin.users.identityVerification', undefined, 'Identity verification')}:</strong> {selectedUser.cin_verified ? tx('dashboard.admin.users.yes', undefined, 'Yes') : tx('dashboard.admin.users.no', undefined, 'No')}</p>
                            <p><strong>{tx('dashboard.admin.users.admin', undefined, 'Admin')}:</strong> {selectedUser.is_admin ? tx('dashboard.admin.users.yes', undefined, 'Yes') : tx('dashboard.admin.users.no', undefined, 'No')}</p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                disabled={userActionLoadingId === selectedUser.id}
                                onClick={() => handleToggleUserMode(selectedUser)}
                            >
                                <Ban className="w-4 h-4 ml-1" />
                                {tx('dashboard.admin.users.switchMode', undefined, 'Switch mode')}
                            </Button>
                            <Button
                                variant="danger"
                                disabled={userActionLoadingId === selectedUser.id}
                                onClick={() => handleDeleteUser(selectedUser)}
                            >
                                <Trash2 className="w-4 h-4 ml-1" />
                                {tx('dashboard.admin.users.deleteUser', undefined, 'Delete user')}
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
                            {tx('dashboard.admin.users.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant={confirmAction.actionType === 'danger' ? 'danger' : 'primary'}
                            className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}
                            onClick={() => {
                                closeConfirm();
                                confirmAction.onConfirm();
                            }}
                        >
                            {tx('dashboard.admin.users.confirm', undefined, 'Confirm')}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal 
                isOpen={revokeModal.isOpen} 
                onClose={closeRevokeModal} 
                title={tx('dashboard.admin.users.revokeVerification', undefined, 'Revoke Verification')} 
                size="md"
            >
                <div className="space-y-6 pt-2">
                    <p className="text-muted leading-relaxed font-medium">
                        {tx('dashboard.admin.users.revokeVerificationConfirm', undefined, 'Are you sure you want to revoke verification for this user? They will need to submit their ID again.')}
                    </p>
                    
                    <div className="space-y-2">
                        <label htmlFor="revoke-reason" className="block text-sm font-medium text-foreground">
                            {tx('dashboard.admin.users.revokeReasonLabel', undefined, 'Reason for revocation (Optional)')}
                        </label>
                        <textarea
                            id="revoke-reason"
                            value={revokeModal.reason}
                            onChange={(e) => setRevokeModal(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder={tx('dashboard.admin.users.revokeReasonPlaceholder', undefined, 'e.g., ID document is expired...')}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none min-h-[100px] text-foreground"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                        <Button 
                            variant="ghost" 
                            className="text-muted hover:bg-surface" 
                            onClick={closeRevokeModal}
                        >
                            {tx('dashboard.admin.users.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={confirmRevokeVerification}
                        >
                            {tx('dashboard.admin.users.revoke', undefined, 'Revoke')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </ErrorBoundary>
    );
}
