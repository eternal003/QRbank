'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ACCOUNT_BANKS } from '@/lib/banks';
import { copyToClipboard } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import type { LinkData } from '@/lib/kv';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import QRCode from 'react-qr-code';

interface LinkResult extends LinkData {
  url?: string;
}

export default function AdminPage() {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [kakaoPayUrl, setKakaoPayUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkResult | null>(null);
  const [history, setHistory] = useState<LinkResult[]>([]);
  const [urlCopied, setUrlCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const urlCopyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const downloadQrWrapperRef = useRef<HTMLDivElement>(null);

  // Load history from server
  useEffect(() => {
    fetch('/api/links')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!bankName || !accountNumber || !accountHolder) return;

      setLoading(true);
      try {
        const url = editingId ? `/api/links/${editingId}` : '/api/links';
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bankName, accountNumber, accountHolder, kakaoPayUrl }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `링크 ${editingId ? '수정' : '생성'}에 실패했습니다.`);
        }

        const data = await res.json();

        // update result if we're viewing it
        if (!editingId || result?.id === editingId) {
          data.url = data.url || `${window.location.origin}/${data.id}`;
          setResult(data);
        }

        if (editingId) {
          setHistory((prev) => prev.map((item) => (item.id === editingId ? data : item)));
          setEditingId(null);
        } else {
          setHistory((prev) => [data, ...prev]);
        }

        // Clear form
        setBankName('');
        setAccountNumber('');
        setAccountHolder('');
        setKakaoPayUrl('');

        // Scroll to result so user sees it
        setTimeout(() => {
          document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : `링크 ${editingId ? '수정' : '생성'}에 실패했습니다.`;
        alert(message);
      } finally {
        setLoading(false);
      }
    },
    [bankName, accountNumber, accountHolder, kakaoPayUrl, editingId, result]
  );

  const copyUrl = useCallback(async (url: string) => {
    await copyToClipboard(url);
    setUrlCopied(true);
    clearTimeout(urlCopyTimerRef.current);
    urlCopyTimerRef.current = setTimeout(() => setUrlCopied(false), 2000);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    if (!confirm('이 링크를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제에 실패했습니다.');
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (result?.id === id) setResult(null);
      if (editingId === id) setEditingId(null);
    } catch (error) {
      console.error(error);
      alert('링크 삭제에 실패했습니다.');
    }
  }, [result, editingId]);

  const handleEdit = useCallback((item: LinkResult) => {
    setBankName(item.bankName);
    setAccountNumber(item.accountNumber);
    setAccountHolder(item.accountHolder);
    setKakaoPayUrl(item.kakaoPayUrl || '');
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const cancelEdit = useCallback(() => {
    setBankName('');
    setAccountNumber('');
    setAccountHolder('');
    setKakaoPayUrl('');
    setEditingId(null);
  }, []);

  // On-demand QR download: set state, render single QR, then download in useEffect
  const [pendingDownload, setPendingDownload] = useState<{ item: LinkResult; format: 'png' | 'svg' } | null>(null);

  const downloadHistoryQR = useCallback((item: LinkResult, format: 'png' | 'svg' = 'png') => {
    setPendingDownload({ item, format });
  }, []);

  // Handle download after QR renders into the DOM
  useEffect(() => {
    if (!pendingDownload) return;

    const { item, format } = pendingDownload;
    const svg = downloadQrWrapperRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);

    if (format === 'svg') {
      const link = document.createElement('a');
      link.download = `qrcode_${item.accountHolder}.svg`;
      link.href = blobUrl;
      link.click();
      URL.revokeObjectURL(blobUrl);
      setTimeout(() => setPendingDownload(null), 0);
      return;
    }

    // PNG format
    const canvas = document.createElement('canvas');
    const size = 200;
    const scale = 3;
    canvas.width = (size + 40) * scale;
    canvas.height = (size + 40) * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(blobUrl);
      setTimeout(() => setPendingDownload(null), 0);
      return;
    }

    ctx.scale(scale, scale);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size + 40, size + 40);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 20, 20, size, size);
      URL.revokeObjectURL(blobUrl);

      const link = document.createElement('a');
      link.download = `qrcode_${item.accountHolder}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setTimeout(() => setPendingDownload(null), 0);
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      setTimeout(() => setPendingDownload(null), 0);
    };
    img.src = blobUrl;
  }, [pendingDownload]);

  // Memoize filtered history to avoid recalculating on every render
  const filteredHistory = useMemo(
    () => history.filter((item) =>
      item.accountHolder.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [history, searchQuery]
  );

  // Apply light theme
  useTheme('light');

  return (
    <div className="public-page public-page--fullscreen" data-theme="light" style={{ overflowY: 'auto', padding: '40px 16px' }}>
      {/* Holographic Light Background */}
      <div className="hologram-bg">
        <div className="hologram-bg__blob hologram-bg__blob--1"></div>
        <div className="hologram-bg__blob hologram-bg__blob--2"></div>
        <div className="hologram-bg__blob hologram-bg__blob--3"></div>
      </div>

      <div className="transfer-layout hologram-glass" style={{ maxWidth: '680px', margin: '0 auto', width: '100%', minHeight: 'auto', display: 'flex', flexDirection: 'column', gap: '28px', padding: '40px 32px' }}>
        <div className="page-header animate-slide-up" style={{ animationDelay: '0.05s', padding: 0, margin: 0, textAlign: 'center' }}>
          <h1 className="page-title" style={{
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800,
            fontSize: '1.85rem',
            letterSpacing: '-0.03em',
            margin: 0
          }}>QR 송금 링크 생성</h1>
          <p className="page-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
            계좌 정보를 입력하면 송금 링크와 QR코드가 자동으로 생성됩니다
          </p>
        </div>

        {/* Form */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="bankName" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                은행명
              </label>
              <select
                id="bankName"
                className="form-select"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              >
                <option value="">은행을 선택해주세요</option>
                {ACCOUNT_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="accountNumber" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                계좌번호
              </label>
              <input
                id="accountNumber"
                type="text"
                className="form-input"
                placeholder="계좌번호를 입력해주세요"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="accountHolder" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                예금주
              </label>
              <input
                id="accountHolder"
                type="text"
                className="form-input"
                placeholder="예금주명을 입력해주세요"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" htmlFor="kakaoPayUrl" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                카카오페이 송금 링크 (선택)
              </label>
              <input
                id="kakaoPayUrl"
                type="text"
                className="form-input"
                placeholder="예: https://qr.kakaopay.com/... (비워두면 없이)"
                value={kakaoPayUrl}
                onChange={(e) => setKakaoPayUrl(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="submit"
                className="btn btn--primary btn--full btn--lg"
                disabled={loading}
                style={{
                  borderRadius: '14px',
                  padding: '16px 24px',
                  fontSize: '1rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {editingId ? (
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      ) : (
                        <>
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                        </>
                      )}
                      {editingId && <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />}
                    </svg>
                    {editingId ? '링크 정보 수정' : '링크 & QR코드 생성'}
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn--secondary btn--lg"
                  onClick={cancelEdit}
                  disabled={loading}
                  style={{
                    whiteSpace: 'nowrap',
                    borderRadius: '14px',
                    padding: '16px 24px',
                    fontSize: '1rem'
                  }}
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div id="result-section" className="link-display animate-slide-up" style={{ marginTop: '8px' }}>
            <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <div className="section-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>생성된 링크</div>
                <div className="link-url" style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: 0
                }}>
                  <span className="link-url__text" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem' }}>{result.url}</span>
                  <button
                    className="link-url__copy"
                    onClick={() => result.url && copyUrl(result.url)}
                    style={{
                      background: 'var(--accent-gradient)',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: 'none',
                      color: '#ffffff',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {urlCopied ? '복사됨!' : '복사'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div className="section-label" style={{ alignSelf: 'flex-start', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>QR 코드</div>
                {result.url && (
                  <div style={{
                    background: '#ffffff',
                    padding: '16px',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-glass)',
                    display: 'inline-flex'
                  }}>
                    <QRCodeDisplay value={result.url} size={180} />
                  </div>
                )}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                  <span>{result.bankName}</span>
                  <span style={{ opacity: 0.3 }}>•</span>
                  <span>{result.accountNumber}</span>
                  <span style={{ opacity: 0.3 }}>•</span>
                  <span>{result.accountHolder}</span>
                </div>
                {result.kakaoPayUrl && (
                  <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#e5b800', fontWeight: '700' }}>
                    💛 카카오페이 송금 링크 연결 완료
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="history-section animate-slide-up" style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
              <h2 className="history-title" style={{ marginBottom: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                생성 이력 ({filteredHistory.length})
              </h2>
              <input
                type="search"
                placeholder="예금주명 검색..."
                className="form-input"
                style={{
                  width: '180px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  marginBottom: 0,
                  borderRadius: '10px'
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredHistory.map((item) => (
                <div key={item.id} className="history-item" style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  margin: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div className="history-item__info" style={{ gap: '4px' }}>
                    <span className="history-item__bank" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.bankName}</strong>
                      <span style={{ color: 'var(--border-glass)', fontSize: '0.75rem' }}>•</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{item.accountHolder}</span>
                      {item.kakaoPayUrl && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 205, 0, 0.15)', color: '#d2aa00', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}>
                          카카오페이
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }} title="방문자 수(조회수)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {item.visitorCount || 0}
                      </span>
                    </span>
                    <span className="history-item__account" style={{ color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '0.02em', fontSize: '0.8rem' }}>
                      {item.accountNumber}
                    </span>
                  </div>
                  <div className="history-item__actions" style={{ gap: '6px' }}>
                    <button
                      className="history-item__btn"
                      onClick={() => handleEdit(item)}
                      title="수정"
                    >
                      수정
                    </button>
                    <button
                      className="history-item__btn"
                      onClick={() => downloadHistoryQR(item, 'png')}
                      title="PNG 다운로드"
                    >
                      PNG
                    </button>
                    <button
                      className="history-item__btn"
                      onClick={() => downloadHistoryQR(item, 'svg')}
                      title="SVG 다운로드"
                    >
                      SVG
                    </button>
                    <button
                      className="history-item__btn"
                      onClick={() => copyUrl(item.url || `${window.location.origin}/${item.id}`)}
                      title="링크 복사"
                    >
                      복사
                    </button>
                    <button
                      className="history-item__btn history-item__btn--delete"
                      onClick={() => deleteItem(item.id)}
                      title="제거"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredHistory.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-glass)', borderRadius: '14px', border: '1px solid var(--border-glass)', fontSize: '0.85rem' }}>
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single hidden QR for on-demand download (O1 optimization) */}
      {pendingDownload && (
        <div ref={downloadQrWrapperRef} style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
          <QRCode
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${pendingDownload.item.id}`}
            size={200}
            level="H"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
      )}
    </div>
  );
}
