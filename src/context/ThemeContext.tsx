import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { colors, midnightColors } from '../theme';

export type AppTheme = 'porcelain' | 'midnight';
type ThemeContextValue = {
  theme: AppTheme;
  isMidnight: boolean;
  palette: typeof colors;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'rryda.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('porcelain');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'porcelain' || saved === 'midnight') setThemeState(saved);
      })
      .finally(() => setHydrated(true));
  }, []);

  const setTheme = (next: AppTheme) => {
    setThemeState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => undefined);
  };

  const value = useMemo(() => ({
    theme,
    isMidnight: theme === 'midnight',
    palette: theme === 'midnight' ? midnightColors : colors,
    toggleTheme: () => setTheme(theme === 'porcelain' ? 'midnight' : 'porcelain'),
    setTheme,
  }), [theme]);

  if (!hydrated) return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
