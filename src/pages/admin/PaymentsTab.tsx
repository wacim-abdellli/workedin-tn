import { useState } from 'react';
import { RefreshCw, Check, CreditCard, Loader2 } from 'lucide-react';
import { getStuckTransactions, reconcilePayment } from '@/services/payments';
import { useQuery } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import { useTranslation } from '@/i18n';

export default function PaymentsTab() {
    const { language } = useTranslation();
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';

    const [retryingId, setRetryingId] = useState<string | null>(null);

    const { data: stuckPayments = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-stuck-payments'],
        queryFn: getStuckTransactions,
    });

    const handleRetry = async (txId: string) => {
        setRetryingId(txId);
        await reconcilePayment(txId);
        setRetryingId(null);
        refetch();
    };

    const panelClass = 'card border-white/45 dark:border-white/10 bg-white/80 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_16px_45px_-24px_rgba(21,84,247,0.38)]';

    return (
        <div className="space-y-6">
            <div className={panelClass}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-yellow-600" />
                        {tr('المدفوعات المعلقة (أكثر من ساعة)', 'Stuck payments (older than 1 hour)', 'Paiements bloques (plus d une heure)')}
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className={`w-4 h-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} />{tr('تحديث', 'Refresh', 'Actualiser')}
                    </Button>
                </div>
                {isLoading ? (
                    <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" /><p className="text-muted">{tr('جاري التحميل...', 'Loading...', 'Chargement...')}</p></div>
                ) : stuckPayments.length === 0 ? (
                    <div className="text-center py-12">
                        <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-foreground font-medium">{tr('لا توجد مدفوعات معلقة', 'No stuck payments', 'Aucun paiement bloque')}</p>
                        <p className="text-sm text-muted">{tr('جميع المعاملات تمت بنجاح', 'All transactions completed successfully', 'Toutes les transactions ont reussi')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stuckPayments.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs rounded-full">{tx.type}</span>
                                        <span className="font-medium text-foreground">{tx.amount} د.ت</span>
                                    </div>
                                    <p className="text-sm text-muted">ID: {tx.id.slice(0, 8)}... • {new Date(tx.created_at).toLocaleString(locale)}</p>
                                </div>
                                <Button variant="primary" size="sm" disabled={retryingId === tx.id} onClick={() => handleRetry(tx.id)}>
                                    {retryingId === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 ml-1" />{tr('إعادة المحاولة', 'Retry', 'Reessayer')}</>}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
