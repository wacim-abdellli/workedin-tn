/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--page-bg)",
        surface: "var(--surface-bg)",
        card: "var(--card-bg)",
        sidebar: "var(--sidebar-bg)",
        foreground: "var(--text-primary)",
        muted: {
          DEFAULT: "var(--text-muted)",
          foreground: "var(--text-secondary)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        input: {
          light: "#ffffff",
          dark: "#1a1825",
          bg: "var(--input-bg)",
          border: "var(--input-border)",
          focus: "var(--input-border-focus)",
        },
        brand: {
          DEFAULT: "var(--workspace-primary)",
          hover: "var(--workspace-primary-hover)",
          active: "var(--workspace-primary-active)",
          light: "var(--workspace-primary-light)",
          dim: "var(--workspace-primary-dim)",
          mid: "var(--workspace-primary-mid)",
          text: "var(--workspace-primary-text)",
          secondary: "var(--workspace-secondary)",
          "secondary-hover": "var(--workspace-secondary-hover)",
          accent: "var(--workspace-accent)",
          "accent-hover": "var(--workspace-accent-hover)",
        },
        workspace: {
          primary: "var(--workspace-primary)",
          "primary-hover": "var(--workspace-primary-hover)",
          "primary-active": "var(--workspace-primary-active)",
          "primary-light": "var(--workspace-primary-light)",
          "primary-dim": "var(--workspace-primary-dim)",
          "primary-text": "var(--workspace-primary-text)",
          secondary: "var(--workspace-secondary)",
          "secondary-hover": "var(--workspace-secondary-hover)",
          "secondary-light": "var(--workspace-secondary-light)",
          accent: "var(--workspace-accent)",
          "accent-hover": "var(--workspace-accent-hover)",
        },
        status: {
          success: "var(--color-status-success)",
          "success-bg": "var(--color-status-success-bg)",
          "success-text": "var(--color-status-success-text)",
          warning: "var(--color-status-warning)",
          "warning-bg": "var(--color-status-warning-bg)",
          "warning-text": "var(--color-status-warning-text)",
          error: "var(--color-status-error)",
          "error-bg": "var(--color-status-error-bg)",
          "error-text": "var(--color-status-error-text)",
          info: "var(--color-status-info)",
          "info-bg": "var(--color-status-info-bg)",
          "info-text": "var(--color-status-info-text)",
        },
        primary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        secondary: {
          50: "#faf8ff",
          100: "#f3eeff",
          200: "#e7def8",
          300: "#d6c8f2",
          400: "#b7a8d6",
          500: "#8b8aa0",
          600: "#746c8c",
          700: "#4f4766",
          800: "#242235",
          900: "#1a1825",
          950: "#100d16",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        dark: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        surface: {
          light: "#ffffff",
          "light-2": "#f8f7ff",
          "light-3": "#f1f0fe",
          dark: "#0f0e17",
          "dark-2": "#1a1825",
          "dark-3": "#242235",
        },
        page: {
          light: "#ffffff",
          dark: "#0f0e17",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "DM Sans", "sans-serif"],
        cairo: ["Cairo", "sans-serif"],
        arabic: ["Cairo", "Noto Sans Arabic", "sans-serif"],
        // Design system typography tokens
        heading: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        body: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["Fira Code", "Courier New", "Courier", "monospace"],
      },
      fontSize: {
        // Design system typography scale
        xs: ["0.75rem", { lineHeight: "1.5" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.5" }], // 14px
        base: ["1rem", { lineHeight: "1.5" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.5" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.5" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "1.375" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "1.25" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "1.25" }], // 36px
        "5xl": ["3rem", { lineHeight: "1.25" }], // 48px
        "6xl": ["3.75rem", { lineHeight: "1.25" }], // 60px
      },
      fontWeight: {
        // Design system font weights
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
      },
      lineHeight: {
        // Design system line heights
        tight: "1.25",
        snug: "1.375",
        normal: "1.5",
        relaxed: "1.625",
        loose: "2",
      },
      letterSpacing: {
        // Design system letter spacing
        tighter: "-0.05em",
        tight: "-0.025em",
        normal: "0",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.1em",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        gradient: "gradient 8s ease infinite",
        "bounce-slow": "bounce 3s infinite",
        "spin-slow": "spin 8s linear infinite",
        "slide-in-right": "slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left": "slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "progress-indeterminate":
          "progressIndeterminate 1.5s ease-in-out infinite",
      },
      transitionDuration: {
        // Design system animation durations
        instant: "0ms",
        fast: "150ms",
        normal: "250ms",
        slow: "350ms",
        slower: "500ms",
      },
      transitionTimingFunction: {
        // Design system easing functions
        linear: "linear",
        "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
        "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
        "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(111, 59, 255, 0.24)" },
          "50%": { boxShadow: "0 0 40px rgba(212, 160, 23, 0.22)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        progressIndeterminate: {
          "0%": { left: "-40%" },
          "100%": { left: "100%" },
        },
      },
      spacing: {
        // Design system spacing scale
        0: "0",
        1: "0.25rem", // 4px
        2: "0.5rem", // 8px
        3: "0.75rem", // 12px
        4: "1rem", // 16px
        5: "1.25rem", // 20px
        6: "1.5rem", // 24px
        8: "2rem", // 32px
        10: "2.5rem", // 40px
        12: "3rem", // 48px
        16: "4rem", // 64px
        20: "5rem", // 80px
        24: "6rem", // 96px
        32: "8rem", // 128px
        40: "10rem", // 160px
        48: "12rem", // 192px
        56: "14rem", // 224px
        64: "16rem", // 256px
        // Legacy spacing (keeping for backward compatibility)
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      maxWidth: {
        "8xl": "88rem",
      },
      borderRadius: {
        // Design system border radius scale
        none: "0",
        sm: "0.25rem", // 4px
        md: "0.5rem", // 8px (default for most components)
        lg: "0.75rem", // 12px
        xl: "1rem", // 16px
        "2xl": "1.5rem", // 24px
        full: "9999px", // Fully rounded
        // Legacy (keeping for backward compatibility)
        "4xl": "2rem",
      },
      boxShadow: {
        // Design system elevation system
        "elevation-0": "none",
        "elevation-1": "0 1px 3px rgba(0, 0, 0, 0.08)",
        "elevation-2": "0 4px 12px rgba(0, 0, 0, 0.1)",
        "elevation-3": "0 12px 24px rgba(0, 0, 0, 0.12)",
        "elevation-4": "0 24px 48px rgba(0, 0, 0, 0.15)",
        // Size-based shadows
        xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px rgba(0, 0, 0, 0.08)",
        md: "0 4px 12px rgba(0, 0, 0, 0.1)",
        lg: "0 12px 24px rgba(0, 0, 0, 0.12)",
        xl: "0 24px 48px rgba(0, 0, 0, 0.15)",
        "2xl": "0 32px 64px rgba(0, 0, 0, 0.18)",
        // Glow effects
        "glow-primary": "0 0 24px rgba(147, 51, 234, 0.3)",
        "glow-accent": "0 0 24px rgba(217, 119, 6, 0.3)",
        // Legacy shadows (keeping for backward compatibility)
        glow: "0 0 40px -10px rgba(111, 59, 255, 0.34)",
        "glow-accent": "0 0 40px -10px rgba(212, 160, 23, 0.3)",
        "inner-glow": "inset 0 2px 20px 0 rgba(255, 255, 255, 0.1)",
        elevated: "0 20px 50px -15px rgba(0, 0, 0, 0.15)",
        "elevated-dark": "0 20px 50px -15px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-1":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [
    require("tailwindcss/plugin")(function ({ addVariant }) {
      addVariant("rtl", '[dir="rtl"] &');
      addVariant("ltr", '[dir="ltr"] &');
    }),
  ],
};
