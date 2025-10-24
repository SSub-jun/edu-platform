'use client';

export const dynamic = 'force-dynamic';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  enrollDate: string;
  lastLoginAt: string | null;
  company: {
    id: string;
    name: string;
  } | null;
  subjectProgress: Array<{
    subject: {
      id: string;
      name: string;
    };
    progressPercent: number;
    updatedAt: string;
  }>;
  recentExams: Array<{
    id: string;
    subjectId: string;
    subject: {
      id: string;
      name: string;
    };
    score: number | null;
    passed: boolean;
    submittedAt: string;
    attemptNumber: number;
  }>;
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthGuard();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resettingAttempts, setResettingAttempts] = useState<{[key: string]: boolean}>({});
  const [deletingAttempts, setDeletingAttempts] = useState<{[key: string]: boolean}>({});
  
  const studentId = params?.studentId as string;

  useEffect(() => {
    if (isAuthenticated && studentId) {
      loadStudentDetail();
    }
  }, [isAuthenticated, studentId]);

  const loadStudentDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // 개별 학생 정보 조회 API 호출
      const response = await fetch(`http://localhost:4000/instructor/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStudent(result.data);
        }
      } else {
        console.error('Failed to load student detail:', response.statusText);
        alert('학생 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error loading student detail:', error);
      alert('학생 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetExamAttempts = async (subjectId: string, subjectName: string) => {
    const resetKey = `${studentId}-${subjectId}`;
    if (resettingAttempts[resetKey]) return;
    
    if (!confirm(`${student?.name}님의 ${subjectName} 시험 시도 기록을 초기화하시겠습니까?\n\n모든 시험 기록이 삭제되고 다시 3번 응시할 수 있게 됩니다.`)) {
      return;
    }

    setResettingAttempts(prev => ({ ...prev, [resetKey]: true }));

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4000/exam/reset-attempts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: studentId,
          subjectId: subjectId
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`${subjectName} 시험 시도 기록이 성공적으로 초기화되었습니다.\n삭제된 기록 수: ${result.deletedCount}개`);
        // 학생 상세 정보 새로고침
        loadStudentDetail();
      } else {
        console.error('Failed to reset exam attempts:', result.message);
        alert('시험 시도 기록 초기화에 실패했습니다: ' + (result.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Error resetting exam attempts:', error);
      alert('시험 시도 기록 초기화 중 오류가 발생했습니다.');
    } finally {
      setResettingAttempts(prev => ({ ...prev, [resetKey]: false }));
    }
  };

  const deleteExamAttempt = async (attemptId: string, examInfo: { subjectName: string; score: number; attemptNumber: number }) => {
    if (deletingAttempts[attemptId]) return;
    
    if (!confirm(`정말로 이 시험 기록을 삭제하시겠습니까?\n\n과목: ${examInfo.subjectName}\n점수: ${examInfo.score}점\n회차: ${examInfo.attemptNumber}회\n\n삭제하면 학생이 해당 과목을 다시 시험 볼 수 있습니다.`)) {
      return;
    }

    setDeletingAttempts(prev => ({ ...prev, [attemptId]: true }));

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4000/exam/attempts/${attemptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`시험 기록이 성공적으로 삭제되었습니다.\n${result.message}`);
        // 학생 상세 정보 새로고침
        loadStudentDetail();
      } else {
        console.error('Failed to delete exam attempt:', result.message);
        alert('시험 기록 삭제에 실패했습니다: ' + (result.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Error deleting exam attempt:', error);
      alert('시험 기록 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingAttempts(prev => ({ ...prev, [attemptId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 90) return '#28a745';
    if (progress >= 70) return '#ffc107';
    if (progress >= 50) return '#fd7e14';
    return '#dc3545';
  };

  if (!isAuthenticated) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px'
      }}>
        학생 정보를 불러오는 중...
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px'
      }}>
        <div style={{ marginBottom: '20px' }}>학생 정보를 찾을 수 없습니다.</div>
        <Link href="/instructor/students" style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px'
        }}>
          ← 학생 목록으로 돌아가기
        </Link>
      </div>
    );
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
        {/* 헤더 */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px' 
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              color: '#333',
              margin: 0
            }}>
              👨‍🎓 {student.name} 학생 상세 정보
            </h1>
            <Link href="/instructor/students" style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}>
              ← 목록으로
            </Link>
          </div>
          
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            학생 관리 &gt; 학생 상세 정보
          </div>
        </div>

        {/* 기본 정보 카드 */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            marginBottom: '15px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 기본 정보
          </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
            <strong style={{ color: '#495057' }}>이메일:</strong> {student.email || '등록되지 않음'}
          </div>
          <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
            <strong style={{ color: '#495057' }}>등록일:</strong> {formatDate(student.enrollDate)}
          </div>
          <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
            <strong style={{ color: '#495057' }}>마지막 로그인:</strong> {
              student.lastLoginAt 
                ? formatDate(student.lastLoginAt)
                : '로그인 기록 없음'
            }
          </div>
          <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
            <strong style={{ color: '#495057' }}>소속 회사:</strong> {student.company?.name || '미지정'}
          </div>
        </div>
        </div>

        {/* 과목별 진도 현황 */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px 25px',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              margin: 0,
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📚 과목별 진도 현황
            </h2>
          </div>
        
        {student.subjectProgress.length > 0 ? (
          student.subjectProgress.map((progress) => {
            const recentExam = student.recentExams.find(exam => exam.subjectId === progress.subject.id);
            
            return (
              <div key={progress.subject.id} style={{
                padding: '25px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'white'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    color: '#333'
                  }}>
                    {progress.subject.name}
                  </h3>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '5px'
                    }}>
                      <span style={{ 
                        fontSize: '14px', 
                        marginRight: '10px',
                        minWidth: '80px'
                      }}>
                        진도율:
                      </span>
                      <div style={{
                        flex: 1,
                        backgroundColor: '#e9ecef',
                        height: '20px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        marginRight: '10px'
                      }}>
                        <div style={{
                          width: `${progress.progressPercent}%`,
                          height: '100%',
                          backgroundColor: getStatusColor(progress.progressPercent),
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: getStatusColor(progress.progressPercent),
                        minWidth: '50px'
                      }}>
                        {Math.round(progress.progressPercent)}%
                      </span>
                    </div>
                  </div>

                  {recentExam && (
                    <div style={{
                      fontSize: '12px',
                      color: '#495057',
                      marginBottom: '10px'
                    }}>
                      <div style={{ marginBottom: '3px' }}>
                        <strong>최근 시험:</strong> {recentExam.score}점 
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          backgroundColor: recentExam.passed ? '#d4edda' : '#f8d7da',
                          color: recentExam.passed ? '#155724' : '#721c24'
                        }}>
                          {recentExam.passed ? '합격' : '불합격'}
                        </span>
                      </div>
                      <div>
                        <strong>응시 회차:</strong> {recentExam.attemptNumber}회 | 
                        <strong> 응시일:</strong> {formatDate(recentExam.submittedAt)}
                      </div>
                    </div>
                  )}

                  <div style={{
                    fontSize: '12px',
                    color: '#6c757d'
                  }}>
                    마지막 업데이트: {formatDate(progress.updatedAt)}
                  </div>
                </div>

                <div style={{ marginLeft: '20px' }}>
                  <button
                    onClick={() => resetExamAttempts(progress.subject.id, progress.subject.name)}
                    disabled={resettingAttempts[`${studentId}-${progress.subject.id}`]}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: resettingAttempts[`${studentId}-${progress.subject.id}`] ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {resettingAttempts[`${studentId}-${progress.subject.id}`] ? '⏳ 처리중...' : '🔄 시험 초기화'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6c757d',
            backgroundColor: 'white',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            수강 중인 과목이 없습니다.
          </div>
        )}
        </div>

        {/* 시험 기록 */}
        {student.recentExams.length > 0 && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px 25px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold',
                margin: 0,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📊 최근 시험 기록
              </h2>
            </div>
          
            
            <div style={{ padding: '25px', backgroundColor: 'white' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1fr',
                gap: '10px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '15px',
                border: '1px solid #e9ecef',
                color: '#333'
              }}>
              <div>과목</div>
              <div>점수</div>
              <div>결과</div>
              <div>회차</div>
              <div>응시일</div>
              <div>액션</div>
            </div>
            
              {student.recentExams.map((exam) => (
                <div key={exam.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1fr',
                  gap: '10px',
                  padding: '12px',
                  borderBottom: '1px solid #e9ecef',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#333'
                }}>
                <div>{exam.subject.name}</div>
                <div>{exam.score || '-'}점</div>
                <div>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    backgroundColor: exam.passed ? '#d4edda' : '#f8d7da',
                    color: exam.passed ? '#155724' : '#721c24'
                  }}>
                    {exam.passed ? '합격' : '불합격'}
                  </span>
                </div>
                <div>{exam.attemptNumber}회</div>
                <div>{formatDate(exam.submittedAt)}</div>
                <div>
                  <button
                    onClick={() => deleteExamAttempt(exam.id, {
                      subjectName: exam.subject.name,
                      score: exam.score || 0,
                      attemptNumber: exam.attemptNumber
                    })}
                    disabled={deletingAttempts[exam.id]}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '500',
                      opacity: deletingAttempts[exam.id] ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {deletingAttempts[exam.id] ? '⏳' : '🗑️'}
                  </button>
                </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
