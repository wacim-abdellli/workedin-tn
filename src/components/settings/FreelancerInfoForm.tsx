import { useState } from 'react';
import { Briefcase, DollarSign, Wrench, Timer, Repeat, FileText, Zap, Search, Check, X, Plus, Languages, Trash2, GraduationCap, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { TOOL_OPTIONS, INDUSTRY_OPTIONS } from '@/lib/constants/profileOptions';
import { PREDEFINED_SKILLS } from '@/types';

/** Extract a plain-text description from a stored jsonb preference field.
 *  The field may be a Record<string,unknown> or already a string.
 *  We only surface the `description` key to the user – hidden keys (like
 *  `onboarding_primary_goal`) are left untouched on save. */
function extractDescription(value: Record<string, unknown> | string | null | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return typeof value.description === 'string' ? value.description : '';
}

/** Merge user-typed text back into the existing jsonb object without
 *  overwriting other hidden keys (e.g. onboarding_primary_goal). */
function mergeDescription(
    existing: Record<string, unknown> | string | null | undefined,
    text: string
): Record<string, unknown> {
    const base = existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    return { ...base, description: text };
}

export interface FreelancerFormData {
    title: string;
    hourly_rate: string;
    availability: 'available' | 'busy' | 'offline';
    years_experience: string;
    tools: string[];
    industries: string[];
    portfolio_links: string;
    weekly_availability_hours: string;
    revision_policy: string;
    project_preferences: string;
    skills: string[];
    languages: { language: string; proficiency: 'native' | 'fluent' | 'conversational' | 'basic' }[];
    education: { institution: string; degree: string; field: string; startYear: string; endYear: string }[];
}

interface FreelancerInfoFormProps {
    /** Controlled from parent (ProfileSettings) so it can manage the global save state */
    form: FreelancerFormData;
    onChange: (next: FreelancerFormData) => void;
}

export function buildFreelancerInitialForm(
    fp: ReturnType<typeof import('@/contexts/AuthContext').useAuth>['freelancerProfile']
): FreelancerFormData {
    const resolvedSkills = (fp?.skills || []).map(s => {
        if (!s) return '';
        if (typeof s === 'string') return s;
        return (s as any).name || (s as any).id || '';
    }).filter(Boolean);

    return {
        title: fp?.title || '',
        hourly_rate: fp?.hourly_rate?.toString() || '',
        availability: fp?.availability || 'available',
        years_experience: fp?.years_experience?.toString() || '',
        tools: fp?.tools || [],
        industries: fp?.industries || [],
        portfolio_links: fp?.portfolio_links?.join(', ') || '',
        weekly_availability_hours: fp?.weekly_availability_hours?.toString() || '',
        revision_policy: fp?.revision_policy || '',
        project_preferences: extractDescription(fp?.project_preferences as Record<string,unknown>),
        skills: resolvedSkills,
        languages: Array.isArray(fp?.languages) ? fp.languages as any : [],
        education: Array.isArray(fp?.education) ? fp.education as any : [],
    };
}

const COMMON_LANGUAGES = [
    { value: 'English', label: 'English' },
    { value: 'French', label: 'French' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'German', label: 'German' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Russian', label: 'Russian' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Turkish', label: 'Turkish' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Korean', label: 'Korean' },
    { value: 'Dutch', label: 'Dutch' },
    { value: 'Polish', label: 'Polish' },
    { value: 'Swedish', label: 'Swedish' },
    { value: 'Norwegian', label: 'Norwegian' },
    { value: 'Danish', label: 'Danish' },
    { value: 'Finnish', label: 'Finnish' },
    { value: 'Romanian', label: 'Romanian' },
    { value: 'Greek', label: 'Greek' },
    { value: 'Ukrainian', label: 'Ukrainian' },
];

export function FreelancerInfoForm({ form, onChange }: FreelancerInfoFormProps) {
    const { t, tx } = useTranslation();
    const navigate = useNavigate();
    const [skillsSearch, setSkillsSearch] = useState('');

    const set = (patch: Partial<FreelancerFormData>) => onChange({ ...form, ...patch });

    const toggleOption = (field: 'tools' | 'industries', value: string, max: number) => {
        const current = form[field];
        const exists = current.includes(value);
        const next = exists
            ? current.filter(e => e !== value)
            : current.length < max ? [...current, value] : current;
        set({ [field]: next });
    };

    const AVAILABILITY_OPTIONS = [
        { value: 'available', label: t.publicProfile.available },
        { value: 'busy', label: t.publicProfile.busy },
        { value: 'offline', label: t.publicProfile.offline },
    ];

    const matchingPredefined = PREDEFINED_SKILLS.filter(skill =>
        skill.name_en.toLowerCase().includes(skillsSearch.toLowerCase()) ||
        skill.id.toLowerCase().includes(skillsSearch.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* General Professional Info Card */}
            <div className="rounded-2xl border border-gray-150 dark:border-white/[0.04] p-5 space-y-5 bg-white/[0.01] dark:bg-zinc-900/[0.05]">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-150 dark:border-white/[0.04]">
                    <Briefcase className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tx('profile.generalInfo', undefined, 'General Professional Info')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div id="field-title" className="transition-all duration-300 rounded-xl p-0.5">
                        <Input
                            label={tx('profile.headline', undefined, 'Professional title')}
                            value={form.title}
                            onChange={e => set({ title: e.target.value })}
                            placeholder={tx('profile.headlinePlaceholder', undefined, 'UI/UX Designer, Full-stack Developer...')}
                            leftIcon={<Briefcase className="w-4 h-4 text-purple-400" />}
                        />
                    </div>

                    <div id="field-availability" className="relative z-40 transition-all duration-300 rounded-xl p-0.5">
                        <CustomSelect
                            name="availability"
                            label={tx('profile.availability', undefined, 'Availability')}
                            options={AVAILABILITY_OPTIONS}
                            variant="freelancer"
                            value={form.availability}
                            onChange={value => set({ availability: value as 'available' | 'busy' | 'offline' })}
                        />
                    </div>

                    <div id="field-hourly_rate" className="transition-all duration-300 rounded-xl p-0.5">
                        <Input
                            label={tx('profile.hourlyRate', { currency: tx('common.tnd', undefined, 'TND') }, `Hourly rate (${tx('common.tnd', undefined, 'TND')}/hr)`)}
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.hourly_rate}
                            onChange={e => set({ hourly_rate: e.target.value })}
                            placeholder={tx('profile.hourlyRatePlaceholder', undefined, 'e.g. 35')}
                            leftIcon={<DollarSign className="w-4 h-4 text-purple-400" />}
                        />
                    </div>

                    <div id="field-years_experience" className="transition-all duration-300 rounded-xl p-0.5">
                        <Input
                            label={tx('profile.yearsExperience', undefined, 'Years of experience')}
                            type="number"
                            min="0"
                            value={form.years_experience}
                            onChange={e => set({ years_experience: e.target.value })}
                            placeholder={tx('profile.yearsExperiencePlaceholder', undefined, 'e.g. 3')}
                        />
                    </div>

                    <div id="field-weekly_availability_hours" className="md:col-span-2 transition-all duration-300 rounded-xl p-0.5">
                        <Input
                            label={tx('profile.weeklyAvailability', undefined, 'Weekly availability (hrs)')}
                            type="number"
                            min="1"
                            max="168"
                            value={form.weekly_availability_hours}
                            onChange={e => set({ weekly_availability_hours: e.target.value })}
                            placeholder={tx('profile.weeklyAvailabilityPlaceholder', undefined, 'e.g. 30')}
                            leftIcon={<Timer className="w-4 h-4 text-purple-400" />}
                        />
                    </div>
                </div>
            </div>

            {/* Taxonomy & Skills Card */}
            <div className="rounded-2xl border border-gray-150 dark:border-white/[0.04] p-5 space-y-6 bg-white/[0.01] dark:bg-zinc-900/[0.05]">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-150 dark:border-white/[0.04]">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tx('profile.skillsTitle', undefined, 'Expertise & Skills')}</h3>
                </div>

                {/* Skills Section */}
                <div id="field-skills" className="space-y-3 transition-all duration-300 rounded-xl p-0.5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                            {tx('profile.skillsSpec', undefined, 'Skills you specialize in')}
                        </p>
                        <span className="text-[10px] font-bold text-purple-400 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                            {tx('profile.skillsLimit', { count: form.skills.length }, `${form.skills.length}/10 selected`)}
                        </span>
                    </div>

                    {/* Selected Skills Bar */}
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-xl border border-gray-200/60 dark:border-white/[0.04] bg-gray-50/50 dark:bg-black/10">
                        {form.skills.length === 0 ? (
                            <span className="text-xs text-gray-400 dark:text-zinc-500">{tx('profile.noSkills', undefined, 'No skills selected yet. Search below to add skills.')}</span>
                        ) : (
                            form.skills.map(skillId => {
                                const skill = PREDEFINED_SKILLS.find(s => s.id === skillId);
                                const label = skill?.name_en || skillId;
                                return (
                                    <span key={skillId} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300">
                                        {label}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                set({ skills: form.skills.filter(id => id !== skillId) });
                                            }}
                                            className="p-0.5 rounded-md hover:bg-purple-500/20 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                );
                            })
                        )}
                    </div>

                    {/* Search Field */}
                    <div className="relative">
                        <Input
                            label={tx('profile.searchSkills', undefined, 'Search skills to add')}
                            value={skillsSearch}
                            onChange={e => setSkillsSearch(e.target.value)}
                            placeholder={tx('profile.searchSkillsPlaceholder', undefined, 'Type to search e.g. React, UI/UX...')}
                            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                        />
                    </div>

                    {/* Inline Search Results or Suggestions */}
                    {skillsSearch.trim() ? (
                        <div className="space-y-1.5 p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50/20 dark:bg-black/5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{tx('profile.searchResults', undefined, 'Search Results')}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {matchingPredefined.slice(0, 10).map(skill => {
                                    const isSelected = form.skills.includes(skill.id);
                                    return (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    set({ skills: form.skills.filter(id => id !== skill.id) });
                                                } else if (form.skills.length < 10) {
                                                    set({ skills: [...form.skills, skill.id] });
                                                }
                                            }}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                                                isSelected
                                                    ? 'border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-300'
                                                    : 'border-gray-200 dark:border-white/[0.04] text-gray-500 dark:text-zinc-400 bg-white dark:bg-transparent hover:border-purple-500/30'
                                            }`}
                                        >
                                            <span>{skill.name_en}</span>
                                            {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                        </button>
                                    );
                                })}
                                {matchingPredefined.length === 0 && (
                                    <span className="text-xs text-gray-400 dark:text-zinc-500">{tx('profile.noMatchingSkills', undefined, 'No matching skills found.')}</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">{tx('profile.suggestedSkills', undefined, 'Suggested Skills')}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {PREDEFINED_SKILLS.slice(0, 12).map(skill => {
                                    const isSelected = form.skills.includes(skill.id);
                                    return (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    set({ skills: form.skills.filter(id => id !== skill.id) });
                                                } else if (form.skills.length < 10) {
                                                    set({ skills: [...form.skills, skill.id] });
                                                }
                                            }}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                                                isSelected
                                                    ? 'border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-300'
                                                    : 'border-gray-200 dark:border-white/[0.04] text-gray-500 dark:text-zinc-400 bg-white dark:bg-transparent hover:border-purple-500/30'
                                            }`}
                                        >
                                            <span>{skill.name_en}</span>
                                            {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tools Section */}
                <div id="field-tools" className="space-y-3 transition-all duration-300 rounded-xl p-0.5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5" />
                            {tx('profile.toolsTitle', undefined, 'Tools you use')}
                        </p>
                        <span className="text-[10px] font-bold text-purple-400 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                            {tx('profile.toolsLimit', { count: form.tools.length }, `${form.tools.length}/6 selected`)}
                        </span>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200/50 dark:border-white/[0.04] bg-gray-50/50 dark:bg-black/10 flex flex-wrap gap-1.5">
                        {TOOL_OPTIONS.map(tool => {
                            const isSelected = form.tools.includes(tool);
                            return (
                                <button
                                    key={tool}
                                    type="button"
                                    onClick={() => toggleOption('tools', tool, 6)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                        isSelected
                                            ? 'border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-300 shadow-sm'
                                            : 'border-gray-200 dark:border-white/[0.04] text-gray-500 dark:text-zinc-400 bg-white dark:bg-transparent hover:border-purple-500/40 hover:text-purple-600 dark:hover:text-purple-300'
                                    }`}
                                >
                                    {tool}
                                </button>
                              );
                        })}
                    </div>
                </div>

                {/* Industries Section */}
                <div id="field-industries" className="space-y-3 transition-all duration-300 rounded-xl p-0.5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            {tx('profile.industriesTitle', undefined, 'Industries')}
                        </p>
                        <span className="text-[10px] font-bold text-purple-400 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                            {tx('profile.industriesLimit', { count: form.industries.length }, `${form.industries.length}/4 selected`)}
                        </span>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200/50 dark:border-white/[0.04] bg-gray-50/50 dark:bg-black/10 flex flex-wrap gap-1.5">
                        {INDUSTRY_OPTIONS.map(industry => {
                            const isSelected = form.industries.includes(industry);
                            return (
                                <button
                                    key={industry}
                                    type="button"
                                    onClick={() => toggleOption('industries', industry, 4)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                        isSelected
                                            ? 'border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-300 shadow-sm'
                                            : 'border-gray-200 dark:border-white/[0.04] text-gray-500 dark:text-zinc-400 bg-white dark:bg-transparent hover:border-purple-500/40 hover:text-purple-600 dark:hover:text-purple-300'
                                    }`}
                                >
                                    {industry}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Languages Card */}
            <div id="field-languages" className="rounded-2xl border border-gray-150 dark:border-white/[0.04] p-5 space-y-5 bg-white/[0.01] dark:bg-zinc-900/[0.05] transition-all duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tx('profile.languages.title', undefined, 'Languages')}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            set({ languages: [...form.languages, { language: '', proficiency: 'fluent' }] });
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {tx('profile.addLanguage', undefined, 'Add Language')}
                    </button>
                </div>

                {form.languages.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{tx('profile.noLanguages', undefined, 'No languages listed. Click "Add Language" to add.')}</p>
                ) : (
                    <div className="space-y-3">
                        {form.languages.map((lang, index) => (
                            <div key={index} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/30 dark:bg-black/5">
                                <div className="flex-1 min-w-[150px]">
                                    <select
                                        value={lang.language}
                                        onChange={e => {
                                            const updated = [...form.languages];
                                            updated[index] = { ...lang, language: e.target.value };
                                            set({ languages: updated });
                                        }}
                                        className="w-full h-9 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] text-xs px-2.5 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="" disabled>{tx('profile.selectLanguagePlaceholder', undefined, 'Select language...')}</option>
                                        {COMMON_LANGUAGES.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.value === 'English' ? tx('profile.languages.names.english', undefined, 'English')
                                                 : option.value === 'French' ? tx('profile.languages.names.french', undefined, 'French')
                                                 : option.value === 'Arabic' ? tx('profile.languages.names.arabic', undefined, 'Arabic')
                                                 : option.label}
                                            </option>
                                        ))}
                                        {lang.language && !COMMON_LANGUAGES.some(o => o.value === lang.language) && (
                                            <option value={lang.language}>{lang.language}</option>
                                        )}
                                    </select>
                                </div>
                                <div className="w-40">
                                    <select
                                        value={lang.proficiency}
                                        onChange={e => {
                                            const updated = [...form.languages];
                                            updated[index] = { ...lang, proficiency: e.target.value as any };
                                            set({ languages: updated });
                                        }}
                                        className="w-full h-9 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] text-xs px-2.5 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="basic">{tx('profile.languages.levels.basic', undefined, 'Basic')}</option>
                                        <option value="conversational">{tx('profile.languages.levels.conversational', undefined, 'Conversational')}</option>
                                        <option value="fluent">{tx('profile.languages.levels.fluent', undefined, 'Fluent')}</option>
                                        <option value="native">{tx('profile.languages.levels.nativeBilingual', undefined, 'Native or Bilingual')}</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        set({ languages: form.languages.filter((_, i) => i !== index) });
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Education Card */}
            <div id="field-education" className="rounded-2xl border border-gray-150 dark:border-white/[0.04] p-5 space-y-5 bg-white/[0.01] dark:bg-zinc-900/[0.05] transition-all duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tx('profile.education.title', undefined, 'Education')}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            set({
                                education: [
                                    ...form.education,
                                    { institution: '', degree: '', field: '', startYear: '', endYear: '' }
                                ]
                            });
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {tx('profile.education.add', undefined, 'Add Education')}
                    </button>
                </div>

                {form.education.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{tx('profile.education.noEducationList', undefined, 'No education details listed. Click "Add Education" to add.')}</p>
                ) : (
                    <div className="space-y-4">
                        {form.education.map((edu, index) => (
                            <div key={index} className="p-4 rounded-xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/30 dark:bg-black/5 space-y-3 relative group">
                                <button
                                    type="button"
                                    onClick={() => {
                                        set({ education: form.education.filter((_, i) => i !== index) });
                                    }}
                                    className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                                    <Input
                                        label={tx('profile.education.institution', undefined, 'Institution')}
                                        placeholder={tx('profile.education.institutionPlaceholder', undefined, 'e.g. University of Tunis')}
                                        value={edu.institution}
                                        onChange={e => {
                                            const updated = [...form.education];
                                            updated[index] = { ...edu, institution: e.target.value };
                                            set({ education: updated });
                                        }}
                                        className="h-9 text-xs"
                                    />
                                    <Input
                                        label={tx('profile.education.degree', undefined, 'Degree')}
                                        placeholder={tx('profile.education.degreePlaceholder', undefined, "e.g. Bachelor's, Master's")}
                                        value={edu.degree}
                                        onChange={e => {
                                            const updated = [...form.education];
                                            updated[index] = { ...edu, degree: e.target.value };
                                            set({ education: updated });
                                        }}
                                        className="h-9 text-xs"
                                    />
                                    <Input
                                        label={tx('profile.education.field', undefined, 'Field of study')}
                                        placeholder={tx('profile.education.fieldPlaceholder', undefined, 'e.g. Computer Science')}
                                        value={edu.field}
                                        onChange={e => {
                                            const updated = [...form.education];
                                            updated[index] = { ...edu, field: e.target.value };
                                            set({ education: updated });
                                        }}
                                        className="h-9 text-xs"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            label={tx('profile.education.startYear', undefined, 'Start Year')}
                                            placeholder={tx('profile.education.startYearPlaceholder', undefined, 'e.g. 2020')}
                                            value={edu.startYear}
                                            onChange={e => {
                                                const updated = [...form.education];
                                                updated[index] = { ...edu, startYear: e.target.value };
                                                set({ education: updated });
                                            }}
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            label={tx('profile.education.endYear', undefined, 'End Year')}
                                            placeholder={tx('profile.education.endYearPlaceholder', undefined, 'e.g. 2023')}
                                            value={edu.endYear}
                                            onChange={e => {
                                                const updated = [...form.education];
                                                updated[index] = { ...edu, endYear: e.target.value };
                                                set({ education: updated });
                                            }}
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preferences & Work Deliverables Card */}
            <div className="rounded-2xl border border-gray-150 dark:border-white/[0.04] p-5 space-y-5 bg-white/[0.01] dark:bg-zinc-900/[0.05]">
                <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-white/[0.04] gap-2">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tx('profile.portfolioPreferencesTitle', undefined, 'Portfolio & Work Preferences')}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/freelancer/portfolio')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/30 transition-all active:scale-95 duration-200"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {tx('profile.managePortfolioWorks', undefined, 'Manage Portfolio Works')}
                    </button>
                </div>

                <div className="space-y-5">
                    <div id="field-portfolio_links" className="transition-all duration-300 rounded-xl p-0.5">
                        <Input
                            label={tx('profile.portfolioLinks', undefined, 'Portfolio links (comma separated)')}
                            value={form.portfolio_links}
                            onChange={e => set({ portfolio_links: e.target.value })}
                            placeholder={tx('profile.portfolioLinksPlaceholder', undefined, 'https://site.com/work-1, https://behance.net/mywork')}
                            leftIcon={<FileText className="w-4 h-4 text-purple-400" />}
                        />
                    </div>

                    <div id="field-revision_policy" className="transition-all duration-300 rounded-xl p-0.5">
                        <Input
                            label={tx('profile.revisionPolicy', undefined, 'Revision policy')}
                            value={form.revision_policy}
                            onChange={e => set({ revision_policy: e.target.value })}
                            placeholder={tx('profile.revisionPolicyPlaceholder', undefined, 'e.g. 2 revisions included, additional billed separately.')}
                            leftIcon={<Repeat className="w-4 h-4 text-purple-400" />}
                        />
                    </div>

                    <div id="field-project_preferences" className="transition-all duration-300 rounded-xl p-0.5">
                        <Input
                            as="textarea"
                            rows={4}
                            label={tx('profile.projectPreferences', undefined, 'Project preferences')}
                            value={form.project_preferences}
                            onChange={e => set({ project_preferences: e.target.value })}
                            placeholder={tx('profile.projectPreferencesPlaceholder', undefined, 'Describe ideal project size, communication style, and client type.')}
                            leftIcon={<FileText className="w-4 h-4 text-purple-400" />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export { extractDescription, mergeDescription };
