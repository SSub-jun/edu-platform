'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuthGuard = () => {
  const router = useRouter();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
    }
  }, [router]);

  return {
    isAuthenticated: typeof window !== 'undefined' && !!localStorage.getItem('accessToken')
  };
};
