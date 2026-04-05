export const adminPanelClass = 'rounded-[1.6rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.9))] backdrop-blur-xl shadow-[0_24px_60px_-30px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,20,34,0.96),rgba(8,12,23,0.94))] dark:shadow-[0_28px_70px_-34px_rgba(2,6,23,0.95),inset_0_1px_0_rgba(255,255,255,0.04)]';

export const adminToolbarClass = `${adminPanelClass} p-5 sm:p-6`;
export const adminTableShellClass = `${adminPanelClass} overflow-hidden p-0`;
export const adminTableHeadClass = 'sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/85 backdrop-blur dark:border-white/8 dark:bg-white/[0.04]';
export const adminTableRowClass = 'group border-b border-slate-200/70 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-white/6 dark:hover:bg-white/[0.03]';
export const adminInsetClass = 'rounded-[1.2rem] border border-slate-200/70 bg-slate-50/75 dark:border-white/8 dark:bg-white/[0.04]';

export const adminInputClass = 'w-full h-12 rounded-2xl border border-slate-200/80 bg-white/85 px-4 text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[color:var(--workspace-primary)] focus:outline-none focus:ring-4 focus:ring-[color:var(--workspace-primary)]/12 dark:border-white/10 dark:bg-[#12182a]/92 dark:text-white dark:placeholder:text-slate-500 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[color:var(--workspace-primary-mid)] dark:focus:ring-[color:var(--workspace-primary-mid)]/14';
export const adminSelectClass = 'h-12 rounded-2xl border border-slate-200/80 bg-white/85 px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[color:var(--workspace-primary)] focus:outline-none focus:ring-4 focus:ring-[color:var(--workspace-primary)]/12 dark:border-white/10 dark:bg-[#12182a]/92 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[color:var(--workspace-primary-mid)] dark:focus:ring-[color:var(--workspace-primary-mid)]/14';

export const adminIconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-500 transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white';

export function adminPillClass(tone: 'neutral' | 'primary' | 'blue' | 'violet' | 'amber' | 'emerald' | 'red' | 'cyan' | 'indigo') {
  switch (tone) {
    case 'primary':
      return 'border border-primary-200/80 bg-primary-50 text-primary-700 dark:border-primary-400/20 dark:bg-primary-500/12 dark:text-primary-200';
    case 'blue':
      return 'border border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/12 dark:text-sky-200';
    case 'violet':
      return 'border border-violet-200/80 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/12 dark:text-violet-200';
    case 'amber':
      return 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/12 dark:text-amber-200';
    case 'emerald':
      return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/12 dark:text-emerald-200';
    case 'red':
      return 'border border-red-200/80 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/12 dark:text-red-200';
    case 'cyan':
      return 'border border-cyan-200/80 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/12 dark:text-cyan-200';
    case 'indigo':
      return 'border border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/12 dark:text-indigo-200';
    default:
      return 'border border-slate-200/80 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300';
  }
}
