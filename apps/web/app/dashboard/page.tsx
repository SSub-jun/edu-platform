'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Dashboard는 더 이상 사용하지 않으므로 Curriculum으로 리다이렉트
    router.replace('/curriculum');
  }, [router]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        textAlign: 'center',
        color: '#666'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          커리큘럼 페이지로 이동 중...
        </div>
        <div style={{ fontSize: '14px' }}>
          잠시만 기다려주세요.
        </div>
      </div>
    </div>
  );
}