export const colors = {
  brand: {
    purple: '#8b5cf6',
    purpleLight: '#a78bfa',
    purpleDark: '#6d28d9',
    amber: '#f59e0b',
    amberLight: '#fbbf24',
  },
  light: {
    pageBg: '#ffffff',
    surfaceBg: '#f8f7ff',
    cardBg: '#ffffff',
    sidebarBg: '#f5f4fc',
    inputBg: '#ffffff',
    inputBorder: '#e5e7eb',
    inputBorderFocus: '#8b5cf6',
    text: {
      primary: '#1a1825',
      secondary: '#4b4869',
      muted: '#6b6880',
      placeholder: '#9ca3af',
    },
    border: '#e5e7eb',
    borderStrong: '#d1d5db',
  },
  dark: {
    pageBg: '#0f0e17',
    surfaceBg: '#14121f',
    cardBg: '#1a1825',
    sidebarBg: '#0c0b14',
    inputBg: '#1a1825',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputBorderFocus: '#8b5cf6',
    text: {
      primary: '#f8f7ff',
      secondary: '#c4b5fd',
      muted: '#8b8aa0',
      placeholder: '#6b6880',
    },
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.15)',
  },
} as const;

export type ThemePalette = typeof colors.light | typeof colors.dark;
