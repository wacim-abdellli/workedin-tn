import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, Shield, CheckCircle, Users, Briefcase } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface HeroSectionProps {
    stats: {
        freelancers: number;
    };
}

export default function HeroSection({ stats }: HeroSectionProps) {
    const { t, dir } = useTranslation();
    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-white dark:bg-dark-950 transition-colors duration-500">
                {/* Gradient Orbs - Adjusted for both modes */}
                <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-primary-500/10 dark:bg-primary-600/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-[100px] animate-pulse animation-delay-200" />
                <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-500/5 dark:bg-secondary-600/10 rounded-full blur-[120px]" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 pattern-grid opacity-[0.03] dark:opacity-[0.02]" />
            </div>

            <div className="container-custom relative z-10 py-20">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Animated Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 dark:bg-white/5 border border-primary-200 dark:border-primary-500/30 text-primary-700 dark:text-white text-sm font-medium mb-8 animate-fade-in backdrop-blur-sm shadow-sm dark:shadow-none">
                        <Sparkles className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                        <span>{t.hero.badge}</span>
                        <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
                    </div>

                    {/* Main Headline */}
                    <h1 className="heading-xl text-dark-900 dark:text-white mb-8 animate-slide-up flex flex-wrap justify-center gap-x-3 gap-y-1">
                        {t.hero.title.split(' ').map((word, i) => (
                            <span
                                key={i}
                                className={`inline-block transition-transform duration-300 ${i === 3
                                    ? 'text-gradient font-extrabold hover:scale-110 cursor-default'
                                    : 'hover:text-primary-600 dark:hover:text-primary-400'
                                    }`}
                            >
                                {word}
                            </span>
                        ))}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-dark-500 dark:text-dark-300 mb-12 max-w-3xl mx-auto animate-slide-up animation-delay-100">
                        {t.hero.subtitle}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '200ms' }}>
                        <Link to="/signup?type=freelancer">
                            <button className="btn-primary btn-lg group relative overflow-hidden">
                                <span className="relative z-10 flex items-center gap-2">
                                    {t.hero.ctaFreelancer}
                                    <ArrowIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        </Link>
                        <Link to="/signup?type=client">
                            <button className="btn btn-lg bg-white/50 dark:bg-white/10 text-dark-700 dark:text-white border-2 border-dark-200 dark:border-white/20 hover:bg-dark-50 dark:hover:bg-white/20 backdrop-blur-sm transition-all hover:scale-105">
                                <Briefcase className="w-5 h-5" />
                                <span>{t.hero.ctaClient}</span>
                            </button>
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-in animation-delay-300">
                        <div className="flex items-center gap-3 text-dark-600 dark:text-dark-300">
                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm font-medium">{t.hero.trust.verified}</span>
                        </div>
                        <div className="flex items-center gap-3 text-dark-600 dark:text-dark-300">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <span className="text-sm font-medium">{t.hero.trust.secure}</span>
                        </div>
                        <div className="flex items-center gap-3 text-dark-600 dark:text-dark-300">
                            <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                            </div>
                            <span className="text-sm font-medium">+{stats.freelancers.toLocaleString()} {t.hero.trust.users}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
                <div className="w-6 h-10 rounded-full border-2 border-dark-300 dark:border-white/20 flex items-start justify-center p-2">
                    <div className="w-1.5 h-3 bg-dark-400 dark:bg-white/50 rounded-full animate-pulse" />
                </div>
            </div>
        </section>
    );
}
