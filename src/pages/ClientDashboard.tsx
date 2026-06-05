import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Briefcase,
    FileText,
    FolderOpen,
    MessageSquare,
    Plus,
    Sparkles,
    Users,
    ArrowRight,
    ChevronRight,
    TrendingUp,
    Clock,
    CheckCircle2,
    Sun,
    Moon,
    CloudSun,
    ShieldCheck,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import EmptyState from '../components/ui/EmptyState';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { dashboardQueryKeys } from '../lib/dashboardQueries';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currencyUtils';

interface DashboardContract {
    id: string;
    status: string;
    freelancer:
        | { full_name: string | null }
        | Array<{ full_name: string | null }>
        | null;
}

interface DashboardJob {
    id: string;
    title: string;
    budget_min: number | null;
    budget_max: number | null;
    status: string;
    created_at: string;
    proposals_count: number;
    contracts: DashboardContract[] | null;
}

type DashboardStats = {
    activeJobs: number;
    completedContracts: number;
    totalSpent: number;
    proposalsWaitingReview: number;
    totalProposals: number;
};

type RecentProposal = {
    id: string;
    job_id: string;
    bid_amount: number;
    created_at: string;
    job: { title: string | null; client_id: string } | null;
    freelancer: { full_name: string | null; avatar_url: string | null } | null;
};

type ActiveContract = {
    id: string;
    title: string;
    status: string;
    total_amount: number | null;
    created_at: string;
    freelancer: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

function getTimeGreeting(tx: (key: string, params?: any, fallback?: string) => string): string {
    const hour = new Date().getHours();
    if (hour < 12) return tx('dashboard.greeting.morning', undefined, 'Good morning');
    if (hour < 18) return tx('dashboard.greeting.afternoon', undefined, 'Good afternoon');
    return tx('dashboard.greeting.evening', undefined, 'Good evening');
}

function getTimeGreetingData(tx: (key: string, params?: any, fallback?: string) => string): { text: string; Icon: any } {
    const hour = new Date().getHours();
    if (hour < 12) {
        return {
            text: tx('dashboard.greeting.morning', undefined, 'Good morning'),
            Icon: Sun
        };
    }
    if (hour < 18) {
        return {
            text: tx('dashboard.greeting.afternoon', undefined, 'Good afternoon'),
            Icon: CloudSun
        };
    }
    return {
        text: tx('dashboard.greeting.evening', undefined, 'Good evening'),
        Icon: Moon
    };
}

const AnimatedNumber = ({ value, duration = 800, formatter }: { value: number; duration?: number; formatter?: (val: number) => string }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        const startValue = displayValue;
        const endValue = value;
        if (startValue === endValue) return;

        let animationFrameId: number;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = progress * (2 - progress);
            const currentValue = startValue + easeProgress * (endValue - startValue);
            
            setDisplayValue(currentValue);

            if (progress < 1) {
                animationFrameId = window.requestAnimationFrame(step);
            } else {
                setDisplayValue(endValue);
            }
        };

        animationFrameId = window.requestAnimationFrame(step);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [value, duration]);

    const roundedVal = Math.round(displayValue * 100) / 100;
    const displayVal = formatter ? formatter(roundedVal) : Math.round(roundedVal).toString();

    return <>{displayVal}</>;
};

function jobStatusConfig(status: string): { label: string; dot: string; bg: string; text: string } {
    if (status === 'open') return { label: 'Open', dot: 'var(--workspace-primary)', bg: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)', text: 'var(--workspace-primary)' };
    if (status === 'in_progress') return { label: 'In Progress', dot: 'var(--color-status-info)', bg: 'rgba(59,130,246,0.1)', text: 'var(--color-status-info)' };
    if (status === 'completed') return { label: 'Completed', dot: '#10b981', bg: 'rgba(16,185,129,0.1)', text: '#10b981' };
    return { label: status, dot: 'var(--color-text-tertiary)', bg: 'var(--color-bg-subtle)', text: 'var(--color-text-tertiary)' };
}

function formatBudgetRange(job: DashboardJob, language: Parameters<typeof formatCurrency>[2]) {
    const min = Number(job.budget_min ?? 0);
    const max = Number(job.budget_max ?? 0);
    if (min > 0 && max > 0) return `${formatCurrency(min, true, language)} – ${formatCurrency(max, true, language)}`;
    if (max > 0) return formatCurrency(max, true, language);
    if (min > 0) return formatCurrency(min, true, language);
    return '—';
}

function ClientDashboardPage() {
    const { language, tx } = useTranslation();
    const { profile, isLoading: isAuthLoading, isFullyReady } = useAuth();
    const navigate = useNavigate();

    const locale = useMemo(() => {
        if (language === 'ar') return 'ar-TN';
        if (language === 'fr') return 'fr-FR';
        return 'en-US';
    }, [language]);

    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: dashboardQueryKeys.clientStats(profile?.id),
        enabled: !!profile?.id,
        queryFn: async (): Promise<
            DashboardStats & {
                jobs: DashboardJob[];
                activeContracts: ActiveContract[];
                proposals: RecentProposal[];
            }
        > => {
            const userId = profile!.id;
            const [
                activeJobsRes, completedContractsRes, walletRes, jobsSummaryRes,
                jobsRes, activeContractsRes, proposalsRes,
            ] = await Promise.all([
                supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('client_id', userId).in('status', ['open', 'in_progress']),
                supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('client_id', userId).eq('status', 'completed'),
                supabase.from('wallets').select('total_withdrawn').eq('user_id', userId).maybeSingle(),
                supabase.from('jobs').select('status, proposals_count').eq('client_id', userId),
                supabase.from('jobs').select(`id, title, budget_min, budget_max, status, created_at, proposals_count, contracts(id, status, freelancer_id)`).eq('client_id', userId).order('created_at', { ascending: false }).limit(6),
                supabase.from('contracts').select('id, title, status, total_amount, created_at, freelancer_id').eq('client_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(5),
                supabase.from('proposals').select('id, job_id, bid_amount, created_at, freelancer_id, job:jobs!inner(title, client_id)').eq('job.client_id', userId).eq('status', 'pending').order('created_at', { ascending: false }).limit(4),
            ]);

            const jobSummaryRows = jobsSummaryRes.data ?? [];
            const freelancerIds = new Set<string>();
            if (activeContractsRes.data) activeContractsRes.data.forEach(c => freelancerIds.add(c.freelancer_id));
            if (proposalsRes.data) proposalsRes.data.forEach(p => freelancerIds.add(p.freelancer_id));
            if (jobsRes.data) jobsRes.data.forEach(j => { j.contracts?.forEach(c => { if (c.freelancer_id) freelancerIds.add(c.freelancer_id); }); });

            const profilesById: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
            if (freelancerIds.size > 0) {
                const { data: profilesData } = await supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', Array.from(freelancerIds));
                profilesData?.forEach(p => { profilesById[p.id] = p; });
            }

            const jobsMapped = (jobsRes.data ?? []).map(job => ({
                ...job,
                contracts: job.contracts?.map(c => ({ ...c, freelancer: profilesById[c.freelancer_id] || null })),
            }));
            const activeContractsMapped = (activeContractsRes.data ?? []).map(c => ({ ...c, freelancer: profilesById[c.freelancer_id] || null }));
            const proposalsMapped = (proposalsRes.data ?? []).map(p => ({ ...p, freelancer: profilesById[p.freelancer_id] || null }));

            return {
                activeJobs: activeJobsRes.count ?? 0,
                completedContracts: completedContractsRes.count ?? 0,
                totalSpent: Number(walletRes.data?.total_withdrawn ?? 0),
                proposalsWaitingReview: jobSummaryRows.filter(job => job.status === 'open' && (job.proposals_count ?? 0) > 0).length,
                totalProposals: jobSummaryRows.reduce((sum, job) => sum + Number(job.proposals_count ?? 0), 0),
                totalJobs: jobSummaryRows.length,
                jobs: jobsMapped as unknown as DashboardJob[],
                activeContracts: activeContractsMapped as unknown as ActiveContract[],
                proposals: proposalsMapped as unknown as RecentProposal[],
            };
        },
        staleTime: 60_000,
    });

    const statsData = {
        totalJobs: stats?.totalJobs ?? 0,
        activeJobs: stats?.activeJobs ?? 0,
        totalProposals: stats?.totalProposals ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
        activeContracts: stats?.activeContracts?.length ?? 0,
        completedContracts: stats?.completedContracts ?? 0,
    };

    const firstName = profile?.full_name?.split(' ')[0] || tx('dashboard.client.clientFallback', undefined, 'Client');
    const greetingData = getTimeGreetingData(tx);
    const GreetingIcon = greetingData.Icon;
    const greetingText = greetingData.text;
    const proposalsWaitingReview = stats?.proposalsWaitingReview ?? 0;
    const jobs = stats?.jobs ?? [];
    const proposals = stats?.proposals ?? [];
    const activeContracts = stats?.activeContracts ?? [];

    const formatDate = (value: string) => new Date(value).toLocaleDateString(locale, { month: 'short', day: 'numeric' });

    if (isAuthLoading || !isFullyReady) {
        return (
            <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
                <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
                <Header />
                <main className="pt-8 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                        <div className="h-32 rounded-3xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!profile?.id) {
        return (
            <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
                <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
                <Header />
                <main className="pt-10 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <EmptyState
                            icon={Users}
                            title={tx('dashboard.client.profileUnavailable', undefined, 'Profile unavailable')}
                            description={tx('dashboard.client.profileUnavailableDesc', undefined, 'We could not load your account profile yet. Please try again.')}
                            action={{ label: tx('common.retry', undefined, 'Retry'), onClick: () => window.location.reload() }}
                        />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--color-bg-base)' }}>
            <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
            <Header />

            <main className="pb-20">

                {/* ── COMMAND CENTER HERO ── */}
                <div className="dash-command-ambient max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 animate-dash-fade-up">
                    <div className="dash-command-center overflow-hidden py-5 px-6 sm:py-6 sm:px-8">
                        {/* Dot pattern overlay */}
                        <div className="dash-command-grid" />

                        {/* Identity & CTA section */}
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-5">
                            <div className="flex items-center gap-5">
                                {/* Avatar with rotating ring */}
                                <div className="dash-avatar-ring shrink-0 animate-dash-scale-in dash-stagger-1">
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={firstName}
                                        />
                                    ) : (
                                        <div
                                            className="dash-avatar-placeholder w-full h-full flex items-center justify-center text-2xl font-bold"
                                            style={{
                                                background: 'color-mix(in srgb, var(--workspace-primary) 15%, var(--color-bg-elevated))',
                                                color: 'var(--workspace-primary)',
                                            }}
                                        >
                                            {firstName[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5 animate-dash-slide-left dash-stagger-2">
                                    <span className="dash-greeting-pill self-start">
                                        <GreetingIcon className="dash-greeting-icon" />
                                        {greetingText}
                                    </span>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                                            {firstName}
                                        </h1>
                                        {profile?.cin_verified ? (
                                            <span className="dash-badge flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3" />
                                                {tx('dashboard.client.badgeVerified', undefined, 'Verified Client')}
                                            </span>
                                        ) : (
                                            <span className="dash-badge-unverified">
                                                {tx('dashboard.client.badgeUnverified', undefined, 'Project Owner')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                                        {tx('dashboard.client.commandCenterSubtitle', undefined, 'Track projects, proposals & spending')}
                                    </p>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="animate-dash-slide-right dash-stagger-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/jobs/new')}
                                    className="dash-cta-btn group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
                                    style={{
                                        background: 'var(--workspace-primary)',
                                        boxShadow: '0 4px 20px -4px color-mix(in srgb, var(--workspace-primary) 55%, transparent)',
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                    {tx('dashboard.client.postAProject', undefined, 'Post a Project')}
                                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="dash-divider relative z-10 animate-dash-fade-up dash-stagger-3" />

                        {/* Bento Stats */}
                        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                            
                            {/* Total Spent — featured with conic border */}
                            <div className="col-span-2 sm:col-span-1 dash-stat-featured animate-dash-fade-up dash-stagger-4">
                                <div className="dash-stat-featured-content">
                                    <div className="flex items-start justify-between mb-3">
                                        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--workspace-primary)' }}>
                                            {tx('dashboard.client.stats.totalSpent', undefined, 'Total Spent')}
                                        </p>
                                        <TrendingUp className="w-4 h-4 dash-stat-icon" style={{ color: 'var(--workspace-primary)' }} />
                                    </div>
                                    <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                                        <AnimatedNumber
                                            value={statsData.totalSpent}
                                            formatter={(val) => formatCurrency(val, true, language)}
                                        />
                                    </p>
                                    <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                                        {tx('dashboard.client.stats.totalSpentDesc', undefined, 'across all projects')}
                                    </p>
                                </div>
                            </div>

                            {/* Active */}
                            <div className="dash-stat-card animate-dash-fade-up dash-stagger-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                                        {tx('dashboard.client.stats.active', undefined, 'Active')}
                                    </p>
                                    <Sparkles className="w-4 h-4 dash-stat-icon" style={{ color: 'var(--color-text-tertiary)' }} />
                                </div>
                                <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                                    <AnimatedNumber value={statsData.activeJobs} />
                                </p>
                                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {tx('dashboard.client.stats.activeDesc', undefined, 'open & in progress')}
                                </p>
                            </div>

                            {/* Proposals */}
                            <div className="dash-stat-card animate-dash-fade-up dash-stagger-6">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                                        {tx('dashboard.client.stats.proposals', undefined, 'Proposals')}
                                    </p>
                                    <FileText className="w-4 h-4 dash-stat-icon" style={{ color: 'var(--color-text-tertiary)' }} />
                                </div>
                                <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                                    <AnimatedNumber value={statsData.totalProposals} />
                                </p>
                                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {tx('dashboard.client.stats.proposalsDesc', undefined, 'received total')}
                                </p>
                            </div>

                            {/* Projects */}
                            <div className="dash-stat-card animate-dash-fade-up dash-stagger-7">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                                        {tx('dashboard.client.stats.projects', undefined, 'Projects')}
                                    </p>
                                    <FolderOpen className="w-4 h-4 dash-stat-icon" style={{ color: 'var(--color-text-tertiary)' }} />
                                </div>
                                <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                                    <AnimatedNumber value={statsData.totalJobs} />
                                </p>
                                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {tx('dashboard.client.stats.projectsDesc', undefined, 'projects posted')}
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ── MAIN GRID ── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                    {/* LEFT — 8 cols */}
                    <section className="lg:col-span-8 flex flex-col gap-5">

                        {/* Your Projects */}
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)' }}>
                                        <FolderOpen className="w-3.5 h-3.5" style={{ color: 'var(--workspace-primary)' }} />
                                    </div>
                                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                        {tx('dashboard.client.activeProjects', undefined, 'Your Projects')}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/client/jobs')}
                                    className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                                    style={{ color: 'var(--workspace-primary)' }}
                                >
                                    View all <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>

                            {isStatsLoading ? (
                                <div className="px-6 pb-5 space-y-2.5">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 text-center px-6 pb-8 pt-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-bg-subtle)' }}>
                                        <FolderOpen className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No projects yet</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Post your first project to start getting proposals</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/jobs/new')}
                                        className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition-all hover:brightness-110 active:scale-95 mt-1"
                                        style={{ background: 'var(--workspace-primary)' }}
                                    >
                                        Post your first project
                                    </button>
                                </div>
                            ) : (
                                <div className="px-6 pb-5 space-y-2">
                                    {jobs.slice(0, 5).map((job) => {
                                        const cfg = jobStatusConfig(job.status);
                                        return (
                                            <button
                                                key={job.id}
                                                type="button"
                                                onClick={() => {
                                                    const activeContract = job.contracts?.find((c: any) => {
                                                        const s = String(c.status || '').toLowerCase();
                                                        return s === 'active' || s === 'in_progress' || s === 'pending_payment';
                                                    });
                                                    if (activeContract) {
                                                        navigate(`/workspace/${activeContract.id}`, { state: { otherUserId: activeContract.freelancer_id || null } });
                                                    } else {
                                                        navigate(`/client/jobs/${job.id}/proposals`);
                                                    }
                                                }}
                                                className="group w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-150 active:scale-[0.99]"
                                                style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--workspace-primary) 35%, transparent)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--workspace-primary) 4%, var(--color-bg-base))'; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-subtle)'; (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-base)'; }}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                                            {formatBudgetRange(job, language)}
                                                        </span>
                                                        <span style={{ color: 'var(--color-border-default)' }}>·</span>
                                                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                                            {formatDate(job.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {job.proposals_count > 0 && (
                                                        <span
                                                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                            style={{ background: 'color-mix(in srgb, var(--workspace-primary) 9%, transparent)', color: 'var(--workspace-primary)' }}
                                                        >
                                                            {job.proposals_count}
                                                        </span>
                                                    )}
                                                    <span
                                                        className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                                        style={{ background: cfg.bg, color: cfg.text }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Proposals to Review */}
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)' }}>
                                        <FileText className="w-3.5 h-3.5" style={{ color: 'var(--workspace-primary)' }} />
                                    </div>
                                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                        {tx('dashboard.client.recentProposals', undefined, 'Proposals to Review')}
                                    </h2>
                                    {proposalsWaitingReview > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--workspace-primary)' }}>
                                            {proposalsWaitingReview}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/client/jobs')}
                                    className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                                    style={{ color: 'var(--workspace-primary)' }}
                                >
                                    View all <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>

                            {isStatsLoading ? (
                                <div className="px-6 pb-5 space-y-2">
                                    {[1, 2].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}
                                </div>
                            ) : proposals.length === 0 ? (
                                <div className="px-6 pb-8 pt-4 text-center">
                                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No proposals yet — post a project to receive them</p>
                                </div>
                            ) : (
                                <div className="px-6 pb-5 space-y-2">
                                    {proposals.slice(0, 4).map((proposal) => (
                                        <div
                                            key={proposal.id}
                                            className="flex items-center justify-between gap-3 p-4 rounded-xl transition-all duration-150"
                                            style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className="h-9 w-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-bold"
                                                    style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--color-bg-elevated))', color: 'var(--workspace-primary)' }}
                                                >
                                                    {proposal.freelancer?.avatar_url ? (
                                                        <img src={proposal.freelancer.avatar_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (proposal.freelancer?.full_name?.[0] || 'F')}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                                                        {proposal.freelancer?.full_name || tx('dashboard.client.freelancerFallback', undefined, 'Freelancer')}
                                                    </p>
                                                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                                                        {proposal.job?.title || tx('dashboard.client.untitledJob', undefined, 'Untitled job')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 shrink-0">
                                                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                                    {formatCurrency(proposal.bid_amount ?? 0, true, language)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/client/jobs/${proposal.job_id}/proposals`)}
                                                    className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:brightness-110 text-white active:scale-95"
                                                    style={{ background: 'var(--workspace-primary)' }}
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Contracts */}
                        {activeContracts.length > 0 && (
                            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)' }}>
                                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--workspace-primary)' }} />
                                        </div>
                                        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                            {tx('dashboard.client.activeContracts', undefined, 'Active Contracts')}
                                        </h2>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--workspace-primary)' }}>
                                            {activeContracts.length}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/contracts')}
                                        className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                                        style={{ color: 'var(--workspace-primary)' }}
                                    >
                                        View all <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="px-6 pb-5 space-y-2">
                                    {activeContracts.slice(0, 3).map((contract) => (
                                        <button
                                            key={contract.id}
                                            type="button"
                                            onClick={() => navigate(`/contracts/${contract.id}`)}
                                            className="group w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-150 active:scale-[0.99]"
                                            style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--workspace-primary) 35%, transparent)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--workspace-primary) 4%, var(--color-bg-base))'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-subtle)'; (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-base)'; }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-bold" style={{ background: 'color-mix(in srgb, var(--color-status-info) 10%, var(--color-bg-elevated))', color: 'var(--color-status-info)' }}>
                                                    {contract.freelancer?.avatar_url ? <img src={contract.freelancer.avatar_url} alt="" className="h-full w-full object-cover" /> : (contract.freelancer?.full_name?.[0] || 'F')}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{contract.title}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{contract.freelancer?.full_name || 'Freelancer'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                                    {formatCurrency(contract.total_amount ?? 0, true, language)}
                                                </span>
                                                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--workspace-primary)' }} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </section>

                    {/* RIGHT — 4 cols */}
                    <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20">

                        {/* Spending Overview */}
                        <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                            <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                                Spending Overview
                            </p>
                            <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                                {formatCurrency(statsData.totalSpent, true, language)}
                            </p>

                            <div className="mt-4 pt-3 space-y-2.5" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                                {[
                                    { label: 'Active contracts', value: statsData.activeContracts, isNum: true },
                                    { label: 'Completed projects', value: statsData.completedContracts, isNum: true },
                                    { label: 'Total proposals received', value: statsData.totalProposals, isNum: true },
                                ].map(row => (
                                    <div key={row.label} className="flex items-center justify-between text-xs">
                                        <span style={{ color: 'var(--color-text-tertiary)' }}>{row.label}</span>
                                        <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/wallet')}
                                className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-[var(--color-bg-subtle)] active:scale-95"
                                style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                            >
                                {tx('dashboard.client.viewWallet', undefined, 'View Wallet')}
                            </button>
                        </div>

                        {/* Post a Project CTA */}
                        <div
                            className="rounded-2xl p-5 relative overflow-hidden"
                            style={{
                                background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--color-bg-elevated))',
                                border: '1px solid color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
                            }}
                        >
                            <div aria-hidden className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-xl opacity-20" style={{ background: 'var(--workspace-primary)' }} />
                            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5 relative" style={{ color: 'var(--workspace-primary)' }}>
                                Get it done
                            </p>
                            <p className="text-base font-bold leading-snug relative" style={{ color: 'var(--color-text-primary)' }}>
                                Need something built?
                            </p>
                            <p className="text-xs mt-1 mb-4 relative" style={{ color: 'var(--color-text-tertiary)' }}>
                                Post a project free and get proposals from verified Tunisian talent.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/jobs/new')}
                                className="relative w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                                style={{
                                    background: 'var(--workspace-primary)',
                                    boxShadow: '0 4px 14px -4px color-mix(in srgb, var(--workspace-primary) 50%, transparent)',
                                }}
                            >
                                {tx('dashboard.client.postAProject', undefined, 'Post a Project')} — It's free
                            </button>
                        </div>

                        {/* Activity Feed */}
                        {proposalsWaitingReview > 0 && (
                            <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-4 h-4" style={{ color: 'var(--color-status-warning)' }} />
                                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                                        Needs Attention
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/client/jobs')}
                                    className="w-full flex items-start gap-3 text-left group"
                                >
                                    <span
                                        className="shrink-0 text-xs font-bold px-2 py-1 rounded-full mt-0.5"
                                        style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)', color: 'var(--workspace-primary)' }}
                                    >
                                        {proposalsWaitingReview}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium group-hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                                            proposal{proposalsWaitingReview !== 1 ? 's' : ''} waiting for review
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                                            Don't keep talent waiting — review now
                                        </p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Quick Links */}
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                            <p className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                                Quick Links
                            </p>
                            <div className="pb-2">
                                {[
                                    { label: tx('nav.findFreelancers', undefined, 'Find Freelancers'), icon: Users, path: '/find-freelancers' },
                                    { label: tx('dashboard.client.activeProjects', undefined, 'My Jobs'), icon: FolderOpen, path: '/client/jobs' },
                                    { label: tx('nav.contracts', undefined, 'Contracts'), icon: Briefcase, path: '/contracts' },
                                    { label: tx('nav.messages', undefined, 'Messages'), icon: MessageSquare, path: '/messages' },
                                ].map((action) => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={() => navigate(action.path)}
                                        className="group w-full flex items-center justify-between px-5 py-2.5 transition-all duration-150 hover:bg-[var(--color-bg-subtle)]"
                                    >
                                        <span className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                            <action.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                                            {action.label}
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-all -translate-x-1 group-hover:translate-x-0" style={{ color: 'var(--workspace-primary)' }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                    </aside>
                </div>
            </main>
        </div>
    );
}

export default ClientDashboardPage;
