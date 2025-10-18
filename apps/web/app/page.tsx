'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 클라이언트 사이드에서는 단순히 로그인 페이지로 리다이렉트
    // 미들웨어가 토큰 확인을 담당하므로 여기서는 복잡한 로직 제거
    console.log('[HOME] Redirecting to login (client-side fallback)');
    router.replace('/login');
  }, [router]);

  // 로딩 중 표시
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '18px',
      fontWeight: '500'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
        <div>교육 플랫폼 로딩 중...</div>
      </div>
    </div>
  );
}
