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
        <section className="rounded-xl border p-5 sm:p-6"
            style={{
                background: 'var(--color-background-elevated)',
                borderColor: editing
                    ? 'var(--workspace-primary)'
                    : 'var(--color-border-subtle)',
                outline: editing ? '2px solid color-mix(in srgb, var(--workspace-primary) 20%, transparent)' : 'none',
                outlineOffset: '2px',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                        style={{ color: 'var(--workspace-primary)' }}>
                        {tx('pages.freelancerProfile.sectionLabelIntro', undefined, 'Introduction')}
                    </p>
                    <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {tx('settings.bioLabel', undefined, 'About me')}
                    </h2>
                </div>

                {isOwner && !editing && (
                    <button onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                        style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', background: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--workspace-primary)'; e.currentTarget.style.color = 'var(--workspace-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}>
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
                            style={{ background: 'var(--workspace-primary)' }}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            {tx('ui.save')}</button>
                    </div>
                )}
            </div>

            {editing ? (
                <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={6} autoFocus
                    className="w-full rounded-lg border p-3 text-sm leading-7 resize-none outline-none transition-colors"
                    style={{
                        borderColor: 'var(--color-border-default)',
                        background: 'var(--color-background-subtle)',
                        color: 'var(--color-text-primary)',
                    }}
                    placeholder={tx('settings.bioPlaceholder', undefined, 'Write something about yourself...')}
                />
            ) : (
                <p className="text-sm leading-7 whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>
                    {bio || (
                        <span className="italic" style={{ color: 'var(--color-text-tertiary)' }}>
                            {isOwner ? 'Click Edit to add your bio...' : tx('settings.noBio', undefined, 'No bio added yet')}
                        </span>
                    )}
                </p>
            )}
        </section>
    );
}
