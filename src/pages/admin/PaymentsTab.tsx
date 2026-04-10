import { useState } from 'react';
import { RefreshCw, Check, CreditCard, Loader2 } from 'lucide-react';
import { getStuckTransactions, reconcilePayment } from '@/services/payments';
import { useQuery } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import { useTranslation } from '@/i18n';
import { adminInsetClass, adminPanelClass, adminPillClass } from './adminTheme';

export default function PaymentsTab() {
     const { language, tx } = useTranslation();
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

    const panelClass = adminPanelClass;

    return (
        <div className="space-y-6">
            <div className={`${panelClass} p-5`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
                            <CreditCard className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="font-bold text-white text-base">
                            {tx('dashboard.admin.payments.title', undefined, 'Stuck payments (older than 1 hour)')}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#111] px-4 text-sm font-semibold text-white transition-all hover:border-[#3a3a3a] hover:bg-[#1a1a1a]"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        {tx('dashboard.admin.payments.refresh', undefined, 'Refresh')}
                    </button>
                </div>
            </div>
            <div className={panelClass}>
                {isLoading ? (
                     <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-primary)] mx-auto mb-2" /><p className="text-muted">{tx('dashboard.admin.payments.loading', undefined, 'Loading...')}</p></div>
                 ) : stuckPayments.length === 0 ? (
                     <div className="text-center py-12">
                         <Check className="w-12 h-12 text-[var(--color-status-success)] mx-auto mb-2" />
                         <p className="text-foreground font-medium">{tx('dashboard.admin.payments.noPayments', undefined, 'No stuck payments')}</p>
                         <p className="text-sm text-muted">{tx('dashboard.admin.payments.allSuccess', undefined, 'All transactions completed successfully')}</p>
                     </div>
                 ) : (
                     <div className="space-y-3">
                         {stuckPayments.map(transaction => (
                             <div key={transaction.id} className={`flex items-center justify-between gap-3 p-4 ${adminInsetClass}`}>
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className={`px-2 py-0.5 text-xs rounded-full ${adminPillClass('amber')}`}>{transaction.type}</span>
                                          <span className="font-medium text-foreground">{transaction.amount} {tx('dynamic_key_1524267')}</span>
                                      </div>
                                     <p className="text-sm text-muted">{tx('ui.id')}{transaction.id.slice(0, 8)}... • {new Date(transaction.created_at).toLocaleString(locale)}</p>
                                 </div>
                                 <Button variant="primary" size="sm" disabled={retryingId === transaction.id} onClick={() => handleRetry(transaction.id)}>
                                      {retryingId === transaction.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 ml-1" />{tx('dashboard.admin.payments.retry', undefined, 'Retry')}</>}
                                  </Button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>
        </div>
    );
}
