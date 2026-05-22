import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'experimental-edge';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // /admin 페이지 및 관리자 API(/api/links) 요청에 대해서만 검사합니다.
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/links')) {
    
    // 1단계: IP 검증 (개발 환경에서는 IP 제한을 우회하여 자유롭게 테스트 가능)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowedIps = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
    
    if (!isDevelopment && allowedIps.length > 0) {
      // Cloudflare 환경에서는 cf-connecting-ip 헤더로 진짜 접속자 IP를 알아냅니다.
      const clientIp = request.headers.get('cf-connecting-ip') || 
                       request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                       '';
      
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
        const [user, pwd] = atob(authValue).split(':');

        if (user !== adminUser || pwd !== adminPass) {
          return new NextResponse('Invalid credentials', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="Secure QRbank Admin Area"',
            },
          });
        }
      } catch (e) {
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
export const config = {
  matcher: ['/admin/:path*', '/api/links/:path*'],
};
