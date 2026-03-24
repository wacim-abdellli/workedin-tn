import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, Command } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SearchModalProps {
    isScrolled: boolean;
    theme: string;
    language: string;
    t: {
        search: {
            placeholder: string;
            recent: string;
            trending: string;
            resultsFor: string;
            suggestions: {
                mobileApp: string;
                logo: string;
                seo: string;
                logoDesign: string;
                reactJs: string;
                translation: string;
                videoEditing: string;
                python: string;
            };
        };
        common: {
            navigate: string;
            select: string;
            close: string;
        };
    };
}

export function SearchModal({ isScrolled, theme, language, t }: SearchModalProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const isDarkShell = isScrolled || theme === 'dark';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') setSearchOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const recentSearches = [
        t.search.suggestions.mobileApp,
        t.search.suggestions.logo,
        t.search.suggestions.seo,
    ];

    const trendingSkills = [
        t.search.suggestions.logoDesign,
        t.search.suggestions.reactJs,
        t.search.suggestions.translation,
        t.search.suggestions.videoEditing,
        t.search.suggestions.python,
    ];

    const handleSearch = (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        setSearchQuery(trimmed);
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
        setSearchOpen(false);
    };

    return (
        <div className="hidden md:flex flex-1 max-w-xl mx-auto px-3 lg:px-4" ref={searchRef}>
            <div className="relative w-full">
                <button
                    onClick={() => setSearchOpen(true)}
                    className={cn(
                        'group relative flex min-h-[52px] w-full items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left transition-all duration-200',
                        isDarkShell
                            ? 'border border-white/10 bg-white/[0.04] text-gray-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-violet-500/30 hover:bg-white/[0.07]'
                            : 'border border-gray-200 bg-[#fbfbfe] text-gray-600 shadow-sm shadow-gray-200/40 hover:border-purple-200 hover:bg-white'
                    )}
                >
                    <Search className="h-4 w-4 flex-shrink-0 text-gray-500 transition-colors group-hover:text-violet-400" />
                    <span
                        className={cn(
                            'flex-1 truncate text-sm transition-colors',
                            isDarkShell ? 'text-gray-400 group-hover:text-gray-100' : 'text-gray-500 group-hover:text-gray-900'
                        )}
                    >
                        {t.search.placeholder}
                    </span>
                    <div
                        className={cn(
                            'hidden items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium sm:flex',
                            isDarkShell
                                ? 'border-white/10 bg-white/5 text-gray-400 group-hover:border-violet-500/30'
                                : 'border-gray-200 bg-white text-gray-500 group-hover:border-purple-200'
                        )}
                    >
                        <Command className="h-3 w-3" />
                        <span>K</span>
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/8 to-indigo-600/8 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>

                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.97 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className={cn(
                                'absolute left-0 right-0 top-full z-50 mt-3 w-full min-w-[430px] overflow-hidden rounded-[24px] border backdrop-blur-2xl',
                                isDarkShell
                                    ? 'border-white/10 bg-[#12101d]/95 shadow-2xl shadow-black/40'
                                    : 'border-gray-200 bg-white/95 shadow-2xl shadow-gray-200/70'
                            )}
                        >
                            <div className={cn('border-b p-4', isDarkShell ? 'border-white/10' : 'border-gray-100')}>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t.search.placeholder}
                                        autoFocus
                                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                                        className={cn(
                                            'w-full rounded-2xl border py-3.5 pl-12 pr-12 text-sm transition-all focus:outline-none focus:ring-2',
                                            isDarkShell
                                                ? 'border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-violet-500/20'
                                                : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20'
                                        )}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch(searchQuery);
                                            }
                                        }}
                                    />
                                    {searchQuery ? (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className={cn(
                                                'absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors',
                                                isDarkShell ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                                            )}
                                        >
                                            <X className="h-4 w-4 text-gray-400" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto">
                                {!searchQuery ? (
                                    <div className="space-y-6 p-4">
                                        <div>
                                            <div className="mb-3 flex items-center gap-2 px-2">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    {t.search.recent}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {recentSearches.map((search) => (
                                                    <button
                                                        key={search}
                                                        onClick={() => handleSearch(search)}
                                                        className={cn(
                                                            'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                                                            isDarkShell ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                                                isDarkShell
                                                                    ? 'bg-white/5 group-hover:bg-violet-600/20'
                                                                    : 'bg-gray-100 group-hover:bg-purple-100'
                                                            )}
                                                        >
                                                            <Clock className="h-4 w-4 text-gray-500 transition-colors group-hover:text-violet-400" />
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                'text-sm transition-colors',
                                                                isDarkShell ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
                                                            )}
                                                        >
                                                            {search}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-3 flex items-center gap-2 px-2">
                                                <TrendingUp className="h-4 w-4 text-gray-500" />
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    {t.search.trending}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {trendingSkills.map((skill) => (
                                                    <button
                                                        key={skill}
                                                        onClick={() => handleSearch(skill)}
                                                        className={cn(
                                                            'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
                                                            isDarkShell
                                                                ? 'border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 hover:border-violet-500/50 hover:from-violet-600/30 hover:to-indigo-600/30'
                                                                : 'border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100'
                                                        )}
                                                    >
                                                        {skill}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-4 pb-4">
                                        <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                            {t.search.resultsFor} "{searchQuery}"...
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div
                                className={cn(
                                    'border-t px-4 py-3',
                                    isDarkShell ? 'border-white/10 bg-white/[0.03]' : 'border-gray-100 bg-[#faf9fd]'
                                )}
                            >
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5">
                                            <kbd
                                                className={cn(
                                                    'rounded border px-2 py-1 font-mono text-xs',
                                                    isDarkShell ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
                                                )}
                                            >
                                                ↑↓
                                            </kbd>
                                            <span>{t.common.navigate}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <kbd
                                                className={cn(
                                                    'rounded border px-2 py-1 font-mono text-xs',
                                                    isDarkShell ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
                                                )}
                                            >
                                                ↵
                                            </kbd>
                                            <span>{t.common.select}</span>
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-1.5">
                                        <kbd
                                            className={cn(
                                                'rounded border px-2 py-1 font-mono text-xs',
                                                isDarkShell ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
                                            )}
                                        >
                                            esc
                                        </kbd>
                                        <span>{t.common.close}</span>
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
