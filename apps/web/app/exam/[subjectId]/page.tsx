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
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  
  const [examData, setExamData] = useState<ExamData | null>(null);
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

    startExam();
  }, [subjectId, router]);

  const startExam = async () => {
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
      setExamData(data);
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
      setResult(data);
      setSubmitted(true);
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

  if (submitted && result) {
    return (
      <div className="min-h-screen py-10 px-5 bg-bg-primary">
        <div className="max-w-2xl mx-auto bg-surface border border-border rounded-xl p-10 text-center">
          <h1 className={`text-[32px] mb-8 font-bold ${result.passed ? 'text-success' : 'text-error'}`}>
            {result.passed ? '🎉 합격!' : '😔 불합격'}
          </h1>
          
          <div className="flex flex-col gap-5 mb-10 items-center">
            <div className="py-8 px-12 bg-bg-primary rounded-xl border border-border">
              <div className={`text-5xl font-bold ${result.passed ? 'text-success' : 'text-error'}`}>
                {Math.round(result.examScore)}점
              </div>
              <div className="text-base text-text-secondary mt-2.5">
                {result.passed ? '합격 기준: 70점 이상' : '불합격 (70점 미만)'}
              </div>
            </div>
          </div>

          <button
            onClick={handleBackToDashboard}
            className="px-8 py-4 bg-primary text-text-primary border-0 rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-primary-600"
          >
            커리큘럼으로 돌아가기
          </button>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[28px] font-bold text-text-primary">
            {subjectId === 'demo' ? '데모 시험' : `${subjectId} 시험`}
          </h1>
          <div className="text-sm text-text-secondary px-4 py-2 bg-bg-primary rounded-full border border-border">
            {examData.questions.length}문제
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
