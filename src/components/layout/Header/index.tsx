import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Briefcase, FileText, ClipboardList, Wallet,
  PlusCircle, FolderOpen, Users, Search,
  Bell, Sun, Moon, ChevronDown, LogOut,
  Settings, User, Shield
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspaceStore } from '@/lib/workspaceState'
import { useTranslation } from '@/i18n'
import SearchModal from './SearchModal'

// ─── NAV CONFIGS ────────────────────────────────────────────────
const FREELANCER_NAV = [
  { label: 'Find Work',   Icon: Briefcase,     href: '/jobs' },
  { label: 'Proposals',   Icon: FileText,       href: '/my-proposals' },
  { label: 'Contracts',   Icon: ClipboardList,  href: '/contracts' },
  { label: 'Earnings',    Icon: Wallet,         href: '/freelancer/earnings' },
]

const CLIENT_NAV = [
  { label: 'Post Project', Icon: PlusCircle,    href: '/jobs/new' },
  { label: 'My Projects',  Icon: FolderOpen,    href: '/client/jobs' },
  { label: 'Freelancers',  Icon: Users,         href: '/find-freelancers' },
  { label: 'Contracts',    Icon: ClipboardList, href: '/contracts' },
]

const PUBLIC_NAV = [
  { label: 'Find Work',       Icon: Briefcase, href: '/jobs' },
  { label: 'Find Freelancers', Icon: Users,    href: '/find-freelancers' },
  { label: 'How It Works',    Icon: FileText,  href: '/how-it-works' },
]

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const { activeWorkspace } = useWorkspaceStore()
  const { language, setLanguage } = useTranslation()
  const navigate = useNavigate()

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  )
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  // scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false)
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const isFreelancer = user && activeWorkspace === 'freelancer'
  const navItems = !user ? PUBLIC_NAV : isFreelancer ? FREELANCER_NAV : CLIENT_NAV

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Account'
  const currentLang = language || 'en'
  const LANGS = [
    { code: 'ar', label: 'العربية', flag: '🇹🇳' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English',  flag: '🇬🇧' },
  ]
  const activeLang = LANGS.find(l => l.code === currentLang) ?? LANGS[2]

  const workspaceAccent = isFreelancer ? '#8b5cf6' : '#f59e0b'
  const logoSrc = isDark ? '/logos/logo-primary-dark.svg' : '/logos/logo-primary.svg'

  return (
    <>
      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 dark:bg-[#0f0e17]/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-white/5'
            : 'bg-white dark:bg-[#0f0e17] border-b border-gray-100 dark:border-white/5'
        }`}
      >
        {/* Workspace color bar — 2px only */}
        {user && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: workspaceAccent }}
          />
        )}

        <div
          className="mx-auto px-4 sm:px-6"
          style={{
            maxWidth: '1280px',
            height: '60px',
            display: 'grid',
            gridTemplateColumns: '140px 1fr 280px',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* ── ZONE 1: LOGO ── */}
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="flex items-center">
              <img
                src={logoSrc}
                alt="Khedma TN"
                style={{ height: '28px', width: 'auto' }}
              />
            </button>
          </div>

          {/* ── ZONE 2: NAV ── */}
          <nav className="flex items-center justify-center gap-0.5">
            {navItems.map(({ label, Icon, href }) => (
              <NavLink
                key={href}
                to={href}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   text-sm font-medium whitespace-nowrap transition-all duration-150
                   ${isActive
                     ? isFreelancer
                       ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                       : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                     : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                   }`
                }
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* ── ZONE 3: RIGHT ACTIONS ── */}
          <div className="flex items-center justify-end gap-1.5">

            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                         bg-gray-100 dark:bg-white/5
                         border border-gray-200 dark:border-white/8
                         text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                         hover:bg-gray-200 dark:hover:bg-white/10
                         transition-all duration-150"
              style={{ width: '120px' }}
            >
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs flex-1 text-left">Search...</span>
              <kbd className="text-[10px] font-mono bg-white dark:bg-white/10
                             border border-gray-200 dark:border-white/10
                             rounded px-1 py-0.5 text-gray-400 hidden sm:block">
                ⌘K
              </kbd>
            </button>

            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(p => !p)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg
                           text-gray-500 dark:text-gray-400
                           hover:bg-gray-50 dark:hover:bg-white/5
                           transition-colors text-xs font-medium"
              >
                <span>{activeLang.flag}</span>
                <span>{activeLang.code.toUpperCase()}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-36
                                bg-white dark:bg-[#1a1825]
                                border border-gray-200 dark:border-white/10
                                rounded-xl shadow-xl shadow-black/20
                                overflow-hidden z-50 py-1">
                  {LANGS.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as 'ar' | 'fr' | 'en')
                        setLangOpen(false)
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2
                                  text-sm transition-colors
                                  ${currentLang === lang.code
                                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                  }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className="flex-1 text-left">{lang.label}</span>
                      {currentLang === lang.code && (
                        <span className="text-purple-500 text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400
                         hover:bg-gray-50 dark:hover:bg-white/5
                         transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            {user && (
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-1.5 rounded-lg
                           text-gray-500 dark:text-gray-400
                           hover:bg-gray-50 dark:hover:bg-white/5
                           transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5
                                 bg-red-500 rounded-full" />
              </button>
            )}

            {/* Auth buttons (not logged in) */}
            {!user && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 text-sm font-medium
                             text-gray-600 dark:text-gray-400
                             hover:text-gray-900 dark:hover:text-white
                             transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-4 py-1.5 text-sm font-medium
                             bg-purple-600 hover:bg-purple-500
                             text-white rounded-lg transition-colors"
                >
                  Get started
                </button>
              </div>
            )}

            {/* Account pill (logged in) */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(p => !p)}
                  className={`flex items-center gap-1.5 pl-1 pr-2 py-1
                              rounded-full border transition-all duration-150
                              ${userMenuOpen
                                ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/8'
                              }`}
                >
                  {/* Avatar */}
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={firstName}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center
                                 text-white text-[10px] font-bold"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                    >
                      {firstName[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* Name */}
                  <span
                    className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:block"
                    style={{ maxWidth: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {firstName}
                  </span>
                  {/* Workspace badge */}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                flex-shrink-0 hidden md:block
                                ${isFreelancer
                                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                }`}
                  >
                    {isFreelancer ? 'Pro' : 'Client'}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 flex-shrink-0 text-gray-400
                                transition-transform duration-200
                                ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52
                                bg-white dark:bg-[#1a1825]
                                border border-gray-200 dark:border-white/10
                                rounded-xl shadow-xl shadow-black/20
                                overflow-hidden z-50 py-1"
                  >
                    {/* User info header */}
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-white/5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {profile?.full_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    {[
                      { label: 'Dashboard', Icon: User, href: '/dashboard' },
                      { label: 'Settings', Icon: Settings, href: '/settings' },
                      { label: 'Verify identity', Icon: Shield, href: '/verify-identity' },
                    ].map(({ label, Icon, href }) => (
                      <button
                        key={href}
                        onClick={() => { navigate(href); setUserMenuOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2
                                   text-sm text-gray-700 dark:text-gray-300
                                   hover:bg-gray-50 dark:hover:bg-white/5
                                   transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        {label}
                      </button>
                    ))}

                    <div className="border-t border-gray-100 dark:border-white/5 mt-1 pt-1">
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2
                                   text-sm text-red-600 dark:text-red-400
                                   hover:bg-red-50 dark:hover:bg-red-900/20
                                   transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page offset spacer */}
      <div style={{ height: '60px' }} />

      {/* Search modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  )
}
