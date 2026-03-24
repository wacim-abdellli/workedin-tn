import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { UserMenu } from './UserMenu';
import { AuthButtons } from './AuthButtons';
import { MobileMenu } from './MobileMenu';
import AccountPanel from '../AccountPanel';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [accountPanelOpen, setAccountPanelOpen] = useState(false);
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
        { to: '/jobs', icon: Briefcase, label: 'Find Work' },
        { to: '/my-proposals', icon: FileText, label: 'Proposals' },
        { to: '/contracts', icon: ClipboardList, label: 'Contracts' },
        { to: '/freelancer/earnings', icon: Wallet, label: 'Earnings' },
    ] : [
        { to: '/jobs/new', icon: Plus, label: 'Post Project' },
        { to: '/client/jobs', icon: FolderOpen, label: 'My Projects' },
        { to: '/find-freelancers', icon: Users, label: 'Freelancers' },
        { to: '/contracts', icon: ClipboardList, label: 'Contracts' },
    ];

    const publicNavItems = [
        { to: '/jobs', icon: Briefcase, label: 'Find Work' },
        { to: '/find-freelancers', icon: Users, label: 'Find Freelancers' },
        { to: '/how-it-works', icon: FileText, label: 'How It Works' },
    ];

    const activeNavItems = user ? navItems : publicNavItems;

    return (
        <>
            <div className={cn(
                "fixed top-0 left-0 right-0 h-[2px] z-[60] transition-opacity duration-300", 
                isFreelancer ? 'bg-purple-500' : 'bg-amber-500',
                isScrolled ? 'opacity-0' : 'opacity-100'
            )} />
            <header ref={headerRef} className={cn(
                'fixed z-[50] transition-all duration-500 will-change-transform',
                isScrolled
                    ? 'top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[1200px] rounded-[32px] backdrop-blur-xl bg-white/70 dark:bg-[#0f0e17]/70 border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] h-16'
                    : 'top-0 left-0 right-0 w-full bg-white dark:bg-[#0f0e17] border-b border-gray-100 dark:border-white/5 h-16'
            )}>
                <div className={cn(
                    "mx-auto h-full flex items-center justify-between gap-6 transition-all duration-500",
                    isScrolled ? "px-6 w-full" : "px-6 max-w-[1280px] w-full"
                )}>
                    
                    {/* LEFT: Logo */}
                    <div className="flex flex-shrink-0 items-center min-w-[140px]">
                        <Logo language={language} />
                    </div>

                    {/* CENTER: Nav items */}
                    <nav className="hidden lg:flex flex-1 items-center justify-center min-w-0">
                        <Navigation items={activeNavItems} accentClass={accentClass} />
                    </nav>

                    {/* RIGHT: Actions */}
                    <div className="flex flex-shrink-0 items-center justify-end gap-1.5 lg:gap-2.5 min-w-[140px]">
                        {user ? (
                            <SearchModal isScrolled={isScrolled} theme={theme} language={language} t={t} />
                        ) : null}

                        <div className="hidden lg:block">
                            <LanguageSwitcher
                                isScrolled={isScrolled}
                                theme={theme}
                                language={language}
                                setLanguage={setLanguage}
                            />
                        </div>
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
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-expanded={mobileMenuOpen}
                            className="p-1.5 rounded-lg md:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

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
                    headerHeight={60}
                    user={user}
                    profile={profile}
                    signOut={signOut}
                    onClose={() => setAccountPanelOpen(false)}
                />
            ) : null}

            {/* Spacer */}
            <div className="h-16" />
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
            <img
                src={logoSrc}
                alt={language === 'ar' ? 'خدمة TN' : 'Khedma TN'}
                className="block h-7 w-auto object-contain object-left align-middle"
            />
        </Link>
    );
}
