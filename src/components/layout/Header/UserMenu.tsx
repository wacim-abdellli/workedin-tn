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
    ? "border-purple-500/25 text-purple-400/70 bg-purple-500/[0.07]"
    : "border-amber-500/25 text-amber-400/70 bg-amber-500/[0.07]";
  const onlineDotClass = isFreelancer ? "bg-purple-400" : "bg-amber-400";
  const menuItemClass =
    "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/55 hover:text-white hover:bg-white/[0.05] transition-colors duration-100";
  const menuIconClass = "w-4 h-4 text-white/30 shrink-0";
  const divider = <div className="mx-3 border-t border-white/[0.06]" />;
  const toggleTrackClass = (enabled: boolean) =>
    `relative ml-auto shrink-0 h-[20px] w-[36px] rounded-full transition-colors duration-200 ${
      enabled ? (isFreelancer ? "bg-purple-500" : "bg-amber-500") : "bg-white/[0.14]"
    }`;
  const toggleThumbClass = (enabled: boolean) =>
    `absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
      enabled ? "translate-x-[18px]" : "translate-x-[2px]"
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
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-white/[0.06] transition-all duration-150"
        aria-expanded={userMenuOpen}
        aria-haspopup="menu"
      >
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover ring-2 ring-white/[0.08]"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="flex w-7 h-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white/[0.08] bg-white/[0.10]">
              {avatarInitials}
            </div>
          )}
          {isOnlineForMessages && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${onlineDotClass} ring-2 ring-[#0d0d0d]`}
              aria-hidden="true"
            />
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium text-white/80 leading-none">{firstName}</span>
          <span className="text-[10px] text-white/35 leading-none mt-0.5 capitalize">{workspaceLabel}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-white/30 ml-1" />
      </button>

      <AnimatePresence>
        {userMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute end-0 top-full z-[70] mt-2 w-64 rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl shadow-black/50 py-2 overflow-hidden"
            style={{ transformOrigin: "top right" }}
            role="menu"
            ref={menuRef}
          >
            <div className="px-4 py-3 flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/[0.08]"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div className="flex w-10 h-10 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white/[0.08] bg-white/[0.10]">
                  {avatarInitials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white/90">{displayName}</p>
                <p className="truncate text-xs text-white/40">{user.email}</p>
                <span
                  className={`inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${workspaceBadgeClass}`}
                >
                  {workspaceLabel}
                </span>
              </div>
            </div>

            {divider}

            <button
              onClick={() => void handleQuickWorkspaceSwitch()}
              disabled={isSwitching}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm group hover:bg-white/[0.05] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              title={switchButtonLabel}
              role="menuitem"
            >
              <div className="flex items-center gap-3">
                <ArrowLeftRight className={`w-4 h-4 text-white/30 group-hover:text-white/60 ${isSwitching ? "animate-spin" : ""}`} />
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                    Switch workspace
                  </p>
                  <p className="text-sm text-white/75 font-medium">Go to {switchTargetLabel}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/25" />
            </button>

            {divider}

            <button
              type="button"
              role="switch"
              aria-checked={isOnlineForMessages}
              onClick={() => void handleToggleOnline()}
              disabled={isTogglingOnline}
              className={`${menuItemClass} disabled:opacity-60`}
            >
              <span className={`w-4 h-4 rounded-full ${isOnlineForMessages ? onlineDotClass : "bg-white/20"}`} />
              Online for messages
              <span className={toggleTrackClass(isOnlineForMessages)}>
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
                className={menuItemClass}
                role="menuitem"
              >
                <Icon className={menuIconClass} />
                {label}
              </button>
            ))}

            {freelancerVerified ? (
              <div className={menuItemClass} role="menuitem">
                <Shield className={menuIconClass} />
                {t.settings?.cinVerification || "ID Verified"}
                <CheckCircle2 className="ml-auto w-4 h-4 text-white/30" />
              </div>
            ) : freelancerPending ? (
              <div className={menuItemClass} role="menuitem">
                <Shield className={menuIconClass} />
                {t.settings?.cinVerification || "Verify identity"}
                <Loader2 className="ml-auto w-4 h-4 animate-spin text-white/30" />
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate("/verify-identity");
                  setUserMenuOpen(false);
                }}
                className={menuItemClass}
                role="menuitem"
              >
                <Shield className={menuIconClass} />
                {t.settings?.cinVerification || "Verify identity"}
              </button>
            )}

            {canAccessAdmin && (
              <button
                onClick={() => {
                  navigate("/admin");
                  setUserMenuOpen(false);
                }}
                className={menuItemClass}
                role="menuitem"
              >
                <Shield className={menuIconClass} />
                {t.nav?.adminDashboard || "Admin Dashboard"}
                <span className="ml-auto rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/35">
                  {tx("ui.admin")}
                </span>
              </button>
            )}

            {divider}

            <button
              type="button"
              onClick={toggleTheme}
              className={menuItemClass}
              aria-checked={isDark}
              role="switch"
              aria-label="Dark theme"
            >
              <Moon className={menuIconClass} />
              Dark theme
              <span className={toggleTrackClass(isDark)}>
                <span className={toggleThumbClass(isDark)} />
              </span>
            </button>

            <div className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/55">
              <Globe2 className={menuIconClass} />
              Language
              <div
                className="ml-auto flex shrink-0 items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5"
                role="group"
                aria-label="Language"
              >
                {LANGUAGE_OPTIONS.map((option) => {
                  const active = language === option.code;
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => setLanguage(option.code)}
                      className={`h-5 min-w-7 rounded-full px-1.5 text-[9px] font-bold transition-colors ${
                        active ? (isFreelancer ? "text-purple-400 bg-purple-500/[0.12]" : "text-amber-400 bg-amber-500/[0.12]") : "text-white/35"
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
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/40 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-100"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              {t.nav?.logout || "Sign out"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
