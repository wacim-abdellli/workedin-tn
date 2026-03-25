import { Helmet } from 'react-helmet-async';

import { useTranslation } from '../../i18n';
import type { Language } from '../../types';

type LocalizedText = string | Partial<Record<Language, string>>;

interface SEOProps {
    title: LocalizedText;
    description: LocalizedText;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'profile';
    twitterCard?: 'summary' | 'summary_large_image';
    keywords?: LocalizedText;
    locale?: string;
    noIndex?: boolean;
}

type SEOConfigEntry = Pick<SEOProps, 'title' | 'description' | 'keywords' | 'image' | 'type'>;

const SITE_NAME: Record<Language, string> = {
    ar: 'خدمة TN',
    en: 'Khedma TN',
    fr: 'Khedma TN',
};

const OG_LOCALE: Record<Language, string> = {
    ar: 'ar_TN',
    en: 'en_US',
    fr: 'fr_FR',
};

const DEFAULT_IMAGE = '/logos/logo-og.svg';
const SITE_URL = 'https://khedma-tn.vercel.app';

const resolveLocalizedText = (value: LocalizedText | undefined, language: Language): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;

    return value[language] || value.en || value.fr || value.ar || '';
};

export default function SEO({
    title,
    description,
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    twitterCard = 'summary_large_image',
    keywords,
    locale,
    noIndex = false,
}: SEOProps) {
    const { language } = useTranslation();

    const siteName = SITE_NAME[language];
    const resolvedTitle = resolveLocalizedText(title, language);
    const resolvedDescription = resolveLocalizedText(description, language);
    const resolvedKeywords = resolveLocalizedText(keywords, language);
    const resolvedLocale = locale || OG_LOCALE[language];

    const fullTitle =
        resolvedTitle && resolvedTitle !== siteName && resolvedTitle !== 'Khedma TN'
            ? `Khedma TN — ${resolvedTitle}`
            : siteName;

    const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
    const canonicalUrl = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : undefined;

    return (
        <Helmet htmlAttributes={{ lang: language, dir: language === 'ar' ? 'rtl' : 'ltr' }}>
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={resolvedDescription} />
            {resolvedKeywords && <meta name="keywords" content={resolvedKeywords} />}
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={resolvedDescription} />
            <meta property="og:image" content={fullImageUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:locale" content={resolvedLocale} />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={resolvedDescription} />
            <meta name="twitter:image" content={fullImageUrl} />

            <meta name="theme-color" content="#8b5cf6" />
        </Helmet>
    );
}

export const SEO_CONFIG: Record<string, SEOConfigEntry> = {
    home: {
        title: {
            ar: 'خدمة TN',
            en: 'Khedma TN',
            fr: 'Khedma TN',
        },
        description: {
            ar: 'تبحث عن محترفين تونسيين موثقين لمشاريعك؟ انشر مشروعك مجاناً على خدمة TN وابدأ العمل اليوم.',
            en: 'Connect with verified Tunisian professionals for your projects. Secure payments in TND and escrow protection.',
            fr: 'Connectez-vous avec des professionnels tunisiens vérifiés pour vos projets. Paiements sécurisés en TND et protection escrow.',
        },
        keywords: {
            ar: 'عمل حر, تونس, مستقلون, مشاريع, وظائف, دينار تونسي, ضمان',
            en: 'freelance Tunisia, Tunisian freelancers, TND payments, escrow, projects, talent marketplace',
            fr: 'freelance Tunisie, freelances tunisiens, paiements TND, escrow, projets, talents',
        },
    },
    jobs: {
        title: {
            ar: 'وظائف ومشاريع مستقلة',
            en: 'Freelance Jobs',
            fr: 'Missions freelance',
        },
        description: {
            ar: 'استكشف مشاريع جديدة في تونس وابحث عن فرص تناسب مهاراتك وسعرك وخبرتك.',
            en: 'Browse freelance jobs in Tunisia and find projects that match your skills, rate, and availability.',
            fr: 'Parcourez les missions freelance en Tunisie et trouvez des projets adaptés à vos compétences, votre tarif et votre disponibilité.',
        },
        keywords: {
            ar: 'وظائف, مشاريع, عمل حر, تونس',
            en: 'freelance jobs, Tunisia jobs, projects, remote work',
            fr: 'missions freelance, projets, Tunisie, travail indépendant',
        },
    },
    findFreelancers: {
        title: {
            ar: 'اعثر على محترفين تونسيين موثوقين',
            en: 'Find Verified Tunisian Professionals',
            fr: 'Trouvez des professionnels tunisiens vérifiés',
        },
        description: {
            ar: 'أكثر من 2500 محترف تونسي موثق ومُقيَّم وجاهز للعمل عبر التصميم، التطوير، الترجمة والاستشارة.',
            en: 'Find 2,500+ verified Tunisian developers, designers, translators, and consultants ready to start.',
            fr: 'Trouvez 2 500+ développeurs, designers, traducteurs et consultants tunisiens vérifiés, notés et disponibles.',
        },
        keywords: {
            ar: 'مستقلون, توظيف, تونس, محترفون, موثوقون',
            en: 'hire freelancers Tunisia, verified professionals, Tunisian talent',
            fr: 'recruter freelances Tunisie, talents vérifiés, professionnels tunisiens',
        },
    },
    howItWorks: {
        title: {
            ar: 'كيف تعمل خدمة',
            en: 'How Khedma Works',
            fr: 'Comment fonctionne Khedma',
        },
        description: {
            ar: 'أربع خطوات من فكرة المشروع إلى استلام الدفع، مع ضمان، تحقق هوية، وتتبع واضح لكل دينار.',
            en: 'See how Khedma takes you from project idea to approved payment in four protected steps.',
            fr: 'Découvrez comment Khedma vous fait passer de l’idée au paiement validé en quatre étapes protégées.',
        },
        keywords: {
            ar: 'كيف يعمل, منصة عمل حر, ضمان, تحقق هوية',
            en: 'how it works, escrow, verified freelancers, talent marketplace',
            fr: 'fonctionnement, escrow, freelances vérifiés, plateforme freelance',
        },
    },
    forClients: {
        title: {
            ar: 'للعملاء وأصحاب المشاريع',
            en: 'Hire Verified Tunisian Talent',
            fr: 'Recrutez des talents tunisiens vérifiés',
        },
        description: {
            ar: 'انشر مشروعك مجاناً، استقبل عروضاً من محترفين موثقين، وادفع فقط عند الموافقة مع حماية كاملة بالضمان.',
            en: 'Post your project for free, receive proposals from verified professionals, and pay only when work is approved.',
            fr: 'Publiez gratuitement, recevez des propositions de professionnels vérifiés et payez uniquement à la validation.',
        },
        keywords: {
            ar: 'عملاء, مشاريع, توظيف, تونس, ضمان',
            en: 'hire Tunisian freelancers, client marketplace, escrow payments, post a project',
            fr: 'recruter freelances tunisiens, publier un projet, escrow, clients',
        },
    },
    faq: {
        title: {
            ar: 'الأسئلة الشائعة',
            en: 'Frequently Asked Questions',
            fr: 'Questions fréquentes',
        },
        description: {
            ar: 'إجابات واضحة حول طريقة العمل، الدفع، الضمان، والهوية على خدمة.',
            en: 'Find answers about payments, escrow, identity verification, and how Khedma works.',
            fr: 'Retrouvez des réponses sur les paiements, l’escrow, la vérification d’identité et le fonctionnement de Khedma.',
        },
        keywords: {
            ar: 'أسئلة شائعة, دعم, مساعدة',
            en: 'faq, help, support',
            fr: 'faq, aide, support',
        },
    },
    terms: {
        title: {
            ar: 'شروط الاستخدام',
            en: 'Terms of Use',
            fr: 'Conditions d’utilisation',
        },
        description: {
            ar: 'اطلع على شروط وأحكام استخدام منصة خدمة.',
            en: 'Read the terms and conditions for using the Khedma platform.',
            fr: 'Consultez les conditions d’utilisation de la plateforme Khedma.',
        },
        keywords: {
            ar: 'شروط الاستخدام, أحكام, قانون',
            en: 'terms, conditions, legal',
            fr: 'conditions, utilisation, légal',
        },
    },
    privacy: {
        title: {
            ar: 'سياسة الخصوصية',
            en: 'Privacy Policy',
            fr: 'Politique de confidentialité',
        },
        description: {
            ar: 'تعرّف على كيفية حماية بياناتك وخصوصيتك على خدمة.',
            en: 'Learn how Khedma protects your data and privacy.',
            fr: 'Découvrez comment Khedma protège vos données et votre vie privée.',
        },
        keywords: {
            ar: 'خصوصية, حماية البيانات, أمان',
            en: 'privacy, data protection, security',
            fr: 'confidentialité, protection des données, sécurité',
        },
    },
    login: {
        title: {
            ar: 'سجّل الدخول إلى خدمة',
            en: 'Sign in to Khedma',
            fr: 'Connectez-vous à Khedma',
        },
        description: {
            ar: 'عد إلى حسابك على خدمة وتابع مشاريعك ورسائلك ومدفوعاتك.',
            en: 'Sign in to your Khedma account to manage projects, messages, and payments.',
            fr: 'Connectez-vous à votre compte Khedma pour gérer vos projets, messages et paiements.',
        },
        keywords: {
            ar: 'تسجيل الدخول, حساب, خدمة',
            en: 'sign in, account, Khedma login',
            fr: 'connexion, compte, Khedma',
        },
    },
    signup: {
        title: {
            ar: 'أنشئ حسابك على خدمة',
            en: 'Create your Khedma account',
            fr: 'Créez votre compte Khedma',
        },
        description: {
            ar: 'انضم إلى أكثر من 2500 محترف يبنون مسيرتهم ويُديرون مشاريعهم على خدمة.',
            en: 'Create your account and join 2,500+ professionals building their career on Khedma.',
            fr: 'Créez votre compte et rejoignez 2 500+ professionnels qui développent leur carrière sur Khedma.',
        },
        keywords: {
            ar: 'إنشاء حساب, تسجيل, مستقل, عميل',
            en: 'create account, signup, freelance marketplace, client account',
            fr: 'créer un compte, inscription, freelance, client',
        },
    },
    dashboard: {
        title: {
            ar: 'لوحة التحكم',
            en: 'Dashboard',
            fr: 'Tableau de bord',
        },
        description: {
            ar: 'تابع مشاريعك ورسائلك وأرباحك من لوحة التحكم الخاصة بك على خدمة.',
            en: 'Track projects, messages, and earnings from your Khedma dashboard.',
            fr: 'Suivez vos projets, messages et revenus depuis votre tableau de bord Khedma.',
        },
        keywords: {
            ar: 'لوحة تحكم, مشاريع, أرباح',
            en: 'dashboard, earnings, projects',
            fr: 'tableau de bord, revenus, projets',
        },
    },
    messages: {
        title: {
            ar: 'الرسائل',
            en: 'Messages',
            fr: 'Messages',
        },
        description: {
            ar: 'تواصل بأمان مع العملاء والمستقلين عبر رسائل خدمة.',
            en: 'Chat securely with clients and freelancers through Khedma messaging.',
            fr: 'Échangez en toute sécurité avec clients et freelances via la messagerie Khedma.',
        },
        keywords: {
            ar: 'رسائل, تواصل, محادثات',
            en: 'messages, chat, communication',
            fr: 'messages, chat, communication',
        },
    },
    settings: {
        title: {
            ar: 'الإعدادات',
            en: 'Settings',
            fr: 'Paramètres',
        },
        description: {
            ar: 'أدر إعدادات الحساب والإشعارات والخصوصية من مكان واحد.',
            en: 'Manage your account settings, notifications, and privacy from one place.',
            fr: 'Gérez vos paramètres de compte, notifications et préférences de confidentialité depuis un seul endroit.',
        },
        keywords: {
            ar: 'إعدادات, حساب, تفضيلات',
            en: 'settings, account, preferences',
            fr: 'paramètres, compte, préférences',
        },
    },
    search: {
        title: {
            ar: 'نتائج البحث',
            en: 'Search Results',
            fr: 'Résultats de recherche',
        },
        description: {
            ar: 'استعرض نتائج البحث عبر الوظائف والمستقلين والمحتوى على خدمة.',
            en: 'Browse search results across jobs, freelancers, and content on Khedma.',
            fr: 'Parcourez les résultats de recherche parmi les missions, freelances et contenus sur Khedma.',
        },
        keywords: {
            ar: 'بحث, نتائج',
            en: 'search, results',
            fr: 'recherche, résultats',
        },
    },
    freelancerOnboarding: {
        title: {
            ar: 'إكمال حساب المستقل',
            en: 'Complete Freelancer Setup',
            fr: 'Finaliser le profil freelance',
        },
        description: {
            ar: 'أكمل ملفك كمستقل وابدأ استقبال فرص العمل على خدمة.',
            en: 'Complete your freelancer profile and start getting matched to real work on Khedma.',
            fr: 'Finalisez votre profil freelance et commencez à recevoir de vraies opportunités sur Khedma.',
        },
        keywords: {
            ar: 'مستقل, ملف شخصي, إعداد',
            en: 'freelancer onboarding, profile setup',
            fr: 'onboarding freelance, configuration du profil',
        },
    },
    clientOnboarding: {
        title: {
            ar: 'إكمال حساب العميل',
            en: 'Complete Client Setup',
            fr: 'Finaliser le profil client',
        },
        description: {
            ar: 'أكمل حسابك كعميل وابدأ نشر مشاريعك على خدمة.',
            en: 'Complete your client account and start posting projects on Khedma.',
            fr: 'Finalisez votre compte client et commencez à publier vos projets sur Khedma.',
        },
        keywords: {
            ar: 'عميل, مشروع, إعداد حساب',
            en: 'client onboarding, project setup',
            fr: 'onboarding client, configuration projet',
        },
    },
};
