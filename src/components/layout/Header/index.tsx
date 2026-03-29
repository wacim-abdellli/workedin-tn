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
  Repeat2,
  Sun,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/i18n'
import { hasAdminAccess } from '@/lib/adminAccess'
import { switchWorkspace } from '@/lib/switchWorkspace'
import { useWorkspaceStore } from '@/lib/workspaceState'
import { NotificationBell } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

import SearchModal from './SearchModal'

// Nav arrays are created inside the component to pick up live translations

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback']

const LANGS = [
  { code: 'ar', label: 'العربية', display: 'AR', country: 'TN' },
  { code: 'fr', label: 'Francais', display: 'FR', country: 'FR' },
  { code: 'en', label: 'English', display: 'EN', country: 'GB' },
] as const

function AuthHeader({ logoSrc, onHome, dir }: { logoSrc: string; onHome: () => void; dir: 'rtl' | 'ltr' }) {
  return (
    <>
      <header
        dir={dir}
        className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-center bg-transparent"
      >
        <button onClick={onHome} className="flex items-center justify-center">
          <img src={logoSrc} alt="Khedma TN" style={{ height: '28px', width: 'auto' }} />
        </button>
      </header>
      <div style={{ height: '64px' }} />
    </>
  )
}

export default function Header() {
  const { user, profile, freelancerProfile, signOut } = useAuth()
  const { activeWorkspace, isSwitching } = useWorkspaceStore()
  const { t, language, setLanguage, dir } = useTranslation()
  const { showToast } = useToast()

  const FREELANCER_NAV = [
    { label: t.nav?.findWork || 'Find Work', Icon: Briefcase, href: '/jobs' },
    { label: t.nav?.proposals || 'Proposals', Icon: FileText, href: '/my-proposals' },
    { label: t.nav?.contracts || 'Contracts', Icon: ClipboardList, href: '/contracts' },
    { label: t.nav?.wallet || 'Wallet', Icon: Wallet, href: '/wallet' },
  ]

  const CLIENT_NAV = [
    { label: t.nav?.postProject || 'Post Project', Icon: PlusCircle, href: '/jobs/new' },
    { label: t.nav?.myProjects || 'My Projects', Icon: FolderOpen, href: '/client/jobs' },
    { label: t.nav?.findFreelancers || 'Find Freelancers', Icon: Users, href: '/find-freelancers' },
    { label: t.nav?.contracts || 'Contracts', Icon: ClipboardList, href: '/contracts' },
  ]

  const PUBLIC_NAV = [
    { label: t.nav?.findWork || 'Find Work', Icon: Briefcase, href: '/jobs' },
    { label: t.nav?.findFreelancers || 'Find Freelancers', Icon: Users, href: '/find-freelancers' },
    { label: t.nav?.howItWorks || 'How It Works', Icon: FileText, href: '/how-it-works' },
  ]
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
  const targetWorkspace = isFreelancer ? 'client' : 'freelancer'
  const canQuickSwitch = Boolean(user)
  const switchTargetLabel = targetWorkspace === 'freelancer'
    ? (t.auth?.accountPanel?.freelancerLabel || 'Freelancer')
    : (t.auth?.accountPanel?.clientLabel || 'Client')
  const switchActionLabel = t.auth?.accountPanel?.switchAction || 'Switch'
  const switchButtonLabel = `${switchActionLabel}: ${switchTargetLabel}`
  const logoSrc = isDark ? '/logos/logo-primary-dark.svg' : '/logos/logo-primary.svg'
  const navActiveClass = 'header-nav-link-active'
  const canAccessAdmin = hasAdminAccess(user, profile)

  const handleQuickWorkspaceSwitch = async () => {
    if (!user || isSwitching) return

    try {
      await switchWorkspace({
        userId: user.id,
        targetWorkspace,
        currentUserType: profile?.user_type ?? 'client',
        profile,
        freelancerProfile: freelancerProfile ?? null,
        navigate,
      })

      showToast(
        targetWorkspace === 'freelancer'
          ? (t.auth?.accountPanel?.switchedFreelancer || 'Freelancer workspace is now active.')
          : (t.auth?.accountPanel?.switchedClient || 'Client workspace is now active.'),
        'success'
      )
    } catch {
      showToast(t.auth?.accountPanel?.switchError || 'We could not switch your workspace right now.', 'error')
    }
  }

  if (isAuthPage) {
    return <AuthHeader logoSrc={logoSrc} onHome={() => navigate('/')} dir={dir} />
  }

  return (
    <>
      <header
        dir={dir}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-[#0f0e17]/95'
            : 'border-b border-gray-100 bg-white dark:border-white/5 dark:bg-[#0f0e17]'
        }`}
      >
        {user ? (
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'var(--workspace-primary)' }} />
        ) : null}

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between md:hidden">
            <button onClick={() => navigate('/')} className="flex items-center">
              <img src={logoSrc} alt="Khedma TN" style={{ height: '28px', width: 'auto' }} />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="header-icon-btn"
                aria-label="فتح البحث"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="header-icon-btn"
                aria-label="فتح قائمة التنقل"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="hidden h-16 items-center gap-3 md:flex">
            <div className="flex shrink-0 items-center">
              <button onClick={() => navigate('/')} className="flex items-center">
                <img src={logoSrc} alt="Khedma TN" style={{ height: '28px', width: 'auto' }} />
              </button>
            </div>

            <nav id="main-nav" className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden">
              {navItems.map(({ label, Icon, href }) => (
                <NavLink
                  key={href}
                  to={href}
                  className={({ isActive }) => (isActive ? navActiveClass : 'header-nav-link')}
                  style={({ isActive }) => isActive ? { color: 'var(--workspace-primary)', borderColor: 'var(--workspace-primary)' } : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="flex min-w-0 items-center justify-end gap-1.5">
              {canQuickSwitch ? (
                <button
                  onClick={handleQuickWorkspaceSwitch}
                  disabled={isSwitching}
                  className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors ${isSwitching ? 'cursor-not-allowed opacity-70' : ''}`}
                  style={{
                    borderColor: 'var(--workspace-primary-mid)',
                    background: 'var(--workspace-primary-light)',
                    color: 'var(--workspace-primary)',
                  }}
                  aria-label={switchButtonLabel}
                  title={switchButtonLabel}
                >
                  <Repeat2 className={`h-3.5 w-3.5 ${isSwitching ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">{switchButtonLabel}</span>
                  <span className="lg:hidden">{switchTargetLabel}</span>
                </button>
              ) : null}

                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex h-9 min-w-0 w-[128px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:border-white/8 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-gray-300 lg:w-[148px] xl:w-[164px]"
                >
                  <Search className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 truncate text-start text-xs">{t.common.search}</span>
                  <kbd className="header-kbd hidden xl:inline-flex">
                    Ctrl+K
                  </kbd>
                </button>

              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen((open) => !open)}
                  className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                >
                  <span className="text-xs font-medium">{activeLang.country}</span>
                  <span className="text-xs font-medium text-gray-400">{activeLang.display}</span>
                </button>
                {langOpen ? (
                  <div className="absolute end-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-black/20 dark:border-white/10 dark:bg-[#1a1825]">
                    {LANGS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setLangOpen(false)
                        }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          currentLang === lang.code
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                        }`}
                        style={currentLang === lang.code ? {
                          background: 'var(--workspace-primary-light)',
                          color: 'var(--workspace-primary)',
                        } : undefined}
                      >
                        <span className="w-8 text-start text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {lang.country}
                        </span>
                        <span className="flex-1 text-start">{lang.label}</span>
                        <span className="text-xs font-medium text-gray-400">{lang.display}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                onClick={toggleTheme}
                className="header-icon-btn"
                aria-label={isDark ? t.common?.toggleLightMode || 'Toggle light mode' : t.common?.toggleDarkMode || 'Toggle dark mode'}
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
                    {t.nav?.login || 'Sign in'}
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors"
                    style={{ background: 'var(--workspace-primary)' }}
                  >
                    {t.nav?.signup || 'Get started'}
                  </button>
                </div>
              ) : null}

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className={`header-profile-trigger ${userMenuOpen ? 'header-profile-trigger-open' : ''}`}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={firstName}
                        className="header-profile-avatar"
                      />
                    ) : (
                      <div
                        className="header-profile-avatar flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                      >
                        {firstName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span
                      className="hidden max-w-[72px] truncate text-sm font-medium text-gray-700 dark:text-gray-200 md:block"
                    >
                      {firstName}
                    </span>
                    <span
                        className={`header-profile-chip flex-shrink-0 ${
                        isFreelancer
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                       }`}
                      style={{
                        background: 'var(--workspace-primary-light)',
                        color: 'var(--workspace-primary)',
                      }}
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
                    <div className="header-dropdown-surface absolute end-0 top-full z-50 mt-2 w-56">
                      <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/5">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>

                      {[
                        { label: t.nav?.dashboard || 'Dashboard', Icon: User, href: '/dashboard' },
                        { label: t.nav?.settings || 'Settings', Icon: Settings, href: '/settings' },
                        { label: t.settings?.cinVerification || 'Verify identity', Icon: Shield, href: '/verify-identity' },
                        ...(canAccessAdmin
                          ? [{ label: t.nav?.adminDashboard || 'Admin Dashboard', Icon: Shield, href: '/admin' }]
                          : []),
                      ].map(({ label, Icon, href }) => (
                        <button
                          key={href}
                          onClick={() => {
                            navigate(href)
                            setUserMenuOpen(false)
                          }}
                          className="header-dropdown-item"
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
                          {t.nav?.logout || 'Sign out'}
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
            aria-label={t.common?.closeMenu || 'Close navigation menu'}
            className="absolute inset-0 bg-[#0f0e17]/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className={`absolute inset-y-0 w-[88vw] max-w-sm bg-white shadow-2xl dark:border-white/10 dark:bg-[#14121f] ${
            dir === 'rtl' ? 'left-0 border-r border-gray-200' : 'right-0 border-l border-gray-200'
          }`}>
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4 dark:border-white/10">
              <button onClick={() => navigate('/')} className="flex items-center">
                <img src={logoSrc} alt="Khedma TN" style={{ height: '28px', width: 'auto' }} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="header-icon-btn"
                aria-label={t.common?.closeMenu || 'Close navigation menu'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-4">
              <button
                onClick={() => {
                  setSearchOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="flex h-11 w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-start text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">{t.common?.search || 'Search'}</span>
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
                {canQuickSwitch ? (
                  <button
                    onClick={() => {
                      void handleQuickWorkspaceSwitch()
                      setMobileMenuOpen(false)
                    }}
                    disabled={isSwitching}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${isSwitching ? 'cursor-not-allowed opacity-70' : ''}`}
                    style={{
                      color: 'var(--workspace-primary)',
                      background: 'var(--workspace-primary-light)',
                    }}
                  >
                    <Repeat2 className={`h-4 w-4 flex-shrink-0 ${isSwitching ? 'animate-spin' : ''}`} />
                    {switchButtonLabel}
                  </button>
                ) : null}

                {navItems.map(({ label, Icon, href }) => (
                  <NavLink
                    key={href}
                    to={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'header-nav-link-active'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                      }`
                    }
                    style={({ isActive }) => isActive ? { color: 'var(--workspace-primary)', borderColor: 'var(--workspace-primary)' } : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="min-w-0 truncate">{label}</span>
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
                        {t.nav?.dashboard || 'Dashboard'}
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings')
                        setMobileMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <Settings className="h-4 w-4 flex-shrink-0" />
                        {t.nav?.settings || 'Settings'}
                    </button>
                    {canAccessAdmin ? (
                      <button
                        onClick={() => {
                          navigate('/admin')
                          setMobileMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Shield className="h-4 w-4 flex-shrink-0" />
                        {t.nav?.adminDashboard || 'Admin Dashboard'}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </nav>

              <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{t.settings?.language || 'Language'}</p>
                <div className="grid grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`rounded-xl border px-3 py-2 text-center transition-colors ${
                        currentLang === lang.code
                          ? 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'
                          : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'
                        }`}
                      style={currentLang === lang.code ? {
                        borderColor: 'var(--workspace-primary-mid)',
                        background: 'var(--workspace-primary-light)',
                        color: 'var(--workspace-primary)',
                      } : undefined}
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
                  {isDark ? (t.common?.toggleLightMode || 'Light') : (t.common?.toggleDarkMode || 'Dark')}
                </button>

                {!user ? (
                  <button
                    onClick={() => {
                      navigate('/login')
                      setMobileMenuOpen(false)
                    }}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                    style={{ background: 'var(--workspace-primary)' }}
                  >
                    {t.nav?.login || 'Sign in'}
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
                  {t.nav?.logout || 'Sign out'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate('/signup')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-white/10 dark:text-gray-200"
                >
                  {t.nav?.signup || 'Get started'}
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
