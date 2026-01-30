import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import IconButton from '@/components/ui/IconButton';

export interface ThemeToggleProps {
    isScrolled: boolean;
}

export function ThemeToggle({ isScrolled }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <IconButton
            onClick={toggleTheme}
            label={theme === 'dark' ? t.common.toggleLightMode : t.common.toggleDarkMode}
            className={cn(
                "relative overflow-hidden",
                isScrolled || theme === 'dark'
                    ? "hover:bg-gray-800/50"
                    : "hover:bg-gray-100"
            )}
            icon={
                <AnimatePresence mode="wait">
                    {theme === 'dark' ? (
                        <motion.div
                            key="sun"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Sun className="w-4 h-4 text-yellow-400" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="moon"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Moon className="w-4 h-4 text-violet-400" />
                        </motion.div>
                    )}
                </AnimatePresence>
            }
        />
    );
}
