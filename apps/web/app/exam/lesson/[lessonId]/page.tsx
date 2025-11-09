'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLessonStatus } from '../../../../src/hooks/useLessonStatus';
import { useStartExam, useSubmitExam } from '../../../../src/hooks/useExam';
import ExamQuestionCard from '../../../../src/components/ExamQuestionCard';
import { getErrorMessage, actionHandlers } from '../../../../src/utils/errorMap';
import { ExamAnswer, StartExamResponse } from '../../../../src/types/api';

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
      router.push(`/exam/result?attemptId=${examData.attemptId}&score=${result.examScore}&passed=${result.passed}&lessonId=${lessonId}`);
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
        <div className="flex items-center gap-2 text-lg text-text-secondary">
          <div className="w-5 h-5 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin"></div>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!lessonStatus?.unlocked || lessonStatus.progressPercent < 90) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
        <div className="text-center bg-surface border border-border rounded-xl p-10 max-w-md">
          <h3 className="text-xl font-bold text-text-primary mb-4">시험을 시작할 수 없습니다</h3>
          <p className="text-base text-text-secondary mb-6">
            {!lessonStatus?.unlocked 
              ? '이 레슨에 접근할 권한이 없습니다.' 
              : '레슨 진도가 90% 이상이어야 시험을 볼 수 있습니다.'
            }
          </p>
          <Link href={`/lesson/${lessonId}`} className="inline-block px-6 py-3 bg-primary text-text-primary rounded-lg font-semibold transition-colors hover:bg-primary-600">
            레슨으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (examStep === 'preparation') {
    return (
      <div className="min-h-screen py-10 px-5 bg-bg-primary">
        <div className="max-w-2xl mx-auto bg-surface border border-border rounded-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-text-primary mb-3">레슨 {lessonId} 시험</h1>
            <p className="text-base text-text-secondary">
              10문항의 객관식 문제가 출제됩니다. 70점 이상 시 합격입니다.
            </p>
          </div>

          <div className="bg-bg-primary border border-border rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-text-primary mb-4">시험 조건 확인</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-text-secondary">
                <span className="text-2xl">✅</span>
                <span className="text-base">레슨 진도: {Math.round(lessonStatus.progressPercent)}%</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <span className="text-2xl">✅</span>
                <span className="text-base">남은 시도: {lessonStatus.remainingTries}회</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <span className="text-2xl">✅</span>
                <span className="text-base">합격 기준: 70점 이상</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <Link href={`/lesson/${lessonId}`} className="flex-1 px-6 py-3 bg-bg-primary text-text-secondary border-2 border-border rounded-lg font-semibold text-center transition-all hover:bg-surface hover:text-text-primary hover:border-border-light">
              레슨으로 돌아가기
            </Link>
            <button 
              className="flex-1 px-6 py-3 bg-primary text-text-primary rounded-lg font-semibold transition-all hover:bg-primary-600 active:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleStartExam}
              disabled={startExamMutation.isPending}
            >
              {startExamMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  시험 준비 중...
                </span>
              ) : (
                '시험 시작'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (examStep === 'questions' && examData && currentQuestion) {
    return (
      <div className="min-h-screen py-6 px-4 bg-bg-primary">
        <div className="max-w-4xl mx-auto">
          {/* 진행 상황 */}
          <div className="bg-surface border border-border rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-text-primary">레슨 {lessonId} 시험</h2>
              <div className="text-sm text-text-secondary font-medium">
                {currentQuestionIndex + 1} / {examData.questions.length} 문항
              </div>
            </div>
            <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden border border-border">
              <div 
                className="h-full bg-primary rounded-full transition-[width] duration-300 ease-linear"
                style={{ width: `${((currentQuestionIndex + 1) / examData.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 문제 카드 */}
          <ExamQuestionCard
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={examData.questions.length}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
          />

          {/* 네비게이션 */}
          <div className="flex justify-between items-center gap-4 mt-6 bg-surface border border-border rounded-xl p-5">
            <button 
              className="px-5 py-2.5 bg-bg-primary text-text-secondary border border-border rounded-md font-medium transition-all hover:bg-surface hover:text-text-primary hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              이전 문제
            </button>

            <div className="text-sm font-medium text-text-secondary">
              {answers.size}/{examData.questions.length} 문항 완료
            </div>

            {currentQuestionIndex === examData.questions.length - 1 ? (
              <button 
                className={`px-5 py-2.5 rounded-md font-semibold transition-all ${
                  isAllAnswered 
                    ? 'bg-success text-white hover:bg-success/90 cursor-pointer' 
                    : 'bg-text-tertiary text-white cursor-not-allowed opacity-60'
                }`}
                onClick={handleSubmitExam}
                disabled={!isAllAnswered}
              >
                제출하기
              </button>
            ) : (
              <button 
                className="px-5 py-2.5 bg-primary text-text-primary rounded-md font-semibold transition-all hover:bg-primary-600"
                onClick={handleNextQuestion}
              >
                다음 문제
              </button>
            )}
          </div>

          {/* 종료 확인 모달 */}
          {showExitConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-surface border border-border rounded-xl p-8 max-w-md w-full">
                <h3 className="text-xl font-bold text-text-primary mb-3">시험을 종료하시겠습니까?</h3>
                <p className="text-base text-text-secondary mb-6">진행 상황이 저장되지 않습니다.</p>
                <div className="flex gap-3">
                  <button 
                    className="flex-1 px-5 py-3 bg-bg-primary text-text-secondary border border-border rounded-lg font-semibold transition-all hover:bg-surface hover:text-text-primary hover:border-border-light"
                    onClick={() => setShowExitConfirm(false)}
                  >
                    계속 진행
                  </button>
                  <button 
                    className="flex-1 px-5 py-3 bg-error text-white rounded-lg font-semibold transition-colors hover:bg-error/90"
                    onClick={() => router.push(`/lesson/${lessonId}`)}
                  >
                    종료
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (examStep === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-text-tertiary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-lg text-text-secondary font-medium">시험을 제출하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return null;
}
