'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BANKS } from '@/lib/banks';
import { copyToClipboard } from '@/lib/utils';

interface BankAppButtonsProps {
  bankName: string;
  accountNumber: string;
  kakaoPayUrl?: string;
  currentMode?: 'light' | 'dark';
}

// Featured apps (displayed as large prominent buttons)
const FEATURED_CODES = ['toss', 'kakaopay'];

export default function BankAppButtons({ bankName, accountNumber, kakaoPayUrl, currentMode = 'light' }: BankAppButtonsProps) {
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const featuredBanks = useMemo(() => BANKS.filter((b) => {
    if (b.code === 'kakaopay' && !kakaoPayUrl) return false;
    return FEATURED_CODES.includes(b.code);
  }), [kakaoPayUrl]);
  const otherBanks = useMemo(() => BANKS.filter((b) => {
    if (b.code === 'kakaopay' && !kakaoPayUrl) return false;
    return !FEATURED_CODES.includes(b.code);
  }), [kakaoPayUrl]);

  const [fallbackStoreUrl, setFallbackStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => {
      clearTimeout(timer);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleBankClick = useCallback(
    async (bank: (typeof BANKS)[number]) => {
      setFallbackStoreUrl(null); // Reset fallback on new click
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isAndroid = /Android/i.test(userAgent);

      // 1. 카카오페이 사용자 정의 링크가 있는 경우 (예외적으로 바로 이동)
      if (bank.code === 'kakaopay' && kakaoPayUrl) {
        window.location.href = kakaoPayUrl;
        return;
      }

      // 2. 토스: 딥링크로 직접 송금 화면 연결
      if (bank.code === 'toss') {
        const cleanAccountNo = accountNumber.replace(/[^0-9]/g, '');
        if (isAndroid) {
          // 안드로이드 크롬/삼성 인터넷용 안전한 Intent 스키마 적용
          const tossIntent = `intent://send?bank=${encodeURIComponent(bankName)}&accountNo=${cleanAccountNo}#Intent;scheme=supertoss;package=viva.republica.toss;end`;
          window.location.href = tossIntent;
        } else {
          const tossUrl = `supertoss://send?bank=${encodeURIComponent(bankName)}&accountNo=${cleanAccountNo}`;
          window.location.href = tossUrl;
          
          if (bank.iosAppId) {
            setTimeout(() => {
              if (!document.hidden) {
                setFallbackStoreUrl(`https://apps.apple.com/kr/app/id${bank.iosAppId}`);
              }
            }, 2000);
          }
        }
        return;
      }

      // 3. 나머지 은행: 안드로이드 크롬/삼성인터넷 등에서 ERR_UNKNOWN_URL_SCHEME 에러 페이지를 방지하고
      // 앱이 있을 때는 바로 실행, 없을 때는 플레이 스토어로 안전하게 안내하는 공식 Intent 스키마 적용
      if (isAndroid && bank.androidPackage) {
        const schemeName = bank.appScheme.replace('://', '');
        const intentUrl = `intent://#Intent;scheme=${schemeName};package=${bank.androidPackage};end`;
        window.location.href = intentUrl;
      } else {
        // iOS Safari 등은 기존 방식대로 제스처 차단 정책을 피하기 위해 동기적 즉시 딥링크 실행
        window.location.href = bank.appScheme;
        
        if (bank.iosAppId) {
          setTimeout(() => {
            if (!document.hidden) {
              setFallbackStoreUrl(`https://apps.apple.com/kr/app/id${bank.iosAppId}`);
            }
          }, 2000);
        }
      }

      copyToClipboard(accountNumber).catch(console.error);
      
      setCopiedFor(bank.code);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedFor(null), 3000);
    },
    [bankName, accountNumber, kakaoPayUrl]
  );

  return (
    <div className="bank-section">
      {/* Featured: 토스 & 카카오페이 (큰 버튼) */}
      <h2 className="bank-section__label">간편 송금</h2>
      <div className="bank-featured">
        {featuredBanks.map((bank) => (
          <button
            key={bank.code}
            className="bank-featured-btn"
            onClick={() => handleBankClick(bank)}
          >
            {bank.logo ? (
              <img
                src={bank.logo}
                alt={`${bank.name} 로고`}
                className="bank-featured-btn__logo-only"
              />
            ) : (
              <span className="bank-featured-btn__name-fallback">{bank.name}</span>
            )}
            <div className="bank-featured-btn__content">
              <span className="bank-featured-btn__name">
                {bank.code === 'toss' ? '토스로 송금' : '카카오페이 송금'}
              </span>
              <span className="bank-featured-btn__desc">
                {copiedFor === bank.code ? (
                  <span className="bank-featured-btn__copied">✓ 복사됨</span>
                ) : (
                  bank.code === 'toss'
                    ? '바로 송금 화면으로 이동'
                    : bank.code === 'kakaopay' && kakaoPayUrl
                    ? '바로 송금 화면으로 이동'
                    : '계좌번호 복사 후 앱 실행'
                )}
              </span>
            </div>
            <div className="bank-featured-btn__arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Other Banks: 그리드 형식 (스크롤 없음) */}
      <h2 className="bank-section__label" style={{ marginTop: '12px' }}>다른 은행 앱 열기</h2>
      <div className="bank-grid-compact">
        {otherBanks.map((bank) => (
          <button
            key={bank.code}
            className="bank-grid-compact__item"
            onClick={() => handleBankClick(bank)}
            aria-label={`${bank.displayName || bank.name} 앱 열기`}
          >
            <div className="bank-grid-compact__logo-container">
              {bank.logo ? (
                <img
                  src={bank.logo}
                  alt={bank.name}
                  className="bank-grid-compact__logo"
                />
              ) : (
                <span className="bank-grid-compact__logo-fallback">
                  {(bank.displayName || bank.name)[0]}
                </span>
              )}
              {copiedFor === bank.code && (
                <span className="bank-grid-compact__copied">✓</span>
              )}
            </div>
            <span className="bank-grid-compact__name">
              {bank.displayName || bank.name}
            </span>
          </button>
        ))}
      </div>

      {/* Toast for copy feedback */}
      {mounted && createPortal(
        <div 
          className={`toast toast--success ${copiedFor && !fallbackStoreUrl ? 'toast--visible' : ''}`}
          role="status"
          aria-live="polite"
        >
          ✓ 계좌번호 복사 후 앱을 실행합니다
        </div>,
        document.body
      )}

      {/* Fallback Banner for iOS */}
      {mounted && createPortal(
        <div className={`toast toast--fallback ${fallbackStoreUrl ? 'toast--visible' : ''}`}>
          <div className="toast--fallback-content">
            <span className="toast--fallback-text">앱이 열리지 않나요?</span>
            <div className="toast--fallback-actions">
              <button 
                onClick={() => setFallbackStoreUrl(null)}
                className="toast--fallback-btn-close"
              >
                닫기
              </button>
              <a 
                href={fallbackStoreUrl || '#'}
                className="toast--fallback-btn-store"
              >
                스토어 가기
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
