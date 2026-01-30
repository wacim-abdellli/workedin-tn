# Hooks Directory

This directory contains custom React hooks to encapsulate reusable logic and state management.

## Available Hooks

### `useAuth`
- **Source**: `src/contexts/AuthContext.tsx` (Exported here for convenience if re-exported, otherwise see Context)
- **Purpose**: Access authentication state (user, session) and methods (login, logout).
- **Usage**: `const { user, signInWithEmail } = useAuth();`

### `useTheme`
- **Source**: `src/contexts/ThemeContext.tsx`
- **Purpose**: Manage application theme (light/dark mode).
- **Usage**: `const { theme, toggleTheme } = useTheme();`

### `useRouteFocus`
- **Source**: `src/hooks/useRouteFocus.ts`
- **Purpose**: Manages focus management for accessibility during route transitions.
- **Usage**: Called automatically in `App.tsx`.

## Guidelines

- Create a new hook for any logic that relies on other hooks or needs to be reused across components.
- Prefix all hooks with `use`.
