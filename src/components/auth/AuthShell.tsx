import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui';

import { useTranslation } from '@/i18n';

type HighlightTone = 'primary' | 'accent' | 'cyan';

interface AuthShellHighlight {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: HighlightTone;
}

interface AuthShellProps {
  badge: string;
  title: string;
  description: string;
  highlights: AuthShellHighlight[];
  topAction?: ReactNode;
  children: ReactNode;
}



export default function AuthShell({ badge, title, description, highlights, topAction, children }: AuthShellProps) {
  const { dir, tx } = useTranslation();

  return (
    <div
      dir={dir}
      className="relative min-h-screen overflow-hidden dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 via-gray-100 to-gray-50 text-gray-900 dark:text-white"
    >
      <div className="pointer-events-none absolute inset-0 dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 dark:opacity-30 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 dark:bg-gradient-to-b dark:from-white/6 from-black/5 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 pb-6 sm:pb-8">
          <Link
            to="/"
            className="inline-flex items-center transition-opacity hover:opacity-80"
          >
            <Logo variant="full" size="lg" />
          </Link>

          {topAction}
        </div>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,520px)] lg:gap-12">
          <section className="hidden lg:flex lg:flex-col lg:justify-center lg:gap-16 lg:self-stretch py-8">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/5 bg-white/60 dark:bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-gray-600 dark:text-gray-300 backdrop-blur-sm shadow-sm transition-all hover:border-[var(--freelancer-accent)]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--freelancer-accent, #7c3aed)' }} />
                {badge}
              </div>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-gray-900 dark:text-white xl:text-5xl">
                  {title}
                </h1>
                <p className="max-w-xl text-base leading-8 text-gray-600 dark:text-white/68 xl:text-lg">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                <div
                  key={itemTitle}
                  className="group rounded-3xl border p-5 backdrop-blur-md dark:border-white/5 border-gray-200 bg-white/40 dark:bg-zinc-900/50 shadow-sm transition-all hover:border-[var(--freelancer-accent)]"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl dark:bg-white/5 bg-gray-100 transition-colors group-hover:bg-[color-mix(in_srgb,var(--freelancer-accent)_15%,transparent)]">
                    <Icon className="h-5 w-5 dark:text-white text-gray-800 transition-colors" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">{itemTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-white/65">{itemDescription}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto flex w-full max-w-xl items-center justify-center lg:max-w-none">
            <div className="w-full rounded-[32px] border border-gray-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/40 p-2 shadow-2xl dark:shadow-none backdrop-blur-2xl">
              <div className="rounded-[28px] border border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 shadow-sm sm:p-8">
                {children}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-5 text-center text-xs text-white/45 sm:flex-row sm:text-start">
          <p>{tx('footer.description', undefined, 'Built for Tunisian professionals with trusted payments and verified identities.')}</p>
          <Link to="/" className="inline-flex items-center gap-2 font-medium text-white/70 transition-colors hover:text-white">
            {tx('common.backHome', undefined, 'Back to home')}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
