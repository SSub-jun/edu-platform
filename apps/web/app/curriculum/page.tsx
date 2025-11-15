'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { authClient } from '../../lib/auth';
import { getErrorMessage } from '../../src/utils/errorMap';

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
  order: number;
  // Subject 수료 정보
  progressPercent?: number;
  passed?: boolean;
  finalScore?: number;
  examAttemptCount?: number;
  remainingTries?: number;
  canTakeExam?: boolean;
  canRestart?: boolean;
}

interface CurriculumItem {
  subject: Subject;
  lessons: Lesson[];
  remainingDays: number;
}

export default function CurriculumPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuthGuard();
  const [curriculumData, setCurriculumData] = useState<CurriculumItem[]>([]);
  const [companyPeriod, setCompanyPeriod] = useState<{ startDate: string; endDate: string; remainingDays: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadCurriculum = async () => {
    try {
      // 과목 및 레슨 목록 조회
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const rawResponse = await fetch(`${apiUrl}/me/curriculum`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store'
      });
      const response = await rawResponse.json();
      const data = response.data || [];

      // API 응답 형태: [{ subject: {...}, lessons: [...], remainingDays: number }]
      if (data.length > 0) {
        // 수강 기간 정보 설정 (첫 번째 항목에서 가져옴)
        const firstItem = data[0];
        setCompanyPeriod({
          startDate: firstItem.subject.startDate || '',
          endDate: firstItem.subject.endDate || '',
          remainingDays: firstItem.remainingDays || 0
        });
      }

      setCurriculumData(data);
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

  const handleStartExam = async (subject: Subject) => {
    if (!subject.canTakeExam) {
      alert('시험 응시 조건을 만족하지 않습니다.');
      return;
    }

    router.push(`/exam/${subject.id}`);
  };

  const handleRestart = async (subject: Subject) => {
    if (!subject.canRestart) {
      alert('다시 수강하기 조건을 만족하지 않습니다.');
      return;
    }

    if (!confirm('모든 강의 진도가 0%로 초기화됩니다. 계속하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/exam/subjects/${subject.id}/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('다시 수강하기 요청에 실패했습니다.');
      }

      alert('다시 수강하기가 완료되었습니다. 모든 강의를 처음부터 다시 수강해주세요.');
      loadCurriculum(); // 새로고침
    } catch (err) {
      console.error('Restart failed:', err);
      alert('다시 수강하기 요청 중 오류가 발생했습니다.');
    }
  };

  const handleViewLessons = (subjectId: string) => {
    // 첫 번째 레슨으로 이동
    const item = curriculumData.find(d => d.subject.id === subjectId);
    if (item && item.lessons.length > 0) {
      const firstLesson = item.lessons.sort((a, b) => a.order - b.order)[0];
      router.push(`/lesson/${firstLesson.id}`);
    }
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary px-6 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-text-secondary">인증 확인 중...</div>
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
      <div className="min-h-screen bg-bg-primary px-6 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-text-secondary">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = getErrorMessage(error);
    return (
      <div className="min-h-screen bg-bg-primary px-6 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="bg-surface border border-error rounded-xl p-10 text-center max-w-md w-full">
            <h3 className="text-xl font-bold text-error mb-3">{errorMessage.title}</h3>
            <p className="text-base text-text-secondary mb-6 leading-relaxed">
              {errorMessage.description}
            </p>
            {errorMessage.actionLabel && (
              <button 
                className="bg-error text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-error/90 transition-colors"
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

  if (!curriculumData || curriculumData.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary px-6 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="bg-surface border border-border rounded-xl p-10 text-center max-w-md w-full">
            <h3 className="text-xl font-bold text-text-primary mb-3">등록된 과목이 없습니다</h3>
            <p className="text-base text-text-secondary leading-relaxed">
              관리자에게 커리큘럼 등록을 요청해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 수강 기간 정보 */}
        {companyPeriod && (
          <div className="bg-surface border border-border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-text-primary mb-4">📅 수강 기간</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="font-semibold">시작일:</span>
                <span>{companyPeriod.startDate ? new Date(companyPeriod.startDate).toLocaleDateString('ko-KR') : '-'}</span>
              </div>
              <div className="hidden md:block text-text-tertiary">~</div>
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="font-semibold">종료일:</span>
                <span>{companyPeriod.endDate ? new Date(companyPeriod.endDate).toLocaleDateString('ko-KR') : '-'}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className={`text-lg font-bold ${companyPeriod.remainingDays > 30 ? 'text-success' : companyPeriod.remainingDays > 7 ? 'text-warning' : 'text-error'}`}>
                  D-{companyPeriod.remainingDays}
                </span>
                <span className="text-sm text-text-tertiary">남음</span>
              </div>
            </div>
          </div>
        )}

        {/* 과목 카드 그리드 (3열 → 2열 → 1열) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {curriculumData.map((item) => {
            const subject = item.subject;
            const lessons = item.lessons;
            const avgProgress = subject.progressPercent || 0;
            const isPassed = subject.passed || false;
            const canTakeExam = subject.canTakeExam || false;
            const canRestart = subject.canRestart || false;
            const remainingTries = subject.remainingTries ?? 0;

            return (
              <div 
                key={subject.id} 
                className="bg-surface border border-border rounded-xl p-5 flex flex-col hover:shadow-lg transition-shadow"
              >
                {/* 과목 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-2">
                      {subject.name}
                    </h3>
                    {subject.description && (
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {subject.description}
                      </p>
                    )}
                  </div>
                  
                  {/* 수료 상태 뱃지 */}
                  <div className="ml-3">
                    {isPassed ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success text-white whitespace-nowrap">
                        ✓ 수료
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-warning text-white whitespace-nowrap">
                        미수료
                      </span>
                    )}
                  </div>
                </div>

                {/* 진도율 정보 */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-text-secondary">전체 진도율</span>
                    <span className="text-sm font-bold text-text-primary">{Math.round(avgProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        avgProgress >= 90 ? 'bg-success' : 'bg-info'
                      }`}
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>

                {/* 레슨 수 정보 */}
                <div className="text-sm text-text-tertiary mb-4">
                  총 {lessons.length}개 강의
                </div>

                {/* 액션 버튼들 */}
                <div className="mt-auto space-y-2">
                  {/* 수료한 경우 */}
                  {isPassed && (
                    <button
                      onClick={() => handleViewLessons(subject.id)}
                      className="w-full px-4 py-2.5 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-600 transition-colors"
                    >
                      강의 다시보기
                    </button>
                  )}

                  {/* 미수료 + 시험 가능 */}
                  {!isPassed && canTakeExam && (
                    <>
                      <button
                        onClick={() => handleStartExam(subject)}
                        className="w-full px-4 py-2.5 bg-info text-white rounded-md text-sm font-semibold hover:bg-info/90 transition-colors"
                      >
                        ✅ 시험 보기 ({remainingTries}/3회 남음)
                      </button>
                      <button
                        onClick={() => handleViewLessons(subject.id)}
                        className="w-full px-4 py-2.5 bg-surface border border-border text-text-primary rounded-md text-sm font-semibold hover:bg-bg-elevated transition-colors"
                      >
                        강의 보기
                      </button>
                    </>
                  )}

                  {/* 미수료 + 다시 수강하기 가능 */}
                  {!isPassed && canRestart && (
                    <>
                      <button
                        onClick={() => handleRestart(subject)}
                        className="w-full px-4 py-2.5 bg-warning text-white rounded-md text-sm font-semibold hover:bg-warning/90 transition-colors"
                      >
                        🔄 다시 수강하기
                      </button>
                      <button
                        onClick={() => handleViewLessons(subject.id)}
                        className="w-full px-4 py-2.5 bg-surface border border-border text-text-primary rounded-md text-sm font-semibold hover:bg-bg-elevated transition-colors"
                      >
                        강의 보기
                      </button>
                      <div className="text-xs text-error text-center mt-1">
                        ⚠️ 3회 시험 기회를 모두 사용했습니다
                      </div>
                    </>
                  )}

                  {/* 미수료 + 시험 불가 + 다시 수강 불가 (진도 부족) */}
                  {!isPassed && !canTakeExam && !canRestart && (
                    <>
                      <button
                        onClick={() => handleViewLessons(subject.id)}
                        className="w-full px-4 py-2.5 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-600 transition-colors"
                      >
                        강의 수강하기
                      </button>
                      <div className="text-xs text-text-tertiary text-center mt-1">
                        모든 강의 90% 이상 수강 시 시험 가능
                      </div>
                    </>
                  )}
                </div>

                {/* 최종 점수 표시 (수료한 경우) */}
                {isPassed && subject.finalScore !== undefined && (
                  <div className="mt-3 pt-3 border-t border-border text-center">
                    <span className="text-xs text-text-tertiary">최종 점수: </span>
                    <span className="text-sm font-bold text-success">{Math.round(subject.finalScore)}점</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
