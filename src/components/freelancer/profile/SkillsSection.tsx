import type { Skill } from '@/types';

export default function SkillsSection({ skills, language }: { skills: Skill[], language: string }) {
    return (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">المهارات</h2>
            <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                    <span
                        key={skill.id}
                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors cursor-default"
                    >
                        {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                    </span>
                ))}
            </div>
        </section>
    );
}
