import { useState, useEffect } from 'react';
import { safeLocalStorageSet, safeLocalStorageGet } from '../lib/utils';

export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>(() => {
    return (safeLocalStorageGet('themeMode') as 'light' | 'dark' | 'auto') || 'auto';
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const hour = new Date().getHours();
      const isNight = hour >= 18 || hour < 6;
      const isDarkMode = 
        themeMode === 'dark' || 
        (themeMode === 'auto' && isNight);
      
      setIsDarkMode(isDarkMode);

      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    checkTheme();
    const interval = setInterval(checkTheme, 60000);
    return () => clearInterval(interval);
  }, [themeMode]);

  const toggleTheme = () => {
    const modes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
    safeLocalStorageSet('themeMode', nextMode);
  };

  return { themeMode, isDarkMode, toggleTheme };
};
