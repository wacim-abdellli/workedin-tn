import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to manage focus on route changes for accessibility.
 * Moves focus to the main content wrapper or the H1 element.
 */
export function useRouteFocus() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Find the main content wrapper or h1
        const mainContent = document.getElementById('main-content');
        const h1 = document.querySelector('h1');

        if (mainContent) {
            mainContent.focus();
            // Ensure outline doesn't show for mouse users, but does for keyboard if needed
            // Usually we might want to suppress outline on this programmatic focus
            mainContent.style.outline = 'none';
        } else if (h1) {
            h1.tabIndex = -1;
            h1.focus();
            h1.style.outline = 'none';
        }

        // Scroll to top is handled by ScrollToTop component, 
        // but focus needs to follow.
    }, [pathname]);
}
