import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    X,
    Clock,
    Briefcase,
    User,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

// --- Types ---
interface SearchResult {
    id: string;
    type: 'job' | 'freelancer' | 'skill';
    title: string;
    subtitle?: string;
    avatar?: string;
    rating?: number;
    budget?: string;
}

// --- Mock Data ---
const MOCK_JOBS: SearchResult[] = [
    { id: 'j1', type: 'job', title: 'تصميم شعار احترافي', subtitle: 'Design & Creative', budget: '150-300 TND' },
    { id: 'j2', type: 'job', title: 'Développement Site E-commerce', subtitle: 'Development', budget: '2000+ TND' },
    { id: 'j3', type: 'job', title: 'ترجمة وثائق قانونية', subtitle: 'Writing', budget: '50/page' },
];

const MOCK_FREELANCERS: SearchResult[] = [
    { id: 'f1', type: 'freelancer', title: 'Ahmed Ben Ali', subtitle: 'Senior Graphic Designer', rating: 4.9 },
    { id: 'f2', type: 'freelancer', title: 'Sarah Mansouri', subtitle: 'Full Stack Developer', rating: 5.0 },
];

const TRENDING_SEARCH_KEYS = [
    'search.suggestions.logoDesign',
    'search.suggestions.reactJs',
    'search.suggestions.translation',
    'search.suggestions.videoEditing',
    'search.suggestions.python',
];

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // State
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<{ jobs: SearchResult[], freelancers: SearchResult[] }>({ jobs: [], freelancers: [] });
    const [recentSearches, setRecentSearches] = useState<string[]>(() => [
        tx('search.suggestions.mobileApp', undefined, 'Mobile App'),
        tx('search.suggestions.logo', undefined, 'Logo'),
        tx('search.suggestions.seo', undefined, 'SEO'),
    ]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure render
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = 'hidden'; // Lock Body Scroll
        } else {
            document.body.style.overflow = ''; // Unlock Body Scroll
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Keyboard Events (ESC to close)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Search Logic (Mock)
    useEffect(() => {
        if (!query.trim()) {
            setResults({ jobs: [], freelancers: [] });
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            const filteredJobs = MOCK_JOBS.filter(j => j.title.toLowerCase().includes(query.toLowerCase()));
            const filteredFreelancers = MOCK_FREELANCERS.filter(f => f.title.toLowerCase().includes(query.toLowerCase()));

            setResults({ jobs: filteredJobs, freelancers: filteredFreelancers });
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelectSearch = (term: string) => {
        navigate(`/search?q=${encodeURIComponent(term)}`);
        setRecentSearches(prev => [term, ...prev.filter(i => i !== term)].slice(0, 5));
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content - Command Palette Style */}
            <div
                ref={modalRef}
                className="relative w-full max-w-xl bg-card dark:bg-dark-900 rounded-2xl shadow-2xl border border-dark-100 dark:border-dark-700 overflow-hidden flex flex-col max-h-[70vh] animate-scale-in duration-200"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 20px 50px -12px rgba(0,0,0,0.5)' }}
            >
                {/* Search Header */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-dark-100 dark:border-dark-800 shrink-0">
                    <Search className="w-5 h-5 text-dark-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={tx('globalSearch.placeholder', undefined, 'Search jobs, freelancers, skills...')}
                        className="flex-1 bg-transparent text-lg font-medium text-dark-900 dark:text-white placeholder-dark-400 outline-none border-none p-0"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="p-1 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-dark-50 dark:bg-dark-800 rounded text-[10px] font-bold text-dark-400 font-mono border border-dark-200 dark:border-dark-700">
                        {tx('ui.esc')}</kbd>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">

                    {/* Empty State / Initial View */}
                    {!query && (
                        <>
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-3 py-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">{tx('globalSearch.recent', undefined, 'Recent searches')}</div>
                                    <div className="space-y-1">
                                        {recentSearches.map(term => (
                                            <button
                                                key={term}
                                                onClick={() => handleSelectSearch(term)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-800/80 text-left transition-colors group"
                                            >
                                                <Clock className="w-4 h-4 text-dark-400 group-hover:text-primary-500 transition-colors" />
                                                <span className="text-dark-700 dark:text-dark-200">{term}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggestions */}
                            <div>
                                <div className="px-3 py-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">{tx('globalSearch.suggestions', undefined, 'Suggestions')}</div>
                                <div className="flex flex-wrap gap-2 px-3 pb-2">
                                    {TRENDING_SEARCH_KEYS.map((termKey) => {
                                        const { tx } = useTranslation();
                                        const term = tx(termKey, undefined, termKey)
                                        return (
                                        <button
                                            key={termKey}
                                            onClick={() => handleSelectSearch(term)}
                                            className="px-3 py-1.5 rounded-lg bg-dark-50 dark:bg-dark-800 text-sm text-dark-700 dark:text-dark-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 border border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all"
                                        >
                                            {term}
                                        </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Results Loading */}
                    {isSearching && (
                        <div className="py-12 flex flex-col items-center justify-center text-dark-400">
                            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <span className="text-sm">{tx('globalSearch.searching', undefined, 'Searching...')}</span>
                        </div>
                    )}

                    {/* Active Results */}
                    {query && !isSearching && (
                        <div className="space-y-4">
                            {/* Jobs */}
                            {results.jobs.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-semibold text-dark-400 uppercase tracking-wider flex items-center gap-2">
                                        <Briefcase className="w-3 h-3" /> {tx('globalSearch.jobs', undefined, 'Jobs')}
                                    </div>
                                    {results.jobs.map(job => (
                                        <button
                                            key={job.id}
                                            onClick={() => navigate(`/jobs/${job.id}`)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-800 text-left group transition-colors"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <Briefcase className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-dark-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                        {job.title}
                                                    </div>
                                                    <div className="text-xs text-dark-500 truncate">{job.subtitle}</div>
                                                </div>
                                            </div>
                                            <div className="px-2 py-1 rounded text-xs font-medium bg-card dark:bg-dark-700 shadow-sm border border-dark-100 dark:border-dark-600 shrink-0">
                                                {job.budget}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Freelancers */}
                            {results.freelancers.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-semibold text-dark-400 uppercase tracking-wider flex items-center gap-2">
                                        <User className="w-3 h-3" /> {tx('globalSearch.freelancers', undefined, 'Freelancers')}
                                    </div>
                                    {results.freelancers.map(freelancer => (
                                        <button
                                            key={freelancer.id}
                                            onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-800 text-left group transition-colors"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-accent-700 dark:text-accent-400">{freelancer.title.charAt(0)}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-dark-900 dark:text-white truncate group-hover:text-accent-600 transition-colors">
                                                        {freelancer.title}
                                                    </div>
                                                    <div className="text-xs text-dark-500 truncate">{freelancer.subtitle}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-medium text-warning-600">
                                                <span>★</span> {freelancer.rating}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Nothing Found */}
                            {results.jobs.length === 0 && results.freelancers.length === 0 && (
                                <div className="py-12 text-center text-dark-500">
                                    <p>{tx('globalSearch.noResultsFor', { query }, `No results found for "${query}"`)}</p>
                                    <button onClick={() => setQuery('')} className="text-sm text-primary-600 hover:underline mt-2">{tx('globalSearch.clearSearch', undefined, 'Clear search')}</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Tips */}
                <div className="bg-dark-50 dark:bg-dark-800/50 px-4 py-2 text-[10px] text-dark-400 border-t border-dark-100 dark:border-dark-800 flex items-center justify-between shrink-0">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 bg-card dark:bg-dark-700 rounded border border-dark-200 dark:border-dark-600">↵</kbd>
                            <span>{tx('globalSearch.toSelect', undefined, 'to select')}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 bg-card dark:bg-dark-700 rounded border border-dark-200 dark:border-dark-600">↑↓</kbd>
                            <span>{tx('globalSearch.toNavigate', undefined, 'to navigate')}</span>
                        </span>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}
