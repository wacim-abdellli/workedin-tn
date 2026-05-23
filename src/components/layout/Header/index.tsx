import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bookmark,
  Briefcase,
  ChevronDown,
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
  const unreadDotClass = isFreelancer ? "bg-purple-400" : "bg-amber-400";

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
    navigate(user ? "/dashboard" : "/");
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
              <button onClick={() => setMobileMenuOpen(true)} className="header-icon-btn" aria-label={openMenuLabel}>
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <header
        dir={dir}
        className="desktop-header fixed top-0 left-0 right-0 z-[100] hidden xl:flex h-16 w-full items-center px-8 gap-8 border-b border-white/[0.07] bg-[#0d0d0d]"
      >
        <div className="flex-none flex items-center">
          <Link to={user ? "/dashboard" : "/"} aria-label={homeLabel} className="flex items-center">
            <Logo variant="full" size="sm" titleStyle="minimal" mode={resolvedWorkspace === "freelancer" ? "freelancer" : "client"} />
          </Link>
        </div>

        <div className="flex-none">
          <WorkspaceNav />
        </div>

        <HeaderSearch />

        <div className="flex-none flex items-center gap-1">
          {user && (
            <>
              <button
                onClick={() => navigate("/messages")}
                className="relative p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-150"
                aria-label={t.nav?.messages || "Messages"}
              >
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${unreadDotClass} ring-2 ring-[#0d0d0d]`} />
                )}
              </button>

              <NotificationBell workspace={resolvedWorkspace} />

              <div className="w-px h-5 bg-white/[0.08] mx-1" />

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

      <div className="h-16 md:h-16" />
      {searchOpen && (
        <Suspense fallback={null}>
          <SearchModal onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
