import type { UseFormReturn } from 'react-hook-form';
import { Sparkles, CheckCircle, DollarSign, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CustomSelect from '../ui/CustomSelect';
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
    const { register, formState: { errors }, handleSubmit, watch } = form;

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-400">
                    <Zap className="w-3.5 h-3.5" />
                    {t.profile.skills} & {t.job.budget}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t.onboarding.freelancer.stepSkillsExperience || 'Skills and experience'}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {tx('onboarding.freelancer.step2Description', undefined, 'Choose your strongest skills and define a believable starting rate and availability.')}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Skills Selection */}
                <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-10" />
                    
                    <div className="flex items-center justify-between mb-6">
                        <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            {t.profile.skills}
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({t.profile.optional})</span>
                        </label>
                        <span className={`text-sm font-bold px-3 py-1.5 rounded-full transition-all duration-300 ${selectedSkills.length === 5
                            ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/20 scale-105'
                            : 'bg-[#1a1a1a] text-gray-400 border border-gray-800'
                            }`}>
                            {selectedSkills.length}/5
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {allSkills.map((skill, index) => {
                            const { tx } = useTranslation();
                            const isSelected = selectedSkills.find((s) => s.id === skill.id);
                            return (
                                <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    style={{ animationDelay: `${index * 30}ms` }}
                                    className={`
                                        relative group p-4 rounded-xl text-start transition-all duration-300
                                        flex items-center justify-between animate-in fade-in slide-in-from-bottom-2
                                        ${isSelected
                                            ? 'bg-gradient-to-br from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/30 scale-105 ring-2 ring-purple-500/50 ring-offset-2 dark:ring-offset-[#0c0c0c]'
                                            : 'bg-[#1a1a1a] border border-gray-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 hover:shadow-md hover:scale-102'
                                        }
                                    `}
                                >
                                    <span className={`text-sm font-medium transition-all ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {getSkillName(skill)}
                                    </span>
                                    {isSelected && (
                                        <div className="bg-white/20 rounded-full p-1 animate-in zoom-in duration-200">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    {!isSelected && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -z-10 group-hover:bg-green-500/10 transition-all" />
                        <Input
                            {...register('hourly_rate')}
                            type="number"
                            label={`${t.job.budget} (${t.common.tnd})`}
                            placeholder={tx('ui.e_g')}
                            min="0"
                            leftIcon={<DollarSign className="w-5 h-5 text-green-500" />}
                            hint={t.profile.optional}
                            error={errors.hourly_rate?.message}
                        />
                    </div>

                    <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -z-10 group-hover:bg-purple-500/10 transition-all" />
                        <CustomSelect
                            name="availability"
                            label={t.publicProfile.available}
                            options={AVAILABILITY_OPTIONS}
                            error={errors.availability?.message}
                            variant="freelancer"
                            value={watch('availability')}
                            onChange={(value) => form.setValue('availability', value as 'available' | 'busy' | 'offline')}
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-800">
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={onBack}
                        className="px-8 hover:bg-[#1a1a1a] transition-all duration-300"
                        leftIcon={<BackArrowIcon className="w-5 h-5" />}
                    >
                        {t.common.back}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="flex-1 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
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
