'use client';

import CopyButton from '@/components/CopyButton';
import BankAppButtons from '@/components/BankAppButtons';
import { useTheme } from '@/hooks/useTheme';
import type { LinkData } from '@/lib/kv';

export default function TransferPageClient({ link }: { link: LinkData }) {
  useTheme('light');

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
