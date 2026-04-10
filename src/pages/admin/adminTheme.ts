export const adminPanelClass = 'rounded-[1.75rem] border border-[#2a2a2a] bg-white dark:border-[#2a2a2a] dark:bg-[#0c0c0c] shadow-lg';

export const adminToolbarClass = `${adminPanelClass} p-4 sm:p-5`;
export const adminTableShellClass = `${adminPanelClass} overflow-hidden p-0`;
export const adminTableHeadClass = 'sticky top-0 z-10 border-b border-[#2a2a2a] bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#111] text-gray-400';
export const adminTableRowClass = 'group border-b border-[#2a2a2a] transition-colors last:border-0 hover:bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#0c0c0c] dark:hover:bg-[#161616]';
export const adminInsetClass = 'rounded-[1.25rem] border border-[#2a2a2a] bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#111]';

export const adminInputClass = 'w-full h-12 rounded-[1.15rem] border border-[#2a2a2a] bg-white px-4 text-gray-900 placeholder:text-gray-500 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-[#2a2a2a] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:hover:border-[#3a3a3a]';
export const adminSelectClass = 'h-12 rounded-[1.15rem] border border-[#2a2a2a] bg-white px-4 text-sm text-gray-900 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-[#2a2a2a] dark:bg-[#111] dark:text-white dark:focus:border-purple-500 dark:hover:border-[#3a3a3a]';

export const adminIconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#2a2a2a] bg-white text-gray-600 transition-all hover:-translate-y-0.5 hover:border-[#3a3a3a] hover:shadow-sm dark:border-[#2a2a2a] dark:bg-[#111] dark:text-gray-300 dark:hover:border-[#3a3a3a] dark:hover:bg-[#1a1a1a] dark:hover:text-white';

export const adminActionButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#2a2a2a] bg-white px-3.5 text-sm font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:border-[#3a3a3a] dark:border-[#2a2a2a] dark:bg-[#111] dark:text-gray-200 dark:hover:bg-[#1a1a1a] dark:hover:border-[#3a3a3a]';

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
