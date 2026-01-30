import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

type Language = 'ar' | 'fr' | 'en';

export interface LanguageSwitcherProps {
    isScrolled: boolean;
    theme: string;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const languages = [
    { code: 'ar' as const, name: 'العربية' },
    { code: 'fr' as const, name: 'Français' },
    { code: 'en' as const, name: 'English' }
];

export function LanguageSwitcher({ isScrolled, theme, language, setLanguage }: LanguageSwitcherProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={langRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMenuOpen(!menuOpen)}
                className={cn(
                    "flex items-center gap-1.5 p-1.5 rounded-xl transition-colors",
                    isScrolled || theme === 'dark'
                        ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
                aria-label="Change language"
            >
                <Globe className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">{language}</span>
            </motion.button>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-32 backdrop-blur-xl bg-gray-900/95 rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden z-[60]"
                    >
                        <div className="p-1">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setMenuOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-3 py-2 text-sm rounded-lg text-left transition-colors",
                                        language === lang.code
                                            ? "bg-violet-600/20 text-violet-400 font-bold"
                                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                    )}
                                    dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
