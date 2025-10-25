'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { authClient } from '../../lib/auth';
import { getErrorMessage } from '../../src/utils/errorMap';
import styles from './page.module.css';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  progressPercent: number;
  status: string;
}

interface Subject {
  id: string;
  name: string;
  description: string | null;
  lessons: Lesson[];
}

export default function CurriculumPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuthGuard();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examEligibility, setExamEligibility] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadCurriculum = async () => {
    try {
      // 과목 및 레슨 목록 조회
      // 임시: authClient 인터셉터 이슈 우회
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const rawResponse = await fetch(`${apiUrl}/me/curriculum`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store'
      });
      const response = await rawResponse.json();
      const curriculumData = response.data || [];

      // 각 Subject에 대한 시험 응시 가능 여부 조회
      const eligibilityData: Record<string, any> = {};
      for (const item of curriculumData) {
        try {
          const eligResponse = await authClient.getApi().get(
            `/exam/subjects/${item.subject.id}/check-eligibility`
          );
          eligibilityData[item.subject.id] = eligResponse.data;
        } catch (err) {
          console.error(`Failed to check eligibility for subject ${item.subject.id}:`, err);
          // API 실패 시에도 레슨 진도율 정보는 item.lessons에서 가져오기
          const lessonProgress = (item.lessons || []).map((lesson: any) => ({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            progressPercent: lesson.progressPercent || 0
          }));
          
          eligibilityData[item.subject.id] = {
            eligible: false,
            reason: '시험 응시 가능 여부를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.',
            remainingAttempts: 0,
            lessonProgress
          };
        }
      }

      // API 응답 형태: [{ subject: {...}, lessons: [...], remainingDays: number }]
      const subjectsData = curriculumData.map((item: any) => ({
        id: item.subject.id,
        name: item.subject.name,
        description: item.subject.description,
        lessons: item.lessons || []
      }));
      
      setSubjects(subjectsData);
      setExamEligibility(eligibilityData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCurriculum();
    }
  }, [isAuthenticated]);

  const handleStartExam = async (subjectId: string) => {
    const eligibility = examEligibility[subjectId];
    if (!eligibility?.eligible) {
      alert(eligibility?.reason || '시험 응시 조건을 만족하지 않습니다.');
      return;
    }

    if (eligibility.remainingAttempts === 0) {
      alert('최대 응시 횟수(3회)를 초과했습니다.');
      return;
    }

    router.push(`/exam/${subjectId}`);
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>나의 커리큘럼</h1>
            </div>
            <button
              onClick={logout}
              className={styles.logoutButton}
            >
              로그아웃
            </button>
          </div>
        </div>
        <div className={styles.loading}>
          <div>인증 확인 중...</div>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>나의 커리큘럼</h1>
        </div>
        <div className={styles.loading}>
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = getErrorMessage(error);
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>나의 커리큘럼</h1>
            </div>
            <button
              onClick={logout}
              className={styles.logoutButton}
            >
              로그아웃
            </button>
          </div>
        </div>
        <div className={styles.error}>
          <div className={styles.errorCard}>
            <h3 className={styles.errorTitle}>{errorMessage.title}</h3>
            <p className={styles.errorDescription}>{errorMessage.description}</p>
            {errorMessage.actionLabel && (
              <button 
                className={styles.errorButton}
                onClick={() => window.location.reload()}
              >
                {errorMessage.actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>나의 커리큘럼</h1>
            </div>
            <button
              onClick={logout}
              className={styles.logoutButton}
            >
              로그아웃
            </button>
          </div>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyCard}>
            <h3 className={styles.emptyTitle}>등록된 과목이 없습니다</h3>
            <p className={styles.emptyDescription}>
              관리자에게 커리큘럼 등록을 요청해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>나의 커리큘럼</h1>
            <p className={styles.subtitle}>
              총 {subjects.reduce((acc, subject) => acc + subject.lessons.length, 0)}개 레슨
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => router.push('/qna')}
              className={styles.qnaButton}
            >
              Q&A
            </button>
            <button
              onClick={logout}
              className={styles.logoutButton}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {subjects.map((subject) => {
          const eligibility = examEligibility[subject.id];
          const lessonProgress = eligibility?.lessonProgress || [];
          
          return (
            <div key={subject.id} className={styles.subjectSection}>
              <div className={styles.subjectHeader}>
                <div>
                  <h2 className={styles.subjectTitle}>{subject.name}</h2>
                  {subject.description && (
                    <p className={styles.subjectDescription}>
                      {subject.description}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => handleStartExam(subject.id)}
                  disabled={!eligibility?.eligible}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: eligibility?.eligible ? '#0070f3' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: eligibility?.eligible ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '140px'
                  }}
                >
                  <span>{eligibility?.eligible ? '✅ 시험 보기' : '🔒 시험 잠김'}</span>
                  {eligibility?.remainingAttempts !== undefined && (
                    <span style={{ fontSize: '11px', opacity: 0.9 }}>
                      (남은 횟수: {eligibility.remainingAttempts}회)
                    </span>
                  )}
                </button>
              </div>

              {/* 레슨 목록 */}
              <div style={{
                display: 'grid',
                gap: '12px',
                marginTop: '20px'
              }}>
                {lessonProgress
                  .sort((a: any, b: any) => {
                    const lessonA = subject.lessons.find(l => l.id === a.lessonId);
                    const lessonB = subject.lessons.find(l => l.id === b.lessonId);
                    return (lessonA?.order || 0) - (lessonB?.order || 0);
                  })
                  .map((progress: any) => {
                    const lesson = subject.lessons.find(l => l.id === progress.lessonId);
                    if (!lesson) return null;

                    const progressPercent = progress.progressPercent || 0;
                    const isCompleted = progressPercent >= 90;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => router.push(`/lesson/${lesson.id}`)}
                        style={{
                          padding: '16px 20px',
                          backgroundColor: 'white',
                          border: `2px solid ${isCompleted ? '#28a745' : '#e0e0e0'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <span>📹 {progress.lessonTitle || lesson.title}</span>
                            {isCompleted && (
                              <span style={{
                                fontSize: '12px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px'
                              }}>
                                ✓ 완료
                              </span>
                            )}
                          </div>
                          
                          {/* 진도율 바 */}
                          <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${progressPercent}%`,
                              height: '100%',
                              backgroundColor: isCompleted ? '#28a745' : '#0070f3',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>

                        <div style={{
                          marginLeft: '20px',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: isCompleted ? '#28a745' : '#666',
                          minWidth: '60px',
                          textAlign: 'right'
                        }}>
                          {Math.round(progressPercent)}%
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 시험 응시 불가 메시지 */}
              {!eligibility?.eligible && eligibility?.reason && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px 16px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  color: '#856404',
                  fontSize: '14px'
                }}>
                  ⚠️ {eligibility.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
