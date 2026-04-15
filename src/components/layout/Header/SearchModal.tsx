import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ClipboardList,
  Clock,
  FileText,
  FolderOpen,
  Loader2,
  PlusCircle,
  Search,
  Settings,
  Users,
  Wallet,
  X,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/i18n'

interface SearchModalProps {
  onClose: () => void
}

type Role = 'client' | 'freelancer'
type FilterPill = 'talent' | 'jobs' | 'projects'

type SearchItem = {
  key: string
  label: string
  href?: string
  shortcut?: string
  meta?: string
  filter: FilterPill
  Icon: typeof Briefcase
  onSelect?: () => void
}

const RECENT_SEARCHES_KEY = 'WorkedIn-recent-searches'

export default function SearchModal({ onClose }: SearchModalProps) {
  const { user, activeMode } = useAuth()
  const { tx } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const role: Role = activeMode === 'client' ? 'client' : 'freelancer'

  const activePillClass = role === 'client'
    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-1.5 rounded-full text-sm font-medium transition-all'
    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-1.5 rounded-full text-sm font-medium transition-all'

  const inactivePillClass = 'bg-transparent text-gray-400 border border-transparent hover:bg-[#262626] px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all'

  const inputFocusRingClass = role === 'client'
    ? 'focus-within:ring-1 focus-within:ring-orange-500/70'
    : 'focus-within:ring-1 focus-within:ring-purple-500/70'

  const selectedItemClass = role === 'client' ? 'bg-orange-500/10' : 'bg-purple-500/10'
  const iconHoverClass = role === 'client' ? 'group-hover:text-orange-500' : 'group-hover:text-purple-500'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterPill>(role === 'client' ? 'talent' : 'jobs')

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length >= 2

  const freelancerQuickLinks: SearchItem[] = [
    {
      key: 'quick-browse-jobs',
      label: tx('pages.searchModal.shortcuts.browseAllJobs', undefined, 'Browse all jobs'),
      href: '/jobs',
      shortcut: 'Ctrl+J',
      filter: 'jobs',
      Icon: Briefcase,
    },
    {
      key: 'quick-my-proposals',
      label: tx('pages.searchModal.shortcuts.myProposals', undefined, 'My proposals'),
      href: '/my-proposals',
      shortcut: 'Ctrl+P',
      filter: 'projects',
      Icon: FileText,
    },
    {
      key: 'quick-my-earnings',
      label: tx('pages.searchModal.shortcuts.myEarnings', undefined, 'My earnings'),
      href: '/freelancer/earnings',
      shortcut: 'Ctrl+E',
      filter: 'projects',
      Icon: Wallet,
    },
    {
      key: 'quick-settings',
      label: tx('pages.searchModal.shortcuts.settings', undefined, 'Settings'),
      href: '/settings',
      shortcut: 'Ctrl+,',
      filter: 'projects',
      Icon: Settings,
    },
  ]

  const clientQuickLinks: SearchItem[] = [
    {
      key: 'quick-post-project',
      label: tx('pages.searchModal.shortcuts.postProject', undefined, 'Post a project'),
      href: '/jobs/new',
      shortcut: 'Ctrl+N',
      filter: 'projects',
      Icon: PlusCircle,
    },
    {
      key: 'quick-my-projects',
      label: tx('pages.searchModal.shortcuts.myProjects', undefined, 'My projects'),
      href: '/client/jobs',
      shortcut: 'Ctrl+P',
      filter: 'projects',
      Icon: FolderOpen,
    },
    {
      key: 'quick-find-freelancers',
      label: tx('pages.searchModal.shortcuts.findFreelancers', undefined, 'Find freelancers'),
      href: '/find-freelancers',
      shortcut: 'Ctrl+F',
      filter: 'talent',
      Icon: Users,
    },
    {
      key: 'quick-contracts',
      label: tx('pages.searchModal.shortcuts.contracts', undefined, 'Contracts'),
      href: '/contracts',
      shortcut: 'Ctrl+C',
      filter: 'projects',
      Icon: ClipboardList,
    },
  ]

  const quickLinks = role === 'client' ? clientQuickLinks : freelancerQuickLinks

  const rememberRecentSearch = (term: string) => {
    const normalized = term.trim()
    if (!normalized) return

    setRecentSearches((prev) => {
      const next = [normalized, ...prev.filter((item) => item !== normalized)].slice(0, 6)
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      return next
    })
  }

  const goToHref = (href: string) => {
    navigate(href)
    onClose()
  }

  const goToSearchResults = () => {
    if (!trimmedQuery) return
    rememberRecentSearch(trimmedQuery)
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    onClose()
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === 'string').slice(0, 6))
      }
    } catch {
      setRecentSearches([])
    }
  }, [])

  useEffect(() => {
    if (!isSearching) {
      setResults([])
      return
    }

    const timer = window.setTimeout(async () => {
      setLoading(true)

      if (role === 'client') {
        const { data } = await supabase
          .from('public_profiles')
          .select('id, full_name, username, location, user_type')
          .in('user_type', ['freelancer', 'both'])
          .or(`full_name.ilike.%${trimmedQuery}%,username.ilike.%${trimmedQuery}%,location.ilike.%${trimmedQuery}%`)
          .limit(8)

        setResults(
          (data || []).map((profile) => ({
            key: `talent-${profile.id}`,
            label: profile.full_name || profile.username || tx('pages.searchModal.unknownFreelancer', undefined, 'Freelancer'),
            href: `/freelancer/${profile.username || profile.id}`,
            meta: profile.location || tx('pages.searchModal.freelancerResultMeta', undefined, 'Freelancer profile'),
            filter: 'talent' as const,
            Icon: Users,
          }))
        )
      } else {
        const { data } = await supabase
          .from('jobs')
          .select('id, title, budget_min, budget_max')
          .ilike('title', `%${trimmedQuery}%`)
          .eq('status', 'open')
          .limit(8)

        setResults(
          (data || []).map((job) => ({
            key: `job-${job.id}`,
            label: job.title,
            href: `/jobs/${job.id}`,
            meta: `${job.budget_min}-${job.budget_max} ${tx('common.tnd', undefined, 'TND')}`,
            filter: 'jobs' as const,
            Icon: Briefcase,
          }))
        )
      }

      setLoading(false)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [isSearching, role, trimmedQuery, tx])

  const recentSearchItems = useMemo<SearchItem[]>(() => {
    return recentSearches.map((term) => ({
      key: `recent-${term}`,
      label: term,
      meta: tx('pages.searchModal.recentSection', undefined, 'Recent jumps'),
      filter: role === 'client' ? 'talent' : 'jobs',
      Icon: Clock,
      onSelect: () => setQuery(term),
    }))
  }, [recentSearches, role, tx])

  const filteredQuickLinks = useMemo(() => {
    return quickLinks.filter((item) => item.filter === activeFilter)
  }, [activeFilter, quickLinks])

  const filteredSearchResults = useMemo(() => {
    return results.filter((item) => item.filter === activeFilter)
  }, [activeFilter, results])

  const visibleItems = isSearching
    ? filteredSearchResults
    : [...filteredQuickLinks, ...recentSearchItems]

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, activeFilter])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (visibleItems.length === 0) return
        setSelectedIndex((prev) => (prev + 1) % visibleItems.length)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (visibleItems.length === 0) return
        setSelectedIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length)
        return
      }

      if (event.key === 'Enter') {
        if (isSearching) {
          const selectedItem = visibleItems[selectedIndex]
          if (selectedItem) {
            if (selectedItem.onSelect) {
              selectedItem.onSelect()
            } else if (selectedItem.href) {
              goToHref(selectedItem.href)
            }
          } else {
            goToSearchResults()
          }
          return
        }

        const selectedItem = visibleItems[selectedIndex]
        if (!selectedItem) return

        if (selectedItem.onSelect) {
          selectedItem.onSelect()
        } else if (selectedItem.href) {
          goToHref(selectedItem.href)
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [goToSearchResults, isSearching, onClose, selectedIndex, visibleItems])

  const workspaceLabel = role === 'client'
    ? tx('pages.searchModal.workspaceClient', undefined, 'Client workspace')
    : tx('pages.searchModal.workspaceFreelancer', undefined, 'Freelancer workspace')

  const placeholder = role === 'client'
    ? tx('pages.searchModal.placeholderClient', undefined, 'Search freelancers, skills...')
    : tx('pages.searchModal.placeholderFreelancer', undefined, 'Search jobs, skills...')

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-3 border-b border-[#262626]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 font-semibold mb-2">{workspaceLabel}</p>
          <div className={`p-4 border border-[#262626] rounded-xl bg-[#0a0a0a] flex items-center gap-3 transition-all ${inputFocusRingClass}`}>
            <Search className="text-gray-500 h-5 w-5 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-white text-lg outline-none placeholder-gray-500"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-md p-1 text-gray-400 hover:text-gray-200 hover:bg-[#262626] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            <div className="hidden sm:flex items-center justify-center px-2 py-1 bg-[#262626] text-gray-400 rounded text-xs font-mono">
              ESC
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 border-b border-[#262626] bg-[#0a0a0a]/50">
          {([
            { key: 'talent', label: 'Talent' },
            { key: 'jobs', label: 'Jobs' },
            { key: 'projects', label: 'Projects' },
          ] as const).map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setActiveFilter(pill.key)}
              className={activeFilter === pill.key ? activePillClass : inactivePillClass}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="p-2 max-h-[40vh] overflow-y-auto">
          {!isSearching ? (
            <>
              <p className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-[0.18em] text-gray-500 font-semibold">
                {tx('pages.searchModal.quickActions', undefined, 'Quick actions')}
              </p>
              {filteredQuickLinks.map((item, index) => {
                const isSelected = selectedIndex === index
                return (
                  <button
                    key={item.key}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => item.href && goToHref(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#262626]/50 cursor-pointer text-gray-300 transition-colors group ${isSelected ? selectedItemClass : ''}`}
                  >
                    <item.Icon className={`h-5 w-5 text-gray-500 transition-colors ${iconHoverClass}`} />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium text-gray-200">{item.label}</p>
                      {item.shortcut ? <p className="text-xs text-gray-500 mt-0.5">{item.shortcut}</p> : null}
                    </div>
                  </button>
                )
              })}

              {recentSearchItems.length > 0 ? (
                <>
                  <p className="px-4 pt-4 pb-1 text-[11px] uppercase tracking-[0.18em] text-gray-500 font-semibold">
                    {tx('pages.searchModal.recentSection', undefined, 'Recent jumps')}
                  </p>
                  {recentSearchItems.map((item, recentIndex) => {
                    const index = filteredQuickLinks.length + recentIndex
                    const isSelected = selectedIndex === index
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={item.onSelect}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#262626]/50 cursor-pointer text-gray-300 transition-colors group ${isSelected ? selectedItemClass : ''}`}
                      >
                        <item.Icon className={`h-5 w-5 text-gray-500 transition-colors ${iconHoverClass}`} />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-medium text-gray-200">{item.label}</p>
                          {item.meta ? <p className="text-xs text-gray-500 mt-0.5">{item.meta}</p> : null}
                        </div>
                      </button>
                    )
                  })}
                </>
              ) : null}
            </>
          ) : loading ? (
            <div className="px-4 py-10 text-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              {tx('globalSearch.searching', undefined, 'Searching...')}
            </div>
          ) : filteredSearchResults.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500">
              <Search className="h-6 w-6 mx-auto mb-2" />
              <p>{tx('globalSearch.noResultsFor', { query }, `No results for "${query}"`)}</p>
            </div>
          ) : (
            filteredSearchResults.map((item, index) => {
              const isSelected = selectedIndex === index
              return (
                <button
                  key={item.key}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => item.href && goToHref(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#262626]/50 cursor-pointer text-gray-300 transition-colors group ${isSelected ? selectedItemClass : ''}`}
                >
                  <item.Icon className={`h-5 w-5 text-gray-500 transition-colors ${iconHoverClass}`} />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-gray-200">{item.label}</p>
                    {item.meta ? <p className="text-xs text-gray-500 mt-0.5">{item.meta}</p> : null}
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-[#262626] bg-[#0a0a0a] text-xs text-gray-500 flex items-center justify-between">
          <span>{tx('globalSearch.toNavigate', undefined, 'Use arrows to navigate')}</span>
          <button
            type="button"
            onClick={goToSearchResults}
            className={role === 'client' ? 'text-orange-500 hover:text-orange-400 transition-colors' : 'text-purple-400 hover:text-purple-300 transition-colors'}
          >
            {tx('pages.searchModal.searchEverything', { query: trimmedQuery || '...' }, 'Search everything')}
          </button>
        </div>
      </div>
    </div>
  )
}

