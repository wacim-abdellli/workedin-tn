import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, ChevronDown, User, LogOut, Settings, Search } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import type { Language } from '../../types';
import Button from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';
import ThemeToggle from '../ui/ThemeToggle';
import GlobalSearch from '../search/GlobalSearch';

function Header() {
    const { t, language, setLanguage } = useTranslation();
    const { isAuthenticated, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const location = useLocation();

    // Ctrl+K to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const publicNavLinks = [
        { href: '/', label: t.nav.home },
        { href: '/how-it-works', label: t.nav.howItWorks },
        { href: '/for-freelancers', label: t.nav.forFreelancers },
        { href: '/for-clients', label: t.nav.forClients },
    ];

    const authNavLinks = profile?.user_type === 'client'
        ? [
            { href: '/client/dashboard', label: t.nav.dashboard },
            { href: '/job/new', label: t.hero.ctaClient }, // Reusing 'Post a Job' or create new key
        ]
        : [
            { href: '/freelancer/dashboard', label: t.nav.dashboard },
            { href: '/freelancer/jobs', label: t.nav.jobs }, // 'Available Jobs' or 'Search Jobs'
        ];

    const navLinks = isAuthenticated ? authNavLinks : publicNavLinks;

    const languages: { code: Language; label: string }[] = [
        { code: 'ar', label: 'العربية' },
        { code: 'fr', label: 'Français' },
        { code: 'en', label: 'English' },
    ];

    const isActive = (path: string) => location.pathname === path;

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <header className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-dark-700/50">
            <div className="container-custom">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-600/25 group-hover:shadow-xl group-hover:shadow-primary-600/30 transition-shadow duration-300">
                            <span className="text-white font-bold text-lg">خ</span>
                        </div>
                        <span className="text-xl font-bold">
                            <span className="text-gradient">Khedma</span>
                            <span className="text-accent-500">.tn</span>
                        </span>
                    </Link>

                    {/* Search Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 rounded-xl text-dark-500 dark:text-dark-400 transition-all duration-200 hover:ring-2 hover:ring-primary-500/20"
                    >
                        <Search className="w-4 h-4" />
                        <span className="text-sm">{t.common.search}...</span>
                        <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-dark-700 border border-dark-200 dark:border-dark-600 rounded text-xs text-dark-400">
                            <span>⌘</span><span>K</span>
                        </kbd>
                    </button>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition-colors
                                    ${isActive(link.href)
                                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-800'
                                    }
                                `}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm font-medium">
                                    {languages.find((l) => l.code === language)?.label}
                                </span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {isLangDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsLangDropdownOpen(false)}
                                    />
                                    <div className="absolute top-full end-0 mt-2 w-40 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-100 dark:border-dark-700 py-1 z-20 animate-slide-down">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setLanguage(lang.code);
                                                    setIsLangDropdownOpen(false);
                                                }}
                                                className={`
                                                    w-full px-4 py-2 text-start text-sm font-medium transition-colors
                                                    ${language === lang.code
                                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                                                    }
                                                `}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {isAuthenticated ? (
                            <>
                                {/* Notification Bell */}
                                <NotificationBell />

                                {/* Profile Dropdown */}
                                <div className="relative hidden md:block">
                                    <button
                                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                            <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {profile?.full_name || t.hero.trust.users} {/* Fallback 'Users' or 'User' key if specific */}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    </button>

                                    {isProfileDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setIsProfileDropdownOpen(false)}
                                            />
                                            <div className="absolute top-full end-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-100 dark:border-dark-700 py-1 z-20 animate-slide-down">
                                                <Link
                                                    to="/settings"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    {t.nav.settings}
                                                </Link>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    {t.nav.logout}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Auth Buttons - Desktop */
                            <div className="hidden md:flex items-center gap-2">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">
                                        {t.nav.login}
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button variant="primary" size="sm">
                                        {t.nav.signup}
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-gray-100 py-4 animate-slide-down">
                        <nav className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                                        px-4 py-3 rounded-lg font-medium transition-colors
                                        ${isActive(link.href)
                                            ? 'text-primary-600 bg-primary-50'
                                            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full">
                                            <Settings className="w-4 h-4 mr-2" />
                                            {t.nav.settings}
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" className="w-full text-red-600" onClick={handleSignOut}>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        {t.nav.logout}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full">
                                            {t.nav.login}
                                        </Button>
                                    </Link>
                                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="primary" className="w-full">
                                            {t.nav.signup}
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Global Search Modal */}
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </header>
    );
}

export default Header;

