import { useState } from 'react';
import { Zap, Pencil, X, Check, Plus, Loader2 } from 'lucide-react';
import type { Skill } from '@/types';
import { useTranslation } from '../../../i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const SKILL_COLORS = [
    { bg: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)', border: 'color-mix(in srgb, var(--workspace-primary) 30%, transparent)', color: 'var(--workspace-primary)' },
    { bg: 'color-mix(in srgb, #3b82f6 12%, transparent)', border: 'color-mix(in srgb, #3b82f6 30%, transparent)', color: '#3b82f6' },
    { bg: 'color-mix(in srgb, #10b981 12%, transparent)', border: 'color-mix(in srgb, #10b981 30%, transparent)', color: '#10b981' },
    { bg: 'color-mix(in srgb, #f59e0b 12%, transparent)', border: 'color-mix(in srgb, #f59e0b 30%, transparent)', color: '#f59e0b' },
    { bg: 'color-mix(in srgb, #ec4899 12%, transparent)', border: 'color-mix(in srgb, #ec4899 30%, transparent)', color: '#ec4899' },
    { bg: 'color-mix(in srgb, #8b5cf6 12%, transparent)', border: 'color-mix(in srgb, #8b5cf6 30%, transparent)', color: '#8b5cf6' },
];

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
        if (trimmed && !draft.includes(trimmed)) {
            setDraft(prev => [...prev, trimmed]);
        }
        setInput('');
    };

    const removeSkill = (name: string) => setDraft(prev => prev.filter(s => s !== name));

    const save = async () => {
        if (!user?.id) return;
        setSaving(true);
        const skillsJson = draft.map(name => ({ name }));
        await supabase.from('freelancer_profiles').update({ skills: skillsJson }).eq('id', user.id);
        setSaving(false);
        setEditing(false);
        const updated: Skill[] = draft.map((name, i) => ({ id: String(i), name_en: name, name_ar: name, name_fr: name }));
        onUpdate?.(updated);
    };

    const cancel = () => { setDraft(skills.map(s => s.name_en)); setEditing(false); };

    return (
        <section className="group relative rounded-3xl overflow-hidden border-2 p-6 sm:p-8 transition-all duration-500 hover:shadow-2xl"
            style={{
                borderColor: editing ? 'color-mix(in srgb, #3b82f6 50%, var(--color-border-subtle))' : 'color-mix(in srgb, #3b82f6 20%, var(--color-border-subtle))',
                background: 'var(--color-background-elevated)',
                boxShadow: editing ? '0 0 0 3px color-mix(in srgb, #3b82f6 15%, transparent)' : '0 4px 20px -8px rgba(59,130,246,0.25)',
            }}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ec4899]" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} />

            <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#3b82f6' }}>
                                {tx('pages.freelancerProfile.sectionLabelSkills', undefined, 'Core strengths')}
                            </p>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                {tx('findFreelancers.skills', undefined, 'Skills')}
                            </h2>
                        </div>
                    </div>

                    {isOwner && !editing && (
                        <button onClick={() => setEditing(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg opacity-0 group-hover:opacity-100"
                            style={{ borderColor: 'color-mix(in srgb, #3b82f6 30%, var(--color-border-subtle))', background: 'color-mix(in srgb, #3b82f6 8%, var(--color-background-elevated))', color: '#3b82f6' }}>
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                    )}
                    {isOwner && editing && (
                        <div className="flex items-center gap-2">
                            <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-200 hover:scale-105"
                                style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
                                <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                            <button onClick={save} disabled={saving}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                Save
                            </button>
                        </div>
                    )}
                </div>

                {/* Skills display / edit */}
                <div className="flex flex-wrap gap-2.5">
                    {(editing ? draft : skills.map(s => language === 'ar' ? s.name_ar : language === 'fr' ? s.name_fr : s.name_en)).map((name, i) => {
                        const c = SKILL_COLORS[i % SKILL_COLORS.length];
                        return (
                            <span key={name}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                style={{ background: c.bg, borderColor: c.border, color: c.color }}
                            >
                                {name}
                                {editing && (
                                    <button onClick={() => removeSkill(name)} className="ml-1 hover:opacity-70 transition-opacity">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </span>
                        );
                    })}

                    {editing && (
                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Add skill..."
                                className="px-3 py-2 rounded-xl border-2 text-sm font-medium outline-none transition-all duration-200 w-32"
                                style={{ borderColor: 'color-mix(in srgb, #3b82f6 40%, var(--color-border-subtle))', background: 'var(--color-background-subtle)', color: 'var(--color-text-primary)' }}
                            />
                            <button onClick={addSkill}
                                className="p-2 rounded-xl border-2 transition-all duration-200 hover:scale-110"
                                style={{ borderColor: 'color-mix(in srgb, #3b82f6 30%, var(--color-border-subtle))', background: 'color-mix(in srgb, #3b82f6 10%, transparent)', color: '#3b82f6' }}>
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {!editing && skills.length === 0 && (
                    <div className="text-center py-10 rounded-2xl border-2 border-dashed"
                        style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)' }}>
                        <p className="text-sm font-medium italic" style={{ color: 'var(--color-text-tertiary)' }}>
                            {isOwner ? 'Hover and click Edit to add your skills...' : tx('pages.freelancerProfile.noSkills', undefined, 'No skills added yet')}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
