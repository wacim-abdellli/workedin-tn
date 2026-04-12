import { useState, useMemo, useEffect } from 'react';
import { Pencil, X, Check, Search, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import type { Skill, SkillCategory } from '@/types';
import { PREDEFINED_SKILLS } from '@/types';
import { useTranslation } from '../../../i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Pre-calculate skills by category once at module load (performance optimization)
const SKILLS_BY_CATEGORY: Record<SkillCategory, Skill[]> = (() => {
    const grouped: Record<SkillCategory, Skill[]> = {
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
})();

interface Props {
    skills: Skill[];
    language: string;
    isOwner?: boolean;
    onUpdate?: (skills: Skill[]) => void;
}

export default function SkillsSection({ skills, language, isOwner, onUpdate }: Props) {
    const { tx } = useTranslation();
    const { user } = useAuth();
    const accent = isOwner ? '#8B5CF6' : '#F59E0B';
    const [editing, setEditing] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>(skills);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<SkillCategory>>(new Set(['design', 'development']));
    const [saving, setSaving] = useState(false);

    // Update selectedSkills when skills prop changes
    useEffect(() => {
        setSelectedSkills(skills);
    }, [skills]);

    const filteredSkillsByCategory = useMemo(() => {
        if (!searchQuery.trim()) return SKILLS_BY_CATEGORY;

        const query = searchQuery.toLowerCase();
        const filtered: Record<SkillCategory, Skill[]> = {
            design: [],
            development: [],
            writing: [],
            marketing: [],
            video: [],
            business: [],
            data: [],
            other: [],
        };

        Object.entries(SKILLS_BY_CATEGORY).forEach(([category, categorySkills]) => {
            filtered[category as SkillCategory] = categorySkills.filter(skill =>
                skill.name_en.toLowerCase().includes(query)
                || skill.name_ar.includes(query)
                || skill.name_fr.toLowerCase().includes(query)
            );
        });

        return filtered;
    }, [searchQuery]);

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

    const getSkillName = (skill: Skill): string => {
        switch (language) {
            case 'fr':
                return skill.name_fr;
            case 'en':
                return skill.name_en;
            default:
                return skill.name_ar;
        }
    };

    const toggleSkill = (skill: Skill) => {
        if (selectedSkills.find((s) => s.id === skill.id)) {
            setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
        } else if (selectedSkills.length < 15) {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    const save = async () => {
        if (!user?.id) return;
        setSaving(true);

        const skillEntries = selectedSkills.map(skill => ({
            name: skill.name_en,
            name_ar: skill.name_ar,
            name_fr: skill.name_fr,
            name_en: skill.name_en,
        }));

        await supabase.from('freelancer_profiles').update({ skills: skillEntries }).eq('id', user.id);
        setSaving(false);
        setEditing(false);
        onUpdate?.(selectedSkills);
    };

    const cancel = () => {
        setSelectedSkills(skills);
        setSearchQuery('');
        setEditing(false);
    };

    const displaySkills = editing ? selectedSkills : skills;

    return (
        <section
            className="bg-[var(--card-bg)] rounded-2xl border border-white/7 p-6 md:p-7 mb-4 hover:border-white/12 transition-colors shadow-[0_25px_60px_-48px_rgba(0,0,0,0.9)]"
            style={{ borderColor: editing ? `color-mix(in srgb, ${accent} 35%, rgba(255,255,255,0.12))` : undefined }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ background: '#F59E0B' }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
                        {tx('pages.freelancerProfile.sectionLabelSkills', undefined, 'Core strengths')}
                    </span>
                </div>

                {isOwner && !editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] px-3 py-1.5 rounded-lg border border-transparent transition-colors"
                        onMouseEnter={e => {
                            e.currentTarget.style.color = accent;
                            e.currentTarget.style.background = `color-mix(in srgb, ${accent} 5%, transparent)`;
                            e.currentTarget.style.borderColor = `color-mix(in srgb, ${accent} 25%, transparent)`;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                    >
                        <Pencil className="h-3 w-3" />
                        {tx('ui.edit')}
                    </button>
                )}
                {isOwner && editing && (
                    <div className="flex items-center gap-2">
                        <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                                background: selectedSkills.length === 15 ? accent : 'var(--surface-bg)',
                                color: selectedSkills.length === 15 ? '#0a0a0a' : 'var(--text-secondary)',
                            }}
                        >
                            {selectedSkills.length}/15
                        </span>
                        <button
                            onClick={cancel}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                        >
                            <X className="h-3 w-3" />
                            {tx('ui.cancel')}
                        </button>
                        <button
                            onClick={save}
                            disabled={saving || selectedSkills.length === 0}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-black disabled:opacity-60"
                            style={{ background: accent }}
                        >
                            <Check className="h-3 w-3" />
                            {tx('ui.save')}
                        </button>
                    </div>
                )}
            </div>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">
                {tx('findFreelancers.skills', undefined, 'Skills')}
            </h2>

            {editing ? (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder={tx('profile.searchSkills', undefined, 'Search skills...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none"
                            style={{
                                borderColor: 'var(--color-border-default)',
                                background: 'var(--surface-bg)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {(Object.entries(filteredSkillsByCategory) as [SkillCategory, typeof PREDEFINED_SKILLS][]).map(([category, categorySkills]) => {
                            if (categorySkills.length === 0) return null;

                            const isExpanded = expandedCategories.has(category);
                            const primarySkills = categorySkills.filter(s => s.isPrimary);
                            const secondarySkills = categorySkills.filter(s => !s.isPrimary);
                            const displayCategorySkills = isExpanded ? categorySkills : primarySkills;

                            return (
                                <div key={category} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border-default)' }}>
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
                                        style={{
                                            background: 'var(--surface-bg)',
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        <span className="text-xs font-semibold" style={{ color: accent }}>
                                            {getCategoryLabel(category)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {categorySkills.filter(s => selectedSkills.find(sel => sel.id === s.id)).length}/{categorySkills.length}
                                            </span>
                                            {isExpanded ? <ChevronUp className="w-3 h-3 text-[var(--text-muted)]" /> : <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />}
                                        </div>
                                    </button>

                                    {displayCategorySkills.length > 0 && (
                                        <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                            {displayCategorySkills.map((skill) => {
                                                const isSelected = selectedSkills.find((s) => s.id === skill.id);
                                                return (
                                                    <button
                                                        key={skill.id}
                                                        type="button"
                                                        onClick={() => toggleSkill(skill)}
                                                        className="p-2 rounded-lg text-left transition-all text-xs font-medium flex items-center justify-between"
                                                        style={{
                                                            background: isSelected ? accent : 'var(--card-bg)',
                                                            color: isSelected ? '#0a0a0a' : 'var(--text-primary)',
                                                            borderWidth: '1px',
                                                            borderStyle: 'solid',
                                                            borderColor: isSelected ? accent : 'var(--color-border-default)',
                                                        }}
                                                    >
                                                        <span>{getSkillName(skill)}</span>
                                                        {isSelected ? <CheckCircle className="w-3 h-3 ml-1" /> : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {!isExpanded && secondarySkills.length > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(category)}
                                            className="w-full px-3 py-1.5 text-xs transition-colors"
                                            style={{ color: accent, background: 'var(--surface-bg)' }}
                                        >
                                            + {secondarySkills.length} {tx('profile.secondarySkills', undefined, 'more')}
                                        </button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                displaySkills.length > 0 ? (
                        <div className="flex flex-wrap">
                        {displaySkills.map((skill) => (
                            <span
                                key={skill.id}
                                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border mr-2 mb-2"
                                style={{
                                    background: `color-mix(in srgb, ${accent} 10%, transparent)`,
                                    color: accent,
                                    borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`,
                                }}
                            >
                                {getSkillName(skill)}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-white/10 bg-white/2">
                        <CheckCircle className="w-8 h-8 text-[var(--text-muted)] opacity-30 mb-2" />
                        <p className="text-sm text-[var(--text-muted)] text-center">
                            {tx('pages.freelancerProfile.noSkills', undefined, 'No skills added yet')}
                        </p>
                        {isOwner ? (
                            <button
                                type="button"
                                onClick={() => setEditing(true)}
                                className="mt-3 text-xs hover:underline font-medium"
                                style={{ color: accent }}
                            >
                                + {tx('ui.addNow', undefined, 'Add now')}
                            </button>
                        ) : null}
                    </div>
                )
            )}
        </section>
    );
}
