'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '../../../../../lib/auth';

interface PortalAttempt {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  passed: boolean | null;
}

interface PortalParticipant {
  id: string;
  name: string;
  pin4: string;
  createdAt: string;
  attempts: PortalAttempt[];
}

interface PortalQuestion {
  id: string;
  stem: string;
  choices: Array<{
    id: string;
    label: string;
  }>;
  answerId: string;
}

interface PortalBank {
  id: string;
  title: string;
  questions: PortalQuestion[];
}

interface PortalSessionDetail {
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
  participants: PortalParticipant[];
}

export default function AdminPortalSessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<PortalSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'participants' | 'questions'>('participants');

  const loadSessionDetail = async () => {
    try {
      const response = await authClient.getApi().get(`/admin/portal/sessions/${sessionId}`);
      if (response.data.success) {
        setSession(response.data.data);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('세션 상세 로드 실패:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!session) return;
    
    const newStatus = !session.isPublished;
    const action = newStatus ? '활성화' : '비활성화';
    
    if (!confirm(`이 시험 세션을 ${action}하시겠습니까?`)) {
      return;
    }

    try {
      await authClient.getApi().put(`/admin/portal/sessions/${sessionId}/publish`, {
        isPublished: newStatus
      });
      
      alert(`시험 세션이 ${action}되었습니다.`);
      loadSessionDetail();
    } catch (error) {
      console.error('세션 상태 변경 실패:', error);
      alert(`세션 ${action}에 실패했습니다.`);
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

  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return '진행 중';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}분 ${seconds}초`;
  };

  const getSessionStatus = () => {
    if (!session) return { text: '', color: '' };
    if (session.closedAt) return { text: '종료됨', color: '#6c757d' };
    if (session.isPublished) return { text: '활성', color: '#28a745' };
    return { text: '비활성', color: '#dc3545' };
  };

  const getAttemptStatus = (attempt: PortalAttempt) => {
    if (!attempt.submittedAt) return { text: '응시 중', color: '#ffc107' };
    if (attempt.passed === true) return { text: '합격', color: '#28a745' };
    if (attempt.passed === false) return { text: '불합격', color: '#dc3545' };
    return { text: '완료', color: '#17a2b8' };
  };

  // 통계 계산
  const getStatistics = () => {
    if (!session) return null;
    
    const totalParticipants = session.participants.length;
    const completedAttempts = session.participants.filter(p => 
      p.attempts.some(a => a.submittedAt)
    ).length;
    const passedAttempts = session.participants.filter(p => 
      p.attempts.some(a => a.passed === true)
    ).length;
    
    const allScores = session.participants
      .flatMap(p => p.attempts)
      .filter(a => a.score !== null)
      .map(a => a.score!);
    
    const averageScore = allScores.length > 0 
      ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
      : null;
    
    const highestScore = allScores.length > 0 ? Math.max(...allScores) : null;
    const lowestScore = allScores.length > 0 ? Math.min(...allScores) : null;

    return {
      totalParticipants,
      completedAttempts,
      passedAttempts,
      completionRate: totalParticipants > 0 ? Math.round((completedAttempts / totalParticipants) * 100) : 0,
      passRate: completedAttempts > 0 ? Math.round((passedAttempts / completedAttempts) * 100) : 0,
      averageScore,
      highestScore,
      lowestScore
    };
  };

  useEffect(() => {
    if (sessionId) {
      loadSessionDetail();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#666', fontSize: '16px' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#dc3545', fontSize: '16px' }}>
          세션을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const status = getSessionStatus();
  const stats = getStatistics();

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
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <button
              onClick={() => router.push('/admin/portal/sessions')}
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
              ← 시험 세션 목록
            </button>
            
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#333',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {session.title}
              <span style={{
                fontSize: '12px',
                color: 'white',
                backgroundColor: status.color,
                padding: '4px 8px',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                {status.text}
              </span>
              <span style={{
                fontSize: '16px',
                color: '#333',
                backgroundColor: '#e9ecef',
                padding: '6px 12px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}>
                {session.code}
              </span>
            </h1>

            <div style={{ marginLeft: 'auto' }}>
              {!session.closedAt && (
                <button
                  onClick={handleTogglePublish}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: session.isPublished ? '#ffc107' : '#28a745',
                    color: session.isPublished ? '#333' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {session.isPublished ? '⏸️ 비활성화' : '▶️ 활성화'}
                </button>
              )}
            </div>
          </div>

          {/* 세션 정보 */}
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div><strong>세션 번호:</strong> #{session.sessionNo}</div>
            <div><strong>출제 방식:</strong> {session.mode === 'RANDOM' ? '랜덤' : '수동'}</div>
            <div><strong>문제 수:</strong> {session.questionCount}개</div>
            <div><strong>문제 은행:</strong> {session.bank?.title || '없음'}</div>
            <div><strong>생성일:</strong> {formatDate(session.createdAt)}</div>
            {session.closedAt && (
              <div><strong>종료일:</strong> {formatDate(session.closedAt)}</div>
            )}
          </div>
        </div>

        {/* 통계 */}
        {stats && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '15px',
            marginBottom: '30px'
          }}>
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>
                {stats.totalParticipants}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>총 참가자</div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                {stats.completedAttempts}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>완료자</div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#17a2b8' }}>
                {stats.completionRate}%
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>완주율</div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffc107' }}>
                {stats.passRate}%
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>합격률</div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6f42c1' }}>
                {stats.averageScore || 'N/A'}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>평균 점수</div>
            </div>

            {stats.highestScore !== null && (
              <div style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                  {stats.highestScore}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>최고 점수</div>
              </div>
            )}
          </div>
        )}

        {/* 탭 메뉴 */}
        <div style={{ 
          display: 'flex',
          gap: '2px',
          marginBottom: '20px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <button
            onClick={() => setActiveTab('participants')}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === 'participants' ? '#0070f3' : 'transparent',
              color: activeTab === 'participants' ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            👥 참가자 현황 ({session.participants.length})
          </button>

          {session.bank && (
            <button
              onClick={() => setActiveTab('questions')}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === 'questions' ? '#0070f3' : 'transparent',
                color: activeTab === 'questions' ? 'white' : '#666',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📝 출제 문제 ({session.bank.questions.length})
            </button>
          )}
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'participants' && (
          <div>
            {session.participants.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '50px',
                color: '#666',
                fontSize: '16px'
              }}>
                참가자가 없습니다.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {session.participants.map((participant) => {
                  const latestAttempt = participant.attempts[0];
                  const attemptStatus = latestAttempt ? getAttemptStatus(latestAttempt) : null;
                  
                  return (
                    <div
                      key={participant.id}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ 
                            margin: '0 0 8px 0',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            {participant.name}
                            <span style={{
                              fontSize: '12px',
                              color: '#666',
                              backgroundColor: '#e9ecef',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontFamily: 'monospace'
                            }}>
                              PIN: {participant.pin4}
                            </span>
                            {attemptStatus && (
                              <span style={{
                                fontSize: '11px',
                                color: 'white',
                                backgroundColor: attemptStatus.color,
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontWeight: '500'
                              }}>
                                {attemptStatus.text}
                              </span>
                            )}
                          </h4>
                          
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            <div>참가 시간: {formatDate(participant.createdAt)}</div>
                            {latestAttempt && (
                              <>
                                <div>시작 시간: {formatDate(latestAttempt.startedAt)}</div>
                                {latestAttempt.submittedAt && (
                                  <>
                                    <div>완료 시간: {formatDate(latestAttempt.submittedAt)}</div>
                                    <div>소요 시간: {formatDuration(latestAttempt.startedAt, latestAttempt.submittedAt)}</div>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {latestAttempt?.score !== null && (
                          <div style={{
                            textAlign: 'right',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: latestAttempt.passed ? '#28a745' : '#dc3545'
                          }}>
                            {latestAttempt.score}점
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && session.bank && (
          <div>
            <div style={{ 
              marginBottom: '20px',
              fontSize: '14px',
              color: '#666'
            }}>
              문제 은행: <strong>{session.bank.title}</strong> ({session.bank.questions.length}개 문제)
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              {session.bank.questions.map((question, index) => {
                const correctChoice = question.choices.find(c => c.id === question.answerId);
                
                return (
                  <div
                    key={question.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{ marginBottom: '15px' }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#666',
                        backgroundColor: '#e9ecef',
                        padding: '2px 8px',
                        borderRadius: '8px'
                      }}>
                        문제 #{index + 1}
                      </span>
                    </div>
                    
                    <div style={{ 
                      fontSize: '15px',
                      lineHeight: '1.5',
                      color: '#333',
                      marginBottom: '15px',
                      fontWeight: '500'
                    }}>
                      <strong>Q.</strong> {question.stem}
                    </div>

                    <div style={{ marginLeft: '15px' }}>
                      {question.choices.map((choice, choiceIndex) => (
                        <div 
                          key={choice.id}
                          style={{
                            margin: '6px 0',
                            padding: '8px 12px',
                            backgroundColor: choice.id === question.answerId ? '#d4edda' : 'white',
                            border: choice.id === question.answerId ? '1px solid #28a745' : '1px solid #e9ecef',
                            borderRadius: '4px',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ 
                            fontWeight: 'bold',
                            color: choice.id === question.answerId ? '#155724' : '#666'
                          }}>
                            {String.fromCharCode(65 + choiceIndex)}.
                          </span>
                          <span style={{ 
                            color: choice.id === question.answerId ? '#155724' : '#333'
                          }}>
                            {choice.label}
                          </span>
                          {choice.id === question.answerId && (
                            <span style={{
                              marginLeft: 'auto',
                              fontSize: '10px',
                              color: '#155724',
                              fontWeight: 'bold'
                            }}>
                              ✓ 정답
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

