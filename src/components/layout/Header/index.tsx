import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ChevronDown,
  ClipboardList,
  FileText,
  FolderOpen,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Search,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/i18n'
import { useWorkspaceStore } from '@/lib/workspaceState'
import { NotificationBell } from '@/components/ui'

import SearchModal from './SearchModal'

const FREELANCER_NAV = [
  { label: 'Find Work', Icon: Briefcase, href: '/jobs' },
  { label: 'Proposals', Icon: FileText, href: '/my-proposals' },
  { label: 'Contracts', Icon: ClipboardList, href: '/contracts' },
  { label: 'Wallet', Icon: Wallet, href: '/wallet' },
]

const CLIENT_NAV = [
  { label: 'Post Project', Icon: PlusCircle, href: '/jobs/new' },
  { label: 'My Projects', Icon: FolderOpen, href: '/client/jobs' },
  { label: 'Freelancers', Icon: Users, href: '/find-freelancers' },
  { label: 'Contracts', Icon: ClipboardList, href: '/contracts' },
]

const PUBLIC_NAV = [
  { label: 'Find Work', Icon: Briefcase, href: '/jobs' },
  { label: 'Find Freelancers', Icon: Users, href: '/find-freelancers' },
  { label: 'How It Works', Icon: FileText, href: '/how-it-works' },
]

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback']

const LANGS = [
  { code: 'ar', label: 'العربية', display: 'AR', country: 'TN' },
  { code: 'fr', label: 'Francais', display: 'FR', country: 'FR' },
  { code: 'en', label: 'English', display: 'EN', country: 'GB' },
] as const

function AuthHeader({ logoSrc, onHome }: { logoSrc: string; onHome: () => void }) {
  return (
    <>
      <header
        dir="ltr"
        className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-center bg-transparent"
      >
        <button onClick={onHome} className="flex items-center justify-center">
          <img src={logoSrc} alt="Khedma TN" style={{ height: '28px', width: 'auto' }} />
        </button>
      </header>
      <div style={{ height: '60px' }} />
    </>
  )
}

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const { activeWorkspace } = useWorkspaceStore()
  const { language, setLanguage } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false)
      if (!langRef.current?.contains(event.target as Node)) setLangOpen(false)
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setLangOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen, searchOpen])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const isFreelancer = Boolean(user) && activeWorkspace === 'freelancer'
  const isAuthPage = AUTH_ROUTES.includes(pathname)
  const navItems = !user ? PUBLIC_NAV : isFreelancer ? FREELANCER_NAV : CLIENT_NAV
  const currentLang = language || 'en'
  const activeLang = LANGS.find((lang) => lang.code === currentLang) ?? LANGS[2]
  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Me'
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Me'
  const workspaceAccent = isFreelancer ? '#8b5cf6' : '#f59e0b'
  const logoSrc = isDark ? '/logos/logo-primary-dark.svg' : '/logos/logo-primary.svg'

  if (isAuthPage) {
    return <AuthHeader logoSrc={logoSrc} onHome={() => navigate('/')} />
  }

  return (
    <>
      <header
        dir="ltr"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-[#0f0e17]/95'
            : 'border-b border-gray-100 bg-white dark:border-white/5 dark:bg-[#0f0e17]'
        }`}
      >
        {user ? (
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: workspaceAccent }} />
        ) : null}

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="flex h-[60px] items-center justify-between md:hidden">
            <button onClick={() => navigate('/')} className="flex items-center">
              <img src={logoSrc} alt="Khedma TN" style={{ height: '28px', width: 'auto' }} />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="hidden md:grid"
            style={{
              height: '60px',
              gridTemplateColumns: '140px 1fr 280px',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div className="flex items-center">
              <button onClick={() => navigate('/')} className="flex items-center">
                <img src={logoSrc} alt="Khedma TN" style={{ height: '28px', width: 'auto' }} />
              </button>
            </div>

            <nav id="main-nav" className="flex items-center justify-center gap-0.5">
              {navItems.map(({ label, Icon, href }) => (
                <NavLink
                  key={href}
                  to={href}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                      isActive
                        ? isFreelancer
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-gray-400 transition-all duration-150 hover:bg-gray-200 hover:text-gray-600 dark:border-white/8 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-gray-300"
                style={{ width: '110px' }}
              >
                <Search className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="flex-1 text-left text-[11px]">Search...</span>
                <kbd className="hidden rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px] font-mono text-gray-400 dark:border-white/10 dark:bg-white/10 sm:block">
                  Ctrl+K
                </kbd>
              </button>

              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen((open) => !open)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                >
                  <span className="text-xs font-medium">{activeLang.country}</span>
                  <span className="text-xs font-medium text-gray-400">{activeLang.display}</span>
                </button>
                {langOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-black/20 dark:border-white/10 dark:bg-[#1a1825]">
                    {LANGS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setLangOpen(false)
                        }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          currentLang === lang.code
                            ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="w-8 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {lang.country}
                        </span>
                        <span className="flex-1 text-left">{lang.label}</span>
                        <span className="text-xs font-medium text-gray-400">{lang.display}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                onClick={toggleTheme}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {user ? <NotificationBell /> : null}

              {!user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-500"
                  >
                    Get started
                  </button>
                </div>
              ) : null}

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2 transition-all duration-150 ${
                      userMenuOpen
                        ? 'border-purple-300 bg-purple-50 dark:border-purple-500/40 dark:bg-purple-900/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'
                    }`}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={firstName}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                      >
                        {firstName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span
                      className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 md:block"
                      style={{ maxWidth: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {firstName}
                    </span>
                    <span
                      className={`hidden flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold md:block ${
                        isFreelancer
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {isFreelancer ? 'Pro' : 'Client'}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {userMenuOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-black/20 dark:border-white/10 dark:bg-[#1a1825]">
                      <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/5">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>

                      {[
                        { label: 'Dashboard', Icon: User, href: '/dashboard' },
                        { label: 'Settings', Icon: Settings, href: '/settings' },
                        { label: 'Verify identity', Icon: Shield, href: '/verify-identity' },
                      ].map(({ label, Icon, href }) => (
                        <button
                          key={href}
                          onClick={() => {
                            navigate(href)
                            setUserMenuOpen(false)
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                          <Icon className="h-3.5 w-3.5 text-gray-400" />
                          {label}
                        </button>
                      ))}

                      <div className="mt-1 border-t border-gray-100 pt-1 dark:border-white/5">
                        <button
                          onClick={async () => {
                            await signOut()
                            setUserMenuOpen(false)
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-[#0f0e17]/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 w-[88vw] max-w-sm border-l border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#14121f]">
            <div className="flex h-[60px] items-center justify-between border-b border-gray-100 px-4 dark:border-white/10">
              <button onClick={() => navigate('/')} className="flex items-center">
                <img src={logoSrc} alt="Khedma TN" style={{ height: '28px', width: 'auto' }} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-4">
              <button
                onClick={() => {
                  setSearchOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search the platform</span>
              </button>

              {user ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-3">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={firstName} className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                      >
                        {firstName[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <nav className="space-y-2">
                {navItems.map(({ label, Icon, href }) => (
                  <NavLink
                    key={href}
                    to={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? isFreelancer
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}

                {user ? (
                  <>
                    <button
                      onClick={() => {
                        navigate('/dashboard')
                        setMobileMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <User className="h-4 w-4 flex-shrink-0" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings')
                        setMobileMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <Settings className="h-4 w-4 flex-shrink-0" />
                      Settings
                    </button>
                  </>
                ) : null}
              </nav>

              <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Language</p>
                <div className="grid grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`rounded-xl border px-3 py-2 text-center transition-colors ${
                        currentLang === lang.code
                          ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-900/20 dark:text-purple-300'
                          : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'
                      }`}
                    >
                      <div className="text-[11px] font-semibold">{lang.country}</div>
                      <div className="text-[11px] text-gray-400">{lang.display}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 dark:border-white/10 dark:text-gray-200"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDark ? 'Light' : 'Dark'}
                </button>

                {!user ? (
                  <button
                    onClick={() => {
                      navigate('/login')
                      setMobileMenuOpen(false)
                    }}
                    className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Sign in
                  </button>
                ) : null}
              </div>

              {user ? (
                <button
                  onClick={async () => {
                    await signOut()
                    setMobileMenuOpen(false)
                    navigate('/')
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate('/signup')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-white/10 dark:text-gray-200"
                >
                  Get started
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ height: '60px' }} />

      {searchOpen ? <SearchModal onClose={() => setSearchOpen(false)} /> : null}
    </>
  )
}
