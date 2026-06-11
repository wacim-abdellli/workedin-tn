import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ar } from './ar';
import type { Translations } from './ar';
import { fr } from './fr';
import { en } from './en';
import type { Language } from '../types';

type TranslationParams = Record<string, string | number>;

const SUPPORTED_LANGUAGES: readonly Language[] = ['ar', 'fr', 'en'];

const isSupportedLanguage = (value: unknown): value is Language =>
    typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value as Language);

const STORAGE_KEY = 'i18n-language';

const getStoredLanguage = (): Language | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        // Standardised to single key. Migrate legacy 'language' key on first read.
        const stored = window.localStorage.getItem(STORAGE_KEY)
            ?? window.localStorage.getItem('language');
        if (stored && isSupportedLanguage(stored)) {
            // Migrate: write canonical key, remove legacy key
            window.localStorage.setItem(STORAGE_KEY, stored);
            window.localStorage.removeItem('language');
            return stored;
        }
        return null;
    } catch {
        return null;
    }
};

const getBrowserLanguage = (): Language | null => {
    if (typeof navigator === 'undefined') {
        return null;
    }

    const raw = navigator.language?.split('-')[0]?.toLowerCase();
    return isSupportedLanguage(raw) ? raw : null;
};

const resolveInitialLanguage = (defaultLanguage: Language): Language =>
    getStoredLanguage() ?? getBrowserLanguage() ?? defaultLanguage;

const applyDocumentLanguage = (lang: Language) => {
    if (typeof document === 'undefined') {
        return;
    }

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    if (document.body) document.body.setAttribute('dir', dir);
};

applyDocumentLanguage(resolveInitialLanguage('ar'));

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
    txPlural: (key: string, count: number, params?: TranslationParams, fallback?: string) => string;
    dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
    children: ReactNode;
    defaultLanguage?: Language;
}

export function I18nProvider({ children, defaultLanguage = 'ar' }: I18nProviderProps) {
    const [language, setLanguageState] = useState<Language>(() => {
        return resolveInitialLanguage(defaultLanguage);
    });

    const setLanguage = useCallback((lang: Language) => {
        if (!isSupportedLanguage(lang)) {
            return;
        }

        setLanguageState((previousLanguage) => (previousLanguage === lang ? previousLanguage : lang));
    }, []);

    React.useEffect(() => {
        applyDocumentLanguage(language);

        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(STORAGE_KEY, language);
            // Clean up legacy key if it exists
            window.localStorage.removeItem('language');
        } catch {
            // Ignore storage restrictions (private mode, strict browser privacy settings).
        }
    }, [language]);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const handleStorage = (event: StorageEvent) => {
            if (event.key && event.key !== STORAGE_KEY) {
                return;
            }

            const nextLanguage = getStoredLanguage();
            if (nextLanguage && nextLanguage !== language) {
                setLanguageState(nextLanguage);
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
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
                const usedLang = typeof fallbackEn === 'string' ? 'en'
                    : typeof fallbackAr === 'string' ? 'ar'
                    : typeof fallbackFr === 'string' ? 'fr'
                    : 'fallback';
                console.warn(
                    `[i18n] Missing key "${key}" for language "${language}". Serving ${usedLang} fallback: "${resolved}"`
                );
            }
        }

        return interpolate(resolved, params);
    }, [language]);

    /** Pluralization helper: resolves key.one / key.other (or key.zero) based on count. */
    const txPlural = useCallback((key: string, count: number, params?: TranslationParams, fallback?: string) => {
        const pluralKey = count === 0 ? `${key}.zero` : count === 1 ? `${key}.one` : `${key}.other`;
        // Try the specific plural form first, then fall back to the base key
        const primaryForm = getNestedValue(translations[language], pluralKey);
        if (typeof primaryForm === 'string') {
            return interpolate(primaryForm, { count, ...params });
        }
        return tx(key, { count, ...params }, fallback);
    }, [language, tx]);

    const value: I18nContextType = useMemo(() => ({
        language,
        setLanguage,
        t: translations[language],
        tx,
        txPlural,
        dir: language === 'ar' ? 'rtl' : 'ltr',
    }), [language, setLanguage, tx, txPlural]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}
