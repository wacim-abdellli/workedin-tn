import { useState } from 'react';
import { Check, Flag, RefreshCw, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import SkeletonList from '@/components/common/SkeletonList';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { getReports, updateReportStatus } from '@/services/reports';
import type { Report, ReportStatus } from '@/services/reports';

export const ADMIN_REPORTS_QUERY_KEY = ['admin-reports'] as const;

export default function ReportsTab() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { language } = useTranslation();
    const queryClient = useQueryClient();
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;

    const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending');

    const { data: reports = [], isLoading, isError, refetch } = useQuery({
        queryKey: [...ADMIN_REPORTS_QUERY_KEY, statusFilter],
        queryFn: () => getReports(statusFilter === 'all' ? undefined : statusFilter),
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ReportStatus }) => {
            if (!user?.id) throw new Error('Not authenticated');
            return updateReportStatus(id, status, user.id);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_REPORTS_QUERY_KEY });
            showToast(tr('تم تحديث حالة البلاغ', 'Report status updated', 'Statut du signalement mis a jour'), 'success');
        },
        onError: (err: Error) => {
            showToast(err.message || tr('فشل تحديث البلاغ', 'Failed to update report', 'Echec de la mise a jour'), 'error');
        },
    });

    const panelClass = 'card border-white/45 dark:border-white/10 bg-white/80 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_16px_45px_-24px_rgba(21,84,247,0.38)]';

    const statusBadge = (status: ReportStatus) => {
        const map = {
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
            reviewed: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
            dismissed: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
        };
        const labels = {
            pending: tr('معلق', 'Pending', 'En attente'),
            reviewed: tr('تمت المراجعة', 'Reviewed', 'Examine'),
            dismissed: tr('مرفوض', 'Dismissed', 'Rejete'),
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{labels[status]}</span>;
    };

    const typeBadge = (type: Report['reported_type']) => {
        const map = { job: 'bg-blue-100 text-blue-700', user: 'bg-purple-100 text-purple-700', proposal: 'bg-cyan-100 text-cyan-700' };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[type]}`}>{type}</span>;
    };

    return (
        <ErrorBoundary titleAr="فشل تحميل البلاغات" titleFr="Echec du chargement des signalements" titleEn="Failed to load Reports tab">
            <div className="space-y-6">
                <div className={panelClass}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Flag className="w-5 h-5 text-red-500" />
                            <h3 className="font-bold text-foreground">
                                {tr('البلاغات', 'Flagged Content', 'Signalements')}
                                {reports.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 rounded-full text-xs">{reports.length}</span>
                                )}
                            </h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as ReportStatus | 'all')}
                                className="h-9 px-3 border rounded-xl bg-white/92 dark:bg-slate-900/70 border-gray-200 dark:border-white/12 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/35"
                            >
                                <option value="all">{tr('الكل', 'All', 'Tous')}</option>
                                <option value="pending">{tr('معلق', 'Pending', 'En attente')}</option>
                                <option value="reviewed">{tr('تمت المراجعة', 'Reviewed', 'Examine')}</option>
                                <option value="dismissed">{tr('مرفوض', 'Dismissed', 'Rejete')}</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>
                                <RefreshCw className={`w-4 h-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
                                {tr('تحديث', 'Refresh', 'Actualiser')}
                            </Button>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <SkeletonList count={4} />
                ) : isError ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <p className="text-red-500 font-medium">{tr('فشل تحميل البلاغات', 'Failed to load reports', 'Impossible de charger les signalements')}</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-foreground font-medium">{tr('لا توجد بلاغات', 'No reports found', 'Aucun signalement')}</p>
                        <p className="text-sm text-muted mt-1">{tr('لا توجد بلاغات بهذه الحالة', 'No reports with this status', 'Aucun signalement avec ce statut')}</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block card p-0 overflow-hidden border-white/40 dark:border-white/10 bg-white/75 dark:bg-slate-950/45">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/90 dark:bg-slate-900/88 border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 backdrop-blur">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('المُبلِّغ', 'Reporter', 'Signaleur')}</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('النوع', 'Type', 'Type')}</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('السبب', 'Reason', 'Raison')}</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('الحالة', 'Status', 'Statut')}</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('التاريخ', 'Date', 'Date')}</th>
                                            <th className="px-5 py-4 text-center text-xs font-semibold text-muted whitespace-nowrap">{tr('إجراءات', 'Actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {reports.map(report => (
                                            <tr key={report.id} className="hover:bg-primary-50/60 dark:hover:bg-primary-500/10 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-foreground text-sm">{report.reporter?.full_name || '—'}</p>
                                                    <p className="text-xs text-muted">{report.reporter?.email || ''}</p>
                                                </td>
                                                <td className="px-5 py-4">{typeBadge(report.reported_type)}</td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm text-foreground max-w-[200px] truncate" title={report.reason}>{report.reason}</p>
                                                </td>
                                                <td className="px-5 py-4">{statusBadge(report.status)}</td>
                                                <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                                                    {new Date(report.created_at).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {report.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="primary"
                                                                    disabled={updateMutation.isPending}
                                                                    onClick={() => updateMutation.mutate({ id: report.id, status: 'reviewed' })}
                                                                >
                                                                    <Check className="w-3.5 h-3.5 ml-1" />
                                                                    {tr('مراجعة', 'Review', 'Examiner')}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-gray-500 hover:bg-gray-100"
                                                                    disabled={updateMutation.isPending}
                                                                    onClick={() => updateMutation.mutate({ id: report.id, status: 'dismissed' })}
                                                                >
                                                                    <X className="w-3.5 h-3.5 ml-1" />
                                                                    {tr('رفض', 'Dismiss', 'Rejeter')}
                                                                </Button>
                                                            </>
                                                        )}
                                                        {report.status !== 'pending' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-amber-600 hover:bg-amber-50"
                                                                disabled={updateMutation.isPending}
                                                                onClick={() => updateMutation.mutate({ id: report.id, status: 'pending' })}
                                                            >
                                                                {tr('إعادة فتح', 'Reopen', 'Rouvrir')}
                                                            </Button>
                                                        )}
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
                            {reports.map(report => (
                                <div key={report.id} className={panelClass}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <p className="font-semibold text-foreground">{report.reporter?.full_name || '—'}</p>
                                            <p className="text-xs text-muted">{report.reporter?.email || ''}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {typeBadge(report.reported_type)}
                                                {statusBadge(report.status)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3 pb-3 border-b border-gray-100 dark:border-white/10">
                                        <p className="text-sm text-muted mb-1">{tr('السبب', 'Reason', 'Raison')}</p>
                                        <p className="text-sm text-foreground">{report.reason}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-3 text-xs text-muted">
                                        <span>{tr('التاريخ', 'Date', 'Date')}</span>
                                        <span>{new Date(report.created_at).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {report.status === 'pending' ? (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    className="flex-1 min-h-[44px]"
                                                    disabled={updateMutation.isPending}
                                                    onClick={() => updateMutation.mutate({ id: report.id, status: 'reviewed' })}
                                                >
                                                    <Check className="w-4 h-4 ml-1" />
                                                    {tr('مراجعة', 'Review', 'Examiner')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="flex-1 min-h-[44px] text-gray-500 hover:bg-gray-100"
                                                    disabled={updateMutation.isPending}
                                                    onClick={() => updateMutation.mutate({ id: report.id, status: 'dismissed' })}
                                                >
                                                    <X className="w-4 h-4 ml-1" />
                                                    {tr('رفض', 'Dismiss', 'Rejeter')}
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full min-h-[44px]"
                                                disabled={updateMutation.isPending}
                                                onClick={() => updateMutation.mutate({ id: report.id, status: 'pending' })}
                                            >
                                                {tr('إعادة فتح', 'Reopen', 'Rouvrir')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </ErrorBoundary>
    );
}
