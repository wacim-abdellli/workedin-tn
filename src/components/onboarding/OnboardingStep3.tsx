import { Languages as LanguagesIcon, Plus, X, GraduationCap, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

// Types
export interface LanguageEntry {
    language: string;
    proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
}

export interface EducationEntry {
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
}

interface OnboardingStep3Props {
    languages: LanguageEntry[];
    addLanguage: () => void;
    removeLanguage: (index: number) => void;
    updateLanguage: (index: number, field: keyof LanguageEntry, value: string) => void;
    education: EducationEntry[];
    addEducation: () => void;
    removeEducation: (index: number) => void;
    updateEducation: (index: number, field: keyof EducationEntry, value: string) => void;
    onNext: () => void;
    onBack: () => void;
    isLoading: boolean;
}

export default function OnboardingStep3({
    languages,
    addLanguage,
    removeLanguage,
    updateLanguage,
    education,
    addEducation,
    removeEducation,
    updateEducation,
    onNext,
    onBack,
    isLoading,
}: OnboardingStep3Props) {
    const { t, dir } = useTranslation();
    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const BackArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

    const LANGUAGES_OPTIONS = [
        { value: 'ar', label: 'العربية' },
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'English' },
        { value: 'de', label: 'Deutsch' },
        { value: 'it', label: 'Italiano' },
        { value: 'es', label: 'Español' },
    ];

    const PROFICIENCY_LEVELS = [
        { value: 'native', label: t.profile.languages.levels.native },
        { value: 'fluent', label: t.profile.languages.levels.fluent },
        { value: 'conversational', label: t.profile.languages.levels.conversational },
        { value: 'basic', label: t.profile.languages.levels.basic },
    ];

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center shadow-lg shadow-secondary-500/30">
                    <LanguagesIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{t.profile.languages.title} & {t.profile.education.title}</h2>
                    <p className="text-muted text-sm">{t.onboarding.freelancer.steps.experience}</p>
                </div>
            </div>

            <div className="space-y-10">
                {/* Languages */}
                <div className="bg-gray-50 dark:bg-dark-800/50 rounded-2xl p-6 border border-gray-100 dark:border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <label className="label mb-0 text-lg">{t.profile.languages.title}</label>
                        {languages.length < 5 && (
                            <button
                                type="button"
                                onClick={addLanguage}
                                className="btn-ghost btn-sm text-primary-600 dark:text-primary-400"
                            >
                                <Plus className="w-4 h-4 me-1" />
                                {t.profile.languages.add}
                            </button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {languages.map((lang, index) => (
                            <div key={index} className="flex gap-3 items-start animate-fade-in">
                                <Select
                                    value={lang.language}
                                    onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                                    options={LANGUAGES_OPTIONS}
                                    placeholder={t.profile.languages.select}
                                    className="flex-1"
                                />
                                <Select
                                    value={lang.proficiency}
                                    onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)}
                                    options={PROFICIENCY_LEVELS}
                                    className="flex-1"
                                />
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => removeLanguage(index)}
                                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Education */}
                <div className="bg-gray-50 dark:bg-dark-800/50 rounded-2xl p-6 border border-gray-100 dark:border-dark-700">
                    <div className="flex items-center justify-between mb-4">
                        <label className="label mb-0 flex items-center gap-2 text-lg">
                            <GraduationCap className="w-5 h-5 text-dark-400" />
                            {t.profile.education.title}
                        </label>
                        {education.length < 3 && (
                            <button
                                type="button"
                                onClick={addEducation}
                                className="btn-ghost btn-sm text-primary-600 dark:text-primary-400"
                            >
                                <Plus className="w-4 h-4 me-1" />
                                {t.profile.education.add}
                            </button>
                        )}
                    </div>
                    {education.length === 0 ? (
                        <div className="text-center py-8 bg-white dark:bg-dark-800 rounded-xl border border-dashed border-gray-200 dark:border-dark-600">
                            <GraduationCap className="w-10 h-10 text-gray-300 dark:text-dark-600 mx-auto mb-2" />
                            <p className="text-muted text-sm px-4">{t.profile.education.noEducation}</p>
                            <button
                                type="button"
                                onClick={addEducation}
                                className="text-primary-600 dark:text-primary-400 text-sm font-medium mt-3 hover:underline"
                            >
                                {t.profile.education.add}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {education.map((edu, index) => (
                                <div key={index} className="p-4 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 relative animate-fade-in group">
                                    <button
                                        type="button"
                                        onClick={() => removeEducation(index)}
                                        className="absolute top-2 end-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <Input
                                                value={edu.institution}
                                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                                placeholder={t.profile.education.institution}
                                            />
                                        </div>
                                        <Input
                                            value={edu.degree}
                                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                            placeholder={t.profile.education.degree}
                                        />
                                        <Input
                                            value={edu.field}
                                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                                            placeholder={t.profile.education.field}
                                        />
                                        <Input
                                            value={edu.startYear}
                                            onChange={(e) => updateEducation(index, 'startYear', e.target.value)}
                                            placeholder={t.profile.education.startYear}
                                            type="number"
                                        />
                                        <Input
                                            value={edu.endYear}
                                            onChange={(e) => updateEducation(index, 'endYear', e.target.value)}
                                            placeholder={t.profile.education.endYear}
                                            type="number"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-4">
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={onBack}
                        leftIcon={<BackArrowIcon className="w-5 h-5" />}
                    >
                        {t.common.back}
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        onClick={onNext}
                        isLoading={isLoading}
                        rightIcon={<ArrowIcon className="w-5 h-5" />}
                    >
                        {t.common.next}
                    </Button>
                </div>
            </div>
        </div>
    );
}
