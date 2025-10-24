'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '../../lib/auth';

export const useAuthGuard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentPath = window.location.pathname;
        const timestamp = new Date().toISOString();
        
        console.log(`[AUTH_GUARD] ${timestamp}`);
        console.log(`  CURRENT_PATH: ${currentPath}`);
        console.log(`  SEARCH_PARAMS_REDIRECT: ${searchParams.get('redirect')}`);

        // Auth 클라이언트에서 인증 상태 확인
        const authenticated = authClient.isAuthenticated();
        
        console.log(`  IS_AUTHENTICATED: ${authenticated}`);
        
        if (!authenticated) {
          const redirect = searchParams.get('redirect') || currentPath || '/curriculum';
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
          try {
            console.log(`[AUTH_GUARD] Checking company assignment status...`);
            const response = await authClient.getApi().get('/me/profile');
            
            if (response.data.success) {
              const user = response.data.data;
              console.log(`  USER_ROLE: ${user.role}`);
              console.log(`  USER_COMPANY_ASSIGNED: ${user.isCompanyAssigned}`);
              
              // 강사나 관리자는 회사 배정 체크를 건너뜀
              if (user.role === 'instructor' || user.role === 'admin') {
                console.log(`[AUTH_GUARD] Skipping company check for ${user.role}`);
              } else if (!user.isCompanyAssigned) {
                console.log(`[AUTH_GUARD REDIRECT] ${currentPath} -> /company-assign`);
                console.log(`  REASON: Student without company assignment`);
                router.push('/company-assign');
                return;
              }
            }
          } catch (error) {
            console.error('[AUTH_GUARD ERROR] Company check failed:', error);
            // 프로필 확인 실패 시에도 회사 배정 페이지로 이동
            const isAxiosError = (err: unknown): err is { response?: { status?: number } } => {
              return typeof err === 'object' && err !== null && 'response' in err;
            };
            
            if (isAxiosError(error) && error.response?.status === 401) {
              router.push('/login');
            } else {
              // 강사/관리자는 회사 배정 실패 시에도 진행
              const token = localStorage.getItem('accessToken');
              if (token) {
                try {
                  const tokenParts = token.split('.');
                  if (tokenParts.length !== 3) {
                    throw new Error('Invalid JWT token format');
                  }
                  const payload = JSON.parse(atob(tokenParts[1]!));
                  if (payload.role === 'instructor' || payload.role === 'admin') {
                    console.log(`[AUTH_GUARD] Company check failed but allowing ${payload.role} to proceed`);
                  } else {
                    router.push('/company-assign');
                    return;
                  }
                } catch (e) {
                  router.push('/company-assign');
                  return;
                }
              } else {
                router.push('/company-assign');
                return;
              }
            }
          }
        }

        console.log(`[AUTH_GUARD] Authentication confirmed, setting authenticated state`);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('[AUTH_GUARD ERROR] Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, searchParams]);

  const logout = async () => {
    await authClient.logout();
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
  };
};
