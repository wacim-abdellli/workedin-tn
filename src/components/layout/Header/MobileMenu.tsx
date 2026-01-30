import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Briefcase, User, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSearchOpen: () => void;
    t: {
        nav: {
            findWork: string;
            findFreelancers: string;
            howItWorks: string;
        };
        search: {
            placeholder: string;
        };
        hero: {
            ctaClient: string;
        };
    };
}

export function MobileMenu({ isOpen, onClose, onSearchOpen, t }: MobileMenuProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="2xl:hidden backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700"
                >
                    <div className="px-4 py-6 space-y-2">
                        {/* Mobile Search */}
                        <div className="mb-4">
                            <button
                                onClick={() => {
                                    onClose();
                                    onSearchOpen();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-left"
                            >
                                <Search className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-400">{t.search.placeholder}</span>
                            </button>
                        </div>

                        <MobileNavLink to="/jobs" icon={Briefcase} onClick={onClose}>
                            {t.nav.findWork}
                        </MobileNavLink>
                        <MobileNavLink to="/find-freelancers" icon={User} onClick={onClose}>
                            {t.nav.findFreelancers}
                        </MobileNavLink>
                        <MobileNavLink to="/how-it-works" icon={TrendingUp} onClick={onClose}>
                            {t.nav.howItWorks}
                        </MobileNavLink>

                        {/* Post a Job - Mobile only */}
                        <Link to="/post-job" onClick={onClose}>
                            <div className="mt-4 flex items-center gap-3 p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg">
                                <Briefcase className="w-5 h-5" />
                                <span>{t.hero.ctaClient}</span>
                            </div>
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

interface MobileNavLinkProps {
    to: string;
    icon: LucideIcon;
    children: React.ReactNode;
    onClick?: () => void;
}

function MobileNavLink({ to, icon: Icon, children, onClick }: MobileNavLinkProps) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
        >
            <Icon className="w-5 h-5 text-violet-600" />
            <span className="font-medium text-gray-900 dark:text-white">{children}</span>
        </Link>
    );
}
