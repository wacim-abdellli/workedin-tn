import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavigationProps {
    isScrolled: boolean;
    theme: string;
    items: Array<{
        to: string;
        icon: LucideIcon;
        label: string;
    }>;
}

export function Navigation({ isScrolled, theme, items }: NavigationProps) {
    return (
        <nav className="hidden 2xl:flex items-center gap-1">
            {items.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    isScrolled={isScrolled}
                    theme={theme}
                >
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );
}

interface NavLinkProps {
    to: string;
    icon: LucideIcon;
    children: React.ReactNode;
    isScrolled: boolean;
    theme: string;
}

function NavLink({ to, icon: Icon, children, isScrolled, theme }: NavLinkProps) {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={cn(
                "relative flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-all duration-200 rounded-xl group whitespace-nowrap",
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
}
