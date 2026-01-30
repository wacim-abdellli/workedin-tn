import { Link } from 'react-router-dom';
import {
    Palette, Code, Languages, Video, PenTool, Database,
    Megaphone, Camera, Smartphone, Tablet
} from 'lucide-react';
import { useTranslation } from '@/i18n';

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
    const { t } = useTranslation();

    const categories = [
        { key: 'graphicDesign', jobs: 45 },
        { key: 'webDev', jobs: 38 },
        { key: 'translation', jobs: 52 },
        { key: 'videoEditing', jobs: 28 },
        { key: 'contentWriting', jobs: 63 },
        { key: 'dataEntry', jobs: 71 },
    ];

    return (
        <section className="section">
            <div className="container-custom">
                <div className="text-center mb-12">
                    <span className="badge-accent mb-4">{t.home.sections.categories.badge}</span>
                    <h2 className="heading-lg mb-4">
                        {t.categories.title}
                    </h2>
                    <p className="text-muted max-w-2xl mx-auto">
                        {t.home.sections.categories.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map((category, index) => (
                        <Link
                            key={category.key}
                            to={`/jobs?category=${category.key}`}
                            className="card-hover p-6 text-center group"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-dark-100 to-dark-200 dark:from-dark-700 dark:to-dark-800 flex items-center justify-center text-dark-500 dark:text-dark-400 group-hover:from-primary-500 group-hover:to-primary-700 group-hover:text-white transition-all duration-300 shadow-lg group-hover:shadow-primary-500/30">
                                {categoryIcons[category.key]}
                            </div>
                            <h3 className="font-semibold text-sm mb-1">
                                {t.categories[category.key as keyof typeof t.categories]}
                            </h3>
                            <p className="text-xs text-muted">
                                {category.jobs} {t.categories.availableJobs}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
