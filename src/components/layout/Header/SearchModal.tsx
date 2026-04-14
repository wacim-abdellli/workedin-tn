import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ClipboardList,
  Clock3,
  FileText,
  FolderOpen,
  Loader2,
  PlusCircle,
  Search,
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

type FilterKey = 'talent' | 'jobs' | 'projects'
type Role = 'public' | 'client' | 'freelancer'

type SearchItem = {
  id: string
  label: string
  href: string
  meta?: string
  kind: FilterKey
  Icon: typeof Search
}

const RECENT_SEARCHES_KEY = 'WorkedIn-recent-searches'

const INACTIVE_PILL_CLASS =
  'bg-transparent text-gray-400 border border-transparent hover:bg-[#262626] px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all'

const ROLE_FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'talent', label: 'Talent' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'projects', label: 'Projects' },
]

const pushRecentSearch = (value: string) => {
  const normalized = value.trim()
  if (!normalized) return [] as string[]

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    const existing = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []

    const next = [normalized, ...existing.filter((item) => item !== normalized)].slice(0, 6)
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
    return next
  } catch {
    return [normalized]
  }
}

export default function SearchModal({ onClose }: SearchModalProps) {
  const { user, activeMode } = useAuth()
  const { tx } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const role: Role = !user ? 'public' : activeMode === 'freelancer' ? 'freelancer' : 'client'
  const isFreelancer = role === 'freelancer'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterKey>(isFreelancer ? 'jobs' : 'talent')

  useEffect(() => {
    setActiveFilter(isFreelancer ? 'jobs' : 'talent')
  }, [isFreelancer])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return

      const normalized = parsed.filter((item): item is string => typeof item === 'string').slice(0, 6)
      setRecentSearches(normalized)
    } catch {
      setRecentSearches([])
    }
  }, [])

  const searchFocusClass = isFreelancer
    ? 'focus-within:ring-1 focus-within:ring-purple-500'
    : 'focus-within:ring-1 focus-within:ring-orange-500'

  const activePillClass = isFreelancer
    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-1.5 rounded-full text-sm font-medium transition-all'
    : 'bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-1.5 rounded-full text-sm font-medium transition-all'

  const iconHoverAccentClass = isFreelancer ? 'group-hover:text-purple-500' : 'group-hover:text-orange-500'
  const roleBadgeClass = isFreelancer ? 'text-purple-400' : 'text-orange-500'

  const clientQuickLinks: SearchItem[] = [
    {
      id: 'client-post-project',
      label: tx('pages.searchModal.shortcuts.postProject', undefined, 'Post a project'),
      href: '/jobs/new',
      meta: 'Ctrl+N',
      kind: 'projects',
      Icon: PlusCircle,
    },
    {
      id: 'client-my-projects',
      label: tx('pages.searchModal.shortcuts.myProjects', undefined, 'My projects'),
      href: '/client/jobs',
      meta: 'Ctrl+P',
      kind: 'projects',
      Icon: FolderOpen,
    },
    {
      id: 'client-find-freelancers',
      label: tx('pages.searchModal.shortcuts.findFreelancers', undefined, 'Find freelancers'),
      href: '/find-freelancers',
      meta: 'Ctrl+F',
      kind: 'talent',
      Icon: Users,
    },
    {
      id: 'client-contracts',
      label: tx('pages.searchModal.shortcuts.contracts', undefined, 'Contracts'),
      href: '/contracts',
      meta: 'Ctrl+C',
      kind: 'projects',
      Icon: ClipboardList,
    },
  ]

  const freelancerQuickLinks: SearchItem[] = [
    {
      id: 'freelancer-browse-jobs',
      label: tx('pages.searchModal.shortcuts.browseAllJobs', undefined, 'Browse all jobs'),
      href: '/jobs',
      meta: 'Ctrl+J',
      kind: 'jobs',
      Icon: Briefcase,
    },
    {
      id: 'freelancer-proposals',
      label: tx('pages.searchModal.shortcuts.myProposals', undefined, 'My proposals'),
      href: '/my-proposals',
      meta: 'Ctrl+P',
      kind: 'projects',
      Icon: FileText,
    },
    {
      id: 'freelancer-earnings',
      label: tx('pages.searchModal.shortcuts.myEarnings', undefined, 'My earnings'),
      href: '/freelancer/earnings',
      meta: 'Ctrl+E',
      kind: 'projects',
      Icon: Wallet,
    },
    {
      id: 'freelancer-find-talent',
      label: tx('pages.searchModal.shortcuts.findFreelancers', undefined, 'Find freelancers'),
      href: '/find-freelancers',
      meta: 'Ctrl+F',
      kind: 'talent',
      Icon: Users,
    },
  ]

  const publicQuickLinks: SearchItem[] = [
    {
      id: 'public-browse-jobs',
      label: tx('pages.searchModal.shortcuts.browseJobs', undefined, 'Browse jobs'),
      href: '/jobs',
      kind: 'jobs',
      Icon: Briefcase,
    },
    {
      id: 'public-find-freelancers',
      label: tx('pages.searchModal.shortcuts.findFreelancers', undefined, 'Find freelancers'),
      href: '/find-freelancers',
      kind: 'talent',
      Icon: Users,
    },
    {
      id: 'public-create-account',
      label: tx('pages.searchModal.shortcuts.createAccount', undefined, 'Create account'),
      href: '/signup',
      kind: 'projects',
      Icon: PlusCircle,
    },
  ]

  const quickLinks = useMemo(() => {
    if (role === 'client') return clientQuickLinks
    if (role === 'freelancer') return freelancerQuickLinks
    return publicQuickLinks
  }, [role])

  const quickLinkMatches = useMemo(
    () => quickLinks.filter((item) => item.kind === activeFilter),
    [activeFilter, quickLinks],
  )

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length >= 2

  const workspaceTitle = role === 'client'
    ? tx('pages.searchModal.workspaceClient', undefined, 'Client workspace')
    : role === 'freelancer'
      ? tx('pages.searchModal.workspaceFreelancer', undefined, 'Freelancer workspace')
      : tx('pages.searchModal.globalTitle', undefined, 'Global search')

  const saveRecentAndClose = (href: string) => {
    if (trimmedQuery) {
      const nextRecent = pushRecentSearch(trimmedQuery)
      setRecentSearches(nextRecent)
    }

    navigate(href)
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'Enter' && isSearching && results.length > 0) {
        event.preventDefault()
        saveRecentAndClose(results[0].href)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearching, onClose, results, trimmedQuery])

  useEffect(() => {
    if (!isSearching) {
      setResults([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    const timer = window.setTimeout(async () => {
      setIsLoading(true)

      const localMatches = quickLinks
        .filter((item) => item.kind === activeFilter)
        .filter((item) => {
          const haystack = `${item.label} ${item.meta || ''}`.toLowerCase()
          return haystack.includes(trimmedQuery.toLowerCase())
        })

      let remoteMatches: SearchItem[] = []

      if (activeFilter === 'jobs') {
        const { data } = await supabase
          .from('jobs')
          .select('id, title, budget_min, budget_max')
          .ilike('title', `%${trimmedQuery}%`)
          .eq('status', 'open')
          .limit(8)

        remoteMatches = (data || []).map((job) => ({
          id: `job-${job.id}`,
          label: job.title,
          href: `/jobs/${job.id}`,
          meta: `${job.budget_min}-${job.budget_max} ${tx('common.tnd', undefined, 'TND')}`,
          kind: 'jobs' as const,
          Icon: Briefcase,
        }))
      }

      if (activeFilter === 'talent') {
        const { data } = await supabase
          .from('public_profiles')
          .select('id, full_name, username, location')
          .in('user_type', ['freelancer', 'both'])
          .or(`full_name.ilike.%${trimmedQuery}%,username.ilike.%${trimmedQuery}%,location.ilike.%${trimmedQuery}%`)
          .limit(8)

        remoteMatches = (data || []).map((profile) => ({
          id: `talent-${profile.id}`,
          label: profile.full_name || profile.username || tx('pages.searchModal.unknownFreelancer', undefined, 'Freelancer'),
          href: `/freelancer/${profile.username || profile.id}`,
          meta: profile.location || tx('pages.searchModal.freelancerResultMeta', undefined, 'Freelancer profile'),
          kind: 'talent' as const,
          Icon: Users,
        }))
      }

      if (activeFilter === 'projects') {
        remoteMatches = quickLinks
          .filter((item) => item.kind === 'projects')
          .filter((item) => item.label.toLowerCase().includes(trimmedQuery.toLowerCase()))
      }

      if (cancelled) return

      const seen = new Set<string>()
      const merged = [...localMatches, ...remoteMatches].filter((item) => {
        const key = `${item.href}|${item.label}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).slice(0, 12)

      setResults(merged)
      setIsLoading(false)
    }, 220)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [activeFilter, isSearching, quickLinks, role, trimmedQuery, tx])

  const displayItems = isSearching ? results : quickLinkMatches

  const renderRecentSearches = !isSearching && recentSearches.length > 0

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b border-[#262626] flex items-center gap-3">
          <div className={`flex w-full items-center gap-3 rounded-xl border border-[#262626] bg-[#0a0a0a] px-4 py-3 transition-all ${searchFocusClass}`}>
            <Search className="text-gray-500 size-5 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                role === 'freelancer'
                  ? tx('pages.searchModal.placeholderFreelancer', undefined, 'Search jobs, skills...')
                  : role === 'client'
                    ? tx('pages.searchModal.placeholderClient', undefined, 'Search freelancers, skills...')
                    : tx('globalSearch.placeholder', undefined, 'Search jobs, freelancers, skills...')
              }
              className="flex-1 bg-transparent text-white text-lg outline-none placeholder-gray-500"
            />
            <span className="hidden sm:flex items-center justify-center px-2 py-1 bg-[#262626] text-gray-400 rounded text-xs font-mono">
              ESC
            </span>
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden inline-flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label={tx('common.close', undefined, 'Close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 border-b border-[#262626] bg-[#0a0a0a]/50">
          {ROLE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={activeFilter === filter.key ? activePillClass : INACTIVE_PILL_CLASS}
            >
              {filter.label}
            </button>
          ))}

          <span className={`ml-auto text-xs ${roleBadgeClass}`}>
            {workspaceTitle}
          </span>
        </div>

        <div className="p-2 max-h-[40vh] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 flex items-center gap-3 text-gray-400">
              <Loader2 className={`h-4 w-4 animate-spin ${isFreelancer ? 'text-purple-500' : 'text-orange-500'}`} />
              <span className="text-sm">{tx('globalSearch.searching', undefined, 'Searching...')}</span>
            </div>
          ) : null}

          {!isLoading && displayItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">
                {isSearching
                  ? tx('globalSearch.noResultsFor', { query: trimmedQuery }, `No results for "${trimmedQuery}"`)
                  : tx('pages.searchModal.tryDifferent', undefined, 'Try a different search term')}
              </p>
            </div>
          ) : null}

          {!isLoading && displayItems.map((item) => {
            const Icon = item.Icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => saveRecentAndClose(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#262626]/50 cursor-pointer text-gray-300 transition-colors group"
              >
                <Icon className={`h-4 w-4 text-gray-500 transition-colors ${iconHoverAccentClass}`} />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-gray-200">{item.label}</p>
                  {item.meta ? <p className="truncate text-xs text-gray-500">{item.meta}</p> : null}
                </div>
              </button>
            )
          })}

          {renderRecentSearches ? (
            <>
              <div className="mt-2 border-t border-[#262626]" />
              {recentSearches.map((recentTerm) => (
                <button
                  key={`recent-${recentTerm}`}
                  type="button"
                  onClick={() => {
                    setQuery(recentTerm)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#262626]/50 cursor-pointer text-gray-300 transition-colors group"
                >
                  <Clock3 className={`h-4 w-4 text-gray-500 transition-colors ${iconHoverAccentClass}`} />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-gray-200">{recentTerm}</p>
                    <p className="truncate text-xs text-gray-500">{tx('pages.searchModal.recentSection', undefined, 'Recent jumps')}</p>
                  </div>
                </button>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
