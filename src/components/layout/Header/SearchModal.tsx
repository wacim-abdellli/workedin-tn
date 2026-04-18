import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, ClipboardList, Clock, FileText, FolderOpen,
  Loader2, PlusCircle, Search, Settings, Users, Wallet, X,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/i18n'

interface SearchModalProps { onClose: () => void }

type Role = 'client' | 'freelancer'
type FilterPill = 'talent' | 'jobs' | 'projects'
type SearchItem = {
  key: string; label: string; href?: string; shortcut?: string
  meta?: string; filter: FilterPill; Icon: typeof Briefcase; onSelect?: () => void
}

const RECENT_KEY = 'WorkedIn-recent-searches'

export default function SearchModal({ onClose }: SearchModalProps) {
  const { user, activeMode } = useAuth()
  const { tx } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const role: Role = activeMode === 'client' ? 'client' : 'freelancer'
  const accent = role === 'client' ? '#f97316' : '#8b5cf6'
  const accentLight = role === 'client' ? 'rgba(249,115,22,0.12)' : 'rgba(139,92,246,0.12)'
  const accentBorder = role === 'client' ? 'rgba(249,115,22,0.25)' : 'rgba(139,92,246,0.25)'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterPill>(role === 'client' ? 'talent' : 'jobs')

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length >= 2

  const freelancerQuickLinks: SearchItem[] = [
    { key: 'q-jobs', label: tx('pages.searchModal.shortcuts.browseAllJobs', undefined, 'Browse all jobs'), href: '/jobs', shortcut: 'J', filter: 'jobs', Icon: Briefcase },
    { key: 'q-proposals', label: tx('pages.searchModal.shortcuts.myProposals', undefined, 'My proposals'), href: '/my-proposals', shortcut: 'P', filter: 'projects', Icon: FileText },
    { key: 'q-earnings', label: tx('pages.searchModal.shortcuts.myEarnings', undefined, 'My earnings'), href: '/freelancer/earnings', shortcut: 'E', filter: 'projects', Icon: Wallet },
    { key: 'q-settings', label: tx('pages.searchModal.shortcuts.settings', undefined, 'Settings'), href: '/settings', shortcut: ',', filter: 'projects', Icon: Settings },
  ]

  const clientQuickLinks: SearchItem[] = [
    { key: 'q-post', label: tx('pages.searchModal.shortcuts.postProject', undefined, 'Post a project'), href: '/jobs/new', shortcut: 'N', filter: 'projects', Icon: PlusCircle },
    { key: 'q-projects', label: tx('pages.searchModal.shortcuts.myProjects', undefined, 'My projects'), href: '/client/jobs', shortcut: 'P', filter: 'projects', Icon: FolderOpen },
    { key: 'q-freelancers', label: tx('pages.searchModal.shortcuts.findFreelancers', undefined, 'Find freelancers'), href: '/find-freelancers', shortcut: 'F', filter: 'talent', Icon: Users },
    { key: 'q-contracts', label: tx('pages.searchModal.shortcuts.contracts', undefined, 'Contracts'), href: '/contracts', shortcut: 'C', filter: 'projects', Icon: ClipboardList },
  ]

  const quickLinks = role === 'client' ? clientQuickLinks : freelancerQuickLinks

  const rememberSearch = (term: string) => {
    const n = term.trim()
    if (!n) return
    setRecentSearches((prev) => {
      const next = [n, ...prev.filter((i) => i !== n)].slice(0, 5)
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }

  const go = (href: string) => { navigate(href); onClose() }

  const goToResults = () => {
    if (!trimmedQuery) return
    rememberSearch(trimmedQuery)
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    onClose()
  }

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setRecentSearches(parsed.filter((i): i is string => typeof i === 'string').slice(0, 5))
    } catch { setRecentSearches([]) }
  }, [])

  useEffect(() => {
    if (!isSearching) { setResults([]); return }
    const t = window.setTimeout(async () => {
      setLoading(true)
      if (role === 'client') {
        const { data } = await supabase.from('public_profiles')
          .select('id, full_name, username, location, user_type')
          .in('user_type', ['freelancer', 'both'])
          .or(`full_name.ilike.%${trimmedQuery}%,username.ilike.%${trimmedQuery}%`)
          .limit(8)
        setResults((data || []).map((p) => ({
          key: `t-${p.id}`, label: p.full_name || p.username || 'Freelancer',
          href: `/freelancer/${p.username || p.id}`,
          meta: p.location || 'Freelancer', filter: 'talent' as const, Icon: Users,
        })))
      } else {
        const { data } = await supabase.from('jobs')
          .select('id, title, budget_min, budget_max')
          .ilike('title', `%${trimmedQuery}%`).eq('status', 'open').limit(8)
        setResults((data || []).map((j) => ({
          key: `j-${j.id}`, label: j.title,
          href: `/jobs/${j.id}`,
          meta: `${j.budget_min ?? 0}–${j.budget_max ?? 0} ${tx('common.tnd', undefined, 'TND')}`,
          filter: 'jobs' as const, Icon: Briefcase,
        })))
      }
      setLoading(false)
    }, 250)
    return () => window.clearTimeout(t)
  }, [isSearching, role, trimmedQuery, tx])

  const recentItems = useMemo<SearchItem[]>(() =>
    recentSearches.map((term) => ({
      key: `r-${term}`, label: term, filter: role === 'client' ? 'talent' : 'jobs',
      Icon: Clock, onSelect: () => setQuery(term),
    })), [recentSearches, role])

  const filteredQuick = useMemo(() => quickLinks.filter((i) => i.filter === activeFilter), [activeFilter, quickLinks])
  const filteredResults = useMemo(() => results.filter((i) => i.filter === activeFilter), [activeFilter, results])

  const visibleItems = isSearching ? filteredResults : [...filteredQuick, ...recentItems]

  useEffect(() => { setSelectedIndex(0) }, [query, activeFilter])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((p) => (p + 1) % Math.max(1, visibleItems.length)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((p) => (p - 1 + visibleItems.length) % Math.max(1, visibleItems.length)); return }
      if (e.key === 'Enter') {
        const item = visibleItems[selectedIndex]
        if (item) {
          if (item.onSelect) {
            item.onSelect()
          } else if (item.href) {
            go(item.href)
          }
        } else if (isSearching) {
          goToResults()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isSearching, onClose, selectedIndex, visibleItems])

  const pills: { key: FilterPill; label: string }[] = [
    { key: 'talent', label: 'Talent' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'projects', label: 'Projects' },
  ]

  const placeholder = role === 'client'
    ? tx('pages.searchModal.placeholderClient', undefined, 'Search freelancers, skills...')
    : tx('pages.searchModal.placeholderFreelancer', undefined, 'Search jobs, skills...')

  const workspaceLabel = role === 'client'
    ? tx('pages.searchModal.workspaceClient', undefined, 'Client workspace')
    : tx('pages.searchModal.workspaceFreelancer', undefined, 'Freelancer workspace')

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[8vh]"
      style={{ background: 'rgba(4,4,8,0.82)', backdropFilter: 'blur(18px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(160deg,#18181f 0%,#101015 100%)',
          border: `1px solid color-mix(in srgb,${accent} 22%,rgba(255,255,255,0.06))`,
          boxShadow: `0 40px 100px -30px color-mix(in srgb,${accent} 22%,#000),0 0 0 1px rgba(255,255,255,0.04)`,
          animation: 'searchModalIn 0.18s cubic-bezier(0.22,1,0.36,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full opacity-25 blur-3xl" style={{ background: accent }} />

        {/* Search input */}
        <div className="relative px-4 pt-4">
          <div className="flex items-center gap-3 rounded-xl px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <Search className="w-4.5 h-4.5 text-white/35 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-white text-base outline-none placeholder-white/30"
            />
            {query && (
              <button onClick={() => setQuery('')} className="flex h-6 w-6 items-center justify-center rounded-md bg-white/8 text-white/50 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-white/30">ESC</kbd>
          </div>
        </div>

        {/* Workspace label + filter pills */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">{workspaceLabel}</span>
          <div className="flex items-center gap-1">
            {pills.map((pill) => {
              const active = pill.key === activeFilter
              return (
                <button
                  key={pill.key}
                  onClick={() => setActiveFilter(pill.key)}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                  style={{
                    background: active ? accentLight : 'transparent',
                    color: active ? accent : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${active ? accentBorder : 'transparent'}`,
                  }}
                >
                  {pill.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-white/6" />

        {/* Results area */}
        <div className="max-h-[46vh] overflow-y-auto p-2">
          {!isSearching ? (
            <>
              {filteredQuick.length > 0 && (
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-1">
                    {tx('pages.searchModal.quickActions', undefined, 'Quick actions')}
                  </p>
                  {filteredQuick.map((item, idx) => (
                    <ResultRow
                      key={item.key} item={item} isSelected={selectedIndex === idx}
                      accent={accent} accentLight={accentLight}
                      onHover={() => setSelectedIndex(idx)}
                      onClick={() => item.href && go(item.href)}
                    />
                  ))}
                </div>
              )}

              {recentItems.length > 0 && (
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-1">
                    {tx('pages.searchModal.recentSection', undefined, 'Recent')}
                  </p>
                  {recentItems.map((item, i) => {
                    const idx = filteredQuick.length + i
                    return (
                      <ResultRow
                        key={item.key} item={item} isSelected={selectedIndex === idx}
                        accent={accent} accentLight={accentLight}
                        onHover={() => setSelectedIndex(idx)}
                        onClick={() => item.onSelect?.()}
                      />
                    )
                  })}
                </div>
              )}
            </>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: accent }} />
              <span className="text-xs">{tx('globalSearch.searching', undefined, 'Searching...')}</span>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/35">
              <Search className="w-5 h-5" />
              <p className="text-sm">{tx('globalSearch.noResultsFor', { query }, `No results for "${query}"`)}</p>
            </div>
          ) : (
            <div className="px-3 py-2">
              {filteredResults.map((item, idx) => (
                <ResultRow
                  key={item.key} item={item} isSelected={selectedIndex === idx}
                  accent={accent} accentLight={accentLight}
                  onHover={() => setSelectedIndex(idx)}
                  onClick={() => item.href && go(item.href)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/6 px-5 py-2.5">
          <div className="flex items-center gap-3 text-[10px] text-white/25">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
          </div>
          {trimmedQuery && (
            <button
              onClick={goToResults}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-white"
              style={{ color: accent }}
            >
              Search everything
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
      `}</style>
    </div>
  )
}

function ResultRow({
  item, isSelected, accent, accentLight,
  onHover, onClick,
}: {
  item: SearchItem; isSelected: boolean; accent: string; accentLight: string
  onHover: () => void; onClick: () => void
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-left"
      style={{
        background: isSelected ? accentLight : 'transparent',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
        style={{
          background: isSelected
            ? `color-mix(in srgb,${accent} 20%,transparent)`
            : 'rgba(255,255,255,0.06)',
          color: isSelected ? accent : 'rgba(255,255,255,0.4)',
        }}
      >
        <item.Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)' }}>
          {item.label}
        </p>
        {item.meta && <p className="text-[11px] text-white/35 truncate">{item.meta}</p>}
      </div>
      {item.shortcut && (
        <kbd className="hidden sm:inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-white/30 shrink-0">
          {item.shortcut}
        </kbd>
      )}
    </button>
  )
}
