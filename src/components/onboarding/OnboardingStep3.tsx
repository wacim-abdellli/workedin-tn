import type { UseFormReturn } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Briefcase, Link2, Repeat, Timer, Wrench } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type { FreelancerStep3FormData } from './schemas';

interface OnboardingStep3Props {
    form: UseFormReturn<FreelancerStep3FormData>;
    onSubmit: (data: FreelancerStep3FormData) => void;
    onBack: () => void;
    isLoading: boolean;
}

export default function OnboardingStep3({
    form,
    onSubmit,
    onBack,
    isLoading,
}: OnboardingStep3Props) {
    const { t, tx, dir } = useTranslation();
    const { register, formState: { errors }, handleSubmit } = form;

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const BackArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-400">
                    <Briefcase className="w-3.5 h-3.5" />
                    {tx('onboarding.freelancer.stepProof', undefined, 'Proof and delivery setup')}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {tx('onboarding.freelancer.step3Title', undefined, 'Show proof and set expectations')}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {tx('onboarding.freelancer.step3Description', undefined, 'Add your tools, industries, and delivery rules so clients can trust your process before they contact you.')}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        {...register('years_experience')}
                        type="number"
                        min="0"
                        label={tx('profile.yearsExperience', undefined, 'Years of experience')}
                        placeholder="3"
                        error={errors.years_experience?.message}
                    />
                    <Input
                        {...register('weekly_availability_hours')}
                        type="number"
                        min="1"
                        max="168"
                        label={tx('profile.weeklyAvailabilityHours', undefined, 'Weekly availability (hours)')}
                        placeholder="30"
                        error={errors.weekly_availability_hours?.message}
                        leftIcon={<Timer className="w-5 h-5" />}
                    />
                    <Input
                        {...register('tools')}
                        label={tx('profile.tools', undefined, 'Tools (comma separated)')}
                        placeholder="Figma, React, Notion"
                        error={errors.tools?.message}
                        leftIcon={<Wrench className="w-5 h-5" />}
                    />
                    <Input
                        {...register('industries')}
                        label={tx('profile.industries', undefined, 'Industries (comma separated)')}
                        placeholder="E-commerce, Fintech, Healthcare"
                        error={errors.industries?.message}
                    />
                    <div className="md:col-span-2">
                        <Input
                            {...register('portfolio_links')}
                            label={tx('profile.portfolioLinks', undefined, 'Portfolio links (comma separated)')}
                            placeholder="https://site.com/work-1, https://site.com/work-2"
                            error={errors.portfolio_links?.message}
                            leftIcon={<Link2 className="w-5 h-5" />}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {tx('profile.revisionPolicy', undefined, 'Revision policy')}
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute left-0 top-0 flex items-center pl-4 pt-4 text-gray-400">
                                <Repeat className="w-5 h-5" />
                            </div>
                            <textarea
                                {...register('revision_policy')}
                                rows={3}
                                className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pl-11 text-gray-900 dark:text-white shadow-sm transition-all placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                placeholder={tx('profile.revisionPolicyPlaceholder', undefined, 'Example: 2 revisions included, additional revisions billed separately.')}
                            />
                        </div>
                        {errors.revision_policy?.message && <p className="mt-1 text-xs text-red-500">{errors.revision_policy.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {tx('profile.projectPreferences', undefined, 'Project preferences')}
                        </label>
                        <textarea
                            {...register('project_preferences')}
                            rows={4}
                            className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white shadow-sm transition-all placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            placeholder={tx('profile.projectPreferencesPlaceholder', undefined, 'Describe ideal project size, communication style, and decision cadence.')}
                        />
                        {errors.project_preferences?.message && <p className="mt-1 text-xs text-red-500">{errors.project_preferences.message}</p>}
                    </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-800">
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={onBack}
                        className="px-8"
                        leftIcon={<BackArrowIcon className="w-5 h-5" />}
                    >
                        {t.common.back}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="flex-1 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                        isLoading={isLoading}
                        rightIcon={<ArrowIcon className="w-5 h-5" />}
                    >
                        {tx('onboarding.freelancer.finishSetup', undefined, 'Finish setup')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
