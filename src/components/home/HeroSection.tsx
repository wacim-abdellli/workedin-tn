import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkspaceStore } from '@/lib/workspaceState';

interface HeroSectionProps {
  stats?: {
    freelancers?: number;
    jobs?: number;
    contracts?: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  const navigate = useNavigate();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const isFreelancer = activeWorkspace === 'freelancer';

  const heroContent = isFreelancer
    ? {
        eyebrow: 'Built in Tunisia. Built for Tunisia.',
        titleTop: 'Where Tunisian talent',
        titleAccent: 'gets paid fairly.',
        subtitle: 'No auctions. No middlemen. Post a project, agree on terms, get paid in TND - secured by escrow.',
        primaryCta: 'Start earning today',
        secondaryCta: 'Browse projects',
        secondaryPath: '/jobs',
        trustItems: [
          { icon: Shield, label: 'Protected payouts' },
          { icon: Zap, label: 'Matched work' },
          { icon: Star, label: 'Build reputation' },
        ],
        statsCards: [
          { value: `${stats?.freelancers || '2,500'}+`, label: 'Professionals' },
          { value: `${stats?.contracts || '120'}+`, label: 'Contracts done' },
          { value: '4.9/5', label: 'Avg. rating' },
        ],
        features: [
          {
            title: 'Apply to matched projects',
            sub: 'Jobs that fit your skill level and rate',
          },
          {
            title: 'Show verification status',
            sub: 'Build trust before you say a word',
          },
          {
            title: 'Track milestones and payouts',
            sub: 'Everything in one place, secured by escrow',
          },
        ],
        promise: 'Better presentation helps great freelancers look credible before they say a word.',
      }
    : {
        eyebrow: 'Built in Tunisia. Ready for serious hiring.',
        titleTop: 'Where Tunisian businesses',
        titleAccent: 'find trusted talent.',
        subtitle: 'Post a project, review serious proposals, agree on clear terms, and release payment only when the work is approved.',
        primaryCta: 'Post a project free',
        secondaryCta: 'Find freelancers',
        secondaryPath: '/find-freelancers',
        trustItems: [
          { icon: Shield, label: 'Verified profiles' },
          { icon: Zap, label: 'Faster hiring' },
          { icon: Star, label: 'Protected escrow' },
        ],
        statsCards: [
          { value: `${stats?.freelancers || '2,500'}+`, label: 'Professionals' },
          { value: `${stats?.jobs || '120'}+`, label: 'Open projects' },
          { value: '4.9/5', label: 'Avg. trust score' },
        ],
        features: [
          {
            title: 'Post once and get relevant proposals',
            sub: 'No noisy bidding wars, just quality responses',
          },
          {
            title: 'Review verified local profiles',
            sub: 'Trust signals appear before the first message',
          },
          {
            title: 'Manage milestones with escrow',
            sub: 'Payments stay protected until approval',
          },
        ],
        promise: 'Better presentation helps serious clients trust the platform before they post a project.',
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
            'radial-gradient(ellipse 60% 50% at 20% 30%, color-mix(in srgb, var(--workspace-primary) 18%, transparent) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, color-mix(in srgb, var(--brand-accent) 10%, transparent) 0%, transparent 70%)',
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

      <div className="relative z-10 container mx-auto px-6 lg:px-8 max-w-7xl pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div
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
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {heroContent.eyebrow}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold leading-[1.05] tracking-tight mb-6"
              style={{
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                color: 'var(--text-primary)',
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
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg leading-relaxed mb-10 max-w-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              {heroContent.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <button
                onClick={() => navigate(isFreelancer ? '/signup' : '/jobs/new')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'var(--workspace-primary)', fontSize: '1rem' }}
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
            </motion.div>

            <motion.div
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
            </motion.div>
          </div>

          <motion.div
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
                  Khedma Promise
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {heroContent.promise}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
