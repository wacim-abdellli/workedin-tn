import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { calculateFreelancerProfileCompletion, type ProfileCompletionResult } from '../../lib/profileCompletion';

interface ProfileCompletionCardProps {
    className?: string;
    maxStepsToShow?: number;
}

const ProfileCompletionCard = ({ className = '', maxStepsToShow = 4 }: ProfileCompletionCardProps) => {
    const { profile, freelancerProfile } = useAuth();

    const completion: ProfileCompletionResult = calculateFreelancerProfileCompletion(profile, freelancerProfile);

    // Don't show if profile is complete
    if (completion.percentage >= 100) {
        return (
            <div className={`bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 ${className}`}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Award className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">ملفك الشخصي مكتمل!</h3>
                        <p className="text-sm text-green-600 dark:text-green-400">أنت مستعد للحصول على أفضل الفرص</p>
                    </div>
                </div>
            </div>
        );
    }

    // Get steps to show (prioritize missing steps)
    const stepsToShow = completion.missingSteps.slice(0, maxStepsToShow);

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-primary-100 dark:border-primary-900/50 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">اكتمال الملف الشخصي</h3>
                            <p className="text-sm text-primary-100">أكمل ملفك لزيادة فرص التوظيف</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-sm`}>
                        {completion.strengthLabel}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="relative z-10">
                    <div className="flex justify-between mb-2 text-sm font-medium">
                        <span className="text-white">{completion.percentage}% مكتمل</span>
                        <span className="text-primary-100">{completion.completedSteps.length}/{completion.steps.length} خطوات</span>
                    </div>
                    <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                            className="h-full bg-white rounded-full shadow-lg transition-all duration-1000 ease-out relative"
                            style={{ width: `${completion.percentage}%` }}
                        >
                            <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-shimmer" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Missing Steps */}
            <div className="p-6">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    الخطوات المتبقية
                </h4>
                <ul className="space-y-3">
                    {stepsToShow.map((step, index) => (
                        <li key={step.id}>
                            <Link
                                to={step.link || '/settings'}
                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-200 dark:hover:border-primary-800 transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${index === 0
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                    : 'bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <span className="block text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                                        {step.label}
                                    </span>
                                    {index === 0 && (
                                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">خطوتك التالية</span>
                                    )}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 shadow-sm text-primary-600">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>

                {completion.missingSteps.length > maxStepsToShow && (
                    <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                        +{completion.missingSteps.length - maxStepsToShow} خطوات أخرى لتحسين ملفك
                    </p>
                )}

                {/* Call to Action */}
                <Link
                    to={stepsToShow[0]?.link || '/settings?tab=profile'}
                    className="mt-6 w-full py-3.5 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    <span>أكمل ملفك الآن</span>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
};

export default ProfileCompletionCard;
