import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthButtonsProps {
    isScrolled: boolean;
    theme: string;
    t: {
        nav: {
            login: string;
            signup: string;
        };
    };
}

export function AuthButtons({ isScrolled, theme, t }: AuthButtonsProps) {
    return (
        <>
            <Link
                to="/login"
                className={cn(
                    "hidden sm:flex items-center gap-2 px-3 py-2 font-medium transition-all duration-200 rounded-xl group whitespace-nowrap",
                    isScrolled || theme === 'dark'
                        ? "text-gray-200 hover:text-white hover:bg-gray-800/50"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                )}
            >
                <User className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>{t.nav.login}</span>
            </Link>

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
                    <div className="relative px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg">
                        {t.nav.signup}
                    </div>
                </motion.button>
            </Link>
        </>
    );
}
