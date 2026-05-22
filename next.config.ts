import type { NextConfig } from "next";
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// 로컬 개발 시 Wrangler의 D1 에뮬레이션 바인딩 실행
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform().catch(console.error);
}

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.219.200', '192.168.219.194', '192.168.219.138'],
};

export default nextConfig;
