import type { UseFormReturn } from 'react-hook-form';
import { Sparkles, CheckCircle, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { PREDEFINED_SKILLS, type Skill } from '../../types';
import type { Step2FormData } from './schemas';

interface OnboardingStep2Props {
    form: UseFormReturn<Step2FormData>;
    onSubmit: (data: Step2FormData) => void;
    onBack: () => void;
    isLoading: boolean;
    selectedSkills: Skill[];
    toggleSkill: (skill: Skill) => void;
    getSkillName: (skill: Skill) => string;
}

export default function OnboardingStep2({
    form,
    onSubmit,
    onBack,
    isLoading,
    selectedSkills,
    toggleSkill,
    getSkillName,
}: OnboardingStep2Props) {
    const { t, tx, dir } = useTranslation();
    const { register, formState: { errors }, handleSubmit } = form; // Assuming control is passed if needed, but simple register works here

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const BackArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

    const AVAILABILITY_OPTIONS = [
        { value: 'available', label: t.publicProfile.available },
        { value: 'busy', label: t.publicProfile.busy },
        { value: 'offline', label: t.publicProfile.offline },
    ];

    const OTHER_SKILL: Skill = {
        id: 'other',
        name_en: 'Other',
        name_fr: 'Autre',
        name_ar: 'أخرى',
    };

    const allSkills = [...PREDEFINED_SKILLS, OTHER_SKILL];

    return (
        <div className="space-y-8">
            <div className="text-center sm:text-start">
                <div className="inline-flex items-center gap-3 mb-3 px-4 py-2 rounded-full bg-primary-50/70 dark:bg-white dark:bg-gray-800/[0.04] border border-primary-100 dark:border-white/10 dark:border-gray-800 shadow-sm">
                    <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                        {t.profile.skills} & {t.job.budget}
                    </span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#171420] dark:text-white mb-2">{t.onboarding.freelancer.stepSkillsExperience || 'Skills and experience'}</h2>
                <p className="text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd]">{tx('onboarding.freelancer.step2Description', undefined, 'Choose your strongest skills and define a believable starting rate and availability.')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Skills Selection */}
                <div className="bg-white dark:bg-gray-800/50 dark:bg-dark-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 dark:border-dark-700 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-base font-semibold text-gray-900 dark:text-gray-100 dark:text-white flex items-center gap-2">
                            {t.profile.skills}
                            <span className="text-xs font-normal text-muted">({t.profile.optional})</span>
                        </label>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${selectedSkills.length === 5
                            ? 'bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-500/10 dark:border-primary-500/20 dark:text-primary-300'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:border-gray-700 dark:bg-dark-700 dark:text-gray-400 dark:border-dark-600'
                            }`}>
                            {selectedSkills.length}/5
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {allSkills.map((skill) => {
                            const isSelected = selectedSkills.find((s) => s.id === skill.id);
                            return (
                                <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`
                                        relative group p-4 rounded-xl text-start transition-all duration-300
                                        flex items-center justify-between
                                        ${isSelected
                                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-dark-900'
                                            : 'bg-white dark:bg-gray-800 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md'
                                        }
                                    `}
                                >
                                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {getSkillName(skill)}
                                    </span>
                                    {isSelected && (
                                        <div className="bg-white dark:bg-gray-800/20 rounded-full p-1">
                                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800/50 dark:bg-dark-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 dark:border-dark-700 p-6 backdrop-blur-sm">
                        <Input
                            {...register('hourly_rate')}
                            type="number"
                            label={`${t.job.budget} (${t.common.tnd})`}
                            placeholder="e.g. 50"
                            min="0"
                            className="bg-white dark:bg-gray-800 dark:bg-dark-900/50"
                            leftIcon={<DollarSign className="w-5 h-5 text-gray-400" />}
                            hint={t.profile.optional}
                            error={errors.hourly_rate?.message}
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 dark:bg-dark-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 dark:border-dark-700 p-6 backdrop-blur-sm">
                        <Select
                            {...register('availability')}
                            label={t.publicProfile.available}
                            options={AVAILABILITY_OPTIONS}
                            className="bg-white dark:bg-gray-800 dark:bg-dark-900/50"
                            error={errors.availability?.message}
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 dark:border-dark-800">
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
                        className="flex-1 shadow-xl shadow-primary-500/20 hover:shadow-primary-500/30"
                        isLoading={isLoading}
                        rightIcon={<ArrowIcon className="w-5 h-5" />}
                    >
                        {t.common.next}
                    </Button>
                </div>
            </form>
        </div>
    );
}
