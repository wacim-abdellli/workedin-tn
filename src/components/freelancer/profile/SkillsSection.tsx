import type { Skill } from '@/types';
import { useTranslation } from '../../../i18n';

export default function SkillsSection({ skills, language }: { skills: Skill[], language: string }) {
    const { tx } = useTranslation();

    return (
        <section className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(26,24,37,0.14)] dark:border-white/8 dark:bg-[#171421]">
            <div className="mb-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{tx('pages.freelancerProfile.sectionLabelSkills', undefined, 'Core strengths')}</div>
                <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{tx('findFreelancers.skills', undefined, 'Skills')}</h2>
            </div>
            {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                    {skills.map((skill) => (
                        <span
                            key={skill.id}
                            className="px-4 py-2 rounded-xl text-sm font-medium cursor-default border border-[color:var(--workspace-primary)]/10 bg-[color:var(--workspace-primary)]/[0.08] text-[var(--text-primary)] dark:border-white/10 dark:bg-white/[0.04]"
                        >
                            {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-[var(--text-muted)]">{tx('pages.freelancerProfile.noSkills', undefined, 'No skills added yet')}</p>
            )}
        </section>
    );
}
