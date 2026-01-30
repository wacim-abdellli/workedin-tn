/**
 * Auth utilities for comprehensive session cleanup
 * This module handles bulletproof logout across all storage mechanisms
 */
/**
 * Nuclear option: Clear ALL auth-related data from the browser
 * This ensures complete session destruction
 */
export function clearAllAuthData(): void {
    // 1. Clear all Supabase-related localStorage keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.startsWith('sb-') ||
            key.includes('supabase') ||
            key.includes('auth') ||
            key.includes('token')
        )) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 2. Clear sessionStorage as well
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
            key.startsWith('sb-') ||
            key.includes('supabase') ||
            key.includes('auth') ||
            key.includes('token')
        )) {
            sessionKeysToRemove.push(key);
        }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

    // 3. Clear any auth-related cookies
    document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
    });
}

/**
 * Perform a hard logout with full page reload
 * This is the most reliable way to ensure complete session destruction
 */

export function hardLogout(redirectTo: string = '/login'): void {
    clearAllAuthData();
    // Use replace to prevent back button from returning to authenticated state
    window.location.replace(redirectTo);
}

/**
 * Check if there are any lingering auth tokens
 * Useful for debugging auth issues
 */

export function hasLingeringAuthTokens(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
            return true;
        }
    }
    return false;
}
