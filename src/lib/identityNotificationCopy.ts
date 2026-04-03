export type IdentityNotificationLanguage = 'ar' | 'en' | 'fr';
export type IdentityNotificationKind = 'submitted' | 'approved' | 'rejected';

const identityNotificationCopy: Record<IdentityNotificationLanguage, Record<IdentityNotificationKind, { title: string; body: string }>> = {
    ar: {
        submitted: {
            title: 'تم استلام طلب التوثيق',
            body: 'تم استلام طلب التحقق من الهوية بنجاح. فريقنا يراجع مستنداتك الآن.',
        },
        approved: {
            title: 'تم قبول توثيق هويتك',
            body: 'تهانينا! تمت الموافقة على توثيق هويتك بنجاح ويمكنك الآن الاستفادة من جميع مزايا المنصة.',
        },
        rejected: {
            title: 'تم رفض طلب توثيق الهوية',
            body: 'عذراً، تم رفض طلب توثيق الهوية. يرجى التأكد من وضوح الصور ثم إعادة التقديم.',
        },
    },
    en: {
        submitted: {
            title: 'Identity verification request received',
            body: 'Your identity verification request was submitted successfully. Our team is now reviewing your documents.',
        },
        approved: {
            title: 'Your identity has been verified',
            body: 'Congratulations! Your identity was verified successfully and you can now access all platform features.',
        },
        rejected: {
            title: 'Identity verification request rejected',
            body: 'Your identity verification request was rejected. Please make sure the images are clear and submit again.',
        },
    },
    fr: {
        submitted: {
            title: 'Demande de verification recue',
            body: 'Votre demande de verification d\'identite a ete envoyee avec succes. Notre equipe examine maintenant vos documents.',
        },
        approved: {
            title: 'Votre identite a ete verifiee',
            body: 'Felicitations ! Votre identite a ete verifiee avec succes et vous pouvez maintenant acceder a toutes les fonctionnalites de la plateforme.',
        },
        rejected: {
            title: 'Demande de verification rejetee',
            body: 'Votre demande de verification d\'identite a ete rejetee. Assurez-vous que les images sont claires puis renvoyez votre demande.',
        },
    },
};

export function normalizeIdentityNotificationLanguage(value?: string | null): IdentityNotificationLanguage {
    if (value === 'ar' || value === 'fr' || value === 'en') return value;
    return 'en';
}

export function getIdentityNotificationCopy(kind: IdentityNotificationKind, language?: string | null) {
    return identityNotificationCopy[normalizeIdentityNotificationLanguage(language)][kind];
}
