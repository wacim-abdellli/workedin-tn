import { useState, useEffect } from 'react';
import { Header, Footer } from '../components/layout';
import { supabaseAnon } from '../lib/supabase';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

// Subcomponents
import HeroSection from '../components/home/HeroSection';
import ValuePropositions from '../components/home/ValuePropositions';
import HowItWorksSection from '../components/home/HowItWorksSection';
import CategoriesSection from '../components/home/CategoriesSection';
import LiveCounterSection from '../components/home/LiveCounterSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import CTASection from '../components/home/CTASection';

function Home() {
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
                    supabaseAnon.from('profiles').select('*', { count: 'exact', head: true }).in('user_type', ['freelancer', 'both']),
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
            <ValuePropositions />
            <HowItWorksSection />
            <CategoriesSection />
            <LiveCounterSection stats={stats} />
            <TestimonialsSection />
            <CTASection />

            <Footer />
        </div>
    );
}

export default Home;
