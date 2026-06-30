'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { getErrorMessage } from '../../src/utils/errorMap';
import { useLocale } from '../../src/i18n/client';
import { translateStudentText } from '../../src/i18n/studentTranslations';

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
  const { locale } = useLocale();
  const [curriculumData, setCurriculumData] = useState<CurriculumItem[]>([]);
  const [companyPeriod, setCompanyPeriod] = useState<{ startDate: string; endDate: string; remainingDays: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const t = (source: string) => translateStudentText(source, locale);
  const dateLocale = locale === 'ko' ? 'ko-KR' : locale === 'th' ? 'th-TH' : locale === 'bn' ? 'bn-BD' : 'en-US';

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

      console.log('[CURRICULUM] API Response:', response);
      console.log('[CURRICULUM] Data length:', data.length);
      console.log('[CURRICULUM] Data:', data);

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
      alert(t('시험 응시 조건을 만족하지 않습니다.'));
      return;
    }

    router.push(`/exam/${subject.id}`);
  };

  const handleRestart = async (subject: Subject) => {
    if (!subject.canRestart) {
      alert(t('다시 수강하기 조건을 만족하지 않습니다.'));
      return;
    }

    if (!confirm(t('모든 강의 진도가 0%로 초기화됩니다. 계속하시겠습니까?'))) {
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
        throw new Error(t('다시 수강하기 요청에 실패했습니다.'));
      }

      alert(t('다시 수강하기가 완료되었습니다. 모든 강의를 처음부터 다시 수강해주세요.'));
      loadCurriculum(); // 새로고침
    } catch (err) {
      console.error('Restart failed:', err);
      alert(t('다시 수강하기 요청 중 오류가 발생했습니다.'));
    }
  };

  const handleViewLessons = (subjectId: string) => {
    const item = curriculumData.find(d => d.subject.id === subjectId);
    if (!item || item.lessons.length === 0) return;

    const sortedLessons = item.lessons.sort((a, b) => a.order - b.order);
    
    // 1. 진행 중인 레슨 찾기 (0% < progress < 100%)
    const inProgressLesson = sortedLessons.find(
      lesson => lesson.progressPercent > 0 && lesson.progressPercent < 100
    );
    
    if (inProgressLesson) {
      router.push(`/lesson/${inProgressLesson.id}`);
      return;
    }

    // 2. 아직 시작 안 한 첫 번째 레슨 찾기 (progress === 0%)
    const notStartedLesson = sortedLessons.find(
      lesson => lesson.progressPercent === 0
    );
    
    if (notStartedLesson) {
      router.push(`/lesson/${notStartedLesson.id}`);
      return;
    }

    // 3. 모든 레슨이 완료된 경우 첫 번째 레슨으로 (복습용)
    if (sortedLessons[0]) {
      router.push(`/lesson/${sortedLessons[0].id}`);
    }
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="student-page">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-text-secondary">{t('인증 확인 중...')}</div>
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
      <div className="student-page">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-text-secondary">{t('로딩 중...')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = getErrorMessage(error);
    return (
      <div className="student-page">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="student-panel p-10 text-center max-w-md w-full border-error">
            <h3 className="text-xl font-bold text-error mb-3">{t(errorMessage.title)}</h3>
            <p className="text-base text-text-secondary mb-6 leading-relaxed">
              {t(errorMessage.description)}
            </p>
            {errorMessage.actionLabel && (
              <button 
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-error px-6 py-3 text-base font-bold text-white transition-colors hover:bg-error/90"
                onClick={() => window.location.reload()}
              >
                {t(errorMessage.actionLabel)}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!curriculumData || curriculumData.length === 0) {
    return (
      <div className="student-page">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="student-panel p-10 text-center max-w-md w-full">
            <h3 className="text-xl font-bold text-text-primary mb-3">{t('등록된 과목이 없습니다')}</h3>
            <p className="text-base text-text-secondary leading-relaxed">
              {t('관리자에게 커리큘럼 등록을 요청해주세요.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="student-container">
        <div className="mb-6 rounded-xl border border-border bg-primary p-5 text-white shadow-md md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-white/75">{t('강의실')}</p>
              <h1 className="mt-1 text-2xl font-black md:text-4xl">{t('배정된 교육과정')}</h1>
              <p className="mt-2 max-w-2xl text-base font-medium leading-relaxed text-white/85">
                {t('교육 기간 안에 강의를 수강하고 시험을 완료해주세요.')}
              </p>
            </div>
            <button
              onClick={logout}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10 md:self-start"
            >
              {t('로그아웃')}
            </button>
          </div>
        </div>
        {/* 수강 기간 정보 */}
        {companyPeriod && (
          <div className="student-panel mb-8 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-text-primary">{t('수강 기간')}</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 text-base text-text-secondary sm:grid-cols-2">
                  <div className="student-stat">
                    <div className="text-sm font-bold text-text-tertiary">{t('시작일:')}</div>
                    <div className="mt-1 text-lg font-bold text-text-primary">{companyPeriod.startDate ? new Date(companyPeriod.startDate).toLocaleDateString(dateLocale) : '-'}</div>
                  </div>
                  <div className="student-stat">
                    <div className="text-sm font-bold text-text-tertiary">{t('종료일:')}</div>
                    <div className="mt-1 text-lg font-bold text-text-primary">{companyPeriod.endDate ? new Date(companyPeriod.endDate).toLocaleDateString(dateLocale) : '-'}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-bg-elevated px-6 py-5 text-center md:min-w-44">
                <div className="text-sm font-bold text-text-tertiary">{t('남은 기간')}</div>
                <div className={`mt-1 text-4xl font-black ${companyPeriod.remainingDays > 30 ? 'text-success' : companyPeriod.remainingDays > 7 ? 'text-warning' : 'text-error'}`}>
                  D-{companyPeriod.remainingDays}
                </div>
                <div className="text-sm font-bold text-text-tertiary">{t('남음')}</div>
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
                className="student-panel flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md md:p-6"
              >
                {/* 과목 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-text-primary mb-2 line-clamp-2">
                      {subject.name}
                    </h3>
                  {subject.description && (
                      <p className="text-base text-text-secondary line-clamp-2">
                      {subject.description}
                    </p>
                  )}
                </div>
                
                  {/* 수료 상태 뱃지 */}
                  <div className="ml-3">
                    {isPassed ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-success-bg border border-success text-success whitespace-nowrap">
                        {t('수료')}
                    </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-warning-bg border border-warning text-warning whitespace-nowrap">
                        {t('미수료')}
                              </span>
                            )}
                  </div>
                          </div>
                          
                {/* 진도율 정보 */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-text-secondary">{t('전체 진도율')}</span>
                    <span className="text-sm font-bold text-text-primary">{Math.round(avgProgress)}%</span>
                  </div>
                  <div className="student-progress-track">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${avgProgress >= 90 ? 'bg-success' : 'bg-info'}`}
                      style={{ width: `${avgProgress}%` }}
                    />
                          </div>
                        </div>

                {/* 레슨 수 정보 */}
                <div className="student-muted-box mb-4 text-sm font-bold">
                  {t(`총 ${lessons.length}개 강의`)}
                        </div>

                {/* 액션 버튼들 */}
                <div className="mt-auto space-y-2">
                  {/* 수료한 경우 */}
                  {isPassed && (
                    <button
                      onClick={() => handleViewLessons(subject.id)}
                      className="student-button-primary w-full"
                    >
                      {t('강의 다시보기')}
                    </button>
                  )}

                  {/* 미수료 + 시험 가능 */}
                  {!isPassed && canTakeExam && (
                    <>
                      <button
                        onClick={() => handleStartExam(subject)}
                        className="student-button-primary w-full"
                      >
                        {t(`시험 보기 (${remainingTries}/3회 남음)`)}
                      </button>
                      <button
                        onClick={() => handleViewLessons(subject.id)}
                        className="student-button-secondary w-full"
                      >
                        {t('강의 보기')}
                      </button>
                    </>
                  )}

                  {/* 미수료 + 다시 수강하기 가능 */}
                  {!isPassed && canRestart && (
                    <>
                      <button
                        onClick={() => handleRestart(subject)}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-warning px-5 py-3 text-base font-bold text-white transition-colors hover:bg-warning/90"
                      >
                        {t('다시 수강하기')}
                      </button>
                      <button
                        onClick={() => handleViewLessons(subject.id)}
                        className="student-button-secondary w-full"
                      >
                        {t('강의 보기')}
                      </button>
                      <div className="text-xs text-error text-center mt-1">
                        {t('3회 시험 기회를 모두 사용했습니다')}
                      </div>
                    </>
                  )}

                  {/* 미수료 + 시험 불가 + 다시 수강 불가 (진도 부족) */}
                  {!isPassed && !canTakeExam && !canRestart && (
                    <>
                      <button
                        onClick={() => handleViewLessons(subject.id)}
                        className="student-button-primary w-full"
                      >
                        {t('강의 수강하기')}
                      </button>
                      <div className="text-xs text-text-tertiary text-center mt-1">
                        {t('모든 강의 90% 이상 수강 시 시험 가능')}
              </div>
                    </>
                  )}
                </div>

                {/* 최종 점수 표시 (수료한 경우) */}
                {isPassed && subject.finalScore !== undefined && (
                  <div className="mt-3 pt-3 border-t border-border text-center">
                    <span className="text-xs text-text-tertiary">{t('최종 점수:')} </span>
                    <span className="text-sm font-bold text-success">{t(`${Math.round(subject.finalScore)}점`)}</span>
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
