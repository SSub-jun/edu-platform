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
  '/company-assign',
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
];

const roleDefaultRoutes: Record<string, string> = {
  student: '/curriculum',
  instructor: '/instructor',
  admin: '/admin',
};

const roleRouteRules: Array<{
  prefix: string;
  allowedRoles: Array<'admin' | 'instructor' | 'student'>;
}> = [
  { prefix: '/admin', allowedRoles: ['admin'] },
  { prefix: '/instructor', allowedRoles: ['admin', 'instructor'] },
];

const startsWithRoute = (pathname: string, route: string) => {
  if (route === '/') {
    return pathname === '/';
  }
  return pathname === route || pathname.startsWith(`${route}/`);
};

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

  // 토큰에서 role/회사 배정 상태 추출
  let userRole: 'student' | 'instructor' | 'admin' = 'student';
  let companyAssigned: boolean | null = null;
  if (hasValidToken && tokenValue !== 'none') {
    try {
      const tokenParts = tokenValue.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      const payload = JSON.parse(atob(tokenParts[1]!));
      userRole = payload.role || 'student';
      if (typeof payload.companyAssigned === 'boolean') {
        companyAssigned = payload.companyAssigned;
      } else if (payload.companyId !== undefined) {
        companyAssigned = !!payload.companyId;
      }
    } catch (e) {
      userRole = 'student';
      companyAssigned = null;
    }
  }

  const resolveDefaultPath = () => {
    if (userRole === 'student' && companyAssigned === false) {
      return '/company-assign';
    }
    return roleDefaultRoutes[userRole] || '/curriculum';
  };

  const redirectWithLog = (from: string, to: string, reason: string) => {
    console.log(`\n🚀 [MIDDLEWARE REDIRECT] ${from} -> ${to}`);
    console.log(`  REASON: ${reason}`);
    console.log(`  ROLE: ${userRole}`);
    console.log(`  COMPANY_ASSIGNED: ${companyAssigned}`);
    console.log(`  🔗 Redirecting to: ${to}\n`);
    return NextResponse.redirect(new URL(to, request.url));
  };

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

  // 루트 경로 특별 처리 - role 및 배정 상태에 따라 다른 페이지로 리다이렉트
  if (pathname === '/') {
    if (hasValidToken) {
      const redirectPath = resolveDefaultPath();
      return redirectWithLog(
        pathname,
        redirectPath,
        'Root path with valid token',
      );
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
      const redirectPath = resolveDefaultPath();
      return redirectWithLog(
        pathname,
        redirectPath,
        'Login page with valid token',
      );
    }
    console.log(`[MIDDLEWARE] Login page access allowed (no token)`);
    return NextResponse.next();
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

  // 역할 기반 접근 제어
  if (hasValidToken) {
    for (const rule of roleRouteRules) {
      if (startsWithRoute(pathname, rule.prefix)) {
        if (!rule.allowedRoles.includes(userRole)) {
          const fallback = resolveDefaultPath();
          return redirectWithLog(
            pathname,
            fallback,
            `Role ${userRole} not allowed for ${rule.prefix}`,
          );
        }
      }
    }
  }

  // 회사 배정 필요 라우트 처리 (신규 토큰에만 적용)
  const shouldCheckCompany =
    companyAssigned !== null && userRole === 'student' && hasValidToken;
  const needsCompanyAssignment = companyRequiredRoutes.some((route) =>
    startsWithRoute(pathname, route),
  );
  if (
    shouldCheckCompany &&
    needsCompanyAssignment &&
    !companyAssigned &&
    pathname !== '/company-assign'
  ) {
    const assignUrl = new URL('/company-assign', request.url);
    assignUrl.searchParams.set('redirect', pathname);
    console.log(
      `\n🚨 [MIDDLEWARE REDIRECT] ${pathname} -> ${assignUrl.toString()}`,
    );
    console.log('  REASON: Student without company assignment');
    return NextResponse.redirect(assignUrl);
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
