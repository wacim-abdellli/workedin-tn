import { useMemo, useState } from 'react';
import { Briefcase, Eye, Loader2, Search, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { useTranslation } from '@/i18n';
import type { AdminJob, AdminJobRow } from '@/types/admin';
import { adminInputClass, adminPanelClass, adminPillClass, adminSelectClass, adminTableHeadClass, adminTableRowClass, adminTableShellClass } from './adminTheme';

export const ADMIN_JOBS_QUERY_KEY = ['admin-jobs'] as const;

interface ConfirmActionState {
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
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

export default function JobsTab() {
     const { showToast } = useToast();
     const { language, tx } = useTranslation();
     const queryClient = useQueryClient();
     const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';

    const [jobSearch, setJobSearch] = useState('');
    const [jobFilter, setJobFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'cancelled'>('all');
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
                <div className={panelClass}>
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
                        <select
                             value={jobFilter}
                             onChange={(event) => setJobFilter(event.target.value as typeof jobFilter)}
                             className={selectClass}
                         >
                             <option value="all">{tx('dashboard.admin.jobs.allStatuses', undefined, 'All statuses')}</option>
                             <option value="open">{tx('dashboard.admin.jobs.statusOpen', undefined, 'Open')}</option>
                             <option value="in_progress">{tx('dashboard.admin.jobs.statusInProgress', undefined, 'In progress')}</option>
                             <option value="completed">{tx('dashboard.admin.jobs.statusCompleted', undefined, 'Completed')}</option>
                             <option value="cancelled">{tx('dashboard.admin.jobs.statusCancelled', undefined, 'Cancelled')}</option>
                         </select>
                    </div>
                </div>

                {isLoading ? (
                     <div className={`${panelClass} text-center py-12`}>
                         <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                         <p className="text-muted">{tx('dashboard.admin.jobs.loading', undefined, 'Loading jobs...')}</p>
                     </div>
                 ) : isError ? (
                     <div className={`${panelClass} text-center py-12`}>
                         <p className="text-red-500 font-medium">{tx('dashboard.admin.jobs.loadError', undefined, 'Failed to load jobs')}</p>
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
                                <table className="w-full">
                                    <thead className={tableHeadClass}>
                                        <tr>
                                             <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tx('dashboard.admin.jobs.job', undefined, 'Job')}</th>
                                             <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tx('dashboard.admin.jobs.client', undefined, 'Client')}</th>
                                             <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tx('dashboard.admin.jobs.budget', undefined, 'Budget')}</th>
                                             <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tx('dashboard.admin.jobs.status', undefined, 'Status')}</th>
                                             <th className="px-6 py-4 text-center text-sm font-medium text-muted whitespace-nowrap">{tx('dashboard.admin.jobs.actions', undefined, 'Actions')}</th>
                                         </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filteredJobs.map((job) => (
                                            <tr key={job.id} className={tableRowClass}>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-foreground">{job.title}</p>
                                                    <p className="text-xs text-muted">{new Date(job.created_at).toLocaleDateString(locale)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-foreground text-sm">{job.client?.full_name}</p>
                                                    <p className="text-xs text-muted">{job.client?.email}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                    {formatJobBudget(job)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                         job.status === 'open' ? adminPillClass('emerald') :
                                                         job.status === 'in_progress' ? adminPillClass('blue') :
                                                         job.status === 'completed' ? adminPillClass('violet') :
                                                         adminPillClass('neutral')
                                                     }`}>
                                                    {job.status === 'open' ? tx('dashboard.admin.jobs.statusOpen', undefined, 'Open') :
                                                          job.status === 'in_progress' ? tx('dashboard.admin.jobs.statusInProgress', undefined, 'In progress') :
                                                          job.status === 'completed' ? tx('dashboard.admin.jobs.statusCompleted', undefined, 'Completed') : tx('dashboard.admin.jobs.statusCancelled', undefined, 'Cancelled')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                         <Button variant="ghost" size="sm" onClick={() => window.open(`/jobs/${job.id}`, '_blank')}>
                                                             <Eye className="w-4 h-4 ml-1" />
                                                             {tx('dashboard.admin.jobs.review', undefined, 'Review')}
                                                         </Button>
                                                         <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>
                                                             <Trash2 className="w-4 h-4 ml-1" />
                                                             {tx('dashboard.admin.jobs.delete', undefined, 'Delete')}
                                                         </Button>
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
                                              job.status === 'completed' ? adminPillClass('violet') :
                                              adminPillClass('neutral')
                                          }`}>
                                             {job.status === 'open' ? tx('dashboard.admin.jobs.statusOpen', undefined, 'Open') :
                                              job.status === 'in_progress' ? tx('dashboard.admin.jobs.statusInProgress', undefined, 'In progress') :
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
                                         <Button variant="ghost" size="sm" className="flex-1 min-h-[44px] text-red-600 hover:bg-red-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>
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
                             className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}
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
