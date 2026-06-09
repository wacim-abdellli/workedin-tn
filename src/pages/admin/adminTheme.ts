export const adminPanelClass = 'rounded-[1.75rem] border border-gray-200/80 bg-white/70 p-6 dark:border-white/10 dark:bg-[#0e0c15]/75 backdrop-blur-xl shadow-xl transition-all duration-300';

export const adminToolbarClass = 'rounded-[1.75rem] border border-gray-200/80 bg-white/70 p-4 sm:p-5 dark:border-white/10 dark:bg-[#0e0c15]/75 backdrop-blur-xl shadow-xl transition-all duration-300';
export const adminTableShellClass = 'rounded-[1.75rem] border border-gray-200/80 bg-white/70 dark:border-white/10 dark:bg-[#0e0c15]/75 backdrop-blur-xl shadow-xl overflow-hidden p-0 transition-all duration-300';
export const adminTableHeadClass = 'sticky top-0 z-10 border-b border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-[#151322]/50 backdrop-blur text-gray-500 dark:text-gray-400 font-bold text-xs tracking-wider uppercase';
export const adminTableRowClass = 'group border-b border-gray-200/60 dark:border-white/5 transition-all duration-200 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] dark:bg-transparent';
export const adminInsetClass = 'rounded-[1.25rem] border border-gray-200/60 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] backdrop-blur';

export const adminInputClass = 'w-full h-12 rounded-[1.15rem] border border-gray-200 dark:border-white/10 bg-white/50 px-4 text-gray-900 placeholder:text-gray-400 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:hover:border-white/20';
export const adminSelectClass = 'h-12 rounded-[1.15rem] border border-gray-200 dark:border-white/10 bg-white/50 px-4 text-sm text-gray-900 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:bg-white/5 dark:text-white dark:focus:border-purple-500 dark:hover:border-white/20';

export const adminIconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white';

export const adminActionButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white px-3.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:border-gray-300 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-white/20';

export function adminPillClass(tone: 'neutral' | 'primary' | 'blue' | 'violet' | 'amber' | 'emerald' | 'red' | 'cyan' | 'indigo') {
  switch (tone) {
    case 'primary':
      return 'bg-purple-500/25 text-purple-200 dark:bg-purple-500/25 dark:text-purple-200';
    case 'blue':
      return 'bg-blue-500/25 text-blue-200 dark:bg-blue-500/25 dark:text-blue-200';
    case 'violet':
      return 'bg-violet-500/25 text-violet-200 dark:bg-violet-500/25 dark:text-violet-200';
    case 'amber':
      return 'bg-amber-500/25 text-amber-200 dark:bg-amber-500/25 dark:text-amber-200';
    case 'emerald':
      return 'bg-emerald-500/25 text-emerald-200 dark:bg-emerald-500/25 dark:text-emerald-200';
    case 'red':
      return 'bg-red-500/25 text-red-200 dark:bg-red-500/25 dark:text-red-200';
    case 'cyan':
      return 'bg-cyan-500/25 text-cyan-200 dark:bg-cyan-500/25 dark:text-cyan-200';
    case 'indigo':
      return 'bg-indigo-500/25 text-indigo-200 dark:bg-indigo-500/25 dark:text-indigo-200';
    default:
      return 'bg-gray-500/25 text-gray-200 dark:bg-gray-500/25 dark:text-gray-200';
  }
}
