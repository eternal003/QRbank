'use client';

import { useEffect } from 'react';
import CopyButton from '@/components/CopyButton';
import BankAppButtons from '@/components/BankAppButtons';
import type { LinkData } from '@/lib/kv';

export default function TransferPageClient({ link }: { link: LinkData }) {
  useEffect(() => {
    // 최상위 html 및 body에 light 테마 속성을 적용하여 아이폰 세이프에어리어(다이나믹 아일랜드 & 홈바) 영역까지 실버-화이트 톤으로 꽉 차게 일치시킴
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');

    // iOS 테마 컬러 메타 태그를 동적으로 설정하여 상/하단 시스템 영역을 실버-화이트로 일치시킴
    let meta = document.querySelector('meta[name="theme-color"]');
    let originalThemeColor: string | null = null;
    if (meta) {
      originalThemeColor = meta.getAttribute('content');
      meta.setAttribute('content', '#f8f9fc');
    } else {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      meta.setAttribute('content', '#f8f9fc');
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
  }, []);
  return (
    <div className="public-page public-page--fullscreen" data-theme="light">
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
  );
}
