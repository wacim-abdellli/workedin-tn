import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Palette,
    Code,
    Languages,
    Video,
    PenTool,
    Database,
    Megaphone,
    Camera,
    Smartphone,
    Tablet,
    Zap,
    Shield,
    Wallet,
    ArrowRight,
    ArrowLeft,
    Star,
    ChevronLeft,
    ChevronRight,
    Play,
    CheckCircle,
    Users,
    Briefcase,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return count;
}

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
    graphicDesign: <Palette className="w-7 h-7" />,
    webDev: <Code className="w-7 h-7" />,
    translation: <Languages className="w-7 h-7" />,
    videoEditing: <Video className="w-7 h-7" />,
    contentWriting: <PenTool className="w-7 h-7" />,
    dataEntry: <Database className="w-7 h-7" />,
    digitalMarketing: <Megaphone className="w-7 h-7" />,
    photography: <Camera className="w-7 h-7" />,
    uiux: <Smartphone className="w-7 h-7" />,
    mobileApp: <Tablet className="w-7 h-7" />,
};

function Home() {
    const { t, dir, language } = useTranslation();
    const testimonials = t.testimonials.items;
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [stats, setStats] = useState({
        earnings: 127850,
        jobs: 142,
        freelancers: 2500
    });

    const animatedEarnings = useAnimatedCounter(stats.earnings, 2500);

    useEffect(() => {
        const fetchStats = async () => {
            const { count: jobsCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true });

            const { count: freelancerCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('user_type', 'freelancer');

            const { data: contracts } = await supabase
                .from('contracts')
                .select('amount')
                .eq('status', 'completed');

            const totalEarnings = contracts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

            if (jobsCount && jobsCount > 0) {
                setStats({
                    jobs: jobsCount,
                    freelancers: freelancerCount || 2500,
                    earnings: totalEarnings > 1000 ? totalEarnings : 127850
                });
            }
        };

        fetchStats();
    }, []);

    const categories = [
        { key: 'graphicDesign', jobs: 45 },
        { key: 'webDev', jobs: 38 },
        { key: 'translation', jobs: 52 },
        { key: 'videoEditing', jobs: 28 },
        { key: 'contentWriting', jobs: 63 },
        { key: 'dataEntry', jobs: 71 },
    ];

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

    const nextTestimonial = () => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    return (
        <div className="min-h-screen">
            <Header />

            {/* Hero Section - Adaptive Light/Dark */}
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
                        <h1 className="heading-xl text-dark-900 dark:text-white mb-8 animate-slide-up">
                            {t.hero.title.split(' ').map((word, i) => (
                                <span key={i} className={i === 3 ? 'text-gradient inline-block hover:scale-105 transition-transform cursor-default' : 'inline-block'}>
                                    {word}{' '}
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

            {/* Value Propositions */}
            <section className="section relative overflow-hidden">
                <div className="absolute inset-0 gradient-mesh" />
                <div className="container-custom relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* No Bidding */}
                        <div className="card-hover text-center group p-8 animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '100ms' }}>
                            <div className="relative">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-600/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary-600/40 transition-all duration-300">
                                    <Zap className="w-10 h-10" />
                                </div>
                                <div className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-gradient-to-r from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                    ✓
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                {t.values.noBidding.title}
                            </h3>
                            <p className="text-muted leading-relaxed">
                                {t.values.noBidding.description}
                            </p>
                        </div>

                        {/* Local Payment */}
                        <div className="card-hover text-center group p-8 animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '200ms' }}>
                            <div className="relative">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center text-white shadow-lg shadow-success-500/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-success-500/40 transition-all duration-300">
                                    <Wallet className="w-10 h-10" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                {t.values.localPayment.title}
                            </h3>
                            <p className="text-muted leading-relaxed">
                                {t.values.localPayment.description}
                            </p>
                        </div>

                        {/* Micro Jobs */}
                        <div className="card-hover text-center group p-8 animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '300ms' }}>
                            <div className="relative">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white shadow-lg shadow-accent-500/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-accent-500/40 transition-all duration-300">
                                    <TrendingUp className="w-10 h-10" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                {t.values.microJobs.title}
                            </h3>
                            <p className="text-muted leading-relaxed">
                                {t.values.microJobs.description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="section bg-dark-50 dark:bg-dark-900">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="badge-primary mb-4">{t.home.sections.howItWorks.badge}</span>
                        <h2 className="heading-lg mb-4">
                            {t.howItWorks.title}
                        </h2>
                        <p className="text-muted max-w-2xl mx-auto">
                            {t.home.sections.howItWorks.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* For Freelancers */}
                        <div className="card p-8 relative overflow-hidden group">
                            <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-full" />
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/25">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{t.howItWorks.tabs.freelancer}</h3>
                                    <p className="text-sm text-muted">{t.home.sections.howItWorks.freelancerDesc}</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {t.howItWorks.freelancerSteps.slice(0, 3).map((step, index) => (
                                    <div key={index} className="flex items-center gap-4 group/item">
                                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold flex-shrink-0 group-hover/item:bg-primary-600 group-hover/item:text-white transition-colors">
                                            {index + 1}
                                        </div>
                                        <span className="text-lg font-medium">{step.title}</span>
                                    </div>
                                ))}
                            </div>

                            <Link to="/signup?type=freelancer" className="mt-8 block">
                                <Button variant="primary" className="w-full" rightIcon={<ArrowIcon className="w-5 h-5" />}>
                                    {t.howItWorks.cta.freelancer}
                                </Button>
                            </Link>
                        </div>

                        {/* For Clients */}
                        <div className="card p-8 relative overflow-hidden group">
                            <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-br from-accent-500/10 to-transparent rounded-bl-full" />
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/25">
                                    <Briefcase className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{t.howItWorks.tabs.client}</h3>
                                    <p className="text-sm text-muted">{t.home.sections.howItWorks.clientDesc}</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {t.howItWorks.clientSteps.slice(0, 3).map((step, index) => (
                                    <div key={index} className="flex items-center gap-4 group/item">
                                        <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 flex items-center justify-center font-bold flex-shrink-0 group-hover/item:bg-accent-600 group-hover/item:text-white transition-colors">
                                            {index + 1}
                                        </div>
                                        <span className="text-lg font-medium">{step.title}</span>
                                    </div>
                                ))}
                            </div>

                            <Link to="/signup?type=client" className="mt-8 block">
                                <button className="btn-accent w-full btn-lg">
                                    <span>{t.howItWorks.cta.client}</span>
                                    <ArrowIcon className="w-5 h-5" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="section">
                <div className="container-custom">
                    <div className="text-center mb-12">
                        <span className="badge-accent mb-4">{t.home.sections.categories.badge}</span>
                        <h2 className="heading-lg mb-4">
                            {t.categories.title}
                        </h2>
                        <p className="text-muted max-w-2xl mx-auto">
                            {t.home.sections.categories.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((category, index) => (
                            <Link
                                key={category.key}
                                to={`/jobs?category=${category.key}`}
                                className="card-hover p-6 text-center group"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-dark-100 to-dark-200 dark:from-dark-700 dark:to-dark-800 flex items-center justify-center text-dark-500 dark:text-dark-400 group-hover:from-primary-500 group-hover:to-primary-700 group-hover:text-white transition-all duration-300 shadow-lg group-hover:shadow-primary-500/30">
                                    {categoryIcons[category.key]}
                                </div>
                                <h3 className="font-semibold text-sm mb-1">
                                    {t.categories[category.key as keyof typeof t.categories]}
                                </h3>
                                <p className="text-xs text-muted">
                                    {category.jobs} {t.categories.availableJobs}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Counter - Premium */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900" />
                <div className="absolute inset-0">
                    <div className="absolute top-0 start-1/4 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px]" />
                    <div className="absolute bottom-0 end-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-[80px]" />
                </div>

                <div className="container-custom relative text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-sm font-medium mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        {t.home.stats.live}
                    </div>

                    <div className="text-6xl md:text-8xl font-bold text-white mb-4 font-cairo">
                        <span className="text-gradient">
                            {language === 'ar'
                                ? animatedEarnings.toLocaleString('ar-TN')
                                : animatedEarnings.toLocaleString()}
                        </span>
                    </div>
                    <p className="text-xl md:text-2xl text-dark-300">
                        {t.counter.title}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-8 mt-12 max-w-2xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">+{stats.jobs}</div>
                            <div className="text-sm text-dark-400">{t.home.stats.activeJobs}</div>
                        </div>
                        <div className="text-center border-x border-white/10">
                            <div className="text-3xl font-bold text-white mb-1">+{stats.freelancers.toLocaleString()}</div>
                            <div className="text-sm text-dark-400">{t.home.stats.users}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">4.9</div>
                            <div className="text-sm text-dark-400 flex items-center justify-center gap-1">
                                <Star className="w-3 h-3 text-warning-400 fill-current" />
                                {t.home.stats.rating}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="section">
                <div className="container-custom">
                    <div className="text-center mb-12">
                        <span className="badge-success mb-4">{t.home.sections.testimonials.badge}</span>
                        <h2 className="heading-lg">
                            {t.testimonials.title}
                        </h2>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="card p-8 md:p-12 relative overflow-hidden">
                            {/* Decorative */}
                            <div className="absolute top-0 start-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-br-full" />

                            {/* Navigation */}
                            <button
                                onClick={prevTestimonial}
                                className="absolute start-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 flex items-center justify-center transition-all shadow-lg"
                            >
                                <PrevIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextTestimonial}
                                className="absolute end-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 flex items-center justify-center transition-all shadow-lg"
                            >
                                <NextIcon className="w-6 h-6" />
                            </button>

                            <div className="text-center px-12">
                                <img
                                    src={testimonials[currentTestimonial].image}
                                    alt={testimonials[currentTestimonial].name}
                                    className="w-24 h-24 rounded-2xl mx-auto mb-6 ring-4 ring-primary-100 dark:ring-primary-900/50 shadow-xl object-cover"
                                />

                                <div className="flex items-center justify-center gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-6 h-6 text-warning-400 fill-current" />
                                    ))}
                                </div>

                                <blockquote className="text-xl md:text-2xl mb-8 leading-relaxed">
                                    "{testimonials[currentTestimonial].quote}"
                                </blockquote>

                                <div className="font-bold text-lg mb-1">
                                    {testimonials[currentTestimonial].name}
                                </div>
                                <div className="text-muted mb-3">
                                    {testimonials[currentTestimonial].role}
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 font-semibold">
                                    <TrendingUp className="w-4 h-4" />
                                    {t.home.sections.testimonials.earned} {testimonials[currentTestimonial].earned} {t.common.tnd}
                                </div>
                            </div>

                            {/* Dots */}
                            <div className="flex items-center justify-center gap-2 mt-10">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentTestimonial(index)}
                                        className={`h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                                            ? 'w-8 bg-gradient-to-r from-primary-500 to-primary-700'
                                            : 'w-2 bg-dark-200 dark:bg-dark-700 hover:bg-dark-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 gradient-mesh" />
                <div className="container-custom relative">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold mb-6">
                            <Sparkles className="w-4 h-4" />
                            {t.home.sections.cta.badge}
                        </div>

                        <h2 className="heading-lg mb-6">
                            {t.home.sections.cta.title}
                        </h2>
                        <p className="text-xl text-muted mb-10 max-w-2xl mx-auto">
                            {t.home.sections.cta.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/signup?type=freelancer">
                                <button className="btn-primary btn-lg">
                                    <span>{t.home.sections.cta.btnStart}</span>
                                    <ArrowIcon className="w-5 h-5" />
                                </button>
                            </Link>
                            <Link to="/how-it-works">
                                <Button variant="outline" size="lg" leftIcon={<Play className="w-5 h-5" />}>
                                    {t.home.sections.cta.btnWatch}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default Home;
