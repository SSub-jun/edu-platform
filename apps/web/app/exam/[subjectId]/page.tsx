'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Question {
  id: string;
  stem: string;
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
      const statusResponse = await fetch(`http://localhost:4000/me/curriculum`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error('과목 상태 조회 실패');
      }

      const curriculum = await statusResponse.json();
      const subject = curriculum.subjects?.find((s: any) => s.id === subjectId);
      
      if (!subject) {
        throw new Error('과목을 찾을 수 없습니다');
      }

      if (!subject.canTakeExam) {
        alert('시험 응시 조건을 만족하지 않습니다.\n모든 강의를 90% 이상 수강해주세요.');
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
      alert('시험을 준비할 수 없습니다.');
      console.error(error);
      router.push('/curriculum');
      setLoading(false);
    }
  };

  const startExam = async (subjectName?: string) => {
    try {
      const response = await fetch(`http://localhost:4000/exam/subjects/${subjectId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('시험 시작 실패');
      }

      const data = await response.json();
      setExamData({
        ...data,
        subjectName,
      });
    } catch (error) {
      alert('시험을 시작할 수 없습니다.');
      console.error(error);
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
      if (!confirm(`${unansweredCount}개 문제가 답변되지 않았습니다. 제출하시겠습니까?`)) {
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

      const response = await fetch(`http://localhost:4000/exam/attempts/${examData.attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (!response.ok) {
        throw new Error('시험 제출 실패');
      }

      const data = await response.json();
      
      // Subject 기반 결과 페이지로 이동
      router.push(`/exam/result?subjectId=${subjectId}&attemptId=${examData.attemptId}&score=${data.examScore}&finalScore=${data.finalScore || 0}&passed=${data.passed || false}&progressPercent=${subjectStatus?.progressPercent || 0}&remainingTries=${(subjectStatus?.remainingTries || 3) - 1}`);
    } catch (error) {
      alert('시험 제출 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex items-center gap-2 text-lg text-text-secondary">
          <div className="w-5 h-5 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin"></div>
          시험을 준비 중입니다...
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-lg text-text-secondary">시험 데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-5 bg-bg-primary">
      <div className="max-w-4xl mx-auto bg-surface border border-border rounded-xl p-8 md:p-10">
        {/* 시험 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-[28px] font-bold text-text-primary mb-2">
                {examData.subjectName || '과목'} 시험
              </h1>
              <p className="text-sm text-text-secondary">
                모든 문제에 답변한 후 제출해주세요
              </p>
            </div>
            <div className="text-sm text-text-secondary px-4 py-2 bg-bg-primary rounded-full border border-border">
              {examData.questions.length}문제
            </div>
          </div>
          
          {/* 시험 정보 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-bg-primary border border-border rounded-lg">
            <div className="text-center">
              <div className="text-xs text-text-tertiary mb-1">현재 진도율</div>
              <div className="text-lg font-bold text-text-primary">
                {Math.round(subjectStatus?.progressPercent || 0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-tertiary mb-1">시험 차수</div>
              <div className="text-lg font-bold text-text-primary">
                {(subjectStatus?.examAttemptCount || 0) + 1}회차
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-tertiary mb-1">남은 기회</div>
              <div className="text-lg font-bold text-warning">
                {subjectStatus?.remainingTries || 3}회
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          {examData.questions.map((question, index) => (
            <div key={question.id} className="mb-8 p-6 border border-border rounded-xl bg-bg-primary">
              <h3 className="text-lg mb-5 text-text-primary font-semibold">
                {index + 1}. {question.stem}
              </h3>
              
              <div className="flex flex-col gap-2.5">
                {question.choices.map((choice, choiceIndex) => (
                  <label key={choiceIndex} className={`flex items-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[question.id] === choiceIndex 
                      ? 'border-info bg-info-bg' 
                      : 'border-border bg-surface hover:border-border-light hover:bg-surface/80'
                  }`}>
                    <input
                      type="radio"
                      name={question.id}
                      value={choiceIndex}
                      checked={answers[question.id] === choiceIndex}
                      onChange={() => handleAnswerChange(question.id, choiceIndex)}
                      className="mr-3 w-4 h-4"
                    />
                    <span className="text-base text-text-primary">
                      {String.fromCharCode(65 + choiceIndex)}. {choice}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-3 bg-bg-primary text-text-secondary border border-border rounded-md text-base font-medium cursor-pointer transition-all hover:bg-surface hover:text-text-primary hover:border-border-light"
          >
            취소
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-4 bg-success text-white border-0 rounded-md text-base font-semibold transition-all hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                제출 중...
              </span>
            ) : (
              '시험 제출'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
