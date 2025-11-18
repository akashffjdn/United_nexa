import { useState, useEffect } from 'react';
import { Menu, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Header = ({ setIsSidebarOpen }: HeaderProps) => {
  const navigate = useNavigate();

  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<string>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Effect to apply theme class and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    navigate('/logout');
  };

  return (
    <header className="flex-shrink-0 h-16 bg-background shadow-md z-10 transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        {/* Mobile-only Hamburger Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu size={22} />
        </button>

        {/* Desktop-only Title (or breadcrumbs) */}
        <div className="hidden md:block">
          {/* <h1 className="text-xl font-semibold text-foreground">
            Admin Dashboard
          </h1> */}
        </div>

        {/* Right-side items */}
        <div className="flex items-center space-x-4">
          
          {/* Theme Toggle Button (Added to the left of Logout) */}
          <button
            onClick={toggleTheme}
            className="flex items-center p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center text-muted-foreground hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
            <span className="ml-2 text-sm font-medium hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};