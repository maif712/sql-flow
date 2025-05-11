
import { useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem('theme-mode') as ThemeMode) || 'system'
  );
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    () => (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('theme-mode', mode);
    root.classList.remove('light', 'dark');
    
    if (mode === 'system') {
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }
  }, [mode, systemTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    mode,
    setMode,
    isLight: mode === 'light' || (mode === 'system' && systemTheme === 'light'),
    isDark: mode === 'dark' || (mode === 'system' && systemTheme === 'dark'),
    isSystem: mode === 'system'
  };
}
