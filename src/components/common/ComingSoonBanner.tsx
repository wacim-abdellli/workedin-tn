import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/i18n';

const STORAGE_KEY = 'workedin_banner_dismissed_payment_v1';

const MESSAGES: Record<'ar' | 'fr' | 'en', string> = {
    ar: '🎉 قريباً: طرق دفع فلوسي و D17 — المزيد من خيارات الدفع على WorkedIn!',
    fr: '🎉 Bientôt : Flouci & D17 — plus de moyens de paiement sur WorkedIn !',
    en: '🎉 Coming Soon: Flouci & D17 payment methods — more ways to pay on WorkedIn!',
};

export default function ComingSoonBanner() {
    return null;
}
