import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호된 라우트 패턴
const protectedRoutes = [
  '/dashboard',
  '/student',
  '/instructor', 
  '/admin',
  '/exam',
  '/qna',
  '/curriculum',
  '/lesson',
];

// 공개 라우트 패턴  
const publicRoutes = [
  '/login',
  '/signup',
  '/company-assign', // 회사 코드 입력 페이지
];

// 회사 배정이 필요한 라우트 (학생만, 강사/관리자는 제외)
const companyRequiredRoutes = [
  '/curriculum',
  '/lesson', 
  '/exam',
  // '/qna'는 제거 - 강사도 접근 가능해야 함
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  const timestamp = new Date().toISOString();

  // 보호된 라우트인지 확인 (루트 경로는 별도 처리)
  const isProtectedRoute = pathname !== '/' && protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 공개 라우트인지 확인
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route
  );

  // 토큰 확인 (서버 미들웨어는 쿠키만 확인)
  const authCookie = request.cookies.get('ap-auth');
  const hasValidToken = authCookie && authCookie.value && authCookie.value !== 'none';
  const tokenValue = authCookie?.value || 'none';
  const allCookies = request.cookies.toString();

  // 토큰에서 role 추출 (강사/관리자 체크용)
  let userRole = 'student'; // 기본값
  if (hasValidToken && tokenValue !== 'none') {
    try {
      const payload = JSON.parse(atob(tokenValue.split('.')[1]));
      userRole = payload.role || 'student';
    } catch (e) {
      // 토큰 파싱 실패 시 기본값 유지
      userRole = 'student';
    }
  }

  // 디버깅 로그 (개발 환경에서만) - 항상 출력하도록 수정
  console.log(`\n🔍 [MIDDLEWARE] ${timestamp}`);
  console.log(`  PATH: ${pathname}`);
  console.log(`  IS_PROTECTED: ${isProtectedRoute}`);
  console.log(`  IS_PUBLIC: ${isPublicRoute}`);
  console.log(`  HAS_TOKEN: ${hasValidToken}`);
  console.log(`  USER_ROLE: ${userRole}`);
  console.log(`  TOKEN_PREVIEW: ${tokenValue.substring(0, 30)}...`);
  console.log(`  ALL_COOKIES: ${allCookies}`);
  console.log(`  USER_AGENT: ${userAgent.includes('Mozilla') ? 'Browser' : 'Other'}`);

  // 루트 경로 특별 처리 - role에 따라 다른 페이지로 리다이렉트
  if (pathname === '/') {
    if (hasValidToken) {
      let redirectPath = '/curriculum'; // 기본값 (학생용)
      
      if (userRole === 'instructor') {
        redirectPath = '/instructor';
      } else if (userRole === 'admin') {
        redirectPath = '/admin';
      }
      
      console.log(`\n🚀 [MIDDLEWARE REDIRECT] ${pathname} -> ${redirectPath}`);
      console.log(`  ✅ REASON: Root path with valid token (role: ${userRole})`);
      console.log(`  🔗 Redirecting to: ${redirectPath}\n`);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    } else {
      console.log(`\n🚨 [MIDDLEWARE REDIRECT] ${pathname} -> /login`);
      console.log(`  ❌ REASON: Root path without valid token`);
      console.log(`  🔗 Redirecting to: /login\n`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 로그인 페이지 처리 - 토큰이 있으면 role에 따라 리다이렉트
  if (pathname === '/login') {
    if (hasValidToken) {
      let redirectPath = '/curriculum'; // 기본값 (학생용)
      
      if (userRole === 'instructor') {
        redirectPath = '/instructor';
      } else if (userRole === 'admin') {
        redirectPath = '/admin';
      }
      
      console.log(`\n🚀 [MIDDLEWARE REDIRECT] ${pathname} -> ${redirectPath}`);
      console.log(`  ✅ REASON: Login page with valid token (role: ${userRole})`);
      console.log(`  🔗 Redirecting to: ${redirectPath}\n`);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    } else {
      console.log(`[MIDDLEWARE] Login page access allowed (no token)`);
      return NextResponse.next();
    }
  }

  // 보호된 라우트에 접근하려는데 토큰이 없는 경우
  if (isProtectedRoute && !hasValidToken) {
    // 로그인 페이지로 리다이렉트할 때는 redirect 파라미터 추가
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    
    console.log(`\n🚨 [MIDDLEWARE REDIRECT] ${pathname} -> /login?redirect=${pathname}`);
    console.log(`  ❌ REASON: Protected route without valid token`);
    console.log(`  📋 DETAILS:`);
    console.log(`    - Protected: ${isProtectedRoute}`);
    console.log(`    - Has Token: ${hasValidToken}`);
    console.log(`    - Cookie Count: ${request.cookies.size}`);
    console.log(`  🔗 Redirecting to: ${loginUrl.toString()}\n`);
    
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
