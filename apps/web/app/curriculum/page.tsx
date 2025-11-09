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
      <div className="min-h-screen bg-bg-primary px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-10">
            <h1 className="text-[32px] font-bold text-text-primary">나의 커리큘럼</h1>
            <button
              onClick={logout}
              className="bg-error text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-error/90 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
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
        <div className="max-w-7xl mx-auto">
          <h1 className="text-[32px] font-bold text-text-primary mb-10">나의 커리큘럼</h1>
        </div>
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
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-10">
            <h1 className="text-[32px] font-bold text-text-primary">나의 커리큘럼</h1>
            <button
              onClick={logout}
              className="bg-error text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-error/90 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
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

  if (!subjects || subjects.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-10">
            <h1 className="text-[32px] font-bold text-text-primary">나의 커리큘럼</h1>
            <button
              onClick={logout}
              className="bg-error text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-error/90 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
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
        {/* Header */}
        <div className="flex justify-between items-start mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-text-primary mb-2">나의 커리큘럼</h1>
            <p className="text-lg text-text-secondary font-medium">
              총 {subjects.reduce((acc, subject) => acc + subject.lessons.length, 0)}개 레슨
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/qna')}
              className="bg-info text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-info/90 transition-colors"
            >
              Q&A
            </button>
            <button
              onClick={logout}
              className="bg-error text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-error/90 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-12">
        {subjects.map((subject) => {
          const eligibility = examEligibility[subject.id];
          const lessonProgress = eligibility?.lessonProgress || [];
          
          return (
            <div key={subject.id} className="bg-surface border border-border rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-4 border-b border-border">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">{subject.name}</h2>
                  {subject.description && (
                    <p className="text-base text-text-secondary leading-relaxed">
                      {subject.description}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => handleStartExam(subject.id)}
                  disabled={!eligibility?.eligible}
                  className={`flex flex-col items-center gap-1 px-6 py-3 rounded-md text-sm font-semibold min-w-[140px] transition-colors ${
                    eligibility?.eligible 
                      ? 'bg-info text-white hover:bg-info/90 cursor-pointer' 
                      : 'bg-text-tertiary text-white cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>{eligibility?.eligible ? '✅ 시험 보기' : '🔒 시험 잠김'}</span>
                  {eligibility?.remainingAttempts !== undefined && (
                    <span className="text-[11px] opacity-90">
                      (남은 횟수: {eligibility.remainingAttempts}회)
                    </span>
                  )}
                </button>
              </div>

              {/* 레슨 목록 */}
              <div className="grid gap-3 mt-5">
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
                        className={`p-4 md:px-5 bg-white rounded-lg cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 flex justify-between items-center gap-4 ${
                          isCompleted 
                            ? 'border-2 border-success' 
                            : 'border-2 border-gray-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-base font-bold text-gray-800">
                              📹 {progress.lessonTitle || lesson.title}
                            </span>
                            {isCompleted && (
                              <span className="text-[12px] bg-success text-white px-2 py-0.5 rounded-full">
                                ✓ 완료
                              </span>
                            )}
                          </div>
                          
                          {/* 진도율 바 */}
                          <div className="w-full h-2 bg-gray-100 rounded overflow-hidden">
                            <div 
                              className={`h-full transition-[width] duration-300 ease-linear ${
                                isCompleted ? 'bg-success' : 'bg-info'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className={`ml-5 text-lg font-bold min-w-[60px] text-right ${
                          isCompleted ? 'text-success' : 'text-gray-600'
                        }`}>
                          {Math.round(progressPercent)}%
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 시험 응시 불가 메시지 */}
              {!eligibility?.eligible && eligibility?.reason && (
                <div className="mt-4 p-3 md:p-4 bg-warning-bg border border-warning rounded-md text-warning text-sm">
                  ⚠️ {eligibility.reason}
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
