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
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '25px'
        }}>
          {/* 회사 & 기수 관리 */}
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
              🏢 회사 & 기수 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              Cohort 기반 운영 화면을 준비 중입니다. 그 전까지는 기존 회사 관리 화면을 통해 기관 정보를 확인해주세요.
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
                🏢 회사 목록 열기
              </button>
              
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#e9ecef',
                color: '#5c636a',
                borderRadius: '6px',
                fontSize: '13px',
                lineHeight: '1.5'
              }}>
                새 Cohort 관리 UI가 곧 제공될 예정입니다. 기존 회사/과목 배정 화면은 더 이상 노출하지 않습니다.
              </div>
            </div>
          </div>

          {/* 콘텐츠 & 시험 관리 */}
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
              📚 콘텐츠 & 시험 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              과목/레슨/시험 문제 관리 화면을 새로 만들고 있습니다. 개편이 완료되면 여기에서 바로 접근할 수 있어요.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                padding: '12px 16px',
                border: '1px dashed #adb5bd',
                borderRadius: '6px',
                color: '#495057',
                backgroundColor: '#fff'
              }}>
                ✅ 목표<br />
                - 과목 상세에서 레슨·영상·시험을 한 번에 관리<br />
                - 문제 은행 / 보기 / 해설 / 미리보기 지원<br />
                - 업로드 파이프라인 정리
              </div>
            </div>
          </div>

          {/* 운영 지원 안내 */}
          <div style={{
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#fff8e1',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginBottom: '10px', 
              color: '#8a6d3b',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🛠️ 운영 도구 개편 안내
            </h3>
            <p style={{ 
              color: '#7a5d2f', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              계정 관리, 포털 시험, Q&A 통계 등 구버전 메뉴는 일시적으로 숨겼습니다. 필요 시 운영팀을 통해 직접 지원받아 주세요.
            </p>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              color: '#7a5d2f', 
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <li>강사/학생 계정은 초대코드 기반 가입으로 전환</li>
              <li>포털 시험 기능은 별도 프로젝트로 분리</li>
              <li>Q&A 분석은 backend API 정리 후 재도입 예정</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
