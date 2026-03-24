import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Briefcase, Plus, FolderOpen, FileText, ClipboardList, Wallet, Users } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

import { Navigation } from './Navigation';
import { SearchModal } from './SearchModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import IconButton from '@/components/ui/IconButton';
import { UserMenu } from './UserMenu';
import { AuthButtons } from './AuthButtons';
import { MobileMenu } from './MobileMenu';
import AccountPanel from '../AccountPanel';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [accountPanelOpen, setAccountPanelOpen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(64);
    const headerRef = useRef<HTMLElement | null>(null);
    const { user, profile, signOut } = useAuth();
    const { theme } = useTheme();
    const { t, language, setLanguage } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 24);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const node = headerRef.current;
        if (!node) return;

        const updateHeight = () => setHeaderHeight(node.offsetHeight || 64);
        updateHeight();

        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(node);
        window.addEventListener('resize', updateHeight);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateHeight);
        };
    }, []);

    useEffect(() => {
        setAccountPanelOpen(false);
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!accountPanelOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element | null;
            if (!target?.closest('[data-account-panel]')) {
                setAccountPanelOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [accountPanelOpen]);

    useEffect(() => {
        if (!accountPanelOpen && !mobileMenuOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            setAccountPanelOpen(false);
            setMobileMenuOpen(false);
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [accountPanelOpen, mobileMenuOpen]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1280) {
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (accountPanelOpen) {
            setMobileMenuOpen(false);
        }
    }, [accountPanelOpen]);

    useEffect(() => {
        if (mobileMenuOpen) {
            setAccountPanelOpen(false);
        }
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (accountPanelOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
            const previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.overflow = previousOverflow;
            };
        }

        return undefined;
    }, [accountPanelOpen]);

    const { isFreelancer, accentClass } = useWorkspace();

    const navItems = isFreelancer ? [
        { to: '/jobs', icon: Briefcase, label: t.nav.findWork || 'Find Work' },
        { to: '/my-proposals', icon: FileText, label: 'My Proposals' },
        { to: '/contracts', icon: ClipboardList, label: 'Contracts' },
        { to: '/freelancer/earnings', icon: Wallet, label: 'Earnings' },
    ] : [
        { to: '/jobs/new', icon: Plus, label: 'Post a Project' },
        { to: '/client/jobs', icon: FolderOpen, label: 'My Projects' },
        { to: '/find-freelancers', icon: Users, label: t.nav.findFreelancers || 'Find Freelancers' },
        { to: '/contracts', icon: ClipboardList, label: 'Contracts' },
    ];

    return (
        <>
            <div className={cn("fixed top-0 left-0 right-0 h-0.5 z-[60]", accentClass === 'purple' ? 'bg-purple-500' : 'bg-amber-500')} />
            <header ref={headerRef} className={cn(
                'fixed top-0.5 left-0 right-0 z-50 transition-all duration-300',
                isScrolled
                    ? theme === 'dark'
                        ? 'bg-[#0f0e17]/95 backdrop-blur-sm border-b border-white/5 shadow-lg shadow-black/20'
                        : 'bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'
                    : theme === 'dark'
                        ? 'bg-[#0f0e17] border-b border-white/5'
                        : 'bg-white border-b border-gray-100'
            )}>
                <div className="max-w-7xl 2xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20 relative">
                        
                        {/* Left: Logo & Navigation */}
                        <div className="flex items-center gap-4 lg:gap-8 shrink-0">
                            <Logo language={language} />
                            <Navigation isScrolled={isScrolled} theme={theme} items={navItems} accentClass={accentClass} />
                        </div>

                        {/* Center: Search (Absolute on large screens or flex-1 in between) */}
                        <div className="hidden lg:flex flex-1 justify-center px-4 md:px-8 max-w-2xl mx-auto min-w-[200px]">
                            {user ? (
                                <SearchModal isScrolled={isScrolled} theme={theme} language={language} t={t} />
                            ) : (
                                <Link
                                    to="/jobs"
                                    className={cn(
                                        "hidden md:flex w-full max-w-md items-center gap-3 px-4 h-10 sm:h-11 rounded-xl transition-all duration-200 group",
                                        "bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 backdrop-blur-md shadow-sm",
                                        "hover:bg-gray-50 dark:hover:bg-white/10 hover:border-purple-200 dark:hover:border-purple-400/20",
                                        isScrolled || theme === 'dark' ? "text-[#6b6880] dark:text-[#c4b5fd]" : "text-[#3d3a4e]"
                                    )}
                                >
                                    <Briefcase className="w-4 h-4 text-violet-500 shrink-0" />
                                    <span className={cn(
                                        "flex-1 text-sm font-medium text-left truncate",
                                        isScrolled || theme === 'dark' ? "text-[#4b4869] dark:text-[#c4b5fd]" : "text-[#3d3a4e]"
                                    )}>
                                        {t.nav.findWork}
                                    </span>
                                </Link>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                            <LanguageSwitcher
                                isScrolled={isScrolled}
                                theme={theme}
                                language={language}
                                setLanguage={setLanguage}
                            />
                            <ThemeToggle isScrolled={isScrolled} />

                            {user ? (
                                <div className="relative" data-account-panel>
                                    <UserMenu
                                        user={user}
                                        profile={profile}
                                        isOpen={accountPanelOpen}
                                        onToggle={() => setAccountPanelOpen((open) => !open)}
                                    />
                                </div>
                            ) : (
                                <AuthButtons isScrolled={isScrolled} theme={theme} t={t} />
                            )}

                            {/* Mobile Menu Toggle */}
                            <IconButton
                                icon={mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                label={mobileMenuOpen ? t.common.closeMenu : t.common.openMenu}
                                onClick={() => setMobileMenuOpen((open) => !open)}
                                isActive={mobileMenuOpen}
                                size="sm"
                                className={cn(
                                    "xl:hidden",
                                    isScrolled || theme === 'dark'
                                        ? "text-gray-300 hover:text-white"
                                        : "text-gray-700 hover:text-gray-900"
                                )}
                                aria-expanded={mobileMenuOpen}
                                aria-controls="mobile-menu"
                            />
                        </div>
                    </div>
                </div>

                {/* Gradient line */}
                {isScrolled && (
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent"
                    />
                )}

                {/* Mobile Menu */}
                <MobileMenu
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    onSearchOpen={() => navigate('/search')}
                    t={t}
                />
            </header>

            {user ? (
                <AccountPanel
                    isOpen={accountPanelOpen}
                    headerHeight={headerHeight}
                    user={user}
                    profile={profile}
                    signOut={signOut}
                    onClose={() => setAccountPanelOpen(false)}
                />
            ) : null}

            {/* Spacer */}
            <div className="h-16 lg:h-20" />
        </>
    );
}

function Logo({ language }: { language: string }) {
    const { theme } = useTheme();
    const logoSrc = language === 'ar'
        ? (theme === 'dark' ? '/logos/logo-arabic-dark.svg' : '/logos/logo-arabic.svg')
        : (theme === 'dark' ? '/logos/logo-primary-dark.svg' : '/logos/logo-primary.svg');

    return (
        <Link to="/" className="group relative z-10 flex shrink-0 items-center">
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center"
            >
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-violet-600/20 via-fuchsia-500/15 to-amber-400/20 blur-xl opacity-0 transition-opacity group-hover:opacity-100" />
                <img
                    src={logoSrc}
                    alt={language === 'ar' ? 'خدمة TN' : 'Khedma TN'}
                    width="180"
                    height="40"
                    style={{ width: 'auto' }}
                    className="relative block h-8 w-auto max-w-[168px] object-contain object-left align-middle sm:h-9 sm:max-w-[184px]"
                />
            </motion.div>
        </Link>
    );
}
