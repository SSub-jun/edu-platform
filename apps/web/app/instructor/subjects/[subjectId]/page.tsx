'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

interface Question {
  id: string;
  title: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SubjectStats {
  studentsCount: number;
  examAttemptsCount: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoParts?: any[];
}

export default function SubjectManagePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthGuard();
  const subjectId = params.subjectId as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'lessons'>('overview');
  const [subjectName, setSubjectName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats>({ studentsCount: 0, examAttemptsCount: 0 });
  
  // 레슨 추가 관련 상태
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    order: 0
  });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    stem: '',
    explanation: '',
    choices: ['', '', '', ''],
    correctAnswerIndex: 0
  });

  useEffect(() => {
    if (isAuthenticated && subjectId) {
      loadSubjectData();
    }
  }, [isAuthenticated, subjectId]);

  const loadSubjectData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4000/instructor/subjects/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const subjectData = result.data;
          setSubjectName(subjectData.name);

          // 레슨 데이터 저장
          setLessons(subjectData.lessons || []);

          // 실제 문제 데이터 매핑
          const apiQuestions: Question[] = subjectData.questions.map((q: any) => ({
            id: q.id,
            title: q.stem,
            options: q.choices.map((c: any) => c.text),
            correctAnswer: q.answerIndex,
            difficulty: 'medium' as const // 기본값, 실제로는 DB에서 가져와야 함
          }));
          setQuestions(apiQuestions);

          // 실제 통계 데이터 저장
          setSubjectStats({
            studentsCount: subjectData.studentsCount || 0,
            examAttemptsCount: subjectData.examAttemptsCount || 0
          });
        }
      } else {
        console.error('Failed to load subject data:', response.statusText);
        setSubjectName(`과목 ID: ${subjectId}`);
        setQuestions([]);
        setSubjectStats({ studentsCount: 0, examAttemptsCount: 0 });
      }
    } catch (error) {
      console.error('Error loading subject data:', error);
      setSubjectName(`과목 ID: ${subjectId}`);
      setQuestions([]);
      setSubjectStats({ studentsCount: 0, examAttemptsCount: 0 });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm('이 문제를 삭제하시겠습니까?')) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:4000/instructor/questions/${questionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // 성공적으로 삭제되면 목록을 다시 로드
            await loadSubjectData();
          }
        } else {
          console.error('Failed to delete question:', response.statusText);
          alert('문제 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('문제 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleAddLesson = async () => {
    if (!newLesson.title.trim()) {
      alert('레슨 제목을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/instructor/subjects/${subjectId}/lessons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newLesson.title.trim(),
          description: newLesson.description.trim() || null,
          order: newLesson.order
        })
      });

      if (response.ok) {
        alert('레슨이 성공적으로 추가되었습니다!');
        setShowAddLesson(false);
        setNewLesson({ title: '', description: '', order: lessons.length });
        loadSubjectData();
      } else {
        const error = await response.json();
        alert(`레슨 추가 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('레슨 추가 실패:', error);
      alert('레슨 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!confirm(`"${lessonTitle}" 레슨을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/instructor/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('레슨이 삭제되었습니다.');
        loadSubjectData();
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('레슨 삭제 실패:', error);
      alert('레슨 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddQuestion = async () => {
    // 유효성 검사
    if (!newQuestion.stem.trim()) {
      alert('문제 내용을 입력해주세요.');
      return;
    }
    if (newQuestion.choices.some(choice => !choice.trim())) {
      alert('모든 선택지를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/instructor/subjects/${subjectId}/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectId,
          stem: newQuestion.stem.trim(),
          explanation: newQuestion.explanation.trim() || null,
          choices: newQuestion.choices.map(c => c.trim()),
          correctAnswerIndex: newQuestion.correctAnswerIndex
        })
      });

      if (response.ok) {
        alert('문제가 성공적으로 추가되었습니다!');
        setShowAddQuestion(false);
        setNewQuestion({
          stem: '',
          explanation: '',
          choices: ['', '', '', ''],
          correctAnswerIndex: 0
        });
        loadSubjectData();
      } else {
        const error = await response.json();
        alert(`문제 추가 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('문제 추가 실패:', error);
      alert('문제 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteSubject = async () => {
    if (confirm(`"${subjectName}" 과목을 정말로 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 관련된 모든 시험 문제와 학생 데이터가 비활성화됩니다.`)) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:4000/instructor/subjects/${subjectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('과목이 성공적으로 삭제되었습니다.');
            router.push('/instructor');
          }
        } else {
          console.error('Failed to delete subject:', response.statusText);
          alert('과목 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('과목 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (!isAuthenticated) {
    return <div>인증 중...</div>;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return '#28a745';
      case 'medium': return '#fd7e14'; 
      case 'hard': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => router.push('/instructor')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← 강사 대시보드
            </button>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              color: '#333',
              margin: 0
            }}>
              📚 {subjectName} 관리
            </h1>
          </div>
          
          <button
            onClick={handleDeleteSubject}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545'}
            title="과목을 완전히 삭제합니다"
          >
            🗑️ 과목 삭제
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid #e9ecef',
          marginBottom: '25px'
        }}>
          {[
            { id: 'overview', label: '📊 개요', desc: '전체 현황' },
            { id: 'questions', label: '📝 시험문제', desc: '문제 관리' },
            { id: 'lessons', label: '🎥 레슨 관리', desc: '영상 및 레슨 관리' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === tab.id ? '#0070f3' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#495057',
                border: 'none',
                borderRadius: activeTab === tab.id ? '6px 6px 0 0' : '0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                marginRight: '5px',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>📝 시험문제</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>{questions.length}개</div>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6c757d' }}>등록된 문제 수</p>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>👥 수강생</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fd7e14' }}>{subjectStats.studentsCount}명</div>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6c757d' }}>현재 수강 중</p>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>📊 시험응시</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>{subjectStats.examAttemptsCount}회</div>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6c757d' }}>총 응시 횟수</p>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>📝 시험문제 관리</h3>
              <button
                onClick={() => setShowAddQuestion(true)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ➕ 문제 추가
              </button>
            </div>

            {/* 문제 추가 폼 */}
            {showAddQuestion && (
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '25px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #e0e0e0'
              }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>새 문제 추가</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {/* 문제 내용 */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                      문제 내용 *
                    </label>
                    <textarea
                      placeholder="문제 내용을 입력하세요"
                      value={newQuestion.stem}
                      onChange={(e) => setNewQuestion({ ...newQuestion, stem: e.target.value })}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 선택지 */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                      선택지 * (정답 선택)
                    </label>
                    {newQuestion.choices.map((choice, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={newQuestion.correctAnswerIndex === index}
                          onChange={() => setNewQuestion({ ...newQuestion, correctAnswerIndex: index })}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{String.fromCharCode(65 + index)}.</span>
                        <input
                          type="text"
                          placeholder={`선택지 ${index + 1}`}
                          value={choice}
                          onChange={(e) => {
                            const newChoices = [...newQuestion.choices];
                            newChoices[index] = e.target.value;
                            setNewQuestion({ ...newQuestion, choices: newChoices });
                          }}
                          style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* 해설 */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                      해설 (선택사항)
                    </label>
                    <textarea
                      placeholder="문제 해설을 입력하세요"
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 버튼 */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      onClick={handleAddQuestion}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      추가
                    </button>
                    <button
                      onClick={() => {
                        setShowAddQuestion(false);
                        setNewQuestion({
                          stem: '',
                          explanation: '',
                          choices: ['', '', '', ''],
                          correctAnswerIndex: 0
                        });
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {questions.map((question, index) => (
                <div key={question.id} style={{ 
                  padding: '20px', 
                  border: '1px solid #e9ecef', 
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ 
                          backgroundColor: '#e9ecef', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          color: '#495057'
                        }}>
                          문제 {index + 1}
                        </span>
                        <span style={{ 
                          backgroundColor: getDifficultyColor(question.difficulty), 
                          color: 'white',
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px'
                        }}>
                          {question.difficulty === 'easy' ? '쉬움' : question.difficulty === 'medium' ? '보통' : '어려움'}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{question.title}</h4>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {question.options.map((option, i) => (
                          <div key={i} style={{ 
                            padding: '5px 0',
                            color: i === question.correctAnswer ? '#28a745' : '#666',
                            fontWeight: i === question.correctAnswer ? 'bold' : 'normal'
                          }}>
                            {i + 1}. {option} {i === question.correctAnswer && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>🎥 레슨 관리</h3>
              <button
                onClick={() => {
                  setNewLesson({ title: '', description: '', order: lessons.length });
                  setShowAddLesson(true);
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ➕ 레슨 추가
              </button>
            </div>

            {/* 레슨 추가 폼 */}
            {showAddLesson && (
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #e0e0e0'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>새 레슨 추가</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="레슨 제목 *"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  <textarea
                    placeholder="레슨 설명 (선택사항)"
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    rows={3}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '14px', color: '#555' }}>순서:</label>
                    <input
                      type="number"
                      value={newLesson.order}
                      onChange={(e) => setNewLesson({ ...newLesson, order: parseInt(e.target.value) || 0 })}
                      min="0"
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '80px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      onClick={handleAddLesson}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      추가
                    </button>
                    <button
                      onClick={() => setShowAddLesson(false)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {lessons.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>등록된 레슨이 없습니다.</p>
              ) : (
                lessons.map((lesson) => (
                  <div key={lesson.id} style={{
                    padding: '20px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                        {lesson.order}. {lesson.title}
                      </h4>
                      {lesson.description && (
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                          {lesson.description}
                        </p>
                      )}
                      <div style={{ marginTop: '8px', fontSize: '12px', color: lesson.videoParts && lesson.videoParts.length > 0 ? '#28a745' : '#999' }}>
                        {lesson.videoParts && lesson.videoParts.length > 0 ? '✅ 영상 있음' : '❌ 영상 없음'}
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/instructor/subjects/${subjectId}/lessons/${lesson.id}/videos`)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      영상 관리 →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
