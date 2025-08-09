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
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
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
      const response = await fetch(`http://localhost:4000/exam/attempts/${examData.attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ answers }),
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

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>시험을 준비 중입니다...</div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        padding: '40px 20px',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            marginBottom: '30px',
            color: result.passed ? '#28a745' : '#dc3545'
          }}>
            {result.passed ? '🎉 합격!' : '😔 불합격'}
          </h1>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '20px',
            marginBottom: '40px'
          }}>
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>
                {result.score}점
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>점수</div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {result.progress}%
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>진행률</div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {result.finalScore}점
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>최종점수</div>
            </div>
          </div>

          <button
            onClick={handleBackToDashboard}
            style={{
              padding: '15px 30px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>시험 데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            {subjectId === 'demo' ? '데모 시험' : `${subjectId} 시험`}
          </h1>
          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            padding: '8px 16px',
            backgroundColor: '#e9ecef',
            borderRadius: '20px'
          }}>
            {examData.questions.length}문제
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          {examData.questions.map((question, index) => (
            <div key={question.id} style={{
              marginBottom: '30px',
              padding: '25px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                marginBottom: '20px',
                color: '#333'
              }}>
                {index + 1}. {question.stem}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {question.choices.map((choice, choiceIndex) => (
                  <label key={choiceIndex} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: answers[question.id] === choice ? '#e3f2fd' : 'white',
                    transition: 'background-color 0.2s'
                  }}>
                    <input
                      type="radio"
                      name={question.id}
                      value={choice}
                      checked={answers[question.id] === choice}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      style={{ marginRight: '12px' }}
                    />
                    <span style={{ fontSize: '16px' }}>
                      {String.fromCharCode(65 + choiceIndex)}. {choice}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handleBackToDashboard}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '15px 30px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? '제출 중...' : '시험 제출'}
          </button>
        </div>
      </div>
    </div>
  );
}
