import { lazy, Suspense, useState, useEffect } from 'react';
import { Header, Footer } from '../components/layout';
import { supabaseAnon } from '../lib/supabase';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import RevealOnScroll from '../components/ui/RevealOnScroll';
import { useTranslation } from '../i18n';

import HeroSection from '../components/home/HeroSection';

const ValuePropositions = lazy(() => import('../components/home/ValuePropositions'));
const HowItWorksSection = lazy(() => import('../components/home/HowItWorksSection'));
const CategoriesSection = lazy(() => import('../components/home/CategoriesSection'));
const LiveCounterSection = lazy(() => import('../components/home/LiveCounterSection'));
const TestimonialsSection = lazy(() => import('../components/home/TestimonialsSection'));
const CTASection = lazy(() => import('../components/home/CTASection'));

function Home() {
    const { language: _language } = useTranslation();
    const [stats, setStats] = useState({
        earnings: 0,
        jobs: 0,
        freelancers: 0,
        contracts: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [
                    { count: jobsCount },
                    { count: freelancerCount },
                    { count: contractCount },
                ] = await Promise.all([
                    supabaseAnon.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open').eq('visibility', 'public'),
                    supabaseAnon.from('public_profiles').select('*', { count: 'exact', head: true }).in('user_type', ['freelancer', 'both']),
                    supabaseAnon.from('contracts').select('*', { count: 'exact', head: true }),
                ]);

                setStats({
                    jobs: jobsCount ?? 0,
                    freelancers: freelancerCount ?? 0,
                    contracts: contractCount ?? 0,
                    earnings: 0,
                });
            } catch {
                // Anon queries may fail if RLS blocks them — use defaults
            }
        };

        fetchStats();
    }, []);

return (
        <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
            <SEO {...SEO_CONFIG.home} url="/" />
            <Header />

            <HeroSection stats={stats} />
            <Suspense fallback={null}>
                <RevealOnScroll variant="fade-up">
                    <ValuePropositions />
                </RevealOnScroll>
                <RevealOnScroll variant="fade-up" delay={50}>
                    <HowItWorksSection />
                </RevealOnScroll>
                <RevealOnScroll variant="fade-up" delay={50}>
                    <CategoriesSection />
                </RevealOnScroll>
                <RevealOnScroll variant="blur" delay={50}>
                    <LiveCounterSection stats={stats} />
                </RevealOnScroll>
                <RevealOnScroll variant="fade-up" delay={50}>
                    <TestimonialsSection />
                </RevealOnScroll>
                <RevealOnScroll variant="zoom" delay={50}>
                    <CTASection />
                </RevealOnScroll>
            </Suspense>

            <Footer />
        </div>
    );
}

export default Home;
