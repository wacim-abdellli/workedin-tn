import { useState } from 'react';
import { 
    RefreshCw, Check, CreditCard, Loader2, User, 
    Landmark, Phone, AlertCircle, CheckCircle, XCircle 
} from 'lucide-react';
import { 
    getStuckTransactions, 
    reconcilePayment, 
    getAllWithdrawalsAdmin, 
    processWithdrawalRequest 
} from '@/services/payments';
import { useQuery } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import { useTranslation } from '@/i18n';
import { useToast } from '@/components/ui/Toast';
import { adminInsetClass, adminPanelClass, adminPillClass } from './adminTheme';

export default function PaymentsTab() {
    const { language, tx } = useTranslation();
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';

    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});

    // Fetch stuck payments
    const { data: stuckPayments = [], isLoading: isStuckLoading, refetch: refetchStuck } = useQuery({
        queryKey: ['admin-stuck-payments'],
        queryFn: getStuckTransactions,
    });

    // Fetch withdrawals
    const { data: withdrawalsData, isLoading: isWithdrawalsLoading, refetch: refetchWithdrawals } = useQuery({
        queryKey: ['admin-pending-withdrawals'],
        queryFn: () => getAllWithdrawalsAdmin(1, 50),
    });

    const withdrawals = withdrawalsData?.data || [];

    const { showToast } = useToast();

    const handleRetry = async (txId: string) => {
        setRetryingId(txId);
        try {
            const res = await reconcilePayment(txId);
            if (res.success) {
                showToast(res.message || 'Reconciliation succeeded', 'success');
            } else {
                showToast(res.message || 'Reconciliation failed', 'error');
            }
        } catch (err) {
            console.error('Failed to reconcile payment:', err);
            showToast('Reconciliation failed', 'error');
        } finally {
            setRetryingId(null);
            refetchStuck();
        }
    };

    const handleProcessWithdrawal = async (wId: string, action: 'approve' | 'reject') => {
        setProcessingId(wId);
        try {
            const adminNote = notes[wId] || '';
            await processWithdrawalRequest(wId, action, adminNote);
            
            showToast(
                action === 'approve'
                    ? tx('dashboard.admin.payments.approvedSuccess', undefined, 'Withdrawal payout executed successfully')
                    : tx('dashboard.admin.payments.rejectedSuccess', undefined, 'Withdrawal request rejected and refunded'),
                'success'
            );

            // Clear note after success
            setNotes(prev => {
                const next = { ...prev };
                delete next[wId];
                return next;
            });
            refetchWithdrawals();
        } catch (err) {
            console.error('Failed to process withdrawal:', err);
            const msg = err instanceof Error ? err.message : 'Unknown error';
            showToast(`Failed: ${msg}`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleNoteChange = (wId: string, value: string) => {
        setNotes(prev => ({ ...prev, [wId]: value }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'TND' }).format(amount);
    };

    const panelClass = adminPanelClass;

    return (
        <div className="space-y-8">
            {/* ── SECTION 1: DHMAD AUTOMATED PAYOUT PROCESSOR ── */}
            <div className={panelClass}>
                <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15">
                            <CreditCard className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">
                                Dhmad Payout Approvals
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Review and automate bank transfers or mobile wallet payouts to freelancers
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetchWithdrawals()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-4 text-sm font-semibold text-white transition-all hover:border-[#3a3a3a] hover:bg-[var(--color-bg-muted)]"
                    >
                        <RefreshCw className={`w-4 h-4 ${isWithdrawalsLoading ? 'animate-spin' : ''}`} />
                        {tx('dashboard.admin.payments.refresh', undefined, 'Refresh')}
                    </button>
                </div>

                <div className="p-5">
                    {isWithdrawalsLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-2" />
                            <p className="text-muted text-sm">Loading withdrawals...</p>
                        </div>
                    ) : withdrawals.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                            <p className="text-foreground font-medium">No withdrawal requests found</p>
                            <p className="text-sm text-muted-foreground">All requested payouts are fully processed.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse text-gray-300">
                                <thead>
                                    <tr className="border-b border-[var(--color-border-subtle)] text-xs uppercase text-gray-400">
                                        <th className="py-3 px-4">User</th>
                                        <th className="py-3 px-4">Amount (Gross / Net)</th>
                                        <th className="py-3 px-4">Method & Destination</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Admin Note / Reason</th>
                                        <th className="py-3 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.map((w: any) => {
                                        const isPending = w.status === 'pending' || w.status === 'processing';
                                        const fee = parseFloat(w.fee ?? '0');
                                        const netAmount = parseFloat(w.amount) - fee;
                                        
                                        let statusColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                                        if (w.status === 'completed') statusColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                                        if (w.status === 'rejected') statusColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

                                        return (
                                            <tr key={w.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-muted)]/30 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold uppercase text-xs">
                                                            {w.profile?.full_name?.slice(0, 2) || <User className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-white">{w.profile?.full_name || 'Unknown User'}</div>
                                                            <div className="text-xs text-muted-foreground">{w.profile?.email || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="font-bold text-white">{formatCurrency(parseFloat(w.amount))}</div>
                                                    <div className="text-xs text-emerald-400">Net: {formatCurrency(netAmount)}</div>
                                                    <div className="text-[10px] text-muted-foreground">Fee: {formatCurrency(fee)}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    {w.method === 'bank_transfer' ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-white">
                                                                <Landmark className="w-3.5 h-3.5 text-zinc-400" />
                                                                <span>Bank Transfer</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground font-mono">{w.bank_name || 'N/A'}</div>
                                                            <div className="text-[10px] text-zinc-400 font-mono tracking-wider">{w.bank_iban || w.iban || 'N/A'}</div>
                                                            <div className="text-[10px] text-zinc-500">Holder: {w.bank_account_name || 'N/A'}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-white">
                                                                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                                                                <span className="capitalize">{w.method}</span>
                                                            </div>
                                                            <div className="text-xs font-mono text-zinc-400">{w.phone_number || w.d17_phone || 'N/A'}</div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusColor}`}>
                                                        {w.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    {isPending ? (
                                                        <input 
                                                            type="text" 
                                                            value={notes[w.id] || ''}
                                                            onChange={(e) => handleNoteChange(w.id, e.target.value)}
                                                            placeholder="Add internal note or rejection reason..."
                                                            className="w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                                                        />
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground max-w-[180px] truncate" title={w.admin_notes}>
                                                            {w.admin_notes || '—'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    {isPending ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button 
                                                                variant="primary" 
                                                                size="sm"
                                                                className="bg-emerald-600 hover:bg-emerald-500 text-white min-h-[32px] px-3 font-bold text-xs"
                                                                disabled={processingId === w.id}
                                                                onClick={() => handleProcessWithdrawal(w.id, 'approve')}
                                                            >
                                                                {processingId === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Approve'}
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                className="border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 min-h-[32px] px-3 font-bold text-xs"
                                                                disabled={processingId === w.id}
                                                                onClick={() => handleProcessWithdrawal(w.id, 'reject')}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1">
                                                            {w.status === 'completed' ? (
                                                                <Check className="w-4 h-4 text-emerald-400" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-rose-500" />
                                                            )}
                                                            Done
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SECTION 2: STUCK PAYMENTS RECONCILIATION ── */}
            <div className={panelClass}>
                <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">
                                {tx('dashboard.admin.payments.title', undefined, 'Stuck payments (older than 1 hour)')}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Reconcile Flouci/Dhmad escrow deposits that did not trigger webhook callbacks
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetchStuck()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-4 text-sm font-semibold text-white transition-all hover:border-[#3a3a3a] hover:bg-[var(--color-bg-muted)]"
                    >
                        <RefreshCw className={`w-4 h-4 ${isStuckLoading ? 'animate-spin' : ''}`} />
                        {tx('dashboard.admin.payments.refresh', undefined, 'Refresh')}
                    </button>
                </div>

                <div className="p-5">
                    {isStuckLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
                            <p className="text-muted">{tx('dashboard.admin.payments.loading', undefined, 'Loading...')}</p>
                        </div>
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
                                            <span className="font-medium text-foreground">{transaction.amount} TND</span>
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
        </div>
    );
}
