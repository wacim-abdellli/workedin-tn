import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/i18n";

const LANGS = [
  { code: "ar", label: "العربية", display: "AR", country: "TN" },
  { code: "fr", label: "Francais", display: "FR", country: "FR" },
  { code: "en", label: "English", display: "EN", country: "GB" },
] as const;

export function LanguageMenu() {
  const { language, setLanguage } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentLang = language || "en";
  const activeLang = LANGS.find((lang) => lang.code === currentLang) ?? LANGS[2];
  const focusMenuItem = (target: "first" | "last") => {
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!items || items.length === 0) return;
    const arr = Array.from(items);
    (target === "first" ? arr[0] : arr[arr.length - 1]).focus();
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!langRef.current?.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!langOpen) return;

      if (event.key === "Escape") {
        setLangOpen(false);
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
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [langOpen]);

  return (
    <div className="relative" ref={langRef}>
      <button
        ref={triggerRef}
        onClick={() =>
          setLangOpen((open) => {
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
            if (!langOpen) {
              setLangOpen(true);
              setTimeout(() => focusMenuItem(event.key === "ArrowDown" ? "first" : "last"), 10);
              return;
            }
            focusMenuItem(event.key === "ArrowDown" ? "first" : "last");
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setLangOpen((open) => !open);
          }
        }}
        className="flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold uppercase tracking-wider transition-all"
        style={{ color: "var(--color-text-secondary)" }}
        aria-expanded={langOpen}
        aria-haspopup="menu"
      >
        <span
          className="hidden 2xl:inline"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {activeLang.country}
        </span>
        <span>{activeLang.display}</span>
      </button>

      {langOpen && (
        <div
          className="absolute end-0 top-full z-[70] mt-3 w-52 overflow-hidden rounded-2xl p-1.5 ring-1 backdrop-blur-xl"
          style={{
            border: "1px solid var(--color-border-default)",
            background: "var(--color-background-elevated)",
          }}
          role="menu"
          ref={menuRef}
        >
          {LANGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setLangOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
              style={
                currentLang === lang.code
                  ? {
                      background: "var(--workspace-primary-light)",
                      color: "var(--workspace-primary-hover)",
                    }
                  : { color: "var(--color-text-primary)" }
              }
              role="menuitem"
            >
              <span
                className="w-8 shrink-0 text-start text-xs font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {lang.country}
              </span>
              <span className="flex-1 truncate text-start font-medium">{lang.label}</span>
              <span
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {lang.display}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
