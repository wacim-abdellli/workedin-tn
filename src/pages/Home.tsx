import { useState, useEffect } from 'react';
import { Header, Footer } from '../components/layout';
import { supabase } from '../lib/supabase';
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
        earnings: 127850,
        jobs: 142,
        freelancers: 2500,
        contracts: 142,
    });

    useEffect(() => {
        const fetchStats = async () => {
            const [
                { count: jobsCount },
                { count: freelancerCount },
                { count: contractCount },
                { data: contracts },
            ] = await Promise.all([
                supabase.from('jobs').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).in('user_type', ['freelancer', 'both']),
                supabase.from('contracts').select('*', { count: 'exact', head: true }),
                supabase.from('contracts').select('amount').eq('status', 'completed'),
            ]);

            const totalEarnings = contracts?.reduce((sum, contract) => sum + (contract.amount || 0), 0) || 0;

            setStats({
                jobs: jobsCount ?? 142,
                freelancers: freelancerCount ?? 2500,
                contracts: contractCount ?? 142,
                earnings: totalEarnings > 0 ? totalEarnings : 127850,
            });
        };

        fetchStats();
    }, []);

    return (
        <div className="min-h-screen">
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
