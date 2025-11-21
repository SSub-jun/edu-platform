'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth';
import { useAuthContext } from '../../src/components/AuthProvider';

export const useAuthGuard = () => {
  const router = useRouter();
  const { user, isAuthenticated, isAuthLoading, refreshProfile } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentPath = window.location.pathname;
        const timestamp = new Date().toISOString();
        
        // URL에서 redirect 파라미터 가져오기 (클라이언트 사이드)
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        
        console.log(`[AUTH_GUARD] ${timestamp}`);
        console.log(`  CURRENT_PATH: ${currentPath}`);
        console.log(`  SEARCH_PARAMS_REDIRECT: ${redirectParam}`);

        // AuthProvider에서 관리하는 인증 상태 활용
        const baseAuthenticated = authClient.isAuthenticated();
        const effectiveAuthenticated = baseAuthenticated && isAuthenticated;

        console.log(`  AUTH_CLIENT_IS_AUTHENTICATED: ${baseAuthenticated}`);
        console.log(`  CONTEXT_IS_AUTHENTICATED: ${isAuthenticated}`);
        console.log(`  EFFECTIVE_AUTHENTICATED: ${effectiveAuthenticated}`);
        
        if (!effectiveAuthenticated) {
          const redirect = redirectParam || currentPath || '/curriculum';
          const loginPath = `/login?redirect=${encodeURIComponent(redirect)}`;
          
          console.log(`[AUTH_GUARD REDIRECT] ${currentPath} -> ${loginPath}`);
          console.log(`  REASON: Not authenticated`);
          
          router.push(loginPath);
          return;
        }

        // 회사 배정이 필요한 라우트인지 확인 (강사/관리자는 제외)
        const companyRequiredRoutes = ['/curriculum', '/lesson', '/exam'];
        const needsCompanyAssignment = companyRequiredRoutes.some(route => 
          currentPath.startsWith(route)
        );

        // 회사 배정 확인이 필요한 경우 (company-assign 페이지는 제외)
        if (needsCompanyAssignment && currentPath !== '/company-assign') {
          // AuthProvider 프로필 정보 우선 사용
          let role = user?.role;
          let isCompanyAssigned = user?.isCompanyAssigned;

          if (!user) {
            console.log('[AUTH_GUARD] No user in context, refreshing profile...');
            await refreshProfile();
          }

          role = role ?? user?.role;
          isCompanyAssigned = isCompanyAssigned ?? user?.isCompanyAssigned;

          console.log(`  USER_ROLE: ${role}`);
          console.log(`  USER_COMPANY_ASSIGNED: ${isCompanyAssigned}`);

          // 강사나 관리자는 회사 배정 체크를 건너뜀
          if (role === 'instructor' || role === 'admin') {
            console.log(`[AUTH_GUARD] Skipping company check for ${role}`);
          } else if (!isCompanyAssigned) {
            console.log(`[AUTH_GUARD REDIRECT] ${currentPath} -> /company-assign`);
            console.log(`  REASON: Student without company assignment`);
            router.push('/company-assign');
            return;
          }
        }

        console.log(`[AUTH_GUARD] Authentication confirmed (guard finished)`);
      } catch (error) {
        console.error('[AUTH_GUARD ERROR] Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    // AuthProvider가 프로필 로딩을 끝낸 뒤에만 가드를 실행
    if (!isAuthLoading) {
      checkAuth();
    }
  }, [router, isAuthLoading, isAuthenticated, user, refreshProfile]);

  const logout = async () => {
    await authClient.logout();
  };

  return {
    isAuthenticated,
    isLoading: isLoading || isAuthLoading,
    logout,
  };
};
