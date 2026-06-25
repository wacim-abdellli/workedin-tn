import { useEffect, useState } from 'react';
import { Check, Flag, RefreshCw, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import SkeletonList from '@/components/common/SkeletonList';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { getReports, updateReportStatus } from '@/services/reports';
import type { Report, ReportStatus } from '@/services/reports';
import { adminPanelClass, adminPillClass, adminTableHeadClass, adminTableRowClass, adminTableShellClass } from './adminTheme';
import AdminSelect from './AdminSelect';
import { supabase } from '@/lib/supabase';

export const ADMIN_REPORTS_QUERY_KEY = ['admin-reports'] as const;

export default function ReportsTab() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { language } = useTranslation();
    const queryClient = useQueryClient();
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;

    const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending');
    const [resolvedTargets, setResolvedTargets] = useState<Record<string, { title: string; subtitle?: string }>>({});

    const { data: reports = [], isLoading, isError, refetch } = useQuery({
        queryKey: [...ADMIN_REPORTS_QUERY_KEY, statusFilter],
        queryFn: () => getReports(statusFilter === 'all' ? undefined : statusFilter),
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!reports.length) return;

        const fetchTargets = async () => {
            const userIds = reports.filter(r => r.reported_type === 'user').map(r => r.reported_id);
            const jobIds = reports.filter(r => r.reported_type === 'job').map(r => r.reported_id);
            const proposalIds = reports.filter(r => r.reported_type === 'proposal').map(r => r.reported_id);

            const newResolved: Record<string, { title: string; subtitle?: string }> = {};

            try {
                if (userIds.length) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('id, full_name, email')
                        .in('id', userIds);
                    data?.forEach(u => {
                        newResolved[u.id] = { title: u.full_name || '—', subtitle: u.email };
                    });
                }

                if (jobIds.length) {
                    const { data } = await supabase
                        .from('jobs')
                        .select('id, title')
                        .in('id', jobIds);
                    data?.forEach(j => {
                        newResolved[j.id] = { title: j.title };
                    });
                }

                if (proposalIds.length) {
                    const { data } = await supabase
                        .from('proposals')
                        .select('id, cover_letter, job:jobs(title), freelancer:profiles(full_name)')
                        .in('id', proposalIds);
                    data?.forEach(p => {
                        const freelancerName = p.freelancer?.full_name || '—';
                        const jobTitle = p.job?.title || '—';
                        newResolved[p.id] = { 
                            title: tr(`طلب من ${freelancerName}`, `Proposal by ${freelancerName}`, `Proposition par ${freelancerName}`), 
                            subtitle: tr(`لعمل: ${jobTitle}`, `For job: ${jobTitle}`, `Pour: ${jobTitle}`)
                        };
                    });
                }

                setResolvedTargets(prev => ({ ...prev, ...newResolved }));
            } catch (err) {
                console.error('Failed to resolve report targets:', err);
            }
        };

        void fetchTargets();
    }, [reports]);

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

    const panelClass = adminPanelClass;

    const statusBadge = (status: ReportStatus) => {
        const map = {
            pending: adminPillClass('amber'),
            reviewed: adminPillClass('emerald'),
            dismissed: adminPillClass('neutral'),
        };
        const labels = {
            pending: tr('معلق', 'Pending', 'En attente'),
            reviewed: tr('تمت المراجعة', 'Reviewed', 'Examine'),
            dismissed: tr('مرفوض', 'Dismissed', 'Rejete'),
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{labels[status]}</span>;
    };

    const typeBadge = (type: Report['reported_type']) => {
        const map = { job: adminPillClass('blue'), user: adminPillClass('violet'), proposal: adminPillClass('cyan') };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[type]}`}>{type}</span>;
    };

    return (
        <ErrorBoundary titleAr="فشل تحميل البلاغات" titleFr="Echec du chargement des signalements" titleEn="Failed to load Reports tab">
            <div className="space-y-6">
                <div className={`${panelClass} p-5`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15">
                                <Flag className="w-4 h-4 text-red-400" />
                            </div>
                            <h3 className="font-bold text-white text-base">
                                {tr('البلاغات', 'Flagged Content', 'Signalements')}
                                {reports.length > 0 && (
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${adminPillClass('red')}`}>{reports.length}</span>
                                )}
                            </h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <AdminSelect
                                value={statusFilter}
                                onChange={(v) => setStatusFilter(v as ReportStatus | 'all')}
                                className="min-w-[140px]"
                                options={[
                                    { value: 'all', label: tr('الكل', 'All', 'Tous') },
                                    { value: 'pending', label: tr('معلق', 'Pending', 'En attente') },
                                    { value: 'reviewed', label: tr('تمت المراجعة', 'Reviewed', 'Examine') },
                                    { value: 'dismissed', label: tr('مرفوض', 'Dismissed', 'Rejete') },
                                ]}
                            />
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-4 text-sm font-semibold text-white transition-all hover:border-[#3a3a3a] hover:bg-[var(--color-bg-muted)]"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {tr('تحديث', 'Refresh', 'Actualiser')}
                            </button>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <SkeletonList count={4} />
                ) : isError ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <p className="text-[var(--color-status-error)] font-medium">{tr('فشل تحميل البلاغات', 'Failed to load reports', 'Impossible de charger les signalements')}</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className={`${panelClass} text-center py-12`}>
                        <Check className="w-12 h-12 text-[var(--color-status-success)] mx-auto mb-2" />
                        <p className="text-foreground font-medium">{tr('لا توجد بلاغات', 'No reports found', 'Aucun signalement')}</p>
                        <p className="text-sm text-muted mt-1">{tr('لا توجد بلاغات بهذه الحالة', 'No reports with this status', 'Aucun signalement avec ce statut')}</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className={`hidden md:block ${adminTableShellClass}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className={adminTableHeadClass}>
                                        <tr>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('المُبلِّغ', 'Reporter', 'Signaleur')}</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('الهدف', 'Target', 'Cible')}</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('النوع', 'Type', 'Type')}</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('السبب', 'Reason', 'Raison')}</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('الحالة', 'Status', 'Statut')}</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold text-muted whitespace-nowrap">{tr('التاريخ', 'Date', 'Date')}</th>
                                            <th className="px-5 py-4 text-center text-xs font-semibold text-muted whitespace-nowrap">{tr('إجراءات', 'Actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {reports.map(report => (
                                            <tr key={report.id} className={adminTableRowClass}>
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-foreground text-sm">{report.reporter?.full_name || '—'}</p>
                                                    <p className="text-xs text-muted">{report.reporter?.email || ''}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {resolvedTargets[report.reported_id] ? (
                                                        <>
                                                            <p className="font-medium text-foreground text-sm">{resolvedTargets[report.reported_id].title}</p>
                                                            {resolvedTargets[report.reported_id].subtitle && (
                                                                <p className="text-xs text-muted mt-0.5">{resolvedTargets[report.reported_id].subtitle}</p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p className="text-xs text-white/40 italic">{tr('جاري التحميل...', 'Loading details...', 'Chargement...')}</p>
                                                    )}
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
                                                                    className="text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text-muted)]"
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
                                                                className="text-[var(--color-status-warning)] hover:bg-[var(--color-status-warning-subtle)]"
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
                                            <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <p className="text-xs text-muted mb-1">{tr('المحتوى المبلغ عنه', 'Reported Target', 'Cible signalée')}</p>
                                                {resolvedTargets[report.reported_id] ? (
                                                    <>
                                                        <p className="text-sm font-semibold text-foreground">{resolvedTargets[report.reported_id].title}</p>
                                                        {resolvedTargets[report.reported_id].subtitle && (
                                                            <p className="text-xs text-muted mt-0.5">{resolvedTargets[report.reported_id].subtitle}</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-white/40 italic">{tr('جاري التحميل...', 'Loading details...', 'Chargement...')}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                {typeBadge(report.reported_type)}
                                                {statusBadge(report.status)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3 pb-3 border-b border-[var(--color-border-subtle)] dark:border-[var(--color-border-strong)] dark:border-white/10">
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
                                                    className="flex-1 min-h-[44px] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text-muted)]"
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



