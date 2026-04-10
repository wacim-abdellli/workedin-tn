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
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-full text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.profile.skills} & {t.job.budget}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t.onboarding.freelancer.stepSkillsExperience || 'Skills and experience'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {tx('onboarding.freelancer.step2Description', undefined, 'Choose your strongest skills and define a believable starting rate and availability.')}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Skills Selection */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {t.profile.skills}
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({t.profile.optional})</span>
                        </label>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${selectedSkills.length === 5
                            ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                            }`}>
                            {selectedSkills.length}/5
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {allSkills.map((skill) => {
                            const { tx } = useTranslation();
                            const isSelected = selectedSkills.find((s) => s.id === skill.id);
                            return (
                                <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`
                                        relative group p-4 rounded-xl text-start transition-all
                                        flex items-center justify-between
                                        ${isSelected
                                            ? 'bg-violet-500 text-white shadow-lg ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-gray-900'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md'
                                        }
                                    `}
                                >
                                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {getSkillName(skill)}
                                    </span>
                                    {isSelected && (
                                        <div className="bg-white/20 rounded-full p-1">
                                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                        <Input
                            {...register('hourly_rate')}
                            type="number"
                            label={`${t.job.budget} (${t.common.tnd})`}
                            placeholder={tx('ui.e_g')}
                            min="0"
                            leftIcon={<DollarSign className="w-5 h-5 text-gray-400" />}
                            hint={t.profile.optional}
                            error={errors.hourly_rate?.message}
                        />
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                        <Select
                            {...register('availability')}
                            label={t.publicProfile.available}
                            options={AVAILABILITY_OPTIONS}
                            error={errors.availability?.message}
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                        className="flex-1"
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
