import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  theme: ThemeMode;
  themeMode: ThemeMode; // Alias for seamless compatibility
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  setThemeMode: (theme: ThemeMode) => void; // Alias for seamless compatibility
  toggleTheme: () => void;
}

const STORAGE_KEY_THEME = 'rryda_theme';

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}> = ({ children, defaultTheme }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (defaultTheme) return defaultTheme;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch {
      // Fallback if storage access is restricted
    }
    return 'light';
  });

  // Apply class-based dark mode and smooth transition animation defined in index.css
  useEffect(() => {
    const root = document.documentElement;

    // Ensure .theme-transition is present on root to utilize index.css transition animations
    if (!root.classList.contains('theme-transition')) {
      root.classList.add('theme-transition');
    }

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // Storage write error handling
    }
  }, [theme]);

  // Listen to system color scheme changes if user hasn't overridden
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const hasSaved = localStorage.getItem(STORAGE_KEY_THEME);
        if (!hasSaved) {
          setThemeState(e.matches ? 'dark' : 'light');
        }
      } catch {
        // Storage access error
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode: theme,
        isDark,
        setTheme,
        setThemeMode: setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
