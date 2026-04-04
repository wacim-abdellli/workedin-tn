import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const toneClasses: Record<HighlightTone, string> = {
  primary: 'dark:border-primary-400/20 dark:bg-primary-500/10 dark:text-primary-100 text-primary-900',
  accent: 'dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100 text-amber-900',
  cyan: 'dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100 text-cyan-900',
};

export default function AuthShell({ badge, title, description, highlights, topAction, children }: AuthShellProps) {
  const { dir, tx } = useTranslation();

  return (
    <div
      dir={dir}
      className="relative min-h-screen overflow-hidden dark:bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),transparent_28%),linear-gradient(160deg,#090611_0%,#100b1a_42%,#0f1220_100%)] bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.06),transparent_28%),linear-gradient(160deg,#f8f8fc_0%,#ffffff_42%,#f3f4f6_100%)] text-gray-900 dark:text-white"
    >
      <div className="pointer-events-none absolute inset-0 dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 dark:opacity-30 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 dark:bg-gradient-to-b dark:from-white/6 from-black/5 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 pb-6 sm:pb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-full border border-gray-200 dark:border-white/10 dark:bg-white/5 bg-white/50 px-3 py-2 text-sm text-gray-700 dark:text-white/90 backdrop-blur-sm transition-colors hover:bg-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl dark:bg-white/10 bg-brand/10 shadow-[0_12px_40px_-20px_rgba(124,58,237,0.3)] dark:shadow-[0_12px_40px_-20px_rgba(124,58,237,0.85)]">
              <img src="/logos/logo-social.svg" alt="Khedma TN" className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-white/45">{badge}</span>
              <span className="block text-sm font-semibold">Khedma TN</span>
            </span>
          </Link>

          {topAction}
        </div>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,520px)] lg:gap-12">
          <section className="hidden lg:flex lg:flex-col lg:justify-center lg:gap-16 lg:self-stretch py-8">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/12 bg-white/60 dark:bg-white/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-gray-600 dark:text-white/70 backdrop-blur-sm shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
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
              {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription, tone = 'primary' }) => (
                <div
                  key={itemTitle}
                  className={`rounded-3xl border p-5 backdrop-blur-md dark:border-white/10 border-gray-200 bg-white/40 dark:bg-transparent shadow-sm dark:shadow-none ${toneClasses[tone]}`}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl dark:bg-white/10 bg-black/5">
                    <Icon className="h-5 w-5 dark:text-white text-gray-800" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">{itemTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-white/65">{itemDescription}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto flex w-full max-w-xl items-center justify-center lg:max-w-none">
            <div className="w-full rounded-[32px] border border-gray-200 dark:border-white/12 bg-white/80 dark:bg-gray-900/[0.4] p-2 shadow-2xl dark:shadow-[0_36px_120px_-54px_rgba(10,14,28,0.95)] backdrop-blur-2xl">
              <div className="rounded-[28px] border border-gray-100 dark:border-white/8 bg-white dark:bg-gray-900 p-6 shadow-md dark:shadow-[0_18px_48px_-28px_rgba(23,20,32,0.75)] sm:p-8">
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
