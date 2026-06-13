import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bookmark,
  Briefcase,
  FileText,
  FolderOpen,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  Send,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n";
import { useWorkspaceStore } from "@/lib/workspaceState";
import { resolveActiveWorkspace } from "@/lib/workspaceRoutes";
import { Logo, NotificationBell } from "@/components/ui";
import ComingSoonBanner from "@/components/common/ComingSoonBanner";
import {
  getTotalUnreadCount,
  subscribeToConversations,
  subscribeToIncomingMessages,
  type ConversationScope,
} from "@/services/messages";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { AuthHeader } from "./AuthHeader";
import { MobileHeader } from "./MobileHeader";
import { UserMenu } from "./UserMenu";
import { WorkspaceNav } from "./DesktopNav";
import { HeaderSearch } from "./HeaderSearch";

const SearchModal = lazy(() => import("./SearchModal"));

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

export default function Header() {
  const { user, profile, freelancerProfile } = useAuth();
  const { activeWorkspace } = useWorkspaceStore();
  const resolvedWorkspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);
  const { t, dir, tx } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const incomingMessagesChannelRef = useRef<RealtimeChannel | null>(null);

  const isFreelancer = Boolean(user) && resolvedWorkspace === "freelancer";
  const isAuthPage = AUTH_ROUTES.includes(pathname);
  const _unreadDotClass = isFreelancer ? "bg-purple-400" : "bg-amber-400";

  const mobileFreelancerNav = [
    { label: t.nav?.findWork || "Find Work", Icon: Briefcase, href: "/jobs" },
    { label: t.nav?.proposals || "Proposals", Icon: Send, href: "/my-proposals" },
    { label: t.nav?.contracts || "Contracts", Icon: FileText, href: "/contracts" },
    { label: t.nav?.wallet || "Wallet", Icon: Wallet, href: "/wallet" },
    { label: t.nav?.saved || "Saved", Icon: Bookmark, href: "/jobs?sort=saved" },
  ];

  const mobileClientNav = [
    { label: t.nav?.postProject || "Post Project", Icon: PlusCircle, href: "/jobs/new" },
    { label: t.nav?.myProjects || "My Projects", Icon: FolderOpen, href: "/client/jobs" },
    { label: t.nav?.findFreelancers || "Find Freelancers", Icon: Users, href: "/find-freelancers" },
    { label: t.nav?.contracts || "Contracts", Icon: FileText, href: "/contracts" },
    { label: t.nav?.wallet || "Wallet", Icon: Wallet, href: "/wallet" },
  ];

  const publicNav = [
    { label: t.nav?.findWork || "Find Work", Icon: Briefcase, href: "/jobs" },
    { label: t.nav?.howItWorks || "How It Works", Icon: FileText, href: "/how-it-works" },
  ];

  const navItems = !user ? publicNav : isFreelancer ? mobileFreelancerNav : mobileClientNav;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        if (window.innerWidth >= 1280) {
          const input = document.querySelector('.header-search-input') as HTMLInputElement | null;
          if (input) {
            input.focus();
            input.select();
          }
        } else {
          setSearchOpen(true);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    const unreadScopes: ConversationScope[] = resolvedWorkspace === "freelancer"
      ? ["freelancer", "contract", "shared"]
      : ["client", "contract", "shared"];

    setUnreadCount(0);

    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const loadUnreadCount = async () => {
      const { count } = await getTotalUnreadCount(user.id, unreadScopes);
      if (!cancelled) setUnreadCount(count);
    };

    const scheduleUnreadRefresh = (delayMs: number = 80) => {
      if (cancelled) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void loadUnreadCount();
      }, delayMs);
    };

    if (conversationsChannelRef.current) {
      conversationsChannelRef.current.unsubscribe();
      conversationsChannelRef.current = null;
    }

    if (incomingMessagesChannelRef.current) {
      incomingMessagesChannelRef.current.unsubscribe();
      incomingMessagesChannelRef.current = null;
    }

    const timer = setTimeout(() => {
      void loadUnreadCount();
    }, 100);

    conversationsChannelRef.current = subscribeToConversations(user.id, unreadScopes, () => {
      scheduleUnreadRefresh();
    });

    incomingMessagesChannelRef.current = subscribeToIncomingMessages(user.id, () => {
      setUnreadCount((prev) => prev + 1);
      scheduleUnreadRefresh(280);
    });

    const handleUnreadSeen = (event: Event) => {
      const customEvent = event as CustomEvent<{ count?: number } | undefined>;
      const seenCount = typeof customEvent.detail?.count === "number"
        ? Math.max(0, Math.floor(customEvent.detail.count))
        : 0;

      if (seenCount > 0) {
        setUnreadCount((prev) => Math.max(0, prev - seenCount));
      }

      scheduleUnreadRefresh(220);
    };

    window.addEventListener("messages:unread-seen", handleUnreadSeen as EventListener);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener("messages:unread-seen", handleUnreadSeen as EventListener);
      if (conversationsChannelRef.current) conversationsChannelRef.current.unsubscribe();
      if (incomingMessagesChannelRef.current) incomingMessagesChannelRef.current.unsubscribe();
    };
  }, [user?.id, resolvedWorkspace]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleGoHome = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isAuthPage) {
    return <AuthHeader onHome={handleGoHome} dir={dir as "rtl" | "ltr"} />;
  }

  const openSearchLabel = tx("header.a11y.openSearch", undefined, "Open search");
  const openMenuLabel = tx("header.a11y.openMenu", undefined, "Open navigation menu");
  const homeLabel = tx("header.a11y.goHome", undefined, "Go to homepage");

  return (
    <>
      <header
        dir={dir}
        className="fixed top-0 left-0 right-0 z-[100] border-b border-white/[0.06] transition-all duration-300 xl:hidden"
        style={{
          zIndex: 100,
          background: isDark
            ? "color-mix(in srgb, #0a0a0f 85%, transparent)"
            : "color-mix(in srgb, var(--color-background-elevated) 88%, transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: isDark
            ? "0 1px 0 0 color-mix(in srgb, var(--workspace-primary) 15%, transparent), 0 4px 24px -4px rgba(0,0,0,0.4)"
            : "0 1px 0 0 color-mix(in srgb, var(--workspace-primary) 10%, transparent), 0 4px 16px -4px rgba(0,0,0,0.08)",
        }}
      >
        <ComingSoonBanner />
        <div className="mx-auto max-w-[1536px] px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between xl:hidden">
            <button onClick={handleGoHome} className="flex items-center" aria-label={homeLabel}>
              <Logo variant="full" size="sm" titleStyle="minimal" mode={resolvedWorkspace === "freelancer" ? "freelancer" : "client"} />
            </button>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setSearchOpen(true)} className="header-icon-btn" aria-label={openSearchLabel}>
                <Search className="h-4 w-4" />
              </button>
              {user && (
                <NotificationBell workspace={resolvedWorkspace} isDark={isDark} variant="icon" />
              )}
              <button onClick={() => setMobileMenuOpen(true)} className="header-icon-btn" aria-label={openMenuLabel}>
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Sub-Navigation Strip */}
        {navItems && navItems.length > 0 && (
          <div className="border-t border-white/[0.05] dark:border-white/[0.04] py-1 bg-black/5 dark:bg-white/[0.01]">
            <div className="mx-auto max-w-[1536px] px-4 sm:px-6">
              <div className="flex h-9 items-center overflow-x-auto no-scrollbar">
                <nav className="flex items-center gap-2 min-w-max">
                  {navItems.map((item) => {
                    const Icon = item.Icon;
                    return (
                      <NavLink
                        key={item.label}
                        to={item.href}
                        className={({ isActive }) =>
                          `flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                            isActive
                              ? "text-[var(--workspace-primary)] bg-[color-mix(in srgb,var(--workspace-primary)_12%,transparent)]"
                              : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.04]"
                          }`
                        }
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </header>

      <header
        dir={dir}
        className="desktop-header fixed top-0 left-0 right-0 z-[100] hidden xl:flex h-16 w-full items-center px-8 gap-8 border-b transition-all duration-300"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
          background: isDark
            ? 'rgba(9,9,11,0.92)'
            : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex-none flex items-center">
          <Link to="/" aria-label={homeLabel} className="flex items-center">
            <Logo variant="full" size="sm" titleStyle="minimal" mode={resolvedWorkspace === "freelancer" ? "freelancer" : "client"} />
          </Link>
        </div>

        <div className="flex-none">
          <WorkspaceNav />
        </div>

        <HeaderSearch />

        <div className="flex-none flex items-center gap-1.5">
          {user && (
            <>
              {/* Action button group: messages + notifications */}
              <div className="flex items-center gap-0.5 rounded-full p-1" style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
              }}>

                {/* Messages */}
                <button
                  onClick={() => navigate("/messages")}
                  className="group relative flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 active:scale-90"
                  style={{
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.background = isDark
                      ? 'color-mix(in srgb, var(--workspace-primary) 14%, transparent)'
                      : 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)';
                    el.style.color = 'var(--workspace-primary)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.background = 'transparent';
                    el.style.color = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
                  }}
                  aria-label={t.nav?.messages || "Messages"}
                >
                  <MessageSquare className="w-[17px] h-[17px] transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-4 rounded-full text-[9px] font-black leading-none"
                      style={{
                        background: 'var(--workspace-primary)',
                        color: '#fff',
                        padding: unreadCount > 9 ? '0 4px' : '0',
                        boxShadow: '0 0 0 2px ' + (isDark ? 'rgba(9,9,11,0.92)' : 'rgba(255,255,255,0.9)'),
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications */}
                <NotificationBell workspace={resolvedWorkspace} isDark={isDark} />
              </div>

              {/* Vertical divider */}
              <div className="w-px h-5 mx-1" style={{
                background: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.10)',
              }} />

              {/* User Profile */}
              <UserMenu isDark={isDark} toggleTheme={toggleTheme} isDesktopCondensed={true} />
            </>
          )}
        </div>
      </header>

      <MobileHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setSearchOpen={setSearchOpen}
        handleGoHome={handleGoHome}
        navItems={navItems}
        unreadCount={unreadCount}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      <div className={navItems && navItems.length > 0 ? "h-[104px] xl:h-16" : "h-16"} />
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {searchOpen && (
        <Suspense fallback={null}>
          <SearchModal onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
