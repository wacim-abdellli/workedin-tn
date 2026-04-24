import { useMemo, useState } from 'react';
import { AlertTriangle, Briefcase, Eye, Loader2, Search, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { useTranslation } from '@/i18n';
import type { AdminJob, AdminJobRow } from '@/types/admin';
import { adminActionButtonClass, adminInputClass, adminPanelClass, adminPillClass, adminSelectClass, adminTableHeadClass, adminTableRowClass, adminTableShellClass, adminToolbarClass } from './adminTheme';
import AdminSelect from './AdminSelect';

export const ADMIN_JOBS_QUERY_KEY = ['admin-jobs'] as const;

interface ConfirmActionState {
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
}

interface AdminContractStatusRow {
    id: string;
    job_id: string;
    status: string;
    created_at: string;
    updated_at: string | null;
}

interface AdminJobStatusMismatch {
    jobId: string;
    jobTitle: string;
    currentJobStatus: string;
    expectedJobStatus: string;
    latestContractStatus: string;
    contractId: string;
    contractUpdatedAt: string;
}

interface AdminReviewTimeoutCandidate {
    contract_id: string;
    client_id: string;
    freelancer_id: string | null;
    review_due_at: string;
    timeout_stage: 'reminder' | 'overdue';
    job_title: string;
}

function normalizeAdminJobClient(client: AdminJobRow['client']): AdminJob['client'] {
    if (Array.isArray(client)) {
        const [firstClient] = client;

        return firstClient
            ? {
                full_name: firstClient.full_name || '',
                email: firstClient.email || '',
            }
            : null;
    }

    if (!client) {
        return null;
    }

    return {
        full_name: client.full_name || '',
        email: client.email || '',
    };
}

export async function fetchAdminJobs(): Promise<AdminJob[]> {
    try {
        // Use admin client to bypass RLS
        const client = supabase;
        const { data, error } = await client
            .from('jobs')
            .select('id,title,status,budget_min,budget_max,hourly_rate,created_at,client:profiles!client_id(full_name,email)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('fetchAdminJobs error:', error);
            throw new Error(`Failed to fetch jobs: ${error.message}`);
        }

        const rows = (data ?? []) as AdminJobRow[];

        return rows.map((job) => ({
            ...job,
            client: normalizeAdminJobClient(job.client),
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

const normalizeStatus = (value: string | null | undefined) => String(value || '').toLowerCase();

const expectedJobStatusFromContract = (contractStatus: string) => {
    const normalized = normalizeStatus(contractStatus);
    if (normalized === 'completed') return 'completed';
    if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
    if (normalized === 'disputed') return 'disputed';
    return 'in_progress';
};

async function fetchAdminJobStatusMismatches(): Promise<AdminJobStatusMismatch[]> {
    const client = supabase;

    const [{ data: jobsData, error: jobsError }, { data: contractsData, error: contractsError }] = await Promise.all([
        client
            .from('jobs')
            .select('id,title,status')
            .order('created_at', { ascending: false })
            .limit(500),
        client
            .from('contracts')
            .select('id,job_id,status,created_at,updated_at')
            .order('updated_at', { ascending: false })
            .limit(1000),
    ]);

    if (jobsError) throw new Error(`Failed to fetch jobs for consistency check: ${jobsError.message}`);
    if (contractsError && contractsError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch contracts for consistency check: ${contractsError.message}`);
    }

    const latestContractByJob = new Map<string, AdminContractStatusRow>();
    ((contractsData ?? []) as AdminContractStatusRow[]).forEach((contract) => {
        if (!contract.job_id) return;

        const current = latestContractByJob.get(contract.job_id);
        if (!current) {
            latestContractByJob.set(contract.job_id, contract);
            return;
        }

        const currentTime = new Date(current.updated_at || current.created_at).getTime();
        const nextTime = new Date(contract.updated_at || contract.created_at).getTime();
        if (nextTime >= currentTime) {
            latestContractByJob.set(contract.job_id, contract);
        }
    });

    return ((jobsData ?? []) as Array<{ id: string; title: string; status: string }>).flatMap((job) => {
        const latestContract = latestContractByJob.get(job.id);
        if (!latestContract) return [];

        const expectedStatus = expectedJobStatusFromContract(latestContract.status);
        const normalizedCurrentStatus = normalizeStatus(job.status);
        if (normalizedCurrentStatus === expectedStatus) return [];

        return [{
            jobId: job.id,
            jobTitle: job.title,
            currentJobStatus: normalizedCurrentStatus || 'unknown',
            expectedJobStatus: expectedStatus,
            latestContractStatus: normalizeStatus(latestContract.status) || 'unknown',
            contractId: latestContract.id,
            contractUpdatedAt: latestContract.updated_at || latestContract.created_at,
        } satisfies AdminJobStatusMismatch];
    });
}

export default function JobsTab() {
     const { showToast } = useToast();
     const { language, tx } = useTranslation();
     const queryClient = useQueryClient();
     const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';

    const [jobSearch, setJobSearch] = useState('');
    const [jobFilter, setJobFilter] = useState<'all' | 'open' | 'in_progress' | 'disputed' | 'completed' | 'cancelled'>('all');
    const [confirmAction, setConfirmAction] = useState<ConfirmActionState>({
        isOpen: false,
        title: '',
        message: '',
        actionType: 'primary',
        onConfirm: () => {},
    });

    const panelClass = adminPanelClass;
    const tableShellClass = `hidden md:block ${adminTableShellClass}`;
    const tableHeadClass = adminTableHeadClass;
    const tableRowClass = adminTableRowClass;
    const inputClass = `pe-11 ps-4 ${adminInputClass}`;
    const selectClass = adminSelectClass;

    const closeConfirm = () => setConfirmAction((prev) => ({ ...prev, isOpen: false }));

    const { data: jobs = [], isLoading, isError } = useQuery({
        queryKey: ADMIN_JOBS_QUERY_KEY,
        queryFn: fetchAdminJobs,
        retry: 1,
        staleTime: 30000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const {
        data: statusMismatches = [],
        isLoading: isCheckingStatusConsistency,
    } = useQuery({
        queryKey: ['admin-job-status-mismatches'],
        queryFn: fetchAdminJobStatusMismatches,
        retry: 1,
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    const {
        data: reviewTimeoutCandidates = [],
        isLoading: isLoadingReviewTimeoutCandidates,
    } = useQuery({
        queryKey: ['admin-contract-review-timeouts'],
        queryFn: async (): Promise<AdminReviewTimeoutCandidate[]> => {
            const { data, error } = await supabase.rpc('get_contract_review_timeout_candidates', { p_limit: 50 });
            if (error) throw error;
            return (data || []) as AdminReviewTimeoutCandidate[];
        },
        retry: 1,
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    const updateJobsCache = (updater: (prev: AdminJob[]) => AdminJob[]) => {
        queryClient.setQueryData<AdminJob[]>(ADMIN_JOBS_QUERY_KEY, (prev = []) => updater(prev));
    };

    const deleteJobMutation = useMutation({
        mutationFn: async (jobId: string) => {
            const client = supabase;
            await supabaseWithRetry(() =>
                client
                    .from('jobs')
                    .delete()
                    .eq('id', jobId)
            );
            return jobId;
        },
        onSuccess: (jobId) => {
             updateJobsCache((prev) => prev.filter((job) => job.id !== jobId));
             showToast(tx('dashboard.admin.jobs.deletedSuccess', undefined, 'Job deleted successfully'), 'success');
         },
         onError: (error) => {
             console.error('Error deleting job:', error);
             showToast(tx('dashboard.admin.jobs.deleteError', undefined, 'An error occurred while deleting'), 'error');
         },
    });

    const filteredJobs = useMemo(() => jobs.filter((job) => {
        if (jobFilter !== 'all' && job.status !== jobFilter) return false;
        if (jobSearch && !job.title.includes(jobSearch)) return false;
        return true;
    }), [jobSearch, jobFilter, jobs]);

    const formatJobBudget = (job: AdminJob) => {
        if (typeof job.hourly_rate === 'number' && !Number.isNaN(job.hourly_rate)) {
            return `${job.hourly_rate} د.ت/ساعة`;
        }
        if (typeof job.budget_min === 'number' && typeof job.budget_max === 'number') {
            return `${job.budget_min} - ${job.budget_max} د.ت`;
        }
        if (typeof job.budget_max === 'number') {
            return `${job.budget_max} د.ت`;
        }
        if (typeof job.budget_min === 'number') {
             return `${job.budget_min} د.ت`;
         }
         return tx('dashboard.admin.jobs.notSpecified', undefined, 'Not specified');
    };

    const handleDeleteJob = (jobId: string) => {
         setConfirmAction({
             isOpen: true,
             title: tx('dashboard.admin.jobs.deleteTitle', undefined, 'Delete Job'),
             message: tx('dashboard.admin.jobs.deleteConfirm', undefined, 'Are you sure you want to delete this job?'),
             actionType: 'danger',
             onConfirm: () => {
                 deleteJobMutation.mutate(jobId);
             },
         });
     };

    return (
        <ErrorBoundary
            titleAr="فشل تحميل قسم الوظائف — حاول التحديث"
            titleFr="Echec du chargement des offres — essayez de rafraichir"
            titleEn="Failed to load Jobs tab — try refreshing"
        >
            <div className="space-y-6">
                <div className={adminToolbarClass}>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                            <input
                                 type="text"
                                 value={jobSearch}
                                 onChange={(event) => setJobSearch(event.target.value)}
                                 placeholder={tx('dashboard.admin.jobs.searchPlaceholder', undefined, 'Search jobs...')}
                                 className={inputClass}
                             />
                        </div>
                        <AdminSelect
                             value={jobFilter}
                             onChange={(v) => setJobFilter(v as typeof jobFilter)}
                             className="min-w-[180px]"
                             options={[
                                 { value: 'all', label: tx('dashboard.admin.jobs.allStatuses', undefined, 'All statuses') },
                                 { value: 'open', label: tx('dashboard.admin.jobs.statusOpen', undefined, 'Open') },
                                 { value: 'in_progress', label: tx('dashboard.admin.jobs.statusInProgress', undefined, 'In progress') },
                                 { value: 'disputed', label: tx('dashboard.admin.jobs.statusDisputed', undefined, 'Disputed') },
                                 { value: 'completed', label: tx('dashboard.admin.jobs.statusCompleted', undefined, 'Completed') },
                                 { value: 'cancelled', label: tx('dashboard.admin.jobs.statusCancelled', undefined, 'Cancelled') },
                             ]}
                         />
                    </div>
                </div>

                <div className={panelClass}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-300" />
                                {tx('dashboard.admin.jobs.consistencyTitle', undefined, 'Lifecycle consistency check')}
                            </p>
                            <p className="text-xs text-muted">
                                {tx('dashboard.admin.jobs.consistencyDescription', undefined, 'Compares jobs.status with the latest linked contract status.')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-job-status-mismatches'] })}
                            className={`${adminActionButtonClass} border-amber-500/20 text-amber-200 hover:bg-amber-500/12`}
                        >
                            {tx('dashboard.admin.jobs.refreshCheck', undefined, 'Refresh check')}
                        </button>
                    </div>

                    {isCheckingStatusConsistency ? (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {tx('dashboard.admin.jobs.consistencyLoading', undefined, 'Checking consistency...')}
                        </div>
                    ) : statusMismatches.length === 0 ? (
                        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-sm text-emerald-300">
                            {tx('dashboard.admin.jobs.consistencyHealthy', undefined, 'No status mismatch detected between jobs and latest contracts.')}
                        </div>
                    ) : (
                        <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3">
                            <p className="text-sm font-semibold text-amber-200 mb-2">
                                {tx(
                                    'dashboard.admin.jobs.consistencyCount',
                                    { count: statusMismatches.length },
                                    `${statusMismatches.length} job(s) have status drift`,
                                )}
                            </p>
                            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                {statusMismatches.slice(0, 12).map((item) => (
                                    <div key={item.jobId} className="rounded-lg border border-amber-500/20 bg-black/20 px-3 py-2 text-xs">
                                        <p className="font-semibold text-foreground">{item.jobTitle}</p>
                                        <p className="text-muted mt-1">
                                            {tx('dashboard.admin.jobs.currentStatus', undefined, 'Current')}: {item.currentJobStatus} | {tx('dashboard.admin.jobs.expectedStatus', undefined, 'Expected')}: {item.expectedJobStatus} ({tx('dashboard.admin.jobs.fromContract', undefined, 'from contract')}: {item.latestContractStatus})
                                        </p>
                                        <p className="text-muted mt-1">
                                            #{item.jobId.slice(0, 8)} · #{item.contractId.slice(0, 8)}
                                        </p>
                                    </div>
                                ))}
                                {statusMismatches.length > 12 && (
                                    <p className="text-xs text-muted">
                                        {tx(
                                            'dashboard.admin.jobs.consistencyMore',
                                            { count: statusMismatches.length - 12 },
                                            `+${statusMismatches.length - 12} more mismatches`,
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className={panelClass}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-300" />
                                {tx('dashboard.admin.jobs.reviewTimeoutsTitle', undefined, 'Contract review timeout watch')}
                            </p>
                            <p className="text-xs text-muted">
                                {tx('dashboard.admin.jobs.reviewTimeoutsDescription', undefined, 'Tracks due-soon and overdue client review windows after delivery.')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-contract-review-timeouts'] })}
                            className={`${adminActionButtonClass} border-orange-500/20 text-orange-200 hover:bg-orange-500/12`}
                        >
                            {tx('dashboard.admin.jobs.refreshReviewTimeouts', undefined, 'Refresh watch')}
                        </button>
                    </div>

                    {isLoadingReviewTimeoutCandidates ? (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {tx('dashboard.admin.jobs.reviewTimeoutsLoading', undefined, 'Checking review windows...')}
                        </div>
                    ) : reviewTimeoutCandidates.length === 0 ? (
                        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-sm text-emerald-300">
                            {tx('dashboard.admin.jobs.reviewTimeoutsHealthy', undefined, 'No due-soon or overdue review windows detected.')}
                        </div>
                    ) : (
                        <div className="mt-3 rounded-xl border border-orange-500/25 bg-orange-500/8 p-3">
                            <p className="text-sm font-semibold text-orange-200 mb-2">
                                {tx(
                                    'dashboard.admin.jobs.reviewTimeoutsCount',
                                    { count: reviewTimeoutCandidates.length },
                                    `${reviewTimeoutCandidates.length} contract review window(s) need attention`,
                                )}
                            </p>
                            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                {reviewTimeoutCandidates.slice(0, 12).map((item) => (
                                    <div key={`${item.contract_id}:${item.timeout_stage}`} className="rounded-lg border border-orange-500/20 bg-black/20 px-3 py-2 text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-semibold text-foreground truncate">{item.job_title}</p>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] ${item.timeout_stage === 'overdue' ? adminPillClass('red') : adminPillClass('amber')}`}>
                                                {item.timeout_stage === 'overdue'
                                                    ? tx('dashboard.admin.jobs.reviewTimeoutStageOverdue', undefined, 'Overdue')
                                                    : tx('dashboard.admin.jobs.reviewTimeoutStageReminder', undefined, 'Due soon')}
                                            </span>
                                        </div>
                                        <p className="text-muted mt-1">
                                            {tx('dashboard.admin.jobs.reviewDueAt', undefined, 'Review due')}: {new Date(item.review_due_at).toLocaleString(locale)}
                                        </p>
                                        <p className="text-muted mt-1">#{item.contract_id.slice(0, 8)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {isLoading ? (
                     <div className={`${panelClass} text-center py-12`}>
                         <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-primary)] mx-auto mb-2" />
                         <p className="text-muted">{tx('dashboard.admin.jobs.loading', undefined, 'Loading jobs...')}</p>
                     </div>
                 ) : isError ? (
                     <div className={`${panelClass} text-center py-12`}>
                         <p className="text-[var(--color-status-error)] font-medium">{tx('dashboard.admin.jobs.loadError', undefined, 'Failed to load jobs')}</p>
                         <p className="text-sm text-muted mt-1">{tx('dashboard.admin.jobs.checkPermissions', undefined, 'Check database permissions')}</p>
                     </div>
                 ) : filteredJobs.length === 0 ? (
                     <EmptyState
                         icon={Briefcase}
                         title={tx('dashboard.admin.jobs.noResults', undefined, 'No jobs match your filters')}
                         description={tx('dashboard.admin.jobs.tryAdjusting', undefined, 'Try adjusting your search or filter criteria')}
                         action={{
                             label: tx('dashboard.admin.jobs.clearFilters', undefined, 'Clear filters'),
                             onClick: () => { setJobSearch(''); setJobFilter('all'); },
                             variant: 'outline',
                         }}
                     />
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className={`${tableShellClass} hidden md:block`}>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px]">
                                    <thead className={tableHeadClass}>
                                        <tr>
                                             <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.jobs.job', undefined, 'Job')}</th>
                                             <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.jobs.client', undefined, 'Client')}</th>
                                             <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.jobs.budget', undefined, 'Budget')}</th>
                                             <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.jobs.status', undefined, 'Status')}</th>
                                             <th className="px-6 py-4 text-center text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tx('dashboard.admin.jobs.actions', undefined, 'Actions')}</th>
                                          </tr>
                                     </thead>
                                     <tbody>
                                        {filteredJobs.map((job) => (
                                            <tr key={job.id} className={tableRowClass}>
                                                <td className="px-6 py-5">
                                                    <p className="font-semibold text-foreground">{job.title}</p>
                                                    <p className="mt-0.5 text-xs text-muted">{new Date(job.created_at).toLocaleDateString(locale)}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="font-medium text-foreground text-sm">{job.client?.full_name}</p>
                                                    <p className="mt-0.5 text-xs text-muted">{job.client?.email}</p>
                                                </td>
                                                <td className="px-6 py-5 text-sm font-semibold text-foreground">
                                                    {formatJobBudget(job)}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                                         job.status === 'open' ? adminPillClass('emerald') :
                                                         job.status === 'in_progress' ? adminPillClass('blue') :
                                                           job.status === 'disputed' ? adminPillClass('amber') :
                                                         job.status === 'completed' ? adminPillClass('violet') :
                                                         adminPillClass('neutral')
                                                     }`}>
                                                    {job.status === 'open' ? tx('dashboard.admin.jobs.statusOpen', undefined, 'Open') :
                                                          job.status === 'in_progress' ? tx('dashboard.admin.jobs.statusInProgress', undefined, 'In progress') :
                                                            job.status === 'disputed' ? tx('dashboard.admin.jobs.statusDisputed', undefined, 'Disputed') :
                                                          job.status === 'completed' ? tx('dashboard.admin.jobs.statusCompleted', undefined, 'Completed') : tx('dashboard.admin.jobs.statusCancelled', undefined, 'Cancelled')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                         <button className={`${adminActionButtonClass} border-sky-500/15 text-sky-200 hover:bg-sky-500/10`} onClick={() => window.open(`/jobs/${job.id}`, '_blank')}>
                                                              <Eye className="w-4 h-4 ml-1" />
                                                              {tx('dashboard.admin.jobs.review', undefined, 'Review')}
                                                         </button>
                                                         <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-status-error)]/18 bg-[var(--color-status-error)]/10 px-3.5 text-sm font-semibold text-[var(--color-status-error)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-status-error)]/16 disabled:opacity-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>
                                                              <Trash2 className="w-4 h-4 ml-1" />
                                                              {tx('dashboard.admin.jobs.delete', undefined, 'Delete')}
                                                         </button>
                                                      </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile card layout */}
                        <div className="md:hidden space-y-4">
                            {filteredJobs.map((job) => (
                                <div key={job.id} className={panelClass}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground mb-1">{job.title}</h3>
                                            <p className="text-xs text-muted">{new Date(job.created_at).toLocaleDateString(locale)}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ml-2 ${
                                              job.status === 'open' ? adminPillClass('emerald') :
                                              job.status === 'in_progress' ? adminPillClass('blue') :
                                                job.status === 'disputed' ? adminPillClass('amber') :
                                              job.status === 'completed' ? adminPillClass('violet') :
                                              adminPillClass('neutral')
                                          }`}>
                                             {job.status === 'open' ? tx('dashboard.admin.jobs.statusOpen', undefined, 'Open') :
                                              job.status === 'in_progress' ? tx('dashboard.admin.jobs.statusInProgress', undefined, 'In progress') :
                                                job.status === 'disputed' ? tx('dashboard.admin.jobs.statusDisputed', undefined, 'Disputed') :
                                              job.status === 'completed' ? tx('dashboard.admin.jobs.statusCompleted', undefined, 'Completed') : tx('dashboard.admin.jobs.statusCancelled', undefined, 'Cancelled')}
                                         </span>
                                    </div>
                                    
                                     <div className="space-y-2 mb-4 pb-4 border-b border-border">
                                         <div className="flex justify-between text-sm">
                                             <span className="text-muted">{tx('dashboard.admin.jobs.client', undefined, 'Client')}</span>
                                             <span className="font-medium text-foreground">{job.client?.full_name}</span>
                                         </div>
                                         <div className="flex justify-between text-sm">
                                             <span className="text-muted">{tx('dashboard.admin.jobs.budget', undefined, 'Budget')}</span>
                                             <span className="font-semibold text-foreground">{formatJobBudget(job)}</span>
                                         </div>
                                     </div>
                                    
                                    <div className="flex gap-2">
                                         <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" onClick={() => window.open(`/jobs/${job.id}`, '_blank')}>
                                             <Eye className="w-4 h-4 ml-1" />
                                             {tx('dashboard.admin.jobs.review', undefined, 'Review')}
                                         </Button>
                                         <Button variant="ghost" size="sm" className="flex-1 min-h-[44px] text-[var(--color-status-error)] hover:bg-[var(--color-status-error-subtle)]" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>
                                             <Trash2 className="w-4 h-4 ml-1" />
                                             {tx('dashboard.admin.jobs.delete', undefined, 'Delete')}
                                         </Button>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Modal isOpen={confirmAction.isOpen} onClose={closeConfirm} title={confirmAction.title} size="md">
                <div className="space-y-6 pt-2">
                    <p className="text-muted leading-relaxed font-medium">{confirmAction.message}</p>
                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                        <Button variant="ghost" className="text-muted hover:bg-surface" onClick={closeConfirm}>
                             {tx('dashboard.admin.jobs.cancel', undefined, 'Cancel')}
                         </Button>
                         <Button
                             variant={confirmAction.actionType === 'danger' ? 'danger' : 'primary'}
                             className={confirmAction.actionType === 'warning' ? 'bg-[var(--color-status-warning)] hover:bg-[var(--color-status-warning-hover)] text-white border-transparent shadow shadow-amber-600/30' : ''}
                             onClick={() => {
                                 closeConfirm();
                                 confirmAction.onConfirm();
                             }}
                         >
                             {tx('dashboard.admin.jobs.confirm', undefined, 'Confirm')}
                         </Button>
                    </div>
                </div>
            </Modal>
        </ErrorBoundary>
    );
}
