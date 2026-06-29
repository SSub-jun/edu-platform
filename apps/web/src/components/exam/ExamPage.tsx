'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ExamStartButton } from './ExamStartButton';
import { ExamQuestionCard } from './ExamQuestionCard';
import { useSubmitExam, useRetakeExam } from '../../hooks/useExam';
import { useLocale } from '../../i18n/client';
import { translateStudentText } from '../../i18n/studentTranslations';

interface ExamPageProps {
  lessonId: string;
  lessonTitle: string;
  progressPercent: number;
  hasPassedExam: boolean;
  canRetake?: boolean;
}

interface ExamData {
  attemptId: string;
  lessonId: string;
  questions: Array<{
    id: string;
    content: string;
    choices: string[];
  }>;
}

interface ExamResult {
  examScore: number;
  passed: boolean;
}

type ExamStep = 'start' | 'taking' | 'result';

export function ExamPage({ 
  lessonId, 
  lessonTitle, 
  progressPercent, 
  hasPassedExam,
  canRetake = false 
}: ExamPageProps) {
  const [currentStep, setCurrentStep] = useState<ExamStep>('start');
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const { locale } = useLocale();
  const t = (source: string) => translateStudentText(source, locale);

  const submitExamMutation = useSubmitExam();
  const retakeExamMutation = useRetakeExam();

  // 답변 완료도 계산
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = examData?.questions.length || 0;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isAllAnswered = answeredCount === totalQuestions;

  const handleExamStarted = (data: ExamData) => {
    setExamData(data);
    setAnswers({});
    setCurrentStep('taking');
    setShowValidation(false);
  };

  const handleAnswerSelect = (questionId: string, choiceIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceIndex
    }));
  };

  const handleSubmitExam = () => {
    if (!isAllAnswered) {
      setShowValidation(true);
      return;
    }

    if (!examData) return;

    const answerArray = examData.questions
      .map(question => ({
        questionId: question.id,
        choiceIndex: answers[question.id]
      }))
      .filter((answer): answer is { questionId: string; choiceIndex: number } => 
        answer.choiceIndex !== undefined
      );

    submitExamMutation.mutate(
      { attemptId: examData.attemptId, answers: answerArray },
      {
        onSuccess: (result) => {
          setExamResult(result);
          setCurrentStep('result');
        }
      }
    );
  };

  const handleRetake = () => {
    retakeExamMutation.mutate(lessonId, {
      onSuccess: () => {
        // 재응시 성공 후 시작 화면으로 이동
        setCurrentStep('start');
        setExamData(null);
        setAnswers({});
        setExamResult(null);
        setShowValidation(false);
      }
    });
  };

  const handleBackToStart = () => {
    setCurrentStep('start');
    setExamData(null);
    setAnswers({});
    setExamResult(null);
    setShowValidation(false);
  };

  // 시험 시작 화면
  if (currentStep === 'start') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t(`${lessonTitle} - 시험`)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('현재 진도')}</span>
                <span>{progressPercent.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('시험 정보')}</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>{t('• 문항 수: 3문항 (객관식)')}</li>
                <li>{t('• 시험 시간: 제한 없음')}</li>
                <li>{t('• 합격 기준: 70점 이상')}</li>
                <li>{t('• 응시 제한: 회차당 3회')}</li>
              </ul>
            </div>

            <ExamStartButton
              lessonId={lessonId}
              progressPercent={progressPercent}
              hasPassedExam={hasPassedExam}
              onExamStarted={handleExamStarted}
            />

            {canRetake && (
              <Button
                onClick={handleRetake}
                disabled={retakeExamMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {retakeExamMutation.isPending ? t('재응시 준비중...') : t('재응시하기')}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 시험 응시 화면
  if (currentStep === 'taking' && examData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 진행 상황 헤더 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t(`${lessonTitle} - 시험 응시`)}</h2>
              <div className="text-sm text-gray-600">
                {t(`${answeredCount} / ${totalQuestions} 문항 완료`)}
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* 문제 목록 */}
        <div className="space-y-4">
          {examData.questions.map((question, index) => (
            <ExamQuestionCard
              key={question.id}
              question={question}
              questionNumber={index + 1}
              selectedIndex={answers[question.id]}
              onSelect={handleAnswerSelect}
              showValidation={showValidation}
            />
          ))}
        </div>

        {/* 제출 영역 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <Button 
                onClick={handleBackToStart}
                variant="outline"
                disabled={submitExamMutation.isPending}
              >
                {t('시험 포기')}
              </Button>
              
              <Button
                onClick={handleSubmitExam}
                disabled={submitExamMutation.isPending}
                className={`${isAllAnswered ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
              >
                {submitExamMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('제출 중...')}</span>
                  </div>
                ) : (
                  t(`시험 제출 (${answeredCount}/${totalQuestions})`)
                )}
              </Button>
            </div>
            
            {showValidation && !isAllAnswered && (
              <p className="text-red-600 text-sm mt-2 text-center">
                {t('모든 문항에 답해주세요')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 시험 결과 화면
  if (currentStep === 'result' && examResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">{t('시험 결과')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 점수 표시 */}
            <div className="text-center space-y-4">
              <div className={`text-6xl font-bold ${examResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                {t(`${examResult.examScore.toFixed(0)}점`)}
              </div>
              
              <div className={`text-lg font-semibold ${examResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                {examResult.passed ? t('🎉 합격!') : t('❌ 불합격')}
              </div>
              
              <div className="text-sm text-gray-600">
                {t('합격 기준: 70점 이상')}
              </div>
            </div>

            {/* 결과 메시지 */}
            <div className={`p-4 rounded-lg ${examResult.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {examResult.passed ? (
                <div>
                  <p className="font-semibold">{t('축하합니다! 시험에 합격했습니다.')}</p>
                  <p className="text-sm mt-1">{t('다음 레슨을 학습할 수 있습니다.')}</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">{t('아쉽게도 불합격입니다.')}</p>
                  <p className="text-sm mt-1">{t('다시 학습 후 재응시해보세요.')}</p>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-3">
              {examResult.passed ? (
                <Button 
                  onClick={() => window.location.href = '/curriculum'}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {t('커리큘럼으로 돌아가기')}
                </Button>
              ) : (
                <Button 
                  onClick={handleBackToStart}
                  className="w-full"
                  variant="outline"
                >
                  {t('다시 시도하기')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}







