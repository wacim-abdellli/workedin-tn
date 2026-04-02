import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle2, Lock, Users, ShieldCheck } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';

import { useTranslation } from '@/i18n';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface HeroSectionProps {
  stats: {
    earnings?: number;
    jobs?: number;
    freelancers: number;
    contracts?: number;
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.12, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: index * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

function formatCompact(value: number) {
  return `${Math.max(1, Math.round(value)).toLocaleString()}+`;
}

/**
 * Trust Indicator Card Component
 * Displays individual trust metric with icon, number, and description
 */
function TrustCard({
  icon: Icon,
  value,
  label,
  description,
  index,
  color = 'primary',
}: {
  icon: typeof Users;
  value: string | number;
  label: string;
  description: string;
  index: number;
  color?: 'primary' | 'green' | 'blue';
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  // Animated counter for numbers
  const isNumber = typeof value === 'number';
  const animatedValue = useAnimatedCounter(isInView && isNumber ? value : 0, 2000);

  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-600/10 dark:from-primary-500/10 dark:to-primary-600/5 border-primary-200/30 dark:border-primary-700/20',
    green: 'from-green-500/20 to-green-600/10 dark:from-green-500/10 dark:to-green-600/5 border-green-200/30 dark:border-green-700/20',
    blue: 'from-blue-500/20 to-blue-600/10 dark:from-blue-500/10 dark:to-blue-600/5 border-blue-200/30 dark:border-blue-700/20',
  };

  const iconColorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  };

  return (
    <motion.div
      ref={ref}
      custom={index}
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 backdrop-blur-sm ${colorClasses[color]} dark:shadow-lg`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 dark:to-transparent" />
      
      {/* Hover effect border */}
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />

      <div className="relative z-10">
        {/* Icon Container */}
        <div
          className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${iconColorClasses[color]} transition-all duration-300 group-hover:scale-110`}
        >
          <Icon className="h-7 w-7 transition-transform group-hover:rotate-12" />
        </div>

        {/* Value - Large and prominent */}
        <div className="mb-1 text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          {isNumber ? formatCompact(Math.round(animatedValue)) : value}
        </div>

        {/* Label - Main trust message */}
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {label}
        </h3>

        {/* Description - Supporting text */}
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {description}
        </p>

        {/* Checkmark accent */}
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Verified & Secure</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroSection({ stats }: HeroSectionProps) {
  const { t, dir } = useTranslation();
  const { isFreelancer } = useWorkspace();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const sectionRef = useRef<HTMLElement | null>(null);

  // Subtle pointer tracking
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 20, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 20, mass: 0.6 });
  const orbLeft = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const orbRight = useTransform(smoothX, [-0.5, 0.5], [15, -15]);

  const handlePointerMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  // Determine content based on user type
  const mainHeadline = isFreelancer
    ? t.hero.headlineStart
    : t.forClients.hero.title.replace(', delivered.', '');
  const highlightedText = isFreelancer
    ? t.hero.headlineHighlight
    : t.forClients.hero.titleHighlight;
  const subtitle = isFreelancer
    ? t.hero.subtitle
    : t.forClients.hero.subtitle;

  const primaryCtaLabel = isFreelancer ? t.hero.ctaFreelancer : t.forClients.hero.cta;
  const primaryCtaUrl = isFreelancer ? '/jobs' : '/jobs/new';

  // Trust cards with prominent design
  const trustCards = isFreelancer
    ? [
        {
          icon: Briefcase,
          value: formatCompact(stats.jobs ?? 0),
          label: 'Open Opportunities',
          description: 'Active projects waiting for your expertise and skills',
          color: 'primary' as const,
        },
        {
          icon: Users,
          value: stats.freelancers,
          label: 'Verified Freelancers',
          description: 'Professional community of trusted talent',
          color: 'blue' as const,
        },
        {
          icon: Lock,
          value: 'Yes',
          label: '100% Escrow Protection',
          description: 'Funds held securely until work approval',
          color: 'green' as const,
        },
      ]
    : [
        {
          icon: Users,
          value: stats.freelancers,
          label: 'Verified Professionals',
          description: '100% identity-verified talent pool at your fingertips',
          color: 'primary' as const,
        },
        {
          icon: ShieldCheck,
          value: 'Yes',
          label: 'Identity Verified',
          description: 'Every freelancer undergoes strict verification process',
          color: 'green' as const,
        },
        {
          icon: Lock,
          value: 'Yes',
          label: 'Funds Protected by Escrow',
          description: 'Your money is secure until you approve the work',
          color: 'blue' as const,
        },
      ];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white dark:bg-[#0f0e17]"
      onMouseMove={handlePointerMove}
    >
      {/* Animated background gradients */}
      <motion.div
        className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary-100 opacity-30 blur-3xl dark:bg-primary-900 dark:opacity-10"
        style={{ x: orbLeft, y: useTransform(smoothY, [-0.5, 0.5], [-15, 15]) }}
      />
      <motion.div
        className="pointer-events-none absolute right-1/4 top-40 h-64 w-64 rounded-full bg-amber-100 opacity-20 blur-3xl dark:bg-amber-900 dark:opacity-5"
        style={{ x: orbRight, y: useTransform(smoothY, [-0.5, 0.5], [10, -10]) }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.1),transparent_50%)]" />

      {/* PREMIUM TRUST SECTION - Top Priority */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative z-10 border-b border-gray-200/50 dark:border-white/10 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-white/5 dark:to-transparent py-12 md:py-16"
      >
        <div className="container-custom">
          {/* Section header */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-10 text-center md:text-left"
          >
            <h2 className="text-sm md:text-base font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2">
              Why Choose Khedma
            </h2>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Trusted by Industry Leaders
            </p>
          </motion.div>

          {/* Trust cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {trustCards.map((card, index) => (
              <TrustCard key={card.label} {...card} index={index} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* MAIN HERO CONTENT */}
      <div className="relative z-10">
        <div className="container-custom py-16 sm:py-20 md:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-200/50 bg-primary-50/50 px-4 py-2 text-sm font-medium text-primary-700 dark:border-primary-800/50 dark:bg-primary-950/40 dark:text-primary-300"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
              {isFreelancer ? t.hero.badge : t.forClients.hero.badge}
            </motion.div>

            {/* Main Headline */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-6 sm:mb-8"
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.15]">
                {mainHeadline}
              </h1>
              <p className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold italic bg-gradient-to-r from-primary-500 via-primary-600 to-accent-400 bg-clip-text text-transparent">
                {highlightedText}
              </p>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mx-auto mb-10 sm:mb-12 max-w-2xl text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              {subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16"
            >
              <Link to={primaryCtaUrl}>
                <motion.button
                  whileHover={{ y: -3, boxShadow: '0 25px 50px rgba(139, 92, 246, 0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 sm:px-10 py-4 sm:py-5 font-bold text-lg text-white shadow-xl shadow-primary-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/40 active:scale-95 w-full sm:w-auto justify-center"
                >
                  {primaryCtaLabel}
                  <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-2 rtl:group-hover:-translate-x-2" />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.querySelector('[data-scroll-target="features"]')?.scrollIntoView?.({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white/50 backdrop-blur-sm px-8 sm:px-10 py-4 sm:py-5 font-bold text-lg text-gray-800 transition-all duration-300 hover:bg-white hover:border-gray-400 hover:shadow-lg dark:border-white/20 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 dark:hover:border-white/40 w-full sm:w-auto justify-center"
              >
                Learn How It Works
              </motion.button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Avatars + count */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex -space-x-3">
                  {['AS', 'MH', 'SK', 'ON', 'ZT'].map((initials) => (
                    <motion.div
                      key={initials}
                      whileHover={{ scale: 1.2, zIndex: 50 }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white ring-3 ring-white dark:ring-[#0f0e17] cursor-pointer transition-all"
                    >
                      {initials}
                    </motion.div>
                  ))}
                </div>
                <span className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {formatCompact(2500)} professionals trust Khedma
                </span>
              </div>

              {/* Ratings */}
              <div className="flex items-center justify-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-2xl"
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>
                <span className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                  4.9/5 rating from {formatCompact(5000)} verified reviews
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
