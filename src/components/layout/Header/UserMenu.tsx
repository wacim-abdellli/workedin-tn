import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe2,
  Loader2,
  LogOut,
  Moon,
  Settings,
  Shield,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n";
import { useWorkspaceStore } from "@/lib/workspaceState";
import { switchWorkspace } from "@/lib/switchWorkspace";
import { resolveActiveWorkspace } from "@/lib/workspaceRoutes";
import { getInitials, resolveAccountAvatarUrl } from "@/lib/avatar";
import { hasAdminAccess } from "@/lib/adminAccess";
import { useToast } from "@/components/ui/Toast";
import { usePresence } from "@/hooks/usePresence";

interface UserMenuProps {
  isDesktopCondensed?: boolean;
  isDark: boolean;
  toggleTheme: () => void;
}

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English", display: "EN" },
  { code: "fr", label: "Francais", display: "FR" },
  { code: "ar", label: "Arabic", display: "AR" },
] as const;

export function UserMenu({ isDark, toggleTheme }: UserMenuProps) {
  const { user, profile, freelancerProfile, signOut, updateProfile } = useAuth();
  const { activeWorkspace, isSwitching } = useWorkspaceStore();
  const { t, tx, language, setLanguage } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isOnlineForMessages = profile?.is_online_for_messages !== false;

  const getMenuFocusables = () => {
    const focusables = menuRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    return focusables ? Array.from(focusables).filter((item) => item.offsetParent !== null) : [];
  };

  const focusMenuItem = (target: "first" | "last") => {
    const items = getMenuFocusables();
    if (items.length === 0) return;
    (target === "first" ? items[0] : items[items.length - 1]).focus();
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!userMenuOpen) return;

      if (event.key === "Escape") {
        setUserMenuOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const arr = getMenuFocusables();
        if (arr.length === 0) return;
        const focused = document.activeElement;
        const idx = arr.indexOf(focused as HTMLElement);
        if (event.key === "ArrowDown") {
          const next = idx < arr.length - 1 ? arr[idx + 1] : arr[0];
          next.focus();
        } else {
          const prev = idx > 0 ? arr[idx - 1] : arr[arr.length - 1];
          prev.focus();
        }
        return;
      }

      if (event.key === "Tab") {
        const arr = getMenuFocusables();
        if (arr.length === 0) return;
        const first = arr[0];
        const last = arr[arr.length - 1];
        const focused = document.activeElement as HTMLElement | null;
        if (event.shiftKey && focused === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && focused === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [userMenuOpen]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profile?.avatar_url]);

  usePresence({ userId: user?.id, isOnlineForMessages });

  if (!user) return null;

  const resolvedWorkspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);
  const isFreelancer = resolvedWorkspace === "freelancer";
  const targetWorkspace = isFreelancer ? "client" : "freelancer";
  const firstName = profile?.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Me";
  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Me";
  const avatarUrl = resolveAccountAvatarUrl(profile?.avatar_url, avatarFailed);
  const avatarInitials = getInitials(displayName);
  const freelancerVerified = Boolean(profile?.cin_verified || freelancerProfile?.cin_verified);
  const freelancerPending = false;
  const canAccessAdmin = hasAdminAccess(user, profile);
  const workspaceLabel = isFreelancer
    ? t.auth?.accountPanel?.freelancerLabel || "Freelancer"
    : t.auth?.accountPanel?.clientLabel || "Client";
  const switchTargetLabel =
    targetWorkspace === "freelancer"
      ? t.auth?.accountPanel?.freelancerLabel || "Freelancer"
      : t.auth?.accountPanel?.clientLabel || "Client";
  const switchActionLabel = t.auth?.accountPanel?.switchAction || "Switch";
  const switchButtonLabel = `${switchActionLabel}: ${switchTargetLabel}`;
  const workspaceBadgeClass = isFreelancer
    ? "border-purple-500/25 text-purple-400 bg-purple-500/[0.07]"
    : "border-amber-500/25 text-amber-400 bg-amber-500/[0.07]";
  const onlineDotClass = "bg-green-500"; // Semantic green for online status
  
  const menuItemClass = `w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
    isDark
      ? "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
      : "text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.03]"
  }`;
  
  const menuIconClass = `w-4 h-4 shrink-0 transition-colors duration-150 ${
    isDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-400 group-hover:text-zinc-600"
  }`;
  
  const divider = (
    <div 
      className={`mx-3 my-1 border-t ${
        isDark ? 'border-white/[0.06]' : 'border-zinc-200/50'
      }`} 
    />
  );

  // Semantic colors for toggles: green for online status, workspace colors for dark mode
  const toggleTrackClass = (enabled: boolean, isOnlineToggle: boolean = false) => {
    if (isOnlineToggle) {
      // Online toggle: green when enabled, gray when disabled
      return `relative ml-auto shrink-0 h-5 w-8 rounded-full transition-colors duration-200 ${
        enabled ? "bg-green-500" : (isDark ? "bg-white/[0.14]" : "bg-zinc-200")
      }`;
    } else {
      // Dark mode toggle: workspace colors when enabled
      return `relative ml-auto shrink-0 h-5 w-8 rounded-full transition-colors duration-200 ${
        enabled ? (isFreelancer ? "bg-purple-500" : "bg-amber-500") : (isDark ? "bg-white/[0.14]" : "bg-zinc-200")
      }`;
    }
  };
  const toggleThumbClass = (enabled: boolean) =>
    `absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
      enabled ? "translate-x-3" : "translate-x-0"
    }`;

  const handleToggleOnline = async () => {
    if (isTogglingOnline) return;
    setIsTogglingOnline(true);
    try {
      await updateProfile({ is_online_for_messages: !isOnlineForMessages });
    } catch {
      showToast("Could not update online status.", "error");
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const handleQuickWorkspaceSwitch = async () => {
    if (isSwitching) return;
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
      showToast(t.auth?.accountPanel?.switchError || "We could not switch your workspace right now.", "error");
    }
  };

  const workspaceRingClass = isFreelancer ? "ring-purple-500/25" : "ring-amber-500/25";

  return (
    <div className="relative" ref={userMenuRef}>
      <button
        ref={triggerRef}
        onClick={() => {
          setUserMenuOpen((open) => {
            const next = !open;
            if (next) {
              setTimeout(() => focusMenuItem("first"), 10);
            }
            return next;
          });
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!userMenuOpen) {
              setUserMenuOpen(true);
              setTimeout(() => focusMenuItem(event.key === "ArrowDown" ? "first" : "last"), 10);
              return;
            }
            focusMenuItem(event.key === "ArrowDown" ? "first" : "last");
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setUserMenuOpen((open) => !open);
          }
        }}
        className="group flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0c0c0e] hover:bg-gray-50 dark:hover:bg-[#141414] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-200 shadow-sm"
        aria-expanded={userMenuOpen}
        aria-haspopup="menu"
      >
        <div className="relative shrink-0 flex items-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className={`w-8 h-8 rounded-full object-cover ring-2 ${workspaceRingClass}`}
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div 
              className={`flex w-8 h-8 items-center justify-center rounded-full text-[10px] font-bold ring-2 ${workspaceRingClass}`}
              style={{
                color: isDark ? '#ffffff' : 'var(--color-text-primary)',
                background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'var(--color-bg-muted)',
              }}
            >
              {avatarInitials}
            </div>
          )}
        </div>
        <div className="flex flex-col items-start leading-none pr-0.5">
          <span 
            className="text-[12.5px] font-bold tracking-tight text-gray-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white"
          >
            {firstName}
          </span>
          <span 
            className={`text-[9.5px] font-bold uppercase tracking-wider mt-0.5 ${
              isFreelancer 
                ? 'text-purple-600 dark:text-purple-400' 
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {workspaceLabel}
          </span>
        </div>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-zinc-100 transition-transform duration-200 ${
            userMenuOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      <AnimatePresence>
        {userMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute end-0 top-full z-[70] mt-2.5 w-64 rounded-2xl p-1.5"
            style={{
              transformOrigin: "top right",
              background: isDark 
                ? 'rgba(12, 12, 14, 0.85)'
                : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isDark 
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: isDark 
                ? '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.02)'
                : '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            }}
            role="menu"
            ref={menuRef}
          >
            <div className="px-3.5 py-3 flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover ring-2"
                  style={{ 
                    ringColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--color-border-default)' 
                  }}
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div 
                  className="flex w-10 h-10 items-center justify-center rounded-full text-sm font-bold ring-2"
                  style={{
                    color: isDark ? '#ffffff' : 'var(--color-text-primary)',
                    ringColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--color-border-default)',
                    background: isDark ? 'rgba(255, 255, 255, 0.10)' : 'var(--color-bg-muted)',
                  }}
                >
                  {avatarInitials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p 
                  className="truncate text-sm font-semibold"
                  style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'var(--color-text-primary)' }}
                >
                  {displayName}
                </p>
                <p 
                  className="truncate text-xs text-zinc-400 dark:text-zinc-500"
                >
                  {user.email}
                </p>
                <span
                  className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${workspaceBadgeClass}`}
                >
                  {workspaceLabel}
                </span>
              </div>
            </div>

            {divider}

            <button
              onClick={() => void handleQuickWorkspaceSwitch()}
              disabled={isSwitching}
              className={`group ${menuItemClass} justify-between text-left disabled:cursor-not-allowed disabled:opacity-60`}
              title={switchButtonLabel}
              role="menuitem"
            >
              <div className="flex items-center gap-3">
                <ArrowLeftRight 
                  className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isSwitching ? "animate-spin" : ""} ${
                    isDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-400 group-hover:text-zinc-600"
                  }`}
                />
                <div>
                  <p 
                    className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500"
                  >
                    {tx('auth.accountPanel.switchWorkspace', undefined, 'Switch workspace')}
                  </p>
                  <p 
                    className={`text-sm font-semibold transition-colors duration-150 ${
                      isDark ? "text-zinc-300 group-hover:text-zinc-50" : "text-zinc-700 group-hover:text-zinc-900"
                    }`}
                  >
                    {tx('auth.accountPanel.goToWorkspace', { workspace: switchTargetLabel }, `Go to ${switchTargetLabel}`)}
                  </p>
                </div>
              </div>
              <ChevronRight 
                className={`w-4 h-4 transition-colors duration-150 ${
                  isDark ? "text-zinc-600 group-hover:text-zinc-400" : "text-zinc-400 group-hover:text-zinc-600"
                }`}
              />
            </button>

            {divider}

            <button
              type="button"
              role="switch"
              aria-checked={isOnlineForMessages}
              onClick={() => void handleToggleOnline()}
              disabled={isTogglingOnline}
              className={`group ${menuItemClass} justify-between disabled:opacity-60`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${isOnlineForMessages ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                <span>{tx('auth.accountPanel.onlineForMessages', undefined, 'Online for messages')}</span>
              </div>
              <span className={toggleTrackClass(isOnlineForMessages, true)}>
                <span className={toggleThumbClass(isOnlineForMessages)} />
              </span>
            </button>

            {[
              { icon: ExternalLink, label: t.nav?.profile || "My Profile", path: "/profile" },
              { icon: Settings, label: t.nav?.settings || "Settings", path: "/settings" },
            ].map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => {
                  navigate(path);
                  setUserMenuOpen(false);
                }}
                className={`group ${menuItemClass}`}
                role="menuitem"
              >
                <Icon className={menuIconClass} />
                <span>{label}</span>
              </button>
            ))}

            {freelancerVerified ? (
              <div 
                className={menuItemClass} 
                role="menuitem"
              >
                <Shield className={menuIconClass} />
                <span className="flex-1 text-left">{t.settings?.cinVerification || "ID Verified"}</span>
                <CheckCircle2 
                  className="w-4 h-4 text-green-500 shrink-0"
                />
              </div>
            ) : freelancerPending ? (
              <div 
                className={menuItemClass} 
                role="menuitem"
              >
                <Shield className={menuIconClass} />
                <span className="flex-1 text-left">{t.settings?.cinVerification || "Verify identity"}</span>
                <Loader2 
                  className="w-4 h-4 animate-spin text-zinc-400 shrink-0"
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate("/verify-identity");
                  setUserMenuOpen(false);
                }}
                className={`group ${menuItemClass}`}
                role="menuitem"
              >
                <Shield className={menuIconClass} />
                <span>{t.settings?.cinVerification || "Verify identity"}</span>
              </button>
            )}

            {canAccessAdmin && (
              <button
                onClick={() => {
                  navigate("/admin");
                  setUserMenuOpen(false);
                }}
                className={`group ${menuItemClass}`}
                role="menuitem"
              >
                <Shield className={menuIconClass} />
                <span>{t.nav?.adminDashboard || "Admin Dashboard"}</span>
                <span className={`ml-auto rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                  isFreelancer ? "border-purple-500/25 text-purple-400 bg-purple-500/[0.07]" : "border-amber-500/25 text-amber-400 bg-amber-500/[0.07]"
                }`}>
                  {tx("ui.admin")}
                </span>
              </button>
            )}

            {divider}

            <button
              type="button"
              onClick={toggleTheme}
              className={`group ${menuItemClass} justify-between`}
              aria-checked={isDark}
              role="switch"
              aria-label={tx('auth.accountPanel.darkTheme', undefined, 'Dark theme')}
            >
              <div className="flex items-center gap-3">
                <Moon className={menuIconClass} />
                <span>{tx('auth.accountPanel.darkTheme', undefined, 'Dark theme')}</span>
              </div>
              <span className={toggleTrackClass(isDark, false)}>
                <span className={toggleThumbClass(isDark)} />
              </span>
            </button>

            <div className={`flex items-center gap-3 px-3.5 py-2 text-sm font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              <Globe2 className={menuIconClass} />
              <span>{tx('auth.accountPanel.language', undefined, 'Language')}</span>
              <div
                className="ml-auto flex shrink-0 items-center rounded-full border border-zinc-200/50 dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-0.5"
                role="group"
                aria-label={tx('auth.accountPanel.language', undefined, 'Language')}
              >
                {LANGUAGE_OPTIONS.map((option) => {
                  const active = language === option.code;
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => setLanguage(option.code)}
                      className={`h-5 min-w-7 rounded-full px-1.5 text-[9px] font-bold transition-all duration-150 ${
                        active 
                          ? (isFreelancer 
                              ? "text-purple-400 bg-purple-500/[0.12] border border-purple-500/20" 
                              : "text-amber-400 bg-amber-500/[0.12] border border-amber-500/20") 
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
                      }`}
                      aria-label={option.label}
                    >
                      {option.display}
                    </button>
                  );
                })}
              </div>
            </div>

            {divider}

            <button
              onClick={async () => {
                await signOut();
                setUserMenuOpen(false);
              }}
              className="group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.06]"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 shrink-0 transition-colors duration-150 text-zinc-500 group-hover:text-red-400" />
              <span>{t.nav?.logout || "Sign out"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
