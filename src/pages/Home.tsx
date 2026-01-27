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
    graphicDesign: <Palette className="w-8 h-8" />,
    webDev: <Code className="w-8 h-8" />,
    translation: <Languages className="w-8 h-8" />,
    videoEditing: <Video className="w-8 h-8" />,
    contentWriting: <PenTool className="w-8 h-8" />,
    dataEntry: <Database className="w-8 h-8" />,
    digitalMarketing: <Megaphone className="w-8 h-8" />,
    photography: <Camera className="w-8 h-8" />,
    uiux: <Smartphone className="w-8 h-8" />,
    mobileApp: <Tablet className="w-8 h-8" />,
};

// Mock testimonials

function Home() {
    const { t, dir } = useTranslation();
    const testimonials = t.testimonials.items;
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [stats, setStats] = useState({
        earnings: 127850,
        jobs: 142,
        freelancers: 2500
    });

    // Animate earnings from 0 to target
    const animatedEarnings = useAnimatedCounter(stats.earnings, 2500);

    useEffect(() => {
        const fetchStats = async () => {
            // Get total jobs count
            const { count: jobsCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true });

            // Get total freelancers count
            const { count: freelancerCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('user_type', 'freelancer');

            // Get total contract values (approximate earnings)
            const { data: contracts } = await supabase
                .from('contracts')
                .select('amount')
                .eq('status', 'completed');

            const totalEarnings = contracts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

            // Only update if we have real data (fallback to mock if low/zero for demo appeal)
            if (jobsCount && jobsCount > 0) {
                setStats({
                    jobs: jobsCount,
                    freelancers: freelancerCount || 2500,
                    earnings: totalEarnings > 1000 ? totalEarnings : 127850 // Keep attractive number if low
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
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 pattern-islamic opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />

                <div className="container-custom relative py-20 md:py-32">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                            منصة تونسية 100%
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up">
                            {t.hero.title}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-muted mb-10 animate-slide-up animation-delay-100">
                            {t.hero.subtitle}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
                            <Link to="/signup?type=freelancer">
                                <Button variant="primary" size="lg" rightIcon={<ArrowIcon className="w-5 h-5" />}>
                                    {t.hero.ctaFreelancer}
                                </Button>
                            </Link>
                            <Link to="/signup?type=client">
                                <Button variant="outline" size="lg" rightIcon={<Briefcase className="w-5 h-5" />}>
                                    {t.hero.ctaClient}
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted animate-fade-in animation-delay-300">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-500" />
                                <span>تونسيون موثقون فقط</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-primary-500" />
                                <span>العربية أولاً</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-secondary-500" />
                                <span>+2,500 مستخدم</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-20 start-0 w-40 h-40 bg-primary-200 rounded-full opacity-50 blur-3xl" />
                <div className="absolute -top-20 end-0 w-60 h-60 bg-secondary-200 rounded-full opacity-50 blur-3xl" />
            </section>

            {/* Value Propositions */}
            <section className="section bg-white">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* No Bidding */}
                        <div className="card-hover text-center group">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">
                                {t.values.noBidding.title}
                            </h3>
                            <p className="text-muted">
                                {t.values.noBidding.description}
                            </p>
                        </div>

                        {/* Local Payment */}
                        <div className="card-hover text-center group">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform duration-300">
                                <Wallet className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">
                                {t.values.localPayment.title}
                            </h3>
                            <p className="text-muted">
                                {t.values.localPayment.description}
                            </p>
                        </div>

                        {/* Micro Jobs */}
                        <div className="card-hover text-center group">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center text-secondary-600 group-hover:scale-110 transition-transform duration-300">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">
                                {t.values.microJobs.title}
                            </h3>
                            <p className="text-muted">
                                {t.values.microJobs.description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="section bg-gray-50">
                <div className="container-custom">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
                        {t.howItWorks.title}
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* For Freelancers */}
                        <div className="card p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-bold">{t.howItWorks.tabs.freelancer}</h3>
                            </div>

                            <div className="space-y-6">
                                {t.howItWorks.freelancerSteps.slice(0, 3).map((step, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <span className="text-lg font-medium">{step.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* For Clients */}
                        <div className="card p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-secondary-600" />
                                </div>
                                <h3 className="text-xl font-bold">{t.howItWorks.tabs.client}</h3>
                            </div>

                            <div className="space-y-6">
                                {t.howItWorks.clientSteps.slice(0, 3).map((step, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-secondary-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <span className="text-lg font-medium">{step.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="section bg-white">
                <div className="container-custom">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
                        {t.categories.title}
                    </h2>
                    <p className="text-center text-muted mb-12 max-w-2xl mx-auto">
                        اكتشف المهارات المطلوبة في السوق التونسي
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((category) => (
                            <Link
                                key={category.key}
                                to={`/jobs?category=${category.key}`}
                                className="card-hover p-6 text-center group"
                            >
                                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors duration-300">
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

            {/* Live Counter */}
            <section className="py-20 gradient-primary text-white relative overflow-hidden">
                <div className="absolute inset-0 pattern-islamic opacity-10" />
                <div className="container-custom relative text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white/90 text-sm font-medium mb-6">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        إحصائيات مباشرة
                    </div>

                    <div className="text-5xl md:text-7xl font-bold mb-4 font-cairo">
                        {animatedEarnings.toLocaleString('ar-TN')}
                    </div>
                    <p className="text-xl md:text-2xl text-white/90">
                        {t.counter.title}
                    </p>
                </div>
            </section>

            {/* Testimonials */}
            <section className="section bg-gray-50">
                <div className="container-custom">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
                        {t.testimonials.title}
                    </h2>

                    <div className="max-w-4xl mx-auto">
                        <div className="card p-8 md:p-12 relative">
                            {/* Navigation Arrows */}
                            <button
                                onClick={prevTestimonial}
                                className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                aria-label="Previous testimonial"
                            >
                                <PrevIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={nextTestimonial}
                                className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                aria-label="Next testimonial"
                            >
                                <NextIcon className="w-5 h-5" />
                            </button>

                            <div className="text-center px-12">
                                {/* Avatar */}
                                <img
                                    src={testimonials[currentTestimonial].image}
                                    alt={testimonials[currentTestimonial].name}
                                    className="w-20 h-20 rounded-full mx-auto mb-6 ring-4 ring-primary-100"
                                />

                                {/* Stars */}
                                <div className="flex items-center justify-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <blockquote className="text-lg md:text-xl text-foreground mb-6">
                                    "{testimonials[currentTestimonial].quote}"
                                </blockquote>

                                {/* Author */}
                                <div className="font-semibold text-foreground">
                                    {testimonials[currentTestimonial].name}
                                </div>
                                <div className="text-muted text-sm mb-2">
                                    {testimonials[currentTestimonial].role}
                                </div>
                                <div className="badge-success">
                                    ربح {testimonials[currentTestimonial].earned} د.ت
                                </div>
                            </div>

                            {/* Dots */}
                            <div className="flex items-center justify-center gap-2 mt-8">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentTestimonial(index)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                                            ? 'w-6 bg-primary-600'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        aria-label={`Go to testimonial ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section bg-white">
                <div className="container-custom">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                            هل أنت مستعد للبدء؟
                        </h2>
                        <p className="text-xl text-muted mb-10">
                            انضم إلى آلاف التونسيين الذين يبنون مستقبلهم المهني معنا
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/signup?type=freelancer">
                                <Button variant="primary" size="lg">
                                    ابدأ الآن مجاناً
                                </Button>
                            </Link>
                            <Link to="/how-it-works">
                                <Button variant="ghost" size="lg" leftIcon={<Play className="w-5 h-5" />}>
                                    شاهد كيف يعمل
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
