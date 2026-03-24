import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  TrendingUp,
  Briefcase,
  FileText,
  ClipboardList,
  Wallet,
  PlusCircle,
  FolderOpen,
  Users,
  Settings,
  X,
} from 'lucide-react';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const FREELANCER_SHORTCUTS = [
  { label: 'Browse all jobs', Icon: Briefcase, href: '/jobs', shortcut: '⌘J' },
  { label: 'My proposals', Icon: FileText, href: '/my-proposals', shortcut: '⌘P' },
  { label: 'My earnings', Icon: Wallet, href: '/freelancer/earnings', shortcut: '⌘E' },
  { label: 'Settings', Icon: Settings, href: '/settings', shortcut: '⌘,' },
] as const;

const CLIENT_SHORTCUTS = [
  { label: 'Post a project', Icon: PlusCircle, href: '/jobs/new', shortcut: '⌘N' },
  { label: 'My projects', Icon: FolderOpen, href: '/client/jobs', shortcut: '⌘P' },
  { label: 'Find freelancers', Icon: Users, href: '/find-freelancers', shortcut: '⌘F' },
  { label: 'Contracts', Icon: ClipboardList, href: '/contracts', shortcut: '⌘C' },
] as const;

const TRENDING = ['Logo Design', 'React JS', 'Translation', 'Video Editing', 'Python', 'UI/UX'];

interface SearchModalProps {
  onClose: () => void;
}

type SearchItem = {
  label: string;
  href: string;
  meta?: string;
  shortcut?: string;
  Icon?: typeof Briefcase;
};

export default function SearchModal({ onClose }: SearchModalProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);

  const shortcuts = activeWorkspace === 'freelancer' ? FREELANCER_SHORTCUTS : CLIENT_SHORTCUTS;
  const isSearching = query.length >= 2;
  const items: SearchItem[] = isSearching ? results : [...shortcuts];

  void user;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setSelected((p) => Math.min(p + 1, items.length - 1));
      if (e.key === 'ArrowUp') setSelected((p) => Math.max(p - 1, 0));
      if (e.key === 'Enter' && items[selected]) {
        navigate(items[selected].href);
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [items, selected, navigate, onClose]);

  useEffect(() => {
    if (!isSearching) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('jobs')
        .select('id, title, category, budget_min, budget_max')
        .ilike('title', `%${query}%`)
        .eq('status', 'open')
        .limit(6);

      setResults(
        (data || []).map((j) => ({
          label: j.title,
          href: `/jobs/${j.id}`,
          meta: `${j.budget_min ?? 0}–${j.budget_max ?? 0} TND`,
          Icon: Briefcase,
        }))
      );
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isSearching]);

  const go = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center backdrop-blur-sm transition-opacity duration-300"
      style={{ 
        paddingTop: '80px', 
        background: 'rgba(0,0,0,0.4)', 
        animation: 'fadeIn 200ms ease-out'
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        className="w-full bg-white dark:bg-[#0f0e17] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          maxWidth: '560px',
          margin: '0 16px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.1)',
          animation: 'slideUp 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-white/8 bg-gradient-to-br from-white to-gray-50 dark:from-[#1a1825] dark:to-[#0f0e17]">
          <div className="relative">
            <Search className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${
              query ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
            }`} />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            placeholder={activeWorkspace === 'freelancer' ? 'Search jobs, skills...' : 'Search freelancers, skills...'}
            className="flex-1 bg-transparent text-gray-900 dark:text-white text-base outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery('')} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8 rounded-lg p-1 transition-all duration-200" 
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {!query && (
            <kbd className="text-[11px] font-mono bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 border border-gray-300 dark:border-white/15 rounded-lg px-2 py-1 text-gray-600 dark:text-gray-400 font-semibold">
              ESC
          </kbd>
          )}
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto' }} className="scroll-smooth">
          {!isSearching && (
            <>
              <div className="px-4 py-6">
                <div className="flex items-center gap-2 pb-4">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Trending Now</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="text-sm font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm relative group overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.08))',
                        color: '#a78bfa',
                        border: '1px solid rgba(139,92,246,0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.15))';
                        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.08))';
                        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)';
                      }}
                      type="button"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-200 dark:border-white/8">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Quick Access</span>
              </div>
            </>
          )}

          {isSearching && loading && (
            <div className="px-4 py-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex-shrink-0" 
                    style={{ 
                      background: 'rgba(139,92,246,0.15)',
                      animation: 'loadingPulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 200}ms`
                    }} 
                  />
                  <div className="flex-1 space-y-2">
                    <div 
                      className="h-3 rounded-full bg-gray-300 dark:bg-white/10" 
                      style={{ width: '70%', animation: 'loadingPulse 1.5s ease-in-out infinite', animationDelay: `${i * 200}ms` }} 
                    />
                    <div 
                      className="h-2 rounded-full bg-gray-200 dark:bg-white/5" 
                      style={{ width: '45%', animation: 'loadingPulse 1.5s ease-in-out infinite', animationDelay: `${i * 200 + 100}ms` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isSearching && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10">
                <Search className="w-6 h-6 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No results found</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Try different keywords or browse trending searches</p>
            </div>
          )}

          <div className="px-4 py-3 space-y-1">
            {items.map((item, idx) => {
              const Icon = item.Icon || Briefcase;
              const isSelected = idx === selected;
              const categoryColor = idx % 3 === 0 ? '#8b5cf6' : idx % 3 === 1 ? '#06b6d4' : '#10b981';
              const categoryBg = idx % 3 === 0 ? 'rgba(139,92,246,0.1)' : idx % 3 === 1 ? 'rgba(6,182,212,0.1)' : 'rgba(16,185,129,0.1)';
              
              return (
                <button
                  key={item.href + idx}
                  onClick={() => go(item.href)}
                  onMouseEnter={() => setSelected(idx)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 text-left group hover:scale-102 active:scale-98"
                  style={{
                    background: isSelected ? 'rgba(139,92,246,0.12)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #8b5cf6' : '3px solid transparent',
                    paddingLeft: isSelected ? '2.5rem' : '3.5rem',
                  }}
                  type="button"
                >
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:shadow-md group-hover:scale-110" 
                    style={{ 
                      background: categoryBg,
                      borderLeft: `2px solid ${categoryColor}`
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: categoryColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{item.label}</p>
                    {item.meta && <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{item.meta}</p>}
                  </div>
                  {item.shortcut && (
                    <kbd className="text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/8 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1 flex-shrink-0 font-bold group-hover:border-purple-400 dark:group-hover:border-purple-500 transition-colors">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="flex items-center justify-between px-5 py-3.5 border-t border-gray-200 dark:border-white/8 bg-gray-50/50 dark:bg-white/5"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.02), rgba(139,92,246,0.03))'
          }}
        >
          <div className="flex items-center gap-4">
            {[
              { key: '↑↓', label: 'Navigate' },
              { key: '↵', label: 'Select' },
              { key: 'ESC', label: 'Close' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2 hidden sm:flex">
                <kbd className="text-[10px] font-bold bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 border border-gray-300 dark:border-white/15 rounded-md px-1.5 py-0.5 text-gray-700 dark:text-gray-400">
                  {key}
                </kbd>
                <span className="text-[11px] text-gray-500 dark:text-gray-500">{label}</span>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Powered by Khedma</span>
        </div>
      </div>
    </div>
  );
}