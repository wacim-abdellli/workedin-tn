import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, LayoutDashboard, Shield, Zap, Star } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import TypewriterText from '@/components/ui/TypewriterText';

interface HeroSectionProps {
  stats?: {
    freelancers?: number;
    jobs?: number;
    contracts?: number;
  };
}

const easeOut = [0.16, 1, 0.3, 1] as const;

function HeroSection({ stats }: HeroSectionProps) {
  const navigate = useNavigate();
  const { tx } = useTranslation();
  const reduceMotion = useReducedMotion();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const { user, profile } = useAuth();
  const isAuthenticated = Boolean(user);
  const isFreelancer = activeWorkspace === 'freelancer';
  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? null;
  // Dashboard path depends on workspace mode
  const dashboardPath = isFreelancer ? '/freelancer/dashboard' : '/client/dashboard';
  // Workspace action for authenticated users
  const workspaceActionPath = isFreelancer ? '/jobs' : '/find-freelancers';
  const workspaceActionLabel = isFreelancer
    ? tx('heroSection.freelancer.secondary')
    : tx('heroSection.client.secondary', undefined, 'Find Freelancers');
  const enter = (duration: number, delay = 0) =>
    reduceMotion ? { duration: 0, delay: 0 } : { duration, delay, ease: easeOut };

  const heroContent = isFreelancer
    ? {
        eyebrow: tx('heroSection.freelancer.eyebrow'),
        titleTop: tx('heroSection.freelancer.titleTop'),
        titleAccent: tx('heroSection.freelancer.titleAccent'),
        subtitle: tx('heroSection.freelancer.subtitle'),
        primaryCta: tx('heroSection.freelancer.cta'),
        secondaryCta: tx('heroSection.freelancer.secondary'),
        secondaryPath: '/jobs',
        trustItems: [
          { icon: Shield, label: tx('heroSection.freelancer.trust.payouts') },
          { icon: Zap, label: tx('heroSection.freelancer.trust.matched') },
          { icon: Star, label: tx('heroSection.freelancer.trust.reputation') },
        ],
        statsCards: [
          { value: `${stats?.freelancers || tx('heroSection.freelancer.stats.professionals.default')}+`, label: tx('heroSection.freelancer.stats.professionals.label') },
          { value: `${stats?.contracts || tx('heroSection.freelancer.stats.contracts.default')}+`, label: tx('heroSection.freelancer.stats.contracts.label') },
          { value: tx('heroSection.freelancer.stats.rating.value'), label: tx('heroSection.freelancer.stats.rating.label') },
        ],
        features: [
          {
            title: tx('heroSection.freelancer.features.apply.title'),
            sub: tx('heroSection.freelancer.features.apply.subtitle'),
          },
          {
            title: tx('heroSection.freelancer.features.verify.title'),
            sub: tx('heroSection.freelancer.features.verify.subtitle'),
          },
          {
            title: tx('heroSection.freelancer.features.track.title'),
            sub: tx('heroSection.freelancer.features.track.subtitle'),
          },
        ],
        promise: tx('heroSection.freelancer.promise'),
      }
    : {
        eyebrow: tx('heroSection.client.eyebrow', undefined, 'Drop the amateurs. Work with the elite.'),
        titleTop: tx('heroSection.client.titleTop', undefined, 'Drop the amateurs.'),
        titleAccent: tx('heroSection.client.titleAccent', undefined, 'Work with the elite.'),
        subtitle: tx('heroSection.client.subtitle', undefined, 'Post your project, skip the gambling, and hire exclusively verified talent.'),
        primaryCta: tx('heroSection.client.cta', undefined, 'Hire an Expert'),
        secondaryCta: tx('heroSection.client.secondary', undefined, 'See Top Talent'),
        secondaryPath: '/find-freelancers',
        trustItems: [
          { icon: Shield, label: tx('heroSection.client.trust.verified') },
          { icon: Zap, label: tx('heroSection.client.trust.faster') },
          { icon: Star, label: tx('heroSection.client.trust.escrow') },
        ],
        statsCards: [
          { value: `${stats?.freelancers || tx('heroSection.client.stats.professionals.default')}+`, label: tx('heroSection.client.stats.professionals.label') },
          { value: `${stats?.jobs || tx('heroSection.client.stats.projects.default')}+`, label: tx('heroSection.client.stats.projects.label') },
          { value: tx('heroSection.client.stats.trust.value'), label: tx('heroSection.client.stats.trust.label') },
        ],
        features: [
          {
            title: tx('heroSection.client.features.post.title'),
            sub: tx('heroSection.client.features.post.subtitle'),
          },
          {
            title: tx('heroSection.client.features.review.title'),
            sub: tx('heroSection.client.features.review.subtitle'),
          },
          {
            title: tx('heroSection.client.features.manage.title'),
            sub: tx('heroSection.client.features.manage.subtitle'),
          },
        ],
        promise: tx('heroSection.client.promise'),
      };

  const panelTitle = isFreelancer
    ? tx('heroSection.freelancer.panelTitle')
    : tx('heroSection.client.panelTitle');
  const liveBadge = tx('heroSection.liveBadge');

  return (
    <section
      className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden"
      style={{ background: 'var(--page-bg)' }}
    >
      {/* Ambient depth — single-hue wash so client/freelancer modes feel intentional, not noisy */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 0% -10%, color-mix(in srgb, var(--workspace-primary) 14%, transparent), transparent 55%),
            radial-gradient(ellipse 70% 50% at 100% 100%, color-mix(in srgb, var(--workspace-primary) 8%, transparent), transparent 50%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in srgb, var(--border) 50%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--border) 50%, transparent) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)] lg:gap-12 xl:gap-14">
          {/* Copy + CTAs */}
          <div className="max-w-xl lg:max-w-none">
            <m.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.45)}
              className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm backdrop-blur-md sm:px-4"
              style={{
                background: 'color-mix(in srgb, var(--workspace-primary) 7%, var(--card-bg))',
                borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)',
                color: 'var(--workspace-primary-mid)',
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full ring-2 ring-[color-mix(in_srgb,var(--color-status-success)_40%,transparent)]"
                style={{ background: 'var(--color-status-success)' }}
              />
              <span className="text-balance">{heroContent.eyebrow}</span>
            </m.div>

            {/* Trust highlights — same prominent placement for client & freelancer (under eyebrow) */}
            <m.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.4, 0.04)}
              className="mb-8 flex flex-wrap gap-x-6 gap-y-2.5 sm:gap-x-8"
            >
              {heroContent.trustItems.map(({ icon: Icon, label }, idx) => (
                <div key={`hero-trust-${idx}-${label}`} className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)',
                      color: 'var(--workspace-primary-mid)',
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </m.div>

            <m.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.55, 0.06)}
              className="font-display text-balance text-[clamp(2.25rem,5.5vw,3.75rem)] font-bold leading-[1.08] tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {heroContent.titleTop}{' '}
              <br />
              <TypewriterText
                words={isFreelancer
                  ? [
                      tx('heroSection.typewriter.freelancer.workWithBest'),
                      tx('heroSection.typewriter.freelancer.getPaidOnTime'),
                      tx('heroSection.typewriter.freelancer.buildYourCareer'),
                    ]
                  : [
                      tx('heroSection.typewriter.client.trustedConnections'),
                      tx('heroSection.typewriter.client.qualityCollaboration'),
                      tx('heroSection.typewriter.client.securePayments'),
                    ]}
                speed={65}
                deleteSpeed={35}
                pauseMs={2200}
                startIndex={1}
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(120deg, var(--workspace-primary) 0%, var(--workspace-primary-mid) 45%, color-mix(in srgb, var(--workspace-accent) 75%, var(--workspace-primary-mid)) 100%)',
                }}
                cursorClassName="text-[var(--workspace-primary)]"
              />
            </m.h1>

            <m.p
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.5, 0.12)}
              className="mt-6 max-w-lg text-pretty text-base leading-relaxed sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              {heroContent.subtitle}
            </m.p>

            <m.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.5, 0.18)}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              {isAuthenticated ? (
                /* ── Authenticated hero CTAs ──────────────────────────── */
                <>
                  <button
                    type="button"
                    onClick={() => navigate(dashboardPath)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-7 text-[0.9375rem] font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99] sm:min-w-[200px]"
                    style={{
                      background: 'linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)',
                      boxShadow: '0 12px 40px -12px color-mix(in srgb, var(--workspace-primary) 55%, transparent)',
                    }}
                  >
                    <LayoutDashboard className="h-4 w-4 opacity-90" strokeWidth={2} />
                    {tx('heroSection.auth.dashboard', undefined, 'Go to Dashboard')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(workspaceActionPath)}
                    className="inline-flex h-12 items-center justify-center gap-1 rounded-2xl border px-7 text-[0.9375rem] font-semibold transition hover:bg-[color-mix(in_srgb,var(--color-text-primary)_4%,transparent)] active:scale-[0.99]"
                    style={{
                      color: 'var(--text-primary)',
                      borderColor: 'color-mix(in srgb, var(--color-border-default) 90%, transparent)',
                      background: 'color-mix(in srgb, var(--card-bg) 88%, transparent)',
                    }}
                  >
                    {workspaceActionLabel}
                    <ArrowRight className="h-4 w-4 opacity-70" strokeWidth={2} />
                  </button>
                </>
              ) : (
                /* ── Guest / unauthenticated CTAs ───────────────────── */
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-7 text-[0.9375rem] font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99] sm:min-w-[200px]"
                    style={{
                      background: 'linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)',
                      boxShadow: '0 12px 40px -12px color-mix(in srgb, var(--workspace-primary) 55%, transparent)',
                    }}
                  >
                    {heroContent.primaryCta}
                    <ArrowRight className="h-4 w-4 opacity-90" strokeWidth={2.25} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(isFreelancer ? '/jobs' : '/find-freelancers')}
                    className="inline-flex h-12 items-center justify-center gap-1 rounded-2xl border px-7 text-[0.9375rem] font-semibold transition hover:bg-[color-mix(in_srgb,var(--color-text-primary)_4%,transparent)] active:scale-[0.99]"
                    style={{
                      color: 'var(--text-primary)',
                      borderColor: 'color-mix(in srgb, var(--color-border-default) 90%, transparent)',
                      background: 'color-mix(in srgb, var(--card-bg) 88%, transparent)',
                    }}
                  >
                    {heroContent.secondaryCta}
                    <ChevronRight className="h-4 w-4 opacity-70" strokeWidth={2} />
                  </button>
                </>
              )}
            </m.div>

            {/* Welcome greeting badge — only for authenticated users */}
            {isAuthenticated && firstName && (
              <m.p
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={enter(0.4, 0.28)}
                className="mt-5 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                {tx('heroSection.auth.welcomeBack', { name: firstName }, `Welcome back, ${firstName} 👋`)}
              </m.p>
            )}

            {/* Mobile / tablet: same stats as desktop panel */}
            <m.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.45, 0.32)}
              className="mt-12 grid grid-cols-3 gap-2 sm:gap-3 lg:hidden"
            >
              {heroContent.statsCards.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border px-2 py-4 text-center sm:px-3"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'color-mix(in srgb, var(--color-text-primary) 8%, transparent)',
                  }}
                >
                  <p className="text-lg font-bold tabular-nums sm:text-xl" style={{ color: 'var(--workspace-primary-mid)' }}>
                    {s.value}
                  </p>
                  <p className="mt-1 text-[10px] font-medium leading-tight sm:text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </m.div>
          </div>

          {/* Desktop: compact stats + steps (trust line lives under eyebrow — not duplicated here) */}
          <m.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={enter(0.55, 0.1)}
            className="hidden lg:block lg:max-w-md lg:justify-self-end xl:max-w-sm"
          >
            <div
              className="relative overflow-hidden rounded-2xl border p-3 shadow-lg"
              style={{
                borderColor: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)',
                background: `
                  linear-gradient(160deg,
                    color-mix(in srgb, var(--workspace-primary) 5%, var(--card-bg)) 0%,
                    var(--card-bg) 50%)
                `,
                boxShadow: '0 16px 48px -24px color-mix(in srgb, var(--workspace-primary) 28%, transparent), inset 0 1px 0 color-mix(in srgb, #fff 5%, transparent)',
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-80"
                style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}
              />

              <div className="relative flex flex-col gap-2.5">
                <div className="grid grid-cols-3 gap-2">
                  {heroContent.statsCards.map((s, i) => (
                    <div
                      key={s.label}
                      className="rounded-xl border px-1.5 py-3 text-center"
                      style={{
                        background:
                          i === 0
                            ? 'linear-gradient(180deg, color-mix(in srgb, var(--workspace-primary) 10%, var(--card-bg)), var(--card-bg))'
                            : 'color-mix(in srgb, var(--color-text-primary) 2.5%, var(--card-bg))',
                        borderColor:
                          i === 0
                            ? 'color-mix(in srgb, var(--workspace-primary) 22%, transparent)'
                            : 'color-mix(in srgb, var(--color-text-primary) 7%, transparent)',
                      }}
                    >
                      <p
                        className="text-lg font-bold tabular-nums leading-none tracking-tight xl:text-xl"
                        style={{ color: i === 0 ? 'var(--workspace-primary-mid)' : 'var(--text-primary)' }}
                      >
                        {s.value}
                      </p>
                      <p className="mt-1 px-0.5 text-[9px] font-medium leading-tight xl:text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  className="overflow-hidden rounded-xl border"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--color-text-primary) 7%, transparent)',
                    background: 'color-mix(in srgb, var(--color-text-primary) 2%, var(--card-bg))',
                  }}
                >
                  <div
                    className="flex items-center justify-between border-b px-3 py-2"
                    style={{ borderColor: 'color-mix(in srgb, var(--color-text-primary) 5%, transparent)' }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span
                          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-35"
                          style={{ background: 'var(--color-status-success)' }}
                        />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-status-success)' }} />
                      </span>
                      <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                        {panelTitle}
                      </span>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                      style={{
                        background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)',
                        color: 'var(--workspace-primary-mid)',
                      }}
                    >
                      {liveBadge}
                    </span>
                  </div>
                  <ul className="divide-y" style={{ borderColor: 'color-mix(in srgb, var(--color-text-primary) 4%, transparent)' }}>
                    {heroContent.features.map((item, i) => (
                      <li key={item.title} className="flex items-start gap-2.5 px-3 py-2.5">
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                          style={{
                            background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)',
                            color: 'var(--workspace-primary-mid)',
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {item.sub}
                          </p>
                        </div>
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-35" style={{ color: 'var(--workspace-primary-mid)' }} />
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="rounded-xl border px-3 py-2.5"
                  style={{
                    background: 'color-mix(in srgb, var(--workspace-primary) 6%, var(--card-bg))',
                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 14%, transparent)',
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--workspace-primary-mid)' }}>
                    {tx('heroSection.promise.label')}
                  </p>
                  <p className="mt-1 text-[11px] font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {heroContent.promise}
                  </p>
                </div>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroSection);
