import { Zap } from 'lucide-react';
import type { Skill } from '@/types';
import { useTranslation } from '../../../i18n';

const SKILL_COLORS = [
    { bg: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)', border: 'color-mix(in srgb, var(--workspace-primary) 30%, transparent)', color: 'var(--workspace-primary)' },
    { bg: 'color-mix(in srgb, #3b82f6 12%, transparent)', border: 'color-mix(in srgb, #3b82f6 30%, transparent)', color: '#3b82f6' },
    { bg: 'color-mix(in srgb, #10b981 12%, transparent)', border: 'color-mix(in srgb, #10b981 30%, transparent)', color: '#10b981' },
    { bg: 'color-mix(in srgb, #f59e0b 12%, transparent)', border: 'color-mix(in srgb, #f59e0b 30%, transparent)', color: '#f59e0b' },
    { bg: 'color-mix(in srgb, #ec4899 12%, transparent)', border: 'color-mix(in srgb, #ec4899 30%, transparent)', color: '#ec4899' },
    { bg: 'color-mix(in srgb, #8b5cf6 12%, transparent)', border: 'color-mix(in srgb, #8b5cf6 30%, transparent)', color: '#8b5cf6' },
];

export default function SkillsSection({ skills, language }: { skills: Skill[], language: string }) {
    const { tx } = useTranslation();

    return (
        <section className="group relative rounded-3xl overflow-hidden border-2 p-6 sm:p-8 transition-all duration-500 hover:shadow-2xl"
            style={{
                borderColor: 'color-mix(in srgb, #3b82f6 20%, var(--color-border-subtle))',
                background: 'var(--color-background-elevated)',
                boxShadow: '0 4px 20px -8px rgba(59,130,246,0.25)',
            }}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ec4899]" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
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

                {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                        {skills.map((skill, i) => {
                            const c = SKILL_COLORS[i % SKILL_COLORS.length];
                            return (
                                <span key={skill.id}
                                    className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-default"
                                    style={{ background: c.bg, borderColor: c.border, color: c.color }}
                                >
                                    {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 rounded-2xl border-2 border-dashed transition-all duration-300 hover:border-[#3b82f6]"
                        style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)' }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                            {tx('pages.freelancerProfile.noSkills', undefined, 'No skills added yet')}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
