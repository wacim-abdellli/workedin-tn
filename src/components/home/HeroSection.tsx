import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, Shield, Star, TrendingUp, Users } from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
import { useMemo, useRef } from 'react';

import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface HeroSectionProps {
  stats: {
    earnings?: number;
    jobs?: number;
    freelancers: number;
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.08, duration: 0.6, ease: 'easeOut' as const },
  }),
};

function formatCompact(value: number) {
  return `${Math.max(1, Math.round(value)).toLocaleString()}+`;
}

function HeroStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const count = useAnimatedCounter(isInView ? value : 0, 1500);

  return (
    <div ref={ref} className="flex min-w-[150px] items-center gap-3 px-5 py-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-primary-600 shadow-sm dark:bg-white/5 dark:text-primary-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xl font-bold text-[#1a1825] dark:text-white">{formatCompact(count)}</div>
        <div className="text-sm text-[#6b6880] dark:text-[#8b8aa0]">{label}</div>
      </div>
    </div>
  );
}

export default function HeroSection({ stats }: HeroSectionProps) {
  const { t, dir } = useTranslation();
  const { isAuthenticated, profile } = useAuth();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const sectionRef = useRef<HTMLElement | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 20, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 20, mass: 0.6 });
  const orbLeft = useTransform(smoothX, [-0.5, 0.5], [-24, 24]);
  const orbRight = useTransform(smoothX, [-0.5, 0.5], [18, -18]);
  const orbBottom = useTransform(smoothY, [-0.5, 0.5], [18, -18]);
  const badgeGlow = useMotionTemplate`translate3d(${useTransform(smoothX, [-0.5, 0.5], [-10, 10])}px, ${useTransform(smoothY, [-0.5, 0.5], [-8, 8])}px, 0)`;

  const socialProof = useMemo(
    () => ['AS', 'MH', 'SK', 'ON', 'ZT'],
    []
  );

  const getFreelancerLink = () => {
    if (isAuthenticated) {
      if (profile?.user_type === 'freelancer' || profile?.user_type === 'both') {
        return profile?.onboarding_completed ? '/freelancer/dashboard' : '/onboarding/freelancer';
      }
      return '/onboarding/freelancer';
    }
    return '/signup?type=freelancer';
  };

  const getClientLink = () => {
    if (isAuthenticated) {
      if (profile?.user_type === 'client' || profile?.user_type === 'both') {
        return profile?.onboarding_completed ? '/client/dashboard' : '/onboarding/client';
      }
      return '/onboarding/client';
    }
    return '/signup?type=client';
  };

  const primaryCta = isAuthenticated
    ? {
      to: profile?.user_type === 'client' ? '/client/dashboard' : '/freelancer/dashboard',
      label: t.nav.dashboard,
    }
    : {
      to: getFreelancerLink(),
      label: t.hero.ctaFreelancer,
    };

  const secondaryCta = isAuthenticated
    ? {
      to: profile?.user_type === 'client' ? '/jobs/new' : '/jobs',
      label: profile?.user_type === 'client' ? t.hero.ctaClient : t.nav.findWork,
    }
    : {
      to: getClientLink(),
      label: t.hero.ctaClient,
    };

  const handlePointerMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;

    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      ref={sectionRef}
      className="hero-gradient relative flex min-h-screen items-center overflow-hidden"
      onMouseMove={handlePointerMove}
    >
      <motion.div
        className="absolute left-[6%] top-[8%] h-72 w-72 rounded-full bg-primary-500/20 blur-3xl"
        style={{ x: orbLeft, y: useTransform(smoothY, [-0.5, 0.5], [-18, 18]) }}
      />
      <motion.div
        className="absolute right-[8%] top-[18%] h-52 w-52 rounded-full bg-amber-400/15 blur-3xl"
        style={{ x: orbRight, y: useTransform(smoothY, [-0.5, 0.5], [12, -12]) }}
      />
      <motion.div
        className="absolute bottom-[-4rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary-900/15 blur-3xl"
        style={{ y: orbBottom }}
      />
      <div className="absolute inset-0 pattern-grid opacity-[0.04] dark:opacity-[0.05]" />

      <div className="container-custom relative z-10 py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="text-center lg:text-left">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-primary-200"
              style={{ transform: badgeGlow }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.65)]" />
              <span>{t.hero.badge}</span>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
              <p className="hero-display-line hero-display-base">
                <span className="hero-display-chip">The Freelance Platform</span>
              </p>
              <h1 className="hero-display-line hero-display-emphasis mt-1">Built for Tunisia</h1>
            </motion.div>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#4e4a63] dark:text-[#aba9bc] lg:mx-0"
            >
              {t.hero.subtitle}
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start"
            >
              <Link to={primaryCta.to}>
                <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="btn-primary btn-lg group">
                  {primaryCta.label}
                  <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </motion.span>
              </Link>
              <Link to={secondaryCta.to}>
                <motion.span
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-primary-200/70 bg-white/75 px-8 py-4 text-base font-semibold text-[#1a1825] shadow-sm backdrop-blur-md transition-all hover:border-primary-400 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-primary-400/40"
                >
                  <Briefcase className="h-5 w-5" />
                  {secondaryCta.label}
                </motion.span>
              </Link>
            </motion.div>

            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-8 flex flex-col items-center gap-4 lg:items-start"
            >
              <div className="flex items-center">
                {socialProof.map((initials, index) => (
                  <div
                    key={initials}
                    className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-primary-500 to-accent-400 text-xs font-bold text-white shadow-lg first:ml-0 dark:border-[#0f0e17]"
                    style={{ zIndex: socialProof.length - index }}
                  >
                    {initials}
                  </div>
                ))}
                <span className="ml-4 text-sm font-medium text-[#4e4a63] dark:text-[#aba9bc]">
                  Join 2,500+ Tunisian professionals
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4e4a63] dark:text-[#aba9bc]">
                <span className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                <span>4.9/5 trusted by freelancers and clients</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="glass-card hero-surface-panel relative overflow-hidden p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_55%)]" />
            <div className="relative rounded-[24px] border border-white/65 bg-white/85 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#14111d]/94">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#5f5975] dark:text-[#a7a2ba]">Momentum this month</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#171420] dark:text-white">Designed to earn trust</h2>
                </div>
                <div className="rounded-2xl border border-primary-200/60 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                  Premium launch
                </div>
              </div>

              <div className="mt-6 divide-y divide-primary-100/80 overflow-hidden rounded-[24px] border border-primary-100/80 bg-white/82 shadow-inner dark:divide-white/5 dark:border-white/10 dark:bg-white/6">
                <div className="grid gap-2 sm:grid-cols-3 sm:divide-x sm:divide-primary-100/80 dark:sm:divide-white/5">
                  <HeroStat icon={Users} value={stats.freelancers} label="Professionals onboarded" />
                  <HeroStat icon={Briefcase} value={stats.jobs ?? 142} label="Projects posted" />
                  <HeroStat icon={TrendingUp} value={Math.round((stats.earnings ?? 127850) / 100)} label="TND handled" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Shield, title: t.hero.trust.verified, copy: 'Verified identities and safer payouts from day one.' },
                  { icon: Star, title: t.hero.trust.secure, copy: 'Premium experience, clear profiles, and serious client signals.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-primary-100/80 bg-white/88 p-5 dark:border-white/10 dark:bg-white/6">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="text-base font-semibold text-[#1a1825] dark:text-white">{item.title}</div>
                    <p className="mt-2 text-sm leading-relaxed text-[#6b6880] dark:text-[#8b8aa0]">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
