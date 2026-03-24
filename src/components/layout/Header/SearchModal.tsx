import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, RotateCcw, Briefcase, FileText, Wallet, User as UserIcon, Plus, FolderOpen, Users, ClipboardList, Settings, ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { getJobs } from '@/services/jobs';
import { getFreelancers } from '@/services/profiles';
import { getAvatarGradient, getInitials } from '@/lib/avatar';

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

const LOCAL_STORAGE_KEY = 'khedma_recent_searches';

function highlightMatch(text: string, query: string) {
    if (!query || !text) return <span>{text}</span>;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return <span>{text}</span>;
    return (
        <span className="truncate">
            {text.slice(0, index)}
            <mark className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded px-0.5 not-italic font-medium">
                {text.slice(index, index + query.length)}
            </mark>
            {text.slice(index + query.length)}
        </span>
    );
}

function getCategoryColor(skill: string) {
    const s = skill.toLowerCase();
    if (s.includes('design') || s.includes('logo')) return 'bg-pink-500';
    if (s.includes('react') || s.includes('python')) return 'bg-blue-500';
    if (s.includes('translation') || s.includes('seo')) return 'bg-emerald-500';
    return 'bg-violet-500';
}

export function SearchModal({ isScrolled, theme, language, t }: SearchModalProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    
    // Live results state
    const [isLoading, setIsLoading] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    
    // Keyboard nav state
    const [selectedIndex, setSelectedIndex] = useState(0);

    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const isDarkShell = isScrolled || theme === 'dark';
    const { isFreelancer, isClient } = useWorkspace();

    // Load recent searches on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) setRecentSearches(JSON.parse(saved));
        } catch {}
    }, []);

    const saveRecentSearch = (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        const newSearches = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
        setRecentSearches(newSearches);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSearches));
    };

    const removeRecentSearch = (e: React.MouseEvent, query: string) => {
        e.stopPropagation();
        const newSearches = recentSearches.filter(s => s !== query);
        setRecentSearches(newSearches);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSearches));
    };

    const clearAllRecent = () => {
        setRecentSearches([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    };

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
                setSearchOpen(open => !open);
            }
            if (searchOpen && e.key === 'Escape') {
                setSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchOpen]);

    // Live Search Effect
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setJobs([]);
            setFreelancers([]);
            setPages([]);
            setIsLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Determine matching pages
                const allPages = isFreelancer ? [
                    { title: 'Find Work', url: '/jobs', icon: Briefcase },
                    { title: 'My Proposals', url: '/my-proposals', icon: FileText },
                    { title: 'Contracts', url: '/contracts', icon: ClipboardList },
                    { title: 'Earnings', url: '/freelancer/earnings', icon: Wallet },
                    { title: 'Profile Settings', url: '/settings', icon: Settings },
                ] : [
                    { title: 'Post a Project', url: '/jobs/new', icon: Plus },
                    { title: 'My Projects', url: '/client/jobs', icon: FolderOpen },
                    { title: 'Find Freelancers', url: '/find-freelancers', icon: Users },
                    { title: 'Contracts', url: '/contracts', icon: ClipboardList },
                    { title: 'Account Settings', url: '/settings', icon: Settings },
                ];
                
                const q = searchQuery.toLowerCase();
                setPages(allPages.filter(p => p.title.toLowerCase().includes(q)).slice(0, 3));

                // Fetch real data
                const [jobsRes, freelancersRes] = await Promise.all([
                    getJobs({ search: searchQuery }, 1, 4),
                    isClient ? getFreelancers({ search: searchQuery }, 1, 3) : Promise.resolve({ data: [] }),
                ]);

                if (jobsRes.data) setJobs(jobsRes.data);
                if (freelancersRes && freelancersRes.data) setFreelancers(freelancersRes.data);
            } catch(e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, isFreelancer, isClient]);

    // Keyboard Navigation inside Modal
    const selectableItems = useMemo(() => {
        const items: any[] = [];
        if (!searchQuery) {
            recentSearches.forEach(s => items.push({ type: 'recent', query: s }));
            if (isFreelancer) {
                items.push({ type: 'nav', to: '/jobs' });
                items.push({ type: 'nav', to: '/my-proposals' });
                items.push({ type: 'nav', to: '/freelancer/earnings' });
                items.push({ type: 'nav', to: '/settings' });
            } else {
                items.push({ type: 'nav', to: '/jobs/new' });
                items.push({ type: 'nav', to: '/client/jobs' });
                items.push({ type: 'nav', to: '/find-freelancers' });
                items.push({ type: 'nav', to: '/contracts' });
            }
        } else {
            jobs.forEach(j => items.push({ type: 'job', job: j, to: `/jobs/${j.id}` }));
            freelancers.forEach(f => items.push({ type: 'freelancer', freelancer: f, to: `/freelancer/${f.username}` }));
            pages.forEach(p => items.push({ type: 'page', page: p, to: p.url }));
        }
        return items;
    }, [searchQuery, recentSearches, jobs, freelancers, pages, isFreelancer]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery, selectableItems.length]);

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % selectableItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + selectableItems.length) % selectableItems.length);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % selectableItems.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = selectableItems[selectedIndex];
            if (item) {
                if (item.type === 'recent') {
                    setSearchQuery(item.query);
                } else if (item.to) {
                    saveRecentSearch(searchQuery || item.title || '');
                    navigate(item.to);
                    setSearchOpen(false);
                }
            } else if (searchQuery.trim()) {
                handleSearch(searchQuery);
            }
        } else if (e.key === 'Backspace' && searchQuery === '') {
            e.preventDefault();
            setSearchOpen(false);
        }
    };

    const handleSearch = (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        saveRecentSearch(trimmed);
        
        setSearchQuery(trimmed);
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
        setSearchOpen(false);
    };

    const trendingSkills = [
        t.search.suggestions.logoDesign,
        t.search.suggestions.reactJs,
        t.search.suggestions.translation,
        t.search.suggestions.videoEditing,
        t.search.suggestions.python,
    ];

    const quickNavFreelancer = [
        { label: 'Browse all jobs', icon: Briefcase, to: '/jobs', shortcut: 'G J' },
        { label: 'My proposals', icon: FileText, to: '/my-proposals', shortcut: 'G P' },
        { label: 'My earnings', icon: Wallet, to: '/freelancer/earnings', shortcut: 'G E' },
        { label: 'Profile settings', icon: UserIcon, to: '/settings', shortcut: 'G S' },
    ];

    const quickNavClient = [
        { label: 'Post a project', icon: Plus, to: '/jobs/new', shortcut: 'P P' },
        { label: 'My projects', icon: FolderOpen, to: '/client/jobs', shortcut: 'G P' },
        { label: 'Find freelancers', icon: Users, to: '/find-freelancers', shortcut: 'G F' },
        { label: 'Contract workspace', icon: ClipboardList, to: '/contracts', shortcut: 'G C' },
    ];

    const activeQuickNav = isFreelancer ? quickNavFreelancer : quickNavClient;
    
    // Calculate global index for keyboard nav
    let globalIndexCounter = 0;

    return (
        <div className="relative" ref={searchRef}>
            {/* Header Search Trigger */}
            <button
                onClick={() => setSearchOpen(true)}
                className={cn(
                    'group relative flex h-10 w-[160px] lg:w-[180px] xl:w-[240px] items-center gap-2 overflow-hidden rounded-full shadow-sm px-3 text-start transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 shrink-0 border border-transparent',
                    isDarkShell
                        ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10 focus-visible:border-violet-500/40 focus-visible:ring-2 focus-visible:ring-violet-500/20'
                        : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200/50 hover:border-gray-300/50 focus-visible:border-purple-300 focus-visible:ring-2 focus-visible:ring-purple-200'
                )}
            >
                <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-violet-500" />
                <span className="flex-1 truncate text-sm font-medium transition-colors">
                    Search...
                </span>
                <div
                    className={cn(
                        'hidden shrink-0 items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-mono shadow-sm lg:flex transition-colors',
                        isDarkShell
                            ? 'border-white/10 bg-black/20 text-gray-400'
                            : 'border-gray-200 bg-white text-gray-400'
                    )}
                >
                    ⌘ K
                </div>
            </button>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {searchOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSearchOpen(false)}
                                className={cn(
                                    "fixed inset-0 z-[100] backdrop-blur-md transition-all",
                                    theme === 'dark' ? "bg-black/60" : "bg-[#0f0e17]/40"
                                )}
                            />
                            
                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className={cn(
                                    'fixed left-1/2 top-[12vh] z-[101] w-full max-w-[700px] -translate-x-1/2 overflow-hidden rounded-3xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl ring-1',
                                    theme === 'dark'
                                        ? 'bg-[#14121a]/95 ring-white/10'
                                        : 'bg-white/95 ring-black/5'
                                )}
                            >
                                {/* Search Input */}
                                <div className={cn('flex items-center px-4 border-b', theme === 'dark' ? 'border-white/5' : 'border-gray-100')}>
                                    <Search className="h-6 w-6 flex-shrink-0 text-purple-500 opacity-80" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleInputKeyDown}
                                        placeholder={isFreelancer ? "Search jobs, skills..." : "Search freelancers, skills..."}
                                        autoFocus
                                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                                        className={cn(
                                            'flex-1 h-[68px] bg-transparent px-4 text-xl font-medium focus:outline-none tracking-tight',
                                            theme === 'dark' ? 'text-white placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-400'
                                        )}
                                    />
                                    {searchQuery ? (
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-[10px] font-mono font-medium px-2 py-1 rounded-md border", theme === 'dark' ? "border-white/10 text-gray-500 bg-white/5" : "border-gray-200 text-gray-400 bg-gray-50")}>
                                                ESC
                                            </span>
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className={cn('rounded-full p-1.5 transition-colors', theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={cn("text-[10px] font-mono font-medium px-2 py-1 rounded-md border", theme === 'dark' ? "border-white/10 text-gray-500 bg-white/5" : "border-gray-200 text-gray-400 bg-gray-50")}>
                                            ESC
                                        </span>
                                    )}
                                </div>

                                <div className="max-h-[60vh] overflow-y-auto">
                                    {!searchQuery.trim() ? (
                                        <div className="p-4 space-y-6">
                                            {/* Recent Searches */}
                                            {recentSearches.length > 0 && (
                                                <section>
                                                    <div className="mb-3 flex items-center justify-between px-2">
                                                        <span className={cn("text-xs font-semibold uppercase tracking-widest", theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
                                                            Recent searches
                                                        </span>
                                                        <button 
                                                            onClick={clearAllRecent}
                                                            className="text-xs text-purple-500 hover:text-purple-600 cursor-pointer font-medium"
                                                        >
                                                            Clear all
                                                        </button>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {recentSearches.map((search) => {
                                                            const isFocused = globalIndexCounter === selectedIndex;
                                                            globalIndexCounter++;
                                                            return (
                                                                <button
                                                                    key={search}
                                                                    onClick={() => {
                                                                        setSearchQuery(search);
                                                                    }}
                                                                    className={cn(
                                                                        'group relative flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors',
                                                                        isFocused 
                                                                          ? (theme === 'dark' ? 'bg-white/5 border-l-2 border-violet-500 pl-[18px]' : 'bg-gray-100 border-l-2 border-violet-500 pl-[18px]') 
                                                                          : (theme === 'dark' ? 'hover:bg-white/[0.03] border-l-2 border-transparent pl-[18px]' : 'hover:bg-gray-50 border-l-2 border-transparent pl-[18px]')
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <RotateCcw className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-500" />
                                                                        <span className={cn('text-sm', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                                                                            {search}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <span 
                                                                            onClick={(e) => removeRecentSearch(e, search)}
                                                                            className="p-1 rounded bg-gray-200/50 hover:bg-red-100 text-gray-500 hover:text-red-500 dark:bg-black/20 dark:hover:bg-red-500/20 dark:text-gray-400 transition-colors"
                                                                        >
                                                                            <X className="h-3.5 w-3.5" />
                                                                        </span>
                                                                        <ArrowUpRight className="h-4 w-4 text-gray-400" />
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Trending */}
                                            <section>
                                                <div className="mb-3 flex items-center gap-2 px-2">
                                                    <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                                                    <span className={cn("text-xs font-semibold uppercase tracking-widest", theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
                                                        Trending now
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 px-2">
                                                    {trendingSkills.map((skill) => (
                                                        <button
                                                            key={skill}
                                                            onClick={() => handleSearch(skill)}
                                                            className={cn(
                                                                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out hover:scale-105 active:scale-95',
                                                                theme === 'dark' 
                                                                    ? 'border-white/5 bg-white/5 text-gray-300 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white' 
                                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 shadow-sm'
                                                            )}
                                                        >
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", getCategoryColor(skill))} />
                                                            {skill}
                                                        </button>
                                                    ))}
                                                </div>
                                            </section>

                                            {/* Quick Navigate */}
                                            <section>
                                                <div className="mt-6 mb-3 px-4">
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                                                        Go to
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    {activeQuickNav.map((nav) => {
                                                        const isFocused = globalIndexCounter === selectedIndex;
                                                        globalIndexCounter++;
                                                        return (
                                                            <button
                                                                key={nav.to}
                                                                onClick={() => {
                                                                    navigate(nav.to);
                                                                    setSearchOpen(false);
                                                                }}
                                                                className={cn(
                                                                    'group flex items-center justify-between px-5 py-3.5 text-left transition-colors',
                                                                    isFocused 
                                                                          ? (theme === 'dark' ? 'bg-white/5 border-l-[3px] border-violet-500 pl-[17px]' : 'bg-gray-100 border-l-[3px] border-violet-500 pl-[17px]') 
                                                                          : (theme === 'dark' ? 'hover:bg-white/[0.03] border-l-[3px] border-transparent pl-[17px]' : 'hover:bg-gray-50 border-l-[3px] border-transparent pl-[17px]')
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600')}>
                                                                        <nav.icon className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className={cn("text-sm font-medium", theme === 'dark' ? 'text-gray-200' : 'text-gray-700')}>{nav.label}</div>
                                                                    </div>
                                                                </div>
                                                                <kbd className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-opacity", theme === 'dark' ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400')}>
                                                                    {nav.shortcut}
                                                                </kbd>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        </div>
                                    ) : (
                                        <div className="p-2 py-4">
                                            {isLoading ? (
                                                <div className="space-y-4 px-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="flex gap-3 items-center w-full animate-pulse">
                                                            <div className={cn("h-8 w-8 rounded-full", theme === 'dark' ? 'bg-white/10' : 'bg-gray-200')} />
                                                            <div className="space-y-2 flex-1">
                                                                <div className={cn("h-3 w-1/3 rounded", theme === 'dark' ? 'bg-white/10' : 'bg-gray-200')} />
                                                                <div className={cn("h-2.5 w-1/4 rounded", theme === 'dark' ? 'bg-white/5' : 'bg-gray-100')} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : jobs.length === 0 && freelancers.length === 0 && pages.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <Search className={cn("h-8 w-8 mb-4", theme === 'dark' ? 'text-white/20' : 'text-gray-300')} />
                                                    <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-gray-300' : 'text-gray-800')}>No results for "{searchQuery}"</p>
                                                    <p className={cn("text-xs mt-1", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>Try searching for jobs, freelancers, or skills</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Jobs */}
                                                    {jobs.length > 0 && (
                                                        <section>
                                                            <div className="mb-2 flex items-center gap-2 px-3">
                                                                <span className={cn("text-xs font-semibold uppercase tracking-widest", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                                                                    Jobs
                                                                </span>
                                                                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", theme === 'dark' ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500')}>
                                                                    {jobs.length}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                {jobs.map(job => {
                                                                    const isFocused = globalIndexCounter === selectedIndex;
                                                                    globalIndexCounter++;
                                                                    return (
                                                                        <button
                                                                            key={job.id}
                                                                            onClick={() => {
                                                                                saveRecentSearch(searchQuery);
                                                                                navigate(`/jobs/${job.id}`);
                                                                                setSearchOpen(false);
                                                                            }}
                                                                            className={cn(
                                                                                'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all',
                                                                                isFocused 
                                                                                    ? (theme === 'dark' ? 'bg-purple-900/20 shadow-[inset_2px_0_0_0_#8b5cf6]' : 'bg-purple-50 shadow-[inset_2px_0_0_0_#8b5cf6]') 
                                                                                    : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50')
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={cn("w-2 h-2 rounded-full", getCategoryColor(job.category))} />
                                                                                <div>
                                                                                    <div className={cn('text-sm font-medium', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
                                                                                        {highlightMatch(job.title, searchQuery)}
                                                                                    </div>
                                                                                    <div className={cn("text-xs flex gap-2", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                                                                                        <span>{job.job_type === 'hourly' ? `$${job.hourly_rate}/hr` : `$${job.budget_min}-$${job.budget_max}`}</span>
                                                                                        <span>• {job.experience_level}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <ArrowUpRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </section>
                                                    )}

                                                    {/* Freelancers */}
                                                    {freelancers.length > 0 && (
                                                        <section>
                                                            <div className="mb-2 flex items-center px-3">
                                                                <span className={cn("text-xs font-semibold uppercase tracking-widest", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                                                                    Freelancers
                                                                </span>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                {freelancers.map(worker => {
                                                                    const isFocused = globalIndexCounter === selectedIndex;
                                                                    globalIndexCounter++;
                                                                    const name = worker.full_name || worker.username;
                                                                    const [from, to] = getAvatarGradient(name);
                                                                    return (
                                                                        <button
                                                                            key={worker.id}
                                                                            onClick={() => {
                                                                                saveRecentSearch(searchQuery);
                                                                                navigate(`/freelancer/${worker.username}`);
                                                                                setSearchOpen(false);
                                                                            }}
                                                                            className={cn(
                                                                                'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all',
                                                                                isFocused 
                                                                                    ? (theme === 'dark' ? 'bg-purple-900/20 shadow-[inset_2px_0_0_0_#8b5cf6]' : 'bg-purple-50 shadow-[inset_2px_0_0_0_#8b5cf6]') 
                                                                                    : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50')
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                {worker.avatar_url ? (
                                                                                    <img src={worker.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-black/5" />
                                                                                ) : (
                                                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                                                                                        {getInitials(name)}
                                                                                    </div>
                                                                                )}
                                                                                <div>
                                                                                    <div className={cn('text-sm font-medium', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
                                                                                        {highlightMatch(name, searchQuery)}
                                                                                    </div>
                                                                                    <div className={cn("text-xs", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                                                                                        {worker.freelancer_profiles?.[0]?.title || worker.location}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <ArrowUpRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </section>
                                                    )}

                                                    {/* Pages */}
                                                    {pages.length > 0 && (
                                                        <section>
                                                            <div className="mb-2 flex items-center px-3">
                                                                <span className={cn("text-xs font-semibold uppercase tracking-widest", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                                                                    Pages
                                                                </span>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                {pages.map(page => {
                                                                    const isFocused = globalIndexCounter === selectedIndex;
                                                                    globalIndexCounter++;
                                                                    return (
                                                                        <button
                                                                            key={page.url}
                                                                            onClick={() => {
                                                                                saveRecentSearch(searchQuery);
                                                                                navigate(page.url);
                                                                                setSearchOpen(false);
                                                                            }}
                                                                            className={cn(
                                                                                'group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all',
                                                                                isFocused 
                                                                                    ? (theme === 'dark' ? 'bg-purple-900/20 shadow-[inset_2px_0_0_0_#8b5cf6]' : 'bg-purple-50 shadow-[inset_2px_0_0_0_#8b5cf6]') 
                                                                                    : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50')
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}>
                                                                                    <page.icon className="h-3.5 w-3.5" />
                                                                                </div>
                                                                                <div>
                                                                                    <div className={cn('text-sm font-medium', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
                                                                                        {highlightMatch(page.title, searchQuery)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <ArrowUpRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </section>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Keyboard hints */}
                                <div
                                    className={cn(
                                        'px-4 py-3 flex items-center justify-between text-[11px] font-medium tracking-wide border-t',
                                        theme === 'dark' ? 'border-white/5 bg-[#14121a] text-gray-500' : 'border-gray-100 bg-gray-50/50 text-gray-500'
                                    )}
                                >
                                    <div className="flex items-center gap-6">
                                        <span className="flex items-center gap-2">
                                            <div className="flex gap-0.5">
                                                <kbd className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px] shadow-sm', theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white')}>↑</kbd>
                                                <kbd className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px] shadow-sm', theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white')}>↓</kbd>
                                            </div>
                                            <span>Navigate</span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <kbd className={cn('rounded border px-2 py-0.5 font-mono text-[10px] shadow-sm', theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white')}>↵</kbd>
                                            <span>Select</span>
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-2 opacity-70">
                                        <kbd className="font-mono">ESC</kbd>
                                        <span>Close</span>
                                    </span>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            , document.body)}
        </div>
    );
}
