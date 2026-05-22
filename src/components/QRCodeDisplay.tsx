'use client';

import { useRef, useCallback } from 'react';
import QRCode from 'react-qr-code';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadPNG = useCallback(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const scale = 3; // High DPI
    canvas.width = (size + 40) * scale;
    canvas.height = (size + 40) * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size + 40, size + 40);

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 20, 20, size, size);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }, [size]);

  const downloadSVG = useCallback(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement('a');
    link.download = 'qrcode.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="qr-container">
      <div className="qr-wrapper" ref={svgRef}>
        <QRCode
          value={value}
          size={size}
          level="H"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <div className="qr-actions">
        <button className="btn btn--secondary btn--full" onClick={downloadPNG}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v8M4 7l4 4 4-4M2 12v2h12v-2" />
          </svg>
          PNG 다운로드
        </button>
        <button className="btn btn--secondary btn--full" onClick={downloadSVG}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v8M4 7l4 4 4-4M2 12v2h12v-2" />
          </svg>
          SVG 다운로드
        </button>
      </div>
    </div>
  );
}
