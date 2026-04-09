import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n";

export interface NavItem {
  label: string;
  Icon: LucideIcon;
  href: string;
}

interface DesktopNavProps {
  navItems: NavItem[];
  overflowNavItems?: NavItem[];
}

export function DesktopNav({ navItems, overflowNavItems = [] }: DesktopNavProps) {
  const { t } = useTranslation();
  const [navMoreOpen, setNavMoreOpen] = useState(false);
  const navMoreRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusMenuItem = (target: "first" | "last") => {
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!items || items.length === 0) return;
    const arr = Array.from(items);
    (target === "first" ? arr[0] : arr[arr.length - 1]).focus();
  };
  
  const navActiveClass = "header-nav-link-active";
  const moreLabel = t.pages?.mobileNav?.more || "More";
  const hasOverflowActiveItem = false; // Could be computed if needed

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!navMoreRef.current?.contains(event.target as Node)) {
        setNavMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!navMoreOpen) return;

      if (event.key === "Escape") {
        setNavMoreOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        if (!items || items.length === 0) return;
        const arr = Array.from(items);
        const idx = arr.indexOf(document.activeElement as HTMLElement);
        if (event.key === "ArrowDown") {
          (idx < arr.length - 1 ? arr[idx + 1] : arr[0]).focus();
        } else {
          (idx > 0 ? arr[idx - 1] : arr[arr.length - 1]).focus();
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
  }, [navMoreOpen]);

  return (
    <nav id="main-nav" className="flex items-center">
      {navItems.map(({ label, Icon, href }) => (
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
            ref={triggerRef}
            onClick={() =>
              setNavMoreOpen((open) => {
                const next = !open;
                if (next) {
                  setTimeout(() => focusMenuItem("first"), 10);
                }
                return next;
              })
            }
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!navMoreOpen) {
                  setNavMoreOpen(true);
                  setTimeout(() => focusMenuItem(event.key === "ArrowDown" ? "first" : "last"), 10);
                  return;
                }
                focusMenuItem(event.key === "ArrowDown" ? "first" : "last");
                return;
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setNavMoreOpen((open) => !open);
              }
            }}
            className={hasOverflowActiveItem ? navActiveClass : "header-nav-link"}
            aria-label={moreLabel}
            aria-expanded={navMoreOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{moreLabel}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${navMoreOpen ? "rotate-180" : ""}`}
            />
          </button>

          {navMoreOpen && (
            <div
              className="absolute start-0 top-full z-[70] mt-3 w-56 overflow-hidden rounded-[1.25rem] p-2 shadow-[0_28px_70px_-30px_rgba(15,23,42,0.4)] ring-1 backdrop-blur-xl"
              style={{
                borderColor: "var(--color-border-default)",
                borderWidth: "1px",
                background: "var(--color-background-elevated)",
                boxShadow: "0 24px 50px -28px rgba(15,23,42,0.45)",
              }}
              role="menu"
              ref={menuRef}
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
                      ? { background: "var(--workspace-primary-light)" }
                      : undefined
                  }
                  role="menuitem"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      border: "1px solid color-mix(in srgb, var(--workspace-primary) 16%, transparent)",
                      background: "color-mix(in srgb, var(--workspace-primary) 8%, transparent)",
                      color: "var(--workspace-primary-hover)",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </nav>
  );
}
