import type { Skill } from '@/types';
import { useTranslation } from '../../../i18n';

export default function SkillsSection({ skills, language }: { skills: Skill[], language: string }) {
    const { tx } = useTranslation();

    return (
        <section className="rounded-[2rem] border border-[var(--border)] bg-white/80 dark:bg-[var(--color-bg-muted)]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[var(--border-strong)] relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--workspace-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="mb-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{tx('pages.freelancerProfile.sectionLabelSkills', undefined, 'Core strengths')}</div>
                <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{tx('findFreelancers.skills', undefined, 'Skills')}</h2>
            </div>
            {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                    {skills.map((skill) => (
                        <span
                            key={skill.id}
                            className="px-4 py-2 rounded-xl text-sm font-medium cursor-default border border-[color:var(--workspace-primary)]/10 bg-[color:var(--workspace-primary)]/[0.08] text-[var(--text-primary)] dark:border-[var(--color-border-subtle)]"
                        >
                            {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                        </span>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-[var(--color-bg-elevated)]/50 rounded-[1.5rem] border border-dashed border-[var(--border-strong)] relative overflow-hidden group transition-colors hover:border-[var(--workspace-primary)]/50 mt-4">
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[var(--workspace-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                    <p className="text-[var(--text-secondary)] font-medium text-sm relative z-10">{tx('pages.freelancerProfile.noSkills', undefined, 'No skills added yet')}</p>
                </div>
            )}
        </section>
    );
}
