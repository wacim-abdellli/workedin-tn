import { Helmet } from 'react-helmet-async';

interface SEOProps {
    /** Page title - will be appended with site name */
    title: string;
    /** Meta description for the page */
    description: string;
    /** Open Graph image URL (defaults to /og-image.png) */
    image?: string;
    /** Canonical URL for the page */
    url?: string;
    /** Open Graph type (defaults to 'website') */
    type?: 'website' | 'article' | 'profile';
    /** Twitter card type (defaults to 'summary_large_image') */
    twitterCard?: 'summary' | 'summary_large_image';
    /** Additional keywords for meta tag */
    keywords?: string;
    /** Language/locale of the page */
    locale?: string;
    /** Prevent indexing of this page */
    noIndex?: boolean;
}

const SITE_NAME = 'خدمة - Khedma';
const DEFAULT_IMAGE = '/og-image.png';
const SITE_URL = 'https://khedma.tn';

/**
 * SEO Component for dynamic meta tags
 * 
 * Uses react-helmet-async to inject meta tags into the document head.
 * Includes Open Graph and Twitter Card meta tags for social sharing.
 */
export default function SEO({
    title,
    description,
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    twitterCard = 'summary_large_image',
    keywords,
    locale = 'ar_TN',
    noIndex = false,
}: SEOProps) {
    const fullTitle = `${title} | ${SITE_NAME}`;
    const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
    const canonicalUrl = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : undefined;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            {/* Canonical URL */}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImageUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:locale" content={locale} />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

            {/* Twitter */}
            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImageUrl} />

            {/* Additional */}
            <meta name="theme-color" content="#8B5A2B" />
        </Helmet>
    );
}

/**
 * Pre-defined SEO configurations for common pages
 */
export const SEO_CONFIG = {
    home: {
        title: 'منصة العمل الحر لتونس',
        description: 'لا مزايدات، لا تعقيدات، فقط مهارتك ومالك. خدمة هي منصة العمل الحر الأولى في تونس للتواصل بين أصحاب المشاريع والمستقلين المحترفين.',
        keywords: 'عمل حر, فريلانس, تونس, مستقلين, وظائف, خدمات, مشاريع',
    },
    jobs: {
        title: 'تصفح وظائف العمل الحر',
        description: 'اكتشف آلاف فرص العمل الحر في تونس. ابحث عن مشاريع تناسب مهاراتك وابدأ العمل اليوم.',
        keywords: 'وظائف, عمل حر, مشاريع, فرص عمل, تونس',
    },
    findFreelancers: {
        title: 'ابحث عن محترفين موهوبين',
        description: 'وظف أفضل المستقلين في تونس. اعثر على مصممين ومطورين وكتّاب ومسوقين محترفين.',
        keywords: 'مستقلين, محترفين, توظيف, فريلانسر, تونس',
    },
    howItWorks: {
        title: 'كيف تعمل المنصة',
        description: 'تعرف على كيفية استخدام خدمة للعثور على مشاريع أو توظيف مستقلين. خطوات بسيطة للبدء.',
        keywords: 'كيف تعمل, دليل المستخدم, البدء, خدمة',
    },
    forClients: {
        title: 'للعملاء وأصحاب المشاريع',
        description: 'وظف أفضل المواهب في تونس. انشر مشروعك واحصل على عروض من محترفين متخصصين.',
        keywords: 'أصحاب مشاريع, عملاء, توظيف, مستقلين',
    },
    faq: {
        title: 'الأسئلة الشائعة',
        description: 'إجابات على الأسئلة الأكثر شيوعاً حول خدمة ومنصة العمل الحر.',
        keywords: 'أسئلة شائعة, مساعدة, دعم',
    },
    terms: {
        title: 'شروط الاستخدام',
        description: 'اقرأ شروط وأحكام استخدام منصة خدمة للعمل الحر.',
        keywords: 'شروط الاستخدام, أحكام, قانوني',
    },
    privacy: {
        title: 'سياسة الخصوصية',
        description: 'تعرف على كيفية حماية بياناتك وخصوصيتك على منصة خدمة.',
        keywords: 'خصوصية, حماية البيانات, أمان',
    },
    login: {
        title: 'تسجيل الدخول',
        description: 'سجل دخولك إلى حسابك على خدمة للوصول إلى مشاريعك ورسائلك.',
        keywords: 'تسجيل دخول, حساب',
    },
    signup: {
        title: 'إنشاء حساب جديد',
        description: 'انضم إلى خدمة اليوم وابدأ رحلتك في العمل الحر أو وظف أفضل المستقلين.',
        keywords: 'تسجيل, حساب جديد, انضمام',
    },
    dashboard: {
        title: 'لوحة التحكم',
        description: 'إدارة مشاريعك وعروضك ورسائلك من لوحة التحكم الخاصة بك.',
        keywords: 'لوحة تحكم, إدارة',
    },
    messages: {
        title: 'الرسائل',
        description: 'تواصل مع العملاء والمستقلين عبر نظام المراسلة الآمن.',
        keywords: 'رسائل, تواصل, محادثات',
    },
    settings: {
        title: 'الإعدادات',
        description: 'إدارة إعدادات حسابك والإشعارات والخصوصية.',
        keywords: 'إعدادات, حساب, تفضيلات',
    },
    profile: {
        title: 'الملف الشخصي',
        description: 'عرض وتعديل ملفك الشخصي على خدمة.',
        keywords: 'ملف شخصي, حساب',
    },
    postJob: {
        title: 'نشر مشروع جديد',
        description: 'انشر مشروعك واحصل على عروض من أفضل المستقلين في تونس.',
        keywords: 'نشر مشروع, توظيف, عرض عمل',
    },
    freelancerOnboarding: {
        title: 'انضم كمستقل',
        description: 'أكمل ملفك الشخصي وابدأ في تلقي عروض العمل.',
        keywords: 'انضمام, مستقل, فريلانسر',
    },
    clientOnboarding: {
        title: 'انضم كصاحب مشروع',
        description: 'أنشئ حسابك كعميل وابدأ في نشر مشاريعك.',
        keywords: 'انضمام, عميل, صاحب مشروع',
    },
    earnings: {
        title: 'الأرباح',
        description: 'تتبع أرباحك ومدفوعاتك على منصة خدمة.',
        keywords: 'أرباح, مدفوعات, مالية',
    },
    portfolio: {
        title: 'معرض الأعمال',
        description: 'عرض وإدارة معرض أعمالك للعملاء المحتملين.',
        keywords: 'معرض أعمال, بورتفوليو, نماذج',
    },
    contracts: {
        title: 'العقود',
        description: 'إدارة عقودك النشطة والمكتملة.',
        keywords: 'عقود, مشاريع, اتفاقيات',
    },
    search: {
        title: 'نتائج البحث',
        description: 'نتائج البحث على منصة خدمة.',
        keywords: 'بحث, نتائج',
    },
} as const;
