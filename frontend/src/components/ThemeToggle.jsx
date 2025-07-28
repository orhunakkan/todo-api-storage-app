import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className='p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500'
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      data-testid="theme-toggle-btn"
    >
      {isDarkMode ? (
        <Sun className='h-5 w-5 text-yellow-500' data-testid="theme-icon-sun" />
      ) : (
        <Moon className='h-5 w-5 text-gray-700' data-testid="theme-icon-moon" />
      )}
    </button>
  );
};

export default ThemeToggle;
