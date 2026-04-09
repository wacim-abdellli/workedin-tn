import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Star } from 'lucide-react';
import { m } from 'framer-motion';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { useTranslation } from '@/i18n';

interface HeroSectionProps {
  stats?: {
    freelancers?: number;
    jobs?: number;
    contracts?: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  const navigate = useNavigate();
  const { tx } = useTranslation();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const isFreelancer = activeWorkspace === 'freelancer';

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
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'var(--page-bg)' }}
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

      <div className="relative z-10 container mx-auto px-6 lg:px-8 max-w-7xl pt-6 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold leading-[1.05] tracking-tight mb-6"
              style={{
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                color: 'var(--text-primary)',
                minHeight: 'clamp(6rem, 12vw, 10rem)',
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
                  fontStyle: 'normal',
                }}
              >
                {heroContent.titleAccent}
              </span>
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg leading-relaxed mb-10 max-w-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              {heroContent.subtitle}
            </m.p>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <button
                onClick={() => navigate(isFreelancer ? '/signup' : '/jobs/new')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)',
                  fontSize: '1rem',
                  boxShadow: 'var(--shadow-md)',
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.36 }}
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

          <m.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <div
              className="rounded-3xl border p-8"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div className="grid grid-cols-3 gap-4 mb-8">
                {heroContent.statsCards.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl p-4 text-center border"
                    style={{
                      background: 'var(--surface-bg)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <p
                      className="font-display font-bold text-xl mb-0.5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {s.value}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {heroContent.features.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'var(--workspace-primary)' }}
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-8 rounded-2xl p-4 border-l-4"
                style={{
                  background: 'color-mix(in srgb, var(--workspace-primary) 6%, transparent)',
                  borderLeftColor: 'var(--workspace-primary)',
                }}
              >
                 <p className="text-xs font-semibold uppercase tracking-wider mb-1"
                   style={{ color: 'var(--workspace-primary-mid)' }}>
                   {tx('heroSection.promise.label')}
                 </p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {heroContent.promise}
                </p>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
