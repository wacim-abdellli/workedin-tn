import { CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export type PartnerRecord = {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
};

export type JobRecord = {
    id: string;
    title: string | null;
    job_type: string | null;
    budget_min: number | null;
    budget_max: number | null;
    hourly_rate: number | null;
};

export type ContractRowRaw = {
    id: string;
    job_id?: string | null;
    title?: string | null;
    status: string | null;
    amount: number | null;
    total_amount?: number | null;
    created_at: string;
    client_id: string;
    freelancer_id: string;
    client: PartnerRecord | PartnerRecord[] | null;
    freelancer: PartnerRecord | PartnerRecord[] | null;
    job: JobRecord | JobRecord[] | null;
};

export type ContractStatus = 'active' | 'completed' | 'cancelled';

export type ContractRow = {
    id: string;
    title: string | null;
    createdAt: string;
    status: ContractStatus;
    amount: number;
    totalAmount: number;
    client: PartnerRecord | null;
    freelancer: PartnerRecord | null;
    job: JobRecord | null;
};

export function getErrorText(error: unknown): string {
    if (!error || typeof error !== 'object') return '';

    const candidate = error as {
        message?: unknown;
        details?: unknown;
        hint?: unknown;
    };

    return [candidate.message, candidate.details, candidate.hint]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase();
}

export function canRetryWithLegacySelect(error: unknown): boolean {
    const text = getErrorText(error);
    if (!text) return false;
    return (
        text.includes('column')
        || text.includes('does not exist')
        || text.includes('schema cache')
    );
}

export function normalizeStatus(value: string | null): ContractStatus {
    const normalized = value?.toLowerCase() ?? '';

    if (normalized === 'completed') return 'completed';
    if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'disputed') return 'cancelled';
    return 'active';
}

export function formatCurrency(value: number): string {
    return value.toLocaleString('en-TN');
}

export function formatHiredDate(value: string, language: string): string {
    const date = new Date(value);
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-TN' : 'en-US';
    return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function getRateLabel(
    contract: ContractRow,
    tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string,
): { typeLabel: string; amountLabel: string } {
    const jobType = contract.job?.job_type ?? '';

    if (jobType === 'hourly') {
        const hourly = contract.job?.hourly_rate ?? contract.amount ?? contract.totalAmount;
        return {
            typeLabel: tx('contracts.rateType.hourly', undefined, 'Hourly'),
            amountLabel: tx('contracts.rateType.hourlyLabel', { amount: formatCurrency(hourly) }, `${formatCurrency(hourly)} TND/hr`),
        };
    }

    const fixedAmount = contract.totalAmount || contract.amount || contract.job?.budget_max || contract.job?.budget_min || 0;

    return {
        typeLabel: tx('contracts.rateType.fixed', undefined, 'Fixed-price'),
        amountLabel: tx('contracts.rateType.fixedLabel', { amount: formatCurrency(fixedAmount) }, `${formatCurrency(fixedAmount)} TND`),
    };
}

export function getStatusBadge(status: ContractStatus): {
    className: string;
    icon: ReactNode;
    labelKey: string;
    fallbackLabel: string;
} {
    if (status === 'completed') {
        return {
            className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            labelKey: 'contracts.status.completed',
            fallbackLabel: 'Completed',
        };
    }
    if (status === 'cancelled') {
        return {
            className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider',
            icon: <XCircle className="w-3.5 h-3.5" />,
            labelKey: 'contracts.status.cancelled',
            fallbackLabel: 'Cancelled',
        };
    }
    return {
        className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        labelKey: 'contracts.status.active',
        fallbackLabel: 'Active',
    };
}
