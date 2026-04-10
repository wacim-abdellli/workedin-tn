import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, DollarSign, FileText, Activity, UserPlus, Shield, Flag, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { useTranslation } from '@/i18n';

async function countWithRetry(queryFn: () => PromiseLike<{ count: number | null; error: unknown }>) {
    const { count } = await Promise.race([
        queryFn(),
        new Promise<{ count: number | null; error: unknown }>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 15000)
        )
    ]);
    return count ?? 0;
}

interface OverviewStats {
    totalUsers: number;
    activeJobs: number;
    activeContracts: number;
    totalRevenue: number;
    todaySignups: number;
    todayContracts: number;
    pendingVerifications: number;
    recentVerificationRequests: Array<{
        id: string;
        submitted_at: string;
        profile: {
            full_name: string | null;
            email: string | null;
        } | null;
    }>;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color?: string }) {
    const bgColor = color || 'bg-violet-500';
    return (
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    );
}

export default function OverviewTab() {
    const { language } = useTranslation();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-overview-stats'],
        queryFn: async (): Promise<OverviewStats> => {
            const today = new Date().toISOString().split('T')[0];
            const [totalUsers, activeJobs, activeContracts, todaySignups, todayContracts, pendingVerifications, recentVerificationsResult] = await Promise.all([
                countWithRetry(() => supabase.from('profiles').select('id', { count: 'exact', head: true })),
                countWithRetry(() => supabase.from('jobs').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])),
                countWithRetry(() => supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'active')),
                countWithRetry(() => supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today)),
                countWithRetry(() => supabase.from('contracts').select('id', { count: 'exact', head: true }).gte('created_at', today)),
                countWithRetry(() => supabase.from('identity_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
                supabaseWithRetry(() =>
                    supabase
                        .from('identity_verifications')
                        .select('id,submitted_at,profile:profiles!identity_verifications_user_id_fkey(full_name,email)')
                        .eq('status', 'pending')
                        .order('submitted_at', { ascending: true })
                        .limit(3)
                ),
            ]);

            const recentVerificationRequests = Array.isArray(recentVerificationsResult.data)
                ? recentVerificationsResult.data.map((item) => ({
                    id: item.id,
                    submitted_at: item.submitted_at,
                    profile: Array.isArray(item.profile) ? (item.profile[0] ?? null) : (item.profile ?? null),
                }))
                : [];

            return {
                totalUsers,
                activeJobs,
                activeContracts,
                totalRevenue: 0,
                todaySignups,
                todayContracts,
                pendingVerifications,
                recentVerificationRequests,
            };
        },
        staleTime: 30000,
    });

    const s = stats || {
        totalUsers: 0,
        activeJobs: 0,
        activeContracts: 0,
        totalRevenue: 0,
        todaySignups: 0,
        todayContracts: 0,
        pendingVerifications: 0,
        recentVerificationRequests: [],
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total users" value={s.totalUsers} color="bg-violet-500" />
                <StatCard icon={Briefcase} label="Active jobs" value={s.activeJobs} color="bg-blue-500" />
                <StatCard icon={FileText} label="Active contracts" value={s.activeContracts} color="bg-cyan-500" />
                <StatCard icon={DollarSign} label="Revenue (TND)" value={s.totalRevenue} color="bg-green-500" />
            </div>

            {/* Today Activity & Verifications */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Today Activity */}
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Today's Activity
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">New signups</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{s.todaySignups}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">New contracts</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{s.todayContracts}</p>
                        </div>
                    </div>
                </div>

                {/* Pending Verifications */}
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-500" />
                        Pending Verifications
                    </h3>
                    {s.pendingVerifications === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No pending requests</p>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending requests</span>
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{s.pendingVerifications}</span>
                            </div>
                            {s.recentVerificationRequests.map((request) => (
                                <div key={request.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                                    <p className="font-medium text-gray-900 dark:text-white">{request.profile?.full_name || 'User'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{request.profile?.email || ''}</p>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(request.submitted_at).toLocaleString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reports */}
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    Reports
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No reports for now</p>
            </div>
        </div>
    );
}
