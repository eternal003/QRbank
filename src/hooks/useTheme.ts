'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * 페이지 진입 시 테마를 설정하고, 버튼으로 테마를 바꿀 수 있도록 상태와 함수를 반환합니다.
 */
export function useTheme(initialTheme: 'light' | 'dark' | 'system' = 'system') {
  const [theme, setTheme] = useState(initialTheme);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      const activeTheme = isDark ? 'dark' : 'light';
      setCurrentMode(activeTheme);
      document.documentElement.setAttribute('data-theme', activeTheme);
      document.body.setAttribute('data-theme', activeTheme);

      const themeColor = activeTheme === 'light' ? '#f8f9fc' : '#121214';

      let meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', themeColor);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        meta.setAttribute('content', themeColor);
        document.head.appendChild(meta);
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      
      return () => {
        mediaQuery.removeEventListener('change', handler);
      };
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'system') {
        return currentMode === 'light' ? 'dark' : 'light';
      }
      return prev === 'light' ? 'dark' : 'light';
    });
  }, [currentMode]);

  return { theme, currentMode, toggleTheme };
}
