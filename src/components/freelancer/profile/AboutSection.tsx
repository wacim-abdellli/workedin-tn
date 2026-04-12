import { useState } from 'react';
import { Pencil, X, Check, Loader2 } from 'lucide-react';
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
    const accent = isOwner ? '#8B5CF6' : '#F59E0B';

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
        <section className="bg-[var(--card-bg)] rounded-2xl border border-white/7 p-6 md:p-7 mb-4 hover:border-white/12 transition-colors shadow-[0_25px_60px_-48px_rgba(0,0,0,0.9)]"
            style={{ borderColor: editing ? `color-mix(in srgb, ${accent} 35%, rgba(255,255,255,0.12))` : undefined }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ background: '#F59E0B' }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
                        {tx('pages.freelancerProfile.sectionLabelIntro', undefined, 'Introduction')}
                    </span>
                </div>

                {isOwner && !editing && (
                    <button onClick={() => setEditing(true)}
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
                        }}>
                        <Pencil className="h-3 w-3" /> {tx('ui.edit')}</button>
                )}
                {isOwner && editing && (
                    <div className="flex items-center gap-2">
                        <button onClick={cancel}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}>
                            <X className="h-3 w-3" /> {tx('ui.cancel')}</button>
                        <button onClick={save} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-60"
                            style={{ background: accent }}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            {tx('ui.save')}</button>
                    </div>
                )}
            </div>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">
                {tx('settings.bioLabel', undefined, 'About me')}
            </h2>

            {editing ? (
                <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={6} autoFocus
                    className="w-full rounded-xl border p-4 text-[15px] leading-7 resize-none outline-none transition-colors"
                    style={{
                        borderColor: 'var(--color-border-default)',
                        background: 'var(--color-background-subtle)',
                        color: 'var(--color-text-primary)',
                    }}
                    placeholder={tx('settings.bioPlaceholder', undefined, 'Write something about yourself...')}
                />
            ) : (
                bio ? (
                    <p className="text-[15px] leading-8 whitespace-pre-line text-[var(--text-secondary)]">{bio}</p>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-white/10 bg-white/2">
                        <p className="text-sm text-[var(--text-muted)] text-center">
                            {isOwner ? tx('settings.noBio', undefined, 'No bio added yet') : tx('settings.noBio', undefined, 'No bio added yet')}
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
