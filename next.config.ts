import type { NextConfig } from "next";
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// 로컬 개발 시 Wrangler의 D1 에뮬레이션 바인딩 실행
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform().catch(console.error);
}

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.219.200', '192.168.219.194', '192.168.219.138'],

  // 보안 헤더: 클릭재킹, MIME 스니핑, 리퍼러 노출, 불필요한 브라우저 API 접근 차단
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
