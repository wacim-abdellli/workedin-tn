import { Header, Footer } from '../components/layout';
import { SignupForm } from '../components/auth';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { useTheme } from '../contexts/ThemeContext';

function Signup() {
    const { theme } = useTheme();

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-dark-50 dark:bg-dark-900">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 end-0 w-[500px] h-[500px] bg-secondary-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" />
                <div className="absolute bottom-0 start-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse animation-delay-200" />
            </div>

            <SEO {...SEO_CONFIG.signup} url="/signup" />
            <Header />

            <div className="flex-1 flex items-center justify-center py-16 px-4 relative z-10">
                <div className="w-full max-w-md animate-slide-up">
                    <img
                        src={theme === 'dark' ? '/logos/logo-stacked-dark.svg' : '/logos/logo-stacked.svg'}
                        alt="Khedma TN"
                        style={{ height: '80px', width: 'auto', margin: '0 auto 2rem' }}
                    />
                    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/50 dark:border dark:border-white/8 dark:bg-[#1a1825] dark:shadow-black/50">
                        <SignupForm />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Signup;
