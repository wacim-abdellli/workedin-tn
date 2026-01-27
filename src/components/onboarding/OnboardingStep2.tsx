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
    const { t, dir } = useTranslation();
    const { register, formState: { errors }, handleSubmit } = form; // Assuming control is passed if needed, but simple register works here

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const BackArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

    const AVAILABILITY_OPTIONS = [
        { value: 'available', label: t.publicProfile.available },
        { value: 'busy', label: t.publicProfile.busy },
        { value: 'offline', label: t.publicProfile.offline },
    ];

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/30">
                    <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{t.profile.skills} & {t.job.budget}</h2>
                    <p className="text-muted text-sm">{t.onboarding.client.profileDesc}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Skills Selection */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="label mb-0">{t.profile.skills}</label>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                            {selectedSkills.length}/5
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {PREDEFINED_SKILLS.map((skill) => {
                            const isSelected = selectedSkills.find((s) => s.id === skill.id);
                            return (
                                <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`
                                        p-3 rounded-xl border transition-all duration-200 text-start relative overflow-hidden group
                                        ${isSelected
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md ring-1 ring-primary-500'
                                            : 'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-primary-300 dark:hover:border-dark-500'
                                        }
                                    `}
                                >
                                    <span className={`text-sm font-medium relative z-10 ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-dark-700 dark:text-dark-300'}`}>
                                        {getSkillName(skill)}
                                    </span>
                                    {isSelected && (
                                        <div className="absolute top-2 end-2">
                                            <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        {...register('hourly_rate')}
                        type="number"
                        label={`${t.job.budget} (${t.common.tnd})`}
                        placeholder="50"
                        min="0"
                        leftIcon={<DollarSign className="w-5 h-5 text-success-600" />}
                        hint={t.profile.optional}
                        error={errors.hourly_rate?.message}
                    />

                    <Select
                        {...register('availability')}
                        label={t.publicProfile.available}
                        options={AVAILABILITY_OPTIONS}
                        error={errors.availability?.message}
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={onBack}
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
