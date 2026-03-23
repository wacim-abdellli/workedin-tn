import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, Play } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import {
    getDashboardPath,
    getJobsPath,
    getOnboardingPath,
    isModeOnboarded,
} from '@/lib/accountMode';

export default function CTASection() {
    const { t, dir } = useTranslation();
    const { isAuthenticated, profile, freelancerProfile, activeMode } = useAuth();
    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    // Determine where to redirect based on auth status
    const getStartLink = () => {
        if (isAuthenticated) {
            return isModeOnboarded({ ...profile, user_type: 'freelancer' }, freelancerProfile, 'freelancer')
                ? getDashboardPath('freelancer')
                : getOnboardingPath('freelancer');
        }
        return '/signup?type=freelancer';
    };

    const primaryLabel = isAuthenticated ? t.nav.dashboard : t.home.sections.cta.btnStart;
    const primaryLink = isAuthenticated
        ? isModeOnboarded(profile, freelancerProfile, activeMode)
            ? getDashboardPath(activeMode)
            : getOnboardingPath(activeMode)
        : getStartLink();

    const secondaryLink = isAuthenticated
        ? getJobsPath(activeMode)
        : '/how-it-works';

    const secondaryLabel = isAuthenticated
        ? activeMode === 'client'
            ? t.hero.ctaClient
            : t.nav.findWork
        : t.home.sections.cta.btnWatch;

    return (
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
                        <Link to={primaryLink}>
                            <button className="btn-primary btn-lg">
                                <span>{primaryLabel}</span>
                                <ArrowIcon className="w-5 h-5" />
                            </button>
                        </Link>
                        <Link to={secondaryLink}>
                            <Button variant="outline" size="lg" leftIcon={<Play className="w-5 h-5" />}>
                                {secondaryLabel}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

