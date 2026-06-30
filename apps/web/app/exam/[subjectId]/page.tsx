'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStoredLocale } from '../../../src/i18n/client';
import { useLocale } from '../../../src/i18n/client';
import { translateStudentText } from '../../../src/i18n/studentTranslations';

interface Question {
  id: string;
  content: string; // 백엔드에서 content로 반환됨
  choices: string[];
}

interface ExamData {
  attemptId: string;
  questions: Question[];
  subjectName?: string;
  attemptNumber?: number;
  remainingTries?: number;
}

interface SubjectStatus {
  progressPercent: number;
  examAttemptCount: number;
  remainingTries: number;
  canTakeExam: boolean;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const { locale } = useLocale();
  const t = (source: string) => translateStudentText(source, locale);

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [subjectStatus, setSubjectStatus] = useState<SubjectStatus | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    loadSubjectStatus();
  }, [subjectId, router]);

  const loadSubjectStatus = async () => {
    try {
      // 먼저 Subject 상태 확인
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const statusResponse = await fetch(`${apiUrl}/me/curriculum`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(t('과목 상태 조회 실패'));
      }

      const curriculum = await statusResponse.json();
      // API 응답 구조: { success: true, data: [{ subject: {...}, lessons: [...], remainingDays: number }] }
      const data = curriculum.data || [];
      const curriculumItem = data.find((item: any) => item.subject?.id === subjectId);
      const subject = curriculumItem?.subject;

      if (!subject) {
        console.error('[EXAM] Curriculum data:', curriculum);
        console.error('[EXAM] Looking for subjectId:', subjectId);
        console.error('[EXAM] Available subjects:', data.map((item: any) => item.subject?.id));
        throw new Error(t('과목을 찾을 수 없습니다'));
      }

      if (!subject.canTakeExam) {
        alert(`${t('시험 응시 조건을 만족하지 않습니다.')}\n${t('모든 강의를 90% 이상 수강해주세요.')}`);
        router.push('/curriculum');
        return;
      }

      setSubjectStatus({
        progressPercent: subject.progressPercent,
        examAttemptCount: subject.examAttemptCount || 0,
        remainingTries: subject.remainingTries || 3,
        canTakeExam: subject.canTakeExam,
      });

      // 시험 시작
      await startExam(subject.name);
    } catch (error) {
      alert(t('시험을 준비할 수 없습니다.'));
      console.error(error);
      router.push('/curriculum');
      setLoading(false);
    }
  };

  const startExam = async (subjectName?: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const locale = getStoredLocale();
      const response = await fetch(`${apiUrl}/exam/subjects/${subjectId}/start?locale=${locale}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        // 422 오류 등 상세 오류 메시지 추출
        let errorMessage = t('시험 시작 실패');
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (e) {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setExamData({
        ...data,
        subjectName,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('시험을 시작할 수 없습니다.');
      alert(errorMessage);
      console.error('[EXAM] Start exam error:', error);
      router.push('/curriculum');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, choiceIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceIndex
    }));
  };

  const handleBackToDashboard = () => {
    // 토큰에서 role 확인하여 적절한 페이지로 이동
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid JWT token format');
        }
        const payload = JSON.parse(atob(tokenParts[1]!)); // JWT는 항상 3개 부분으로 구성
        const userRole = payload.role;

        if (userRole === 'instructor') {
          router.push('/instructor');
        } else if (userRole === 'admin') {
          router.push('/admin');
        } else {
          router.push('/curriculum'); // 학생은 curriculum으로 이동
        }
      } catch (e) {
        // 토큰 파싱 실패 시 curriculum으로
        router.push('/curriculum');
      }
    } else {
      router.push('/login');
    }
  };

  const handleSubmit = async () => {
    if (!examData) return;

    const unansweredCount = examData.questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      if (!confirm(t(`${unansweredCount}개 문제가 답변되지 않았습니다. 제출하시겠습니까?`))) {
        return;
      }
    }

    setSubmitting(true);
    try {
      // answers를 API 형식에 맞게 변환
      const formattedAnswers = Object.entries(answers).map(([questionId, choiceIndex]) => ({
        questionId,
        choiceIndex
      }));

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/exam/attempts/${examData.attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (!response.ok) {
        throw new Error(t('시험 제출 실패'));
      }

      const data = await response.json();

      // Subject 기반 결과 페이지로 이동
      router.push(`/exam/result?subjectId=${subjectId}&attemptId=${examData.attemptId}&score=${data.examScore}&finalScore=${data.finalScore || 0}&passed=${data.passed || false}&progressPercent=${subjectStatus?.progressPercent || 0}&remainingTries=${(subjectStatus?.remainingTries || 3) - 1}`);
    } catch (error) {
      alert(t('시험 제출 중 오류가 발생했습니다.'));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="student-page flex items-center justify-center">
        <div className="flex items-center gap-2 text-lg text-text-secondary">
          <div className="w-5 h-5 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin"></div>
          {t('시험을 준비 중입니다...')}
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="student-page flex items-center justify-center">
        <div className="text-lg text-text-secondary">{t('시험 데이터를 불러올 수 없습니다.')}</div>
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="student-container max-w-4xl">
      <div className="student-panel-strong p-4 md:p-8">
        {/* 시험 헤더 */}
        <div className="mb-5 md:mb-8">
          <div className="mb-4 flex items-start justify-between gap-3 md:mb-5 md:gap-4">
            <div>
              <p className="student-kicker">{t('학습평가')}</p>
              <h1 className="student-title mt-1">
                {t(`${examData.subjectName || '과목'} 시험`)}
              </h1>
              <p className="student-copy mt-2 hidden md:block">
                {t('모든 문제에 답변한 후 제출해주세요')}
              </p>
            </div>
            <div className="shrink-0 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-black text-text-primary md:px-4 md:py-3 md:text-base">
              {t(`${examData.questions.length}문제`)}
            </div>
          </div>

          {/* 시험 정보 카드 */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <div className="student-stat text-center">
              <div className="text-xs text-text-tertiary mb-1">{t('현재 진도율')}</div>
              <div className="text-lg font-bold text-text-primary">
                {Math.round(subjectStatus?.progressPercent || 0)}%
              </div>
            </div>
            <div className="student-stat text-center">
              <div className="text-xs text-text-tertiary mb-1">{t('시험 차수')}</div>
              <div className="text-lg font-bold text-text-primary">
                {t(`${(subjectStatus?.examAttemptCount || 0) + 1}회차`)}
              </div>
            </div>
            <div className="student-stat text-center">
              <div className="text-xs text-text-tertiary mb-1">{t('남은 기회')}</div>
              <div className="text-lg font-bold text-warning">
                {t(`${subjectStatus?.remainingTries || 3}회`)}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 md:mb-8">
          {examData.questions.map((question, index) => (
            <div key={question.id} className="mb-4 rounded-lg border border-border bg-bg-elevated p-4 md:mb-6 md:rounded-xl md:p-6">
              <h3 className="mb-4 text-base font-black leading-relaxed text-text-primary md:mb-5 md:text-lg">
                {index + 1}. {question.content}
              </h3>

              <div className="flex flex-col gap-2.5">
                {question.choices.map((choice, choiceIndex) => (
                  <label key={choiceIndex} className={`flex min-h-12 cursor-pointer items-center rounded-lg border-2 px-3 py-2.5 transition-all md:min-h-14 md:px-4 md:py-3 ${
                    answers[question.id] === choiceIndex
                      ? 'border-info bg-info-bg shadow-sm'
                      : 'border-border bg-surface hover:border-border-light'
                  }`}>
                    <input
                      type="radio"
                      name={question.id}
                      value={choiceIndex}
                      checked={answers[question.id] === choiceIndex}
                      onChange={() => handleAnswerChange(question.id, choiceIndex)}
                      className="mr-3 w-4 h-4"
                    />
                    <span className="text-sm text-text-primary md:text-base">
                      {String.fromCharCode(65 + choiceIndex)}. {choice}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
          <button
            onClick={handleBackToDashboard}
            className="student-button-secondary"
          >
            {t('취소')}
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="student-button-success md:min-w-44"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {t('제출 중...')}
              </span>
            ) : (
              t('시험 제출')
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
