'use client';

import { useState, useEffect } from 'react';
import CopyButton from '@/components/CopyButton';
import BankAppButtons from '@/components/BankAppButtons';
import { useTheme } from '@/hooks/useTheme';
import type { LinkData } from '@/lib/kv';

export default function TransferPageClient({ link }: { link: LinkData }) {
  useTheme('light');

  const [isRevealing, setIsRevealing] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // 1.2초 동안 로딩 화면을 보여준 뒤 원형 애니메이션 시작
    const revealTimer = setTimeout(() => {
      setIsRevealing(true);

      // 애니메이션(0.8초)이 끝나면 로딩 화면 요소 자체를 DOM에서 제거
      const cleanupTimer = setTimeout(() => {
        setShowLoading(false);
      }, 800);

      return () => clearTimeout(cleanupTimer);
    }, 1200);

    return () => clearTimeout(revealTimer);
  }, []);

  return (
    <>
      {/* Loading Screen Overlay */}
      {showLoading && (
        <div className="loading-screen-overlay" data-theme="light">
          <div className="loading-screen-content">
            <svg className="loading-screen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <div className="loading-screen-text">로딩중 . . . </div>
          </div>
        </div>
      )}

      {/* Main Content with Circular Reveal Mask */}
      <div
        className={`public-page public-page--fullscreen ${isRevealing ? 'page-reveal' : 'page-hidden'}`}
        data-theme="light"
        style={{ position: 'relative', zIndex: 20 }}
      >
        {/* Holographic Light Background */}
        <div className="hologram-bg">
          <div className="hologram-bg__blob hologram-bg__blob--1"></div>
          <div className="hologram-bg__blob hologram-bg__blob--2"></div>
          <div className="hologram-bg__blob hologram-bg__blob--3"></div>
        </div>

        <div className="transfer-layout hologram-glass">
          {/* Premium Decorated Header */}
          <div className="transfer-header animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <div className="transfer-header__content">
              <h1 className="transfer-header__title">
                <span className="transfer-header__name" style={{
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 800
                }}>{link.accountHolder}</span>님 입금계좌
              </h1>
              <p className="transfer-header__subtitle">계좌번호 복사 후 은행 앱을 선택해 바로 송금하세요.</p>
            </div>
          </div>

          {/* Account Info & Copy */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CopyButton
              text={link.accountNumber}
              bankName={link.bankName}
              accountHolder={link.accountHolder}
            />
          </div>

          {/* Bank App Buttons - fills remaining space */}
          <div className="transfer-banks animate-slide-up" style={{ animationDelay: '0.2s' }}>
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
