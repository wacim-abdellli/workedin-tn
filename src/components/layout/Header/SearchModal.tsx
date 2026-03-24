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

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
        t.search.suggestions.seo
    ];

    const trendingSkills = [
        t.search.suggestions.logoDesign,
        t.search.suggestions.reactJs,
        t.search.suggestions.translation,
        t.search.suggestions.videoEditing,
        t.search.suggestions.python
    ];

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        navigate(`/search?q=${query}`);
        setSearchOpen(false);
    };

    return (
        <div className="hidden md:flex flex-1 max-w-md mx-auto px-4" ref={searchRef}>
            <div className="relative w-full">
                <button
                    onClick={() => setSearchOpen(true)}
                    className={cn(
                        "group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                        isScrolled || theme === 'dark'
                            ? "bg-white/5 backdrop-blur-sm border border-white/10 text-gray-400 hover:bg-white/10 hover:border-violet-500/30"
                            : "bg-white border border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 hover:border-purple-200"
                    )}
                >
                    <Search className="w-4 h-4 flex-shrink-0 text-gray-500 group-hover:text-violet-400 transition-colors" />
                    <span className={cn(
                        "flex-1 text-sm text-left transition-colors truncate",
                        isScrolled || theme === 'dark' ? "group-hover:text-gray-200" : "group-hover:text-gray-900"
                    )}>
                        {t.search.placeholder}
                    </span>
                    <div className={cn(
                        "hidden sm:flex items-center gap-1 px-2 py-1 rounded border transition-colors",
                        isScrolled || theme === 'dark'
                            ? "bg-white/5 border-white/10 group-hover:border-violet-500/30"
                            : "bg-gray-50 border-gray-200 group-hover:border-purple-200"
                    )}>
                        <Command className="w-3 h-3" />
                        <span className="text-xs">K</span>
                    </div>
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/10 to-indigo-600/10" />
                    </div>
                </button>

                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className={cn(
                                "absolute top-full left-0 right-0 z-50 mt-3 w-full min-w-[400px] overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl",
                                isScrolled || theme === 'dark'
                                    ? "border-white/10 bg-[#12101d]/95"
                                    : "border-gray-200 bg-white/95 shadow-gray-200/70"
                            )}
                        >
                            {/* Input Section */}
                            <div className={cn("p-4", isScrolled || theme === 'dark' ? "border-b border-white/10" : "border-b border-gray-100")}>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t.search.placeholder}
                                        autoFocus
                                        className={cn(
                                            "w-full rounded-xl border py-3.5 pl-12 pr-12 font-sans transition-all",
                                            isScrolled || theme === 'dark'
                                                ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                                                : "border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                        )}
                                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && searchQuery) {
                                                handleSearch(searchQuery);
                                            }
                                        }}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="max-h-[500px] overflow-y-auto">
                                {!searchQuery && (
                                    <div className="p-4 space-y-6">
                                        {/* Recent Searches */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3 px-2">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    {t.search.recent}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {recentSearches.map((search) => (
                                                    <button
                                                        key={search}
                                                        onClick={() => handleSearch(search)}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 rounded-xl transition-colors text-left group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-violet-600/20 transition-colors">
                                                            <Clock className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                                                        </div>
                                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                                            {search}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Trending */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3 px-2">
                                                <TrendingUp className="w-4 h-4 text-gray-500" />
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    {t.search.trending}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {trendingSkills.map((skill) => (
                                                    <button
                                                        key={skill}
                                                        onClick={() => handleSearch(skill)}
                                                        className="px-4 py-2 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 text-violet-400 text-sm font-medium rounded-xl border border-violet-500/30 hover:border-violet-500/50 transition-all font-sans"
                                                    >
                                                        {skill}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {searchQuery && (
                                    <div className="px-4 pb-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 p-4">
                                            {t.search.resultsFor} "{searchQuery}"...
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5">
                                            <kbd className="px-2 py-1 bg-gray-700 text-gray-300 rounded border border-gray-600 font-mono text-xs">↑↓</kbd>
                                            <span>{t.common.navigate}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <kbd className="px-2 py-1 bg-gray-700 text-gray-300 rounded border border-gray-600 font-mono text-xs">↵</kbd>
                                            <span>{t.common.select}</span>
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-1.5">
                                        <kbd className="px-2 py-1 bg-gray-700 text-gray-300 rounded border border-gray-600 font-mono text-xs">esc</kbd>
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
