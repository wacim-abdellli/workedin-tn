import { Link } from 'react-router-dom';
import { Users, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { getWorkspaceDashboardPath, getWorkspaceOnboardingPath, isWorkspaceReady } from '@/lib/workspaceRoutes';

export default function HowItWorksSection() {
    const { t, dir } = useTranslation();
    const { isAuthenticated, profile, freelancerProfile } = useAuth();
    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    const getFreelancerLink = () => {
        if (isAuthenticated) {
            return isWorkspaceReady({ ...profile, user_type: 'freelancer' }, freelancerProfile, 'freelancer')
                ? getWorkspaceDashboardPath('freelancer')
                : getWorkspaceOnboardingPath('freelancer');
        }
        return '/signup?type=freelancer';
    };

    const getClientLink = () => {
        if (isAuthenticated) {
            return isWorkspaceReady({ ...profile, user_type: 'client' }, freelancerProfile, 'client')
                ? getWorkspaceDashboardPath('client')
                : getWorkspaceOnboardingPath('client');
        }
        return '/signup?type=client';
    };

    return (
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

                        <Link to={getFreelancerLink()} className="mt-8 block">
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

                        <Link to={getClientLink()} className="mt-8 block">
                            <button className="btn-accent w-full btn-lg">
                                <span>{t.howItWorks.cta.client}</span>
                                <ArrowIcon className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

