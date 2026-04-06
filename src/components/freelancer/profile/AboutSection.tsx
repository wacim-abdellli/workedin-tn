import { useState } from 'react';
import { BookOpen, Pencil, X, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
    bio: string;
    isOwner?: boolean;
    onUpdate?: (bio: string) => void;
}

export default function AboutSection({ bio, isOwner, onUpdate }: Props) {
    const { tx } = useTranslation();
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(bio);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!user?.id) return;
        setSaving(true);
        await supabase.from('profiles').update({ bio: draft }).eq('id', user.id);
        setSaving(false);
        setEditing(false);
        onUpdate?.(draft);
    };

    const cancel = () => { setDraft(bio); setEditing(false); };

    return (
        <section className="group relative rounded-3xl overflow-hidden border-2 p-6 sm:p-8 transition-all duration-500 hover:shadow-2xl"
            style={{
                borderColor: editing
                    ? 'color-mix(in srgb, var(--workspace-primary) 50%, var(--color-border-subtle))'
                    : 'color-mix(in srgb, var(--workspace-primary) 20%, var(--color-border-subtle))',
                background: 'var(--color-background-elevated)',
                boxShadow: editing ? '0 0 0 3px color-mix(in srgb, var(--workspace-primary) 15%, transparent)' : '0 4px 20px -8px var(--workspace-primary-shadow)',
            }}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--workspace-primary)] via-[var(--workspace-accent)] to-[var(--workspace-primary)]" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'var(--workspace-primary)' }} />

            <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))' }}>
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--workspace-primary)' }}>
                                {tx('pages.freelancerProfile.sectionLabelIntro', undefined, 'Introduction')}
                            </p>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                {tx('settings.bioLabel', undefined, 'About me')}
                            </h2>
                        </div>
                    </div>

                    {/* Owner edit controls */}
                    {isOwner && !editing && (
                        <button onClick={() => setEditing(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg opacity-0 group-hover:opacity-100"
                            style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 30%, var(--color-border-subtle))', background: 'color-mix(in srgb, var(--workspace-primary) 8%, var(--color-background-elevated))', color: 'var(--workspace-primary)' }}
                        >
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
                                style={{ background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))' }}>
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                Save
                            </button>
                        </div>
                    )}
                </div>

                {editing ? (
                    <textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        rows={6}
                        autoFocus
                        className="w-full rounded-2xl border-2 p-4 text-sm leading-7 resize-none outline-none transition-all duration-200"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--workspace-primary) 40%, var(--color-border-subtle))',
                            background: 'var(--color-background-subtle)',
                            color: 'var(--color-text-primary)',
                        }}
                        placeholder={tx('settings.bioPlaceholder', undefined, 'Write something about yourself...')}
                    />
                ) : (
                    <p className="text-sm leading-8 whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>
                        {bio || (
                            <span className="italic" style={{ color: 'var(--color-text-tertiary)' }}>
                                {isOwner ? 'Click Edit to add your bio...' : tx('settings.noBio', undefined, 'No bio added yet')}
                            </span>
                        )}
                    </p>
                )}
            </div>
        </section>
    );
}
