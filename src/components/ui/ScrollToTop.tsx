 import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function ScrollToTop() {
    const { pathname } = useLocation();
    const { tx } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    // Scroll resets on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

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
            className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 transition-all duration-300 hover:bg-primary-700 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                }`}
            aria-label={tx('common.scrollToTop', undefined, 'Scroll to top')}
        >
            <ArrowUp className="w-6 h-6" />
        </button>
    );
}
