import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/i18n';

const STORAGE_KEY = 'khedma_banner_dismissed_payment_v1';

const MESSAGES: Record<'ar' | 'fr' | 'en', string> = {
    ar: '🎉 قريباً: طرق دفع فلوسي و D17 — المزيد من خيارات الدفع على خدمتنا!',
    fr: '🎉 Bientôt : Flouci & D17 — plus de moyens de paiement sur Khedmetna !',
    en: '🎉 Coming Soon: Flouci & D17 payment methods — more ways to pay on Khedmetna!',
};

export default function ComingSoonBanner() {
    const { language } = useTranslation();
    const [visible, setVisible] = useState(false);

    // Delay mount check until after hydration to avoid SSR mismatch
    useEffect(() => {
        try {
            const dismissed = localStorage.getItem(STORAGE_KEY);
            if (!dismissed) setVisible(true);
        } catch {
            // localStorage unavailable (private browsing / SSR)
            setVisible(true);
        }
    }, []);

    const dismiss = () => {
        try {
            localStorage.setItem(STORAGE_KEY, '1');
        } catch {
            // ignore
        }
        setVisible(false);
    };

    if (!visible) return null;

    const lang = (language as string) in MESSAGES
        ? (language as 'ar' | 'fr' | 'en')
        : 'en';

    const isRTL = lang === 'ar';

    return (
        <div
            role="banner"
            dir={isRTL ? 'rtl' : 'ltr'}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
        >
            <div className="relative flex items-center justify-center px-10 py-2.5 text-center text-sm font-medium sm:text-base">
                <span className="leading-snug">{MESSAGES[lang]}</span>

                <button
                    type="button"
                    aria-label="Dismiss banner"
                    onClick={dismiss}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 rounded-full p-1 opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
