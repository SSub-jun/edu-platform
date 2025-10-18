'use client';

import { useAuthGuard } from '../hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth';

export default function AdminPage() {
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '25px'
        }}>
          {/* 기관 관리 */}
          <div style={{
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginBottom: '10px', 
              color: '#333',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🏢 기관 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              교육기관/기업 생성, 초대코드 관리, 과목 배정
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => router.push('/admin/companies')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🏢 기관 목록 관리
              </button>
              
              <button 
                onClick={() => router.push('/admin/companies/assign')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📚 과목 배정 관리
              </button>
            </div>
          </div>

          {/* 계정 관리 */}
          <div style={{
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginBottom: '10px', 
              color: '#333',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👤 계정 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              강사, 학생, 관리자 계정 생성 및 삭제
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => router.push('/admin/users/instructors')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                👩‍🏫 강사 계정 관리
              </button>
              
              <button 
                onClick={() => router.push('/admin/users/students')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                👥 학생 계정 관리
              </button>
            </div>
          </div>

          {/* 교육 콘텐츠 관리 */}
          <div style={{
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginBottom: '10px', 
              color: '#333',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📚 교육 콘텐츠 감독
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              전체 과목, 시험 문제, 학습 자료 품질 관리
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => router.push('/admin/subjects')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📖 전체 과목 관리
              </button>
              
              <button 
                onClick={() => router.push('/admin/questions')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📝 문제 은행 관리
              </button>
            </div>
          </div>

          {/* 포털 시험 관리 */}
          <div style={{
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginBottom: '10px', 
              color: '#333',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🎯 포털 시험 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              실시간 시험 세션, 문제 은행, 결과 분석
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => router.push('/admin/portal/sessions')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🎮 시험 세션 관리
              </button>
              
              <button 
                onClick={() => router.push('/admin/portal/banks')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🏦 문제 은행 관리
              </button>
            </div>
          </div>

          {/* Q&A 관리 */}
          <div style={{
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginBottom: '10px', 
              color: '#333',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💬 Q&A 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              전체 질문 답변 모니터링 및 품질 관리
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => router.push('/qna')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                💭 질문 답변 관리
              </button>
              
              <button 
                onClick={() => router.push('/admin/qna/analytics')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📊 Q&A 통계
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
