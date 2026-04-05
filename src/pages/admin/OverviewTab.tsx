import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, DollarSign, FileText, Activity, UserPlus, Shield, Flag, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { useTranslation } from '@/i18n';
import { adminInsetClass, adminPanelClass, adminPillClass } from './adminTheme';

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

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number | string; tone?: string }) {
    return (
        <div className={`${adminPanelClass} p-6 transition-all duration-300 hover:-translate-y-0.5`}>
            <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: tone || 'var(--workspace-primary)' }}><Icon className="w-6 h-6 text-white" /></div>
            </div>
            <p className="text-3xl font-bold text-foreground mt-4">{value}</p>
            <p className="text-sm text-muted">{label}</p>
        </div>
    );
}

export default function OverviewTab() {
     const { language, tx } = useTranslation();

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
    const panelClass = adminPanelClass;

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <StatCard icon={Users} label={tx('dashboard.admin.overview.totalUsers', undefined, 'Total users')} value={s.totalUsers} />
                 <StatCard icon={Briefcase} label={tx('dashboard.admin.overview.activeJobs', undefined, 'Active jobs')} value={s.activeJobs} tone="var(--workspace-primary-hover)" />
                 <StatCard icon={FileText} label={tx('dashboard.admin.overview.activeContracts', undefined, 'Active contracts')} value={s.activeContracts} tone="var(--workspace-primary-mid)" />
                 <StatCard icon={DollarSign} label={tx('dashboard.admin.overview.revenue', undefined, 'Revenue (TND)')} value={s.totalRevenue} tone="var(--workspace-primary)" />
             </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <div className={panelClass}>
                     <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                         <Activity className="w-5 h-5 text-cyan-500" />{tx('dashboard.admin.overview.todayActivity', undefined, 'Today activity')}
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                         <div className={`${adminInsetClass} p-4 ${adminPillClass('emerald')}`}>
                              <div className="flex items-center gap-2 mb-2"><UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /><span className="text-emerald-800 dark:text-emerald-200 font-medium">{tx('dashboard.admin.overview.newSignups', undefined, 'New signups')}</span></div>
                              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{s.todaySignups}</p>
                          </div>
                          <div className={`${adminInsetClass} p-4 ${adminPillClass('cyan')}`}>
                              <div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-300" /><span className="text-cyan-800 dark:text-cyan-200 font-medium">{tx('dashboard.admin.overview.newContracts', undefined, 'New contracts')}</span></div>
                              <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{s.todayContracts}</p>
                          </div>
                     </div>
                 </div>
                <div className={panelClass}>
                     <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                         <Shield className="w-5 h-5 text-yellow-600" />
                         {tx('dashboard.admin.overview.pendingVerifications', undefined, 'Pending verifications')}
                     </h3>
                     {s.pendingVerifications === 0 ? (
                         <p className="text-sm text-muted text-center py-4">{tx('dashboard.admin.overview.noPendingRequests', undefined, 'No pending requests')}</p>
                     ) : (
                         <div className="space-y-3">
                              <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${adminPillClass('amber')}`}>
                                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{tx('dashboard.admin.overview.requestsCount', undefined, 'Pending requests count')}</span>
                                  <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{s.pendingVerifications}</span>
                              </div>
                              {s.recentVerificationRequests.map((request) => (
                                  <div key={request.id} className={`${adminInsetClass} px-4 py-3`}>
                                      <p className="font-medium text-foreground">{request.profile?.full_name || tx('dashboard.admin.overview.user', undefined, 'User')}</p>
                                      <p className="text-sm text-muted">{request.profile?.email || ''}</p>
                                      <p className="mt-1 text-xs text-muted">{new Date(request.submitted_at).toLocaleString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')}</p>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
            </div>
            <div className={panelClass}>
                 <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Flag className="w-5 h-5 text-red-600" />{tx('dashboard.admin.overview.reports', undefined, 'Reports')}</h3>
                 <p className="text-sm text-muted text-center py-6">{tx('dashboard.admin.overview.noReports', undefined, 'No reports for now')}</p>
             </div>
        </div>
    );
}
