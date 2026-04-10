import { useMemo, useState, useCallback } from 'react';
import { Ban, Eye, Loader2, Repeat2, Search, ShieldOff, Trash2, UserX, X, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/i18n';
import type { AdminUser, AdminUserRow } from '@/types/admin';
import { useAuth } from '@/contexts/AuthContext';
import { adminActionButtonClass, adminIconButtonClass, adminInputClass, adminPanelClass, adminPillClass, adminSelectClass, adminTableHeadClass, adminTableRowClass, adminTableShellClass, adminToolbarClass } from './adminTheme';
import AdminSelect from './AdminSelect';

export const ADMIN_USERS_QUERY_KEY = ['admin-users'] as const;

type SortField = 'name' | 'email' | 'created_at' | 'status' | 'type';
type SortDirection = 'asc' | 'desc';

interface ConfirmActionState {
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
}

interface AdminUserDetails {
    profile: Record<string, unknown> | null;
    freelancerProfile: Record<string, unknown> | null;
    wallet: Record<string, unknown> | null;
    counts: {
        jobs: number;
        proposals: number;
        contracts: number;
        messages: number;
        reviews: number;
    };
}

function getErrorText(error: unknown): string {
    if (!error) return '';
    if (error instanceof Error) return error.message || '';
    if (typeof error === 'string') return error;
    if (typeof error === 'object') {
        const parts: string[] = [];
        const maybeCode = 'code' in error && typeof error.code === 'string' ? error.code : '';
        const maybeMessage = 'message' in error && typeof error.message === 'string' ? error.message : '';
        const maybeDetails = 'details' in error && typeof error.details === 'string' ? error.details : '';
        const maybeHint = 'hint' in error && typeof error.hint === 'string' ? error.hint : '';
        if (maybeCode) parts.push(maybeCode);
        if (maybeMessage) parts.push(maybeMessage);
        if (maybeDetails) parts.push(maybeDetails);
        if (maybeHint) parts.push(maybeHint);
        return parts.join(' | ');
    }
    return String(error);
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    try {
        let { data, error } = await supabase
            .from('profiles')
            .select('id,full_name,email,user_type,active_mode,cin_verified,is_admin,is_super_admin,account_status,created_at')
            .order('created_at', { ascending: false })
            .limit(100);

        // Temporary compatibility path until the account_status migration is applied everywhere.
        if (error?.message?.toLowerCase().includes('account_status')) {
            const fallback = await supabase
                .from('profiles')
                .select('id,full_name,email,user_type,active_mode,cin_verified,is_admin,is_super_admin,created_at')
                .order('created_at', { ascending: false })
                .limit(100);

            data = fallback.data?.map((row) => ({ ...row, account_status: 'active' })) as typeof data;
            error = fallback.error;
        }

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
            status: user.account_status || 'active',
            last_active: user.created_at,
            active_mode: user.active_mode ?? null,
            cin_verified: Boolean(user.cin_verified),
            is_admin: Boolean(user.is_admin),
            is_super_admin: Boolean(user.is_super_admin),
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
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const isCurrentUserSuperAdmin = Boolean(profile?.is_super_admin);

    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState<'all' | 'freelancer' | 'client'>('all');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
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

    const panelClass = adminPanelClass;
    const tableShellClass = `hidden md:block ${adminTableShellClass}`;
    const tableHeadClass = adminTableHeadClass;
    const tableRowClass = adminTableRowClass;
    const iconActionClass = adminIconButtonClass;
    const inputClass = `pe-11 ps-4 ${adminInputClass}`;
    const selectClass = adminSelectClass;

    const closeConfirm = () => setConfirmAction((prev) => ({ ...prev, isOpen: false }));

    const { data: selectedUserDetails, isLoading: isLoadingUserDetails } = useQuery({
        queryKey: ['admin-user-details', selectedUser?.id],
        enabled: Boolean(selectedUser?.id),
        staleTime: 30000,
        queryFn: async (): Promise<AdminUserDetails> => {
            const userId = selectedUser?.id;
            if (!userId) {
                return {
                    profile: null,
                    freelancerProfile: null,
                    wallet: null,
                    counts: { jobs: 0, proposals: 0, contracts: 0, messages: 0, reviews: 0 },
                };
            }

            const functionResult = await supabase.functions.invoke('admin-user-control', {
                body: {
                    action: 'get_user_details',
                    userId,
                },
            });

            if (!functionResult.error && functionResult.data && typeof functionResult.data === 'object' && 'data' in functionResult.data) {
                const payload = functionResult.data.data as AdminUserDetails;
                return {
                    profile: payload?.profile ?? null,
                    freelancerProfile: payload?.freelancerProfile ?? null,
                    wallet: payload?.wallet ?? null,
                    counts: {
                        jobs: payload?.counts?.jobs ?? 0,
                        proposals: payload?.counts?.proposals ?? 0,
                        contracts: payload?.counts?.contracts ?? 0,
                        messages: payload?.counts?.messages ?? 0,
                        reviews: payload?.counts?.reviews ?? 0,
                    },
                };
            }

            const profileExtended = await supabase
                .from('profiles')
                .select('id,full_name,email,username,phone,location,bio,user_type,active_mode,is_admin,cin_verified,cin_submitted,account_status,onboarding_completed,client_onboarding_completed,freelancer_onboarding_completed,avatar_url,avatar_url_client,avatar_url_freelancer,company_name,company_website,company_industry,company_size,company_role,hiring_needs,project_budget_preference,project_timeline_preference,communication_preferences,screening_preferences,legal_preferences,created_at,updated_at')
                .eq('id', userId)
                .maybeSingle();

            const profileBasic = await supabase
                .from('profiles')
                .select('id,full_name,email,username,phone,location,bio,user_type,active_mode,is_admin,cin_verified,cin_submitted,account_status,onboarding_completed,client_onboarding_completed,freelancer_onboarding_completed,avatar_url,created_at,updated_at')
                .eq('id', userId)
                .maybeSingle();

            const freelancerExtended = await supabase
                .from('freelancer_profiles')
                .select('id,title,hourly_rate,availability,skills,languages,education,certifications,total_earnings,jobs_completed,success_rate,response_time_hours,profile_views,portfolio_items_count,cin_verified,voice_intro_url,years_experience,tools,industries,portfolio_links,weekly_availability_hours,revision_policy,project_preferences,created_at,updated_at')
                .eq('id', userId)
                .maybeSingle();

            const freelancerBasic = await supabase
                .from('freelancer_profiles')
                .select('id,title,hourly_rate,availability,skills,languages,education,certifications,total_earnings,jobs_completed,success_rate,response_time_hours,profile_views,portfolio_items_count,cin_verified,voice_intro_url,created_at,updated_at')
                .eq('id', userId)
                .maybeSingle();

            const walletData = await supabase
                .from('wallets')
                .select('id,user_id,available_balance,pending_balance,total_earned,total_withdrawn,updated_at')
                .eq('user_id', userId)
                .maybeSingle();

            const [jobsCount, proposalsCount, contractsAsClientCount, contractsAsFreelancerCount, messagesSentCount, messagesReceivedCount, reviewsGivenCount, reviewsReceivedCount] = await Promise.all([
                supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('client_id', userId),
                supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('freelancer_id', userId),
                supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('client_id', userId),
                supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('freelancer_id', userId),
                supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId),
                supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', userId),
                supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewer_id', userId),
                supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewee_id', userId),
            ]);

            return {
                profile: (profileExtended.data ?? profileBasic.data) as Record<string, unknown> | null,
                freelancerProfile: (freelancerExtended.data ?? freelancerBasic.data) as Record<string, unknown> | null,
                wallet: (walletData.data ?? null) as Record<string, unknown> | null,
                counts: {
                    jobs: jobsCount.count ?? 0,
                    proposals: proposalsCount.count ?? 0,
                    contracts: (contractsAsClientCount.count ?? 0) + (contractsAsFreelancerCount.count ?? 0),
                    messages: (messagesSentCount.count ?? 0) + (messagesReceivedCount.count ?? 0),
                    reviews: (reviewsGivenCount.count ?? 0) + (reviewsReceivedCount.count ?? 0),
                },
            };
        },
    });

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

    const setUserStatusMutation = useMutation({
        mutationFn: async ({ user, nextStatus, reason }: { user: AdminUser; nextStatus: AdminUser['status']; reason?: string }) => {
            // If reactivating an archived user, use the new restore_user_account RPC function
            if (nextStatus === 'active' && user.status === 'archived') {
                const { data: restoreResult, error: restoreError } = await supabase.rpc('restore_user_account', {
                    p_user_id: user.id,
                    p_reason: reason ?? 'Restored by admin from admin dashboard',
                });

                if (restoreError) {
                    // Fallback to manual restoration if RPC doesn't exist yet
                    const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
                    
                    const restoreData: Record<string, unknown> = {
                        account_status: nextStatus,
                        updated_at: new Date().toISOString(),
                    };

                    // Restore email from auth if available
                    if (authUser?.user?.email && user.email.includes('deleted_')) {
                        restoreData.email = authUser.user.email;
                    }

                    // Restore full_name from auth metadata if available
                    if (authUser?.user?.user_metadata?.full_name) {
                        restoreData.full_name = authUser.user.user_metadata.full_name;
                    } else if (user.name === 'Deleted User') {
                        restoreData.full_name = 'Restored User';
                    }

                    const { error: fallbackError } = await supabase
                        .from('profiles')
                        .update(restoreData)
                        .eq('id', user.id);

                    if (fallbackError) throw fallbackError;

                    return { userId: user.id, nextStatus, restoredName: restoreData.full_name as string };
                }

                // Extract restored name from RPC result
                const restoredName = restoreResult?.restored_name || user.name;
                return { userId: user.id, nextStatus, restoredName };
            }

            const functionResult = await supabase.functions.invoke('admin-user-control', {
                body: {
                    action: 'set_user_status',
                    userId: user.id,
                    nextStatus,
                    reason: reason ?? null,
                },
            });

            if (!functionResult.error) {
                return { userId: user.id, nextStatus };
            }

            const rpcResult = await supabase.rpc('set_user_account_status', {
                p_user_id: user.id,
                p_next_status: nextStatus,
                p_reason: reason ?? null,
            });

            if (rpcResult.error) {
                const rpcCode = rpcResult.error.code?.toLowerCase() || '';
                const rpcMessage = rpcResult.error.message?.toLowerCase() || '';
                const isMissingRpc = rpcMessage.includes('set_user_account_status')
                    && (rpcMessage.includes('does not exist') || rpcMessage.includes('could not find'));
                const isRpcPermissionIssue = rpcMessage.includes('permission denied')
                    && rpcMessage.includes('set_user_account_status');
                const isCreateNotificationOverloadConflict = (
                    rpcCode === '42725'
                    || rpcMessage.includes('is not unique')
                ) && (rpcMessage.includes('create_notification') || rpcCode === '42725');
                const isCreateNotificationEnumMismatch = (
                    rpcCode === '42804'
                    || rpcMessage.includes('notification_type_enum')
                    || rpcMessage.includes('column "type" is of type')
                ) && rpcMessage.includes('notification');

                if (isMissingRpc || isRpcPermissionIssue || isCreateNotificationOverloadConflict || isCreateNotificationEnumMismatch) {
                    const fallback = await supabase
                        .from('profiles')
                        .update({
                            account_status: nextStatus,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', user.id);

                    if (fallback.error) {
                        throw fallback.error;
                    }
                } else {
                    throw rpcResult.error;
                }
            }

            return { userId: user.id, nextStatus };
        },
        onSuccess: ({ userId, nextStatus, restoredName }) => {
            updateUsersCache((prev) => prev.map((user) => (
                user.id === userId ? { 
                    ...user, 
                    status: nextStatus,
                    name: restoredName || user.name 
                } : user
            )));
            setSelectedUser((prev) => (prev?.id === userId ? { 
                ...prev, 
                status: nextStatus,
                name: restoredName || prev.name 
            } : prev));
            
            // Refresh the query to get updated data from server
            queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
            
            showToast(
                nextStatus === 'active'
                    ? tx('dashboard.admin.users.userReactivated', undefined, 'User reactivated successfully')
                    : tx('dashboard.admin.users.userSuspended', undefined, 'User suspended successfully'),
                'success'
            );
        },
        onError: (error) => {
            console.error('Set user status error:', error);
            const rawMessage = getErrorText(error);
            const normalized = rawMessage.toLowerCase();

            if (normalized.includes('only admins can update account status')) {
                showToast(tx('dashboard.admin.users.adminPrivilegesRequired', undefined, 'Action blocked: your account is not marked as admin in profiles.'), 'error');
                return;
            }

            if (normalized.includes('account_status')) {
                showToast(tx('dashboard.admin.users.accountStatusMigrationMissing', undefined, 'Action blocked: account_status is missing in database. Apply latest Supabase migrations.'), 'error');
                return;
            }

            if (
                normalized.includes('row-level security')
                || normalized.includes('permission denied')
                || normalized.includes('42501')
            ) {
                showToast(tx('dashboard.admin.users.adminPermissionsOutOfSync', undefined, 'Action blocked by database permissions. Confirm this user is admin in production DB and latest RLS migrations are applied.'), 'error');
                return;
            }

            if (normalized.includes('create_notification') && normalized.includes('not unique')) {
                showToast(tx('dashboard.admin.users.notificationFunctionConflict', undefined, 'Database function conflict detected for notifications. Apply latest Supabase SQL fixes.'), 'error');
                return;
            }

            showToast(tx('dashboard.admin.users.unableToUpdateStatus', undefined, 'Unable to update user status'), 'error');
            if (rawMessage) {
                showToast(rawMessage.slice(0, 200), 'error');
            }
        },
        onSettled: () => {
            setUserActionLoadingId(null);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async ({
            user,
            mode,
            reason,
        }: {
            user: AdminUser;
            mode: 'soft' | 'hard';
            reason?: string;
        }) => {
            // For soft delete (archive), use the new archive_user_account RPC function
            if (mode === 'soft') {
                const { data: archiveResult, error: archiveError } = await supabase.rpc('archive_user_account', {
                    p_user_id: user.id,
                    p_reason: reason ?? 'Archived by admin from admin dashboard',
                });

                if (archiveError) {
                    // Fallback to manual archiving if RPC doesn't exist yet
                    const fallback = await supabase
                        .from('profiles')
                        .update({
                            account_status: 'archived',
                            full_name: 'Deleted User',
                            username: `deleted_${user.id.slice(0, 8)}`,
                            phone: null,
                            location: null,
                            bio: null,
                            avatar_url: null,
                            avatar_url_client: null,
                            avatar_url_freelancer: null,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', user.id);

                    if (fallback.error) throw fallback.error;
                }

                return { userId: user.id, mode };
            }

            // For hard delete, use the edge function
            const action = 'hard_delete_user';
            const functionResult = await supabase.functions.invoke('admin-user-control', {
                body: {
                    action,
                    userId: user.id,
                    reason: reason ?? null,
                },
            });

            if (functionResult.error) {
                throw functionResult.error;
            }

            return { userId: user.id, mode };
        },
        onSuccess: ({ userId, mode }) => {
            if (mode === 'soft') {
                updateUsersCache((prev) => prev.map((user) => (
                    user.id === userId ? { ...user, status: 'archived' } : user
                )));
                setSelectedUser((prev) => (prev?.id === userId ? { ...prev, status: 'archived' } : prev));
                showToast(tx('dashboard.admin.users.userArchived', undefined, 'User archived successfully'), 'success');
                return;
            }

            updateUsersCache((prev) => prev.filter((user) => user.id !== userId));
            setSelectedUser((prev) => (prev?.id === userId ? null : prev));
            showToast(tx('dashboard.admin.users.userDeletedPermanently', undefined, 'User deleted permanently'), 'success');
        },
        onError: (error) => {
            const rawMessage = getErrorText(error);
            showToast(tx('dashboard.admin.users.unableToDeleteUser', undefined, 'Unable to delete user'), 'error');
            if (rawMessage) {
                showToast(rawMessage.slice(0, 220), 'error');
            } else {
                showToast(tx('dashboard.admin.users.edgeFunctionDeployHint', undefined, 'If this is a hard delete, deploy admin-user-control edge function and verify ALLOWED_ORIGINS.'), 'warning');
            }
        },
        onSettled: () => {
            setUserActionLoadingId(null);
        },
    });

    const revokeVerificationMutation = useMutation({
        mutationFn: async ({ user, reason }: { user: AdminUser, reason: string }) => {
            const { data: rpcData, error: rpcError } = await supabase.rpc('revoke_verification_status', {
                p_user_id: user.id,
                p_admin_note: reason || null,
            });

            if (rpcError) {
                throw rpcError;
            }

            console.log('[UsersTab] Verification revoked atomically:', rpcData);

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

    const filteredUsers = useMemo(() => {
        let filtered = users.filter((user) => {
            if (userFilter !== 'all' && user.type !== userFilter) return false;
            if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) && !user.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });

        // Sort users
        filtered.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch (sortField) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'email':
                    aValue = a.email.toLowerCase();
                    bValue = b.email.toLowerCase();
                    break;
                case 'created_at':
                    aValue = new Date(a.last_active).getTime();
                    bValue = new Date(b.last_active).getTime();
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'type':
                    aValue = a.type;
                    bValue = b.type;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [searchQuery, userFilter, users, sortField, sortDirection]);

    const handleToggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
        return sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
    };

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
        } catch (_error) {
            return value;
        }
    };

    const getDisplayName = (user: AdminUser) => {
        // Fix: Show actual name for reactivated users instead of "Deleted User"
        if (user.status === 'active' && user.name && user.name !== 'Deleted User') {
            return user.name;
        }
        if (user.name && user.name !== 'Deleted User') {
            return user.name;
        }
        return tx('dashboard.admin.users.user', undefined, 'User');
    };
    const getAccountStatusTone = (status: AdminUser['status']): Parameters<typeof adminPillClass>[0] => status === 'active' ? 'emerald' : status === 'suspended' ? 'red' : 'amber';
    const getAccountStatusLabel = (status: AdminUser['status']) => {
        if (status === 'suspended') return tx('dashboard.admin.users.suspended', undefined, 'Suspended');
        if (status === 'archived') return tx('dashboard.admin.users.archived', undefined, 'Archived');
        return tx('dashboard.admin.users.active', undefined, 'Active');
    };

    const handleToggleUserMode = (user: AdminUser) => {
        setUserActionLoadingId(user.id);
        toggleUserModeMutation.mutate(user);
    };

    const handleToggleUserStatus = (user: AdminUser) => {
        if (user.is_super_admin) {
            showToast(tx('dashboard.admin.users.superAdminProtected', undefined, 'Super admin accounts cannot be moderated from this control.'), 'warning');
            return;
        }

        const nextStatus: AdminUser['status'] = user.status === 'active' ? 'suspended' : 'active';
        setConfirmAction({
            isOpen: true,
            title: nextStatus === 'active'
                ? tx('dashboard.admin.users.reactivateUser', undefined, 'Reactivate user')
                : tx('dashboard.admin.users.suspendUser', undefined, 'Suspend user'),
            message: nextStatus === 'active'
                ? `${tx('dashboard.admin.users.reactivateUserConfirm', undefined, 'Do you want to restore access for user')} ${getDisplayName(user)}?`
                : `${tx('dashboard.admin.users.suspendUserConfirm', undefined, 'Do you want to suspend user')} ${getDisplayName(user)}? ${tx('dashboard.admin.users.suspensionKeepsHistory', undefined, 'Their contracts, payments, disputes, and audit history will be kept.')}`,
            actionType: nextStatus === 'active' ? 'primary' : 'warning',
            onConfirm: () => {
                setUserActionLoadingId(user.id);
                setUserStatusMutation.mutate({
                    user,
                    nextStatus,
                    reason: nextStatus === 'active'
                        ? 'Access restored by admin'
                        : 'Suspended by admin from admin dashboard',
                });
            },
        });
    };

    const handleArchiveUser = (user: AdminUser) => {
        if (user.is_super_admin) {
            showToast(tx('dashboard.admin.users.superAdminProtected', undefined, 'Super admin accounts cannot be moderated from this control.'), 'warning');
            return;
        }

        setConfirmAction({
            isOpen: true,
            title: tx('dashboard.admin.users.archiveUser', undefined, 'Archive user'),
            message: `${tx('dashboard.admin.users.archiveUserConfirm', undefined, 'Archive this user account and anonymize profile data while keeping legal and financial history?')} ${getDisplayName(user)}.`,
            actionType: 'warning',
            onConfirm: () => {
                setUserActionLoadingId(user.id);
                deleteUserMutation.mutate({
                    user,
                    mode: 'soft',
                    reason: 'Archived by admin from admin dashboard',
                });
            },
        });
    };

    const handleHardDeleteUser = (user: AdminUser) => {
        if (!isCurrentUserSuperAdmin) {
            showToast(tx('dashboard.admin.users.superAdminOnlyDelete', undefined, 'Permanent deletion requires super admin privileges.'), 'error');
            return;
        }

        if (user.is_admin || user.is_super_admin) {
            showToast(tx('dashboard.admin.users.cannotDeleteAdminAccount', undefined, 'Admin accounts cannot be permanently deleted from this action.'), 'error');
            return;
        }

        setConfirmAction({
            isOpen: true,
            title: tx('dashboard.admin.users.deleteUserPermanently', undefined, 'Delete user permanently'),
            message: `${tx('dashboard.admin.users.deleteUserPermanentWarning', undefined, 'This action is irreversible. User auth account and all cascading records will be removed if policy checks pass.')} ${getDisplayName(user)}.`,
            actionType: 'danger',
            onConfirm: () => {
                setUserActionLoadingId(user.id);
                deleteUserMutation.mutate({
                    user,
                    mode: 'hard',
                    reason: 'Hard-deleted by super admin from admin dashboard',
                });
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
                <div className={adminToolbarClass}>
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
                        <AdminSelect
                            value={userFilter}
                            onChange={(v) => setUserFilter(v as typeof userFilter)}
                            className="min-w-[180px]"
                            options={[
                                { value: 'all', label: tx('dashboard.admin.users.allUsers', undefined, 'All users') },
                                { value: 'freelancer', label: tx('dashboard.admin.users.freelancers', undefined, 'Freelancers') },
                                { value: 'client', label: tx('dashboard.admin.users.clients', undefined, 'Clients') },
                            ]}
                        />
                        <AdminSelect
                            value={`${sortField}-${sortDirection}`}
                            onChange={(v) => {
                                const [field, direction] = v.split('-') as [SortField, SortDirection];
                                setSortField(field);
                                setSortDirection(direction);
                            }}
                            className="min-w-[200px]"
                            options={[
                                { value: 'created_at-desc', label: tx('dashboard.admin.users.sortNewest', undefined, 'Newest first') },
                                { value: 'created_at-asc', label: tx('dashboard.admin.users.sortOldest', undefined, 'Oldest first') },
                                { value: 'name-asc', label: tx('dashboard.admin.users.sortNameAZ', undefined, 'Name (A-Z)') },
                                { value: 'name-desc', label: tx('dashboard.admin.users.sortNameZA', undefined, 'Name (Z-A)') },
                                { value: 'email-asc', label: tx('dashboard.admin.users.sortEmailAZ', undefined, 'Email (A-Z)') },
                                { value: 'email-desc', label: tx('dashboard.admin.users.sortEmailZA', undefined, 'Email (Z-A)') },
                                { value: 'status-asc', label: tx('dashboard.admin.users.sortStatusAsc', undefined, 'Status (Active first)') },
                                { value: 'status-desc', label: tx('dashboard.admin.users.sortStatusDesc', undefined, 'Status (Archived first)') },
                            ]}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-primary)] mx-auto mb-2" />
                        <p className="text-muted">{tx('dashboard.admin.users.loadingUsers', undefined, 'Loading users...')}</p>
                    </div>
                ) : isError ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <p className="text-[var(--color-status-error)] font-medium">{tx('dashboard.admin.users.failedToLoadUsers', undefined, 'Failed to load users')}</p>
                        <p className="text-sm text-muted mt-1">{tx('dashboard.admin.users.checkDatabasePermissions', undefined, 'Check database permissions (is_admin = true)')}</p>
                    </div>
                ) : (
                    <>
                        <div className={tableShellClass}>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px]">
                                    <thead className={tableHeadClass}>
                                        <tr>
                                            <th className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleToggleSort('name')}
                                                    className="flex items-center gap-2 text-xs font-semibold text-muted whitespace-nowrap tracking-wide hover:text-foreground transition-colors"
                                                >
                                                    {tx('dashboard.admin.users.user', undefined, 'User')}
                                                    {getSortIcon('name')}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleToggleSort('type')}
                                                    className="flex items-center gap-2 text-xs font-semibold text-muted whitespace-nowrap tracking-wide hover:text-foreground transition-colors"
                                                >
                                                    {tx('dashboard.admin.users.type', undefined, 'Type')}
                                                    {getSortIcon('type')}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleToggleSort('status')}
                                                    className="flex items-center gap-2 text-xs font-semibold text-muted whitespace-nowrap tracking-wide hover:text-foreground transition-colors"
                                                >
                                                    {tx('dashboard.admin.users.status', undefined, 'Status')}
                                                    {getSortIcon('status')}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleToggleSort('created_at')}
                                                    className="flex items-center gap-2 text-xs font-semibold text-muted whitespace-nowrap tracking-wide hover:text-foreground transition-colors"
                                                >
                                                    {tx('dashboard.admin.users.lastActivity', undefined, 'Last activity')}
                                                    {getSortIcon('created_at')}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.users.actions', undefined, 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
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
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-base font-bold text-white shadow-md shadow-sky-900/20 shrink-0">
                                                            {getDisplayName(user).charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground whitespace-nowrap">{getDisplayName(user)}</p>
                                                            <p className="mt-0.5 text-sm text-muted whitespace-nowrap">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${user.type === 'freelancer'
                                                        ? adminPillClass('blue')
                                                        : adminPillClass('violet')
                                                        }`}>
                                                        {user.type === 'freelancer' ? tx('dashboard.admin.users.freelancer', undefined, 'Freelancer') : tx('dashboard.admin.users.client', undefined, 'Client')}
                                                    </span>
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${adminPillClass('primary')}`}>
                                                        {tx('dashboard.admin.users.mode', undefined, 'Mode')}: {user.active_mode === 'freelancer' ? tx('dashboard.admin.users.freelancer', undefined, 'Freelancer') : tx('dashboard.admin.users.client', undefined, 'Client')}
                                                    </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${adminPillClass(getAccountStatusTone(user.status))}`}>
                                                        {getAccountStatusLabel(user.status)}
                                                    </span>
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${user.cin_verified
                                                        ? adminPillClass('emerald')
                                                        : adminPillClass('amber')
                                                        }`}>
                                                        {user.cin_verified ? tx('dashboard.admin.users.verified', undefined, 'Verified') : tx('dashboard.admin.users.unverified', undefined, 'Unverified')}
                                                    </span>
                                                    {user.is_admin && (
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${adminPillClass('indigo')}`}>{tx('dashboard.admin.users.admin', undefined, 'Admin')}</span>
                                                    )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm font-medium text-muted whitespace-nowrap">{formatAdminDate(user.last_active)}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            onClick={() => setSelectedUser(user)}
                                                            className={`${adminActionButtonClass} border-sky-500/15 text-sky-200 hover:bg-sky-500/10`}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            <span>{tx('dashboard.admin.users.view', undefined, 'View')}</span>
                                                        </button>
                                                        {user.cin_verified && (
                                                        <button
                                                            disabled={userActionLoadingId === user.id}
                                                            onClick={() => handleRevokeVerification(user)}
                                                            title={tx('dashboard.admin.users.revokeVerification', undefined, 'Revoke Verification')}
                                                            className={`${iconActionClass} hover:text-[var(--color-status-warning)] dark:hover:text-[var(--color-status-warning)] hover:bg-[var(--color-status-warning-subtle)] dark:hover:bg-[var(--color-status-warning)]/10 disabled:opacity-50`}
                                                        >
                                                                <ShieldOff className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            disabled={userActionLoadingId === user.id}
                                                            onClick={() => handleToggleUserMode(user)}
                                                            className={`${iconActionClass} hover:text-[var(--color-status-warning)] dark:hover:text-[var(--color-status-warning)] hover:bg-[var(--color-status-warning-subtle)] dark:hover:bg-[var(--color-status-warning)]/10 disabled:opacity-50`}
                                                        >
                                                            <Repeat2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            disabled={userActionLoadingId === user.id}
                                                            onClick={() => handleToggleUserStatus(user)}
                                                            className={`${iconActionClass} hover:text-[var(--color-status-error)] dark:hover:text-[var(--color-status-error)] hover:bg-[var(--color-status-error-subtle)] dark:hover:bg-[var(--color-status-error)]/10 disabled:opacity-50`}
                                                        >
                                                            <Ban className="w-4 h-4" />
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${adminPillClass(getAccountStatusTone(user.status))}`}>
                                            {getAccountStatusLabel(user.status)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm text-muted">{tx('dashboard.admin.users.type', undefined, 'Type')}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.type === 'freelancer'
                                            ? adminPillClass('blue')
                                            : adminPillClass('violet')
                                             }`}>
                                            {user.type === 'freelancer' ? tx('dashboard.admin.users.freelancer', undefined, 'Freelancer') : tx('dashboard.admin.users.client', undefined, 'Client')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm text-muted">{tx('dashboard.admin.users.activeMode', undefined, 'Active mode')}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${adminPillClass('primary')}`}>
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
                                                className="text-[var(--color-status-warning)] hover:bg-[var(--color-status-warning-subtle)] flex-1 justify-center"
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
                                            className="text-[var(--color-status-warning)] hover:bg-[var(--color-status-warning-subtle)] flex-1 justify-center"
                                            disabled={userActionLoadingId === user.id}
                                            onClick={() => handleToggleUserMode(user)}
                                        >
                                            <Repeat2 className="w-4 h-4 ml-1" />
                                            {tx('dashboard.admin.users.switch', undefined, 'Switch')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-[var(--color-status-error)] hover:bg-[var(--color-status-error-subtle)] flex-1 justify-center"
                                            disabled={userActionLoadingId === user.id}
                                            onClick={() => handleToggleUserStatus(user)}
                                        >
                                            <Ban className="w-4 h-4 ml-1" />
                                            {user.status === 'active'
                                                ? tx('dashboard.admin.users.suspend', undefined, 'Suspend')
                                                : tx('dashboard.admin.users.reactivate', undefined, 'Reactivate')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {selectedUser && (
                <div 
                    className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 sm:py-8"
                    onClick={() => setSelectedUser(null)}
                >
                <div 
                    className={`${adminPanelClass} w-full max-w-xl p-6 sm:p-7 max-h-[calc(100vh-2rem)] overflow-y-auto`}
                    onClick={(e) => e.stopPropagation()}
                >
                        <div className="flex items-start justify-between gap-3 mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{tx('dashboard.admin.users.userDetails', undefined, 'User details')}</h3>
                                <p className="text-sm text-muted">{selectedUser!.id}</p>
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
                            <p><strong>{tx('dashboard.admin.users.name', undefined, 'Name')}:</strong> {getDisplayName(selectedUser!)}</p>
                            <p><strong>{tx('dashboard.admin.users.email', undefined, 'Email')}:</strong> {selectedUser!.email || '-'}</p>
                            <p><strong>{tx('dashboard.admin.users.accountType', undefined, 'Account type')}:</strong> {selectedUser!.type}</p>
                            <p><strong>{tx('dashboard.admin.users.accountStatus', undefined, 'Account status')}:</strong> {getAccountStatusLabel(selectedUser!.status)}</p>
                            <p><strong>{tx('dashboard.admin.users.activeMode', undefined, 'Active mode')}:</strong> {selectedUser!.active_mode || tx('dashboard.admin.users.client', undefined, 'Client')}</p>
                            <p><strong>{tx('dashboard.admin.users.identityVerification', undefined, 'Identity verification')}:</strong> {selectedUser!.cin_verified ? tx('dashboard.admin.users.yes', undefined, 'Yes') : tx('dashboard.admin.users.no', undefined, 'No')}</p>
                            <p><strong>{tx('dashboard.admin.users.admin', undefined, 'Admin')}:</strong> {selectedUser!.is_admin ? tx('dashboard.admin.users.yes', undefined, 'Yes') : tx('dashboard.admin.users.no', undefined, 'No')}</p>
                            <p><strong>{tx('dashboard.admin.users.superAdmin', undefined, 'Super admin')}:</strong> {selectedUser!.is_super_admin ? tx('dashboard.admin.users.yes', undefined, 'Yes') : tx('dashboard.admin.users.no', undefined, 'No')}</p>
                        </div>

                        <div className="mt-5 rounded-xl border border-border/70 bg-surface/40 p-4">
                            <p className="mb-3 text-sm font-semibold text-foreground">{tx('dashboard.admin.users.fullAccessData', undefined, 'Full access data')}</p>
                            {isLoadingUserDetails ? (
                                <div className="flex items-center gap-2 text-sm text-muted">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {tx('common.loading', undefined, 'Loading...')}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tx('dashboard.admin.users.activityCounts', undefined, 'Activity counts')}</p>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-lg border border-border/60 px-2 py-1">Jobs: {selectedUserDetails?.counts.jobs ?? 0}</div>
                                            <div className="rounded-lg border border-border/60 px-2 py-1">Proposals: {selectedUserDetails?.counts.proposals ?? 0}</div>
                                            <div className="rounded-lg border border-border/60 px-2 py-1">Contracts: {selectedUserDetails?.counts.contracts ?? 0}</div>
                                            <div className="rounded-lg border border-border/60 px-2 py-1">Messages: {selectedUserDetails?.counts.messages ?? 0}</div>
                                            <div className="rounded-lg border border-border/60 px-2 py-1">Reviews: {selectedUserDetails?.counts.reviews ?? 0}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Profile JSON</p>
                                        <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border/60 bg-background/80 p-2 text-[11px] leading-5 text-foreground">{JSON.stringify(selectedUserDetails?.profile ?? {}, null, 2)}</pre>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Freelancer Profile JSON</p>
                                        <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border/60 bg-background/80 p-2 text-[11px] leading-5 text-foreground">{JSON.stringify(selectedUserDetails?.freelancerProfile ?? {}, null, 2)}</pre>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Wallet JSON</p>
                                        <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-border/60 bg-background/80 p-2 text-[11px] leading-5 text-foreground">{JSON.stringify(selectedUserDetails?.wallet ?? {}, null, 2)}</pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                disabled={userActionLoadingId === selectedUser!.id}
                                onClick={() => handleToggleUserMode(selectedUser!)}
                            >
                                <Repeat2 className="w-4 h-4 ml-1" />
                                {tx('dashboard.admin.users.switchMode', undefined, 'Switch mode')}
                            </Button>
                            <Button
                                variant={selectedUser!.status === 'active' ? 'danger' : 'primary'}
                                disabled={userActionLoadingId === selectedUser!.id}
                                onClick={() => handleToggleUserStatus(selectedUser!)}
                            >
                                <Ban className="w-4 h-4 ml-1" />
                                {selectedUser!.status === 'active'
                                    ? tx('dashboard.admin.users.suspendUser', undefined, 'Suspend user')
                                    : tx('dashboard.admin.users.reactivateUser', undefined, 'Reactivate user')}
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-[var(--color-status-warning)] hover:bg-[var(--color-status-warning-subtle)]"
                                disabled={userActionLoadingId === selectedUser!.id || selectedUser!.is_super_admin}
                                onClick={() => handleArchiveUser(selectedUser!)}
                            >
                                <UserX className="w-4 h-4 ml-1" />
                                {tx('dashboard.admin.users.archiveUser', undefined, 'Archive user')}
                            </Button>
                            {isCurrentUserSuperAdmin && (
                                <Button
                                    variant="danger"
                                    disabled={
                                        userActionLoadingId === selectedUser!.id
                                        || selectedUser!.is_admin
                                        || selectedUser!.is_super_admin
                                    }
                                    onClick={() => handleHardDeleteUser(selectedUser!)}
                                >
                                    <Trash2 className="w-4 h-4 ml-1" />
                                    {tx('dashboard.admin.users.deletePermanently', undefined, 'Delete permanently')}
                                </Button>
                            )}
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
                            className={confirmAction.actionType === 'warning' ? 'bg-[var(--color-status-warning)] hover:bg-[var(--color-status-warning-hover)] text-white border-transparent shadow shadow-amber-600/30' : ''}
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
                            className={`${adminInputClass} min-h-[100px] resize-none px-4 py-3 h-auto`}
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
