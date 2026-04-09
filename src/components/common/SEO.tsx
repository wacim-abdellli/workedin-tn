 import { Helmet } from 'react-helmet-async';

import { useTranslation } from '../../i18n';
import type { Language } from '../../types';

type LocalizedText = string | Partial<Record<Language, string>>;

interface SEOProps {
    title: LocalizedText;
    description: LocalizedText;
    image?: string;
    url?: string;
    canonical?: string;
    type?: 'website' | 'article' | 'profile';
    twitterCard?: 'summary' | 'summary_large_image';
    keywords?: LocalizedText;
    locale?: string;
    noIndex?: boolean;
}

type SEOConfigEntry = Pick<SEOProps, 'title' | 'description' | 'keywords' | 'image' | 'type'>;

const SITE_NAME: Record<Language, string> = {
    ar: 'WorkedIn',
    en: 'WorkedIn',
    fr: 'WorkedIn',
};

const OG_LOCALE: Record<Language, string> = {
    ar: 'ar_TN',
    en: 'en_US',
    fr: 'fr_FR',
};

const DEFAULT_IMAGE = '/logos/logo-og.svg';
const SITE_URL = import.meta.env.VITE_APP_URL || 'https://workedin.tn';

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
    canonical,
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
        resolvedTitle && resolvedTitle !== siteName && resolvedTitle !== 'WorkedIn'
            ? `WorkedIn - ${resolvedTitle}`
            : siteName;

    const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
    const resolvedUrl = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : undefined;
    const canonicalUrl = canonical
        ? (canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`)
        : typeof window !== 'undefined'
            ? `${window.location.origin}${window.location.pathname}`
            : resolvedUrl || SITE_URL;
    const ogUrl = canonicalUrl || resolvedUrl;

    return (
        <Helmet htmlAttributes={{ lang: language, dir: language === 'ar' ? 'rtl' : 'ltr' }}>
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={resolvedDescription} />
            {resolvedKeywords && <meta name="keywords" content={resolvedKeywords} />}
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            <link rel="canonical" href={canonicalUrl} />

            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={resolvedDescription} />
            <meta property="og:image" content={fullImageUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:locale" content={resolvedLocale} />
            <meta property="og:url" content={ogUrl} />

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
            ar: 'WorkedIn',
            en: 'WorkedIn',
            fr: 'WorkedIn',
        },
        description: {
            ar: 'تبحث ع�  �&حترف�`�  ت��� س�`�`�  �&��ث��`�  ��&شار�`عْ�x ا� شر �&شر��عْ �&جا� ا�9 ع��0 WorkedIn ��اب/أ ا�ع�&� ا��`���&.',
            en: 'Connect with verified Tunisian professionals for your projects. Secure payments in TND and escrow protection.',
            fr: 'Connectez-vous avec des professionnels tunisiens vérifiés pour vos projets. Paiements sécurisés en TND et protection escrow.',
        },
        keywords: {
            ar: 'ع�&� حر, ت��� س, �&ست����� , �&شار�`ع, ��ظائف, /�`� ار ت��� س�`, ض�&ا� ',
            en: 'freelance Tunisia, Tunisian freelancers, TND payments, escrow, projects, talent marketplace',
            fr: 'freelance Tunisie, freelances tunisiens, paiements TND, escrow, projets, talents',
        },
    },
    jobs: {
        title: {
            ar: '��ظائف ���&شار�`ع �&ست��ة',
            en: 'Freelance Jobs',
            fr: 'Missions freelance',
        },
        description: {
            ar: 'استْشف �&شار�`ع ج/�`/ة ف�` ت��� س ��ابحث ع�  فرص ت� اسب �&�!اراتْ ��سعرْ ��خبرتْ.',
            en: 'Browse freelance jobs in Tunisia and find projects that match your skills, rate, and availability.',
            fr: 'Parcourez les missions freelance en Tunisie et trouvez des projets adaptés à vos compétences, votre tarif et votre disponibilité.',
        },
        keywords: {
            ar: '��ظائف, �&شار�`ع, ع�&� حر, ت��� س',
            en: 'freelance jobs, Tunisia jobs, projects, remote work',
            fr: 'missions freelance, projets, Tunisie, travail indépendant',
        },
    },
    findFreelancers: {
        title: {
            ar: 'اعثر ع��0 �&حترف�`�  ت��� س�`�`�  �&��ث����`� ',
            en: 'Find Verified Tunisian Professionals',
            fr: 'Trouvez des professionnels tunisiens vérifiés',
        },
        description: {
            ar: 'أْثر �&�  2500 �&حترف ت��� س�` �&��ث� ���&ُ��`�}��& ��جا�!ز ��ع�&� عبر ا�تص�&�`�&�R ا�تط���`ر�R ا�ترج�&ة ��ا�استشارة.',
            en: 'Find 2,500+ verified Tunisian developers, designers, translators, and consultants ready to start.',
            fr: 'Trouvez 2 500+ développeurs, designers, traducteurs et consultants tunisiens vérifiés, notés et disponibles.',
        },
        keywords: {
            ar: '�&ست����� , ت��ظ�`ف, ت��� س, �&حترف��� , �&��ث������ ',
            en: 'hire freelancers Tunisia, verified professionals, Tunisian talent',
            fr: 'recruter freelances Tunisie, talents vérifiés, professionnels tunisiens',
        },
    },
    howItWorks: {
        title: {
            ar: 'ْ�`ف تع�&� WorkedIn',
            en: 'How WorkedIn Works',
            fr: 'Comment fonctionne WorkedIn',
        },
        description: {
            ar: 'أربع خط��ات �&�  فْرة ا��&شر��ع إ��0 است�ا�& ا�/فع�R �&ع ض�&ا� �R تح�� �!���`ة�R ��تتبع ��اضح �ْ� /�`� ار.',
            en: 'See how WorkedIn takes you from project idea to approved payment in four protected steps.',
            fr: 'Découvrez comment WorkedIn vous fait passer de l\'idée au paiement validé en quatre étapes protégées.',
        },
        keywords: {
            ar: 'ْ�`ف �`ع�&�, �&� صة ع�&� حر, ض�&ا� , تح�� �!���`ة',
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
            ar: 'ا� شر �&شر��عْ �&جا� ا�9�R است�ب� عر��ضا�9 �&�  �&حترف�`�  �&��ث��`� �R ��ا/فع ف�ط ع� / ا��&��اف�ة �&ع ح�&ا�`ة ْا�&�ة با�ض�&ا� .',
            en: 'Post your project for free, receive proposals from verified professionals, and pay only when work is approved.',
            fr: 'Publiez gratuitement, recevez des propositions de professionnels vérifiés et payez uniquement à la validation.',
        },
        keywords: {
            ar: 'ع�&�اء, �&شار�`ع, ت��ظ�`ف, ت��� س, ض�&ا� ',
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
            ar: 'إجابات ��اضحة ح��� طر�`�ة ا�ع�&��R ا�/فع�R ا�ض�&ا� �R ��ا��!���`ة ع��0 WorkedIn.',
            en: 'Find answers about payments, escrow, identity verification, and how WorkedIn works.',
            fr: 'Retrouvez des réponses sur les paiements, l\'escrow, la vérification d\'identité et le fonctionnement de WorkedIn.',
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
            fr: 'Conditions d\'utilisation',
        },
        description: {
            ar: 'اطلع على شروط وأحكام استخدام منصة WorkedIn.',
            en: 'Read the terms and conditions for using the WorkedIn platform.',
            fr: 'Consultez les conditions d\'utilisation de la plateforme WorkedIn.',
        },
        keywords: {
            ar: 'شروط الاستخدام، أحكام، قانوني',
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
            ar: 'تعر�ف ع��0 ْ�`ف�`ة ح�&ا�`ة ب�`ا� اتْ ��خص��ص�`تْ ع��0 WorkedIn.',
            en: 'Learn how WorkedIn protects your data and privacy.',
            fr: 'Découvrez comment WorkedIn protège vos données et votre vie privée.',
        },
        keywords: {
            ar: 'خصوصية, حماية البيانات, أمان',
            en: 'privacy, data protection, security',
            fr: 'confidentialité, protection des données, sécurité',
        },
    },
    login: {
        title: {
            ar: 'سجّل الدخول إلى WorkedIn',
            en: 'Sign in to WorkedIn',
            fr: 'Connectez-vous à WorkedIn',
        },
        description: {
            ar: 'ع/ إ��0 حسابْ ع��0 WorkedIn ��تابع �&شار�`عْ ��رسائ�ْ ���&/ف��عاتْ.',
            en: 'Sign in to your WorkedIn account to manage projects, messages, and payments.',
            fr: 'Connectez-vous à votre compte WorkedIn pour gérer vos projets, messages et paiements.',
        },
        keywords: {
            ar: 'تسجيل الدخول, حساب, WorkedIn',
            en: 'sign in, account, WorkedIn login',
            fr: 'connexion, compte, WorkedIn',
        },
    },
    signup: {
        title: {
            ar: 'أنشئ حسابك على WorkedIn',
            en: 'Create your WorkedIn account',
            fr: 'Créez votre compte WorkedIn',
        },
        description: {
            ar: 'ا� ض�& إ��0 أْثر �&�  2500 �&حترف �`ب� ���  �&س�`رت�!�& ���`ُ/�`ر���  �&شار�`ع�!�& ع��0 WorkedIn.',
            en: 'Create your account and join 2,500+ professionals building their career on WorkedIn.',
            fr: 'Créez votre compte et rejoignez 2 500+ professionnels qui développent leur carrière sur WorkedIn.',
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
            ar: 'تابع �&شار�`عْ ��رسائ�ْ ��أرباحْ �&�  DH-) 'D*-CE ا�خاصة بْ ع��0 WorkedIn.',
            en: 'Track projects, messages, and earnings from your WorkedIn dashboard.',
            fr: 'Suivez vos projets, messages et revenus depuis votre tableau de bord WorkedIn.',
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
            ar: 'تواصل بأمان مع العملاء والمستقلين عبر رسائل WorkedIn.',
            en: 'Chat securely with clients and freelancers through WorkedIn messaging.',
            fr: 'Ã‰changez en toute sécurité avec clients et freelances via la messagerie WorkedIn.',
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
            ar: 'إع/ا/ات, حساب, تفض�`�ات',
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
            ar: 'استعرض F*'&, 'D(-+ عبر ا���ظائف ��ا��&ست���`�  ��ا��&حت���0 ع��0 WorkedIn.',
            en: 'Browse search results across jobs, freelancers, and content on WorkedIn.',
            fr: 'Parcourez les résultats de recherche parmi les missions, freelances et contenus sur WorkedIn.',
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
            ar: 'أْ�&� �&�فْ ْ�&ست�� ��اب/أ است�با� فرص ا�ع�&� ع��0 WorkedIn.',
            en: 'Complete your freelancer profile and start getting matched to real work on WorkedIn.',
            fr: 'Finalisez votre profil freelance et commencez à recevoir de vraies opportunités sur WorkedIn.',
        },
        keywords: {
            ar: '�&ست��, �&�ف شخص�`, إع/ا/',
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
            ar: 'أكمل حسابك كعميل وابدأ نشر مشاريعك على WorkedIn.',
            en: 'Complete your client account and start posting projects on WorkedIn.',
            fr: 'Finalisez votre compte client et commencez à publier vos projets sur WorkedIn.',
        },
        keywords: {
            ar: 'عميل, مشروع, إعداد حساب',
            en: 'client onboarding, project setup',
            fr: 'onboarding client, configuration projet',
        },
    },
};


