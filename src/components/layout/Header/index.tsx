import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  ClipboardList,
  FileText,
  FolderOpen,
  Menu,
  PlusCircle,
  Search,
  Users,
  Wallet,
  Moon,
  Sun,
  MessageSquare
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n";
import { useWorkspaceStore } from "@/lib/workspaceState";
import { NotificationBell, Logo } from "@/components/ui";
import ComingSoonBanner from "@/components/common/ComingSoonBanner";
import { getTotalUnreadCount, subscribeToConversations, type ConversationScope } from "@/services/messages";
import type { RealtimeChannel } from "@supabase/supabase-js";

import SearchModal from "./SearchModal";
import { AuthHeader } from "./AuthHeader";
import { UserMenu } from "./UserMenu";
import { DesktopNav } from "./DesktopNav";
import type { NavItem } from "./DesktopNav";
import { LanguageMenu } from "./LanguageMenu";
import { MobileHeader } from "./MobileHeader";

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

/**
 * Application header with responsive navigation, search, and workspace-aware actions.
 */
export default function Header() {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspaceStore();
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

  const isFreelancer = Boolean(user) && activeWorkspace === "freelancer";
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  /** Primary routes shown in freelancer workspace. */
  const FREELANCER_NAV: NavItem[] = [
    { label: t.nav?.findWork || "Find Work", Icon: Briefcase, href: "/jobs" },
    { label: t.nav?.proposals || "Proposals", Icon: FileText, href: "/my-proposals" },
    { label: t.nav?.contracts || "Contracts", Icon: ClipboardList, href: "/contracts" },
    { label: t.nav?.wallet || "Wallet", Icon: Wallet, href: "/wallet" },
  ];

  /** Primary routes shown in client workspace. */
  const CLIENT_NAV: NavItem[] = [
    { label: t.nav?.postProject || "Post Project", Icon: PlusCircle, href: "/jobs/new" },
    { label: t.nav?.myProjects || "My Projects", Icon: FolderOpen, href: "/client/jobs" },
    { label: t.nav?.findFreelancers || "Find Freelancers", Icon: Users, href: "/find-freelancers" },
    { label: t.nav?.contracts || "Contracts", Icon: ClipboardList, href: "/contracts" },
  ];

  /** Routes shown to signed-out visitors. */
  const PUBLIC_NAV: NavItem[] = [
    { label: t.nav?.findWork || "Find Work", Icon: Briefcase, href: "/jobs" },
    { label: t.nav?.findFreelancers || "Find Freelancers", Icon: Users, href: "/find-freelancers" },
    { label: t.nav?.howItWorks || "How It Works", Icon: FileText, href: "/how-it-works" },
  ];

  const navItems = !user ? PUBLIC_NAV : isFreelancer ? FREELANCER_NAV : CLIENT_NAV;

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
  }, [pathname]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileMenuOpen, searchOpen]);

  useEffect(() => {
    if (!user) return;
    const unreadScopes: ConversationScope[] = activeWorkspace === 'freelancer'
      ? ['freelancer', 'contract', 'shared']
      : ['client', 'contract', 'shared'];

    const loadUnreadCount = async () => {
      const { count } = await getTotalUnreadCount(user.id, unreadScopes);
      setUnreadCount(count);
    };
    loadUnreadCount();
    conversationsChannelRef.current = subscribeToConversations(user.id, unreadScopes, () => {
      loadUnreadCount();
    });
    return () => {
      if (conversationsChannelRef.current) conversationsChannelRef.current.unsubscribe();
    };
  }, [user?.id, activeWorkspace]);

  /** Toggle color theme and keep it persisted across visits. */
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  /** Navigate to homepage and restore scroll context. */
  const handleGoHome = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          borderBottom: `1px solid color-mix(in srgb, var(--workspace-primary) 20%, color-mix(in srgb, var(--color-border-default) 40%, transparent))`,
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
          <div className="flex h-16 items-center justify-between lg:hidden">
            <button onClick={handleGoHome} className="flex items-center" aria-label={homeLabel}>
              <Logo variant="full" size="sm" titleStyle="minimal" mode={activeWorkspace === 'freelancer' ? 'freelancer' : 'client'} />
            </button>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setSearchOpen(true)} className="header-icon-btn" aria-label={openSearchLabel}>
                <Search className="h-4 w-4" />
              </button>
              <button onClick={() => setMobileMenuOpen(true)} className="header-icon-btn" aria-label={openMenuLabel}>
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="hidden h-16 items-center gap-4 2xl:gap-6 lg:flex">
            <div className="flex shrink-0 items-center">
              <button onClick={handleGoHome} className="flex items-center transition-all hover:opacity-80" aria-label={homeLabel}>
                <Logo variant="full" size="sm" titleStyle="minimal" mode={activeWorkspace === 'freelancer' ? 'freelancer' : 'client'} />
              </button>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 2xl:gap-8">
              <div className="flex items-center gap-0.5 2xl:gap-2 whitespace-nowrap">
                <DesktopNav navItems={navItems} overflowNavItems={[]} />
              </div>

              <div className="flex min-w-0 flex-1 shrink items-center justify-end gap-2 2xl:gap-4 ps-2 lg:ps-4">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex h-10 min-w-9 max-w-[320px] w-full shrink items-center justify-center lg:justify-start gap-2 rounded-2xl px-2 lg:px-3 text-sm font-medium transition-all duration-300"
                  style={{
                    color: "var(--color-text-secondary)",
                    background: "color-mix(in srgb, var(--color-text-primary) 4%, transparent)",
                  }}
                  aria-label={openSearchLabel}
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate text-xs flex-1 text-start hidden lg:block">{t.common?.search || "Search"}...</span>
                  <div className="hidden items-center gap-1 xl:flex shrink-0">
                    <kbd className="header-kbd">{tx('ui.ctrl_k')}</kbd>
                  </div>
                </button>

                <div
                  className="flex shrink-0 items-center rounded-2xl p-1 shadow-sm"
                  style={{
                    border: "1px solid color-mix(in srgb, var(--color-border-default) 50%, transparent)",
                    background: isDark
                      ? "color-mix(in srgb, var(--color-background-elevated) 60%, transparent)"
                      : "color-mix(in srgb, var(--color-background-elevated) 80%, transparent)",
                  }}
                >
                  <LanguageMenu />

                  <div className="mx-0.5 h-4 w-[1px]" style={{ background: "color-mix(in srgb, var(--color-border-default) 75%, transparent)" }} />

                  <button
                    onClick={toggleTheme}
                    className="flex h-7 w-7 items-center justify-center rounded-xl transition-all"
                    aria-label={isDark ? "Toggle light mode" : "Toggle dark mode"}
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  </button>

                  {user && (
                    <>
                      <div className="mx-0.5 h-4 w-[1px]" style={{ background: "color-mix(in srgb, var(--color-border-default) 75%, transparent)" }} />
                      <button
                        onClick={() => navigate("/messages")}
                        className="relative flex h-7 w-7 items-center justify-center rounded-xl transition-all"
                        aria-label={t.nav?.messages || "Messages"}
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {unreadCount > 0 && (
                          <span
                            className="absolute -right-0.5 -top-0.5 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm ring-2"
                            style={{ background: "var(--workspace-accent)", boxShadow: "0 0 0 2px var(--color-background-elevated)" }}
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </button>

                      <div className="mx-0.5 h-4 w-[1px]" style={{ background: "color-mix(in srgb, var(--color-border-default) 75%, transparent)" }} />
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl transition-all">
                        <NotificationBell />
                      </div>
                    </>
                  )}
                </div>

                {user ? (
                  <UserMenu />
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

      <div className="h-16 md:h-16" />
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
