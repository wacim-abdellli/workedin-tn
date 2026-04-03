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
                badge={tx('authPages.signup.badge', undefined, 'Join Khedma TN')}
                title={tx('authPages.signup.heroTitle', undefined, 'Ready for your next big project?')}
                description={tx('authPages.signup.heroDescription', undefined, 'Join thousands of professionals across Tunisia. Set up your workspace and start working in minutes.')}
                highlights={[
                    {
                        icon: Sparkles,
                        title: tx('authPages.signup.highlightRoleTitle', undefined, 'Choose Your Path'),
                        description: tx('authPages.signup.highlightRoleDescription', undefined, 'Sign up as a freelancer to find work, or a client to hire top talent.'),
                    },
                    {
                        icon: ShieldCheck,
                        title: tx('authPages.signup.highlightTrustTitle', undefined, 'Verified & Secure'),
                        description: tx('authPages.signup.highlightTrustDescription', undefined, 'Stand out instantly with identity and skill verification built right in.'),
                        tone: 'cyan',
                    },
                    {
                        icon: Briefcase,
                        title: tx('authPages.signup.highlightWorkTitle', undefined, 'Built for Speed'),
                        description: tx('authPages.signup.highlightWorkDescription', undefined, 'Go from creating an account to landing your first contract fast.'),
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
