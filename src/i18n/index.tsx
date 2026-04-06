import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ar } from './ar';
import type { Translations } from './ar';
import { fr } from './fr';
import { en } from './en';
import type { Language } from '../types';

type TranslationParams = Record<string, string | number>;

const applyDocumentLanguage = (lang: Language) => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);

    if (document.body) {
        document.body.setAttribute('dir', dir);
    }
};

// Immediately set HTML attributes to prevent flash of wrong direction
const savedLang = (localStorage.getItem('i18n-language') || localStorage.getItem('language') || navigator.language.split('-')[0] || 'ar') as Language;
const validLang = ['ar', 'fr', 'en'].includes(savedLang) ? savedLang : 'ar';
applyDocumentLanguage(validLang);

const translations: Record<Language, Translations> = { ar, fr, en };
const warnedMissingKeys = new Set<string>();

const getNestedValue = (obj: unknown, path: string): unknown => {
    if (!path) return undefined;
    return path.split('.').reduce<unknown>((current, segment) => {
        if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
            return (current as Record<string, unknown>)[segment];
        }
        return undefined;
    }, obj);
};

const interpolate = (text: string, params?: TranslationParams): string => {
    if (!params) return text;
    return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
        const value = params[key];
        return value === undefined ? '' : String(value);
    });
};

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
    tx: (key: string, params?: TranslationParams, fallback?: string) => string;
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
        applyDocumentLanguage(lang);
    }, []);

    // Set initial direction
    React.useEffect(() => {
        applyDocumentLanguage(language);
    }, [language]);

    const tx = useCallback((key: string, params?: TranslationParams, fallback?: string) => {
        const primary = getNestedValue(translations[language], key);
        const fallbackEn = getNestedValue(translations.en, key);
        const fallbackAr = getNestedValue(translations.ar, key);
        const fallbackFr = getNestedValue(translations.fr, key);

        const resolved = [primary, fallbackEn, fallbackAr, fallbackFr, fallback, key].find((item) => typeof item === 'string') as string;

        if (import.meta.env.DEV && typeof primary !== 'string') {
            const marker = `${language}:${key}`;
            if (!warnedMissingKeys.has(marker)) {
                warnedMissingKeys.add(marker);
                console.warn(`[i18n] Missing key "${key}" for language "${language}"`);
            }
        }

        return interpolate(resolved, params);
    }, [language]);

    const value: I18nContextType = useMemo(() => ({
        language,
        setLanguage,
        t: translations[language],
        tx,
        dir: language === 'ar' ? 'rtl' : 'ltr',
    }), [language, setLanguage, tx]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}
