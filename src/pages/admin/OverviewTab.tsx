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
    riskyContracts: Array<{
        id: string;
        risk_level: string;
        risk_flags: string[];
        created_at: string;
        title: string | null;
    }>;
    overdueReviews: Array<{
        id: string;
        review_due_at: string;
        title: string | null;
    }>;
    disputesMissingEvidence: Array<{
        id: string;
        opened_at: string;
        reason: string;
    }>;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color?: string }) {
    const bgColor = color || 'bg-violet-500';
    return (
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">{value}</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">{label}</p>
        </div>
    );
}

export default function OverviewTab() {
    const { language } = useTranslation();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-overview-stats'],
        queryFn: async (): Promise<OverviewStats> => {
            const today = new Date().toISOString().split('T')[0];
            const [
                totalUsers,
                activeJobs,
                activeContracts,
                todaySignups,
                todayContracts,
                pendingVerifications,
                recentVerificationsResult,
                riskyContractsResult,
                overdueReviewsResult,
                disputesMissingEvidenceResult,
            ] = await Promise.all([
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
                supabaseWithRetry(() =>
                    supabase
                        .from('contracts')
                        .select('id,risk_level,risk_flags,created_at,title')
                        .in('risk_level', ['medium', 'high'])
                        .order('created_at', { ascending: false })
                        .limit(5)
                ),
                supabaseWithRetry(() =>
                    supabase
                        .from('contracts')
                        .select('id,review_due_at,title')
                        .eq('status', 'active')
                        .not('review_due_at', 'is', null)
                        .lt('review_due_at', new Date().toISOString())
                        .order('review_due_at', { ascending: true })
                        .limit(5)
                ),
                supabaseWithRetry(() =>
                    supabase
                        .from('disputes')
                        .select('id,opened_at,reason,evidence_captured_at')
                        .eq('status', 'open')
                        .is('evidence_captured_at', null)
                        .order('opened_at', { ascending: true })
                        .limit(5)
                ),
            ]);

            const recentVerificationRequests = Array.isArray(recentVerificationsResult.data)
                ? recentVerificationsResult.data.map((item) => ({
                    id: item.id,
                    submitted_at: item.submitted_at,
                    profile: Array.isArray(item.profile) ? (item.profile[0] ?? null) : (item.profile ?? null),
                }))
                : [];

            const riskyContracts = Array.isArray(riskyContractsResult.data)
                ? riskyContractsResult.data.map((item) => ({
                    id: item.id,
                    risk_level: item.risk_level || 'unknown',
                    risk_flags: Array.isArray(item.risk_flags) ? item.risk_flags.map((flag) => String(flag)) : [],
                    created_at: item.created_at,
                    title: item.title || null,
                }))
                : [];

            const overdueReviews = Array.isArray(overdueReviewsResult.data)
                ? overdueReviewsResult.data.map((item) => ({
                    id: item.id,
                    review_due_at: item.review_due_at,
                    title: item.title || null,
                }))
                : [];

            const disputesMissingEvidence = Array.isArray(disputesMissingEvidenceResult.data)
                ? disputesMissingEvidenceResult.data.map((item) => ({
                    id: item.id,
                    opened_at: item.opened_at,
                    reason: item.reason,
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
                riskyContracts,
                overdueReviews,
                disputesMissingEvidence,
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
        riskyContracts: [],
        overdueReviews: [],
        disputesMissingEvidence: [],
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
                <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-6">
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Today's Activity
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">New signups</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{s.todaySignups}</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">New contracts</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{s.todayContracts}</p>
                        </div>
                    </div>
                </div>

                {/* Pending Verifications */}
                <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-6">
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-500" />
                        Pending Verifications
                    </h3>
                    {s.pendingVerifications === 0 ? (
                        <p className="text-sm text-[var(--color-text-tertiary)] text-center py-4">No pending requests</p>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending requests</span>
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{s.pendingVerifications}</span>
                            </div>
                            {s.recentVerificationRequests.map((request) => (
                                <div key={request.id} className="bg-[var(--color-bg-muted)] border border-[var(--color-border-subtle)] rounded-lg px-4 py-3">
                                    <p className="font-medium text-[var(--color-text-primary)]">{request.profile?.full_name || 'User'}</p>
                                    <p className="text-sm text-[var(--color-text-tertiary)]">{request.profile?.email || ''}</p>
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
            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-6">
                <h3 className="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    Reports
                </h3>
                <p className="text-sm text-[var(--color-text-tertiary)] text-center py-6">No reports for now</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-6">
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-4">Risky Contracts</h3>
                    {s.riskyContracts.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-tertiary)]">No medium/high-risk contracts right now.</p>
                    ) : (
                        <div className="space-y-3">
                            {s.riskyContracts.map((contract) => (
                                <div key={contract.id} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-[var(--color-text-primary)] truncate">{contract.title || 'Contract'}</p>
                                        <span className={`rounded-full px-2 py-0.5 text-xs ${contract.risk_level === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                                            {contract.risk_level}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">#{contract.id.slice(0, 8)}</p>
                                    {contract.risk_flags.length > 0 ? (
                                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{contract.risk_flags.join(' • ')}</p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-6">
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-4">Overdue Reviews</h3>
                    {s.overdueReviews.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-tertiary)]">No overdue contract review windows.</p>
                    ) : (
                        <div className="space-y-3">
                            {s.overdueReviews.map((contract) => (
                                <div key={contract.id} className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 px-4 py-3">
                                    <p className="font-medium text-[var(--color-text-primary)] truncate">{contract.title || 'Contract'}</p>
                                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">#{contract.id.slice(0, 8)}</p>
                                    <p className="mt-2 text-xs text-orange-700 dark:text-orange-300">
                                        Review due {new Date(contract.review_due_at).toLocaleString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-6">
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-4">Disputes Missing Evidence</h3>
                    {s.disputesMissingEvidence.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-tertiary)]">All open disputes have captured evidence.</p>
                    ) : (
                        <div className="space-y-3">
                            {s.disputesMissingEvidence.map((dispute) => (
                                <div key={dispute.id} className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                                    <p className="font-medium text-[var(--color-text-primary)] truncate">#{dispute.id.slice(0, 8)}</p>
                                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                                        Opened {new Date(dispute.opened_at).toLocaleString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')}
                                    </p>
                                    <p className="mt-2 text-xs text-red-700 dark:text-red-300 line-clamp-2">{dispute.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}



