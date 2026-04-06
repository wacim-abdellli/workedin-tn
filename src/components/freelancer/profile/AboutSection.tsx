import { BookOpen } from 'lucide-react';
import { useTranslation } from '../../../i18n';

export default function AboutSection({ bio }: { bio: string }) {
    const { tx } = useTranslation();

    return (
        <section className="group relative rounded-3xl overflow-hidden border-2 p-6 sm:p-8 transition-all duration-500 hover:shadow-2xl"
            style={{
                borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, var(--color-border-subtle))',
                background: 'var(--color-background-elevated)',
                boxShadow: '0 4px 20px -8px var(--workspace-primary-shadow)',
            }}
        >
            {/* Top gradient bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--workspace-primary)] via-[var(--workspace-accent)] to-[var(--workspace-primary)]" />
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'var(--workspace-primary)' }} />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
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
                <p className="text-sm leading-8 whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>
                    {bio || tx('settings.noBio', undefined, 'No bio added yet')}
                </p>
            </div>
        </section>
    );
}
