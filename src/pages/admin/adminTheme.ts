export const adminPanelClass = 'rounded-[1.75rem] border border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,248,252,0.92))] backdrop-blur-xl shadow-[0_24px_60px_-34px_rgba(15,23,42,0.2)] dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(14,19,32,0.98),rgba(9,13,24,0.98))] dark:shadow-[0_24px_70px_-34px_rgba(2,6,23,0.98),inset_0_1px_0_rgba(255,255,255,0.05)]';

export const adminToolbarClass = `${adminPanelClass} p-4 sm:p-5`;
export const adminTableShellClass = `${adminPanelClass} overflow-hidden p-0`;
export const adminTableHeadClass = 'sticky top-0 z-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] backdrop-blur dark:border-white/8 dark:bg-white/[0.055]';
export const adminTableRowClass = 'group border-b border-[var(--color-border-subtle)] transition-colors last:border-0 hover:bg-[var(--color-bg-subtle)] dark:border-white/7 dark:hover:bg-white/[0.035]';
export const adminInsetClass = 'rounded-[1.25rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] dark:border-white/8 dark:bg-white/[0.045]';

export const adminInputClass = 'w-full h-12 rounded-[1.15rem] border border-[var(--color-border-subtle)] bg-white/88 px-4 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-primary)]/12 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-[var(--color-text-tertiary)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[var(--color-brand-primary)] dark:focus:ring-[var(--color-brand-primary)]/14';
export const adminSelectClass = 'h-12 rounded-[1.15rem] border border-[var(--color-border-subtle)] bg-white/88 px-4 text-sm text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-primary)]/12 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[var(--color-brand-primary)] dark:focus:ring-[var(--color-brand-primary)]/14';

export const adminIconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-white/85 text-[var(--color-text-secondary)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-border-default)] hover:shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-[var(--color-text-tertiary)] dark:hover:border-white/14 dark:hover:bg-white/[0.09] dark:hover:text-white';

export const adminActionButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm font-semibold text-[var(--color-text-secondary)] transition-all hover:-translate-y-0.5 hover:bg-white/[0.08]';

export function adminPillClass(tone: 'neutral' | 'primary' | 'blue' | 'violet' | 'amber' | 'emerald' | 'red' | 'cyan' | 'indigo') {
  switch (tone) {
    case 'primary':
      return 'border border-[var(--color-brand-primary)]/20 bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary-hover)] dark:border-[var(--color-brand-primary)]/18 dark:bg-[var(--color-brand-primary)]/16 dark:text-[var(--color-brand-primary)]';
    case 'blue':
      return 'border border-[var(--blue-200)]/80 bg-[var(--blue-50)] text-[var(--blue-700)] dark:border-[var(--blue-400)]/18 dark:bg-[var(--blue-400)]/16 dark:text-[var(--blue-100)]';
    case 'violet':
      return 'border border-[var(--purple-200)]/80 bg-[var(--purple-50)] text-[var(--purple-700)] dark:border-[var(--purple-400)]/18 dark:bg-[var(--purple-400)]/16 dark:text-[var(--purple-100)]';
    case 'amber':
      return 'border border-[var(--amber-200)]/80 bg-[var(--amber-50)] text-[var(--amber-700)] dark:border-[var(--amber-400)]/18 dark:bg-[var(--amber-400)]/16 dark:text-[var(--amber-100)]';
    case 'emerald':
      return 'border border-[var(--green-200)]/80 bg-[var(--green-50)] text-[var(--green-700)] dark:border-[var(--green-400)]/18 dark:bg-[var(--green-400)]/16 dark:text-[var(--green-100)]';
    case 'red':
      return 'border border-[var(--red-200)]/80 bg-[var(--red-50)] text-[var(--red-700)] dark:border-[var(--red-400)]/18 dark:bg-[var(--red-400)]/16 dark:text-[var(--red-100)]';
    case 'cyan':
      return 'border border-[var(--blue-200)]/80 bg-[var(--blue-50)] text-[var(--blue-700)] dark:border-[var(--blue-400)]/18 dark:bg-[var(--blue-400)]/16 dark:text-[var(--blue-100)]';
    case 'indigo':
      return 'border border-[var(--indigo-200)]/80 bg-[var(--indigo-50)] text-[var(--indigo-700)] dark:border-[var(--indigo-400)]/18 dark:bg-[var(--indigo-400)]/16 dark:text-[var(--indigo-100)]';
    default:
      return 'border border-[var(--color-border-subtle)] bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] dark:border-white/10 dark:bg-white/[0.06] dark:text-[var(--color-text-secondary)]';
  }
}
