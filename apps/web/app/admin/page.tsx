'use client';

export const dynamic = 'force-dynamic';

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
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #e0e0e0'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 8px 0'
            }}>
              관리자 대시보드
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#666',
              margin: 0
            }}>
              교육 플랫폼의 모든 콘텐츠와 운영을 관리하세요
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            로그아웃
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {/* 회사 관리 */}
          <div style={{
            padding: '24px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onClick={() => router.push('/admin/companies')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#e3f2fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px'
            }}>
              🏢
            </div>
            <h3 style={{ 
              marginBottom: '8px', 
              color: '#333',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              회사 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '16px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              교육 기관 등록, 초대코드 발급, 기수 생성 및 과목/학생 배정
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0070f3',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              관리하기 →
            </div>
          </div>

          {/* 과목 관리 */}
          <div style={{
            padding: '24px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onClick={() => router.push('/admin/subjects')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#f3e5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px'
            }}>
              📚
            </div>
            <h3 style={{ 
              marginBottom: '8px', 
              color: '#333',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              과목 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '16px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              과목 생성/수정, 레슨 구성, 영상 업로드, 시험 문제 출제
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#9c27b0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              관리하기 →
            </div>
          </div>

          {/* 학생 관리 */}
          <div style={{
            padding: '24px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onClick={() => router.push('/admin/students')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#e8f5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px'
            }}>
              👥
            </div>
            <h3 style={{ 
              marginBottom: '8px', 
              color: '#333',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              학생 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '16px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              학생 계정 생성, 회사 배정, 기수 등록, 진도 및 시험 결과 조회
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#4caf50',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              관리하기 →
            </div>
          </div>

          {/* Q&A 관리 */}
          <div style={{
            padding: '24px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onClick={() => router.push('/admin/qna')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#fff3e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px'
            }}>
              💬
            </div>
            <h3 style={{ 
              marginBottom: '8px', 
              color: '#333',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              Q&A 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '16px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              학생 질문 확인 및 답변, 자주 묻는 질문(FAQ) 관리
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ff9800',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              관리하기 →
            </div>
          </div>
        </div>

        {/* 빠른 통계 */}
        <div style={{
          marginTop: '30px',
          padding: '24px',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '16px'
          }}>
            📊 빠른 통계 (준비 중)
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>전체 회사</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>-</div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>활성 기수</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>-</div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>전체 학생</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>-</div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>등록 과목</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>-</div>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div style={{
          marginTop: '20px',
          padding: '16px 20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #90caf9'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{ fontSize: '20px' }}>ℹ️</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1565c0', marginBottom: '4px' }}>
                기수 기반 운영 시스템
              </div>
              <div style={{ fontSize: '13px', color: '#1976d2', lineHeight: '1.5' }}>
                회사별 기수를 생성하고, 각 기수에 과목과 학생을 배정하여 6개월 단위 교육을 효율적으로 관리할 수 있습니다.
                회사 관리 페이지에서 "기수 관리" 버튼을 눌러 시작하세요.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
