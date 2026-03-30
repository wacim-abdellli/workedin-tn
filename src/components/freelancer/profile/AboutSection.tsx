import { useTranslation } from '../../../i18n';

export default function AboutSection({ bio }: { bio: string }) {
    const { tx } = useTranslation();

    return (
        <section className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(26,24,37,0.14)] dark:border-white/8 dark:bg-[#171421]">
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
