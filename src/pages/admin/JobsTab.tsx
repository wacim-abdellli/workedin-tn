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

export const ADMIN_JOBS_QUERY_KEY = ['admin-jobs'] as const;

interface AdminJob {
    id: string;
    title: string;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    hourly_rate: number | null;
    created_at: string;
    client: {
        full_name: string;
        email: string;
    } | null;
}

interface ConfirmActionState {
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
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

        return (data || []) as unknown as AdminJob[];
    } catch (error: any) {
        // Ignore abort errors in development (React StrictMode)
        if (error?.name === 'AbortError') {
            console.log('Query aborted (likely React StrictMode)');
            return [];
        }
        throw error;
    }
}

export default function JobsTab() {
    const { showToast } = useToast();
    const { language } = useTranslation();
    const queryClient = useQueryClient();
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
    const tr = (ar: string, en: string, fr?: string) => {
        if (language === 'ar') return ar;
        if (language === 'fr') return fr || en;
        return en;
    };

    const [jobSearch, setJobSearch] = useState('');
    const [jobFilter, setJobFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'cancelled'>('all');
    const [confirmAction, setConfirmAction] = useState<ConfirmActionState>({
        isOpen: false,
        title: '',
        message: '',
        actionType: 'primary',
        onConfirm: () => {},
    });

    const panelClass = 'card border-white/45 dark:border-white/10 bg-white/80 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_16px_45px_-24px_rgba(21,84,247,0.38)]';
    const tableShellClass = 'hidden md:block card p-0 overflow-hidden border-white/40 dark:border-white/10 bg-white/75 dark:bg-slate-950/45';
    const tableHeadClass = 'bg-white/90 dark:bg-slate-900/88 border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 backdrop-blur';
    const tableRowClass = 'group hover:bg-primary-50/60 dark:hover:bg-primary-500/10 transition-colors';
    const inputClass = 'w-full h-12 pr-11 pl-4 border rounded-xl bg-white/92 dark:bg-slate-900/70 border-gray-200 dark:border-white/12 text-foreground placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:border-primary-400/40';
    const selectClass = 'h-12 px-4 border rounded-xl bg-white/92 dark:bg-slate-900/70 border-gray-200 dark:border-white/12 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:border-primary-400/40';

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
            showToast(tr('تم حذف الوظيفة بنجاح', 'Job deleted successfully', 'Offre supprimee avec succes'), 'success');
        },
        onError: (error) => {
            console.error('Error deleting job:', error);
            showToast(tr('حدث خطأ أثناء الحذف', 'An error occurred while deleting', 'Une erreur est survenue lors de la suppression'), 'error');
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
        return tr('غير محدد', 'Not specified', 'Non specifie');
    };

    const handleDeleteJob = (jobId: string) => {
        setConfirmAction({
            isOpen: true,
            title: tr('حذف الوظيفة', 'Delete Job', 'Supprimer l\'offre'),
            message: tr('هل أنت متأكد من حذف هذه الوظيفة؟', 'Are you sure you want to delete this job?', 'Voulez-vous vraiment supprimer cette offre ?'),
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
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={jobSearch}
                                onChange={(event) => setJobSearch(event.target.value)}
                                placeholder={tr('بحث في الوظائف...', 'Search jobs...', 'Rechercher des offres...')}
                                className={inputClass}
                            />
                        </div>
                        <select
                            value={jobFilter}
                            onChange={(event) => setJobFilter(event.target.value as typeof jobFilter)}
                            className={selectClass}
                        >
                            <option value="all">{tr('جميع الحالات', 'All statuses', 'Tous les statuts')}</option>
                            <option value="open">{tr('مفتوحة', 'Open', 'Ouvertes')}</option>
                            <option value="in_progress">{tr('قيد التنفيذ', 'In progress', 'En cours')}</option>
                            <option value="completed">{tr('مكتملة', 'Completed', 'Terminees')}</option>
                            <option value="cancelled">{tr('ملغاة', 'Cancelled', 'Annulees')}</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                        <p className="text-muted">{tr('جاري تحميل الوظائف...', 'Loading jobs...', 'Chargement des offres...')}</p>
                    </div>
                ) : isError ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <p className="text-red-500 font-medium">{tr('تعذر تحميل الوظائف', 'Failed to load jobs', 'Impossible de charger les offres')}</p>
                        <p className="text-sm text-muted mt-1">{tr('تحقق من صلاحيات قاعدة البيانات', 'Check database permissions', 'Verifiez les permissions base de donnees')}</p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title={tr('لا توجد وظائف مطابقة', 'No jobs match your filters', 'Aucune offre ne correspond')}
                        description={tr('جرب تغيير الفلاتر أو مصطلح البحث', 'Try adjusting your search or filter criteria', 'Essayez de modifier vos criteres de recherche')}
                        action={{
                            label: tr('مسح الفلاتر', 'Clear filters', 'Effacer les filtres'),
                            onClick: () => { setJobSearch(''); setJobFilter('all'); },
                            variant: 'outline',
                        }}
                    />
                ) : (
                    <div className={`${tableShellClass} block`}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={tableHeadClass}>
                                    <tr>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tr('الوظيفة', 'Job', 'Offre')}</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tr('العميل', 'Client', 'Client')}</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tr('الميزانية', 'Budget', 'Budget')}</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tr('الحالة', 'Status', 'Statut')}</th>
                                        <th className="px-6 py-4 text-center text-sm font-medium text-muted whitespace-nowrap">{tr('إجراءات', 'Actions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
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
                                                    job.status === 'open' ? 'bg-green-100 text-green-700' :
                                                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    job.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {job.status === 'open' ? tr('مفتوحة', 'Open', 'Ouverte') :
                                                     job.status === 'in_progress' ? tr('قيد التنفيذ', 'In progress', 'En cours') :
                                                     job.status === 'completed' ? tr('مكتملة', 'Completed', 'Terminee') : tr('ملغاة', 'Cancelled', 'Annulee')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => window.open(`/jobs/${job.id}`, '_blank')}>
                                                        <Eye className="w-4 h-4 ml-1" />
                                                        {tr('مراجعة', 'Review', 'Verifier')}
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>
                                                        <Trash2 className="w-4 h-4 ml-1" />
                                                        {tr('حذف', 'Delete', 'Supprimer')}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={confirmAction.isOpen} onClose={closeConfirm} title={confirmAction.title} size="md">
                <div className="space-y-6 pt-2">
                    <p className="text-muted leading-relaxed font-medium">{confirmAction.message}</p>
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10 mt-6">
                        <Button variant="ghost" className="text-muted hover:bg-gray-100 dark:hover:bg-white/5" onClick={closeConfirm}>
                            {tr('إلغاء', 'Cancel', 'Annuler')}
                        </Button>
                        <Button
                            variant={confirmAction.actionType === 'danger' ? 'danger' : 'primary'}
                            className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}
                            onClick={() => {
                                closeConfirm();
                                confirmAction.onConfirm();
                            }}
                        >
                            {tr('تأكيد', 'Confirm', 'Confirmer')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </ErrorBoundary>
    );
}
