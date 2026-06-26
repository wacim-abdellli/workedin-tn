import { useTranslation } from '@/i18n';
import { type ReactNode } from 'react';
import { Image, FileArchive, FileCheck2, FileText, User } from 'lucide-react';
import { focusRing } from './contractUtils';

export function GhostButton({ onClick, disabled, icon, label }: { onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-transparent px-4 py-1.5 text-[12px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-35 ${focusRing}`}
        >
            {icon}{label}
        </button>
    );
}

export function DangerButton({ onClick, disabled, icon, label }: { onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 rounded-full border border-red-905/30 bg-red-950/20 px-4 py-1.5 text-[12px] font-medium text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-50 ${focusRing}`}
        >
            {icon}{label}
        </button>
    );
}

export function FileIcon({ name, mimeType }: { name?: string | null; mimeType?: string | null }) {
    const value = `${name || ''} ${mimeType || ''}`.toLowerCase().trim();
    const isImage = value.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(value);
    const isArchive = value.includes('zip') || value.includes('archive') || /\.(zip|rar|7z|tar|gz)$/i.test(value);
    const isPdf = value.includes('pdf') || /\.pdf$/i.test(value);

    const Icon = isImage ? Image : isArchive ? FileArchive : isPdf ? FileCheck2 : FileText;
    const bg = isImage ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : isArchive ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
        : isPdf ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-sky-500/10 text-sky-400 border-sky-500/20';

    return (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${bg}`}>
            <Icon className="h-4 w-4" />
        </div>
    );
}

export function CompactEmpty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-500">{icon}</div>
            <div>
                <p className="text-[13px] font-semibold text-zinc-300">{title}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{text}</p>
            </div>
        </div>
    );
}

export function PartyAvatar({ party, size = 'md' }: { party?: { full_name?: string; avatar_url?: string | null } | null; size?: 'sm' | 'md' | 'lg' }) {
    const { tx } = useTranslation();
    const dim = size === 'lg' ? 'h-9 w-9' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
    return (
        <div className={`relative flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.02] text-zinc-400`}>
            {party?.avatar_url ? (
                <img src={party.avatar_url} alt={party.full_name || tx('pages.messages.userFallback')} className="h-full w-full object-cover" />
            ) : (
                <User className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            )}
        </div>
    );
}
