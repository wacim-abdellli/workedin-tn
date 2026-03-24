import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, TrendingUp, Briefcase, FileText,
  ClipboardList, Wallet, PlusCircle, FolderOpen,
  Users, Settings, X
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/workspaceState'
import { supabase } from '@/lib/supabase'

const FREELANCER_SHORTCUTS = [
  { label: 'Browse all jobs', Icon: Briefcase, href: '/jobs', shortcut: '⌘J' },
  { label: 'My proposals', Icon: FileText, href: '/my-proposals', shortcut: '⌘P' },
  { label: 'My earnings', Icon: Wallet, href: '/freelancer/earnings', shortcut: '⌘E' },
  { label: 'Settings', Icon: Settings, href: '/settings', shortcut: '⌘,' },
]

const CLIENT_SHORTCUTS = [
  { label: 'Post a project', Icon: PlusCircle, href: '/jobs/new', shortcut: '⌘N' },
  { label: 'My projects', Icon: FolderOpen, href: '/client/jobs', shortcut: '⌘P' },
  { label: 'Find freelancers', Icon: Users, href: '/find-freelancers', shortcut: '⌘F' },
  { label: 'Contracts', Icon: ClipboardList, href: '/contracts', shortcut: '⌘C' },
]

const TRENDING = ['Logo Design', 'React JS', 'Translation', 'Video Editing', 'Python', 'UI/UX']

interface SearchModalProps { onClose: () => void }

export default function SearchModal({ onClose }: SearchModalProps) {
  const { activeWorkspace } = useWorkspaceStore()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)

  const shortcuts = activeWorkspace === 'freelancer' ? FREELANCER_SHORTCUTS : CLIENT_SHORTCUTS
  const isSearching = query.length >= 2
  const items = isSearching ? results : shortcuts

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setSelected(p => Math.min(p + 1, items.length - 1))
      if (e.key === 'ArrowUp') setSelected(p => Math.max(p - 1, 0))
      if (e.key === 'Enter' && items[selected]) {
        navigate(items[selected].href)
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [items, selected, navigate, onClose])

  // Live search
  useEffect(() => {
    if (!isSearching) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('jobs')
        .select('id, title, category, budget_min, budget_max')
        .ilike('title', `%${query}%`)
        .eq('status', 'open')
        .limit(6)
      setResults((data || []).map(j => ({
        label: j.title,
        href: `/jobs/${j.id}`,
        meta: `${j.budget_min}–${j.budget_max} TND`,
        Icon: Briefcase,
      })))
      setLoading(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, isSearching])

  const go = (href: string) => { navigate(href); onClose() }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '80px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full bg-white dark:bg-[#1a1825] rounded-2xl overflow-hidden"
        style={{
          maxWidth: '560px',
          margin: '0 16px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div
          className="flex items-center gap-3 px-4"
          style={{ height: '52px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Search className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder={activeWorkspace === 'freelancer' ? 'Search jobs, skills...' : 'Search freelancers, skills...'}
            className="flex-1 bg-transparent text-gray-900 dark:text-white text-base
                       outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[11px] font-mono bg-gray-100 dark:bg-white/8
                          border border-gray-200 dark:border-white/10
                          rounded-md px-1.5 py-0.5 text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Body */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>

          {/* Trending (only when not searching) */}
          {!isSearching && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Trending now
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                {TRENDING.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg
                               transition-all duration-100"
                    style={{
                      background: 'rgba(139,92,246,0.12)',
                      color: '#a78bfa',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.22)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.12)')}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section label */}
          <div className="px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {isSearching ? (loading ? 'Searching...' : `${results.length} results`) : 'Go to'}
            </span>
          </div>

          {/* No results */}
          {isSearching && !loading && results.length === 0 && (
            <div className="flex flex-col items-center py-8 gap-2">
              <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No results for "{query}"
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Try a different search term
              </p>
            </div>
          )}

          {/* Items (shortcuts or results) */}
          {items.map((item, idx) => {
            const Icon = item.Icon || Briefcase
            const isSelected = idx === selected
            return (
              <button
                key={item.href + idx}
                onClick={() => go(item.href)}
                onMouseEnter={() => setSelected(idx)}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg
                           transition-colors duration-100 text-left"
                style={{
                  background: isSelected ? 'rgba(139,92,246,0.12)' : 'transparent',
                  borderLeft: isSelected ? '2px solid #8b5cf6' : '2px solid transparent',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                    {item.label}
                  </p>
                  {item.meta && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.meta}</p>
                  )}
                </div>
                {item.shortcut && (
                  <kbd className="text-[10px] font-mono text-gray-400
                                  bg-gray-100 dark:bg-white/8
                                  border border-gray-200 dark:border-white/10
                                  rounded px-1.5 py-0.5 flex-shrink-0">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4"
          style={{
            height: '36px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          {[
            { key: '↑↓', label: 'Navigate' },
            { key: '↵', label: 'Select' },
            { key: 'ESC', label: 'Close' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded
                             bg-white/5 border border-white/10 text-gray-400">
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
