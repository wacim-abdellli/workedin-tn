import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, Play } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

export default function CTASection() {
    const { t, dir } = useTranslation();
    const { isAuthenticated, profile } = useAuth();
    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    // Determine where to redirect based on auth status
    const getStartLink = () => {
        if (isAuthenticated) {
            if (profile?.user_type === 'freelancer' || profile?.user_type === 'both') {
                return profile?.onboarding_completed ? '/freelancer/dashboard' : '/onboarding/freelancer';
            }
            return '/onboarding/freelancer';
        }
        return '/signup?type=freelancer';
    };

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
                        <Link to={getStartLink()}>
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
    );
}

