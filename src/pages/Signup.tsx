import { Link, useLocation } from 'react-router-dom';
import { Briefcase, ShieldCheck, Sparkles } from 'lucide-react';

import { AuthShell, SignupForm } from '../components/auth';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { useTranslation } from '../i18n';

function Signup() {
    const { tx } = useTranslation();
    const location = useLocation();

    return (
        <>
            <SEO {...SEO_CONFIG.signup} url="/signup" />
            <AuthShell
                badge={tx('authPages.signup.badge', undefined, 'Launch your workspace')}
                title={tx('authPages.signup.heroTitle', undefined, 'Create a sharper first impression for every project you start.')}
                description={tx('authPages.signup.heroDescription', undefined, 'Choose your role, set up your workspace, and move into onboarding with a cleaner, more focused auth experience.')}
                highlights={[
                    {
                        icon: Sparkles,
                        title: tx('authPages.signup.highlightRoleTitle', undefined, 'Role-first onboarding'),
                        description: tx('authPages.signup.highlightRoleDescription', undefined, 'Start as client or freelancer and land in the right workspace from the first step.'),
                    },
                    {
                        icon: ShieldCheck,
                        title: tx('authPages.signup.highlightTrustTitle', undefined, 'Trust signals ready'),
                        description: tx('authPages.signup.highlightTrustDescription', undefined, 'Verification, identity checks, and profile structure are built into the journey.'),
                        tone: 'cyan',
                    },
                    {
                        icon: Briefcase,
                        title: tx('authPages.signup.highlightWorkTitle', undefined, 'Prepared for real work'),
                        description: tx('authPages.signup.highlightWorkDescription', undefined, 'Move from sign-up to posting jobs, building a profile, and closing contracts faster.'),
                        tone: 'accent',
                    },
                ]}
                topAction={
                    <Link
                        to="/login"
                        state={location.state}
                        className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                        {tx('authPages.signup.signInAction', undefined, 'Sign in')}
                    </Link>
                }
            >
                <div className="animate-slide-up">
                    <SignupForm />
                </div>
            </AuthShell>
        </>
    );
}

export default Signup;
