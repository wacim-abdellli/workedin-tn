import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Palette, Code, Languages, Video, PenTool, Database,
    Megaphone, Camera, Smartphone, Tablet, Briefcase
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { getJobCategories } from '@/lib/jobCategories';

const categoryIcons: Record<string, React.ReactNode> = {
    graphicDesign: <Palette className="w-7 h-7" />,
    webDev: <Code className="w-7 h-7" />,
    translation: <Languages className="w-7 h-7" />,
    videoEditing: <Video className="w-7 h-7" />,
    contentWriting: <PenTool className="w-7 h-7" />,
    dataEntry: <Database className="w-7 h-7" />,
    digitalMarketing: <Megaphone className="w-7 h-7" />,
    photography: <Camera className="w-7 h-7" />,
    uiux: <Smartphone className="w-7 h-7" />,
    mobileApp: <Tablet className="w-7 h-7" />,
};

export default function CategoriesSection() {
    const { t, language } = useTranslation();
    const categories = getJobCategories(language).slice(0, 6);

    const { data: categoryCounts = {} } = useQuery({
        queryKey: ['homeCategoryCounts'],
        queryFn: async () => {
            const { data, error } = await supabase.from('jobs').select('category').eq('status', 'open');
            if (error) throw error;

            return (data ?? []).reduce<Record<string, number>>((acc, job) => {
                const key = job.category as string | undefined;
                if (!key) return acc;
                acc[key] = (acc[key] ?? 0) + 1;
                return acc;
            }, {});
        },
        staleTime: 60_000,
    });

    const iconMap: Record<string, React.ReactNode> = {
        design: categoryIcons.graphicDesign,
        development: categoryIcons.webDev,
        translation: categoryIcons.translation,
        video: categoryIcons.videoEditing,
        writing: categoryIcons.contentWriting,
        data: categoryIcons.dataEntry,
        marketing: categoryIcons.digitalMarketing,
        business: <Briefcase className="w-7 h-7" />,
        other: categoryIcons.mobileApp,
    };

    return (
        <section className="section" style={{ background: 'var(--page-bg)' }}>
            <div className="container-custom">
                <div className="text-center mb-12">
                    <span className="badge-accent mb-4">{t.home.sections.categories.badge}</span>
                    <h2 className="heading-lg mb-4 text-gray-900 dark:text-white">
                        {t.categories.title}
                    </h2>
                    <p className="text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto">
                        {t.home.sections.categories.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map((category, index) => (
                        <Link
                            key={category.id}
                            to={`/jobs?cat=${category.id}`}
                            className="p-6 text-center group rounded-[1.6rem] border bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/5 transition-all duration-300 shadow-sm hover:shadow-md"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--workspace-accent)';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            style={{
                                animationDelay: `${index * 50}ms`
                            }}
                        >
                            <div
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md"
                                style={{
                                    background: 'color-mix(in srgb, var(--workspace-accent) 15%, transparent)',
                                    color: 'var(--workspace-accent)'
                                }}
                            >
                                {iconMap[category.id]}
                            </div>
                            <h3 className="font-semibold text-sm mb-1 text-gray-900 dark:text-white">
                                {category.name}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-zinc-400">
                                {categoryCounts[category.id] ?? 0} {t.categories.availableJobs}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
