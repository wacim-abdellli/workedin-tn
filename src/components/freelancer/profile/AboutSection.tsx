import { useTranslation } from '../../../i18n';

export default function AboutSection({ bio }: { bio: string }) {
    const { tx } = useTranslation();

    return (
        <section className="rounded-[2rem] border border-[var(--border)] bg-white/80 dark:bg-[var(--color-bg-muted)]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[var(--border-strong)] relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--workspace-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="mb-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{tx('pages.freelancerProfile.sectionLabelIntro', undefined, 'Introduction')}</div>
                <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{tx('settings.bioLabel', undefined, 'About me')}</h2>
            </div>
            <div className="prose prose-sm max-w-none text-[var(--text-secondary)] leading-8 whitespace-pre-line dark:prose-invert">
                {bio || tx('settings.noBio', undefined, 'No bio added yet')}
            </div>
        </section>
    );
}
