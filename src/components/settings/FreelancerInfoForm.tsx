import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, Wrench, Timer, Repeat, FileText, Zap } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
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
    };
}

export function FreelancerInfoForm({ form, onChange }: FreelancerInfoFormProps) {
    const { t, tx } = useTranslation();

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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                    label={tx('profile.headline', undefined, 'Professional title')}
                    value={form.title}
                    onChange={e => set({ title: e.target.value })}
                    placeholder={tx('profile.headlinePlaceholder', undefined, 'UI/UX Designer, Full-stack Developer...')}
                    leftIcon={<Briefcase className="w-4 h-4" />}
                />

                <div className="relative z-40">
                    <CustomSelect
                        name="availability"
                        label={tx('profile.availability', undefined, 'Availability')}
                        options={AVAILABILITY_OPTIONS}
                        variant="freelancer"
                        value={form.availability}
                        onChange={value => set({ availability: value as 'available' | 'busy' | 'offline' })}
                    />
                </div>

                <Input
                    label={tx('onboarding.freelancer.hourlyRateLabel', undefined, `Hourly rate (${t.common.tnd}/hr)`)}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.hourly_rate}
                    onChange={e => set({ hourly_rate: e.target.value })}
                    placeholder="e.g. 35"
                    leftIcon={<DollarSign className="w-4 h-4" />}
                />

                <Input
                    label={tx('profile.yearsExperience', undefined, 'Years of experience')}
                    type="number"
                    min="0"
                    value={form.years_experience}
                    onChange={e => set({ years_experience: e.target.value })}
                    placeholder="e.g. 3"
                />
            </div>

            {/* Skills picker */}
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-elevated)' }}>
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Zap className="w-4 h-4 text-purple-400" />
                        Skills you specialize in
                    </p>
                    <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        {form.skills.length}/10
                    </span>
                </div>
                
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    {Object.entries(
                        PREDEFINED_SKILLS.reduce((groups, skill) => {
                            const cat = skill.category || 'other';
                            if (!groups[cat]) groups[cat] = [];
                            groups[cat].push(skill);
                            return groups;
                        }, {} as Record<string, typeof PREDEFINED_SKILLS>)
                    ).map(([category, skills]) => (
                        <div key={category} className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                                {category.replace(/_/g, ' ')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {skills.map(skill => {
                                    const isSelected = form.skills.includes(skill.id);
                                    return (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            onClick={() => {
                                                const current = form.skills;
                                                const exists = current.includes(skill.id);
                                                const next = exists
                                                    ? current.filter(id => id !== skill.id)
                                                    : current.length < 10 ? [...current, skill.id] : current;
                                                set({ skills: next });
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                                                isSelected
                                                    ? 'border-purple-500/50 bg-purple-500/20 text-purple-200'
                                                    : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-purple-500/40 hover:text-purple-300'
                                            }`}
                                        >
                                            {skill.name_en}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tools picker */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-elevated)' }}>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Wrench className="w-4 h-4 text-purple-400" />
                        {tx('profile.tools', undefined, 'Tools you use')}
                    </p>
                    <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        {form.tools.length}/6
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {TOOL_OPTIONS.map(tool => {
                        const isSelected = form.tools.includes(tool);
                        return (
                            <button
                                key={tool}
                                type="button"
                                onClick={() => toggleOption('tools', tool, 6)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                                    isSelected
                                        ? 'border-purple-500/50 bg-purple-500/20 text-purple-200'
                                        : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-purple-500/40 hover:text-purple-300'
                                }`}
                            >
                                {tool}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Industries picker */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-elevated)' }}>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        {tx('profile.industries', undefined, 'Industries')}
                    </p>
                    <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        {form.industries.length}/4
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {INDUSTRY_OPTIONS.map(industry => {
                        const isSelected = form.industries.includes(industry);
                        return (
                            <button
                                key={industry}
                                type="button"
                                onClick={() => toggleOption('industries', industry, 4)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                                    isSelected
                                        ? 'border-purple-500/50 bg-purple-500/20 text-purple-200'
                                        : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-purple-500/40 hover:text-purple-300'
                                }`}
                            >
                                {industry}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <Input
                        label={tx('profile.portfolioLinks', undefined, 'Portfolio links (comma separated)')}
                        value={form.portfolio_links}
                        onChange={e => set({ portfolio_links: e.target.value })}
                        placeholder="https://site.com/work-1, https://behance.net/mywork"
                    />
                </div>

                <Input
                    label={tx('profile.weeklyAvailabilityHours', undefined, 'Weekly availability (hrs)')}
                    type="number"
                    min="1"
                    max="168"
                    value={form.weekly_availability_hours}
                    onChange={e => set({ weekly_availability_hours: e.target.value })}
                    placeholder="e.g. 30"
                    leftIcon={<Timer className="w-4 h-4" />}
                />

                <div />

                <div className="md:col-span-2">
                    <Input
                        as="textarea"
                        rows={3}
                        label={tx('profile.revisionPolicy', undefined, 'Revision policy')}
                        value={form.revision_policy}
                        onChange={e => set({ revision_policy: e.target.value })}
                        placeholder={tx('profile.revisionPolicyPlaceholder', undefined, 'e.g. 2 revisions included, additional billed separately.')}
                        leftIcon={<Repeat className="w-4 h-4" />}
                    />
                </div>

                <div className="md:col-span-2">
                    <Input
                        as="textarea"
                        rows={4}
                        label={tx('profile.projectPreferences', undefined, 'Project preferences')}
                        value={form.project_preferences}
                        onChange={e => set({ project_preferences: e.target.value })}
                        placeholder={tx('profile.projectPreferencesPlaceholder', undefined, 'Describe ideal project size, communication style, and client type.')}
                        leftIcon={<FileText className="w-4 h-4" />}
                    />
                </div>
            </div>
        </div>
    );
}

export { extractDescription, mergeDescription };
