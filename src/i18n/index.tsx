import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ar } from './ar';
import type { Translations } from './ar';
import { fr } from './fr';
import { en } from './en';
import type { Language } from '../types';

const translations: Record<Language, Translations> = { ar, fr, en };

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
    dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
    children: ReactNode;
    defaultLanguage?: Language;
}

export function I18nProvider({ children, defaultLanguage = 'ar' }: I18nProviderProps) {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = (localStorage.getItem('i18n-language') || localStorage.getItem('language')) as Language;
        if (saved) return saved;

        // Auto-detect browser language on first visit
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'fr') return 'fr';
        if (browserLang === 'en') return 'en';
        return defaultLanguage;
    });

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('i18n-language', lang);
        localStorage.setItem('language', lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, []);

    // Set initial direction
    React.useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const value: I18nContextType = {
        language,
        setLanguage,
        t: translations[language],
        dir: language === 'ar' ? 'rtl' : 'ltr',
    };

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}
