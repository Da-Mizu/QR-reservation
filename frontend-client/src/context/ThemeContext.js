import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme_mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const darkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDark(darkMode);
    applyTheme(darkMode);
    setIsLoaded(true);
  }, []);

  // Apply theme to DOM
  const applyTheme = useCallback((dark) => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-mode');
    }
  }, []);

  // Toggle and save theme
  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newDark = !prev;
      localStorage.setItem('theme_mode', newDark ? 'dark' : 'light');
      applyTheme(newDark);
      return newDark;
    });
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
