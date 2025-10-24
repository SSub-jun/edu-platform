'use client';

export const dynamic = 'force-dynamic';

import { useAuthGuard } from '../hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth';

export default function StudentPage() {
  const { isAuthenticated } = useAuthGuard();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.logout();
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
            학생 대시보드
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
            <h3 style={{ marginBottom: '15px', color: '#333' }}>학습하기</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>강의 영상 시청 및 학습 진행</p>
            <button 
              onClick={() => router.push('/exam/demo')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              시험 보기
            </button>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>진도 확인</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>현재 학습 진도 및 성과 확인</p>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              진도 보기
            </button>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Q&A</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>질문 등록 및 답변 확인</p>
            <button 
              onClick={() => router.push('/qna')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Q&A 보기
            </button>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>🎯 시험 포털</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>세션 코드로 실시간 시험 참여</p>
            <button 
              onClick={() => router.push('/portal/exam')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              시험 참여
            </button>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>내 정보</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>개인정보 및 계정 설정</p>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              정보 수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
