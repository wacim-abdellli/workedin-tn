import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Briefcase, User, TrendingUp, Sparkles } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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

import logoIcon from '/logo-icon.png';
import logoText from '/logo-text.png';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, profile, signOut } = useAuth();
    const { theme } = useTheme();
    const { t, language, setLanguage } = useTranslation();

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { to: '/jobs', icon: Briefcase, label: t.nav.findWork },
        { to: '/find-freelancers', icon: User, label: t.nav.findFreelancers },
        { to: '/how-it-works', icon: TrendingUp, label: t.nav.howItWorks },
    ];

    return (
        <>
            <header className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                isScrolled
                    ? theme === 'dark'
                        ? 'backdrop-blur-xl bg-[#0f0e17]/80 shadow-sm border-b border-white/[0.05]'
                        : 'backdrop-blur-xl bg-white/80 shadow-sm border-b border-gray-200/50'
                    : 'bg-transparent'
            )}>
                <div className="max-w-7xl 2xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20 gap-2 lg:gap-4">
                        {/* Left: Logo & Navigation */}
                        <div className="flex items-center gap-2 lg:gap-6">
                            <Logo isScrolled={isScrolled} theme={theme} />
                            <Navigation isScrolled={isScrolled} theme={theme} items={navItems} />
                        </div>

                        {/* Center: Search */}
                        {/* Center: Search or Guest CTA */}
                        {user ? (
                            <SearchModal isScrolled={isScrolled} theme={theme} language={language} t={t} />
                        ) : (
                            <Link
                                to="/jobs"
                                className={cn(
                                    "hidden md:flex flex-1 max-w-md mx-auto items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                                    "bg-white/70 dark:bg-white/[0.05] border border-primary-200/50 dark:border-primary-500/20 backdrop-blur-md",
                                    "hover:bg-white dark:hover:bg-white/10 hover:border-primary-300 dark:hover:border-primary-400/30",
                                    isScrolled || theme === 'dark' ? "text-[#6b6880]" : "text-[#3d3a4e]"
                                )}
                            >
                                <Briefcase className="w-4 h-4 text-violet-500" />
                                <span className={cn(
                                    "flex-1 text-sm font-medium text-left truncate",
                                    isScrolled || theme === 'dark' ? "text-[#c4b5fd]" : "text-[#3d3a4e]"
                                )}>
                                    {t.nav.findWork}
                                </span>
                            </Link>
                        )}

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                            <LanguageSwitcher
                                isScrolled={isScrolled}
                                theme={theme}
                                language={language}
                                setLanguage={setLanguage}
                            />
                            <ThemeToggle isScrolled={isScrolled} />

                            {user ? (
                                <UserMenu user={user} profile={profile} signOut={signOut} t={t} />
                            ) : (
                                <AuthButtons isScrolled={isScrolled} theme={theme} t={t} />
                            )}

                            {/* Mobile Menu Toggle */}
                            <IconButton
                                icon={mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                label={mobileMenuOpen ? t.common.closeMenu : t.common.openMenu}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                isActive={mobileMenuOpen}
                                size="sm"
                                className={cn(
                                    "2xl:hidden",
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
                    onSearchOpen={() => { }}
                    t={t}
                />
            </header>

            {/* Spacer */}
            <div className="h-16 lg:h-20" />
        </>
    );
}

// Logo subcomponent (kept inline as it's small and specific)
function Logo({ isScrolled, theme }: { isScrolled: boolean; theme: string }) {
    return (
        <Link to="/" className="flex items-center group relative z-10 -ml-3">
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-12 h-12 lg:w-16 lg:h-16 flex-shrink-0"
            >
                <div className="absolute -inset-3 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src={logoIcon} alt="Khedma.tn" className="w-full h-full object-contain relative" />
            </motion.div>

            <div className="hidden md:block">
                <div className="flex items-center -ml-4 lg:-ml-6">
                    <img
                        src={logoText}
                        alt="Khedma.tn"
                        className={cn(
                            "h-10 lg:h-14 w-auto object-contain transition-all duration-300",
                            isScrolled || theme === 'dark' ? "brightness-0 invert" : "brightness-0"
                        )}
                    />
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-violet-600/10 rounded-full border border-violet-500/20 whitespace-nowrap -mt-8 lg:-mt-10 ml-0 relative z-10 shadow-lg scale-90">
                        <Sparkles className="w-3 h-3 text-violet-500" />
                        <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">TN</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
