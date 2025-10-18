'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../../lib/auth';

interface PortalBank {
  id: string;
  title: string;
}

interface PortalSession {
  id: string;
  sessionNo: number;
  code: string;
  title: string;
  mode: string;
  questionCount: number;
  isPublished: boolean;
  closedAt: string | null;
  createdAt: string;
  bank: PortalBank | null;
  participantsCount: number;
  completedAttemptsCount: number;
  averageScore: number | null;
}

interface PortalStatistics {
  banksCount: number;
  questionsCount: number;
  sessionsCount: number;
  activeSessions: number;
  totalParticipants: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number | null;
  completionRate: number;
}

export default function AdminPortalSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PortalSession[]>([]);
  const [banks, setBanks] = useState<PortalBank[]>([]);
  const [statistics, setStatistics] = useState<PortalStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSession, setNewSession] = useState({
    sessionNo: 1,
    code: '',
    title: '',
    bankId: '',
    mode: 'RANDOM' as 'RANDOM' | 'MANUAL',
    questionCount: 20
  });

  const loadData = async () => {
    try {
      // 세션 목록, 문제 은행 목록, 통계 동시 로드
      const [sessionsResponse, banksResponse, statsResponse] = await Promise.all([
        authClient.getApi().get('/admin/portal/sessions'),
        authClient.getApi().get('/admin/portal/banks'),
        authClient.getApi().get('/admin/portal/statistics')
      ]);

      if (sessionsResponse.data.success) {
        setSessions(sessionsResponse.data.data || []);
      }
      if (banksResponse.data.success) {
        setBanks(banksResponse.data.data || []);
      }
      if (statsResponse.data.success) {
        setStatistics(statsResponse.data.data);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setSessions([]);
      setBanks([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const generateSessionCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateSession = async () => {
    if (!newSession.title.trim() || !newSession.code.trim()) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    if (newSession.bankId && banks.length === 0) {
      alert('선택할 수 있는 문제 은행이 없습니다.');
      return;
    }

    try {
      await authClient.getApi().post('/admin/portal/sessions', {
        sessionNo: newSession.sessionNo,
        code: newSession.code.toUpperCase(),
        title: newSession.title.trim(),
        bankId: newSession.bankId || undefined,
        mode: newSession.mode,
        questionCount: newSession.questionCount
      });

      alert('시험 세션이 성공적으로 생성되었습니다.');
      setNewSession({
        sessionNo: newSession.sessionNo + 1,
        code: generateSessionCode(),
        title: '',
        bankId: '',
        mode: 'RANDOM',
        questionCount: 20
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('시험 세션 생성 실패:', error);
      alert('시험 세션 생성에 실패했습니다.');
    }
  };

  const handleTogglePublish = async (sessionId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? '활성화' : '비활성화';
    
    if (!confirm(`이 시험 세션을 ${action}하시겠습니까?`)) {
      return;
    }

    try {
      await authClient.getApi().put(`/admin/portal/sessions/${sessionId}/publish`, {
        isPublished: newStatus
      });
      
      alert(`시험 세션이 ${action}되었습니다.`);
      loadData();
    } catch (error) {
      console.error('세션 상태 변경 실패:', error);
      alert(`세션 ${action}에 실패했습니다.`);
    }
  };

  const handleDeleteSession = async (sessionId: string, title: string) => {
    if (!confirm(`'${title}' 세션을 정말 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await authClient.getApi().delete(`/admin/portal/sessions/${sessionId}`);
      alert('시험 세션이 삭제되었습니다.');
      loadData();
    } catch (error) {
      console.error('세션 삭제 실패:', error);
      alert('세션 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionStatus = (session: PortalSession) => {
    if (session.closedAt) return { text: '종료됨', color: '#6c757d' };
    if (session.isPublished) return { text: '활성', color: '#28a745' };
    return { text: '비활성', color: '#dc3545' };
  };

  useEffect(() => {
    loadData();
    // 세션 코드 초기 생성
    setNewSession(prev => ({
      ...prev,
      code: generateSessionCode()
    }));
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => router.push('/admin')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← 관리자 대시보드
            </button>
            
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#333',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎮 시험 세션 관리
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => router.push('/admin/portal/banks')}
              style={{
                padding: '10px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🏦 문제 은행 관리
            </button>
            
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '12px 20px',
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
              ➕ 새 시험 세션
            </button>
          </div>
        </div>

        {/* 통계 대시보드 */}
        {statistics && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '30px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3', marginBottom: '5px' }}>
                {statistics.sessionsCount}
              </div>
              <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                총 세션
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
                {statistics.activeSessions}
              </div>
              <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                활성 세션
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8', marginBottom: '5px' }}>
                {statistics.totalParticipants}
              </div>
              <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                총 참가자
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107', marginBottom: '5px' }}>
                {statistics.completionRate}%
              </div>
              <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                완주율
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1', marginBottom: '5px' }}>
                {statistics.averageScore || 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                평균 점수
              </div>
            </div>
          </div>
        )}

        {/* 새 세션 생성 폼 */}
        {showCreateForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '25px',
            borderRadius: '8px',
            marginBottom: '30px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#333',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              새 시험 세션 생성
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  세션 번호 *
                </label>
                <input
                  type="number"
                  value={newSession.sessionNo}
                  onChange={(e) => setNewSession({ ...newSession, sessionNo: parseInt(e.target.value) || 1 })}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  세션 코드 *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newSession.code}
                    onChange={(e) => setNewSession({ ...newSession, code: e.target.value.toUpperCase() })}
                    placeholder="ABC123XY"
                    maxLength={8}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    onClick={() => setNewSession({ ...newSession, code: generateSessionCode() })}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🎲
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  문제 수 *
                </label>
                <input
                  type="number"
                  value={newSession.questionCount}
                  onChange={(e) => setNewSession({ ...newSession, questionCount: parseInt(e.target.value) || 20 })}
                  min="1"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  세션 제목 *
                </label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  placeholder="시험 세션 제목을 입력하세요"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  출제 방식 *
                </label>
                <select
                  value={newSession.mode}
                  onChange={(e) => setNewSession({ ...newSession, mode: e.target.value as 'RANDOM' | 'MANUAL' })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="RANDOM">랜덤 출제</option>
                  <option value="MANUAL">수동 선택</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  문제 은행 (선택사항)
                </label>
                <select
                  value={newSession.bankId}
                  onChange={(e) => setNewSession({ ...newSession, bankId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">문제 은행 선택 안함</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreateSession}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                세션 생성
              </button>
              
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 세션 목록 */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            로딩 중...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            생성된 시험 세션이 없습니다.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '20px'
          }}>
            <div style={{ 
              marginBottom: '15px',
              fontSize: '16px',
              color: '#666'
            }}>
              총 {sessions.length}개의 시험 세션
            </div>

            {sessions.map((session) => {
              const status = getSessionStatus(session);
              
              return (
                <div
                  key={session.id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '25px',
                    backgroundColor: '#fafafa',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '15px'
                      }}>
                        <h3 style={{ 
                          margin: 0,
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#333'
                        }}>
                          {session.title}
                        </h3>
                        
                        <span style={{
                          fontSize: '12px',
                          color: 'white',
                          backgroundColor: status.color,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          {status.text}
                        </span>

                        <span style={{
                          fontSize: '14px',
                          color: '#333',
                          backgroundColor: '#e9ecef',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontFamily: 'monospace',
                          fontWeight: 'bold'
                        }}>
                          {session.code}
                        </span>
                      </div>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '15px',
                        color: '#666',
                        fontSize: '14px',
                        marginBottom: '15px'
                      }}>
                        <div>
                          <strong>세션 #:</strong> {session.sessionNo}
                        </div>
                        <div>
                          <strong>출제 방식:</strong> {session.mode === 'RANDOM' ? '랜덤' : '수동'}
                        </div>
                        <div>
                          <strong>문제 수:</strong> {session.questionCount}개
                        </div>
                        <div>
                          <strong>참가자:</strong> {session.participantsCount}명
                        </div>
                        <div>
                          <strong>완료:</strong> {session.completedAttemptsCount}명
                        </div>
                        <div>
                          <strong>평균 점수:</strong> {session.averageScore || 'N/A'}점
                        </div>
                      </div>

                      {session.bank && (
                        <div style={{ 
                          fontSize: '13px',
                          color: '#666',
                          marginBottom: '10px'
                        }}>
                          <strong>문제 은행:</strong> {session.bank.title}
                        </div>
                      )}

                      <div style={{ 
                        fontSize: '12px',
                        color: '#999'
                      }}>
                        생성일: {formatDate(session.createdAt)}
                        {session.closedAt && ` | 종료일: ${formatDate(session.closedAt)}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
                      <button
                        onClick={() => router.push(`/admin/portal/sessions/${session.id}`)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        📊 상세 보기
                      </button>
                      
                      {!session.closedAt && (
                        <button
                          onClick={() => handleTogglePublish(session.id, session.isPublished)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: session.isPublished ? '#ffc107' : '#28a745',
                            color: session.isPublished ? '#333' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {session.isPublished ? '⏸️ 비활성화' : '▶️ 활성화'}
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteSession(session.id, session.title)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

