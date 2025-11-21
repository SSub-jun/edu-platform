'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth';

type UserRole = 'admin' | 'instructor' | 'student';

export interface AuthUser {
  id: string;
  username: string;
  phone?: string | null;
  role: UserRole;
  companyId?: string;
  isCompanyAssigned?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  /** 프로필을 다시 불러올 때 사용 (예: 회사 배정 직후 등) */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadProfile = async () => {
    try {
      // 토큰이 아예 없으면 프로필 호출을 하지 않음
      const hasToken = authClient.isAuthenticated();
      if (!hasToken) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const response = await authClient.getApi().get('/me/profile');
      if (response.data?.success && response.data.data) {
        const raw = response.data.data;
        const mappedUser: AuthUser = {
          id: raw.id,
          username: raw.username,
          phone: raw.phone ?? null,
          role: raw.role,
          companyId: raw.company?.id ?? raw.companyId,
          isCompanyAssigned: raw.isCompanyAssigned,
        };
        setUser(mappedUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[AUTH_PROVIDER] Failed to load profile', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setIsAuthLoading(true);
      try {
        await loadProfile();
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    };

    // 앱이 최초 로드될 때 한 번만 프로필을 로드
    // 이후 페이지 전환에서는 이 상태를 재사용
    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isAuthLoading,
      refreshProfile: async () => {
        await loadProfile();
      },
    }),
    [user, isAuthenticated, isAuthLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}


