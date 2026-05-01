import type { UseFormReturn } from 'react-hook-form';
import { Sparkles, CheckCircle, DollarSign, ArrowRight, ArrowLeft, Zap, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CustomSelect from '../ui/CustomSelect';
import { PREDEFINED_SKILLS, type Skill, type SkillCategory } from '../../types';
import type { Step2FormData } from './schemas';
import { useState, useMemo } from 'react';

interface OnboardingStep2Props {
    form: UseFormReturn<Step2FormData>;
    onSubmit: (data: Step2FormData) => void;
    onBack: () => void;
    isLoading: boolean;
    selectedSkills: Skill[];
    selectedSkillCount: number;
    toggleSkill: (skill: Skill) => void;
    getSkillName: (skill: Skill) => string;
    maxSkills: number;
}

export default function OnboardingStep2({
    form,
    onSubmit,
    onBack,
    isLoading,
    selectedSkills,
    selectedSkillCount,
    toggleSkill,
    getSkillName,
    maxSkills,
}: OnboardingStep2Props) {
    const { t, tx, dir } = useTranslation();
    const { register, formState: { errors }, handleSubmit, watch } = form;
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<SkillCategory>>(new Set(['design', 'development', 'writing', 'marketing']));

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const BackArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

    const AVAILABILITY_OPTIONS = [
        { value: 'available', label: t.publicProfile.available },
        { value: 'busy', label: t.publicProfile.busy },
        { value: 'offline', label: t.publicProfile.offline },
    ];

    // Group skills by category
    const skillsByCategory = useMemo(() => {
        const grouped: Record<SkillCategory, typeof PREDEFINED_SKILLS> = {
            design: [],
            development: [],
            writing: [],
            marketing: [],
            video: [],
            business: [],
            data: [],
            other: [],
        };

        PREDEFINED_SKILLS.forEach(skill => {
            if (skill.category) {
                grouped[skill.category].push(skill);
            }
        });

        return grouped;
    }, []);

    // Filter skills based on search
    const filteredSkillsByCategory = useMemo(() => {
        if (!searchQuery.trim()) return skillsByCategory;

        const query = searchQuery.toLowerCase();
        const filtered: Record<SkillCategory, typeof PREDEFINED_SKILLS> = {
            design: [],
            development: [],
            writing: [],
            marketing: [],
            video: [],
            business: [],
            data: [],
            other: [],
        };

        Object.entries(skillsByCategory).forEach(([category, skills]) => {
            filtered[category as SkillCategory] = skills.filter(skill =>
                getSkillName(skill).toLowerCase().includes(query) ||
                skill.name_en.toLowerCase().includes(query) ||
                skill.name_ar.includes(query) ||
                skill.name_fr.toLowerCase().includes(query)
            );
        });

        return filtered;
    }, [skillsByCategory, searchQuery, getSkillName]);

    const toggleCategory = (category: SkillCategory) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const getCategoryLabel = (category: SkillCategory): string => {
        return tx(`profile.skillCategories.${category}`, undefined, category);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-400">
                    <Zap className="w-3.5 h-3.5" />
                    {tx('onboarding.freelancer.skillsRateAndAvailability', undefined, 'Skills, rate, and availability')}
                </div>
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
                    {tx('onboarding.freelancer.step2TitleUpdated', undefined, 'Choose skills and set your hourly rate')}
                </h2>
                <p className="text-base text-gray-600 dark:text-[var(--color-text-tertiary)] leading-relaxed">
                    {tx('onboarding.freelancer.step2Description', undefined, 'Use Upwork-style profile signals: clear services, realistic hourly rate, and current availability.')}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Skills Selection */}
                <div className="relative bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-10" />
                    
                    <div className="flex items-center justify-between mb-6">
                        <label className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            {t.profile.skills}
                            <span className="text-xs font-normal text-[var(--color-text-primary)]-subtle dark:text-[var(--color-text-tertiary)]">({t.profile.optional})</span>
                        </label>
                        <span className={`text-sm font-bold px-3 py-1.5 rounded-full transition-all duration-300 ${selectedSkillCount === maxSkills
                            ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-[var(--color-text-primary)] shadow-lg shadow-purple-500/20 scale-105'
                            : 'bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)]'
                            }`}>
                            {selectedSkillCount}/{maxSkills}
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-primary)]-subtle" />
                        <input
                            type="text"
                            placeholder={tx('profile.searchSkills', undefined, 'Search skills...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>

                    {/* Skills by Category */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {(Object.entries(filteredSkillsByCategory) as [SkillCategory, typeof PREDEFINED_SKILLS][]).map(([category, skills]) => {
                            if (skills.length === 0) return null;
                            
                            const isExpanded = expandedCategories.has(category);
                            const primarySkills = skills.filter(s => s.isPrimary);
                            const secondarySkills = skills.filter(s => !s.isPrimary);
                            const displaySkills = isExpanded ? skills : primarySkills;

                            return (
                                <div key={category} className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                                    >
                                        <span className="text-sm font-semibold text-purple-400">
                                            {getCategoryLabel(category)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-[var(--color-text-primary)]-subtle">
                                                {skills.filter(s => selectedSkills.find(sel => sel.id === s.id)).length}/{skills.length}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-[var(--color-text-primary)]-subtle" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-[var(--color-text-primary)]-subtle" />
                                            )}
                                        </div>
                                    </button>
                                    
                                    {displaySkills.length > 0 && (
                                        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {displaySkills.map((skill) => {
                                                const isSelected = selectedSkills.find((s) => s.id === skill.id);
                                                return (
                                                    <button
                                                        key={skill.id}
                                                        type="button"
                                                        onClick={() => toggleSkill(skill)}
                                                        className={`
                                                            relative group p-3 rounded-lg text-start transition-all duration-300
                                                            flex items-center justify-between
                                                            ${isSelected
                                                                ? 'bg-gradient-to-br from-purple-500 to-violet-500 text-[var(--color-text-primary)] shadow-lg shadow-purple-500/30 scale-105 ring-2 ring-purple-500/50'
                                                                : 'bg-[var(--color-bg-muted)] border border-[var(--color-border-subtle)] hover:border-purple-500/50 hover:shadow-md'
                                                            }
                                                        `}
                                                    >
                                                        <span className={`text-xs font-medium transition-all ${isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                                                            {getSkillName(skill)}
                                                        </span>
                                                        {isSelected && (
                                                            <div className="bg-white/20 rounded-full p-0.5">
                                                                <CheckCircle className="w-3 h-3 text-[var(--color-text-primary)]" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                    {!isExpanded && secondarySkills.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(category)}
                                            className="w-full px-4 py-2 text-xs text-purple-400 hover:text-purple-300 bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-base)] transition-colors"
                                        >
                                            + {secondarySkills.length} {tx('profile.secondarySkills', undefined, 'more skills')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
                        {tx('onboarding.freelancer.skillsClarification', undefined, 'These skills appear on your profile and in client search filters. Pick only what you can deliver now.')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -z-10 group-hover:bg-green-500/10 transition-all" />
                        <Input
                            {...register('hourly_rate')}
                            type="number"
                            label={tx('onboarding.freelancer.hourlyRateLabel', undefined, `Hourly rate (${t.common.tnd}/hour)`)}
                            placeholder={tx('onboarding.freelancer.hourlyRatePlaceholder', undefined, 'e.g. 35')}
                            min="0"
                            max="999999"
                            step="0.01"
                            leftIcon={<DollarSign className="w-5 h-5 text-green-500" />}
                            hint={tx('onboarding.freelancer.hourlyRateHint', undefined, 'Shown to clients on your profile and used in search filters. You can update it later.')}
                            error={errors.hourly_rate?.message}
                        />
                    </div>

                    <div className="relative bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
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

                <div className="flex gap-4 pt-6 border-t border-[var(--color-border-subtle)]">
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={onBack}
                        className="px-8 hover:bg-[var(--color-bg-muted)] transition-all duration-300"
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




