import { Header, Footer } from '../components/layout';
import { SignupForm } from '../components/auth';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

function Signup() {
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
                    <div className="card-glass shadow-2xl shadow-primary-500/10 dark:shadow-black/50">
                        <SignupForm />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Signup;
