import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseAnon } from '@/lib/supabase';
import { getStuckTransactions } from '@/services/payments';
import { ADMIN_USERS_QUERY_KEY, fetchAdminUsers } from '@/pages/admin/UsersTab';
import { ADMIN_JOBS_QUERY_KEY, fetchAdminJobs } from '@/pages/admin/JobsTab';
import { fetchVerifications } from '@/pages/admin/VerificationsTab';
import type { IdentityVerification } from '@/types/admin';
import type { StuckTransaction } from '@/types/payment';

interface AdminStats {
    totalUsers: number;
    activeJobs: number;
    activeContracts: number;
    totalRevenue: number;
    todaySignups: number;
    todayContracts: number;
}

interface DisputeRecord {
    id: string;
    contract_id: string;
    opened_at: string;
    reason: string;
    status: string;
    contract: { id: string; amount: number; job: { title: string } } | null;
    opener: { full_name: string; email: string } | null;
}

async function countWithRetry(queryFn: () => PromiseLike<{ count: number | null; error: unknown }>) {
    const { count } = await Promise.race([
        queryFn(),
        new Promise<{ count: number | null; error: unknown }>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 8000)
        )
    ]);
    return count ?? 0;
}

export function useAdminStats() {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        activeJobs: 0,
        activeContracts: 0,
        totalRevenue: 0,
        todaySignups: 0,
        todayContracts: 0,
    });

    const fetchStats = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [usersCount, jobsCount, contractsCount, signupsCount, todayContractsCount] = await Promise.all([
                countWithRetry(() => supabaseAnon.from('profiles').select('id', { count: 'exact', head: true })),
                countWithRetry(() => supabaseAnon.from('jobs').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])),
                countWithRetry(() => supabaseAnon.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'active')),
                countWithRetry(() => supabaseAnon.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today)),
                countWithRetry(() => supabaseAnon.from('contracts').select('id', { count: 'exact', head: true }).gte('created_at', today)),
            ]);
            setStats({
                totalUsers: usersCount,
                activeJobs: jobsCount,
                activeContracts: contractsCount,
                totalRevenue: 0,
                todaySignups: signupsCount,
                todayContracts: todayContractsCount,
            });
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    }, []);

    return { stats, fetchStats };
}

export function useAdminVerifications() {
    const [verifications, setVerifications] = useState<IdentityVerification[]>([]);

    const loadVerifications = useCallback(async () => {
        try {
            setVerifications(await fetchVerifications());
        } catch {
            // handled inside fetchVerifications
        }
    }, []);

    return { verifications, loadVerifications };
}

export function useAdminDisputes() {
    const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDisputes = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseAnon
                .from('disputes')
                .select('id,contract_id,opened_at,reason,status,contract:contracts!disputes_contract_id_fkey(id,amount,job:jobs(title)),opener:profiles!disputes_opened_by_fkey(full_name,email)')
                .eq('status', 'open')
                .order('opened_at', { ascending: true });
            if (error) throw error;
            setDisputes((data || []) as unknown as DisputeRecord[]);
        } catch (err) {
            console.error('Failed to fetch disputes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return { disputes, loading, fetchDisputes };
}

export function useAdminPayments() {
    const [stuckPayments, setStuckPayments] = useState<StuckTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    const loadPayments = useCallback(async () => {
        setLoading(true);
        try {
            setStuckPayments(await getStuckTransactions());
        } finally {
            setLoading(false);
        }
    }, []);

    return { stuckPayments, loading, loadPayments };
}

export function useAdminRefresh(queryClient: ReturnType<typeof useQueryClient>) {
    const { stats, fetchStats } = useAdminStats();
    const { verifications, loadVerifications } = useAdminVerifications();
    const { disputes, loading: disputesLoading, fetchDisputes } = useAdminDisputes();
    const { stuckPayments, loading: paymentsLoading, loadPayments } = useAdminPayments();

    const refreshActiveTab = useCallback(async (tab: string) => {
        if (tab === 'overview') {
            await Promise.all([fetchStats(), loadVerifications(), fetchDisputes()]);
            return;
        }
        if (tab === 'payments') {
            await loadPayments();
            return;
        }
        if (tab === 'verifications') {
            await loadVerifications();
            return;
        }
        if (tab === 'disputes') {
            await fetchDisputes();
            return;
        }
        if (tab === 'users') {
            await queryClient.fetchQuery({ queryKey: ADMIN_USERS_QUERY_KEY, queryFn: fetchAdminUsers });
            return;
        }
        if (tab === 'jobs') {
            await queryClient.fetchQuery({ queryKey: ADMIN_JOBS_QUERY_KEY, queryFn: fetchAdminJobs });
            return;
        }
    }, [queryClient, fetchStats, loadVerifications, fetchDisputes, loadPayments]);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            fetchStats(),
            queryClient.fetchQuery({ queryKey: ADMIN_USERS_QUERY_KEY, queryFn: fetchAdminUsers }),
            queryClient.fetchQuery({ queryKey: ADMIN_JOBS_QUERY_KEY, queryFn: fetchAdminJobs }),
            loadVerifications(),
            fetchDisputes(),
            loadPayments(),
        ]);
    }, [queryClient, fetchStats, loadVerifications, fetchDisputes, loadPayments]);

    return {
        stats,
        verifications,
        disputes,
        stuckPayments,
        loading: disputesLoading || paymentsLoading,
        refreshActiveTab,
        refreshAll,
        fetchStats,
        loadVerifications,
        fetchDisputes,
        loadPayments,
    };
}
