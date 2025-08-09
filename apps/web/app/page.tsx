'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 루트 페이지 접속 시 로그인 페이지로 리다이렉트
    router.push('/login');
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
        padding: '40px'
      }}>
        <div style={{ 
          fontSize: '24px', 
          marginBottom: '20px',
          color: '#333'
        }}>
          🚀 교육 플랫폼
        </div>
        <div style={{ 
          fontSize: '16px', 
          color: '#666',
          marginBottom: '30px'
        }}>
          로그인 페이지로 이동 중...
        </div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #0070f3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
