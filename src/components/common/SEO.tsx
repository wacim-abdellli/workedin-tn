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
            ar: 'ØªØ¨Ø­Ø« Ø¹Ù† Ù…Ø­ØªØ±ÙÙŠÙ† ØªÙˆÙ†Ø³ÙŠÙŠÙ† Ù…ÙˆØ«Ù‚ÙŠÙ† Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ÙƒØŸ Ø§Ù†Ø´Ø± Ù…Ø´Ø±ÙˆØ¹Ùƒ Ù…Ø¬Ø§Ù†Ø§Ù‹ Ø¹Ù„Ù‰ WorkedIn ÙˆØ§Ø¨Ø¯Ø£ Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„ÙŠÙˆÙ….',
            en: 'Connect with verified Tunisian professionals for your projects. Secure payments in TND and escrow protection.',
            fr: 'Connectez-vous avec des professionnels tunisiens vérifiés pour vos projets. Paiements sécurisés en TND et protection escrow.',
        },
        keywords: {
            ar: 'Ø¹Ù…Ù„ Ø­Ø±, ØªÙˆÙ†Ø³, Ù…Ø³ØªÙ‚Ù„ÙˆÙ†, Ù…Ø´Ø§Ø±ÙŠØ¹, ÙˆØ¸Ø§Ø¦Ù, Ø¯ÙŠÙ†Ø§Ø± ØªÙˆÙ†Ø³ÙŠ, Ø¶Ù…Ø§Ù†',
            en: 'freelance Tunisia, Tunisian freelancers, TND payments, escrow, projects, talent marketplace',
            fr: 'freelance Tunisie, freelances tunisiens, paiements TND, escrow, projets, talents',
        },
    },
    jobs: {
        title: {
            ar: 'ÙˆØ¸Ø§Ø¦Ù ÙˆÙ…Ø´Ø§Ø±ÙŠØ¹ Ù…Ø³ØªÙ‚Ù„Ø©',
            en: 'Freelance Jobs',
            fr: 'Missions freelance',
        },
        description: {
            ar: 'Ø§Ø³ØªÙƒØ´Ù Ù…Ø´Ø§Ø±ÙŠØ¹ Ø¬Ø¯ÙŠØ¯Ø© ÙÙŠ ØªÙˆÙ†Ø³ ÙˆØ§Ø¨Ø­Ø« Ø¹Ù† ÙØ±Øµ ØªÙ†Ø§Ø³Ø¨ Ù…Ù‡Ø§Ø±Ø§ØªÙƒ ÙˆØ³Ø¹Ø±Ùƒ ÙˆØ®Ø¨Ø±ØªÙƒ.',
            en: 'Browse freelance jobs in Tunisia and find projects that match your skills, rate, and availability.',
            fr: 'Parcourez les missions freelance en Tunisie et trouvez des projets adaptés à vos compétences, votre tarif et votre disponibilité.',
        },
        keywords: {
            ar: 'ÙˆØ¸Ø§Ø¦Ù, Ù…Ø´Ø§Ø±ÙŠØ¹, Ø¹Ù…Ù„ Ø­Ø±, ØªÙˆÙ†Ø³',
            en: 'freelance jobs, Tunisia jobs, projects, remote work',
            fr: 'missions freelance, projets, Tunisie, travail indépendant',
        },
    },
    findFreelancers: {
        title: {
            ar: 'Ø§Ø¹Ø«Ø± Ø¹Ù„Ù‰ Ù…Ø­ØªØ±ÙÙŠÙ† ØªÙˆÙ†Ø³ÙŠÙŠÙ† Ù…ÙˆØ«ÙˆÙ‚ÙŠÙ†',
            en: 'Find Verified Tunisian Professionals',
            fr: 'Trouvez des professionnels tunisiens vérifiés',
        },
        description: {
            ar: 'Ø£ÙƒØ«Ø± Ù…Ù† 2500 Ù…Ø­ØªØ±Ù ØªÙˆÙ†Ø³ÙŠ Ù…ÙˆØ«Ù‚ ÙˆÙ…ÙÙ‚ÙŠÙŽÙ‘Ù… ÙˆØ¬Ø§Ù‡Ø² Ù„Ù„Ø¹Ù…Ù„ Ø¹Ø¨Ø± Ø§Ù„ØªØµÙ…ÙŠÙ…ØŒ Ø§Ù„ØªØ·ÙˆÙŠØ±ØŒ Ø§Ù„ØªØ±Ø¬Ù…Ø© ÙˆØ§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø©.',
            en: 'Find 2,500+ verified Tunisian developers, designers, translators, and consultants ready to start.',
            fr: 'Trouvez 2 500+ développeurs, designers, traducteurs et consultants tunisiens vérifiés, notés et disponibles.',
        },
        keywords: {
            ar: 'Ù…Ø³ØªÙ‚Ù„ÙˆÙ†, ØªÙˆØ¸ÙŠÙ, ØªÙˆÙ†Ø³, Ù…Ø­ØªØ±ÙÙˆÙ†, Ù…ÙˆØ«ÙˆÙ‚ÙˆÙ†',
            en: 'hire freelancers Tunisia, verified professionals, Tunisian talent',
            fr: 'recruter freelances Tunisie, talents vérifiés, professionnels tunisiens',
        },
    },
    howItWorks: {
        title: {
            ar: 'ÙƒÙŠÙ ØªØ¹Ù…Ù„ WorkedIn',
            en: 'How WorkedIn Works',
            fr: 'Comment fonctionne WorkedIn',
        },
        description: {
            ar: 'Ø£Ø±Ø¨Ø¹ Ø®Ø·ÙˆØ§Øª Ù…Ù† ÙÙƒØ±Ø© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø¥Ù„Ù‰ Ø§Ø³ØªÙ„Ø§Ù… Ø§Ù„Ø¯ÙØ¹ØŒ Ù…Ø¹ Ø¶Ù…Ø§Ù†ØŒ ØªØ­Ù‚Ù‚ Ù‡ÙˆÙŠØ©ØŒ ÙˆØªØªØ¨Ø¹ ÙˆØ§Ø¶Ø­ Ù„ÙƒÙ„ Ø¯ÙŠÙ†Ø§Ø±.',
            en: 'See how WorkedIn takes you from project idea to approved payment in four protected steps.',
            fr: 'Découvrez comment WorkedIn vous fait passer de l\'idée au paiement validé en quatre étapes protégées.',
        },
        keywords: {
            ar: 'ÙƒÙŠÙ ÙŠØ¹Ù…Ù„, Ù…Ù†ØµØ© Ø¹Ù…Ù„ Ø­Ø±, Ø¶Ù…Ø§Ù†, ØªØ­Ù‚Ù‚ Ù‡ÙˆÙŠØ©',
            en: 'how it works, escrow, verified freelancers, talent marketplace',
            fr: 'fonctionnement, escrow, freelances vérifiés, plateforme freelance',
        },
    },
    forClients: {
        title: {
            ar: 'Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡ ÙˆØ£ØµØ­Ø§Ø¨ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹',
            en: 'Hire Verified Tunisian Talent',
            fr: 'Recrutez des talents tunisiens vérifiés',
        },
        description: {
            ar: 'Ø§Ù†Ø´Ø± Ù…Ø´Ø±ÙˆØ¹Ùƒ Ù…Ø¬Ø§Ù†Ø§Ù‹ØŒ Ø§Ø³ØªÙ‚Ø¨Ù„ Ø¹Ø±ÙˆØ¶Ø§Ù‹ Ù…Ù† Ù…Ø­ØªØ±ÙÙŠÙ† Ù…ÙˆØ«Ù‚ÙŠÙ†ØŒ ÙˆØ§Ø¯ÙØ¹ ÙÙ‚Ø· Ø¹Ù†Ø¯ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© Ù…Ø¹ Ø­Ù…Ø§ÙŠØ© ÙƒØ§Ù…Ù„Ø© Ø¨Ø§Ù„Ø¶Ù…Ø§Ù†.',
            en: 'Post your project for free, receive proposals from verified professionals, and pay only when work is approved.',
            fr: 'Publiez gratuitement, recevez des propositions de professionnels vérifiés et payez uniquement à la validation.',
        },
        keywords: {
            ar: 'Ø¹Ù…Ù„Ø§Ø¡, Ù…Ø´Ø§Ø±ÙŠØ¹, ØªÙˆØ¸ÙŠÙ, ØªÙˆÙ†Ø³, Ø¶Ù…Ø§Ù†',
            en: 'hire Tunisian freelancers, client marketplace, escrow payments, post a project',
            fr: 'recruter freelances tunisiens, publier un projet, escrow, clients',
        },
    },
    faq: {
        title: {
            ar: 'Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø´Ø§Ø¦Ø¹Ø©',
            en: 'Frequently Asked Questions',
            fr: 'Questions fréquentes',
        },
        description: {
            ar: 'Ø¥Ø¬Ø§Ø¨Ø§Øª ÙˆØ§Ø¶Ø­Ø© Ø­ÙˆÙ„ Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¹Ù…Ù„ØŒ Ø§Ù„Ø¯ÙØ¹ØŒ Ø§Ù„Ø¶Ù…Ø§Ù†ØŒ ÙˆØ§Ù„Ù‡ÙˆÙŠØ© Ø¹Ù„Ù‰ WorkedIn.',
            en: 'Find answers about payments, escrow, identity verification, and how WorkedIn works.',
            fr: 'Retrouvez des réponses sur les paiements, l\'escrow, la vérification d\'identité et le fonctionnement de WorkedIn.',
        },
        keywords: {
            ar: 'Ø£Ø³Ø¦Ù„Ø© Ø´Ø§Ø¦Ø¹Ø©, Ø¯Ø¹Ù…, Ù…Ø³Ø§Ø¹Ø¯Ø©',
            en: 'faq, help, support',
            fr: 'faq, aide, support',
        },
    },
    terms: {
        title: {
            ar: 'Ø´Ø±ÙˆØ· Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…',
            en: 'Terms of Use',
            fr: 'Conditions d\'utilisation',
        },
        description: {
            ar: 'Ø§Ø·Ù„Ø¹ Ø¹Ù„Ù‰ Ø´Ø±ÙˆØ· ÙˆØ£Ø­ÙƒØ§Ù… Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù…Ù†ØµØ© WorkedIn.',
            en: 'Read the terms and conditions for using the WorkedIn platform.',
            fr: 'Consultez les conditions d\'utilisation de la plateforme WorkedIn.',
        },
        keywords: {
            ar: 'Ø´Ø±ÙˆØ· Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…, Ø£Ø­ÙƒØ§Ù…, Ù‚Ø§Ù†ÙˆÙ†',
            en: 'terms, conditions, legal',
            fr: 'conditions, utilisation, légal',
        },
    },
    privacy: {
        title: {
            ar: 'Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©',
            en: 'Privacy Policy',
            fr: 'Politique de confidentialité',
        },
        description: {
            ar: 'ØªØ¹Ø±Ù‘Ù Ø¹Ù„Ù‰ ÙƒÙŠÙÙŠØ© Ø­Ù…Ø§ÙŠØ© Ø¨ÙŠØ§Ù†Ø§ØªÙƒ ÙˆØ®ØµÙˆØµÙŠØªÙƒ Ø¹Ù„Ù‰ WorkedIn.',
            en: 'Learn how WorkedIn protects your data and privacy.',
            fr: 'Découvrez comment WorkedIn protège vos données et votre vie privée.',
        },
        keywords: {
            ar: 'Ø®ØµÙˆØµÙŠØ©, Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª, Ø£Ù…Ø§Ù†',
            en: 'privacy, data protection, security',
            fr: 'confidentialité, protection des données, sécurité',
        },
    },
    login: {
        title: {
            ar: 'Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¥Ù„Ù‰ WorkedIn',
            en: 'Sign in to WorkedIn',
            fr: 'Connectez-vous à WorkedIn',
        },
        description: {
            ar: 'Ø¹Ø¯ Ø¥Ù„Ù‰ Ø­Ø³Ø§Ø¨Ùƒ Ø¹Ù„Ù‰ WorkedIn ÙˆØªØ§Ø¨Ø¹ Ù…Ø´Ø§Ø±ÙŠØ¹Ùƒ ÙˆØ±Ø³Ø§Ø¦Ù„Ùƒ ÙˆÙ…Ø¯ÙÙˆØ¹Ø§ØªÙƒ.',
            en: 'Sign in to your WorkedIn account to manage projects, messages, and payments.',
            fr: 'Connectez-vous à votre compte WorkedIn pour gérer vos projets, messages et paiements.',
        },
        keywords: {
            ar: 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„, Ø­Ø³Ø§Ø¨, WorkedIn',
            en: 'sign in, account, WorkedIn login',
            fr: 'connexion, compte, WorkedIn',
        },
    },
    signup: {
        title: {
            ar: 'Ø£Ù†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ùƒ Ø¹Ù„Ù‰ WorkedIn',
            en: 'Create your WorkedIn account',
            fr: 'Créez votre compte WorkedIn',
        },
        description: {
            ar: 'Ø§Ù†Ø¶Ù… Ø¥Ù„Ù‰ Ø£ÙƒØ«Ø± Ù…Ù† 2500 Ù…Ø­ØªØ±Ù ÙŠØ¨Ù†ÙˆÙ† Ù…Ø³ÙŠØ±ØªÙ‡Ù… ÙˆÙŠÙØ¯ÙŠØ±ÙˆÙ† Ù…Ø´Ø§Ø±ÙŠØ¹Ù‡Ù… Ø¹Ù„Ù‰ WorkedIn.',
            en: 'Create your account and join 2,500+ professionals building their career on WorkedIn.',
            fr: 'Créez votre compte et rejoignez 2 500+ professionnels qui développent leur carrière sur WorkedIn.',
        },
        keywords: {
            ar: 'Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨, ØªØ³Ø¬ÙŠÙ„, Ù…Ø³ØªÙ‚Ù„, Ø¹Ù…ÙŠÙ„',
            en: 'create account, signup, freelance marketplace, client account',
            fr: 'créer un compte, inscription, freelance, client',
        },
    },
    dashboard: {
        title: {
            ar: 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…',
            en: 'Dashboard',
            fr: 'Tableau de bord',
        },
        description: {
            ar: 'ØªØ§Ø¨Ø¹ Ù…Ø´Ø§Ø±ÙŠØ¹Ùƒ ÙˆØ±Ø³Ø§Ø¦Ù„Ùƒ ÙˆØ£Ø±Ø¨Ø§Ø­Ùƒ Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… Ø§Ù„Ø®Ø§ØµØ© Ø¨Ùƒ Ø¹Ù„Ù‰ WorkedIn.',
            en: 'Track projects, messages, and earnings from your WorkedIn dashboard.',
            fr: 'Suivez vos projets, messages et revenus depuis votre tableau de bord WorkedIn.',
        },
        keywords: {
            ar: 'Ù„ÙˆØ­Ø© ØªØ­ÙƒÙ…, Ù…Ø´Ø§Ø±ÙŠØ¹, Ø£Ø±Ø¨Ø§Ø­',
            en: 'dashboard, earnings, projects',
            fr: 'tableau de bord, revenus, projets',
        },
    },
    messages: {
        title: {
            ar: 'Ø§Ù„Ø±Ø³Ø§Ø¦Ù„',
            en: 'Messages',
            fr: 'Messages',
        },
        description: {
            ar: 'ØªÙˆØ§ØµÙ„ Ø¨Ø£Ù…Ø§Ù† Ù…Ø¹ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ ÙˆØ§Ù„Ù…Ø³ØªÙ‚Ù„ÙŠÙ† Ø¹Ø¨Ø± Ø±Ø³Ø§Ø¦Ù„ WorkedIn.',
            en: 'Chat securely with clients and freelancers through WorkedIn messaging.',
            fr: 'Ã‰changez en toute sécurité avec clients et freelances via la messagerie WorkedIn.',
        },
        keywords: {
            ar: 'Ø±Ø³Ø§Ø¦Ù„, ØªÙˆØ§ØµÙ„, Ù…Ø­Ø§Ø¯Ø«Ø§Øª',
            en: 'messages, chat, communication',
            fr: 'messages, chat, communication',
        },
    },
    settings: {
        title: {
            ar: 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª',
            en: 'Settings',
            fr: 'Paramètres',
        },
        description: {
            ar: 'Ø£Ø¯Ø± Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆØ§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙˆØ§Ù„Ø®ØµÙˆØµÙŠØ© Ù…Ù† Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯.',
            en: 'Manage your account settings, notifications, and privacy from one place.',
            fr: 'Gérez vos paramètres de compte, notifications et préférences de confidentialité depuis un seul endroit.',
        },
        keywords: {
            ar: 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª, Ø­Ø³Ø§Ø¨, ØªÙØ¶ÙŠÙ„Ø§Øª',
            en: 'settings, account, preferences',
            fr: 'paramètres, compte, préférences',
        },
    },
    search: {
        title: {
            ar: 'Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø«',
            en: 'Search Results',
            fr: 'Résultats de recherche',
        },
        description: {
            ar: 'Ø§Ø³ØªØ¹Ø±Ø¶ Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø« Ø¹Ø¨Ø± Ø§Ù„ÙˆØ¸Ø§Ø¦Ù ÙˆØ§Ù„Ù…Ø³ØªÙ‚Ù„ÙŠÙ† ÙˆØ§Ù„Ù…Ø­ØªÙˆÙ‰ Ø¹Ù„Ù‰ WorkedIn.',
            en: 'Browse search results across jobs, freelancers, and content on WorkedIn.',
            fr: 'Parcourez les résultats de recherche parmi les missions, freelances et contenus sur WorkedIn.',
        },
        keywords: {
            ar: 'Ø¨Ø­Ø«, Ù†ØªØ§Ø¦Ø¬',
            en: 'search, results',
            fr: 'recherche, résultats',
        },
    },
    freelancerOnboarding: {
        title: {
            ar: 'Ø¥ÙƒÙ…Ø§Ù„ Ø­Ø³Ø§Ø¨ Ø§Ù„Ù…Ø³ØªÙ‚Ù„',
            en: 'Complete Freelancer Setup',
            fr: 'Finaliser le profil freelance',
        },
        description: {
            ar: 'Ø£ÙƒÙ…Ù„ Ù…Ù„ÙÙƒ ÙƒÙ…Ø³ØªÙ‚Ù„ ÙˆØ§Ø¨Ø¯Ø£ Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ ÙØ±Øµ Ø§Ù„Ø¹Ù…Ù„ Ø¹Ù„Ù‰ WorkedIn.',
            en: 'Complete your freelancer profile and start getting matched to real work on WorkedIn.',
            fr: 'Finalisez votre profil freelance et commencez à recevoir de vraies opportunités sur WorkedIn.',
        },
        keywords: {
            ar: 'Ù…Ø³ØªÙ‚Ù„, Ù…Ù„Ù Ø´Ø®ØµÙŠ, Ø¥Ø¹Ø¯Ø§Ø¯',
            en: 'freelancer onboarding, profile setup',
            fr: 'onboarding freelance, configuration du profil',
        },
    },
    clientOnboarding: {
        title: {
            ar: 'Ø¥ÙƒÙ…Ø§Ù„ Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¹Ù…ÙŠÙ„',
            en: 'Complete Client Setup',
            fr: 'Finaliser le profil client',
        },
        description: {
            ar: 'Ø£ÙƒÙ…Ù„ Ø­Ø³Ø§Ø¨Ùƒ ÙƒØ¹Ù…ÙŠÙ„ ÙˆØ§Ø¨Ø¯Ø£ Ù†Ø´Ø± Ù…Ø´Ø§Ø±ÙŠØ¹Ùƒ Ø¹Ù„Ù‰ WorkedIn.',
            en: 'Complete your client account and start posting projects on WorkedIn.',
            fr: 'Finalisez votre compte client et commencez à publier vos projets sur WorkedIn.',
        },
        keywords: {
            ar: 'Ø¹Ù…ÙŠÙ„, Ù…Ø´Ø±ÙˆØ¹, Ø¥Ø¹Ø¯Ø§Ø¯ Ø­Ø³Ø§Ø¨',
            en: 'client onboarding, project setup',
            fr: 'onboarding client, configuration projet',
        },
    },
};

