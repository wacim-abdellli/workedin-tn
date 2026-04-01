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
  MessageSquare,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/i18n'
import { hasAdminAccess } from '@/lib/adminAccess'
import { getInitials, resolveAccountAvatarUrl } from '@/lib/avatar'
import { switchWorkspace } from '@/lib/switchWorkspace'
import { useWorkspaceStore } from '@/lib/workspaceState'
import { NotificationBell } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { getTotalUnreadCount, subscribeToConversations } from '@/services/messages'
import type { RealtimeChannel } from '@supabase/supabase-js'

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
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const conversationsChannelRef = useRef<RealtimeChannel | null>(null)

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
    setAvatarFailed(false)
  }, [profile?.avatar_url])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen, searchOpen])

  // Load and subscribe to unread messages count
  useEffect(() => {
    if (!user) return

    const loadUnreadCount = async () => {
      const { count } = await getTotalUnreadCount(user.id)
      setUnreadCount(count)
    }

    loadUnreadCount()

    // Subscribe to conversation updates for real-time unread count
    conversationsChannelRef.current = subscribeToConversations(user.id, () => {
      // On any conversation change, reload the count
      // This handles unread count updates when messages are marked as read
      loadUnreadCount()
    })

    return () => {
      if (conversationsChannelRef.current) {
        conversationsChannelRef.current.unsubscribe()
      }
    }
  }, [user?.id])

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
  const avatarUrl = resolveAccountAvatarUrl(profile?.avatar_url, avatarFailed)
  const avatarInitials = getInitials(displayName)
  const targetWorkspace = isFreelancer ? 'client' : 'freelancer'
  const canQuickSwitch = Boolean(user)
  const switchTargetLabel = targetWorkspace === 'freelancer'
    ? (t.auth?.accountPanel?.freelancerLabel || 'Freelancer')
    : (t.auth?.accountPanel?.clientLabel || 'Client')
  const switchActionLabel = t.auth?.accountPanel?.switchAction || 'Switch'
  const switchButtonLabel = `${switchActionLabel}: ${switchTargetLabel}`
  const freelancerVerified = Boolean(profile?.cin_verified || freelancerProfile?.cin_verified)
  const freelancerPending = Boolean(!freelancerVerified && profile?.cin_submitted)
  const switchAccent = targetWorkspace === 'freelancer'
    ? {
        borderColor: '#8b5cf6',
        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        color: '#ffffff',
      }
    : {
        borderColor: '#d97706',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#ffffff',
      }
  const logoSrc = isDark ? '/logos/logo-primary-dark.svg' : '/logos/logo-primary.svg'
  const freelancerBadge = freelancerVerified
    ? {
        label: t.auth?.accountPanel?.statusPro || 'Pro',
        background: 'var(--workspace-primary)',
        color: '#ffffff',
        dotClassName: 'bg-white',
        border: 'rgba(255,255,255,0.18)',
        insetShadow: '0 0 0 1px rgba(255,255,255,0.08) inset',
      }
    : freelancerPending
      ? {
          label: t.auth?.accountPanel?.statusPending || 'Pending',
          background: 'rgba(245,158,11,0.16)',
          color: '#d97706',
          dotClassName: 'bg-amber-500',
          border: 'rgba(245,158,11,0.22)',
          insetShadow: '0 0 0 1px rgba(255,255,255,0.22) inset',
        }
      : {
          label: t.auth?.accountPanel?.needsSetup || 'Needs setup',
          background: 'rgba(255,255,255,0.08)',
          color: 'var(--text-primary)',
          dotClassName: 'bg-white/70',
          border: 'rgba(255,255,255,0.14)',
          insetShadow: '0 0 0 1px rgba(255,255,255,0.06) inset',
        }
  const workspaceBadge = isFreelancer
    ? freelancerBadge
    : {
        label: t.auth?.accountPanel?.clientLabel || 'Client',
        background: 'var(--brand-accent)',
        color: 'var(--text-primary)',
        dotClassName: 'bg-foreground',
        border: 'rgba(245,158,11,0.18)',
        insetShadow: '0 0 0 1px rgba(255,255,255,0.35) inset',
      }
  const triggerWorkspaceBadge = isFreelancer
    ? {
        label: t.auth?.accountPanel?.freelancerLabel || 'Freelancer',
        background: 'rgba(139,92,246,0.14)',
        color: '#8b5cf6',
        dotClassName: 'bg-primary-500',
        border: 'rgba(139,92,246,0.18)',
      }
    : {
        label: t.auth?.accountPanel?.clientLabel || 'Client',
        background: 'rgba(245,158,11,0.16)',
        color: '#d97706',
        dotClassName: 'bg-accent-500',
        border: 'rgba(245,158,11,0.18)',
      }
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
        className={`fixed top-0 left-0 right-0 z-50 isolate transition-all duration-200 ${
          scrolled
            ? 'border-b border-border/50 bg-surface/95 shadow-sm backdrop-blur-md'
            : 'border-b border-border/50 bg-surface'
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

            <div className="flex min-w-0 items-center justify-end gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex h-10 min-w-0 w-[120px] items-center gap-2 rounded-lg border border-border bg-input px-3 text-muted/70 transition-colors hover:bg-surface hover:text-foreground lg:w-[140px] xl:w-[160px]"
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
                  className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface"
                >
                  <span className="text-xs font-medium">{activeLang.country}</span>
                  <span className="text-xs font-medium text-gray-400">{activeLang.display}</span>
                </button>
                {langOpen ? (
                  <div className="absolute end-0 top-full z-[70] mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-[var(--card-bg)] p-1.5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.03] backdrop-blur-xl dark:ring-white/[0.04]">
                    {LANGS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setLangOpen(false)
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                          currentLang === lang.code
                            ? 'text-foreground'
                            : 'text-foreground hover:bg-surface'
                        }`}
                        style={currentLang === lang.code ? {
                          background: 'var(--workspace-primary-light)',
                          color: 'var(--workspace-primary)',
                        } : undefined}
                      >
                        <span className="w-8 shrink-0 text-start text-xs font-semibold text-muted">
                          {lang.country}
                        </span>
                        <span className="flex-1 truncate text-start font-medium">{lang.label}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{lang.display}</span>
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

              {user ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate('/messages')}
                    className="header-icon-btn relative"
                    aria-label={t.nav?.messages || 'Messages'}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-text">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationBell />
                </div>
              ) : null}

              {!user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
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
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={firstName}
                        className="header-profile-avatar"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <div
                        className="header-profile-avatar flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                      >
                        {avatarInitials}
                      </div>
                    )}
                    <span
                      className="hidden max-w-[72px] truncate text-sm font-medium text-gray-700 dark:text-gray-200 md:block"
                    >
                      {firstName}
                    </span>
                    <span
                        className="header-profile-chip flex-shrink-0 flex items-center gap-1.5"
                      style={{
                        background: triggerWorkspaceBadge.background,
                        color: triggerWorkspaceBadge.color,
                        padding: '5px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        border: `1px solid ${triggerWorkspaceBadge.border}`,
                        boxShadow: 'none',
                      }}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${triggerWorkspaceBadge.dotClassName}`} />
                      {triggerWorkspaceBadge.label}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {userMenuOpen ? (
                    <div className="absolute end-0 top-full z-[70] mt-3 w-[288px] overflow-hidden rounded-[1.4rem] border border-border bg-[var(--card-bg)] p-2.5 shadow-[0_28px_80px_-30px_rgba(15,23,42,0.48)] ring-1 ring-black/[0.03] backdrop-blur-xl dark:ring-white/[0.04]">
                      <div className="rounded-[1.15rem] border border-border/50 bg-[var(--surface-bg)] px-4 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{displayName}</p>
                            <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
                          </div>
                          <span
                            className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                            style={{
                              background: isFreelancer ? workspaceBadge.background : 'rgba(245,158,11,0.16)',
                              color: isFreelancer ? workspaceBadge.color : '#d97706',
                            }}
                          >
                            {workspaceBadge.label}
                          </span>
                        </div>
                      </div>

                      {canQuickSwitch ? (
                        <button
                          onClick={() => {
                            void handleQuickWorkspaceSwitch()
                            setUserMenuOpen(false)
                          }}
                          disabled={isSwitching}
                          className={`mt-2.5 flex w-full items-center gap-3 rounded-[1rem] border px-3.5 py-3 text-left text-sm font-semibold transition-all duration-150 ${isSwitching ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5'}`}
                          style={{
                            ...switchAccent,
                            boxShadow: isSwitching ? 'none' : '0 14px 28px -18px rgba(0, 0, 0, 0.18)',
                          }}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 text-current">
                            <Repeat2 className={`h-4 w-4 ${isSwitching ? 'animate-spin' : ''}`} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{switchButtonLabel}</span>
                        </button>
                      ) : null}

                      <div className="mt-2.5 space-y-1.5">
                        <button
                          onClick={() => {
                            navigate('/dashboard')
                            setUserMenuOpen(false)
                          }}
                          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-foreground transition-all duration-150 hover:bg-[var(--surface-bg)]"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-[var(--surface-bg)] text-muted transition-colors group-hover:border-brand/16 group-hover:text-brand">
                            <User className="h-4 w-4" />
                          </span>
                          <span className="truncate">{t.nav?.dashboard || 'Dashboard'}</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/settings')
                            setUserMenuOpen(false)
                          }}
                          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-foreground transition-all duration-150 hover:bg-[var(--surface-bg)]"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-[var(--surface-bg)] text-muted transition-colors group-hover:border-brand/16 group-hover:text-brand">
                            <Settings className="h-4 w-4" />
                          </span>
                          <span className="truncate">{t.nav?.settings || 'Settings'}</span>
                        </button>

                        {freelancerVerified ? (
                          <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-semibold text-emerald-800 opacity-90 cursor-not-allowed dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <span className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <Shield className="h-4 w-4" />
                              </span>
                              <span className="truncate">{t.settings?.cinVerification || 'Verify identity'}</span>
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </div>
                        ) : freelancerPending ? (
                          <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-3 text-sm font-semibold text-orange-800 opacity-90 cursor-not-allowed dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400">
                            <span className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100/50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                                <Shield className="h-4 w-4" />
                              </span>
                              <span className="truncate">{t.settings?.cinVerification || 'Verify identity'}</span>
                            </span>
                            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              navigate('/verify-identity')
                              setUserMenuOpen(false)
                            }}
                            className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-foreground transition-all duration-150 hover:bg-[var(--surface-bg)]"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-[var(--surface-bg)] text-muted transition-colors group-hover:border-brand/16 group-hover:text-brand">
                              <Shield className="h-4 w-4" />
                            </span>
                            <span className="truncate">{t.settings?.cinVerification || 'Verify identity'}</span>
                          </button>
                        )}

                        {canAccessAdmin && (
                          <button
                            onClick={() => {
                              navigate('/admin')
                              setUserMenuOpen(false)
                            }}
                            className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-foreground transition-all duration-150 hover:bg-[var(--surface-bg)]"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-[var(--surface-bg)] text-muted transition-colors group-hover:border-brand/16 group-hover:text-brand">
                              <Shield className="h-4 w-4" />
                            </span>
                            <span className="truncate">{t.nav?.adminDashboard || 'Admin Dashboard'}</span>
                          </button>
                        )}
                      </div>

                      <div className="mt-2.5 border-t border-border/50 pt-2.5">
                        <button
                          onClick={async () => {
                            await signOut()
                            setUserMenuOpen(false)
                          }}
                          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-red-500 transition-all duration-150 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-500 transition-colors">
                            <LogOut className="h-4 w-4" />
                          </span>
                          <span>{t.nav?.logout || 'Sign out'}</span>
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
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className={`absolute inset-y-0 w-[88vw] max-w-sm bg-surface border-border shadow-2xl ${
            dir === 'rtl' ? 'left-0 border-r border-border' : 'right-0 border-l border-border'
          }`}>
            <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
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
                className="flex h-11 w-full items-center gap-3 rounded-2xl border border-input bg-input px-4 text-start text-muted"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">{t.common?.search || 'Search'}</span>
              </button>

              {user ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={firstName} className="h-11 w-11 rounded-full object-cover" onError={() => setAvatarFailed(true)} />
                    ) : (
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                      >
                        {avatarInitials}
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
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                    >
                      <User className="h-4 w-4 flex-shrink-0" />
                        {t.nav?.dashboard || 'Dashboard'}
                    </button>
                    <button
                      onClick={() => {
                        navigate('/messages')
                        setMobileMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface relative"
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        {t.nav?.messages || 'Messages'}
                      {unreadCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-text">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings')
                        setMobileMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
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
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
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
                    navigate('/login', { replace: true })
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
