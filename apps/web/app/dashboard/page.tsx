'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            대시보드
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            padding: '30px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            backgroundColor: '#f8f9fa'
          }}
          onClick={() => router.push('/exam/demo')}>
            <h3 style={{ 
              fontSize: '20px', 
              marginBottom: '15px',
              color: '#0070f3'
            }}>
              📝 시험
            </h3>
            <p style={{ 
              color: '#666',
              marginBottom: '20px'
            }}>
              데모 시험을 풀어보세요
            </p>
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px',
              display: 'inline-block'
            }}>
              시작하기
            </div>
          </div>

          <div style={{
            padding: '30px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            backgroundColor: '#f8f9fa'
          }}
          onClick={() => router.push('/qna')}>
            <h3 style={{ 
              fontSize: '20px', 
              marginBottom: '15px',
              color: '#28a745'
            }}>
              ❓ Q&A
            </h3>
            <p style={{ 
              color: '#666',
              marginBottom: '20px'
            }}>
              질문하고 답변받기
            </p>
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px',
              display: 'inline-block'
            }}>
              이동하기
            </div>
          </div>

          <div style={{
            padding: '30px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            backgroundColor: '#f8f9fa'
          }}
          onClick={() => router.push('/exam/math')}>
            <h3 style={{ 
              fontSize: '20px', 
              marginBottom: '15px',
              color: '#ffc107'
            }}>
              🧮 수학
            </h3>
            <p style={{ 
              color: '#666',
              marginBottom: '20px'
            }}>
              수학 과목 시험
            </p>
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#333',
              borderRadius: '20px',
              fontSize: '14px',
              display: 'inline-block'
            }}>
              시작하기
            </div>
          </div>

          <div style={{
            padding: '30px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            backgroundColor: '#f8f9fa'
          }}
          onClick={() => router.push('/exam/science')}>
            <h3 style={{ 
              fontSize: '20px', 
              marginBottom: '15px',
              color: '#17a2b8'
            }}>
              🔬 과학
            </h3>
            <p style={{ 
              color: '#666',
              marginBottom: '20px'
            }}>
              과학 과목 시험
            </p>
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px',
              display: 'inline-block'
            }}>
              시작하기
            </div>
          </div>
        </div>

        <div style={{ 
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#e9ecef',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: '#495057',
            margin: '0',
            fontSize: '14px'
          }}>
            🚀 더 많은 기능이 준비 중입니다!
          </p>
        </div>
      </div>
    </div>
  );
}
