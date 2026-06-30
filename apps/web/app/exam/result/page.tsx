'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '../../../src/i18n/client';
import { translateStudentText } from '../../../src/i18n/studentTranslations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ExamResultPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = (source: string) => translateStudentText(source, locale);
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
    
    if (!confirm(`${t('과목을 다시 수강하시겠습니까?')}\n${t('모든 강의 진도가 0%로 초기화되고, 3회의 새로운 시험 기회가 주어집니다.')}`)) {
      return;
    }

    setRestarting(true);
    try {
      const response = await fetch(`${API_URL}/exam/subjects/${subjectId}/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('다시 수강하기 실패'));
      }

      alert(t('과목이 초기화되었습니다. 모든 강의를 다시 수강해주세요.'));
      router.push('/curriculum');
    } catch (error) {
      alert(t('다시 수강하기 중 오류가 발생했습니다.'));
      console.error(error);
    } finally {
      setRestarting(false);
    }
  };

  if (!attemptId || !score) {
    return (
      <div className="student-page flex items-center justify-center">
        <div className="student-panel p-10 text-center">
          <h3 className="text-xl font-bold text-text-primary mb-6">{t('결과를 찾을 수 없습니다')}</h3>
          <Link href="/curriculum" className="student-button-primary">
            {t('커리큘럼으로 돌아가기')}
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
    <div className="student-page">
      <div className="student-container max-w-3xl">
      <div className="student-panel-strong p-4 md:p-8">
        {/* 결과 헤더 */}
        <div className="mb-5 text-center md:mb-8">
          <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-4 text-2xl font-black md:mb-4 md:h-20 md:w-20 md:text-3xl ${
            isPass ? 'border-success bg-success-bg text-success' : 'border-error bg-error-bg text-error'
          }`}>
            {isPass ? 'PASS' : '!'}
          </div>
          <h1 className={`mb-2 text-2xl font-black md:mb-3 md:text-3xl ${isPass ? 'text-success' : 'text-error'}`}>
            {isPass ? t('과목 수료!') : t('미수료')}
          </h1>
          <p className="text-sm text-text-secondary md:text-lg">
            {isPass 
              ? t('축하합니다! 과목을 수료하셨습니다!')
              : t('아쉽지만 수료 기준에 미달했습니다.')
            }
          </p>
        </div>

        {/* 점수 정보 */}
        <div className="mb-5 md:mb-8">
          {/* 총점 */}
          <div className="mb-4 rounded-lg border border-border bg-bg-elevated p-4 text-center md:rounded-xl md:p-8">
            <div className="text-sm text-text-tertiary mb-2">{t('과목 총점')}</div>
            <div className={`mb-3 text-4xl font-bold md:mb-4 md:text-5xl ${isPass ? 'text-success' : 'text-error'}`}>
              {t(`${Math.round(finalScoreNum)}점`)}
            </div>
            <div className="text-sm font-medium mb-4">
              {isPass ? (
                <span className="text-success">
                  {t('수료 완료 (총점 70점 이상)')}
                </span>
              ) : (
                <span className="text-error">
                  {t('수료 기준 미달 (총점 70점 미만)')}
                </span>
              )}
            </div>
            
            {/* 점수 구성 */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 md:mt-6 md:gap-4 md:pt-6">
              <div>
                <div className="text-xs text-text-tertiary mb-1">{t('진도율 (20%)')}</div>
                <div className="text-xl font-bold text-text-primary md:text-2xl">
                  {t(`${Math.round(progressNum * 0.2)}점`)}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {t(`(${Math.round(progressNum)}% 수강)`)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-tertiary mb-1">{t('시험 점수 (80%)')}</div>
                <div className="text-xl font-bold text-text-primary md:text-2xl">
                  {t(`${Math.round(scoreNum * 0.8)}점`)}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {t(`(시험 ${Math.round(scoreNum)}점)`)}
                </div>
              </div>
            </div>
          </div>

          {/* 상세 정보 토글 */}
          <button 
            className="student-button-secondary w-full justify-between text-sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>{showDetails ? t('상세 정보 숨기기') : t('상세 정보 보기')}</span>
            <span className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showDetails && (
            <div className="mt-4 rounded-lg border border-border bg-bg-elevated p-5 animate-[slideDown_0.3s_ease-out]">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm font-medium text-text-tertiary">{t('시도 ID')}</span>
                <span className="text-sm text-text-primary">{attemptId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm font-medium text-text-tertiary">{t('수료 기준')}</span>
                <span className="text-sm text-text-primary">
                  {t('진도 20점 + 평가 80점, 총점 70점 이상')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm font-medium text-text-tertiary">{t('남은 시험 기회')}</span>
                <span className="text-sm text-text-primary">
                  {t(`${remainingTriesNum}회`)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium text-text-tertiary">{t('총 문항 수')}</span>
                <span className="text-sm text-text-primary">{t('3문항')}</span>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mb-5 md:mb-8">
          {isPass ? (
            // 수료 시 액션
            <div className="flex flex-col gap-3">
              <div className="mb-3 rounded-lg border border-success bg-success-bg p-4 text-center md:p-6">
                <p className="mb-1 text-base font-semibold text-success md:mb-2 md:text-lg">{t('과목을 수료하셨습니다!')}</p>
                <p className="hidden text-sm text-text-secondary md:block">
                  {t('다른 과목을 확인하거나 강의를 복습해보세요.')}
                </p>
              </div>
              
              <Link href="/curriculum" className="student-button-primary w-full">
                {t('커리큘럼으로 돌아가기')}
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
                      {t(`남은 시험 기회: ${remainingTriesNum}회`)}
                    </p>
                  </div>
                  
                  <button 
                    className="student-button-primary w-full"
                    onClick={handleRetakeExam}
                  >
                    {t('재응시하기')}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center p-4 bg-error-bg border border-error rounded-lg">
                    <p className="text-sm font-medium text-error mb-2">
                      {t('시험 기회를 모두 사용했습니다')}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {t('과목을 다시 수강하면 3회의 새로운 시험 기회가 주어집니다.')}
                    </p>
                  </div>
                  
                  <button 
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-warning px-5 py-3 text-base font-bold text-white transition-colors hover:bg-warning/90 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleRestartSubject}
                    disabled={restarting}
                  >
                    {restarting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        {t('초기화 중...')}
                      </span>
                    ) : (
                      t('다시 수강하기')
                    )}
                  </button>
                </>
              )}
              
              <Link 
                href="/curriculum"
                className="student-button-secondary w-full"
              >
                {t('커리큘럼으로 돌아가기')}
              </Link>
            </div>
          )}
        </div>

        {/* 다음 단계 안내 */}
        <div className="student-panel p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">{t('다음 단계')}</h3>
          <div className="flex flex-col gap-3">
            {isPass ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-success" />
                  <span className="text-base text-text-secondary">{t('다른 과목을 수강하거나 강의를 복습하세요')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-success" />
                  <span className="text-base text-text-secondary">{t('커리큘럼에서 전체 진도를 확인하세요')}</span>
                </div>
              </>
            ) : remainingTriesNum > 0 ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-warning" />
                  <span className="text-base text-text-secondary">{t('강의 내용을 다시 복습해보세요')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-warning" />
                  <span className="text-base text-text-secondary">{t(`남은 ${remainingTriesNum}회의 기회로 재응시하세요`)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-warning" />
                  <span className="text-base text-text-secondary">{t('과목을 다시 수강하여 새로운 시험 기회를 받으세요')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-warning" />
                  <span className="text-base text-text-secondary">{t('모든 강의를 90% 이상 수강하면 다시 시험을 볼 수 있습니다')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
