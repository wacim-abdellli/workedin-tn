import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, Shield, Star, TrendingUp, Users } from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
import { useMemo, useRef } from 'react';

import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import {
  getDashboardPath,
  getJobsPath,
  getOnboardingPath,
  isModeOnboarded,
} from '@/lib/accountMode';

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
    <div
      ref={ref}
      className="rounded-[24px] border border-primary-100/80 bg-white/88 p-4 shadow-[0_16px_40px_-28px_rgba(124,58,237,0.35)] dark:border-white/10 dark:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shadow-sm dark:bg-purple-900/30 dark:text-purple-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
          {label}
        </div>
      </div>
      <div className="mt-6 text-3xl font-bold tracking-[-0.03em] text-gray-900 dark:text-white">
        {formatCompact(count)}
      </div>
    </div>
  );
}

export default function HeroSection({ stats }: HeroSectionProps) {
  const { t, dir } = useTranslation();
  const { isAuthenticated, profile, freelancerProfile, activeMode } = useAuth();
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
      return isModeOnboarded({ ...profile, user_type: 'freelancer' }, freelancerProfile, 'freelancer')
        ? getDashboardPath('freelancer')
        : getOnboardingPath('freelancer');
    }
    return '/signup?type=freelancer';
  };

  const getClientLink = () => {
    if (isAuthenticated) {
      return isModeOnboarded({ ...profile, user_type: 'client' }, freelancerProfile, 'client')
        ? getDashboardPath('client')
        : getOnboardingPath('client');
    }
    return '/signup?type=client';
  };

  const primaryCta = isAuthenticated
    ? {
      to: isModeOnboarded(profile, freelancerProfile, activeMode)
        ? getDashboardPath(activeMode)
        : getOnboardingPath(activeMode),
      label: t.nav.dashboard,
    }
    : {
      to: getFreelancerLink(),
      label: t.hero.ctaFreelancer,
    };

  const secondaryCta = isAuthenticated
    ? {
      to: getJobsPath(activeMode),
      label: activeMode === 'client' ? t.hero.ctaClient : t.nav.findWork,
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
              className="inline-flex items-center gap-3 rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm backdrop-blur-md dark:border-purple-800/30 dark:bg-purple-950/50 dark:text-purple-300"
              style={{ transform: badgeGlow }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_16px_rgba(74,222,128,0.65)] animate-pulse" />
              <span>{t.hero.badge}</span>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
              <p className="hero-display-line hero-display-base">
                <span className="hero-display-chip">{t.hero.headlineStart}</span>
              </p>
              <h1 className="hero-display-line hero-display-emphasis mt-1">{t.hero.headlineHighlight}</h1>
            </motion.div>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300 lg:mx-0"
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
                <motion.span
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:bg-purple-500 hover:shadow-xl hover:shadow-purple-500/30"
                >
                  {primaryCta.label}
                  <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </motion.span>
              </Link>
              <Link to={secondaryCta.to}>
                <motion.span
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-transparent px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:border-white/20 dark:text-gray-200 dark:hover:bg-white/5"
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
                    className="-ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-400 text-[11px] font-bold text-white shadow-lg ring-2 ring-white first:ml-0 dark:ring-[#0f0e17]"
                    style={{ zIndex: socialProof.length - index }}
                  >
                    {initials}
                  </div>
                ))}
                <span className="ml-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t.hero.socialProof}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                <span>{t.hero.rating}</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="glass-card hero-surface-panel relative overflow-hidden p-5 sm:p-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_55%)]" />
            <div className="premium-panel relative rounded-[30px] border border-white/65 p-6 shadow-2xl dark:border-white/10 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#5f5975] dark:text-[#a7a2ba]">{t.hero.activity.eyebrow}</p>
                  <h2 className="mt-2 max-w-sm text-[1.9rem] font-bold tracking-[-0.03em] text-[#171420] dark:text-white">
                    {t.hero.activity.title}
                  </h2>
                </div>
                <div className="rounded-2xl border border-primary-200/60 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 shadow-sm dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                  {t.hero.activity.tag}
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <HeroStat icon={Users} value={stats.freelancers} label={t.hero.stats.professionals} />
                <HeroStat icon={Briefcase} value={stats.jobs ?? 142} label={t.hero.stats.projects} />
                <HeroStat icon={TrendingUp} value={Math.round((stats.earnings ?? 127850) / 100)} label={t.hero.stats.escrow} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Shield, title: t.hero.trust.verified, copy: t.hero.trust.verifiedBody },
                  { icon: Star, title: t.hero.trust.secure, copy: t.hero.trust.secureBody },
                ].map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-primary-100/80 bg-white/88 p-5 shadow-[0_18px_40px_-30px_rgba(124,58,237,0.35)] dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="text-base font-semibold leading-snug text-[#1a1825] dark:text-white">{item.title}</div>
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
