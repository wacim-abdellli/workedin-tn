import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  ChevronDown,
  ExternalLink,
  LogOut,
  Repeat2,
  Settings,
  Shield,
  CheckCircle2,
  Loader2,
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
}

export function UserMenu({ isDesktopCondensed = false }: UserMenuProps) {
  const { user, profile, freelancerProfile, signOut, updateProfile } = useAuth();
  const { activeWorkspace, isSwitching } = useWorkspaceStore();
  const { t, tx } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusMenuItem = (target: "first" | "last") => {
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!items || items.length === 0) return;
    const arr = Array.from(items);
    (target === "first" ? arr[0] : arr[arr.length - 1]).focus();
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
        const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        if (!items || items.length === 0) return;

        const focused = document.activeElement;
        const arr = Array.from(items);
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
        const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        if (!items || items.length === 0) return;
        const arr = Array.from(items);
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

  const switchTargetLabel =
    targetWorkspace === "freelancer"
      ? t.auth?.accountPanel?.freelancerLabel || "Freelancer"
      : t.auth?.accountPanel?.clientLabel || "Client";
  const switchActionLabel = t.auth?.accountPanel?.switchAction || "Switch";
  const switchButtonLabel = `${switchActionLabel}: ${switchTargetLabel}`;

  // Derive the online-for-messages value from profile; default to true
  const isOnlineForMessages = profile?.is_online_for_messages !== false;

  // Boot this user's presence broadcast so others can see the green dot
  usePresence({ userId: user?.id, isOnlineForMessages });

  const handleToggleOnline = async () => {
    if (isTogglingOnline) return;
    setIsTogglingOnline(true);
    try {
      await updateProfile({ is_online_for_messages: !isOnlineForMessages });
    } catch {
      showToast('Could not update online status.', 'error');
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const triggerWorkspaceBadge = {
    label: isFreelancer
      ? t.auth?.accountPanel?.freelancerLabel || "Freelancer"
      : t.auth?.accountPanel?.clientLabel || "Client",
    background: "var(--workspace-primary-light)",
    color: "var(--workspace-primary-hover)",
    dotClassName: "bg-[var(--color-status-success)] animate-pulse",
    border: "color-mix(in srgb, var(--workspace-primary) 35%, transparent)",
  };

  // Neutral chrome so the header does not show two competing workspace colors at once.
  const switchTargetStyles = {
    color: "var(--color-text-secondary)",
    background: "color-mix(in srgb, var(--color-text-primary) 4%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-border-default) 85%, transparent)",
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
    <div
      className="flex items-center gap-2.5 ps-1.5 ms-1 border-s"
      style={{
        borderColor: "color-mix(in srgb, var(--color-border-default) 75%, transparent)",
      }}
    >
      <button
        onClick={() => void handleQuickWorkspaceSwitch()}
        disabled={isSwitching}
        className={`flex h-8 w-8 xl:w-auto items-center justify-center gap-1.5 rounded-full border px-0 xl:px-3 text-[10px] font-semibold uppercase tracking-wide transition-all ${
          isSwitching
            ? "cursor-not-allowed opacity-50"
            : "hover:border-[color-mix(in_srgb,var(--workspace-primary)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--workspace-primary)_8%,transparent)]"
        }`}
        style={{
          borderColor: switchTargetStyles.borderColor,
          color: switchTargetStyles.color,
          background: switchTargetStyles.background,
        }}
        title={switchButtonLabel}
      >
        <Repeat2 className={`h-3.5 w-3.5 flex-shrink-0 ${isSwitching ? "animate-spin" : ""}`} />
        <span className="hidden max-w-[76px] truncate xl:inline">{switchTargetLabel}</span>
      </button>

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
          className={`header-profile-trigger ${userMenuOpen ? "header-profile-trigger-open" : ""}`}
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
        >
          <div className="relative flex-shrink-0">
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
            {isOnlineForMessages && (
              <span
                className="absolute -bottom-[2px] -right-[2px] h-[10px] w-[10px] rounded-full border-[2px] bg-[#14a800]"
                style={{ borderColor: "var(--color-bg-base, #0a0a0a)" }}
              />
            )}
          </div>
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
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${triggerWorkspaceBadge.dotClassName}`} />
                <span className="truncate">{triggerWorkspaceBadge.label}</span>
              </span>
            </>
          ) : null}

          <ChevronDown
            className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--color-text-tertiary)" }}
          />
        </button>

        <AnimatePresence>
        {userMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute end-0 top-full z-[70] mt-2 w-[280px] overflow-hidden rounded-[1.25rem] backdrop-blur-2xl"
            style={{
              border: "1px solid var(--color-border-subtle)",
              background: "var(--color-background-elevated)",
              boxShadow: "0 32px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)",
              transformOrigin: "top right",
            }}
            role="menu"
            ref={menuRef}
          >
            <div
              className="h-0.5 w-full"
              style={{ background: "linear-gradient(90deg, transparent, var(--workspace-primary), transparent)" }}
            />

            <div className="px-3.5 pt-3.5 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={firstName}
                      className="h-11 w-11 rounded-full object-cover"
                      style={{ boxShadow: "0 0 0 2px var(--workspace-primary), 0 0 0 4px var(--color-background-elevated)" }}
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
                  {isOnlineForMessages && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px]"
                      style={{
                        background: "#14a800",
                        borderColor: "var(--color-background-elevated)",
                      }}
                    />
                  )}
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

            <div className="mx-3.5 h-px" style={{ background: "var(--color-border-subtle)" }} />

            {/* ── Online for Messages toggle + nav items in one block ── */}
            <div className="p-1.5">
              {/* Online toggle row — fully clickable button matching other menu items */}
              <button
                type="button"
                role="switch"
                aria-checked={isOnlineForMessages}
                onClick={() => void handleToggleOnline()}
                disabled={isTogglingOnline}
                className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-100 focus:outline-none hover:bg-[var(--color-background-subtle)] disabled:opacity-60"
              >
                <div className="flex h-7 w-7 items-center justify-center shrink-0">
                  {/* Just the green status dot aligned with icons below */}
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${isOnlineForMessages ? "bg-[#14a800]" : "bg-[var(--color-text-tertiary)] opacity-40"}`}
                  />
                </div>
                <span
                  className="flex-1 text-[13px] font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Online for messages
                </span>
                {/* Toggle pill */}
                <div
                  className="relative shrink-0 h-[20px] w-[36px] rounded-full transition-colors duration-200"
                  style={{
                    background: isOnlineForMessages ? "#14a800" : "var(--color-border-default, #3a3a3a)",
                  }}
                >
                  <span
                    className={`absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform duration-200 ${isOnlineForMessages ? "translate-x-[18px]" : "translate-x-[2px]"}`}
                  />
                </div>
              </button>

              {/* Nav items */}
              {[
                { icon: ExternalLink, label: t.nav?.profile || "My Profile", path: "/profile" },
                { icon: Bookmark, label: t.nav?.saved || "Saved", path: "/saved" },
                { icon: Settings, label: t.nav?.settings || "Settings", path: "/settings" },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setUserMenuOpen(false); }}
                  className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100 focus:outline-none hover:bg-[var(--color-background-subtle)]"
                  style={{ color: "var(--color-text-primary)" }}
                  role="menuitem"
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
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  style={{ color: "var(--color-text-primary)" }}
                  role="menuitem"
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
                </button>
              )}

              {canAccessAdmin ? (
                <button
                  onClick={() => { navigate("/admin"); setUserMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100 hover:bg-[var(--color-background-subtle)]"
                  style={{ color: "var(--color-text-primary)" }}
                  role="menuitem"
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
                    {tx('ui.admin')}</span>
                </button>
              ) : null}
            </div>

            <div className="mx-3.5 h-px" style={{ background: "var(--color-border-subtle)" }} />
            <div className="p-1.5 pb-2">
              <button
                onClick={async () => { await signOut(); setUserMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100 hover:bg-red-50 dark:hover:bg-red-900/20"
                style={{ color: "var(--color-text-secondary)" }}
                role="menuitem"
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
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
