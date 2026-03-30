import type { Language } from '../types';

type LocalizedLabel = {
    ar: string;
    fr: string;
    en: string;
};

export type JobSubcategory = {
    id: string;
    label: LocalizedLabel;
};

export type JobCategory = {
    id: string;
    label: LocalizedLabel;
    subcategories: JobSubcategory[];
};

export const JOB_CATEGORIES: JobCategory[] = [
    {
        id: 'design',
        label: { ar: 'تصميم وإبداع', fr: 'Design et creation', en: 'Design and Creative' },
        subcategories: [
            { id: 'brand_identity', label: { ar: 'هوية بصرية', fr: 'Identite visuelle', en: 'Brand Identity' } },
            { id: 'logo_design', label: { ar: 'تصميم شعارات', fr: 'Creation de logo', en: 'Logo Design' } },
            { id: 'ui_ux', label: { ar: 'تصميم UI/UX', fr: 'Design UI/UX', en: 'UI/UX Design' } },
            { id: 'social_media_design', label: { ar: 'تصاميم سوشيال ميديا', fr: 'Design reseaux sociaux', en: 'Social Media Design' } },
            { id: 'print_design', label: { ar: 'تصميم مطبوعات', fr: 'Design print', en: 'Print Design' } },
        ],
    },
    {
        id: 'development',
        label: { ar: 'برمجة وتطوير', fr: 'Developpement', en: 'Development' },
        subcategories: [
            { id: 'frontend', label: { ar: 'تطوير واجهات', fr: 'Frontend', en: 'Frontend Development' } },
            { id: 'backend', label: { ar: 'تطوير خلفي', fr: 'Backend', en: 'Backend Development' } },
            { id: 'fullstack', label: { ar: 'تطوير متكامل', fr: 'Full stack', en: 'Full Stack Development' } },
            { id: 'mobile_apps', label: { ar: 'تطبيقات موبايل', fr: 'Applications mobiles', en: 'Mobile Apps' } },
            { id: 'wordpress', label: { ar: 'WordPress', fr: 'WordPress', en: 'WordPress' } },
        ],
    },
    {
        id: 'writing',
        label: { ar: 'كتابة ومحتوى', fr: 'Redaction et contenu', en: 'Writing and Content' },
        subcategories: [
            { id: 'copywriting', label: { ar: 'كتابة تسويقية', fr: 'Copywriting', en: 'Copywriting' } },
            { id: 'blog_articles', label: { ar: 'مقالات ومدونات', fr: 'Articles de blog', en: 'Blog Articles' } },
            { id: 'technical_writing', label: { ar: 'كتابة تقنية', fr: 'Redaction technique', en: 'Technical Writing' } },
            { id: 'product_descriptions', label: { ar: 'وصف منتجات', fr: 'Descriptions produit', en: 'Product Descriptions' } },
            { id: 'script_writing', label: { ar: 'كتابة سكريبتات', fr: 'Ecriture de scripts', en: 'Script Writing' } },
        ],
    },
    {
        id: 'translation',
        label: { ar: 'ترجمة ولغات', fr: 'Traduction et langues', en: 'Translation and Languages' },
        subcategories: [
            { id: 'arabic_french', label: { ar: 'عربي - فرنسي', fr: 'Arabe - Francais', en: 'Arabic - French' } },
            { id: 'arabic_english', label: { ar: 'عربي - انجليزي', fr: 'Arabe - Anglais', en: 'Arabic - English' } },
            { id: 'french_english', label: { ar: 'فرنسي - انجليزي', fr: 'Francais - Anglais', en: 'French - English' } },
            { id: 'localization', label: { ar: 'تعريب وتوطين', fr: 'Localisation', en: 'Localization' } },
            { id: 'transcription', label: { ar: 'تفريغ صوتي', fr: 'Transcription', en: 'Transcription' } },
        ],
    },
    {
        id: 'marketing',
        label: { ar: 'تسويق ومبيعات', fr: 'Marketing et ventes', en: 'Marketing and Sales' },
        subcategories: [
            { id: 'social_media_marketing', label: { ar: 'تسويق شبكات اجتماعية', fr: 'Marketing social media', en: 'Social Media Marketing' } },
            { id: 'seo', label: { ar: 'تهيئة محركات البحث', fr: 'SEO', en: 'SEO' } },
            { id: 'paid_ads', label: { ar: 'اعلانات ممولة', fr: 'Publicites payantes', en: 'Paid Ads' } },
            { id: 'email_marketing', label: { ar: 'تسويق بريدي', fr: 'Email marketing', en: 'Email Marketing' } },
            { id: 'sales_support', label: { ar: 'دعم مبيعات', fr: 'Support commercial', en: 'Sales Support' } },
        ],
    },
    {
        id: 'video',
        label: { ar: 'فيديو وصوت', fr: 'Video et audio', en: 'Video and Audio' },
        subcategories: [
            { id: 'video_editing', label: { ar: 'مونتاج فيديو', fr: 'Montage video', en: 'Video Editing' } },
            { id: 'motion_graphics', label: { ar: 'موشن جرافيك', fr: 'Motion design', en: 'Motion Graphics' } },
            { id: 'voice_over', label: { ar: 'تعليق صوتي', fr: 'Voix off', en: 'Voice Over' } },
            { id: 'podcast_editing', label: { ar: 'تحرير بودكاست', fr: 'Edition podcast', en: 'Podcast Editing' } },
            { id: 'short_form_content', label: { ar: 'محتوى قصير', fr: 'Contenu court', en: 'Short-form Content' } },
        ],
    },
    {
        id: 'business',
        label: { ar: 'ادارة واعمال', fr: 'Business et operations', en: 'Business and Operations' },
        subcategories: [
            { id: 'virtual_assistance', label: { ar: 'مساعدة افتراضية', fr: 'Assistance virtuelle', en: 'Virtual Assistance' } },
            { id: 'project_management', label: { ar: 'ادارة مشاريع', fr: 'Gestion de projet', en: 'Project Management' } },
            { id: 'customer_support', label: { ar: 'خدمة حرفاء', fr: 'Support client', en: 'Customer Support' } },
            { id: 'recruiting', label: { ar: 'توظيف وفرز', fr: 'Recrutement', en: 'Recruiting' } },
            { id: 'market_research', label: { ar: 'بحث سوق', fr: 'Etude de marche', en: 'Market Research' } },
        ],
    },
    {
        id: 'data',
        label: { ar: 'بيانات وتحليل', fr: 'Data et analyse', en: 'Data and Analytics' },
        subcategories: [
            { id: 'data_entry', label: { ar: 'ادخال بيانات', fr: 'Saisie de donnees', en: 'Data Entry' } },
            { id: 'data_analysis', label: { ar: 'تحليل بيانات', fr: 'Analyse de donnees', en: 'Data Analysis' } },
            { id: 'dashboards', label: { ar: 'لوحات معلومات', fr: 'Dashboards', en: 'Dashboards' } },
            { id: 'automation', label: { ar: 'اتمتة وتقارير', fr: 'Automatisation et reporting', en: 'Automation and Reporting' } },
            { id: 'research', label: { ar: 'بحث وتجميع بيانات', fr: 'Recherche et collecte', en: 'Research and Data Collection' } },
        ],
    },
    {
        id: 'other',
        label: { ar: 'اخرى', fr: 'Autre', en: 'Other' },
        subcategories: [
            { id: 'consulting', label: { ar: 'استشارة', fr: 'Conseil', en: 'Consulting' } },
            { id: 'training', label: { ar: 'تدريب', fr: 'Formation', en: 'Training' } },
            { id: 'admin_tasks', label: { ar: 'مهام ادارية', fr: 'Taches administratives', en: 'Administrative Tasks' } },
            { id: 'specialized_services', label: { ar: 'خدمات متخصصة', fr: 'Services specialises', en: 'Specialized Services' } },
        ],
    },
];

export function getLocalizedLabel(label: LocalizedLabel, language: Language) {
    return label[language] ?? label.en;
}

export function getJobCategories(language: Language) {
    return JOB_CATEGORIES.map((category) => ({
        id: category.id,
        name: getLocalizedLabel(category.label, language),
        subcategories: category.subcategories.map((subcategory) => ({
            id: subcategory.id,
            name: getLocalizedLabel(subcategory.label, language),
        })),
    }));
}

export function getCategoryName(categoryId: string | undefined, language: Language) {
    if (!categoryId) return '';
    const category = JOB_CATEGORIES.find((item) => item.id === categoryId);
    return category ? getLocalizedLabel(category.label, language) : categoryId;
}

export function getSubcategoryName(categoryId: string | undefined, subcategoryId: string | undefined, language: Language) {
    if (!categoryId || !subcategoryId) return '';
    const category = JOB_CATEGORIES.find((item) => item.id === categoryId);
    const subcategory = category?.subcategories.find((item) => item.id === subcategoryId);
    return subcategory ? getLocalizedLabel(subcategory.label, language) : subcategoryId;
}
