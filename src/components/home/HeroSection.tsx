import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Star } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { useTranslation } from '@/i18n';

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
  const isFreelancer = activeWorkspace === 'freelancer';
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

  return (
    <section
      className="relative flex items-center overflow-hidden"
      style={{ background: 'var(--page-bg)', minHeight: 'calc(100vh - 64px)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 30%, color-mix(in srgb, var(--workspace-primary) 18%, transparent) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, color-mix(in srgb, var(--workspace-accent) 10%, transparent) 0%, transparent 70%)',
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 container mx-auto px-6 lg:px-8 max-w-7xl pt-8 pb-12 lg:pt-16 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* ── Left: text + CTAs ── */}
          <div className="pt-4">
            <m.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.5)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-8"
              style={{
                background: 'color-mix(in srgb, var(--workspace-primary) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
                color: 'var(--workspace-primary-mid)',
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-status-success)' }} />
              {heroContent.eyebrow}
            </m.div>

            <m.h1
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.6, 0.08)}
              className="font-display font-bold leading-[1.05] tracking-tight mb-6"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
                color: 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              {heroContent.titleTop}
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-mid) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {heroContent.titleAccent}
              </span>
            </m.h1>

            <m.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.5, 0.16)}
              className="text-lg leading-relaxed mb-10 max-w-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              {heroContent.subtitle}
            </m.p>

            <m.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter(0.5, 0.24)}
              className="flex flex-wrap gap-4 mb-12"
            >
              <button
                onClick={() => navigate(isFreelancer ? '/signup' : '/jobs/new')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)',
                  fontSize: '1rem',
                  boxShadow: '0 8px 32px -8px color-mix(in srgb, var(--workspace-primary) 60%, transparent)',
                }}
              >
                {heroContent.primaryCta} <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(heroContent.secondaryPath)}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5 border"
                style={{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-strong)',
                  background: 'var(--card-bg)',
                  fontSize: '1rem',
                }}
              >
                {heroContent.secondaryCta}
              </button>
            </m.div>

            <m.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={enter(0.5, 0.36)}
              className="flex flex-wrap items-center gap-6"
            >
              {heroContent.trustItems.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: 'var(--workspace-primary-mid)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </m.div>
          </div>

          {/* ── Right: modern live panel ── */}
          <m.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={enter(0.7, 0.2)}
            className="hidden lg:flex flex-col gap-3"
          >
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {heroContent.statsCards.map((s, i) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center rounded-2xl py-5 px-3 text-center"
                  style={{
                    background: i === 0
                      ? `linear-gradient(145deg, color-mix(in srgb, var(--workspace-primary) 18%, var(--card-bg)), color-mix(in srgb, var(--workspace-primary) 6%, var(--card-bg)))`
                      : 'var(--card-bg)',
                    border: `1px solid ${i === 0
                      ? 'color-mix(in srgb, var(--workspace-primary) 32%, transparent)'
                      : 'color-mix(in srgb, var(--color-text-primary) 7%, transparent)'}`,
                    boxShadow: i === 0 ? '0 8px 28px -8px color-mix(in srgb, var(--workspace-primary) 30%, transparent)' : 'none',
                  }}
                >
                  <span className="font-black text-2xl tabular-nums" style={{ color: i === 0 ? 'var(--workspace-primary-mid)' : 'var(--text-primary)' }}>
                    {s.value}
                  </span>
                  <span className="text-[11px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Live feed card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid color-mix(in srgb, var(--color-text-primary) 7%, transparent)',
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: 'color-mix(in srgb, var(--color-text-primary) 6%, transparent)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-status-success)' }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    {isFreelancer ? 'How it works' : 'Why WorkedIn'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-status-success) 12%, transparent)', color: 'var(--color-status-success)' }}>
                  LIVE
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'color-mix(in srgb, var(--color-text-primary) 5%, transparent)' }}>
                {heroContent.features.map((item, i) => (
                  <div key={item.title} className="flex items-center gap-3 px-4 py-3.5">
                    <div
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
                      style={{
                        background: `linear-gradient(135deg, color-mix(in srgb, var(--workspace-primary) ${25 + i * 12}%, transparent), color-mix(in srgb, var(--workspace-accent) ${15 + i * 8}%, transparent))`,
                        border: '1.5px solid color-mix(in srgb, var(--workspace-primary) 22%, transparent)',
                        color: 'var(--workspace-primary-mid)',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.sub}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)' }}>
                      <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="var(--workspace-primary-mid)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row: promise + trust */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'color-mix(in srgb, var(--workspace-primary) 9%, var(--card-bg))',
                  border: '1px solid color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--workspace-primary-mid)' }}>
                  {tx('heroSection.promise.label')}
                </p>
                <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {heroContent.promise}
                </p>
              </div>
              <div
                className="rounded-2xl p-4 flex flex-col gap-2.5"
                style={{ background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--color-text-primary) 7%, transparent)' }}
              >
                {heroContent.trustItems.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--workspace-primary-mid)' }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroSection);
