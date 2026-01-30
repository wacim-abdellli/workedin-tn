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
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">اكتمال الملف الشخصي</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">أكمل ملفك لزيادة فرص التوظيف</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${completion.strengthColor}`}>
                        {completion.strengthLabel}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${completion.percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                        <span className="font-bold text-primary-600 dark:text-primary-400">{completion.percentage}%</span>
                        <span className="text-gray-500">{completion.completedSteps.length} من {completion.steps.length} خطوات</span>
                    </div>
                </div>
            </div>

            {/* Missing Steps */}
            <div className="p-6 pt-4">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">الخطوات المتبقية</h4>
                <ul className="space-y-3">
                    {stepsToShow.map((step, index) => (
                        <li key={step.id}>
                            <Link
                                to={step.link || '/settings'}
                                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                                    {index + 1}
                                </div>
                                <span className="flex-1 text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    {step.label}
                                </span>
                                <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                            </Link>
                        </li>
                    ))}
                </ul>

                {completion.missingSteps.length > maxStepsToShow && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                        و {completion.missingSteps.length - maxStepsToShow} خطوات أخرى
                    </p>
                )}

                {/* Call to Action */}
                <Link
                    to={stepsToShow[0]?.link || '/settings?tab=profile'}
                    className="btn-primary btn-lg w-full mt-4 justify-center"
                >
                    <span>أكمل ملفك الآن</span>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
};

export default ProfileCompletionCard;
