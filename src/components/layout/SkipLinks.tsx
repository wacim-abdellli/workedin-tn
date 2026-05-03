import { useState } from 'react';
// import { useLocation } from 'react-router-dom';
// import { useLocation } from 'react-router-dom';

/**
 * Skip links for keyboard navigation accessibility.
 * Hidden by default, visible on focus.
 */
export default function SkipLinks() {
    const [isFocused, setIsFocused] = useState(false);
    // const location = useLocation(); // Not currently used, focus resets on blur/navigation naturally

    // Reset visible state on navigation just in case
    // (though focus usually resets anyway)

    const links = [
        { id: 'main-content', label: 'Skip to main content' },
        { id: 'main-nav', label: 'Skip to navigation' },
    ];

    return (
        <div className="fixed top-0 start-0 z-[100] w-full pointer-events-none">
            {links.map((link) => (
                <a
                    key={link.id}
                    href={`#${link.id}`}
                    className={`
                        absolute top-0 start-0 m-2 p-3
                        bg-primary-600 text-white font-bold rounded-lg shadow-lg
                        transition-transform duration-200 pointer-events-auto
                        focus:outline-none focus:ring-4 focus:ring-primary-300
                        ${isFocused ? 'translate-y-0' : '-translate-y-[150%]'}
            focus:translate-y-0
                    `}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                >
                    {link.label}
                </a>
            ))
            }
        </div >
    );
}
