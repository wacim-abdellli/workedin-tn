 import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ClipboardList,
  FileText,
  FolderOpen,
  Loader2,
  PlusCircle,
  Search,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useWorkspaceStore } from '@/lib/workspaceState'
import { useTranslation } from '@/i18n'

interface SearchModalProps {
  onClose: () => void
}

type SearchItem = {
  label: string
  href: string
  shortcut?: string
  meta?: string
  Icon: typeof Briefcase
  section?: string
}

const RECENT_SEARCHES_KEY = 'WorkedIn-recent-searches'

export default function SearchModal({ onClose }: SearchModalProps) {
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspaceStore()
  const { tx } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const freelancerShortcuts: SearchItem[] = [
    { label: tx('pages.searchModal.shortcuts.browseAllJobs', undefined, 'Browse all jobs'), Icon: Briefcase, href: '/jobs', shortcut: 'Ctrl+J' },
    { label: tx('pages.searchModal.shortcuts.myProposals', undefined, 'My proposals'), Icon: FileText, href: '/my-proposals', shortcut: 'Ctrl+P' },
    { label: tx('pages.searchModal.shortcuts.myEarnings', undefined, 'My earnings'), Icon: Wallet, href: '/freelancer/earnings', shortcut: 'Ctrl+E' },
    { label: tx('pages.searchModal.shortcuts.settings', undefined, 'Settings'), Icon: Settings, href: '/settings', shortcut: 'Ctrl+,' },
  ]

  const clientShortcuts: SearchItem[] = [
    { label: tx('pages.searchModal.shortcuts.postProject', undefined, 'Post a project'), Icon: PlusCircle, href: '/jobs/new', shortcut: 'Ctrl+N' },
    { label: tx('pages.searchModal.shortcuts.myProjects', undefined, 'My projects'), Icon: FolderOpen, href: '/client/jobs', shortcut: 'Ctrl+P' },
    { label: tx('pages.searchModal.shortcuts.findFreelancers', undefined, 'Find freelancers'), Icon: Users, href: '/find-freelancers', shortcut: 'Ctrl+F' },
    { label: tx('pages.searchModal.shortcuts.contracts', undefined, 'Contracts'), Icon: ClipboardList, href: '/contracts', shortcut: 'Ctrl+C' },
  ]

  const publicShortcuts: SearchItem[] = [
    { label: tx('pages.searchModal.shortcuts.browseJobs', undefined, 'Browse jobs'), Icon: Briefcase, href: '/jobs', shortcut: 'Ctrl+J' },
    { label: tx('pages.searchModal.shortcuts.findFreelancers', undefined, 'Find freelancers'), Icon: Users, href: '/find-freelancers', shortcut: 'Ctrl+F' },
    { label: tx('pages.searchModal.shortcuts.howItWorks', undefined, 'How it works'), Icon: FileText, href: '/how-it-works', shortcut: 'Ctrl+H' },
    { label: tx('pages.searchModal.shortcuts.createAccount', undefined, 'Create account'), Icon: PlusCircle, href: '/signup', shortcut: 'Ctrl+N' },
  ]

  const shortcuts = !user
    ? publicShortcuts
    : activeWorkspace === 'freelancer'
      ? freelancerShortcuts
      : clientShortcuts
  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length >= 2
  const filteredShortcuts = trimmedQuery
    ? shortcuts.filter((item) => item.label.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : shortcuts
  const goToSearchResults = () => {
    if (!trimmedQuery) return
    setRecentSearches((prev) => {
      const next = [trimmedQuery, ...prev.filter((item) => item !== trimmedQuery)].slice(0, 5)
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      return next
    })
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    onClose()
  }

  const commandItems = useMemo(() => {
    if (!trimmedQuery) return [] as SearchItem[]

    return [
      {
        label: tx('pages.searchModal.searchEverything', { query: trimmedQuery }, `Search everything for "${trimmedQuery}"`),
        href: `/search?q=${encodeURIComponent(trimmedQuery)}`,
        meta: tx('pages.searchModal.searchEverythingMeta', undefined, 'Open the full search page with all matching results'),
        Icon: Search,
        section: tx('pages.searchModal.sectionBestMatch', undefined, 'Best match'),
      },
      ...results.map((item) => ({ ...item, section: tx('pages.searchModal.sectionJobs', undefined, 'Jobs') })),
      ...filteredShortcuts.map((item) => ({ ...item, section: tx('pages.searchModal.sectionActions', undefined, 'Actions') })),
    ]
  }, [filteredShortcuts, results, trimmedQuery, tx])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === 'string').slice(0, 5))
      }
    } catch {
      setRecentSearches([])
    }
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowDown') setSelected((value) => Math.min(value + 1, Math.max(commandItems.length - 1, 0)))
      if (event.key === 'ArrowUp') setSelected((value) => Math.max(value - 1, 0))
      if (event.key === 'Enter') {
        if (isSearching) {
          const selectedItem = commandItems[selected]
          if (selectedItem) {
            if (selectedItem.href.startsWith('/search?q=')) {
              goToSearchResults()
            } else {
              navigate(selectedItem.href)
              onClose()
            }
          } else {
            goToSearchResults()
          }
          return
        }

        if (shortcuts[selected]) {
          navigate(shortcuts[selected].href)
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [commandItems, goToSearchResults, isSearching, navigate, onClose, selected, shortcuts])

  useEffect(() => {
    if (!isSearching) {
      setResults([])
      return
    }

    const timer = window.setTimeout(async () => {
      setLoading(true)

      const { data } = await supabase
        .from('jobs')
        .select('id, title, budget_min, budget_max')
        .ilike('title', `%${trimmedQuery}%`)
        .eq('status', 'open')
        .limit(6)

      setResults(
        (data || []).map((job) => ({
          label: job.title,
          href: `/jobs/${job.id}`,
          meta: `${job.budget_min}-${job.budget_max} ${tx('common.tnd', undefined, 'TND')}`,
          Icon: Briefcase,
        }))
      )

      setLoading(false)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [isSearching, trimmedQuery, tx])

  useEffect(() => {
    setSelected(0)
  }, [trimmedQuery])

  const placeholder = !user
    ? tx('globalSearch.placeholder', undefined, 'Search jobs, freelancers, skills...')
    : activeWorkspace === 'freelancer'
      ? tx('pages.searchModal.placeholderFreelancer', undefined, 'Search jobs, skills...')
      : tx('pages.searchModal.placeholderClient', undefined, 'Search freelancers, skills...')

  const trending = [
    tx('search.suggestions.logoDesign', undefined, 'Logo Design'),
    tx('search.suggestions.reactJs', undefined, 'React JS'),
    tx('search.suggestions.translation', undefined, 'Translation'),
    tx('search.suggestions.videoEditing', undefined, 'Video Editing'),
    tx('search.suggestions.python', undefined, 'Python'),
    'UI/UX',
  ]
  const recent = shortcuts.slice(0, 3)

  const workspaceTitle = !user
    ? tx('pages.searchModal.globalTitle', undefined, 'Global search')
    : activeWorkspace === 'freelancer'
      ? tx('pages.searchModal.workspaceFreelancer', undefined, 'Freelancer workspace')
      : tx('pages.searchModal.workspaceClient', undefined, 'Client workspace')

  const go = (href: string) => {
    navigate(href)
    onClose()
  }

  const groupedCommandItems = commandItems.reduce<Array<{ title: string; items: SearchItem[] }>>((acc, item) => {
    const title = item.section || tx('pages.searchModal.sectionGeneral', undefined, 'Results')
    const existing = acc.find((section) => section.title === title)
    if (existing) {
      existing.items.push(item)
      return acc
    }
    acc.push({ title, items: [item] })
    return acc
  }, [])

  return (
    <div
      className="modal-backdrop items-start pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="modal-surface radius-card elevation-modal z-[51] max-w-[640px] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border/70 bg-[linear-gradient(180deg,var(--surface-bg),transparent)] px-4 pb-4 pt-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{workspaceTitle}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {tx('pages.searchModal.headerHint', undefined, 'Jump to pages, search live jobs, and open common actions faster.')}
              </p>
            </div>
            <kbd className="header-kbd text-[11px] dark:bg-card/8">
              {tx('ui.esc')}</kbd>
          </div>

          <div className="flex min-h-[58px] items-center gap-3 rounded-2xl border border-border bg-[var(--card-bg)] px-4 shadow-[0_16px_36px_-28px_var(--workspace-primary-shadow,rgba(109,40,217,0.35))]">
            <Search className="h-5 w-5 flex-shrink-0 text-[color:var(--workspace-primary)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSelected(0)
              }}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-base font-medium text-[var(--text-primary)] outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-[var(--text-muted)]"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)]">
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {trimmedQuery ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-[var(--surface-bg)] px-3.5 py-2 text-xs">
              <div className="min-w-0 text-[var(--text-secondary)]">
                {tx('pages.searchModal.enterHint', { query: trimmedQuery }, `Press Enter to view all results for "${trimmedQuery}"`)}
              </div>
              <kbd className="header-kbd text-[11px] dark:bg-card/8">{tx('ui.enter')}</kbd>
            </div>
          ) : null}
        </div>

        <div className="max-h-[440px] overflow-y-auto px-3 py-3 sm:px-4">
          {!isSearching ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[color:var(--workspace-primary)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    {tx('pages.searchModal.quickActions', undefined, 'Quick actions')}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {shortcuts.map((item) => {
                      const { tx } = useTranslation();
                    const Icon = item.Icon
                    return (
                      <button
                        key={item.href}
                        onClick={() => go(item.href)}
                        className="group flex items-start gap-3 rounded-2xl border border-border bg-[var(--card-bg)] px-3.5 py-3 text-left transition-all duration-150 hover:border-[color:var(--workspace-primary)]/16 hover:bg-[var(--surface-bg)]"
                      >
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--workspace-primary)]/10 text-[color:var(--workspace-primary)]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{item.label}</span>
                          <span className="mt-1 block text-xs text-[var(--text-muted)]">{item.shortcut || tx('pages.searchModal.openAction', undefined, 'Open')}</span>
                        </span>
                        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[color:var(--workspace-primary)]" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <TrendingUp className="h-3 w-3 text-[color:var(--workspace-primary)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  {tx('pages.searchModal.trendingNow', undefined, 'Trending now')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 px-2 pb-1">
                  {trending.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="cursor-pointer rounded-full border border-border bg-[var(--surface-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[color:var(--workspace-primary)]/18 hover:bg-[color:var(--workspace-primary)]/10 hover:text-[color:var(--workspace-primary)]"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Search className="h-3 w-3 text-[var(--text-muted)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    {tx('pages.searchModal.recentSection', undefined, 'Recent jumps')}
                  </span>
                </div>
                <div className="space-y-1">
                  {recent.map((item) => {
                      const { tx } = useTranslation();
                    const Icon = item.Icon
                    return (
                      <button
                        key={`recent-${item.href}`}
                        onClick={() => go(item.href)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-bg)]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-bg)] text-[var(--text-muted)]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="truncate text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                      </button>
                    )
                  })}
                  {recentSearches.map((term) => (
                    <button
                      key={`recent-search-${term}`}
                      onClick={() => setQuery(term)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-bg)]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-bg)] text-[var(--text-muted)]">
                        <Search className="h-4 w-4" />
                      </span>
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {isSearching ? (
            <div className="px-2 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {loading
                ? tx('globalSearch.searching', undefined, 'Searching...')
                : tx('pages.searchModal.resultsCount', { count: results.length }, `${results.length} results`)}
            </span>
            </div>
          ) : null}

          {isSearching && !loading && results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-[var(--surface-bg)] py-10 text-center">
              <Search className="h-8 w-8 text-[var(--text-muted)]" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">{tx('globalSearch.noResultsFor', { query }, `No results for "${query}"`)}</p>
              <p className="text-xs text-[var(--text-muted)]">{tx('pages.searchModal.tryDifferent', undefined, 'Try a different search term')}</p>
            </div>
          ) : null}

          {isSearching && loading ? (
            <div className="space-y-2 px-1 py-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-[var(--card-bg)] px-3 py-3">
                  <div className="h-9 w-9 rounded-xl bg-[var(--surface-bg)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 rounded bg-[var(--surface-bg)]" />
                    <div className="h-2.5 w-1/3 rounded bg-[var(--surface-bg)]" />
                  </div>
                  {index === 0 ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--workspace-primary)]" /> : null}
                </div>
              ))}
            </div>
          ) : null}

          {!loading && isSearching ? groupedCommandItems.map((section) => (
            <div key={section.title} className="mb-4 last:mb-0">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {section.title}
              </div>
              {section.items.map((item) => {
                  const { tx } = useTranslation();
                const flatIndex = commandItems.findIndex((entry) => entry.href === item.href && entry.label === item.label)
                const Icon = item.Icon || Briefcase
                const isSelected = flatIndex === selected

                return (
                  <button
                    key={`${section.title}-${item.href}-${item.label}`}
                    onClick={() => item.href.startsWith('/search?q=') ? goToSearchResults() : go(item.href)}
                    onMouseEnter={() => setSelected(flatIndex)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-100 ${
                      isSelected
                        ? 'border-[color:var(--workspace-primary)]/18 bg-[color:var(--workspace-primary)]/[0.08]'
                        : 'border-transparent bg-transparent hover:border-border hover:bg-[var(--surface-bg)]'
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--workspace-primary)]/10">
                      <Icon className="h-4 w-4 text-[color:var(--workspace-primary)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                      {item.meta ? <p className="mt-1 text-xs text-[var(--text-muted)]">{item.meta}</p> : null}
                    </div>
                    {item.shortcut ? (
                      <kbd className="header-kbd flex-shrink-0 dark:bg-card/8">
                        {item.shortcut}
                      </kbd>
                    ) : (
                      <ArrowUpRight className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-[color:var(--workspace-primary)]' : 'text-[var(--text-muted)]'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          )) : null}
        </div>

        <div
          className="flex min-h-[44px] flex-wrap items-center gap-4 border-t border-border/70 bg-[var(--surface-bg)] px-4 py-2"
        >
          {[
            { key: 'Up/Down', label: tx('globalSearch.toNavigate', undefined, 'Navigate') },
            { key: 'Enter', label: tx('globalSearch.toSelect', undefined, 'Select') },
            { key: 'ESC', label: tx('common.close', undefined, 'Close') },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="header-kbd dark:bg-card/5">
                {key}
              </kbd>
              <span className="text-[11px] text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

