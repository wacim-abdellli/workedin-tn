import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FileText,
  FolderOpen,
  LogOut,
  Menu,
  MoreHorizontal,
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
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n";
import { hasAdminAccess } from "@/lib/adminAccess";
import { getInitials, resolveAccountAvatarUrl } from "@/lib/avatar";
import { switchWorkspace } from "@/lib/switchWorkspace";
import { useWorkspaceStore } from "@/lib/workspaceState";
import { NotificationBell, Logo } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  getTotalUnreadCount,
  subscribeToConversations,
} from "@/services/messages";
import type { RealtimeChannel } from "@supabase/supabase-js";

import SearchModal from "./SearchModal";

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

const LANGS = [
  { code: "ar", label: "العربية", display: "AR", country: "TN" },
  { code: "fr", label: "Francais", display: "FR", country: "FR" },
  { code: "en", label: "English", display: "EN", country: "GB" },
] as const;

function AuthHeader({
  onHome,
  dir,
}: {
  onHome: () => void;
  dir: "rtl" | "ltr";
}) {
  const { tx } = useTranslation();

  return (
    <>
      <header
        dir={dir}
        className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-center bg-transparent"
      >
        <button
          onClick={onHome}
          className="flex items-center justify-center"
          aria-label={tx("header.a11y.goHome", undefined, "Go to homepage")}
        >
          <Logo variant="mark" size="sm" />
        </button>
      </header>
      <div className="h-16" />
    </>
  );
}

export default function Header() {
  const { user, profile, freelancerProfile, signOut } = useAuth();
  const { activeWorkspace, isSwitching } = useWorkspaceStore();
  const { t, tx, language, setLanguage, dir } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const FREELANCER_NAV = [
    { label: t.nav?.findWork || "Find Work", Icon: Briefcase, href: "/jobs" },
    {
      label: t.nav?.proposals || "Proposals",
      Icon: FileText,
      href: "/my-proposals",
    },
    {
      label: t.nav?.contracts || "Contracts",
      Icon: ClipboardList,
      href: "/contracts",
    },
    { label: t.nav?.wallet || "Wallet", Icon: Wallet, href: "/wallet" },
  ];

  const CLIENT_NAV = [
    {
      label: t.nav?.postProject || "Post Project",
      Icon: PlusCircle,
      href: "/jobs/new",
    },
    {
      label: t.nav?.myProjects || "My Projects",
      Icon: FolderOpen,
      href: "/client/jobs",
    },
    {
      label: t.nav?.findFreelancers || "Find Freelancers",
      Icon: Users,
      href: "/find-freelancers",
    },
    {
      label: t.nav?.contracts || "Contracts",
      Icon: ClipboardList,
      href: "/contracts",
    },
  ];

  const PUBLIC_NAV = [
    { label: t.nav?.findWork || "Find Work", Icon: Briefcase, href: "/jobs" },
    {
      label: t.nav?.findFreelancers || "Find Freelancers",
      Icon: Users,
      href: "/find-freelancers",
    },
    {
      label: t.nav?.howItWorks || "How It Works",
      Icon: FileText,
      href: "/how-it-works",
    },
  ];

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [navMoreOpen, setNavMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const navMoreRef = useRef<HTMLDivElement>(null);
  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const isDesktopCondensed = false;

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node))
        setUserMenuOpen(false);
      if (!langRef.current?.contains(event.target as Node)) setLangOpen(false);
      if (!navMoreRef.current?.contains(event.target as Node))
        setNavMoreOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setLangOpen(false);
    setNavMoreOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profile?.avatar_url]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen, searchOpen]);

  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      const { count } = await getTotalUnreadCount(user.id);
      setUnreadCount(count);
    };

    loadUnreadCount();

    conversationsChannelRef.current = subscribeToConversations(user.id, () => {
      loadUnreadCount();
    });

    return () => {
      if (conversationsChannelRef.current) {
        conversationsChannelRef.current.unsubscribe();
      }
    };
  }, [user?.id]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const isFreelancer = Boolean(user) && activeWorkspace === "freelancer";
  const isAuthPage = AUTH_ROUTES.includes(pathname);
  const navItems = !user
    ? PUBLIC_NAV
    : isFreelancer
      ? FREELANCER_NAV
      : CLIENT_NAV;
  const desktopNavItems = navItems;
  const overflowNavItems: typeof navItems = [];
  const hasOverflowActiveItem = false;
  const moreLabel = t.pages?.mobileNav?.more || "More";
  const currentLang = language || "en";
  const activeLang =
    LANGS.find((lang) => lang.code === currentLang) ?? LANGS[2];
  const firstName =
    profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Me";
  const displayName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "Me";
  const avatarUrl = resolveAccountAvatarUrl(profile?.avatar_url, avatarFailed);
  const avatarInitials = getInitials(displayName);
  const targetWorkspace = isFreelancer ? "client" : "freelancer";
  const canQuickSwitch = Boolean(user);
  const switchTargetLabel =
    targetWorkspace === "freelancer"
      ? t.auth?.accountPanel?.freelancerLabel || "Freelancer"
      : t.auth?.accountPanel?.clientLabel || "Client";
  const switchActionLabel = t.auth?.accountPanel?.switchAction || "Switch";
  const switchButtonLabel = `${switchActionLabel}: ${switchTargetLabel}`;
  const freelancerVerified = Boolean(
    profile?.cin_verified || freelancerProfile?.cin_verified,
  );
  const freelancerPending = false;

  const triggerWorkspaceBadge = {
    label: isFreelancer
      ? t.auth?.accountPanel?.freelancerLabel || "Freelancer"
      : t.auth?.accountPanel?.clientLabel || "Client",
    background: "var(--workspace-primary-light)",
    color: "var(--workspace-primary-hover)",
    dotClassName: "bg-[var(--color-status-success)] animate-pulse",
    border: "color-mix(in srgb, var(--workspace-primary) 35%, transparent)",
  };

  const switchTargetStyles =
    targetWorkspace === "client"
      ? {
          color: "var(--amber-800)",
          background: "color-mix(in srgb, var(--amber-600) 16%, white)",
          borderColor: "color-mix(in srgb, var(--amber-800) 28%, transparent)",
        }
      : {
          color: "var(--purple-700)",
          background: "color-mix(in srgb, var(--purple-600) 14%, white)",
          borderColor: "color-mix(in srgb, var(--purple-700) 25%, transparent)",
        };

  const navActiveClass = "header-nav-link-active";
  const canAccessAdmin = hasAdminAccess(user, profile);
  const homeLabel = tx("header.a11y.goHome", undefined, "Go to homepage");
  const openSearchLabel = tx(
    "header.a11y.openSearch",
    undefined,
    "Open search",
  );
  const openMenuLabel = tx(
    "header.a11y.openMenu",
    undefined,
    "Open navigation menu",
  );

  const handleQuickWorkspaceSwitch = async () => {
    if (!user || isSwitching) return;

    try {
      await switchWorkspace({
        userId: user.id,
        targetWorkspace,
        currentUserType: profile?.user_type ?? "client",
        profile,
        freelancerProfile: freelancerProfile ?? null,
        navigate,
      });
    } catch {
      showToast(
        t.auth?.accountPanel?.switchError ||
          "We could not switch your workspace right now.",
        "error",
      );
    }
  };

  const handleGoHome = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAuthPage) {
    return <AuthHeader onHome={handleGoHome} dir={dir} />;
  }

  return (
    <>
      <header
        dir={dir}
        className="fixed top-0 left-0 right-0 z-50 border-b shadow-sm transition-all duration-300"
        style={{
          borderColor:
            "color-mix(in srgb, var(--color-border-default) 65%, transparent)",
          background:
            "color-mix(in srgb, var(--color-background-elevated) 74%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto max-w-[1536px] px-4 sm:px-6">
          {/* Mobile header */}
          <div className="flex h-16 items-center justify-between lg:hidden">
            <button
              onClick={handleGoHome}
              className="flex items-center"
              aria-label={homeLabel}
            >
              <Logo variant="full" size="sm" />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="header-icon-btn"
                aria-label={openSearchLabel}
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="header-icon-btn"
                aria-label={openMenuLabel}
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden h-16 items-center gap-4 2xl:gap-6 lg:flex">
            <div className="flex shrink-0 items-center">
              <button
                onClick={handleGoHome}
                className="flex items-center transition-all hover:opacity-80"
                aria-label={homeLabel}
              >
                <Logo variant="full" size="sm" />
              </button>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 2xl:gap-8">
              <div className="flex items-center gap-0.5 2xl:gap-2 whitespace-nowrap">
                <nav id="main-nav" className="flex items-center">
                  {desktopNavItems.map(({ label, Icon, href }) => (
                    <NavLink
                      key={href}
                      to={href}
                      className={({ isActive }) =>
                        isActive ? navActiveClass : "header-nav-link"
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="max-w-[132px] truncate whitespace-nowrap">
                        {label}
                      </span>
                    </NavLink>
                  ))}

                  {overflowNavItems.length > 0 ? (
                    <div className="relative" ref={navMoreRef}>
                      <button
                        onClick={() => setNavMoreOpen((open) => !open)}
                        className={
                          hasOverflowActiveItem
                            ? navActiveClass
                            : "header-nav-link"
                        }
                        aria-label={moreLabel}
                      >
                        <MoreHorizontal className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">{moreLabel}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 transition-transform ${navMoreOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {navMoreOpen ? (
                        <div
                          className="absolute start-0 top-full z-[70] mt-3 w-56 overflow-hidden rounded-[1.25rem] p-2 shadow-[0_28px_70px_-30px_rgba(15,23,42,0.4)] ring-1 backdrop-blur-xl"
                          style={{
                            borderColor: "var(--color-border-default)",
                            borderWidth: "1px",
                            background: "var(--color-background-elevated)",
                            boxShadow: "0 24px 50px -28px rgba(15,23,42,0.45)",
                          }}
                        >
                          {overflowNavItems.map(({ label, Icon, href }) => (
                            <NavLink
                              key={href}
                              to={href}
                              onClick={() => setNavMoreOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center gap-3 rounded-[1rem] px-3.5 py-3 text-sm font-medium transition-colors ${
                                  isActive
                                    ? "text-[var(--workspace-primary)]"
                                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-background-subtle)]"
                                }`
                              }
                              style={({ isActive }) =>
                                isActive
                                  ? {
                                      background:
                                        "var(--workspace-primary-light)",
                                    }
                                  : undefined
                              }
                            >
                              <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                  border:
                                    "1px solid color-mix(in srgb, var(--workspace-primary) 16%, transparent)",
                                  background:
                                    "color-mix(in srgb, var(--workspace-primary) 8%, transparent)",
                                  color: "var(--workspace-primary-hover)",
                                }}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="truncate">{label}</span>
                            </NavLink>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </nav>
              </div>

              <div className="flex min-w-0 flex-1 shrink items-center justify-end gap-2 2xl:gap-4 ps-2 lg:ps-4">
                {/* Search */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex h-10 min-w-9 max-w-[320px] w-full shrink items-center justify-center lg:justify-start gap-2 rounded-2xl px-2 lg:px-3 text-sm font-medium transition-all duration-300"
                  style={{
                    color: "var(--color-text-secondary)",
                    background:
                      "color-mix(in srgb, var(--color-text-primary) 4%, transparent)",
                  }}
                  aria-label={openSearchLabel}
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate text-xs flex-1 text-start hidden lg:block">
                    {t.common.search}...
                  </span>
                  <div className="hidden items-center gap-1 xl:flex shrink-0">
                    <kbd className="header-kbd">Ctrl+K</kbd>
                  </div>
                </button>

                {/* Utility pill */}
                <div
                  className="flex shrink-0 items-center rounded-2xl p-1 shadow-sm"
                  style={{
                    border:
                      "1px solid color-mix(in srgb, var(--color-border-default) 50%, transparent)",
                    background: isDark
                      ? "color-mix(in srgb, var(--color-background-elevated) 60%, transparent)"
                      : "color-mix(in srgb, var(--color-background-elevated) 80%, transparent)",
                  }}
                >
                  <div className="relative" ref={langRef}>
                    <button
                      onClick={() => setLangOpen((open) => !open)}
                      className="flex h-7 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold uppercase tracking-wider transition-all"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <span
                        className="hidden 2xl:inline"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {activeLang.country}
                      </span>
                      <span>{activeLang.display}</span>
                    </button>

                    {langOpen ? (
                      <div
                        className="absolute end-0 top-full z-[70] mt-3 w-52 overflow-hidden rounded-2xl p-1.5 ring-1 backdrop-blur-xl"
                        style={{
                          border: "1px solid var(--color-border-default)",
                          background: "var(--color-background-elevated)",
                        }}
                      >
                        {LANGS.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code);
                              setLangOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors`}
                            style={
                              currentLang === lang.code
                                ? {
                                    background:
                                      "var(--workspace-primary-light)",
                                    color: "var(--workspace-primary-hover)",
                                  }
                                : {
                                    color: "var(--color-text-primary)",
                                  }
                            }
                          >
                            <span
                              className="w-8 shrink-0 text-start text-xs font-semibold"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {lang.country}
                            </span>
                            <span className="flex-1 truncate text-start font-medium">
                              {lang.label}
                            </span>
                            <span
                              className="text-[11px] font-semibold uppercase tracking-wide"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              {lang.display}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="mx-0.5 h-4 w-[1px]"
                    style={{
                      background:
                        "color-mix(in srgb, var(--color-border-default) 75%, transparent)",
                    }}
                  />

                  <button
                    onClick={toggleTheme}
                    className="flex h-7 w-7 items-center justify-center rounded-xl transition-all"
                    aria-label={
                      isDark
                        ? t.common?.toggleLightMode || "Toggle light mode"
                        : t.common?.toggleDarkMode || "Toggle dark mode"
                    }
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {isDark ? (
                      <Sun className="h-3.5 w-3.5" />
                    ) : (
                      <Moon className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {user ? (
                    <>
                      <div
                        className="mx-0.5 h-4 w-[1px]"
                        style={{
                          background:
                            "color-mix(in srgb, var(--color-border-default) 75%, transparent)",
                        }}
                      />

                      <button
                        onClick={() => navigate("/messages")}
                        className="relative flex h-7 w-7 items-center justify-center rounded-xl transition-all"
                        aria-label={t.nav?.messages || "Messages"}
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {unreadCount > 0 ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm ring-2"
                            style={{
                              background: "var(--workspace-accent)",
                              boxShadow:
                                "0 0 0 2px var(--color-background-elevated)",
                            }}
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        ) : null}
                      </button>

                      <div
                        className="mx-0.5 h-4 w-[1px]"
                        style={{
                          background:
                            "color-mix(in srgb, var(--color-border-default) 75%, transparent)",
                        }}
                      />

                      <div className="flex h-7 w-7 items-center justify-center rounded-xl transition-all">
                        <NotificationBell />
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Profile section */}
                {user ? (
                  <div
                    className="flex items-center gap-2.5 ps-1.5 ms-1 border-s"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--color-border-default) 75%, transparent)",
                    }}
                  >
                    {canQuickSwitch ? (
                      <button
                        onClick={() => void handleQuickWorkspaceSwitch()}
                        disabled={isSwitching}
                        className={`flex h-8 w-8 xl:w-auto items-center justify-center gap-1.5 rounded-full border px-0 xl:px-3 text-[10px] font-bold uppercase tracking-wider transition-all ${
                          isSwitching
                            ? "cursor-not-allowed opacity-50"
                            : "hover:-translate-y-[1px] shadow-sm hover:shadow"
                        }`}
                        style={{
                          borderColor: switchTargetStyles.borderColor,
                          color: switchTargetStyles.color,
                          background: switchTargetStyles.background,
                        }}
                        title={switchButtonLabel}
                      >
                        <Repeat2
                          className={`h-3.5 w-3.5 flex-shrink-0 ${isSwitching ? "animate-spin" : ""}`}
                        />
                        <span className="hidden max-w-[76px] truncate xl:inline">
                          {switchTargetLabel}
                        </span>
                      </button>
                    ) : null}

                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => setUserMenuOpen((open) => !open)}
                        className={`header-profile-trigger ${userMenuOpen ? "header-profile-trigger-open" : ""}`}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={firstName}
                            className="h-7 w-7 rounded-full object-cover"
                            onError={() => setAvatarFailed(true)}
                          />
                        ) : (
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: "linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)" }}
                          >
                            {avatarInitials}
                          </div>
                        )}

                        {!isDesktopCondensed ? (
                          <>
                            <span
                              className="w-[76px] truncate text-left text-sm font-medium"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {firstName}
                            </span>
                            <span
                              className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full px-5 py-1 text-[11px] font-semibold"
                              style={{
                                background: triggerWorkspaceBadge.background,
                                color: triggerWorkspaceBadge.color,
                                border: `1px solid ${triggerWorkspaceBadge.border}`,
                              }}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${triggerWorkspaceBadge.dotClassName}`}
                              />
                              <span className="truncate">
                                {triggerWorkspaceBadge.label}
                              </span>
                            </span>
                          </>
                        ) : null}

                        <ChevronDown
                          className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                          style={{ color: "var(--color-text-tertiary)" }}
                        />
                      </button>

                      {userMenuOpen ? (
                        <div
                          className="absolute end-0 top-full z-[70] mt-2 w-[280px] overflow-hidden rounded-[1.25rem] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                          style={{
                            border: "1px solid var(--color-border-subtle)",
                            background: "var(--color-background-elevated)",
                            boxShadow: "0 32px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)",
                          }}
                        >
                          {/* Workspace accent glow strip */}
                          <div
                            className="h-0.5 w-full"
                            style={{ background: "linear-gradient(90deg, transparent, var(--workspace-primary), transparent)" }}
                          />

                          {/* User identity */}
                          <div className="px-3.5 pt-3.5 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={firstName}
                                    className="h-11 w-11 rounded-full object-cover"
                                    style={{
                                      boxShadow: "0 0 0 2px var(--workspace-primary), 0 0 0 4px var(--color-background-elevated)",
                                    }}
                                    onError={() => setAvatarFailed(true)}
                                  />
                                ) : (
                                  <div
                                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                                    style={{
                                      background: "linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)",
                                      boxShadow: "0 0 0 2px var(--workspace-primary), 0 0 0 4px var(--color-background-elevated)",
                                    }}
                                  >
                                    {avatarInitials}
                                  </div>
                                )}
                                <span
                                  className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-[2.5px]"
                                  style={{
                                    background: "var(--color-status-success)",
                                    borderColor: "var(--color-background-elevated)",
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                                  {displayName}
                                </p>
                                <p className="truncate text-[11px] mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                                  {user.email}
                                </p>
                              </div>
                              <span
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide"
                                style={{
                                  background: triggerWorkspaceBadge.background,
                                  color: triggerWorkspaceBadge.color,
                                  border: `1px solid ${triggerWorkspaceBadge.border}`,
                                }}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${triggerWorkspaceBadge.dotClassName}`} />
                                {triggerWorkspaceBadge.label}
                              </span>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="mx-3.5 h-px" style={{ background: "var(--color-border-subtle)" }} />

                          {/* Nav items */}
                          <div className="p-1.5">
                            {[
                              ...(profile?.user_type === "freelancer" || profile?.user_type === "both" ? [
                                { icon: ExternalLink, label: t.nav?.profile || "My Profile", path: `/freelancer/${profile?.username || user?.id}`, hint: null },
                              ] : []),
                              { icon: User, label: t.nav?.dashboard || "Dashboard", path: "/dashboard", hint: null },
                              { icon: Settings, label: t.nav?.settings || "Settings", path: "/settings", hint: null },
                            ].map(({ icon: Icon, label, path }) => (
                              <button
                                key={path}
                                onClick={() => { navigate(path); setUserMenuOpen(false); }}
                                className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100"
                                style={{ color: "var(--color-text-primary)" }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = "color-mix(in srgb, var(--workspace-primary) 8%, var(--color-background-subtle))";
                                  e.currentTarget.style.color = "var(--workspace-primary)";
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = "transparent";
                                  e.currentTarget.style.color = "var(--color-text-primary)";
                                }}
                              >
                                <span
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-100"
                                  style={{
                                    background: "color-mix(in srgb, var(--workspace-primary) 10%, transparent)",
                                    color: "var(--workspace-primary)",
                                  }}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </span>
                                <span className="flex-1">{label}</span>
                              </button>
                            ))}

                            {/* ID Verification */}
                            {freelancerVerified ? (
                              <div
                                className="flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium"
                                style={{ color: "var(--color-status-success)" }}
                              >
                                <span className="flex items-center gap-2.5">
                                  <span
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                    style={{
                                      background: "color-mix(in srgb, var(--color-status-success) 12%, transparent)",
                                      color: "var(--color-status-success)",
                                    }}
                                  >
                                    <Shield className="h-3.5 w-3.5" />
                                  </span>
                                  {t.settings?.cinVerification || "ID Verified"}
                                </span>
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              </div>
                            ) : freelancerPending ? (
                              <div
                                className="flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium"
                                style={{ color: "var(--color-status-warning-text)" }}
                              >
                                <span className="flex items-center gap-2.5">
                                  <span
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                    style={{
                                      background: "color-mix(in srgb, var(--color-status-warning) 12%, transparent)",
                                      color: "var(--color-status-warning)",
                                    }}
                                  >
                                    <Shield className="h-3.5 w-3.5" />
                                  </span>
                                  {t.settings?.cinVerification || "Verify identity"}
                                </span>
                                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                              </div>
                            ) : (
                              <button
                                onClick={() => { navigate("/verify-identity"); setUserMenuOpen(false); }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100"
                                style={{ color: "var(--color-text-primary)" }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = "color-mix(in srgb, var(--color-status-info) 8%, var(--color-background-subtle))";
                                  e.currentTarget.style.color = "var(--color-status-info)";
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = "transparent";
                                  e.currentTarget.style.color = "var(--color-text-primary)";
                                }}
                              >
                                <span
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                  style={{
                                    background: "color-mix(in srgb, var(--color-status-info) 10%, transparent)",
                                    color: "var(--color-status-info)",
                                  }}
                                >
                                  <Shield className="h-3.5 w-3.5" />
                                </span>
                                <span className="flex-1">{t.settings?.cinVerification || "Verify identity"}</span>
                                <span
                                  className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                                  style={{
                                    background: "color-mix(in srgb, var(--color-status-info) 12%, transparent)",
                                    color: "var(--color-status-info)",
                                  }}
                                >
                                  NEW
                                </span>
                              </button>
                            )}

                            {/* Admin */}
                            {canAccessAdmin ? (
                              <button
                                onClick={() => { navigate("/admin"); setUserMenuOpen(false); }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100"
                                style={{ color: "var(--color-text-primary)" }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = "color-mix(in srgb, var(--color-status-info) 8%, var(--color-background-subtle))";
                                  e.currentTarget.style.color = "var(--color-status-info)";
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = "transparent";
                                  e.currentTarget.style.color = "var(--color-text-primary)";
                                }}
                              >
                                <span
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                  style={{
                                    background: "color-mix(in srgb, var(--color-status-info) 10%, transparent)",
                                    color: "var(--color-status-info)",
                                  }}
                                >
                                  <Shield className="h-3.5 w-3.5" />
                                </span>
                                <span className="flex-1">{t.nav?.adminDashboard || "Admin Dashboard"}</span>
                                <span
                                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                                  style={{
                                    background: "color-mix(in srgb, var(--color-status-info) 12%, transparent)",
                                    color: "var(--color-status-info)",
                                  }}
                                >
                                  ADMIN
                                </span>
                              </button>
                            ) : null}
                          </div>

                          {/* Logout */}
                          <div className="mx-3.5 h-px" style={{ background: "var(--color-border-subtle)" }} />
                          <div className="p-1.5 pb-2">
                            <button
                              onClick={async () => { await signOut(); setUserMenuOpen(false); }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100"
                              style={{ color: "var(--color-text-secondary)" }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = "color-mix(in srgb, var(--color-status-error) 8%, transparent)";
                                e.currentTarget.style.color = "var(--color-status-error)";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "var(--color-text-secondary)";
                              }}
                            >
                              <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                style={{
                                  background: "color-mix(in srgb, var(--color-status-error) 10%, transparent)",
                                  color: "var(--color-status-error)",
                                }}
                              >
                                <LogOut className="h-3.5 w-3.5" />
                              </span>
                              {t.nav?.logout || "Sign out"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1 ps-1">
                    <button
                      onClick={() => navigate("/login")}
                      className="flex h-10 min-w-[108px] items-center justify-center whitespace-nowrap rounded-[0.95rem] px-3 text-sm font-semibold transition-all"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {t.nav?.login || "Sign in"}
                    </button>
                    <button
                      onClick={() => navigate("/signup")}
                      className="flex h-10 min-w-[128px] items-center justify-center whitespace-nowrap rounded-[0.95rem] px-4 text-sm font-semibold text-white shadow-[0_18px_38px_-24px_rgba(109,40,217,0.8)] transition-transform hover:-translate-y-0.5"
                      style={{ background: "var(--workspace-primary)" }}
                    >
                      {t.nav?.signup || "Get started"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            aria-label={t.common?.closeMenu || "Close navigation menu"}
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            className={`absolute inset-y-0 w-[88vw] max-w-sm ${
              dir === "rtl" ? "left-0 border-r" : "right-0 border-l"
            }`}
            style={{
              background: "var(--color-background-elevated)",
              borderColor: "var(--color-border-default)",
            }}
          >
            <div
              className="flex h-16 items-center justify-between border-b px-4"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              <button
                onClick={handleGoHome}
                className="flex items-center"
                aria-label={homeLabel}
              >
                <Logo variant="full" size="sm" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="header-icon-btn"
                aria-label={t.common?.closeMenu || "Close navigation menu"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-4">
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex h-11 w-full items-center gap-3 rounded-2xl border px-4 text-start text-sm"
                style={{
                  color: "var(--color-text-secondary)",
                  borderColor: "var(--color-border-default)",
                  background: "var(--color-background-subtle)",
                }}
              >
                <Search className="h-4 w-4" />
                <span>{t.common?.search || "Search"}</span>
              </button>

              {user ? (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: "var(--color-border-default)",
                    background: "var(--color-background-elevated)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={firstName}
                        className="h-11 w-11 rounded-full object-cover"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: "linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)" }}
                      >
                        {avatarInitials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {displayName}
                      </p>
                      <p
                        className="truncate text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <nav className="space-y-2">
                {canQuickSwitch ? (
                  <button
                    onClick={() => {
                      void handleQuickWorkspaceSwitch();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isSwitching}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                        isSwitching ? "cursor-not-allowed opacity-70" : ""
                      }`}
                      style={{
                        color: "var(--workspace-primary-hover)",
                        background: "var(--workspace-primary-light)",
                      }}
                  >
                    <Repeat2
                      className={`h-4 w-4 flex-shrink-0 ${isSwitching ? "animate-spin" : ""}`}
                    />
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
                        isActive ? "header-nav-link-active" : ""
                      }`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? {
                            color: "var(--workspace-primary)",
                            borderColor: "var(--workspace-primary)",
                          }
                        : { color: "var(--color-text-primary)" }
                    }
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="min-w-0 truncate">{label}</span>
                  </NavLink>
                ))}

                {user ? (
                  <>
                    <button
                      onClick={() => {
                        navigate("/dashboard");
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      <User className="h-4 w-4 flex-shrink-0" />
                      {t.nav?.dashboard || "Dashboard"}
                    </button>
                    <button
                      onClick={() => {
                        navigate("/messages");
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors relative"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      {t.nav?.messages || "Messages"}
                      {unreadCount > 0 ? (
                        <span
                          className="ms-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: "var(--workspace-primary)" }}
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      ) : null}
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      <Settings className="h-4 w-4 flex-shrink-0" />
                      {t.nav?.settings || "Settings"}
                    </button>
                    {canAccessAdmin ? (
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setMobileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        <Shield className="h-4 w-4 flex-shrink-0" />
                        {t.nav?.adminDashboard || "Admin Dashboard"}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </nav>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: "var(--color-border-default)" }}
              >
                <p
                  className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {t.settings?.language || "Language"}
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className="rounded-xl border px-3 py-2 text-center transition-colors"
                      style={
                        currentLang === lang.code
                          ? {
                              borderColor: "var(--workspace-primary-hover)",
                              background: "var(--workspace-primary-light)",
                              color: "var(--workspace-primary-hover)",
                            }
                          : {
                              borderColor: "var(--color-border-default)",
                              color: "var(--color-text-secondary)",
                            }
                      }
                    >
                      <div className="text-[11px] font-semibold">
                        {lang.country}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {lang.display}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium"
                  style={{
                    borderColor: "var(--color-border-default)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {isDark
                    ? t.common?.toggleLightMode || "Light"
                    : t.common?.toggleDarkMode || "Dark"}
                </button>

                {!user ? (
                  <button
                    onClick={() => {
                      navigate("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                    style={{ background: "var(--workspace-primary)" }}
                  >
                    {t.nav?.login || "Sign in"}
                  </button>
                ) : null}
              </div>

              {user ? (
                <button
                  onClick={async () => {
                    await signOut();
                    setMobileMenuOpen(false);
                    navigate("/login", { replace: true });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--color-status-error) 30%, transparent)",
                    color: "var(--color-status-error)",
                    background:
                      "color-mix(in srgb, var(--color-status-error) 8%, transparent)",
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t.nav?.logout || "Sign out"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate("/signup");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: "var(--color-border-default)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {t.nav?.signup || "Get started"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="h-16 md:h-16" />
      {searchOpen ? <SearchModal onClose={() => setSearchOpen(false)} /> : null}
    </>
  );
}
