import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Bookmark,
  LogOut,
  Moon,
  Repeat2,
  Search,
  Settings,
  Shield,
  Sun,
  User,
  MessageSquare,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaceStore } from "@/lib/workspaceState";
import { Logo } from "@/components/ui/Logo";
import { switchWorkspace } from "@/lib/switchWorkspace";
import { getInitials, resolveAccountAvatarUrl } from "@/lib/avatar";
import { hasAdminAccess } from "@/lib/adminAccess";
import { useToast } from "@/components/ui/Toast";

interface NavItem {
  label: string;
  Icon: LucideIcon;
  href: string;
}

interface MobileHeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
  setSearchOpen: (val: boolean) => void;
  handleGoHome: () => void;
  navItems: NavItem[];
  unreadCount?: number;
  isDark: boolean;
  toggleTheme: () => void;
}

const LANGS = [
  { code: "ar", label: "العربية", display: "AR", country: "TN" },
  { code: "fr", label: "Francais", display: "FR", country: "FR" },
  { code: "en", label: "English", display: "EN", country: "GB" },
] as const;

export function MobileHeader({
  mobileMenuOpen,
  setMobileMenuOpen,
  setSearchOpen,
  handleGoHome,
  navItems,
  unreadCount = 0,
  isDark,
  toggleTheme,
}: MobileHeaderProps) {
  const { user, profile, freelancerProfile, signOut } = useAuth();
  const { activeWorkspace, isSwitching } = useWorkspaceStore();
  const { t, language, setLanguage, dir } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  if (!mobileMenuOpen) return null;

  const currentLang = language || "en";
  const firstName = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Me";
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Me";
  const avatarUrl = resolveAccountAvatarUrl(profile?.avatar_url, false);
  const avatarInitials = getInitials(displayName);
  const targetWorkspace = activeWorkspace === "freelancer" ? "client" : "freelancer";
  const canQuickSwitch = Boolean(user);
  const switchTargetLabel =
    targetWorkspace === "freelancer"
      ? t.auth?.accountPanel?.freelancerLabel || "Freelancer"
      : t.auth?.accountPanel?.clientLabel || "Client";
  const switchActionLabel = t.auth?.accountPanel?.switchAction || "Switch";
  const switchButtonLabel = `${switchActionLabel}: ${switchTargetLabel}`;
  const canAccessAdmin = hasAdminAccess(user, profile);

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
      showToast(t.auth?.accountPanel?.switchError || "Failed to switch workspace.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        aria-label={t.common?.closeMenu || "Close navigation menu"}
        className="absolute inset-0 bg-[var(--color-foreground)]/60 backdrop-blur-sm"
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`absolute inset-y-0 w-[88vw] max-w-sm overflow-y-auto ${
          dir === "rtl" ? "left-0 border-r" : "right-0 border-l"
        }`}
        style={{
          background: "var(--color-background-elevated)",
          borderColor: "var(--color-border-default)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={t.common?.closeMenu || "Navigation menu"}
      >
        <div
          className="flex h-16 items-center justify-between border-b px-4"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <button
            onClick={() => {
              handleGoHome();
              setMobileMenuOpen(false);
            }}
            className="flex items-center"
          >
            <Logo variant="full" size="sm" titleStyle="minimal" mode={activeWorkspace === 'freelancer' ? 'freelancer' : 'client'} />
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
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {displayName}
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
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
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                  isSwitching ? "cursor-not-allowed opacity-70" : "hover:border-[color-mix(in_srgb,var(--workspace-primary)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--workspace-primary)_8%,transparent)]"
                }`}
                style={{
                  color: "var(--color-text-secondary)",
                  borderColor: "var(--color-border-default)",
                  background: "color-mix(in srgb, var(--color-text-primary) 4%, transparent)",
                }}
              >
                <Repeat2 className={`h-4 w-4 flex-shrink-0 ${isSwitching ? "animate-spin" : ""}`} />
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
                  onClick={() => { navigate("/saved"); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <Bookmark className="h-4 w-4 flex-shrink-0" />
                  {t.nav?.saved || "Saved"}
                </button>
                <button
                  onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  {t.nav?.profile || "Profile"}
                </button>
                <button
                  onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  {t.nav?.dashboard || "Dashboard"}
                </button>
                <button
                  onClick={() => { navigate("/messages"); setMobileMenuOpen(false); }}
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
                  onClick={() => { navigate("/settings"); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  {t.nav?.settings || "Settings"}
                </button>
                {canAccessAdmin ? (
                  <button
                    onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
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
                  <div className="text-[11px] font-semibold">{lang.country}</div>
                  <div className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
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
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? t.common?.toggleLightMode || "Light" : t.common?.toggleDarkMode || "Dark"}
            </button>

            {!user ? (
              <button
                onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
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
                borderColor: "color-mix(in srgb, var(--color-status-error) 30%, transparent)",
                color: "var(--color-status-error)",
                background: "color-mix(in srgb, var(--color-status-error) 8%, transparent)",
              }}
            >
              <LogOut className="h-4 w-4" />
              {t.nav?.logout || "Sign out"}
            </button>
          ) : (
            <button
              onClick={() => { navigate("/signup"); setMobileMenuOpen(false); }}
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
  );
}
