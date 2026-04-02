import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle, Lock, Users } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

import { useTranslation } from '@/i18n';
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
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

function formatCompact(value: number) {
  return `${Math.max(1, Math.round(value)).toLocaleString()}+`;
}

export default function HeroSection({ stats }: HeroSectionProps) {
  const { t, dir } = useTranslation();
  const { isFreelancer } = useWorkspace();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const sectionRef = useRef<HTMLElement | null>(null);
  
  // Subtle pointer tracking for background
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

  // Trust indicators - different per user type
  const trustItems = isFreelancer
    ? [
        { icon: Briefcase, label: formatCompact(stats.jobs ?? 0) + ' Projects Available' },
        { icon: Users, label: formatCompact(stats.freelancers) + ' Verified Freelancers' },
        { icon: Lock, label: 'Secure Escrow Protection' },
      ]
    : [
        { icon: Users, label: formatCompact(stats.freelancers) + ' Verified Professionals' },
        { icon: CheckCircle, label: '100% Identity Verified' },
        { icon: Lock, label: 'Funds Protected by Escrow' },
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

      {/* Main content container */}
      <div className="relative z-10">
        {/* Layer 1: Trust Bar (10-15% - minimal but present) */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="border-b border-gray-200/30 bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
        >
          <div className="container-custom flex items-center justify-center gap-8 py-3 px-4 sm:gap-12 md:py-4">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Layer 2: Main Headline & Value Prop (Hero Hook - 30-35%) */}
        <div className="container-custom py-16 sm:py-20 md:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200/50 bg-primary-50/50 px-3 py-1.5 text-xs sm:text-sm font-medium text-primary-700 dark:border-primary-800/50 dark:bg-primary-950/40 dark:text-primary-300"
            >
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              {isFreelancer ? 'Trusted by thousands of freelancers' : 'Hire verified Tunisian talent'}
            </motion.div>

            {/* Main Headline - Optimized for conversion (3-7 words max) */}
            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-4 sm:mb-6"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.2]">
                {mainHeadline}
              </h1>
              <p className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold italic bg-gradient-to-r from-primary-500 via-primary-600 to-accent-400 bg-clip-text text-transparent">
                {highlightedText}
              </p>
            </motion.div>

            {/* Subtitle - Clear value proposition */}
            <motion.p
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mx-auto mb-8 max-w-2xl text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              {subtitle}
            </motion.p>

            {/* Layer 3: Action - Primary CTA + Secondary (15-20%) */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16"
            >
              <Link to={primaryCtaUrl}>
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 sm:px-8 py-3 sm:py-4 font-semibold text-white shadow-lg shadow-primary-500/20 transition-all duration-200 hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-500/30 active:scale-95 w-full sm:w-auto justify-center"
                >
                  {primaryCtaLabel}
                  <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-transparent px-6 sm:px-8 py-3 sm:py-4 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 dark:border-white/20 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:border-white/30 w-full sm:w-auto justify-center"
                onClick={() => document.querySelector('[data-scroll-target="features"]')?.scrollIntoView?.({ behavior: 'smooth' })}
              >
                Learn More
              </motion.button>
            </motion.div>

            {/* Layer 4: Social Proof (20-25%) */}
            <motion.div
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center gap-4"
            >
              {/* Avatars + Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['AS', 'MH', 'SK', 'ON', 'ZT'].map((initials) => (
                    <div
                      key={initials}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white ring-2 ring-white dark:ring-[#0f0e17]"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {formatCompact(2500)} professionals already using Khedma
                </span>
              </div>

              {/* Ratings */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  4.9/5 — Rated by {formatCompact(5000)} users
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
