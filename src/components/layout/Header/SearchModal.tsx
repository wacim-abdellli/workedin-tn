import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ClipboardList,
  FileText,
  FolderOpen,
  PlusCircle,
  Search,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
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
}

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
  const isSearching = query.length >= 2
  const items = isSearching ? results : shortcuts

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowDown') setSelected((value) => Math.min(value + 1, items.length - 1))
      if (event.key === 'ArrowUp') setSelected((value) => Math.max(value - 1, 0))
      if (event.key === 'Enter' && items[selected]) {
        navigate(items[selected].href)
        onClose()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [items, navigate, onClose, selected])

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
        .ilike('title', `%${query}%`)
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
  }, [isSearching, query])

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

  const go = (href: string) => {
    navigate(href)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '80px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative z-[51] w-full overflow-hidden rounded-2xl bg-white dark:bg-[#1a1825]"
        style={{
          maxWidth: '560px',
          margin: '0 16px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4"
          style={{ height: '52px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSelected(0)
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-600"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <kbd className="rounded-md border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-gray-400 dark:border-white/10 dark:bg-white/8">
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
          {!isSearching ? (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <TrendingUp className="h-3 w-3 text-purple-500" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {tx('pages.searchModal.trendingNow', undefined, 'Trending now')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                {trending.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="cursor-pointer rounded-lg border border-purple-800/30 bg-purple-900/20 px-2.5 py-1 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-900/40"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {isSearching
                ? (loading
                  ? tx('globalSearch.searching', undefined, 'Searching...')
                  : tx('pages.searchModal.resultsCount', { count: results.length }, `${results.length} results`))
                : tx('pages.searchModal.goTo', undefined, 'Go to')}
            </span>
          </div>

          {isSearching && !loading && results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Search className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{tx('globalSearch.noResultsFor', { query }, `No results for "${query}"`)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{tx('pages.searchModal.tryDifferent', undefined, 'Try a different search term')}</p>
            </div>
          ) : null}

          {items.map((item, index) => {
            const Icon = item.Icon || Briefcase
            const isSelected = index === selected

            return (
              <button
                key={`${item.href}-${index}`}
                onClick={() => go(item.href)}
                onMouseEnter={() => setSelected(index)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-100"
                style={{
                  background: isSelected ? 'rgba(139,92,246,0.12)' : 'transparent',
                  borderLeft: isSelected ? '2px solid #8b5cf6' : '2px solid transparent',
                }}
              >
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.12)' }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: '#a78bfa' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</p>
                  {item.meta ? <p className="text-xs text-gray-400 dark:text-gray-500">{item.meta}</p> : null}
                </div>
                {item.shortcut ? (
                  <kbd className="flex-shrink-0 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:border-white/10 dark:bg-white/8">
                    {item.shortcut}
                  </kbd>
                ) : null}
              </button>
            )
          })}
        </div>

        <div
          className="flex items-center gap-4 px-4"
          style={{
            height: '36px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          {[
            { key: 'Up/Down', label: tx('globalSearch.toNavigate', undefined, 'Navigate') },
            { key: 'Enter', label: tx('globalSearch.toSelect', undefined, 'Select') },
            { key: 'ESC', label: tx('common.close', undefined, 'Close') },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
                {key}
              </kbd>
              <span className="text-[11px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
