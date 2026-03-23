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

const SITE_NAME: Record<Language, string> = {
    ar: 'خدمة',
    en: 'Khedma',
    fr: 'Khedma',
};

const OG_LOCALE: Record<Language, string> = {
    ar: 'ar_TN',
    en: 'en_US',
    fr: 'fr_FR',
};

const DEFAULT_IMAGE = '/og-image.png';
const SITE_URL = 'https://khedma.tn';

const STRING_REPLACEMENTS: Record<string, Partial<Record<Language, string>>> = {
    'إكمال حساب المستقل': { en: 'Complete Freelancer Setup', fr: 'Finaliser le profil freelance' },
    'أكمل ملفك كمستقل وابدأ استقبال فرص العمل على خدمة': {
        en: 'Complete your freelancer profile and start receiving job opportunities on Khedma',
        fr: 'Finalisez votre profil freelance et commencez à recevoir des opportunités sur Khedma',
    },
    'إكمال حساب العميل': { en: 'Complete Client Setup', fr: 'Finaliser le profil client' },
    'أكمل حسابك كعميل وابدأ نشر مشاريعك على خدمة': {
        en: 'Complete your client account and start posting projects on Khedma',
        fr: 'Finalisez votre compte client et commencez à publier vos projets sur Khedma',
    },
    'لوحة تحكم المستقل': { en: 'Freelancer Dashboard', fr: 'Tableau de bord freelance' },
    'تابع مشاريعك ورسائلك وأرباحك من لوحة تحكم المستقل على خدمة': {
        en: 'Track your projects, messages, and earnings from your freelancer dashboard on Khedma',
        fr: 'Suivez vos projets, vos messages et vos revenus depuis votre tableau de bord freelance sur Khedma',
    },
    'لوحة تحكم العميل': { en: 'Client Dashboard', fr: 'Tableau de bord client' },
    'إدارة مشاريعك وعروض المستقلين من لوحة تحكم العميل على خدمة': {
        en: 'Manage your projects and freelancer offers from your client dashboard on Khedma',
        fr: 'Gérez vos projets et les offres des freelances depuis votre tableau de bord client sur Khedma',
    },
    'التحقق من الهوية': { en: 'Identity Verification', fr: 'Vérification d’identité' },
    'قم بتوثيق هويتك لزيادة ثقة العملاء وفتح جميع ميزات المنصة': {
        en: 'Verify your identity to build trust with clients and unlock all platform features',
        fr: 'Vérifiez votre identité pour renforcer la confiance des clients et débloquer toutes les fonctionnalités',
    },
    'طلب التحقق قيد المراجعة': { en: 'Verification Request Under Review', fr: 'Demande de vérification en cours' },
    'طلب التحقق من الهوية قيد المراجعة من قبل فريقنا': {
        en: 'Your identity verification request is currently under review by our team',
        fr: 'Votre demande de vérification d’identité est en cours de traitement par notre équipe',
    },
    'تم تقديم الطلب': { en: 'Request Submitted', fr: 'Demande envoyée' },
    'تم استلام طلب التحقق من الهوية': {
        en: 'Your identity verification request has been received',
        fr: 'Votre demande de vérification d’identité a bien été reçue',
    },
    'تفاصيل المشروع': { en: 'Project Details', fr: 'Détails du projet' },
    'اطلع على تفاصيل المشروع والميزانية والمتطلبات قبل التقديم.': {
        en: 'Review the project details, budget, and requirements before applying.',
        fr: 'Consultez les détails du projet, le budget et les exigences avant de postuler.',
    },
    'مساحة العمل': { en: 'Workspace', fr: 'Espace de travail' },
    'تابع المحادثة والملفات وحالة الدفع الخاصة بالعقد من مساحة العمل.': {
        en: 'Track messages, files, and payment status for the contract from your workspace.',
        fr: 'Suivez les messages, les fichiers et le statut de paiement du contrat depuis votre espace de travail.',
    },
};

const replaceLocalizedPhrases = (value: string, language: Language): string => {
    if (language === 'ar') return value;

    let localized = value;
    for (const [arabic, translations] of Object.entries(STRING_REPLACEMENTS)) {
        const replacement = translations[language];
        if (replacement) {
            localized = localized.replaceAll(arabic, replacement);
        }
    }

    return localized;
};

const resolveLocalizedText = (value: LocalizedText | undefined, language: Language): string => {
    if (!value) return '';
    if (typeof value === 'string') return replaceLocalizedPhrases(value, language);
    return value[language] || value.ar || value.en || value.fr || '';
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

    const fullTitle = `${resolvedTitle} | ${siteName}`;
    const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
    const canonicalUrl = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : undefined;

    return (
        <Helmet>
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

            <meta name="theme-color" content="#8B5A2B" />
        </Helmet>
    );
}

export const SEO_CONFIG = {
    home: {
        title: {
            ar: 'منصة العمل الحر المصممة لتونس',
            en: 'The Freelance Platform Built for Tunisia',
            fr: 'La plateforme freelance conçue pour la Tunisie',
        },
        description: {
            ar: 'لا مزايدات ولا تعقيدات، فقط مهاراتك وأعمالك. خدمة تربط أصحاب المشاريع بالمستقلين المحترفين في تونس.',
            en: 'No bidding, no complications, just your skills and your work. Khedma connects Tunisian businesses with professional freelancers.',
            fr: 'Pas d’enchères ni de complications, juste vos compétences et votre travail. Khedma relie les entreprises tunisiennes aux freelances qualifiés.',
        },
        keywords: {
            ar: 'عمل حر, فريلانس, تونس, مستقلين, وظائف, خدمات, مشاريع',
            en: 'freelance, Tunisia, jobs, freelancers, services, projects',
            fr: 'freelance, Tunisie, missions, freelances, services, projets',
        },
    },
    jobs: {
        title: {
            ar: 'تصفح وظائف العمل الحر',
            en: 'Browse Freelance Jobs',
            fr: 'Parcourir les missions freelance',
        },
        description: {
            ar: 'اكتشف فرص العمل الحر في تونس وابحث عن مشاريع تناسب مهاراتك.',
            en: 'Discover freelance opportunities in Tunisia and find projects that match your skills.',
            fr: 'Découvrez des missions freelance en Tunisie et trouvez des projets adaptés à vos compétences.',
        },
        keywords: {
            ar: 'وظائف, عمل حر, مشاريع, فرص عمل, تونس',
            en: 'jobs, freelance, projects, Tunisia',
            fr: 'missions, freelance, projets, Tunisie',
        },
    },
    findFreelancers: {
        title: {
            ar: 'ابحث عن مستقلين موهوبين',
            en: 'Find Skilled Freelancers',
            fr: 'Trouver des freelances qualifiés',
        },
        description: {
            ar: 'وظف أفضل المستقلين في تونس في التصميم والتطوير والكتابة والتسويق.',
            en: 'Hire top Tunisian freelancers across design, development, writing, and marketing.',
            fr: 'Recrutez les meilleurs freelances tunisiens en design, développement, rédaction et marketing.',
        },
        keywords: {
            ar: 'مستقلين, محترفين, توظيف, فريلانسر, تونس',
            en: 'freelancers, hiring, Tunisia',
            fr: 'freelances, recrutement, Tunisie',
        },
    },
    howItWorks: {
        title: {
            ar: 'كيف تعمل المنصة',
            en: 'How Khedma Works',
            fr: 'Comment Khedma fonctionne',
        },
        description: {
            ar: 'تعرف على كيفية استخدام خدمة للعثور على مشاريع أو توظيف مستقلين بخطوات بسيطة.',
            en: 'Learn how to use Khedma to find projects or hire freelancers with a simple workflow.',
            fr: 'Découvrez comment utiliser Khedma pour trouver des missions ou recruter des freelances avec un parcours simple.',
        },
        keywords: {
            ar: 'كيف تعمل, دليل الاستخدام, البدء, خدمة',
            en: 'how it works, guide, getting started',
            fr: 'fonctionnement, guide, démarrer',
        },
    },
    forClients: {
        title: {
            ar: 'للعملاء وأصحاب المشاريع',
            en: 'For Clients & Project Owners',
            fr: 'Pour les clients et porteurs de projet',
        },
        description: {
            ar: 'انشر مشروعك واحصل على عروض من مستقلين محترفين في تونس.',
            en: 'Post your project and receive offers from vetted Tunisian professionals.',
            fr: 'Publiez votre projet et recevez des offres de professionnels tunisiens qualifiés.',
        },
        keywords: {
            ar: 'أصحاب مشاريع, عملاء, توظيف, مستقلين',
            en: 'clients, hiring, projects',
            fr: 'clients, recrutement, projets',
        },
    },
    faq: {
        title: {
            ar: 'الأسئلة الشائعة',
            en: 'Frequently Asked Questions',
            fr: 'Questions fréquentes',
        },
        description: {
            ar: 'إجابات على أكثر الأسئلة شيوعاً حول خدمة والعمل الحر في تونس.',
            en: 'Answers to the most common questions about Khedma and freelance work in Tunisia.',
            fr: 'Réponses aux questions les plus fréquentes sur Khedma et le freelance en Tunisie.',
        },
        keywords: {
            ar: 'أسئلة شائعة, مساعدة, دعم',
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
            ar: 'اقرأ شروط وأحكام استخدام منصة خدمة.',
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
            ar: 'تعرف على كيفية حماية بياناتك وخصوصيتك على منصة خدمة.',
            en: 'Learn how your data and privacy are protected on Khedma.',
            fr: 'Découvrez comment vos données et votre vie privée sont protégées sur Khedma.',
        },
        keywords: {
            ar: 'خصوصية, حماية البيانات, أمان',
            en: 'privacy, data protection, security',
            fr: 'confidentialité, protection des données, sécurité',
        },
    },
    login: {
        title: {
            ar: 'تسجيل الدخول',
            en: 'Login',
            fr: 'Connexion',
        },
        description: {
            ar: 'سجل دخولك إلى حسابك على خدمة للوصول إلى مشاريعك ورسائلك.',
            en: 'Sign in to your Khedma account to access your projects and messages.',
            fr: 'Connectez-vous à votre compte Khedma pour accéder à vos projets et messages.',
        },
        keywords: {
            ar: 'تسجيل دخول, حساب',
            en: 'login, account',
            fr: 'connexion, compte',
        },
    },
    signup: {
        title: {
            ar: 'إنشاء حساب جديد',
            en: 'Create an Account',
            fr: 'Créer un compte',
        },
        description: {
            ar: 'انضم إلى خدمة اليوم وابدأ رحلتك في العمل الحر أو التوظيف.',
            en: 'Join Khedma today to start freelancing or hire top independent talent.',
            fr: 'Rejoignez Khedma pour lancer votre activité freelance ou recruter des talents indépendants.',
        },
        keywords: {
            ar: 'تسجيل, حساب جديد, انضمام',
            en: 'signup, new account, join',
            fr: 'inscription, nouveau compte, rejoindre',
        },
    },
    dashboard: {
        title: {
            ar: 'لوحة التحكم',
            en: 'Dashboard',
            fr: 'Tableau de bord',
        },
        description: {
            ar: 'إدارة مشاريعك وعروضك ورسائلك من لوحة التحكم الخاصة بك.',
            en: 'Manage your projects, offers, and messages from your dashboard.',
            fr: 'Gérez vos projets, vos offres et vos messages depuis votre tableau de bord.',
        },
        keywords: {
            ar: 'لوحة تحكم, إدارة',
            en: 'dashboard, management',
            fr: 'tableau de bord, gestion',
        },
    },
    messages: {
        title: {
            ar: 'الرسائل',
            en: 'Messages',
            fr: 'Messages',
        },
        description: {
            ar: 'تواصل بأمان مع العملاء والمستقلين عبر نظام الرسائل.',
            en: 'Chat securely with clients and freelancers through Khedma messaging.',
            fr: 'Échangez en toute sécurité avec les clients et freelances via la messagerie Khedma.',
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
            ar: 'إدارة إعدادات حسابك والإشعارات والخصوصية.',
            en: 'Manage your account settings, notifications, and privacy preferences.',
            fr: 'Gérez les paramètres de votre compte, vos notifications et vos préférences de confidentialité.',
        },
        keywords: {
            ar: 'إعدادات, حساب, تفضيلات',
            en: 'settings, account, preferences',
            fr: 'paramètres, compte, préférences',
        },
    },
    profile: {
        title: {
            ar: 'الملف الشخصي',
            en: 'Profile',
            fr: 'Profil',
        },
        description: {
            ar: 'عرض وتعديل ملفك الشخصي على خدمة.',
            en: 'View and edit your Khedma profile.',
            fr: 'Consultez et modifiez votre profil Khedma.',
        },
        keywords: {
            ar: 'ملف شخصي, حساب',
            en: 'profile, account',
            fr: 'profil, compte',
        },
    },
    postJob: {
        title: {
            ar: 'نشر مشروع جديد',
            en: 'Post a New Project',
            fr: 'Publier un nouveau projet',
        },
        description: {
            ar: 'انشر مشروعك واحصل على عروض من أفضل المستقلين في تونس.',
            en: 'Publish your project and receive offers from top freelancers in Tunisia.',
            fr: 'Publiez votre projet et recevez des offres des meilleurs freelances en Tunisie.',
        },
        keywords: {
            ar: 'نشر مشروع, توظيف, عرض عمل',
            en: 'post project, hiring, job post',
            fr: 'publier projet, recrutement, mission',
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
            en: 'Complete your freelancer profile and start receiving job opportunities on Khedma.',
            fr: 'Finalisez votre profil freelance et commencez à recevoir des opportunités sur Khedma.',
        },
        keywords: {
            ar: 'انضمام, مستقل, فريلانسر',
            en: 'freelancer onboarding, setup, profile',
            fr: 'onboarding freelance, configuration, profil',
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
            ar: 'انضمام, عميل, صاحب مشروع',
            en: 'client onboarding, setup, projects',
            fr: 'onboarding client, configuration, projets',
        },
    },
    earnings: {
        title: {
            ar: 'الأرباح',
            en: 'Earnings',
            fr: 'Revenus',
        },
        description: {
            ar: 'تتبع أرباحك ومدفوعاتك على منصة خدمة.',
            en: 'Track your earnings and payouts on Khedma.',
            fr: 'Suivez vos revenus et vos paiements sur Khedma.',
        },
        keywords: {
            ar: 'أرباح, مدفوعات, مالية',
            en: 'earnings, payouts, finance',
            fr: 'revenus, paiements, finance',
        },
    },
    portfolio: {
        title: {
            ar: 'معرض الأعمال',
            en: 'Portfolio',
            fr: 'Portfolio',
        },
        description: {
            ar: 'اعرض أعمالك السابقة أمام العملاء المحتملين.',
            en: 'Showcase your past work to potential clients.',
            fr: 'Présentez vos réalisations aux clients potentiels.',
        },
        keywords: {
            ar: 'معرض أعمال, بورتفوليو, نماذج',
            en: 'portfolio, work samples, showcase',
            fr: 'portfolio, réalisations, vitrine',
        },
    },
    contracts: {
        title: {
            ar: 'العقود',
            en: 'Contracts',
            fr: 'Contrats',
        },
        description: {
            ar: 'إدارة عقودك النشطة والمكتملة.',
            en: 'Manage your active and completed contracts.',
            fr: 'Gérez vos contrats actifs et terminés.',
        },
        keywords: {
            ar: 'عقود, مشاريع, اتفاقيات',
            en: 'contracts, agreements, projects',
            fr: 'contrats, accords, projets',
        },
    },
    search: {
        title: {
            ar: 'نتائج البحث',
            en: 'Search Results',
            fr: 'Résultats de recherche',
        },
        description: {
            ar: 'نتائج البحث عبر الوظائف والمستقلين والمحتوى على خدمة.',
            en: 'Search results across jobs, freelancers, and content on Khedma.',
            fr: 'Résultats de recherche parmi les missions, freelances et contenus sur Khedma.',
        },
        keywords: {
            ar: 'بحث, نتائج',
            en: 'search, results',
            fr: 'recherche, résultats',
        },
    },
} as const;
