import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    Menu, X, Briefcase, FolderOpen, 
    FileText, ClipboardList, Wallet, Users, PlusCircle 
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

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

    const { isFreelancer } = useWorkspace();

    const FREELANCER_NAV = [
        { label: 'Find Work', icon: Briefcase, href: '/jobs' },
        { label: 'Proposals', icon: FileText, href: '/my-proposals' },
        { label: 'Contracts', icon: ClipboardList, href: '/contracts' },
        { label: 'Earnings', icon: Wallet, href: '/freelancer/earnings' },
    ] as const;

    const CLIENT_NAV = [
        { label: 'Post Project', icon: PlusCircle, href: '/jobs/new' },
        { label: 'My Projects', icon: FolderOpen, href: '/client/jobs' },
        { label: 'Freelancers', icon: Users, href: '/find-freelancers' },
        { label: 'Contracts', icon: ClipboardList, href: '/contracts' },
    ] as const;

    const publicNavItems = [
        { label: 'Find Work', icon: Briefcase, href: '/jobs' },
        { label: 'Find Freelancers', icon: Users, href: '/find-freelancers' },
        { label: 'How It Works', icon: FileText, href: '/how-it-works' },
    ] as const;

    const navItems = user 
        ? (isFreelancer ? FREELANCER_NAV : CLIENT_NAV) 
        : publicNavItems;

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
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                    alignItems: 'center',
                    gap: '24px',
                    height: '100%',
                    padding: '0 24px',
                    maxWidth: '1280px',
                    margin: '0 auto',
                }}>
                    
                    {/* Zone 1: Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <Logo language={language} />
                    </div>

                    {/* Zone 2: Nav — centered and responsive */}
                    <nav className="hidden lg:flex items-center justify-center gap-1">
                        {navItems.map(({ label, icon: Icon, href }) => (
                            <NavLink 
                                key={href} 
                                to={href}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold tracking-tight whitespace-nowrap transition-all duration-300",
                                        isActive
                                            ? isFreelancer
                                                ? 'bg-purple-600/15 text-purple-400 shadow-[inset_0_0_12px_rgba(139,92,246,0.1)]'
                                                : 'bg-amber-600/15 text-amber-400 shadow-[inset_0_0_12px_rgba(245,158,11,0.1)]'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                    )
                                }
                            >
                                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Zone 3: Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        {user ? (
                            <SearchModal isScrolled={isScrolled} theme={theme} language={language} t={t} />
                        ) : null}

                        <div className="hidden sm:flex items-center gap-2 border-l border-gray-200 dark:border-white/10 pl-4 ml-2">
                            <LanguageSwitcher
                                isScrolled={isScrolled}
                                theme={theme}
                                language={language}
                                setLanguage={setLanguage}
                            />
                            <ThemeToggle isScrolled={isScrolled} />
                        </div>

                        {user ? (
                            <div className="ml-2 pl-2 border-l border-gray-200 dark:border-white/10">
                                <UserMenu
                                    user={user}
                                    profile={profile}
                                    isOpen={accountPanelOpen}
                                    onToggle={() => setAccountPanelOpen(!accountPanelOpen)}
                                />
                            </div>
                        ) : (
                            <AuthButtons isScrolled={isScrolled} theme={theme} t={t} />
                        )}
                        
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={cn(
                                "xl:hidden ml-2 p-2 rounded-lg transition-colors",
                                theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-100"
                            )}
                            aria-label="Toggle menu"
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
