'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLessonStatus } from '../../../../src/hooks/useLessonStatus';
import { useStartExam, useSubmitExam } from '../../../../src/hooks/useExam';
import ExamQuestionCard from '../../../../src/components/ExamQuestionCard';
import { getErrorMessage, actionHandlers } from '../../../../src/utils/errorMap';
import { ExamAnswer, StartExamResponse } from '../../../../src/types/api';
import styles from './page.module.css';

type ExamStep = 'preparation' | 'questions' | 'submitting';

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  
  const [examStep, setExamStep] = useState<ExamStep>('preparation');
  const [examData, setExamData] = useState<StartExamResponse['data'] | null>(null);
  const [answers, setAnswers] = useState<Map<string, ExamAnswer>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { data: lessonStatus, isLoading: statusLoading } = useLessonStatus(lessonId);
  const startExamMutation = useStartExam();
  const submitExamMutation = useSubmitExam();

  // 뒤로가기 방지
  useEffect(() => {
    if (examStep === 'questions') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '시험을 종료하시겠습니까? 진행 상황이 저장되지 않습니다.';
      };

      const handlePopState = () => {
        setShowExitConfirm(true);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [examStep]);

  const handleStartExam = async () => {
    try {
      const data = await startExamMutation.mutateAsync(lessonId);
      setExamData(data);
      setExamStep('questions');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      alert(`${errorMessage.title}: ${errorMessage.description}`);
      
      if (errorMessage.actionType && actionHandlers[errorMessage.actionType]) {
        actionHandlers[errorMessage.actionType]();
      }
    }
  };

  const handleAnswerSelect = (answer: ExamAnswer) => {
    setAnswers(prev => new Map(prev.set(answer.questionId, answer)));
  };

  const handleNextQuestion = () => {
    if (examData && currentQuestionIndex < examData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitExam = async () => {
    if (!examData) return;

    const answersArray = Array.from(answers.values());
    
    if (answersArray.length !== examData.questions.length) {
      alert('모든 문항에 답을 선택해주세요.');
      return;
    }

    if (!confirm('시험을 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')) {
      return;
    }

    try {
      setExamStep('submitting');
      const result = await submitExamMutation.mutateAsync({
        attemptId: examData.attemptId,
        answers: answersArray,
      });
      
      // 결과 페이지로 이동
      router.push(`/exam/result?attemptId=${examData.attemptId}&score=${result.examScore}&passed=${result.passed}`);
    } catch (error) {
      setExamStep('questions');
      const errorMessage = getErrorMessage(error);
      alert(`${errorMessage.title}: ${errorMessage.description}`);
    }
  };

  const isAllAnswered = examData ? answers.size === examData.questions.length : false;
  const currentQuestion = examData?.questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answers.get(currentQuestion.id)?.choiceIndex : undefined;

  if (statusLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!lessonStatus?.unlocked || lessonStatus.progressPercent < 90) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>시험을 시작할 수 없습니다</h3>
          <p>
            {!lessonStatus?.unlocked 
              ? '이 레슨에 접근할 권한이 없습니다.' 
              : '레슨 진도가 90% 이상이어야 시험을 볼 수 있습니다.'
            }
          </p>
          <Link href={`/lesson/${lessonId}`} className={styles.button}>
            레슨으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (examStep === 'preparation') {
    return (
      <div className={styles.container}>
        <div className={styles.preparationCard}>
          <div className={styles.examHeader}>
            <h1 className={styles.examTitle}>레슨 {lessonId} 시험</h1>
            <p className={styles.examDescription}>
              10문항의 객관식 문제가 출제됩니다. 70점 이상 시 합격입니다.
            </p>
          </div>

          <div className={styles.examConditions}>
            <h3 className={styles.conditionsTitle}>시험 조건 확인</h3>
            <div className={styles.conditionsList}>
              <div className={styles.conditionItem}>
                <span className={styles.conditionIcon}>✅</span>
                <span>레슨 진도: {Math.round(lessonStatus.progressPercent)}%</span>
              </div>
              <div className={styles.conditionItem}>
                <span className={styles.conditionIcon}>✅</span>
                <span>남은 시도: {lessonStatus.remainingTries}회</span>
              </div>
              <div className={styles.conditionItem}>
                <span className={styles.conditionIcon}>✅</span>
                <span>합격 기준: 70점 이상</span>
              </div>
            </div>
          </div>

          <div className={styles.examActions}>
            <Link href={`/lesson/${lessonId}`} className={styles.buttonSecondary}>
              레슨으로 돌아가기
            </Link>
            <button 
              className={styles.buttonPrimary}
              onClick={handleStartExam}
              disabled={startExamMutation.isPending}
            >
              {startExamMutation.isPending ? '시험 준비 중...' : '시험 시작'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (examStep === 'questions' && examData && currentQuestion) {
    return (
      <div className={styles.container}>
        <div className={styles.examProgress}>
          <div className={styles.examInfo}>
            <h2 className={styles.examTitle}>레슨 {lessonId} 시험</h2>
            <div className={styles.progressInfo}>
              {currentQuestionIndex + 1} / {examData.questions.length} 문항
            </div>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${((currentQuestionIndex + 1) / examData.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <ExamQuestionCard
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={examData.questions.length}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={handleAnswerSelect}
        />

        <div className={styles.examNavigation}>
          <button 
            className={styles.buttonSecondary}
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            이전 문제
          </button>

          <div className={styles.navigationInfo}>
            {answers.size}/{examData.questions.length} 문항 완료
          </div>

          {currentQuestionIndex === examData.questions.length - 1 ? (
            <button 
              className={`${styles.buttonPrimary} ${!isAllAnswered ? styles.buttonDisabled : ''}`}
              onClick={handleSubmitExam}
              disabled={!isAllAnswered}
            >
              제출하기
            </button>
          ) : (
            <button 
              className={styles.buttonPrimary}
              onClick={handleNextQuestion}
            >
              다음 문제
            </button>
          )}
        </div>

        {/* 종료 확인 모달 */}
        {showExitConfirm && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>시험을 종료하시겠습니까?</h3>
              <p>진행 상황이 저장되지 않습니다.</p>
              <div className={styles.modalActions}>
                <button 
                  className={styles.buttonSecondary}
                  onClick={() => setShowExitConfirm(false)}
                >
                  계속 진행
                </button>
                <button 
                  className={styles.buttonPrimary}
                  onClick={() => router.push(`/lesson/${lessonId}`)}
                >
                  종료
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (examStep === 'submitting') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>시험을 제출하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return null;
}