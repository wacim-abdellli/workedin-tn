import { Link } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle2, Rocket, Target } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';
import { calculateFreelancerProfileCompletion, type ProfileCompletionResult } from '../../lib/profileCompletion';

interface ProfileCompletionCardProps {
    className?: string;
    maxStepsToShow?: number;
}

const ProfileCompletionCard = ({ className = '', maxStepsToShow = 4 }: ProfileCompletionCardProps) => {
    const { profile, freelancerProfile } = useAuth();
    const { dir, tx } = useTranslation();

    const completion: ProfileCompletionResult = calculateFreelancerProfileCompletion(profile, freelancerProfile);
    const stepsToShow = completion.missingSteps.slice(0, maxStepsToShow);

    const strengthLabel = completion.percentage < 30
        ? tx('components.profileCompletion.weak', undefined, 'Needs work')
        : completion.percentage < 60
            ? tx('components.profileCompletion.medium', undefined, 'Getting there')
            : completion.percentage < 90
                ? tx('components.profileCompletion.good', undefined, 'Looking solid')
                : tx('components.profileCompletion.excellent', undefined, 'Standout')
    ;

    const strengthTone = completion.percentage < 30
        ? 'bg-red-500/12 text-red-200 border-red-400/20'
        : completion.percentage < 60
            ? 'bg-amber-500/12 text-amber-100 border-amber-300/20'
            : completion.percentage < 90
                ? 'bg-sky-500/12 text-sky-100 border-sky-300/20'
                : 'bg-emerald-500/12 text-emerald-100 border-emerald-300/20';

    const getStepLabel = (stepId: string, fallback: string) => {
        const labels: Record<string, string> = {
            avatar: tx('components.profileCompletion.steps.avatar', undefined, 'Add a profile photo'),
            full_name: tx('components.profileCompletion.steps.fullName', undefined, 'Complete your full name'),
            bio: tx('components.profileCompletion.steps.bio', undefined, 'Write a stronger bio'),
            phone: tx('components.profileCompletion.steps.phone', undefined, 'Add your phone number'),
            location: tx('components.profileCompletion.steps.location', undefined, 'Set your location'),
            title: tx('components.profileCompletion.steps.title', undefined, 'Add your professional title'),
            skills: tx('components.profileCompletion.steps.skills', undefined, 'Add at least 3 skills'),
            hourly_rate: tx('components.profileCompletion.steps.hourlyRate', undefined, 'Set your hourly rate'),
            languages: tx('components.profileCompletion.steps.languages', undefined, 'Add your languages'),
            education: tx('components.profileCompletion.steps.education', undefined, 'Add education details'),
            portfolio: tx('components.profileCompletion.steps.portfolio', undefined, 'Show your past work'),
        };

        return labels[stepId] || fallback;
    };

    if (completion.percentage >= 100) {
        return (
            <div className={`premium-panel radius-panel overflow-hidden ${className}`}>
                <div className="rounded-[1.6rem] border border-emerald-400/20 bg-[linear-gradient(145deg,rgba(16,185,129,0.18),rgba(12,18,24,0.04))] p-6 dark:bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(12,18,24,0.2))]">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                            <Award className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                                {tx('components.profileCompletion.readyBadge', undefined, 'Profile ready')}
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-[#1a1825] dark:text-white">
                                {tx('components.profileCompletion.completeTitle', undefined, 'Your freelancer profile is market-ready')}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[#5b5870] dark:text-[#aca9bd]">
                                {tx('components.profileCompletion.completeDescription', undefined, 'Everything important is filled in. Keep proposals active and your portfolio fresh to stay visible.')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`premium-panel radius-panel overflow-hidden ${className}`}>
            <div className="rounded-[1.6rem] bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.28),transparent_40%),linear-gradient(145deg,#6d28d9_0%,#8b5cf6_52%,#c026d3_100%)] p-6 text-white shadow-[0_28px_70px_-38px_rgba(109,40,217,0.85)]">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14 backdrop-blur-sm">
                            <Target className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                                {tx('components.profileCompletion.badge', undefined, 'Visibility score')}
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-white">
                                {tx('components.profileCompletion.title', undefined, 'Profile completion')}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-white/72">
                                {tx('components.profileCompletion.subtitle', undefined, 'Complete the strongest remaining items to increase trust and hiring chances.')}
                            </p>
                        </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${strengthTone}`}>
                        {strengthLabel}
                    </span>
                </div>

                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium text-white/85">
                        <span>{tx('components.profileCompletion.progressLabel', undefined, 'Completion')}</span>
                        <span>{completion.percentage}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-black/20">
                        <div
                            className="h-full rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.55)] transition-all duration-700"
                            style={{ width: `${completion.percentage}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/70">
                        <span>
                            {completion.completedSteps.length}/{completion.steps.length} {tx('components.profileCompletion.stepsCount', undefined, 'steps done')}
                        </span>
                        <span>
                            {completion.missingSteps.length} {tx('components.profileCompletion.stepsLeft', undefined, 'left')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-[#1a1825] dark:text-white">
                            {tx('components.profileCompletion.nextSteps', undefined, 'Highest-impact next steps')}
                        </p>
                        <p className="mt-1 text-xs text-[#6b6880] dark:text-[#8b8aa0]">
                            {tx('components.profileCompletion.nextStepsDescription', undefined, 'Focus on the items below first for the fastest profile lift.')}
                        </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/5 dark:text-primary-300">
                        <Rocket className="h-5 w-5" />
                    </div>
                </div>

                <div className="space-y-3">
                    {stepsToShow.map((step, index) => (
                        <Link
                            key={step.id}
                            to={step.link || '/settings?tab=profile'}
                            className="group flex items-center gap-4 rounded-2xl border border-primary-100/80 bg-white/75 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-primary-400/20 dark:hover:bg-white/[0.06]"
                        >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${index === 0 ? 'bg-primary-600 text-white shadow-[0_16px_30px_-16px_rgba(109,40,217,0.9)]' : 'bg-gray-100 text-[#57536a] dark:bg-white/10 dark:text-[#c6c2d6]'}`}>
                                {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[#1a1825] dark:text-white">
                                    {getStepLabel(step.id, step.label)}
                                </p>
                                <p className="mt-1 text-xs text-[#6b6880] dark:text-[#8b8aa0]">
                                    {index === 0
                                        ? tx('components.profileCompletion.topPriority', undefined, 'Top priority right now')
                                        : tx('components.profileCompletion.nextPriority', undefined, 'Helpful next improvement')}
                                </p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[#57536a] transition-all group-hover:bg-primary-600 group-hover:text-white dark:bg-white/10 dark:text-[#c6c2d6]">
                                <ArrowLeft className={`h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                            </div>
                        </Link>
                    ))}
                </div>

                {completion.missingSteps.length > maxStepsToShow ? (
                    <p className="mt-4 text-center text-xs font-medium text-[#8b8aa0]">
                        +{completion.missingSteps.length - maxStepsToShow} {tx('components.profileCompletion.moreSteps', undefined, 'more improvements waiting')}
                    </p>
                ) : null}

                <Link
                    to={stepsToShow[0]?.link || '/settings?tab=profile'}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#12101a] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1a1625] dark:bg-white dark:text-[#171420] dark:hover:bg-white/90"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    {tx('components.profileCompletion.cta', undefined, 'Improve profile now')}
                </Link>
            </div>
        </div>
    );
};

export default ProfileCompletionCard;
