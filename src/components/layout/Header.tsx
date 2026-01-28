import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Menu, X, Bell, User, LogOut, Settings,
    Briefcase, MessageSquare, Heart, TrendingUp,
    Command, Clock, Sparkles, Moon, Sun, Globe
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '../../i18n';
import { cn } from '@/lib/utils';
import logoIcon from '/logo-icon.png';
import logoText from '/logo-text.png';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const { user, profile, signOut } = useAuth();
    const { theme } = useTheme();
    const { t, language, setLanguage } = useTranslation();
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchOpen(false);
            }
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setLangMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') setSearchOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const recentSearches = [
        t.search.suggestions.mobileApp,
        t.search.suggestions.logo,
        t.search.suggestions.seo
    ];
    const trendingSkills = [
        t.search.suggestions.logoDesign,
        t.search.suggestions.reactJs,
        t.search.suggestions.translation,
        t.search.suggestions.videoEditing,
        t.search.suggestions.python
    ];

    return (
        <>
            <header className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                isScrolled
                    ? 'backdrop-blur-2xl bg-gray-900/80 shadow-lg border-b border-gray-800/50'
                    : 'bg-transparent'
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20 gap-4 lg:gap-8">

                        {/* Left Side: Logo & Navigation */}
                        <div className="flex items-center gap-8 lg:gap-14">
                            {/* Logo with Badge */}
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
                                            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">
                                                TN
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>


                            {/* Desktop Navigation */}
                            <nav className="hidden xl:flex items-center gap-1">
                                <NavLink to="/jobs" icon={Briefcase} isScrolled={isScrolled} theme={theme}>{t.nav.findWork}</NavLink>
                                <NavLink to="/find-freelancers" icon={User} isScrolled={isScrolled} theme={theme}>{t.nav.findFreelancers}</NavLink>
                                <NavLink to="/how-it-works" icon={TrendingUp} isScrolled={isScrolled} theme={theme}>{t.nav.howItWorks}</NavLink>
                            </nav>
                        </div>

                        {/* Enhanced Search Bar */}
                        <div className="hidden md:flex flex-1 max-w-lg mx-auto px-4" ref={searchRef}>
                            <div className="relative">
                                <button
                                    onClick={() => setSearchOpen(true)}
                                    className={cn(
                                        "group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                                        "bg-gray-800/50 backdrop-blur-sm border border-gray-700/50",
                                        "hover:bg-gray-800/80 hover:border-violet-500/50",
                                        isScrolled || theme === 'dark' ? "text-gray-400" : "text-gray-600"
                                    )}
                                >
                                    <Search className="w-4 h-4 flex-shrink-0 text-gray-500 group-hover:text-violet-400 transition-colors" />
                                    <span className="flex-1 text-sm group-hover:text-gray-300 transition-colors">
                                        {t.search.placeholder}
                                    </span>
                                    <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded border border-gray-600/50 group-hover:border-violet-500/30 transition-colors">
                                        <Command className="w-3 h-3" />
                                        <span className="text-xs">K</span>
                                    </div>
                                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/10 to-indigo-600/10" />
                                    </div>
                                </button>

                                {/* Search Modal - IMPROVED */}
                                <AnimatePresence>
                                    {searchOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute top-full left-0 right-0 mt-3 w-full min-w-[400px] backdrop-blur-2xl bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
                                        >
                                            {/* Input Section */}
                                            <div className="p-4 border-b border-gray-700/50">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder={t.search.placeholder}
                                                        autoFocus
                                                        className="w-full pl-12 pr-12 py-3.5 bg-gray-800/50 rounded-xl border border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white placeholder-gray-500 transition-all font-sans"
                                                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                                                    />
                                                    {searchQuery && (
                                                        <button
                                                            onClick={() => setSearchQuery('')}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                                                        >
                                                            <X className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="max-h-[500px] overflow-y-auto">
                                                {!searchQuery && (
                                                    <div className="p-4 space-y-6">
                                                        {/* Recent Searches */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3 px-2">
                                                                <Clock className="w-4 h-4 text-gray-500" />
                                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                                    {t.search.recent}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {recentSearches.map((search) => (
                                                                    <button
                                                                        key={search}
                                                                        onClick={() => {
                                                                            setSearchQuery(search);
                                                                            navigate(`/search?q=${search}`);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 rounded-xl transition-colors text-left group"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-violet-600/20 transition-colors">
                                                                            <Clock className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                                                                        </div>
                                                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                                                            {search}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Trending */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3 px-2">
                                                                <TrendingUp className="w-4 h-4 text-gray-500" />
                                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                                    {t.search.trending}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {trendingSkills.map((skill) => (
                                                                    <button
                                                                        key={skill}
                                                                        onClick={() => {
                                                                            setSearchQuery(skill);
                                                                            navigate(`/search?q=${skill}`);
                                                                        }}
                                                                        className="px-4 py-2 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 text-violet-400 text-sm font-medium rounded-xl border border-violet-500/30 hover:border-violet-500/50 transition-all font-sans"
                                                                    >
                                                                        {skill}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {searchQuery && (
                                                    <div className="px-4 pb-4">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 p-4">
                                                            {t.search.resultsFor} "{searchQuery}"...
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50">
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex items-center gap-1.5">
                                                            <kbd className="px-2 py-1 bg-gray-700 text-gray-300 rounded border border-gray-600 font-mono text-xs">↑↓</kbd>
                                                            <span>{t.common.navigate}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <kbd className="px-2 py-1 bg-gray-700 text-gray-300 rounded border border-gray-600 font-mono text-xs">↵</kbd>
                                                            <span>{t.common.select}</span>
                                                        </span>
                                                    </div>
                                                    <span className="flex items-center gap-1.5">
                                                        <kbd className="px-2 py-1 bg-gray-700 text-gray-300 rounded border border-gray-600 font-mono text-xs">esc</kbd>
                                                        <span>{t.common.close}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                            {/* Language Switcher */}
                            <div className="relative" ref={langRef}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                                    className={cn(
                                        "flex items-center gap-2 p-2 rounded-xl transition-colors",
                                        isScrolled || theme === 'dark'
                                            ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    )}
                                    aria-label="Change language"
                                >
                                    <Globe className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase">{language}</span>
                                </motion.button>

                                <AnimatePresence>
                                    {langMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-32 backdrop-blur-xl bg-gray-900/95 rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden z-[60]"
                                        >
                                            <div className="p-1">
                                                {[
                                                    { code: 'ar', name: 'العربية' },
                                                    { code: 'fr', name: 'Français' },
                                                    { code: 'en', name: 'English' }
                                                ].map((lang) => (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => {
                                                            setLanguage(lang.code as any);
                                                            setLangMenuOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full px-3 py-2 text-sm rounded-lg text-left transition-colors",
                                                            language === lang.code
                                                                ? "bg-violet-600/20 text-violet-400 font-bold"
                                                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                                        )}
                                                        dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                                                    >
                                                        {lang.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Theme Toggle */}
                            <ThemeToggle isScrolled={isScrolled} />

                            {user ? (
                                <>
                                    <button className="relative p-2 hover:bg-gray-800/50 rounded-xl transition-colors">
                                        <Bell className="w-5 h-5 text-gray-400" />
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-gray-900" />
                                    </button>

                                    {/* User Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2 transition-colors"
                                        >
                                            <img
                                                src={profile?.avatar_url || user.user_metadata?.avatar_url || '/default-avatar.png'}
                                                alt={profile?.full_name || user.email}
                                                className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500"
                                            />
                                            <span className="hidden lg:block font-medium text-gray-900 dark:text-white text-sm">
                                                {profile?.full_name || user.email?.split('@')[0]}
                                            </span>
                                        </button>
                                        <AnimatePresence>
                                            {userMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute right-0 mt-2 w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-[60]"
                                                >
                                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                                        <p className="font-semibold text-gray-900 dark:text-white">{profile?.full_name || user.email}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                                    </div>

                                                    <div className="py-2">
                                                        <UserMenuItem icon={User} to="/dashboard">{t.nav.dashboard}</UserMenuItem>
                                                        <UserMenuItem icon={Briefcase} to="/my-jobs">{t.nav.myJobs}</UserMenuItem>
                                                        <UserMenuItem icon={MessageSquare} to="/messages">{t.nav.messages}</UserMenuItem>
                                                        <UserMenuItem icon={Heart} to="/saved">{t.nav.saved}</UserMenuItem>
                                                        <UserMenuItem icon={Settings} to="/settings">{t.nav.settings}</UserMenuItem>
                                                    </div>

                                                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                                                        <button
                                                            onClick={signOut}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                        >
                                                            <LogOut className="w-4 h-4" />
                                                            <span>{t.nav.logout}</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className={cn(
                                            "hidden sm:flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200 rounded-xl group whitespace-nowrap",
                                            isScrolled || theme === 'dark'
                                                ? "text-gray-200 hover:text-white hover:bg-gray-800/50"
                                                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                        )}
                                    >
                                        <User className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span>{t.nav.login}</span>
                                    </Link>

                                    {/* Enhanced Sign Up */}
                                    <Link to="/signup">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="relative group"
                                        >
                                            <motion.div
                                                className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur-lg opacity-50"
                                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                            <div className="relative px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg">
                                                {t.nav.signup}
                                            </div>
                                        </motion.button>
                                    </Link>
                                </>
                            )}



                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className={cn(
                                    "lg:hidden p-2 rounded-xl transition-colors",
                                    isScrolled || theme === 'dark'
                                        ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                )}
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Gradient line */}
                {isScrolled && (
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent"
                    />
                )}
                {/* Mobile Menu Content to be re-added if needed, for now sticking to the simplified structure requested in refinement guide but need to ensure mobile menu functions */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700"
                        >
                            <div className="px-4 py-6 space-y-2">
                                {/* Mobile Search */}
                                <div className="mb-4">
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            setSearchOpen(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-left"
                                    >
                                        <Search className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-400">{t.search.placeholder}</span>
                                    </button>
                                </div>

                                <MobileNavLink to="/jobs" icon={Briefcase}>{t.nav.findWork}</MobileNavLink>
                                <MobileNavLink to="/find-freelancers" icon={User}>{t.nav.findFreelancers}</MobileNavLink>
                                <MobileNavLink to="/how-it-works" icon={TrendingUp}>{t.nav.howItWorks}</MobileNavLink>

                                {/* Post a Job - Mobile only now */}
                                <Link to="/post-job" onClick={() => setMobileMenuOpen(false)}>
                                    <div className="mt-4 flex items-center gap-3 p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg">
                                        <Briefcase className="w-5 h-5" />
                                        <span>{t.hero.ctaClient}</span>
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <div className="h-16 lg:h-20" />
        </>
    );
}

// Enhanced NavLink Component
const NavLink = ({ to, icon: Icon, children, isScrolled, theme }: any) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={cn(
                "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-xl group whitespace-nowrap",
                isActive
                    ? "text-violet-400 bg-violet-600/10"
                    : isScrolled || theme === 'dark'
                        ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
        >
            {isActive && (
                <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-violet-600/10 rounded-xl border border-violet-500/30"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <div className="relative flex items-center gap-2">
                <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>{children}</span>
            </div>
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
            />
        </Link>
    );
};

// Theme Toggle Component
const ThemeToggle = ({ isScrolled }: { isScrolled: boolean }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
                "p-2 rounded-xl transition-colors relative overflow-hidden",
                isScrolled || theme === 'dark'
                    ? "hover:bg-gray-800/50"
                    : "hover:bg-gray-100"
            )}
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                    <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Sun className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Moon className="w-5 h-5 text-violet-400" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

const UserMenuItem = ({ to, icon: Icon, children }: any) => (
    <Link
        to={to}
        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
    >
        <Icon className="w-4 h-4" />
        <span>{children}</span>
    </Link>
);

const MobileNavLink = ({ to, icon: Icon, children }: any) => (
    <Link
        to={to}
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
    >
        <Icon className="w-5 h-5 text-violet-600" />
        <span className="font-medium text-gray-900 dark:text-white">{children}</span>
    </Link>
);
