import { useState } from 'react';
import { Pencil, X, Check, Plus, Loader2 } from 'lucide-react';
import type { Skill } from '@/types';
import { useTranslation } from '../../../i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
    skills: Skill[];
    language: string;
    isOwner?: boolean;
    onUpdate?: (skills: Skill[]) => void;
}

export default function SkillsSection({ skills, language, isOwner, onUpdate }: Props) {
    const { tx } = useTranslation();
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<string[]>(skills.map(s => s.name_en));
    const [input, setInput] = useState('');
    const [saving, setSaving] = useState(false);

    const addSkill = () => {
        const trimmed = input.trim();
        if (trimmed && !draft.includes(trimmed)) setDraft(prev => [...prev, trimmed]);
        setInput('');
    };

    const removeSkill = (name: string) => setDraft(prev => prev.filter(s => s !== name));

    const save = async () => {
        if (!user?.id) return;
        setSaving(true);
        await supabase.from('freelancer_profiles').update({ skills: draft.map(name => ({ name })) }).eq('id', user.id);
        setSaving(false);
        setEditing(false);
        onUpdate?.(draft.map((name, i) => ({ id: String(i), name_en: name, name_ar: name, name_fr: name })));
    };

    const cancel = () => { setDraft(skills.map(s => s.name_en)); setEditing(false); };

    const displayNames = editing ? draft : skills.map(s =>
        language === 'ar' ? s.name_ar : language === 'fr' ? s.name_fr : s.name_en
    );

    return (
        <section className="rounded-xl border p-5 sm:p-6"
            style={{
                background: 'var(--color-background-elevated)',
                borderColor: editing ? 'var(--workspace-primary)' : 'var(--color-border-subtle)',
                outline: editing ? '2px solid color-mix(in srgb, var(--workspace-primary) 20%, transparent)' : 'none',
                outlineOffset: '2px',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                        style={{ color: 'var(--workspace-primary)' }}>
                        {tx('pages.freelancerProfile.sectionLabelSkills', undefined, 'Core strengths')}
                    </p>
                    <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {tx('findFreelancers.skills', undefined, 'Skills')}
                    </h2>
                </div>

                {isOwner && !editing && (
                    <button onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                        style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--workspace-primary)'; e.currentTarget.style.color = 'var(--workspace-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}>
                        <Pencil className="h-3 w-3" /> Edit
                    </button>
                )}
                {isOwner && editing && (
                    <div className="flex items-center gap-2">
                        <button onClick={cancel}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}>
                            <X className="h-3 w-3" /> Cancel
                        </button>
                        <button onClick={save} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                            style={{ background: 'var(--workspace-primary)' }}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Save
                        </button>
                    </div>
                )}
            </div>

            {displayNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {displayNames.map((name) => (
                        <span key={name}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 25%, var(--color-border-subtle))',
                                background: 'color-mix(in srgb, var(--workspace-primary) 8%, var(--color-background-subtle))',
                                color: 'var(--workspace-primary)',
                            }}>
                            {name}
                            {editing && (
                                <button onClick={() => removeSkill(name)}
                                    className="hover:opacity-60 transition-opacity ml-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </span>
                    ))}
                    {editing && (
                        <div className="flex items-center gap-1.5">
                            <input value={input} onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder={tx('pages.freelancerProfile.addSkillPlaceholder', undefined, 'Add skill...')}
                                className="px-3 py-1.5 rounded-lg border text-sm outline-none w-28"
                                style={{ borderColor: 'var(--color-border-default)', background: 'var(--color-background-subtle)', color: 'var(--color-text-primary)' }}
                            />
                            <button onClick={addSkill}
                                className="p-1.5 rounded-lg border transition-colors"
                                style={{ borderColor: 'var(--color-border-default)', color: 'var(--workspace-primary)' }}>
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-8 text-center rounded-lg border border-dashed"
                    style={{ borderColor: 'var(--color-border-default)', background: 'var(--color-background-subtle)' }}>
                    {editing ? (
                        <div className="flex items-center justify-center gap-1.5">
                            <input value={input} onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder={tx('pages.freelancerProfile.typeSkillPlaceholder', undefined, 'Type a skill and press Enter...')}
                                className="px-3 py-1.5 rounded-lg border text-sm outline-none w-48"
                                style={{ borderColor: 'var(--color-border-default)', background: 'var(--color-background-elevated)', color: 'var(--color-text-primary)' }}
                                autoFocus
                            />
                            <button onClick={addSkill}
                                className="p-1.5 rounded-lg border"
                                style={{ borderColor: 'var(--color-border-default)', color: 'var(--workspace-primary)' }}>
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm italic" style={{ color: 'var(--color-text-tertiary)' }}>
                            {isOwner ? 'Click Edit to add your skills' : tx('pages.freelancerProfile.noSkills', undefined, 'No skills added yet')}
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}
