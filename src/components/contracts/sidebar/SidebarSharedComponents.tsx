import React from 'react';
import { 
    Clock, 
    FileText, 
    Image,
    Film,
    FileArchive,
    FileSpreadsheet,
    AlertCircle,
} from 'lucide-react';
import { resolveAccountAvatarUrl, getInitials } from '@/lib/avatar';

// --- Shared Classes & Formatting ---
export const labelClass = 'text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 select-none';
export const monoClass = 'font-mono text-[10px] uppercase tracking-wider text-zinc-500';
export const focusRing = 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50';

export const fmtDate = (iso: string | null | undefined, fallback: string = 'N/A') => {
    if (!iso) return fallback;
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return fallback;
    }
};

export const fmtTime = (iso: string | null | undefined) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
};

export const fmtAmount = (amount: number | null | undefined) => {
    if (amount == null) return '0.000 TND';
    return `${amount.toFixed(3)} TND`;
};

export const fmtSize = (bytes: number | null | undefined) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// --- Shared UI Components ---

export function PartyAvatar({ party, size = 'sm' }: { party: any; size?: 'sm' | 'md' | 'lg' }) {
    const s = size === 'sm' ? 'h-7 w-7' : size === 'md' ? 'h-10 w-10' : 'h-14 w-14';
    const fs = size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[11px]' : 'text-[14px]';
    
    if (!party) return <div className={`${s} rounded-full bg-zinc-800 animate-pulse`} />;
    
    const avatarUrl = resolveAccountAvatarUrl(party.avatar_url, false);
    
    return (
        <div className={`relative shrink-0 ${s} rounded-full border border-white/10 bg-zinc-900 overflow-hidden flex items-center justify-center`}>
            {avatarUrl ? (
                <img src={avatarUrl} alt={party.full_name} className="h-full w-full object-cover" />
            ) : (
                <span className={`${fs} font-bold text-zinc-500`}>{getInitials(party.full_name)}</span>
            )}
        </div>
    );
}

export function FileIcon({ name, mimeType }: { name?: string; mimeType?: string | null }) {
    const n = (name || '').toLowerCase();
    const m = (mimeType || '').toLowerCase();
    
    const c = "h-4 w-4 shrink-0 transition-colors";
    
    if (m.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(n)) return <Image className={`${c} text-sky-400`} />;
    if (m.includes('video') || /\.(mp4|mov|avi|wmv|webm)$/.test(n)) return <Film className={`${c} text-rose-400`} />;
    if (m.includes('spreadsheet') || n.endsWith('.csv') || n.endsWith('.xlsx') || n.endsWith('.xls')) return <FileSpreadsheet className={`${c} text-emerald-400`} />;
    if (m.includes('zip') || m.includes('rar') || m.includes('archive') || n.endsWith('.zip') || n.endsWith('.rar') || n.endsWith('.7z')) return <FileArchive className={`${c} text-amber-400`} />;
    
    return <FileText className={`${c} text-zinc-400`} />;
}

export function GhostButton({ onClick, label, icon, disabled, className = '' }: { onClick: () => void; label: string; icon?: React.ReactNode; disabled?: boolean; className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-1.5 rounded-full border border-zinc-750 bg-transparent px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${focusRing} ${className}`}
        >
            {icon}
            {label}
        </button>
    );
}

export function DangerButton({ onClick, label, icon, disabled }: { onClick: () => void; label: string; icon?: React.ReactNode; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-[11px] font-semibold text-rose-400 transition-all hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
        >
            {icon}
            {label}
        </button>
    );
}

// --- Logic Helpers ---

export function resolveStatus(st: string, tx: any) {
    switch (st) {
        case 'active':
            return { label: tx('contract.status.active'), tone: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5', icon: <CheckCircle className="h-2 w-2" /> };
        case 'delivery_submitted':
            return { label: tx('pages.clientJobs.status.reviewNeeded'), tone: 'border-amber-500/20 text-amber-400 bg-amber-500/5', icon: <Clock className="h-2 w-2" /> };
        case 'revision_requested':
            return { label: tx('contract.requestRevision'), tone: 'border-amber-500/20 text-amber-400 bg-amber-500/5', icon: <AlertCircle className="h-2 w-2" /> };
        case 'pending_payment':
            return { label: tx('contract.status.pending_payment'), tone: 'border-zinc-700 text-zinc-400 bg-zinc-900/40', icon: <Lock className="h-2 w-2" /> };
        case 'completed':
            return { label: tx('contract.status.completed'), tone: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5', icon: <CheckCircle className="h-2 w-2" /> };
        case 'disputed':
            return { label: tx('contract.status.disputed'), tone: 'border-rose-500/20 text-rose-400 bg-rose-500/5', icon: <AlertCircle className="h-2 w-2" /> };
        default:
            return { label: st.replace(/_/g, ' '), tone: 'border-zinc-700 text-zinc-500 bg-zinc-900/30', icon: <AlertCircle className="h-2 w-2" /> };
    }
}

export function roleTheme(role: 'client' | 'freelancer') {
    if (role === 'client') return {
        primary: 'text-amber-400',
        bg: 'bg-amber-500',
        ring: 'ring-amber-500/20',
        border: 'border-amber-500/20',
        glow: 'from-amber-500/10'
    };
    return {
        primary: 'text-violet-400',
        bg: 'bg-violet-500',
        ring: 'ring-violet-500/20',
        border: 'border-violet-500/20',
        glow: 'from-violet-500/10'
    };
}
