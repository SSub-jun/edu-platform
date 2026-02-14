'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ExamResultPage() {
  const router = useRouter();
  const [urlParams, setUrlParams] = useState<{ 
    subjectId: string | null;
    attemptId: string | null; 
    score: string | null; 
    finalScore: string | null;
    passed: boolean; 
    progressPercent: string | null;
    remainingTries: string | null;
  }>({
    subjectId: null,
    attemptId: null,
    score: null,
    finalScore: null,
    passed: false,
    progressPercent: null,
    remainingTries: null,
  });
  
  // URL 파라미터 파싱 (클라이언트 사이드)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlParams({
      subjectId: params.get('subjectId'),
      attemptId: params.get('attemptId'),
      score: params.get('score'),
      finalScore: params.get('finalScore'),
      passed: params.get('passed') === 'true',
      progressPercent: params.get('progressPercent'),
      remainingTries: params.get('remainingTries'),
    });
  }, []);
  
  const { subjectId, attemptId, score, finalScore, passed, progressPercent, remainingTries } = urlParams;
  const [showDetails, setShowDetails] = useState(false);
  const [restarting, setRestarting] = useState(false);

  // 파라미터 검증
  useEffect(() => {
    if (attemptId !== null && score !== null && !attemptId && !score) {
      router.push('/curriculum');
    }
  }, [attemptId, score, router]);

  const handleRetakeExam = () => {
    if (!subjectId) return;
    router.push(`/exam/${subjectId}`);
  };

  const handleRestartSubject = async () => {
    if (!subjectId) return;
    
    if (!confirm('과목을 다시 수강하시겠습니까?\n모든 강의 진도가 0%로 초기화되고, 3회의 새로운 시험 기회가 주어집니다.')) {
      return;
    }

    setRestarting(true);
    try {
      const response = await fetch(`http://localhost:4000/exam/subjects/${subjectId}/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('다시 수강하기 실패');
      }

      alert('과목이 초기화되었습니다. 모든 강의를 다시 수강해주세요.');
      router.push('/curriculum');
    } catch (error) {
      alert('다시 수강하기 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setRestarting(false);
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
  const finalScoreNum = finalScore ? parseFloat(finalScore) : 0;
  const progressNum = progressPercent ? parseFloat(progressPercent) : 0;
  const remainingTriesNum = remainingTries ? parseInt(remainingTries) : 0;
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
            {isPass ? '과목 수료!' : '미수료'}
          </h1>
          <p className="text-lg text-text-secondary">
            {isPass 
              ? '축하합니다! 과목을 수료하셨습니다!' 
              : '아쉽지만 수료 기준에 미달했습니다.'
            }
          </p>
        </div>

        {/* 점수 정보 */}
        <div className="mb-8">
          {/* 총점 */}
          <div className="bg-bg-primary border border-border rounded-xl p-8 text-center mb-4">
            <div className="text-sm text-text-tertiary mb-2">과목 총점</div>
            <div className={`text-5xl font-bold mb-4 ${isPass ? 'text-success' : 'text-error'}`}>
              {Math.round(finalScoreNum)}점
            </div>
            <div className="text-sm font-medium mb-4">
              {isPass ? (
                <span className="text-success">
                  ✅ 수료 완료 (총점 70점 이상)
                </span>
              ) : (
                <span className="text-error">
                  ❌ 수료 기준 미달 (총점 70점 미만)
                </span>
              )}
            </div>
            
            {/* 점수 구성 */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
              <div>
                <div className="text-xs text-text-tertiary mb-1">진도율 (20%)</div>
                <div className="text-2xl font-bold text-text-primary">
                  {Math.round(progressNum * 0.2)}점
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  ({Math.round(progressNum)}% 수강)
                </div>
              </div>
              <div>
                <div className="text-xs text-text-tertiary mb-1">시험 점수 (80%)</div>
                <div className="text-2xl font-bold text-text-primary">
                  {Math.round(scoreNum * 0.8)}점
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  (시험 {Math.round(scoreNum)}점)
                </div>
              </div>
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
                <span className="text-sm font-medium text-text-tertiary">수료 기준</span>
                <span className="text-sm text-text-primary">
                  진도 20점 + 평가 80점, 총점 70점 이상
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm font-medium text-text-tertiary">남은 시험 기회</span>
                <span className="text-sm text-text-primary">
                  {remainingTriesNum}회
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium text-text-tertiary">총 문항 수</span>
                <span className="text-sm text-text-primary">3문항</span>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mb-8">
          {isPass ? (
            // 수료 시 액션
            <div className="flex flex-col gap-3">
              <div className="text-center p-6 bg-success-bg border border-success rounded-lg mb-3">
                <p className="text-lg font-semibold text-success mb-2">🎊 과목을 수료하셨습니다!</p>
                <p className="text-sm text-text-secondary">
                  다른 과목을 확인하거나 강의를 복습해보세요.
                </p>
              </div>
              
              <Link href="/curriculum" className="w-full px-6 py-4 bg-primary text-text-primary rounded-lg font-semibold text-center transition-colors hover:bg-primary-600">
                커리큘럼으로 돌아가기
              </Link>
            </div>
          ) : (
            // 미수료 시 액션
            <div className="flex flex-col gap-3">
              {/* 남은 시험 기회에 따른 안내 */}
              {remainingTriesNum > 0 ? (
                <>
                  <div className="text-center p-4 bg-warning-bg border border-warning rounded-lg">
                    <p className="text-sm font-medium text-warning">
                      ⚠️ 남은 시험 기회: {remainingTriesNum}회
                    </p>
                  </div>
                  
                  <button 
                    className="w-full px-6 py-4 bg-primary text-text-primary rounded-lg font-semibold transition-all hover:bg-primary-600"
                    onClick={handleRetakeExam}
                  >
                    재응시하기
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center p-4 bg-error-bg border border-error rounded-lg">
                    <p className="text-sm font-medium text-error mb-2">
                      ❌ 시험 기회를 모두 사용했습니다
                    </p>
                    <p className="text-xs text-text-secondary">
                      과목을 다시 수강하면 3회의 새로운 시험 기회가 주어집니다.
                    </p>
                  </div>
                  
                  <button 
                    className="w-full px-6 py-4 bg-warning text-white rounded-lg font-semibold transition-all hover:bg-warning/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleRestartSubject}
                    disabled={restarting}
                  >
                    {restarting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        초기화 중...
                      </span>
                    ) : (
                      '🔄 다시 수강하기'
                    )}
                  </button>
                </>
              )}
              
              <Link 
                href="/curriculum"
                className="w-full px-6 py-3 bg-bg-primary text-text-secondary border-2 border-border rounded-lg font-semibold text-center transition-all hover:bg-surface hover:text-text-primary hover:border-border-light"
              >
                커리큘럼으로 돌아가기
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
                  <span className="text-2xl flex-shrink-0">📚</span>
                  <span className="text-base text-text-secondary">다른 과목을 수강하거나 강의를 복습하세요</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📊</span>
                  <span className="text-base text-text-secondary">커리큘럼에서 전체 진도를 확인하세요</span>
                </div>
              </>
            ) : remainingTriesNum > 0 ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📖</span>
                  <span className="text-base text-text-secondary">강의 내용을 다시 복습해보세요</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">✍️</span>
                  <span className="text-base text-text-secondary">남은 {remainingTriesNum}회의 기회로 재응시하세요</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🔄</span>
                  <span className="text-base text-text-secondary">과목을 다시 수강하여 새로운 시험 기회를 받으세요</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💪</span>
                  <span className="text-base text-text-secondary">모든 강의를 90% 이상 수강하면 다시 시험을 볼 수 있습니다</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
