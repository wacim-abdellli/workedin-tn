import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Briefcase, DollarSign, Clock, Users, Plus, Bell,
    Settings, CheckCircle, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, User,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { Skeleton, SkeletonCard } from '../components/common';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currencyUtils';

function ClientDashboardPage() {
    const { t, tx, dir, language } = useTranslation();
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const justSwitched = sessionStorage.getItem('workspace_switched');
        if (justSwitched !== 'client') return;
        sessionStorage.removeItem('workspace_switched');
        showToast(t.auth.accountPanel.switchedClient, 'success', 2000, { position: 'bottom-center' });
    }, [showToast, t.auth.accountPanel.switchedClient]);

    const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

    // Fetch real stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['clientDashboardStats', profile?.id],
        enabled: !!profile?.id,
        queryFn: async () => {
            const userId = profile!.id;
            const [activeJobsRes, completedContractsRes, walletRes] = await Promise.all([
                supabase.from('jobs').select('id', { count: 'exact', head: true })
                    .eq('client_id', userId).in('status', ['open', 'in_progress']),
                supabase.from('contracts').select('id', { count: 'exact', head: true })
                    .eq('client_id', userId).eq('status', 'completed'),
                supabase.from('wallets').select('total_withdrawn').eq('user_id', userId).maybeSingle(),
            ]);
            return {
                activeJobs: activeJobsRes.count ?? 0,
                contractsCompleted: completedContractsRes.count ?? 0,
                totalSpent: walletRes.data?.total_withdrawn ?? 0,
            };
        },
        staleTime: 60_000,
    });

    // Fetch real jobs
    const { data: jobs = [] } = useQuery({
        queryKey: ['clientJobs', profile?.id],
        enabled: !!profile?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    id, title, budget_min, budget_max, status, created_at,
                    proposals_count,
                    contracts(id, status, freelancer:profiles!freelancer_id(full_name))
                `)
                .eq('client_id', profile!.id)
                .order('created_at', { ascending: false })
                .limit(5);
            if (error) { console.error('clientJobs error:', error); return []; }
            return data || [];
        },
        staleTime: 60_000,
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <span className="status-pill-open"><AlertCircle className="w-3 h-3" />{tx('pages.clientJobs.status.open', undefined, 'Open')}</span>;
            case 'in_progress':
                return <span className="status-pill-progress"><Clock className="w-3 h-3" />{tx('pages.clientJobs.status.inProgress', undefined, 'In progress')}</span>;
            case 'completed':
                return <span className="status-pill-completed"><CheckCircle className="w-3 h-3" />{tx('pages.clientJobs.status.completed', undefined, 'Completed')}</span>;
            case 'cancelled':
                return <span className="status-pill-cancelled"><XCircle className="w-3 h-3" />{tx('dashboard.client.status.cancelled', undefined, 'Cancelled')}</span>;
            default:
                return null;
        }
    };

    return (
        <div className="page-shell">
            <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
            <Header />

            <div className="page-shell-content">
                {/* Welcome Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {t.dashboard.welcome}، {profile?.full_name || tx('dashboard.client.defaultName', undefined, 'Client')}!
                        </h1>
                        <p className="text-muted">{t.dashboard.clientSubtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm hover:shadow-md transition-shadow">
                            <Bell className="w-5 h-5 text-muted" />
                        </button>
                        <button onClick={() => navigate('/settings')} className="p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm hover:shadow-md transition-shadow">
                            <Settings className="w-5 h-5 text-muted" />
                        </button>
                    </div>
                </div>

                {/* Post New Job CTA */}
                <div
                    className="card bg-gradient-to-r from-secondary-600 to-secondary-800 text-white mb-8 cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => navigate('/jobs/new')}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold mb-1">{t.dashboard.postNewJob}</h2>
                                <p className="text-secondary-100">{t.dashboard.postNewJobDesc}</p>
                            </div>
                        </div>
                        <ArrowIcon className="w-8 h-8" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="card h-24 flex flex-col justify-center">
                                <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                                <Skeleton className="w-8 h-8 mb-1" />
                                <Skeleton className="w-20 h-4" />
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="stat-card">
                                <div className="stat-card-icon bg-primary-100">
                                        <Briefcase className="w-5 h-5 text-primary-600" />
                                </div>
                                <p className="stat-card-value">{stats?.activeJobs ?? 0}</p>
                                <p className="stat-card-label">{tx('dashboard.client.activeJobs', undefined, 'Active jobs')}</p>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-icon bg-green-100">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="stat-card-value">{formatCurrency(stats?.totalSpent ?? 0, true, language)}</p>
                                <p className="stat-card-label">{tx('dashboard.client.totalSpent', undefined, 'Total spent')}</p>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-icon bg-secondary-100">
                                        <CheckCircle className="w-5 h-5 text-secondary-600" />
                                </div>
                                <p className="stat-card-value">{stats?.contractsCompleted ?? 0}</p>
                                <p className="stat-card-label">{tx('dashboard.client.completedContracts', undefined, 'Completed contracts')}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Jobs List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">{t.dashboard.yourJobs}</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/client/jobs')}>{t.dashboard.viewAll}</Button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
                        ) : jobs.length === 0 ? (
                            <div className="card text-center py-12">
                                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-muted mb-4">{tx('dashboard.client.noJobsYet', undefined, 'No jobs posted yet')}</p>
                                <Button variant="primary" onClick={() => navigate('/jobs/new')}>{t.dashboard.postNewJob}</Button>
                            </div>
                        ) : (
                            jobs.map((job: any) => (
                                <div
                                    key={job.id}
                                    className="card hover:shadow-lg transition-shadow cursor-pointer group"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-foreground group-hover:text-primary-600 transition-colors">{job.title}</h3>
                                                {getStatusBadge(job.status)}
                                            </div>
                                            <p className="text-sm text-muted">{new Date(job.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-lg font-bold text-primary-600">
                                            {job.budget_min && job.budget_max
                                                ? `${job.budget_min}–${job.budget_max} د.ت`
                                                : job.budget_min ? `${job.budget_min} د.ت` : '—'}
                                        </span>
                                    </div>

                                    {job.status === 'open' && job.proposals_count > 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                            <Users className="w-5 h-5 text-yellow-600" />
                                            <span className="text-yellow-800 font-medium text-sm">{tx('dashboard.client.proposalsSubmitted', { count: job.proposals_count }, `${job.proposals_count} proposals submitted`)}</span>
                                        </div>
                                    )}

                                    {job.status === 'in_progress' && job.contracts?.[0] && (
                                        <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                                            <User className="w-5 h-5 text-primary-600" />
                                            <span className="text-primary-800 text-sm font-medium">
                                                {job.contracts[0].freelancer?.full_name || tx('dashboard.client.freelancerFallback', undefined, 'Freelancer')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button onClick={signOut} className="text-muted hover:text-red-600 py-2 text-sm transition-colors">
                        {t.nav.logout}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ClientDashboardPage;
