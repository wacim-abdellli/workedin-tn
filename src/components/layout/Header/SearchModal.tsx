import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Briefcase, FileText, Wallet, User as UserIcon, PlusCircle, FolderOpen, Users, ClipboardList } from 'lucide-react';

import { useWorkspace } from '@/contexts/WorkspaceContext';
import { getJobs } from '@/services/jobs';
import { cn } from '@/lib/utils';

export interface SearchModalProps {
    isScrolled?: boolean;
    theme: string;
    language: string;
    t: any;
}

const LOCAL_STORAGE_KEY = 'khedma_recent_searches';

function highlightMatch(text: string, query: string) {
    if (!query || !text) return <span>{text}</span>;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return <span>{text}</span>;
    return (
        <span>
            {text.slice(0, index)}
            <mark style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd', borderRadius: '3px', padding: '0 2px' }}>
                {text.slice(index, index + query.length)}
            </mark>
            {text.slice(index + query.length)}
        </span>
    );
}

function getCategoryColor(skill: string) {
    const s = (skill || '').toLowerCase();
    if (s.includes('design') || s.includes('logo')) return '#ec4899';
    if (s.includes('react') || s.includes('python')) return '#3b82f6';
    if (s.includes('translation') || s.includes('seo')) return '#10b981';
    return '#8b5cf6';
}

export function SearchModal({ theme, language, t }: SearchModalProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    
    // Live results state
    const [isLoading, setIsLoading] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    
    // Keyboard nav state
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { isFreelancer } = useWorkspace();
    const isDark = theme === 'dark';

    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) setRecentSearches(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to load recent searches', e);
        }
    }, []);

    const saveRecentSearch = (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        const newSearches = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
        setRecentSearches(newSearches);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSearches));
    };

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
            setIsLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Emulating user request: jobs ILIKE %query% LIMIT 5
                const jobsRes = await getJobs({ search: searchQuery }, 1, 5);
                if (jobsRes.data) setJobs(jobsRes.data.slice(0, 5));
            } catch(e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Keyboard Navigation
    const selectableItems = useMemo(() => {
        const items: any[] = [];
        if (!searchQuery) {
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
        }
        return items;
    }, [searchQuery, jobs, isFreelancer]);

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
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = selectableItems[selectedIndex];
            if (item && item.to) {
                if (searchQuery) saveRecentSearch(searchQuery);
                navigate(item.to);
                setSearchOpen(false);
            } else if (searchQuery.trim()) {
                saveRecentSearch(searchQuery);
                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchOpen(false);
            }
        }
    };

    const trendingSkills = [
        t?.search?.suggestions?.logoDesign || 'Logo Design',
        t?.search?.suggestions?.reactJs || 'React.js',
        t?.search?.suggestions?.translation || 'Translation',
        t?.search?.suggestions?.videoEditing || 'Video Editing',
        t?.search?.suggestions?.python || 'Python',
    ];

    const quickNavFreelancer = [
        { label: 'Browse all jobs', icon: Briefcase, to: '/jobs', shortcut: '⌘ J' },
        { label: 'My proposals', icon: FileText, to: '/my-proposals', shortcut: '⌘ P' },
        { label: 'My earnings', icon: Wallet, to: '/freelancer/earnings', shortcut: '⌘ E' },
        { label: 'Profile settings', icon: UserIcon, to: '/settings', shortcut: '⌘ S' },
    ];

    const quickNavClient = [
        { label: 'Post a project', icon: PlusCircle, to: '/jobs/new', shortcut: '⌘ N' },
        { label: 'My projects', icon: FolderOpen, to: '/client/jobs', shortcut: '⌘ P' },
        { label: 'Find freelancers', icon: Users, to: '/find-freelancers', shortcut: '⌘ F' },
        { label: 'Contracts', icon: ClipboardList, to: '/contracts', shortcut: '⌘ C' },
    ];

    const activeQuickNav = isFreelancer ? quickNavFreelancer : quickNavClient;
    
    let globalIndexCounter = 0;

    return (
        <div className="relative">
            {/* Header Search Trigger */}
            <button
                onClick={() => setSearchOpen(true)}
                className={cn(
                    "group relative flex h-10 w-[140px] lg:w-[180px] xl:w-[220px] items-center gap-2.5 overflow-hidden rounded-xl px-3 text-start transition-all duration-300 ease-out shrink-0 border",
                    isDark 
                        ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.5)]" 
                        : "bg-gray-100/80 border-gray-200 hover:bg-gray-200/50 hover:border-gray-300 shadow-sm"
                )}
            >
                <Search className="h-4 w-4 shrink-0 transition-colors text-gray-400 group-hover:text-purple-400" />
                <span className="flex-1 truncate text-[13px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {t?.search?.placeholder || 'Search...'}
                </span>
                <div
                    className={cn(
                        "hidden shrink-0 items-center justify-center rounded-lg border px-1.5 py-0.5 text-[10px] font-bold tracking-tighter lg:flex transition-all",
                        isDark 
                            ? "bg-black/40 border-white/10 text-gray-500" 
                            : "bg-white border-gray-200 text-gray-400"
                    )}
                >
                    <span className="opacity-50 mr-0.5">⌘</span>K
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
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 50,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(4px)',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center',
                                    paddingTop: '80px'
                                }}
                            />
                            
                            {/* Modal Panel */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                style={{
                                    position: 'fixed',
                                    zIndex: 51,
                                    top: '80px',
                                    left: '50%',
                                    transform: 'translateX(-50%)', // Initial centering before Framer handles it
                                    width: '560px',
                                    maxWidth: 'calc(100vw - 32px)',
                                    backgroundColor: isDark ? '#1a1825' : '#ffffff',
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* Search Input Row */}
                                <div style={{
                                    height: '52px',
                                    padding: '0 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f3f4f6'
                                }}>
                                    <Search style={{ width: '18px', height: '18px', color: '#6b6880flexShrink: 0' }} />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleInputKeyDown}
                                        placeholder={isFreelancer ? "Search jobs, skills..." : "Search freelancers, skills..."}
                                        autoFocus
                                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                                        style={{
                                            flex: 1,
                                            fontSize: '16px',
                                            background: 'transparent',
                                            color: isDark ? 'white' : '#1a1825',
                                            border: 'none',
                                            outline: 'none',
                                        }}
                                        className="placeholder-[#6b6880]"
                                    />
                                    <span style={{
                                        fontSize: '11px',
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: '6px',
                                        padding: '2px 6px',
                                        color: '#6b6880',
                                        fontFamily: 'monospace'
                                    }}>
                                        ESC
                                    </span>
                                </div>

                                {/* Body */}
                                <div style={{
                                    padding: '8px',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}>
                                    {!searchQuery.trim() ? (
                                        <>
                                            {/* Trending */}
                                            <div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    color: '#6b6880',
                                                    padding: '8px 8px 4px'
                                                }}>
                                                    Trending now
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 8px 8px' }}>
                                                    {trendingSkills.map((skill) => (
                                                        <button
                                                            key={skill}
                                                            onClick={() => setSearchQuery(skill)}
                                                            className="transition-all duration-100 ease-in-out hover:bg-[rgba(139,92,246,0.25)]"
                                                            style={{
                                                                fontSize: '12px',
                                                                fontWeight: 500,
                                                                backgroundColor: 'rgba(139,92,246,0.15)',
                                                                color: '#a78bfa',
                                                                border: '1px solid rgba(139,92,246,0.2)',
                                                                borderRadius: '8px',
                                                                padding: '4px 10px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {skill}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Go To */}
                                            <div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    color: '#6b6880',
                                                    padding: '8px 8px 4px'
                                                }}>
                                                    Go to
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {activeQuickNav.map((nav) => {
                                                        const isFocused = globalIndexCounter === selectedIndex;
                                                        globalIndexCounter++;
                                                        
                                                        const isClientIcon = !isFreelancer;
                                                        const iconBg = isClientIcon ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)';
                                                        const iconColor = isClientIcon ? '#fbbf24' : '#a78bfa';

                                                        return (
                                                            <button
                                                                key={nav.to}
                                                                onClick={() => {
                                                                    navigate(nav.to);
                                                                    setSearchOpen(false);
                                                                }}
                                                                className="transition-all"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '40px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                    padding: '0 8px',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    backgroundColor: isFocused ? 'rgba(139,92,246,0.15)' : 'transparent',
                                                                    borderLeft: isFocused ? '2px solid #8b5cf6' : '2px solid transparent',
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: '28px', height: '28px', borderRadius: '8px',
                                                                    backgroundColor: iconBg, color: iconColor,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}>
                                                                    <nav.icon style={{ width: '14px', height: '14px' }} />
                                                                </div>
                                                                <span style={{ fontSize: '14px', color: isDark ? '#e2e1f0' : '#1f2937', flex: 1, textAlign: 'left' }}>
                                                                    {nav.label}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '10px', fontFamily: 'monospace',
                                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                    borderRadius: '4px', padding: '1px 5px',
                                                                    color: '#6b6880'
                                                                }}>
                                                                    {nav.shortcut}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ minHeight: '100px' }}>
                                            {isLoading ? (
                                                <div style={{ padding: '24px', textAlign: 'center', color: '#6b6880', fontSize: '14px' }}>
                                                    Typing...
                                                </div>
                                            ) : jobs.length === 0 ? (
                                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Search style={{ width: '32px', height: '32px', color: '#4b4869', marginBottom: '12px' }} />
                                                    <span style={{ fontSize: '14px', color: '#6b6880', textAlign: 'center' }}>
                                                        No results for "{searchQuery}"
                                                    </span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        letterSpacing: '0.08em',
                                                        textTransform: 'uppercase',
                                                        color: '#6b6880',
                                                        padding: '8px 8px 4px'
                                                    }}>
                                                        Jobs
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                                                                    className="transition-all text-left"
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '40px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        gap: '10px',
                                                                        padding: '0 8px',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        backgroundColor: isFocused ? 'rgba(139,92,246,0.15)' : 'transparent',
                                                                        borderLeft: isFocused ? '2px solid #8b5cf6' : '2px solid transparent',
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                                                        <div style={{
                                                                            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                                                            backgroundColor: getCategoryColor(job.category)
                                                                        }} />
                                                                        <span style={{
                                                                            fontSize: '14px', color: isDark ? '#e2e1f0' : '#1f2937', 
                                                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                                        }}>
                                                                            {highlightMatch(job.title, searchQuery)}
                                                                        </span>
                                                                    </div>
                                                                    <span style={{ fontSize: '12px', color: '#6b6880', flexShrink: 0 }}>
                                                                        {job.job_type === 'hourly' ? `$${job.hourly_rate}/hr` : `$${job.budget_min}-${job.budget_max}`}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Bar */}
                                <div style={{
                                    height: '36px',
                                    borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '0 12px'
                                }}>
                                    <span style={{ fontSize: '11px', color: '#6b6880', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <kbd style={{ fontSize: '10px', fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '1px 5px' }}>↑↓</kbd>
                                        Navigate
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#6b6880', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <kbd style={{ fontSize: '10px', fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '1px 5px' }}>↵</kbd>
                                        Select
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#6b6880', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <kbd style={{ fontSize: '10px', fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '1px 5px' }}>ESC</kbd>
                                        Close
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
