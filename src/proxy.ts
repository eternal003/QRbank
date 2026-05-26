import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ===== 상수 시간 문자열 비교 (타이밍 공격 방어) =====
// 일반 === 비교는 첫 번째 불일치에서 즉시 반환하여 응답 시간 차이로
// 비밀번호를 한 글자씩 유추할 수 있는 사이드채널 공격에 취약합니다.
// XOR 기반 비교로 항상 전체 문자열을 순회하여 일정한 시간이 소요됩니다.
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);

  // 길이가 달라도 항상 동일한 루프 횟수를 수행하여 길이 정보 유출 방지
  const maxLen = Math.max(aBuf.length, bBuf.length);
  let result = aBuf.length ^ bBuf.length; // 길이가 다르면 0이 아닌 값

  for (let i = 0; i < maxLen; i++) {
    // 범위 밖 인덱스는 0으로 대체하여 일정한 순회 보장
    result |= (aBuf[i] ?? 0) ^ (bBuf[i] ?? 0);
  }
  return result === 0;
}

// ===== 간이 Rate Limiter (IP 기반, Edge isolate 단위) =====
// 참고: Edge Runtime에서는 isolate 단위로 메모리가 격리되므로
// 완벽한 분산 Rate Limiting이 아닙니다. 프로덕션에서는 Cloudflare
// 대시보드의 Rate Limiting 규칙을 추가로 설정하는 것을 권장합니다.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;       // 1분 윈도우
const RATE_LIMIT_MAX_REQUESTS = 60;        // 분당 최대 60회
const RATE_LIMIT_MAP_MAX_SIZE = 1000;      // 메모리 보호 한계

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // 메모리 보호: 맵이 너무 커지면 만료된 항목 정리
  if (rateLimitMap.size > RATE_LIMIT_MAP_MAX_SIZE) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
    // 정리 후에도 한계 초과 시 전체 초기화
    if (rateLimitMap.size > RATE_LIMIT_MAP_MAX_SIZE) {
      rateLimitMap.clear();
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false; // 허용
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS; // true면 차단
}

// ===== 클라이언트 IP 추출 =====
function getClientIp(request: NextRequest): string {
  // Cloudflare 환경에서는 cf-connecting-ip가 위조 불가능한 실제 IP입니다.
  return request.headers.get('cf-connecting-ip') ||
         request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         '127.0.0.1';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // /admin 페이지 및 관리자 API(/api/links) 요청에 대해서만 검사합니다.
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/links')) {
    const clientIp = getClientIp(request);

    // 0단계: Rate Limiting — 과도한 요청 차단
    if (checkRateLimit(clientIp)) {
      return new NextResponse(
        JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
    
    // 1단계: IP 검증 (개발 환경에서는 IP 제한을 우회하여 자유롭게 테스트 가능)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowedIps = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
    
    if (!isDevelopment && allowedIps.length > 0) {
      if (!allowedIps.includes(clientIp)) {
        return new NextResponse(
          JSON.stringify({ error: '접근이 거부되었습니다. 허용된 IP가 아닙니다.' }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2단계: HTTP Basic Auth (비밀번호 확인) - 로컬/운영 모두 작동
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (adminUser && adminPass) {
      const basicAuth = request.headers.get('authorization');
      
      if (!basicAuth) {
        return new NextResponse('Authentication required', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Secure QRbank Admin Area"',
          },
        });
      }

      try {
        const authValue = basicAuth.split(' ')[1];
        const decoded = atob(authValue);

        // RFC 7617 준수: 첫 번째 ':' 기준으로만 분리 (비밀번호에 ':' 포함 허용)
        const colonIdx = decoded.indexOf(':');
        if (colonIdx === -1) {
          throw new Error('Invalid auth format');
        }
        const user = decoded.slice(0, colonIdx);
        const pwd = decoded.slice(colonIdx + 1);

        // 타이밍 안전 비교로 사이드채널 공격 방어
        if (!timingSafeEqual(user, adminUser) || !timingSafeEqual(pwd, adminPass)) {
          return new NextResponse('Invalid credentials', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="Secure QRbank Admin Area"',
            },
          });
        }
      } catch {
        return new NextResponse('Invalid authentication format', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Secure QRbank Admin Area"',
          },
        });
      }
    }
  }

  // 모든 관문을 통과하면 정상적으로 페이지 접속을 허용합니다.
  return NextResponse.next();
}

// 미들웨어가 작동할 경로 지정
export const runtime = 'experimental-edge';

export const config = {
  matcher: ['/admin/:path*', '/api/links/:path*'],
};
