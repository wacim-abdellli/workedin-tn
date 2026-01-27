import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
    className?: string;
}

function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
                relative p-2.5 rounded-xl transition-all duration-300
                bg-dark-100 dark:bg-dark-800
                hover:bg-dark-200 dark:hover:bg-dark-700
                text-dark-600 dark:text-dark-300
                hover:text-primary-600 dark:hover:text-primary-400
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                ${className}
            `}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={`
                        absolute inset-0 w-5 h-5 transition-all duration-300
                        ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
                    `}
                />
                <Moon
                    className={`
                        absolute inset-0 w-5 h-5 transition-all duration-300
                        ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
                    `}
                />
            </div>
        </button>
    );
}

export default ThemeToggle;
