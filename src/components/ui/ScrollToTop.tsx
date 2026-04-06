 import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function ScrollToTop() {
    const { pathname, state } = useLocation();
    const { tx } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    // Scroll to top on route change OR workspace switch (state.switching)
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [pathname, (state as any)?.switching, (state as any)?.workspace]);

    // specific toggle for button visibility
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`fixed bottom-8 right-8 z-50 p-3 rounded-full text-white shadow-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            style={{
                background: 'var(--workspace-primary)',
                boxShadow: '0 4px 16px color-mix(in srgb, var(--workspace-primary) 40%, transparent)',
            }}
            aria-label={tx('common.scrollToTop', undefined, 'Scroll to top')}
        >
            <ArrowUp className="w-6 h-6" />
        </button>
    );
}
