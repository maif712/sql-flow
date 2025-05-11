import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isLight: boolean;
  isDark: boolean;
  isSystem: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem('theme-mode') as ThemeMode) || 'system'
  );
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    () =>
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode === 'system' ? systemTheme : mode);
  }, [mode, systemTheme]);

  const isDark = mode === 'dark' || (mode === 'system' && systemTheme === 'dark');
  const isLight = !isDark;
  const isSystem = mode === 'system';

  return (
    <ThemeContext.Provider value={{ mode, setMode, isLight, isDark, isSystem }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};