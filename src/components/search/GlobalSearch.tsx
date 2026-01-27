import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    X,
    Clock,
    Briefcase,
    User,
    Tag,
    TrendingUp,
    ArrowRight,
    Command,
    Sparkles
} from 'lucide-react';
import { useTranslation } from '../../i18n';

interface SearchResult {
    id: string;
    type: 'job' | 'freelancer' | 'skill';
    title: string;
    subtitle?: string;
    avatar?: string;
    rating?: number;
    budget?: string;
}

const MOCK_JOBS: SearchResult[] = [
    { id: 'j1', type: 'job', title: 'تصميم شعار احترافي', subtitle: 'تصميم جرافيكي', budget: '150-300 د.ت' },
    { id: 'j2', type: 'job', title: 'تطوير موقع تجارة إلكترونية', subtitle: 'برمجة وتطوير', budget: '1000-2000 د.ت' },
    { id: 'j3', type: 'job', title: 'ترجمة وثائق قانونية', subtitle: 'كتابة وترجمة', budget: '200-400 د.ت' },
];

const MOCK_FREELANCERS: SearchResult[] = [
    { id: 'f1', type: 'freelancer', title: 'أحمد بن علي', subtitle: 'مصمم جرافيكي', rating: 4.9 },
    { id: 'f2', type: 'freelancer', title: 'سارة المنصوري', subtitle: 'مطورة ويب', rating: 4.8 },
    { id: 'f3', type: 'freelancer', title: 'محمد الشريف', subtitle: 'مترجم محترف', rating: 4.7 },
];

const TRENDING_SEARCHES = [
    'تصميم شعار',
    'تطوير موقع',
    'ترجمة',
    'تسويق رقمي',
    'كتابة محتوى',
];

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([
        'تصميم',
        'مطور React',
        'ترجمة عربي انجليزي',
    ]);
    const [results, setResults] = useState<{
        jobs: SearchResult[];
        freelancers: SearchResult[];
        skills: string[];
    }>({ jobs: [], freelancers: [], skills: [] });
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!query.trim()) {
            setResults({ jobs: [], freelancers: [], skills: [] });
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            const filteredJobs = MOCK_JOBS.filter(j =>
                j.title.includes(query) || j.subtitle?.includes(query)
            );
            const filteredFreelancers = MOCK_FREELANCERS.filter(f =>
                f.title.includes(query) || f.subtitle?.includes(query)
            );
            const skills = ['تصميم', 'برمجة', 'ترجمة', 'تسويق'].filter(s =>
                s.includes(query)
            );

            setResults({
                jobs: filteredJobs,
                freelancers: filteredFreelancers,
                skills,
            });
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setRecentSearches(prev => {
            const filtered = prev.filter(s => s !== searchQuery);
            return [searchQuery, ...filtered].slice(0, 5);
        });

        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        onClose();
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
    };

    const hasResults = results.jobs.length > 0 || results.freelancers.length > 0 || results.skills.length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-dark-900/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            {/* Search Modal */}
            <div className="relative mx-auto mt-20 max-w-2xl px-4 animate-slide-up">
                <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-dark-100 dark:border-dark-700 overflow-hidden ring-1 ring-black/5">
                    {/* Search Input */}
                    <div className="flex items-center gap-4 p-4 border-b border-dark-100 dark:border-dark-700 bg-white/50 dark:bg-dark-800/50">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
                            <Search className="w-5 h-5 text-white" />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder={t.search.placeholder}
                            className="flex-1 bg-transparent outline-none text-xl text-dark-900 dark:text-white placeholder-dark-400"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-dark-400" />
                            </button>
                        )}
                        <kbd className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg text-xs font-medium text-dark-500">
                            <span className="text-sm">ESC</span>
                        </kbd>
                    </div>

                    {/* Content */}
                    <div className="max-h-[60vh] overflow-y-auto bg-white/50 dark:bg-dark-900/50">
                        {/* Loading */}
                        {isSearching && (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        )}

                        {/* Results */}
                        {!isSearching && hasResults && (
                            <div className="p-4 space-y-6">
                                {/* Jobs */}
                                {results.jobs.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3 px-2">
                                            <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                {t.search.jobs}
                                            </h3>
                                            <button
                                                onClick={() => handleSearch(query)}
                                                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                            >
                                                {t.publicProfile.showMore}
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {results.jobs.map(job => (
                                                <button
                                                    key={job.id}
                                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                                    className="w-full flex items-center gap-4 p-3 hover:bg-dark-50 dark:hover:bg-dark-800 rounded-xl text-right transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-300">
                                                        <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400 group-hover:text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-dark-900 dark:text-white truncate">{job.title}</p>
                                                        <p className="text-sm text-dark-500">{job.subtitle} • <span className="text-success-600 dark:text-success-400 font-medium">{job.budget}</span></p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-dark-300 group-hover:text-primary-500 group-hover:-translate-x-1 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Freelancers */}
                                {results.freelancers.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3 px-2">
                                            <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                {t.search.freelancers}
                                            </h3>
                                            <button
                                                onClick={() => navigate(`/find-freelancers?q=${encodeURIComponent(query)}`)}
                                                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                            >
                                                {t.publicProfile.showMore}
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {results.freelancers.map(freelancer => (
                                                <button
                                                    key={freelancer.id}
                                                    onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                                                    className="w-full flex items-center gap-4 p-3 hover:bg-dark-50 dark:hover:bg-dark-800 rounded-xl text-right transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                                                        {freelancer.title.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-dark-900 dark:text-white truncate">{freelancer.title}</p>
                                                        <p className="text-sm text-dark-500">{freelancer.subtitle} • <span className="text-warning-500">⭐ {freelancer.rating}</span></p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-dark-300 group-hover:text-accent-500 group-hover:-translate-x-1 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Skills */}
                                {results.skills.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2 mb-3 px-2">
                                            <Tag className="w-4 h-4" />
                                            {t.search.skills}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 px-2">
                                            {results.skills.map(skill => (
                                                <button
                                                    key={skill}
                                                    onClick={() => handleSearch(`skill:${skill}`)}
                                                    className="px-4 py-2 bg-dark-50 dark:bg-dark-800 hover:bg-white dark:hover:bg-dark-700 border border-dark-100 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:text-primary-600 dark:hover:text-primary-400"
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No Query State */}
                        {!query && !isSearching && (
                            <div className="p-4 space-y-8">
                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3 px-2">
                                            <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {t.search.recent}
                                            </h3>
                                            <button
                                                onClick={clearRecentSearches}
                                                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
                                            >
                                                {t.search.clearAll}
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            {recentSearches.map((search, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSearch(search)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-dark-50 dark:hover:bg-dark-800 rounded-xl text-right transition-colors group"
                                                >
                                                    <Clock className="w-4 h-4 text-dark-400 group-hover:text-primary-500 transition-colors" />
                                                    <span className="flex-1 font-medium text-dark-700 dark:text-dark-300">{search}</span>
                                                    <ArrowRight className="w-4 h-4 text-dark-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Trending */}
                                <div>
                                    <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2 mb-4 px-2">
                                        <TrendingUp className="w-4 h-4" />
                                        {t.search.trending}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 px-2">
                                        {TRENDING_SEARCHES.map((search, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSearch(search)}
                                                className="px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/40 text-primary-700 dark:text-primary-300 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-900/40 dark:hover:to-primary-900/60 rounded-full text-sm font-medium transition-all duration-200 border border-transparent hover:border-primary-200 dark:hover:border-primary-700 flex items-center gap-2"
                                            >
                                                <Sparkles className="w-3 h-3 text-primary-500" />
                                                {search}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Results */}
                        {query && !isSearching && !hasResults && (
                            <div className="p-12 text-center">
                                <div className="w-20 h-20 bg-dark-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-10 h-10 text-dark-300" />
                                </div>
                                <p className="text-xl font-bold text-dark-900 dark:text-white mb-2">{t.search.noResults} "{query}"</p>
                                <p className="text-dark-500">{t.search.noResultsDesc}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-800 border-t border-dark-100 dark:border-dark-700 text-xs text-dark-500 font-medium">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <kbd className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 px-1 bg-white dark:bg-dark-700 border border-dark-200 dark:border-dark-600 rounded text-[10px] font-sans">↵</kbd>
                                <span className="hidden sm:inline">{t.common.search}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="hidden sm:inline-flex items-center justify-center min-w-[28px] h-5 px-1 bg-white dark:bg-dark-700 border border-dark-200 dark:border-dark-600 rounded text-[10px] font-sans">ESC</kbd>
                                <span className="hidden sm:inline">{t.common.close}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Command className="w-3 h-3" />
                            <span>+ K</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
