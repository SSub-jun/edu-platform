'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../../hooks/useAuthGuard';

export default function PortalExamPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthGuard();
  const [sessionCode, setSessionCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 사용자 role 확인
  useState(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (e) {
        console.error('토큰 파싱 실패:', e);
      }
    }
  });

  const handleJoinExam = async () => {
    if (!sessionCode.trim() || !participantName.trim() || !pin.trim()) {
      alert('모든 필드를 입력해 주세요.');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      alert('PIN은 4자리 숫자여야 합니다.');
      return;
    }

    setLoading(true);
    
    try {
      // 포털 API로 참가자 등록 시도
      const response = await fetch('http://localhost:5000/api/participants/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sessionCode.toUpperCase(),
          name: participantName,
          pin4: pin
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 세션 정보를 저장하고 시험 페이지로 이동
          sessionStorage.setItem('portalSession', JSON.stringify({
            sessionId: result.data.sessionId,
            participantId: result.data.participantId,
            sessionCode: sessionCode.toUpperCase(),
            participantName: participantName
          }));
          
          router.push(`/portal/exam/${result.data.sessionId}/take`);
        } else {
          alert(result.error || '세션 참여에 실패했습니다.');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || '세션 참여에 실패했습니다.');
      }
    } catch (error) {
      console.error('세션 참여 오류:', error);
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>인증 중...</div>;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '100%',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {/* 헤더 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => {
              // role에 따라 다른 페이지로 이동
              if (userRole === 'instructor') {
                router.push('/instructor');
              } else if (userRole === 'admin') {
                router.push('/admin');
              } else {
                router.push('/student');
              }
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginRight: '15px'
            }}
          >
            ← 대시보드
          </button>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: '#333',
            margin: 0
          }}>
            🎯 시험 포털
          </h1>
        </div>

        {/* 안내 메시지 */}
        <div style={{
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #2196f3'
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            color: '#1976d2',
            fontSize: '16px'
          }}>
            📋 실시간 시험 참여
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: '14px',
            color: '#424242',
            lineHeight: '1.5'
          }}>
            강사로부터 받은 <strong>세션 코드</strong>를 입력하여 실시간 시험에 참여하세요.
          </p>
        </div>

        {/* 입력 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '14px'
            }}>
              세션 코드
            </label>
            <input
              type="text"
              placeholder="예: ABC123 (6자리 대문자+숫자)"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '16px',
                fontFamily: 'monospace',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '14px'
            }}>
              참가자 이름
            </label>
            <input
              type="text"
              placeholder="실명을 입력해 주세요"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '14px'
            }}>
              4자리 PIN
            </label>
            <input
              type="text"
              placeholder="4자리 숫자 PIN"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 4) {
                  setPin(value);
                }
              }}
              maxLength={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '16px',
                fontFamily: 'monospace',
                textAlign: 'center',
                letterSpacing: '4px'
              }}
            />
          </div>

          <button
            onClick={handleJoinExam}
            disabled={loading || !sessionCode.trim() || !participantName.trim() || !pin.trim()}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '참여 중...' : '🚀 시험 참여하기'}
          </button>
        </div>

        {/* 도움말 */}
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '6px',
          border: '1px solid #ffc107'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '14px' }}>
            💡 도움말
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#856404' }}>
            <li>세션 코드는 강사가 제공하는 6자리 코드입니다</li>
            <li>4자리 PIN은 중복되지 않도록 설정해 주세요</li>
            <li>시험 시작 전 네트워크 연결 상태를 확인하세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

