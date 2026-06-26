import { type ReactNode } from 'react';

export type RoleTheme = {
    accent: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
    accentFill: string;
    roleLabel: string;
    roleBadge: string;
    headerStripe: string;
    primaryBtn: string;
    focusRingColor: string;
    tabAccent: string;
    tabActiveBg: string;
};

export const ns = (s: string | null | undefined) => String(s || '').trim().toLowerCase();

export const fmtDate = (v: string | null | undefined, fallback?: string) => {
    const fb = fallback ?? 'No due date';
    if (!v) return fb;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? fb : d.toLocaleDateString();
};

export const fmtTime = (v: string | null | undefined) => {
    if (!v) return '';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const fmtSize = (size: number | string | null | undefined) => {
    const b = typeof size === 'string' ? Number(size) : (size ?? 0);
    if (!Number.isFinite(b) || b <= 0) return null;
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
};

export const fmtAmount = (amount: number | null | undefined) => {
    const n = Number(amount ?? 0);
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0)} TND`;
};

export const getLoomEmbedUrl = (url: string) => {
    const match = url.match(/(?:loom\.com\/share\/|loom\.com\/embed\/)([a-zA-Z0-9]+)/);
    return match ? `https://www.loom.com/embed/${match[1]}` : null;
};

export const roleTheme = (role: 'client' | 'freelancer', roleLabel?: string): RoleTheme => role === 'client'
    ? {
        accent: '#E8A020',
        accentBg: 'bg-[#E8A020]',
        accentText: 'text-[#E8A020]',
        accentBorder: 'border-[#E8A020]',
        accentFill: 'bg-[#3D2A00]/60',
        roleLabel: roleLabel || 'Client',
        roleBadge: 'border-[#E8A020]/20 bg-[#E8A020]/10 text-[#E8A020]',
        headerStripe: 'from-[#E8A020]/12 to-transparent',
        primaryBtn: 'bg-zinc-100 hover:bg-white text-[#0A0A0B]',
        focusRingColor: 'focus-visible:ring-[#E8A020]',
        tabAccent: 'bg-[#E8A020]',
        tabActiveBg: 'bg-[#E8A020]/15',
    }
    : {
        accent: '#9B8FF0',
        accentBg: 'bg-[#9B8FF0]',
        accentText: 'text-[#9B8FF0]',
        accentBorder: 'border-[#9B8FF0]',
        accentFill: 'bg-[#2D2660]/60',
        roleLabel: roleLabel || 'Freelancer',
        roleBadge: 'border-[#9B8FF0]/20 bg-[#9B8FF0]/10 text-[#9B8FF0]',
        headerStripe: 'from-[#9B8FF0]/10 to-transparent',
        primaryBtn: 'bg-zinc-100 hover:bg-white text-[#0A0A0B]',
        focusRingColor: 'focus-visible:ring-[#9B8FF0]',
        tabAccent: 'bg-[#9B8FF0]',
        tabActiveBg: 'bg-[#9B8FF0]/15',
    };

export const focusRing = 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-offset-[#09090b]';
export const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500';
export const monoClass = 'font-mono text-[11px] text-zinc-500';
export const _surface = 'border border-white/[0.06] bg-white/[0.018] rounded-[10px] relative overflow-hidden';
export const _surfaceHover = 'transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.025]';
export const _bodyClass = 'text-[13px] font-normal leading-[1.45] text-zinc-300';
