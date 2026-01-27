import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Briefcase, Users } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import type { UserType } from '../../types';
import LoginForm from './LoginForm';

interface SignupFormProps {
    onComplete?: () => void;
}

function SignupForm({ onComplete }: SignupFormProps) {
    const { t } = useTranslation();
    const { profile, setUserType } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState<'phone' | 'userType'>('phone');
    const [isLoading, setIsLoading] = useState(false);

    // Check if user type was pre-selected from URL
    const preSelectedType = searchParams.get('type') as UserType | null;

    const userTypes: { type: UserType; icon: React.ReactNode; title: string; description: string }[] = [
        {
            type: 'freelancer',
            icon: <User className="w-8 h-8" />,
            title: t.auth.freelancer,
            description: 'أريد العمل وتقديم خدماتي',
        },
        {
            type: 'client',
            icon: <Briefcase className="w-8 h-8" />,
            title: t.auth.client,
            description: 'أريد توظيف موظفين',
        },
        {
            type: 'both',
            icon: <Users className="w-8 h-8" />,
            title: t.auth.both,
            description: 'أريد العمل والتوظيف معاً',
        },
    ];

    // Handle successful phone auth
    const handlePhoneSuccess = () => {
        if (preSelectedType) {
            handleSelectUserType(preSelectedType);
        } else {
            setStep('userType');
        }
    };

    // Handle user type selection
    const handleSelectUserType = async (userType: UserType) => {
        setIsLoading(true);

        try {
            await setUserType(userType);

            // Navigate to appropriate onboarding page
            if (userType === 'freelancer' || userType === 'both') {
                navigate('/onboarding/freelancer');
            } else {
                navigate('/onboarding/client');
            }

            onComplete?.();
        } catch (error) {
            console.error('Error setting user type:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // If user already has a type, redirect to dashboard
    if (profile?.user_type) {
        navigate(profile.user_type === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        return null;
    }

    return (
        <div className="w-full max-w-md mx-auto">
            {step === 'phone' ? (
                <LoginForm onSuccess={handlePhoneSuccess} />
            ) : (
                <div className="space-y-6">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            {t.auth.selectUserType}
                        </h2>
                        <p className="text-muted">
                            اختر نوع الحساب الذي يناسبك
                        </p>
                    </div>

                    <div className="space-y-4">
                        {userTypes.map((item) => (
                            <button
                                key={item.type}
                                onClick={() => handleSelectUserType(item.type)}
                                disabled={isLoading}
                                className={`
                  w-full p-6 rounded-2xl border-2 text-start
                  transition-all duration-200
                  hover:border-primary-600 hover:bg-primary-50
                  focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  border-gray-200 bg-white
                `}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-foreground mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-muted text-sm">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <p className="text-center text-sm text-muted">
                        يمكنك تغيير نوع حسابك لاحقاً من الإعدادات
                    </p>
                </div>
            )}
        </div>
    );
}

export default SignupForm;
