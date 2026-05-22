'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { copyToClipboard } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  bankName: string;
  accountHolder: string;
}

export default function CopyButton({ text, bankName, accountHolder }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => {
      clearTimeout(timer);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    await copyToClipboard(text);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <div className="copy-section" onClick={handleCopy} style={{ cursor: 'pointer' }}>
      <div className="copy-section__info">
        <div className="copy-section__bank">{bankName}</div>
        <div className="copy-section__number">
          {text.split('').join('\u200C')}
        </div>
        <div className="copy-section__holder">{accountHolder}</div>
      </div>
      <button
        className={`copy-btn ${copied ? 'copy-btn--copied' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
        aria-label="계좌번호 복사"
      >
        {copied ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'checkmark 0.3s ease-out' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>

      {/* Toast */}
      {mounted && createPortal(
        <div className={`toast toast--success ${copied ? 'toast--visible' : ''}`}>
          ✓ 계좌번호가 복사되었습니다
        </div>,
        document.body
      )}
    </div>
  );
}
