/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // --- CSS VARIABLES DESIGN SYSTEM TOKENS ---
                // These point to the tokens mapped in src/index.css
                // Enabling semantic dark mode without manual `dark:bg-[#xxx]`
                background: 'var(--page-bg)',
                surface: 'var(--surface-bg)',
                card: 'var(--card-bg)',
                sidebar: 'var(--sidebar-bg)',
                foreground: 'var(--text-primary)',
                muted: {
                    DEFAULT: 'var(--text-muted)',
                    foreground: 'var(--text-secondary)'
                },
                border: {
                    DEFAULT: 'var(--border)',
                    strong: 'var(--border-strong)'
                },
                input: {
                    bg: 'var(--input-bg)',
                    border: 'var(--input-border)',
                    focus: 'var(--input-border-focus)'
                },
                brand: {
                    DEFAULT: 'var(--workspace-primary)',
                    hover: 'var(--workspace-primary-hover)',
                    light: 'var(--workspace-primary-light)',
                    mid: 'var(--workspace-primary-mid)',
                    text: 'var(--workspace-primary-text)',
                    accent: 'var(--brand-accent)',
                    'accent-hover': 'var(--brand-accent-hover)',
                },
                // --- END CSS VARIABLES ---

                // Brand Primary - Khedma Violet (Freelancer workspace)
                primary: {
                    50: '#F5F0FF',
                    100: '#EDE3FF',
                    200: '#DCCBFF',
                    300: '#C2A8FF',
                    400: '#A27EFF',
                    500: '#8457FF',
                    600: '#6F3BFF',
                    700: '#5527D7',
                    800: '#431FAC',
                    900: '#34197F',
                    950: '#241050',
                },
                // Client Blue - Client workspace
                blue: {
                    50: '#FFF8E7',
                    100: '#FDEFC4',
                    200: '#F8DE8B',
                    300: '#F0C95B',
                    400: '#E2AE2F',
                    500: '#D4A017',
                    600: '#B88410',
                    700: '#92670D',
                    800: '#6F4E0D',
                    900: '#52390B',
                    950: '#302004',
                },
                indigo: {
                    50: '#F5F0FF',
                    100: '#EDE3FF',
                    200: '#DCCBFF',
                    300: '#C2A8FF',
                    400: '#A27EFF',
                    500: '#8457FF',
                    600: '#6F3BFF',
                    700: '#5527D7',
                    800: '#431FAC',
                    900: '#34197F',
                    950: '#241050',
                },
                sky: {
                    50: '#FFF8E7',
                    100: '#FDEFC4',
                    200: '#F8DE8B',
                    300: '#F0C95B',
                    400: '#E2AE2F',
                    500: '#D4A017',
                    600: '#B88410',
                    700: '#92670D',
                    800: '#6F4E0D',
                    900: '#52390B',
                    950: '#302004',
                },
                cyan: {
                    50: '#FFF8E7',
                    100: '#FDEFC4',
                    200: '#F8DE8B',
                    300: '#F0C95B',
                    400: '#E2AE2F',
                    500: '#D4A017',
                    600: '#B88410',
                    700: '#92670D',
                    800: '#6F4E0D',
                    900: '#52390B',
                    950: '#302004',
                },
                // Brand Accent - Warm Gold/Amber for Tunisian feel
                accent: {
                    50: '#FFF8E7',
                    100: '#FDEFC4',
                    200: '#F8DE8B',
                    300: '#F0C95B',
                    400: '#E2AE2F',
                    500: '#D4A017',
                    600: '#B88410',
                    700: '#92670D',
                    800: '#6F4E0D',
                    900: '#52390B',
                    950: '#302004',
                },
                // Secondary - Brand-supporting plum neutrals
                secondary: {
                    50: '#faf8ff',
                    100: '#f3eeff',
                    200: '#e7def8',
                    300: '#d6c8f2',
                    400: '#b7a8d6',
                    500: '#8b8aa0',
                    600: '#746c8c',
                    700: '#4f4766',
                    800: '#242235',
                    900: '#1a1825',
                    950: '#100d16',
                },
                // Success
                success: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                },
                // Warning
                warning: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                },
                // Dark mode palette
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1a1825',
                    900: '#0f0e17',
                    950: '#0a0914',
                },
                // Surface tokens for cards and panels
                surface: {
                    light: '#ffffff',
                    'light-2': '#f8f7ff',
                    'light-3': '#f1f0fe',
                    dark: '#0f0e17',
                    'dark-2': '#1a1825',
                    'dark-3': '#242235',
                },
                card: {
                    light: '#ffffff',
                    dark: '#1a1825',
                },
                input: {
                    light: '#ffffff',
                    dark: '#1a1825',
                },
                page: {
                    light: '#ffffff',
                    dark: '#0f0e17',
                },
            },
            fontFamily: {
                sans: ['DM Sans', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'DM Sans', 'sans-serif'],
                cairo: ['Cairo', 'sans-serif'],
                arabic: ['Cairo', 'Noto Sans Arabic', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'gradient': 'gradient 8s ease infinite',
                'bounce-slow': 'bounce 3s infinite',
                'spin-slow': 'spin 8s linear infinite',
                'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-in-left': 'slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(111, 59, 255, 0.24)' },
                    '50%': { boxShadow: '0 0 40px rgba(212, 160, 23, 0.22)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            maxWidth: {
                '8xl': '88rem',
            },
            borderRadius: {
                '4xl': '2rem',
            },
            boxShadow: {
                'glow': '0 0 40px -10px rgba(111, 59, 255, 0.34)',
                'glow-accent': '0 0 40px -10px rgba(212, 160, 23, 0.3)',
                'inner-glow': 'inset 0 2px 20px 0 rgba(255, 255, 255, 0.1)',
                'elevated': '0 20px 50px -15px rgba(0, 0, 0, 0.15)',
                'elevated-dark': '0 20px 50px -15px rgba(0, 0, 0, 0.5)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'mesh-1': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            },
        },
    },
    plugins: [
        require('tailwindcss/plugin')(function({ addVariant }) {
            addVariant('rtl', '[dir="rtl"] &')
            addVariant('ltr', '[dir="ltr"] &')
        })
    ],
}
