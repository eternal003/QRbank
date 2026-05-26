'use client';

import { useState, useEffect } from 'react';
import CopyButton from '@/components/CopyButton';
import BankAppButtons from '@/components/BankAppButtons';
import { useTheme } from '@/hooks/useTheme';
import type { LinkData } from '@/lib/kv';

export default function TransferPageClient({ link }: { link: LinkData }) {
  const { currentMode, toggleTheme } = useTheme('system');

  const [showLoading, setShowLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    // 1초 동안 미니멀 로딩 화면을 보여줍니다.
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true); // 로딩창이 부드럽게 투명해지기 시작
      setIsRevealing(true); // 동시에 뒤에서 항목들이 하나씩 올라오기 시작

      // 0.4초 뒤 로딩창이 완전히 안보이면 DOM에서 삭제
      const cleanupTimer = setTimeout(() => {
        setShowLoading(false);
      }, 400);

      return () => clearTimeout(cleanupTimer);
    }, 1000);

    return () => clearTimeout(fadeTimer);
  }, []);

  return (
    <>
      {/* Minimal Loading Screen Overlay */}
      {showLoading && (
        <div className={`loading-screen-overlay ${isFadingOut ? 'fade-out' : ''}`}>
          <div className="loading-screen-content">
            <svg className="loading-screen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>

          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="public-page public-page--fullscreen">
        {/* Floating Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label="Toggle Dark Mode"
        >
          {currentMode === 'light' ? (
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          ) : (
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          )}
        </button>
        {/* Holographic Light Background */}
        <div className="hologram-bg">
          <div className="hologram-bg__blob hologram-bg__blob--1"></div>
          <div className="hologram-bg__blob hologram-bg__blob--2"></div>
          <div className="hologram-bg__blob hologram-bg__blob--3"></div>
        </div>

        {/* The reveal-content class triggers the stagger animations inside */}
        <div className={`transfer-layout hologram-glass ${isRevealing ? 'reveal-content' : ''}`}>

          {/* Premium Decorated Header (stagger-1) */}
          <div className="transfer-header stagger-item stagger-1">
            <div className="transfer-header__content">
              <h1 className="transfer-header__title">
                <span className="transfer-header__name" style={{
                  fontWeight: 800
                }}>{link.accountHolder}</span>님 입금계좌
              </h1>
              <p className="transfer-header__subtitle">계좌번호 복사 후 은행 앱을 선택해 바로 송금하세요.</p>
            </div>
          </div>

          {/* Account Info & Copy (stagger-2) */}
          <div className="stagger-item stagger-2">
            <CopyButton
              text={link.accountNumber}
              bankName={link.bankName}
              accountHolder={link.accountHolder}
            />
          </div>

          {/* Bank App Buttons (stagger-3) */}
          <div className="transfer-banks stagger-item stagger-3">
            <BankAppButtons
              bankName={link.bankName}
              accountNumber={link.accountNumber}
              kakaoPayUrl={link.kakaoPayUrl}
            />
          </div>

        </div>
      </div>
    </>
  );
}
