'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNextAvailable } from '../../../src/hooks/useNextAvailable';
import { useRetakeExam } from '../../../src/hooks/useExam';
import { getErrorMessage } from '../../../src/utils/errorMap';

export default function ExamResultPage() {
  const router = useRouter();
  const [urlParams, setUrlParams] = useState<{ attemptId: string | null; score: string | null; passed: boolean; lessonId: string | null }>({
    attemptId: null,
    score: null,
    passed: false,
    lessonId: null,
  });
  
  // URL 파라미터 파싱 (클라이언트 사이드)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlParams({
      attemptId: params.get('attemptId'),
      score: params.get('score'),
      passed: params.get('passed') === 'true',
      lessonId: params.get('lessonId'),
    });
  }, []);
  
  const { attemptId, score, passed, lessonId } = urlParams;
  const [showDetails, setShowDetails] = useState(false);
  
  const { data: nextAvailable, isLoading: nextLoading } = useNextAvailable();
  const retakeExamMutation = useRetakeExam();

  // 파라미터 검증
  useEffect(() => {
    if (attemptId !== null && score !== null && !attemptId && !score) {
      router.push('/curriculum');
    }
  }, [attemptId, score, router]);

  const handleRetakeExam = async () => {
    if (!lessonId) return;
    
    try {
      const result = await retakeExamMutation.mutateAsync(lessonId);
      if (result.allowed) {
        router.push(`/exam/lesson/${lessonId}`);
      } else {
        alert(result.message || '재응시할 수 없습니다.');
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      alert(`${errorMessage.title}: ${errorMessage.description}`);
    }
  };

  const handleNextLesson = () => {
    if (nextAvailable?.nextSubject) {
      router.push(`/lesson/${nextAvailable.nextSubject.lessonId}`);
    } else {
      router.push('/curriculum');
    }
  };

  if (!attemptId || !score) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
        <div className="text-center bg-surface border border-border rounded-xl p-10">
          <h3 className="text-xl font-bold text-text-primary mb-6">결과를 찾을 수 없습니다</h3>
          <Link href="/curriculum" className="inline-block px-6 py-3 bg-primary text-text-primary rounded-lg font-semibold transition-colors hover:bg-primary-600">
            커리큘럼으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const scoreNum = parseFloat(score);
  const isPass = passed;

  return (
    <div className="min-h-screen py-10 px-5 bg-bg-primary">
      <div className="max-w-3xl mx-auto bg-surface border border-border rounded-xl p-8 md:p-10">
        {/* 결과 헤더 */}
        <div className="text-center mb-8">
          <div className={`text-6xl mb-4 ${isPass ? 'animate-bounce' : ''}`}>
            {isPass ? '🎉' : '😔'}
          </div>
          <h1 className={`text-[32px] font-bold mb-3 ${isPass ? 'text-success' : 'text-error'}`}>
            {isPass ? '축하합니다!' : '아쉽지만...'}
          </h1>
          <p className="text-lg text-text-secondary">
            {isPass 
              ? '시험에 합격하셨습니다!' 
              : '시험에 불합격하셨습니다. 다시 도전해보세요!'
            }
          </p>
        </div>

        {/* 점수 정보 */}
        <div className="mb-8">
          <div className="bg-bg-primary border border-border rounded-xl p-8 text-center mb-4">
            <div className={`text-5xl font-bold mb-2 ${isPass ? 'text-success' : 'text-error'}`}>
              {Math.round(scoreNum)}점
            </div>
            <div className="text-base text-text-secondary mb-3">
              시험 점수
            </div>
            <div className="text-sm font-medium">
              {isPass ? (
                <span className="text-success">✅ 합격 (70점 이상)</span>
              ) : (
                <span className="text-error">❌ 불합격 (70점 미만)</span>
              )}
            </div>
          </div>

          {/* 상세 정보 토글 */}
          <button 
            className="w-full px-4 py-3 bg-bg-primary text-text-secondary border border-border rounded-lg text-sm font-medium transition-all hover:bg-surface hover:text-text-primary hover:border-border-light flex justify-between items-center"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>{showDetails ? '상세 정보 숨기기' : '상세 정보 보기'}</span>
            <span className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showDetails && (
            <div className="mt-4 p-5 bg-bg-primary border border-border rounded-lg animate-[slideDown_0.3s_ease-out]">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm font-medium text-text-tertiary">시도 ID</span>
                <span className="text-sm text-text-primary">{attemptId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm font-medium text-text-tertiary">합격 기준</span>
                <span className="text-sm text-text-primary">70점 이상</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium text-text-tertiary">총 문항 수</span>
                <span className="text-sm text-text-primary">10문항</span>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mb-8">
          {isPass ? (
            // 합격 시 액션
            <div className="flex flex-col gap-3">
              {!nextLoading && nextAvailable?.nextSubject ? (
                <button 
                  className="w-full px-6 py-4 bg-primary text-text-primary rounded-lg font-semibold transition-colors hover:bg-primary-600"
                  onClick={handleNextLesson}
                >
                  다음 레슨으로 이동
                </button>
              ) : (
                <div className="text-center p-6 bg-bg-primary border border-border rounded-lg mb-3">
                  <p className="text-lg font-semibold text-text-primary mb-4">🎊 모든 레슨을 완료하셨습니다!</p>
                  <Link href="/curriculum" className="inline-block px-6 py-3 bg-primary text-text-primary rounded-lg font-semibold transition-colors hover:bg-primary-600">
                    커리큘럼 확인
                  </Link>
                </div>
              )}
              
              <Link href="/curriculum" className="w-full px-6 py-3 bg-bg-primary text-text-secondary border-2 border-border rounded-lg font-semibold text-center transition-all hover:bg-surface hover:text-text-primary hover:border-border-light">
                커리큘럼으로 돌아가기
              </Link>
            </div>
          ) : (
            // 불합격 시 액션
            <div className="flex flex-col gap-3">
              {lessonId && (
                <button 
                  className="w-full px-6 py-4 bg-primary text-text-primary rounded-lg font-semibold transition-all hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleRetakeExam}
                  disabled={retakeExamMutation.isPending}
                >
                  {retakeExamMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      준비 중...
                    </span>
                  ) : (
                    '재응시하기'
                  )}
                </button>
              )}
              
              <Link 
                href={lessonId ? `/lesson/${lessonId}` : '/curriculum'} 
                className="w-full px-6 py-3 bg-bg-primary text-text-secondary border-2 border-border rounded-lg font-semibold text-center transition-all hover:bg-surface hover:text-text-primary hover:border-border-light"
              >
                {lessonId ? '레슨으로 돌아가기' : '커리큘럼으로'}
              </Link>
            </div>
          )}
        </div>

        {/* 다음 단계 안내 */}
        <div className="bg-bg-primary border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">다음 단계</h3>
          <div className="flex flex-col gap-3">
            {isPass ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📈</span>
                  <span className="text-base text-text-secondary">다음 레슨에서 새로운 내용을 학습하세요</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📊</span>
                  <span className="text-base text-text-secondary">진도율을 확인하고 전체 커리큘럼을 점검하세요</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📖</span>
                  <span className="text-base text-text-secondary">레슨 내용을 다시 복습해보세요</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🔄</span>
                  <span className="text-base text-text-secondary">재응시 기회를 활용해 다시 도전하세요</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
