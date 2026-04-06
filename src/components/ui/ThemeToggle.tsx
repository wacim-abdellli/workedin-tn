import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`
                relative flex items-center justify-center
                w-9 h-9 rounded-xl
                transition-all duration-200 ease-out
                bg-[var(--color-background-muted,var(--color-bg-muted))]
                hover:bg-[var(--workspace-primary-dim,rgba(147,51,234,0.1))]
                text-[var(--color-text-secondary)]
                hover:text-[var(--workspace-primary)]
                focus:outline-none focus-visible:ring-2
                focus-visible:ring-[var(--workspace-primary)]
                focus-visible:ring-offset-2
                ${className}
            `}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark
              ? "opacity-0 rotate-90 scale-0"
              : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}

export default ThemeToggle;
