'use client';

import { useAuthGuard } from '../hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { isAuthenticated } = useAuthGuard();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  if (!isAuthenticated) {
    return <div>인증 중...</div>;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            관리자 대시보드
          </h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            로그아웃
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>사용자 관리</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>전체 사용자 계정 관리 및 권한 설정</p>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              사용자 목록
            </button>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>콘텐츠 관리</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>강의 자료 및 시험 문제 관리</p>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              콘텐츠 관리
            </button>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>통계 및 리포트</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>학습 현황 및 성과 분석</p>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              리포트 보기
            </button>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>시스템 설정</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>플랫폼 설정 및 환경 구성</p>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              설정 관리
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
