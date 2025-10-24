'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNextAvailable } from '../../../src/hooks/useNextAvailable';
import { useRetakeExam } from '../../../src/hooks/useExam';
import { getErrorMessage } from '../../../src/utils/errorMap';
import styles from './page.module.css';

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
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>결과를 찾을 수 없습니다</h3>
          <Link href="/curriculum" className={styles.button}>
            커리큘럼으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const scoreNum = parseFloat(score);
  const isPass = passed;

  return (
    <div className={styles.container}>
      <div className={styles.resultCard}>
        {/* 결과 헤더 */}
        <div className={styles.resultHeader}>
          <div className={`${styles.resultIcon} ${isPass ? styles.passIcon : styles.failIcon}`}>
            {isPass ? '🎉' : '😔'}
          </div>
          <h1 className={styles.resultTitle}>
            {isPass ? '축하합니다!' : '아쉽지만...'}
          </h1>
          <p className={styles.resultSubtitle}>
            {isPass 
              ? '시험에 합격하셨습니다!' 
              : '시험에 불합격하셨습니다. 다시 도전해보세요!'
            }
          </p>
        </div>

        {/* 점수 정보 */}
        <div className={styles.scoreSection}>
          <div className={styles.scoreCard}>
            <div className={styles.scoreValue}>
              {Math.round(scoreNum)}점
            </div>
            <div className={styles.scoreLabel}>
              시험 점수
            </div>
            <div className={styles.scoreStatus}>
              {isPass ? (
                <span className={styles.passText}>✅ 합격 (70점 이상)</span>
              ) : (
                <span className={styles.failText}>❌ 불합격 (70점 미만)</span>
              )}
            </div>
          </div>

          {/* 상세 정보 토글 */}
          <button 
            className={styles.detailsToggle}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '상세 정보 숨기기' : '상세 정보 보기'} 
            <span className={`${styles.toggleIcon} ${showDetails ? styles.toggleIconOpen : ''}`}>
              ▼
            </span>
          </button>

          {showDetails && (
            <div className={styles.detailsContent}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>시도 ID</span>
                <span className={styles.detailValue}>{attemptId}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>합격 기준</span>
                <span className={styles.detailValue}>70점 이상</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>총 문항 수</span>
                <span className={styles.detailValue}>10문항</span>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className={styles.actionSection}>
          {isPass ? (
            // 합격 시 액션
            <div className={styles.passActions}>
              {!nextLoading && nextAvailable?.nextSubject ? (
                <button 
                  className={styles.buttonPrimary}
                  onClick={handleNextLesson}
                >
                  다음 레슨으로 이동
                </button>
              ) : (
                <div className={styles.completionMessage}>
                  <p>🎊 모든 레슨을 완료하셨습니다!</p>
                  <Link href="/curriculum" className={styles.buttonPrimary}>
                    커리큘럼 확인
                  </Link>
                </div>
              )}
              
              <Link href="/curriculum" className={styles.buttonSecondary}>
                커리큘럼으로 돌아가기
              </Link>
            </div>
          ) : (
            // 불합격 시 액션
            <div className={styles.failActions}>
              {lessonId && (
                <button 
                  className={styles.buttonPrimary}
                  onClick={handleRetakeExam}
                  disabled={retakeExamMutation.isPending}
                >
                  {retakeExamMutation.isPending ? '준비 중...' : '재응시하기'}
                </button>
              )}
              
              <Link 
                href={lessonId ? `/lesson/${lessonId}` : '/curriculum'} 
                className={styles.buttonSecondary}
              >
                {lessonId ? '레슨으로 돌아가기' : '커리큘럼으로'}
              </Link>
            </div>
          )}
        </div>

        {/* 다음 단계 안내 */}
        <div className={styles.nextStepsSection}>
          <h3 className={styles.nextStepsTitle}>다음 단계</h3>
          <div className={styles.nextStepsList}>
            {isPass ? (
              <>
                <div className={styles.nextStepItem}>
                  <span className={styles.stepIcon}>📈</span>
                  <span>다음 레슨에서 새로운 내용을 학습하세요</span>
                </div>
                <div className={styles.nextStepItem}>
                  <span className={styles.stepIcon}>📊</span>
                  <span>진도율을 확인하고 전체 커리큘럼을 점검하세요</span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.nextStepItem}>
                  <span className={styles.stepIcon}>📖</span>
                  <span>레슨 내용을 다시 복습해보세요</span>
                </div>
                <div className={styles.nextStepItem}>
                  <span className={styles.stepIcon}>🔄</span>
                  <span>재응시 기회를 활용해 다시 도전하세요</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}