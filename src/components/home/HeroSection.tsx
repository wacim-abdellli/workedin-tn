import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, Shield, CheckCircle, Users, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';

interface HeroSectionProps {
    stats: {
        freelancers: number;
    };
}

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
    }),
};

export default function HeroSection({ stats }: HeroSectionProps) {
    const { t, dir } = useTranslation();
    const { isAuthenticated, profile } = useAuth();
    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

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

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">
            {/* Animated Background — purple/gold gradient mesh */}
            <div className="absolute inset-0 bg-[#faf9ff] dark:bg-[#0f0e17] transition-colors duration-500">
                {/* Gradient Orbs */}
                <div className="absolute top-[10%] start-[15%] w-[500px] h-[500px] bg-primary-500/[0.08] dark:bg-primary-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[15%] end-[10%] w-[400px] h-[400px] bg-accent-400/[0.06] dark:bg-accent-500/15 rounded-full blur-[100px] animate-pulse animation-delay-200" />
                <div className="absolute top-[60%] start-[50%] w-[600px] h-[600px] bg-primary-400/[0.04] dark:bg-primary-600/10 rounded-full blur-[140px]" />

                {/* Dot grid */}
                <div className="absolute inset-0 pattern-dots opacity-[0.04] dark:opacity-[0.03]" />
            </div>

            <div className="container-custom relative z-10 py-24 lg:py-32">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Animated Badge */}
                    <motion.div
                        custom={0}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/60 dark:bg-white/[0.06] border border-primary-200/60 dark:border-primary-500/20 text-primary-700 dark:text-primary-300 text-sm font-semibold mb-10 backdrop-blur-md shadow-sm"
                    >
                        <Sparkles className="w-4 h-4 text-accent-500" />
                        <span>{t.hero.badge}</span>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                    </motion.div>

                    {/* Main Headline — Syne display font */}
                    <motion.h1
                        custom={1}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1a1825] dark:text-white mb-8 leading-[1.05]"
                    >
                        {t.hero.title.split(' ').map((word, i) => (
                            <span
                                key={i}
                                className={`inline-block mx-1.5 transition-all duration-300 ${i === 3
                                    ? 'bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent hover:scale-105 cursor-default'
                                    : 'hover:text-primary-600 dark:hover:text-primary-400'
                                    }`}
                            >
                                {word}
                            </span>
                        ))}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        custom={2}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="text-lg md:text-xl lg:text-2xl text-[#6b6880] dark:text-[#8b8aa0] mb-14 max-w-2xl mx-auto font-medium leading-relaxed"
                    >
                        {t.hero.subtitle}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        custom={3}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to={primaryCta.to}>
                            <motion.button
                                whileHover={{ y: -2, boxShadow: '0 12px 30px -5px rgba(124, 58, 237, 0.45)' }}
                                whileTap={{ scale: 0.97 }}
                                className="btn-primary btn-lg group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {primaryCta.label}
                                    <ArrowIcon className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                                </span>
                            </motion.button>
                        </Link>
                        <Link to={secondaryCta.to}>
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="btn btn-lg bg-white/70 dark:bg-white/[0.06] text-[#1a1825] dark:text-white border-2 border-primary-200 dark:border-primary-500/20 hover:border-primary-400 dark:hover:border-primary-400/40 hover:bg-primary-50 dark:hover:bg-primary-900/10 backdrop-blur-md transition-all"
                            >
                                <Briefcase className="w-5 h-5" />
                                <span>{secondaryCta.label}</span>
                            </motion.button>
                        </Link>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        custom={4}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-wrap items-center justify-center gap-8 lg:gap-12 mt-20"
                    >
                        {[
                            { icon: Shield, bg: 'bg-green-100 dark:bg-green-500/10', iconColor: 'text-green-600 dark:text-green-400', label: t.hero.trust.verified },
                            { icon: CheckCircle, bg: 'bg-primary-100 dark:bg-primary-500/10', iconColor: 'text-primary-600 dark:text-primary-400', label: t.hero.trust.secure },
                            { icon: Users, bg: 'bg-accent-100 dark:bg-accent-500/10', iconColor: 'text-accent-600 dark:text-accent-500', label: `+${stats.freelancers.toLocaleString()} ${t.hero.trust.users}` },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 group">
                                <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                                </div>
                                <span className="text-sm font-semibold text-[#3d3a4e] dark:text-[#c4b5fd]">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-6 h-10 rounded-full border-2 border-primary-300/40 dark:border-primary-500/30 flex items-start justify-center p-2"
                >
                    <div className="w-1.5 h-3 bg-primary-400 dark:bg-primary-500 rounded-full" />
                </motion.div>
            </div>
        </section>
    );
}
