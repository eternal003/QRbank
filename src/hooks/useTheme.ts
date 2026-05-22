'use client';

import { useEffect } from 'react';

/**
 * 페이지 진입 시 테마를 설정하고, 언마운트 시 원래 상태로 복원하는 훅.
 * iOS 세이프에리어(다이나믹 아일랜드 & 홈바) 영역까지 테마 컬러를 일치시킴.
 */
export function useTheme(theme: 'light' | 'dark' = 'light') {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    const themeColor = theme === 'light' ? '#f8f9fc' : '#0a0a0f';

    let meta = document.querySelector('meta[name="theme-color"]');
    let originalThemeColor: string | null = null;
    if (meta) {
      originalThemeColor = meta.getAttribute('content');
      meta.setAttribute('content', themeColor);
    } else {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      meta.setAttribute('content', themeColor);
      document.head.appendChild(meta);
    }

    return () => {
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
      if (meta) {
        if (originalThemeColor) {
          meta.setAttribute('content', originalThemeColor);
        } else {
          meta.remove();
        }
      }
    };
  }, [theme]);
}
