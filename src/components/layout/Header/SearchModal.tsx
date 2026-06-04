import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Briefcase, ClipboardList, Clock, FileText, FolderOpen,
  Search, Settings, Users, Wallet, X,
  ArrowRight, ChevronDown, Check
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/i18n'

interface SearchModalProps { onClose: () => void }

type FilterType = 'all' | 'jobs' | 'talent' | 'projects'

interface SearchItem {
  key: string;
  label: string;
  href?: string;
  shortcut?: string;
  meta?: string;
  filter: 'jobs' | 'talent' | 'projects';
  Icon: React.ComponentType<{ className?: string }>;
  onSelect?: () => void;
}

const DEBOUNCE_MS = 320;

export default function SearchModal({ onClose }: SearchModalProps) {
  const { activeMode } = useAuth()
  const { tx } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlQuery = searchParams.get('q')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const role = activeMode === 'client' ? 'client' : 'freelancer'
  const accent = role === 'freelancer' ? '#8b5cf6' : '#f59e0b'
  const accentRgb = role === 'freelancer' ? '139,92,246' : '245,158,11'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length >= 2

  const freelancerQuickLinks: SearchItem[] = useMemo(() => [
    { key: 'q-jobs',      label: tx('pages.searchModal.shortcuts.browseAllJobs', undefined, 'Browse all jobs'), href: '/jobs',               shortcut: 'J', filter: 'jobs',     Icon: Briefcase  },
    { key: 'q-proposals', label: tx('pages.searchModal.shortcuts.myProposals',   undefined, 'My proposals'),    href: '/my-proposals',        shortcut: 'P', filter: 'projects', Icon: FileText   },
    { key: 'q-earnings',  label: tx('pages.searchModal.shortcuts.myEarnings',    undefined, 'My earnings'),     href: '/freelancer/earnings', shortcut: 'E', filter: 'projects', Icon: Wallet     },
    { key: 'q-settings',  label: tx('pages.searchModal.shortcuts.settings',      undefined, 'Settings'),        href: '/settings',            shortcut: ',', filter: 'projects', Icon: Settings   },
  ], [tx])

  const clientQuickLinks: SearchItem[] = useMemo(() => [
    { key: 'q-post',        label: tx('pages.searchModal.shortcuts.postProject',     undefined, 'Post a project'),   href: '/jobs/new',         shortcut: 'N', filter: 'projects', Icon: FolderOpen    },
    { key: 'q-projects',    label: tx('pages.searchModal.shortcuts.myProjects',      undefined, 'My projects'),      href: '/client/jobs',      shortcut: 'P', filter: 'projects', Icon: FolderOpen    },
    { key: 'q-freelancers', label: tx('pages.searchModal.shortcuts.findFreelancers', undefined, 'Find freelancers'), href: '/find-freelancers', shortcut: 'F', filter: 'talent',   Icon: Users         },
    { key: 'q-contracts',   label: tx('pages.searchModal.shortcuts.contracts',       undefined, 'Contracts'),        href: '/contracts',        shortcut: 'C', filter: 'projects', Icon: ClipboardList },
  ], [tx])

  const quickLinks = role === 'client' ? clientQuickLinks : freelancerQuickLinks
  const recentKey = `WorkedIn-recent-searches-${role}`

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(recentKey)
      if (!raw) {
        setRecentSearches([])
        return
      }
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((i): i is string => typeof i === 'string').slice(0, 5))
      } else {
        setRecentSearches([])
      }
    } catch { setRecentSearches([]) }
  }, [recentKey])

  const rememberSearch = useCallback((term: string) => {
    const n = term.trim()
    if (!n) return
    setRecentSearches(prev => {
      const next = [n, ...prev.filter(i => i !== n)].slice(0, 5)
      window.localStorage.setItem(recentKey, JSON.stringify(next))
      return next
    })
  }, [recentKey])

  useEffect(() => {
    if (urlQuery) {
      rememberSearch(urlQuery)
    }
  }, [urlQuery, rememberSearch])

  const go = useCallback((href: string) => {
    if (isSearching) {
      rememberSearch(trimmedQuery)
    }
    navigate(href)
    onClose()
  }, [navigate, onClose, isSearching, trimmedQuery, rememberSearch])

  const goToResults = useCallback(() => {
    if (!trimmedQuery) return
    rememberSearch(trimmedQuery)
    const filterParam = activeFilter !== 'all' ? `&type=${activeFilter}` : ''
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}${filterParam}`)
    onClose()
  }, [trimmedQuery, activeFilter, navigate, rememberSearch, onClose])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  /* Core search matching HeaderSearch.tsx */
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    if (!isSearching) {
      setResults([])
      setSearchState('idle')
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearchState('loading')
      const abort = new AbortController()
      abortRef.current = abort

      const searchJobs = activeFilter === 'jobs' || activeFilter === 'all'
      const searchTalent = activeFilter === 'talent' || activeFilter === 'all'
      const searchPages = activeFilter === 'projects' || activeFilter === 'all'

      try {
        let fetched: SearchItem[] = []
        const promises: Promise<any>[] = []
        let talentData: any[] = []
        let jobsData: any[] = []

        if (searchTalent) {
          promises.push(
            supabase
              .from('public_profiles')
              .select('id, full_name, username, location, user_type')
              .in('user_type', ['freelancer', 'both'])
              .or(`full_name.ilike.%${trimmedQuery}%,username.ilike.%${trimmedQuery}%`)
              .limit(6)
              .then(res => {
                talentData = res.data || []
              })
              .catch(err => console.error('Talent search error:', err))
          )
        }

        if (searchJobs) {
          promises.push(
            supabase
              .from('jobs')
              .select('id, title, budget_min, budget_max')
              .ilike('title', `%${trimmedQuery}%`)
              .eq('status', 'open')
              .limit(6)
              .then(res => {
                jobsData = res.data || []
              })
              .catch(err => console.error('Jobs search error:', err))
          )
        }

        await Promise.all(promises)

        const mappedTalent: SearchItem[] = talentData.map(p => ({
          key: `t-${p.id}`,
          label: p.full_name || p.username || 'Freelancer',
          href: `/freelancer/${p.username || p.id}`,
          meta: p.location || 'Freelancer',
          filter: 'talent' as const,
          Icon: Users,
        }))

        const mappedJobs: SearchItem[] = jobsData.map(j => ({
          key: `j-${j.id}`,
          label: j.title,
          href: `/jobs/${j.id}`,
          meta: `${j.budget_min ?? 0}–${j.budget_max ?? 0} TND`,
          filter: 'jobs' as const,
          Icon: Briefcase,
        }))

        const mappedPages: SearchItem[] = searchPages
          ? quickLinks.filter(item =>
              item.label.toLowerCase().includes(trimmedQuery.toLowerCase())
            )
          : []

        if (activeFilter === 'all') {
          if (role === 'client') {
            fetched = [...mappedTalent.slice(0, 4), ...mappedJobs.slice(0, 4), ...mappedPages.slice(0, 3)]
          } else {
            fetched = [...mappedJobs.slice(0, 4), ...mappedTalent.slice(0, 4), ...mappedPages.slice(0, 3)]
          }
        } else if (activeFilter === 'jobs') {
          fetched = mappedJobs
        } else if (activeFilter === 'talent') {
          fetched = mappedTalent
        } else {
          fetched = mappedPages
        }

        if (!abort.signal.aborted) {
          setResults(fetched)
          setSearchState('done')
        }
      } catch {
        if (!abort.signal.aborted) {
          setResults([])
          setSearchState('done')
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [trimmedQuery, activeFilter, role, quickLinks])

  const recentItems = useMemo<SearchItem[]>(() =>
    recentSearches.map(term => ({
      key: `r-${term}`,
      label: term,
      filter: role === 'client' ? 'talent' : 'jobs',
      Icon: Clock,
      onSelect: () => { setQuery(term); inputRef.current?.focus() },
    })),
  [recentSearches, role])

  const visibleItems = useMemo(() => {
    if (isSearching) return results
    const filtered = activeFilter === 'all'
      ? quickLinks
      : quickLinks.filter(i => i.filter === activeFilter)
    return [...filtered, ...recentItems]
  }, [isSearching, results, activeFilter, quickLinks, recentItems])

  useEffect(() => { setSelectedIndex(0) }, [trimmedQuery, activeFilter])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => (p + 1) % Math.max(1, visibleItems.length)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => (p - 1 + visibleItems.length) % Math.max(1, visibleItems.length)); return }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = visibleItems[selectedIndex]
        if (item?.onSelect) item.onSelect()
        else if (item?.href) go(item.href)
        else if (isSearching) goToResults()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isSearching, selectedIndex, visibleItems, onClose, go, goToResults])

  const filterOptions = useMemo(() => [
    { key: 'all' as const, label: tx('pages.searchModal.filterAll', undefined, 'All'), desc: tx('pages.searchModal.filterAllDesc', undefined, 'Search everything') },
    { key: 'jobs' as const, label: tx('pages.searchModal.filterJobs', undefined, 'Jobs'), desc: tx('pages.searchModal.filterJobsDesc', undefined, 'Open job postings') },
    { key: 'talent' as const, label: tx('pages.searchModal.filterTalent', undefined, 'Talent'), desc: tx('pages.searchModal.filterTalentDesc', undefined, 'Freelancers & agencies') },
    { key: 'projects' as const, label: tx('pages.searchModal.filterProjects', undefined, 'Projects'), desc: tx('pages.searchModal.filterProjectsDesc', undefined, 'Quick links & pages') },
  ], [tx])

  const activeOption = filterOptions.find(o => o.key === activeFilter) || filterOptions[0]

  const placeholder =
    activeFilter === 'jobs' ? tx('pages.searchModal.placeholderJobs', undefined, 'Search jobs...') :
    activeFilter === 'talent' ? tx('pages.searchModal.placeholderTalent', undefined, 'Search freelancers...') :
    activeFilter === 'projects' ? tx('pages.searchModal.placeholderProjects', undefined, 'Search pages...') :
    tx('pages.searchModal.placeholderAll', undefined, 'Search jobs, freelancers, pages…')

  const isLoading = searchState === 'loading'

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center sm:px-4 sm:pt-[8vh]"
      style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl overflow-hidden flex flex-col border-none sm:border"
        style={{
          background: 'linear-gradient(145deg, #161616, #111111)',
          borderColor: 'rgba(255,255,255,0.09)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'searchModalIn 0.18s cubic-bezier(0.16,1,0.3,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: accent }}
        />

        {/* Input area wrapper */}
        <div className="relative p-4 border-b border-white/[0.06] flex items-center gap-3">
          <div
            className="flex-grow flex-1 flex items-center rounded-full overflow-hidden transition-all duration-200"
            style={{
              border: `1px solid rgba(${accentRgb},0.35)`,
              background: 'rgba(255,255,255,0.07)',
              boxShadow: `0 0 0 3px rgba(${accentRgb},0.08)`,
            }}
          >
            {/* Search Icon */}
            <span className="ml-3.5 shrink-0">
              <Search
                className="w-4 h-4 transition-colors duration-200"
                style={{ color: `rgba(${accentRgb},0.7)` }}
              />
            </span>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setFilterMenuOpen(false); }}
              onKeyDown={e => { if (e.key === 'Enter' && !visibleItems[selectedIndex]) goToResults(); }}
              placeholder={placeholder}
              className="header-search-input flex-1 bg-transparent px-3 py-2.5 text-sm placeholder-white/25 outline-none text-white"
              aria-label="Search"
            />

            {/* Inline loader */}
            {isLoading && (
              <span className="flex items-center gap-[3px] mr-2 shrink-0">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{
                      background: accent,
                      animation: `hs-pulse 1s ease-in-out ${i * 0.18}s infinite`,
                    }}
                  />
                ))}
              </span>
            )}

            {/* Clear Button */}
            {query && !isLoading && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); setSearchState('idle'); inputRef.current?.focus(); }}
                className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all duration-150"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Filter Pill */}
            <button
              type="button"
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className="flex items-center gap-1 px-3 py-2.5 shrink-0 text-[11px] font-semibold transition-all duration-150 border-l"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                color: filterMenuOpen ? accent : 'rgba(255,255,255,0.45)',
              }}
            >
              <span>{activeOption.label}</span>
              <ChevronDown
                className="w-3 h-3 transition-transform duration-200"
                style={{ transform: filterMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
          </div>

          {/* Close button for full-screen / mobile view */}
          <button
            type="button"
            onClick={onClose}
            className="flex sm:hidden h-10 items-center justify-center px-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          {/* Filter dropdown */}
          {filterMenuOpen && (
            <div
              className="absolute right-4 top-[calc(100%-8px)] w-64 rounded-2xl overflow-hidden z-[220]"
              style={{
                background: 'linear-gradient(145deg, #1b1b1f, #131316)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                animation: 'hs-drop 0.16s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {tx('pages.searchModal.searchIn', undefined, 'Search in')}
              </div>
              {filterOptions.map(opt => {
                const active = opt.key === activeFilter;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => { setActiveFilter(opt.key); setFilterMenuOpen(false); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors duration-100"
                    style={{ background: active ? `rgba(${accentRgb},0.10)` : 'transparent' }}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                      style={{ background: active ? `rgba(${accentRgb},0.2)` : 'rgba(255,255,255,0.06)', color: active ? accent : 'rgba(255,255,255,0.5)' }}
                    >
                      {opt.label[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: active ? 'white' : 'rgba(255,255,255,0.7)' }}>{opt.label}</p>
                      <p className="text-[10px] text-white/35 truncate">{opt.desc}</p>
                    </div>
                    {active && (
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Results area */}
        <div
          className="flex-grow overflow-y-auto max-h-[calc(100vh-80px)] sm:max-h-[50vh] p-2"
          style={{ transition: 'opacity 0.2s ease' }}
        >
          {/* State: first-time loading */}
          {isLoading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: accent,
                      animation: `hs-pulse 0.9s ease-in-out ${i * 0.16}s infinite`,
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-white/35">{tx('pages.searchModal.searching', undefined, 'Searching...')}</p>
            </div>
          )}

          {/* State: done, no results */}
          {!isLoading && isSearching && results.length === 0 && searchState === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/35">
              <Search className="w-5 h-5 opacity-40" />
              <p className="text-xs text-white/50">
                {tx('pages.searchModal.noResultsFor', { query: trimmedQuery }, `No results for "${trimmedQuery}"`)}
              </p>
            </div>
          )}

          {/* State: has items */}
          {visibleItems.length > 0 && (
            <div
              className="p-1.5"
              style={{
                opacity: isLoading ? 0.55 : 1,
                pointerEvents: isLoading ? 'none' : 'auto',
              }}
            >
              {/* Section label */}
              <div className="px-2.5 py-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
                {isSearching
                  ? tx('pages.searchModal.resultsHeadline', { category: activeOption.label }, `Results · ${activeOption.label}`)
                  : tx('pages.searchModal.quickLinksRecent', undefined, 'Quick links & recent')
                }
              </div>

              {visibleItems.map((item, idx) => {
                const sel = selectedIndex === idx;
                const isRecent = item.key.startsWith('r-');
                return (
                  <div
                    key={item.key}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className="w-full flex items-center justify-between rounded-xl transition-all duration-100 text-left group/item"
                    style={{
                      background: sel ? `rgba(${accentRgb},0.12)` : 'transparent',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (item.onSelect) item.onSelect();
                        else if (item.href) go(item.href);
                      }}
                      className="flex-1 flex items-center gap-3 px-2.5 py-2 text-left"
                    >
                      {/* Icon */}
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-100"
                        style={{
                          background: sel ? `rgba(${accentRgb},0.2)` : 'rgba(255,255,255,0.05)',
                          color: sel ? accent : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        <item.Icon className="h-3.5 w-3.5" />
                      </span>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[13px] font-medium truncate leading-tight"
                          style={{ color: sel ? 'white' : 'rgba(255,255,255,0.82)' }}
                        >
                          {item.label}
                        </p>
                        {item.meta && (
                          <p className="text-[10px] text-white/35 truncate mt-0.5 leading-none">
                            {item.meta}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Delete button (only for recent items) */}
                    {isRecent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const term = item.label;
                          setRecentSearches(prev => {
                            const next = prev.filter(x => x !== term);
                            window.localStorage.setItem(recentKey, JSON.stringify(next));
                            return next;
                          });
                        }}
                        className="mr-3 p-1 rounded-md text-white/30 hover:text-rose-400 hover:bg-white/10 opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-all duration-150"
                        title={tx('pages.searchModal.removeSearch', undefined, 'Remove search')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Shortcut badge */}
                    {item.shortcut && (
                      <kbd
                        className="hidden sm:inline-flex items-center justify-center shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-mono mr-3"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.35)',
                        }}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-2.5 text-[10px]"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.28)' }}
        >
          <div className="flex items-center gap-3">
            <span>↑↓ {tx('pages.searchModal.navHint', undefined, 'navigate')}</span>
            <span>↵ {tx('pages.searchModal.selectHint', undefined, 'select')}</span>
            <span>esc {tx('pages.searchModal.closeHint', undefined, 'close')}</span>
          </div>
          {trimmedQuery && (
            <button
              type="button"
              onClick={goToResults}
              className="flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
              style={{ color: accent }}
            >
              {tx('pages.searchModal.allResults', undefined, 'All results')}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes searchModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes hs-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50%       { opacity: 1;    transform: scale(1.1); }
        }
        @keyframes hs-drop {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  )
}
