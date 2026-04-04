import { useState } from 'react';
import { AlertTriangle, RefreshCw, Check, X, Eye, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Button from '../../components/ui/Button';
import { useTranslation } from '@/i18n';

interface DisputeRecord {
    id: string;
    contract_id: string;
    opened_at: string;
    reason: string;
    status: string;
    contract: { id: string; amount: number; job: { title: string } } | null;
    opener: { full_name: string; email: string } | null;
}

export default function DisputesTab() {
    const { language } = useTranslation();
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
    const queryClient = useQueryClient();
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const { data: disputes = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-disputes'],
        queryFn: async (): Promise<DisputeRecord[]> => {
            const { data, error } = await supabase
                .from('disputes')
                .select('id,contract_id,opened_at,reason,status,contract:contracts!disputes_contract_id_fkey(id,amount,job:jobs(title)),opener:profiles!disputes_opened_by_fkey(full_name,email)')
                .eq('status', 'open')
                .order('opened_at', { ascending: true });
            if (error) throw error;
            return (data || []) as unknown as DisputeRecord[];
        },
    });

    const resolveMutation = useMutation({
        mutationFn: async ({ disputeId, resolution, note }: { disputeId: string; resolution: string; note?: string }) => {
            const { error } = await supabase.rpc('resolve_dispute', { p_dispute_id: disputeId, p_resolution: resolution, p_admin_note: note || null });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
        },
    });

    const handleResolve = (disputeId: string, resolution: string, note?: string) => {
        setResolvingId(disputeId);
        resolveMutation.mutate({ disputeId, resolution, note }, { onSettled: () => setResolvingId(null) });
    };

    const panelClass = 'card border-white/45 dark:border-white/10 bg-white/80 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_16px_45px_-24px_rgba(21,84,247,0.38)]';

    return (
        <div className="space-y-6">
            <div className={panelClass}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        {tr('نزاعات مفتوحة', 'Open disputes', 'Litiges ouverts')}
                        {disputes.length > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-sm">{disputes.length}</span>}
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className={`w-4 h-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} />{tr('تحديث', 'Refresh', 'Actualiser')}
                    </Button>
                </div>
                {isLoading ? (
                    <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" /><p className="text-muted">{tr('جاري التحميل...', 'Loading...', 'Chargement...')}</p></div>
                ) : disputes.length === 0 ? (
                    <div className="text-center py-12">
                        <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-foreground font-medium">{tr('لا توجد نزاعات مفتوحة', 'No open disputes', 'Aucun litige ouvert')}</p>
                        <p className="text-sm text-muted">{tr('كل النزاعات تمت معالجتها', 'All disputes are handled', 'Tous les litiges sont traites')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disputes.map(d => (
                            <div key={d.id} className="border border-red-200 dark:border-red-500/30 rounded-xl overflow-hidden">
                                <div className="p-4 bg-red-50/85 dark:bg-red-500/10">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-foreground">{d.contract?.job?.title || tr('عقد', 'Contract', 'Contrat')}</p>
                                            <p className="text-sm text-muted">{tr('فتحه', 'Opened by', 'Ouvert par')}: {d.opener?.full_name} — {d.opener?.email}</p>
                                            <p className="text-xs text-muted mt-1">{new Date(d.opened_at).toLocaleString(locale)}</p>
                                            <div className="mt-3 p-3 bg-white dark:bg-gray-800/85 rounded-lg border border-red-100 dark:border-red-500/20">
                                                <p className="text-sm text-foreground"><strong>{tr('سبب النزاع', 'Dispute reason', 'Raison du litige')}:</strong> {d.reason}</p>
                                            </div>
                                            {d.contract?.amount && <p className="text-sm font-medium text-muted mt-2">{tr('مبلغ العقد', 'Contract amount', 'Montant du contrat')}: {d.contract.amount} د.ت</p>}
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <Button size="sm" variant="outline" onClick={() => window.open(`/contracts/${d.contract_id}`, '_blank')}>
                                                <Eye className="w-4 h-4 ml-1" />{tr('عرض العقد', 'View contract', 'Voir le contrat')}
                                            </Button>
                                            <Button size="sm" variant="primary" disabled={resolvingId === d.id} onClick={() => handleResolve(d.id, 'resolved_freelancer', tr('نزاع لصالح المستقل', 'Dispute resolved for freelancer', 'Litige resolu en faveur du freelance'))}>
                                                {resolvingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 ml-1" />}
                                                {tr('لصالح المستقل', 'For freelancer', 'Pour le freelance')}
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" disabled={resolvingId === d.id} onClick={() => handleResolve(d.id, 'resolved_client', tr('نزاع لصالح العميل', 'Dispute resolved for client', 'Litige resolu en faveur du client'))}>
                                                <X className="w-4 h-4 ml-1" />{tr('لصالح العميل', 'For client', 'Pour le client')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
