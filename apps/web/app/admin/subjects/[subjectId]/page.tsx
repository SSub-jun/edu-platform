'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authClient } from '../../../../lib/auth';

interface SubjectDetail {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  isActive: boolean;
  parts?: LessonPart[];
}

interface LessonPart {
  id: string;
  title: string;
  description?: string;
  order: number;
  videoUrl: string;
  durationMs: number;
  isActive: boolean;
}

interface Question {
  id: string;
  content: string;
  choices: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty?: number;
  tags?: string;
  isActive: boolean;
  createdAt: string;
}

type TabType = 'basic' | 'lessons' | 'questions';

export default function SubjectManagePage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.subjectId as string;

  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    order: 0,
    isActive: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // 레슨 폼
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    order: 0,
  });

  // 문제 폼
  const [questionForm, setQuestionForm] = useState({
    content: '',
    choices: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    difficulty: 3,
    tags: '',
  });

  const loadSubject = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authClient.getApi().get(`/instructor/subjects/${subjectId}`);
      if (response.data?.success && response.data.data) {
        const data = response.data.data;
        setSubject(data);
        setForm({
          name: data.name,
          description: data.description || '',
          order: data.order || 0,
          isActive: data.isActive,
        });
      } else {
        throw new Error('과목 정보를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('[ADMIN][SUBJECT_DETAIL] load failed', err);
      setError('과목 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async () => {
    try {
      const response = await authClient.getApi().get(`/admin/subjects/${subjectId}/lessons`);
      setLessons(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('[ADMIN][LESSONS] load failed', err);
    }
  };

  const loadQuestions = async () => {
    try {
      const response = await authClient.getApi().get(`/admin/subjects/${subjectId}/questions`);
      setQuestions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('[ADMIN][QUESTIONS] load failed', err);
    }
  };

  const handleSaveBasic = async () => {
    if (!subject) return;
    setSaving(true);
    try {
      await authClient.getApi().put(`/instructor/subjects/${subject.id}`, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        order: form.order,
        isActive: form.isActive,
      });
      alert('기본 정보가 저장되었습니다.');
      loadSubject();
    } catch (err) {
      console.error('[ADMIN][SUBJECT_DETAIL] save failed', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.title.trim()) {
      alert('레슨 제목을 입력해주세요.');
      return;
    }

    try {
      await authClient.getApi().post(`/admin/subjects/${subjectId}/lessons`, lessonForm);
      alert('레슨이 생성되었습니다.');
      setShowLessonModal(false);
      setLessonForm({ title: '', description: '', order: 0 });
      loadLessons();
    } catch (err: any) {
      console.error('[ADMIN][LESSONS] create failed', err);
      alert('레슨 생성에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;

    try {
      await authClient.getApi().patch(`/admin/lessons/${editingLesson.id}`, lessonForm);
      alert('레슨이 수정되었습니다.');
      setShowLessonModal(false);
      setEditingLesson(null);
      setLessonForm({ title: '', description: '', order: 0 });
      loadLessons();
    } catch (err: any) {
      console.error('[ADMIN][LESSONS] update failed', err);
      alert('레슨 수정에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('이 레슨을 삭제하시겠습니까?')) return;

    try {
      await authClient.getApi().delete(`/admin/lessons/${lessonId}`);
      alert('레슨이 삭제되었습니다.');
      loadLessons();
    } catch (err: any) {
      console.error('[ADMIN][LESSONS] delete failed', err);
      alert('레슨 삭제에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateQuestion = async () => {
    if (!questionForm.content.trim()) {
      alert('문제 내용을 입력해주세요.');
      return;
    }

    if (questionForm.choices.some((c) => !c.trim())) {
      alert('모든 선택지를 입력해주세요.');
      return;
    }

    try {
      await authClient.getApi().post(`/admin/subjects/${subjectId}/questions`, questionForm);
      alert('문제가 생성되었습니다.');
      setShowQuestionModal(false);
      setQuestionForm({
        content: '',
        choices: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        difficulty: 3,
        tags: '',
      });
      loadQuestions();
    } catch (err: any) {
      console.error('[ADMIN][QUESTIONS] create failed', err);
      alert('문제 생성에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      await authClient.getApi().patch(`/admin/questions/${editingQuestion.id}`, questionForm);
      alert('문제가 수정되었습니다.');
      setShowQuestionModal(false);
      setEditingQuestion(null);
      setQuestionForm({
        content: '',
        choices: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        difficulty: 3,
        tags: '',
      });
      loadQuestions();
    } catch (err: any) {
      console.error('[ADMIN][QUESTIONS] update failed', err);
      alert('문제 수정에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('이 문제를 삭제하시겠습니까?')) return;

    try {
      await authClient.getApi().delete(`/admin/questions/${questionId}`);
      alert('문제가 삭제되었습니다.');
      loadQuestions();
    } catch (err: any) {
      console.error('[ADMIN][QUESTIONS] delete failed', err);
      alert('문제 삭제에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDuplicateQuestion = async (questionId: string) => {
    try {
      await authClient.getApi().post(`/admin/questions/${questionId}/duplicate`);
      alert('문제가 복제되었습니다.');
      loadQuestions();
    } catch (err: any) {
      console.error('[ADMIN][QUESTIONS] duplicate failed', err);
      alert('문제 복제에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const openLessonModal = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        description: lesson.description || '',
        order: lesson.order,
      });
    } else {
      setEditingLesson(null);
      setLessonForm({ title: '', description: '', order: lessons.length + 1 });
    }
    setShowLessonModal(true);
  };

  const openQuestionModal = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        content: question.content,
        choices: question.choices,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        difficulty: question.difficulty || 3,
        tags: question.tags || '',
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        content: '',
        choices: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        difficulty: 3,
        tags: '',
      });
    }
    setShowQuestionModal(true);
  };

  useEffect(() => {
    if (subjectId) {
      loadSubject();
      loadLessons();
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  if (!subjectId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        잘못된 접근입니다. 과목 ID가 필요합니다.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        로딩 중...
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#dc3545' }}>
        {error ?? '과목을 찾을 수 없습니다.'}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <div>
            <button
              onClick={() => router.push('/admin/subjects')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '14px'
              }}
            >
              ← 과목 목록
            </button>
            <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 700 }}>
              {subject.name}
            </h1>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              과목 기본 정보, 레슨, 시험 문제를 관리하세요.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '2px solid #e0e0e0',
          paddingBottom: '10px'
        }}>
          <button
            onClick={() => setActiveTab('basic')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'basic' ? '#007bff' : 'transparent',
              color: activeTab === 'basic' ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'basic' ? 600 : 400,
            }}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'lessons' ? '#007bff' : 'transparent',
              color: activeTab === 'lessons' ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'lessons' ? 600 : 400,
            }}
          >
            레슨 ({lessons.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'questions' ? '#007bff' : 'transparent',
              color: activeTab === 'questions' ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'questions' ? 600 : 400,
            }}
          >
            시험 문제 ({questions.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'basic' && (
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
            padding: '20px',
            backgroundColor: '#fafafa'
          }}>
            <h2 style={{ marginTop: 0 }}>기본 정보</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>과목명 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    marginTop: '6px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>정렬 순서</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, order: parseInt(e.target.value, 10) || 0 }))
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    marginTop: '6px'
                  }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    marginTop: '6px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>상태</label>
                <select
                  value={form.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isActive: e.target.value === 'active' }))
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    marginTop: '6px'
                  }}
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <button
                disabled={saving}
                onClick={handleSaveBasic}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? '저장 중...' : '기본 정보 저장'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>레슨 목록</h2>
              <button
                onClick={() => openLessonModal()}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                + 레슨 추가
              </button>
            </div>

            {lessons.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>
                등록된 레슨이 없습니다. "+ 레슨 추가" 버튼을 눌러 새 레슨을 만들어보세요.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: lesson.isActive ? '#fafafa' : '#f5f5f5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>
                        {lesson.order}. {lesson.title}
                        {!lesson.isActive && <span style={{ marginLeft: '10px', color: '#dc3545', fontSize: '12px' }}>(비활성)</span>}
                      </h3>
                      {lesson.description && (
                        <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{lesson.description}</p>
                      )}
                      <p style={{ margin: '6px 0 0', color: '#999', fontSize: '12px' }}>
                        파트 {lesson.parts?.length || 0}개
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => openLessonModal(lesson)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>시험 문제 목록</h2>
              <button
                onClick={() => openQuestionModal()}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                + 문제 추가
              </button>
            </div>

            {questions.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>
                등록된 문제가 없습니다. "+ 문제 추가" 버튼을 눌러 새 문제를 만들어보세요.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {questions.map((question, idx) => (
                  <div
                    key={question.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: question.isActive ? '#fafafa' : '#f5f5f5'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px' }}>
                        Q{idx + 1}. {question.content}
                        {!question.isActive && <span style={{ marginLeft: '10px', color: '#dc3545', fontSize: '12px' }}>(비활성)</span>}
                      </h3>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openQuestionModal(question)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDuplicateQuestion(question.id)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#ffc107',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          복제
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          style={{
                            padding: '4px 10px',
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
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                      {question.choices.map((choice, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          {i === question.correctAnswer ? (
                            <strong style={{ color: '#28a745' }}>✓ {choice}</strong>
                          ) : (
                            <span>{choice}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {question.explanation && (
                      <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                        해설: {question.explanation}
                      </p>
                    )}
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
                      난이도: {question.difficulty || 3}/5 {question.tags && `| 태그: ${question.tags}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 레슨 생성/수정 모달 */}
      {showLessonModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>{editingLesson ? '레슨 수정' : '레슨 생성'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>레슨 제목 *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="예: 안전 기초 교육"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>설명</label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  rows={3}
                  placeholder="레슨에 대한 간단한 설명"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>순서</label>
                <input
                  type="number"
                  value={lessonForm.order}
                  onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value, 10) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    setShowLessonModal(false);
                    setEditingLesson(null);
                    setLessonForm({ title: '', description: '', order: 0 });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {editingLesson ? '수정' : '생성'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 문제 생성/수정 모달 */}
      {showQuestionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>{editingQuestion ? '문제 수정' : '문제 생성'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>문제 내용 *</label>
                <textarea
                  value={questionForm.content}
                  onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                  rows={3}
                  placeholder="문제를 입력하세요"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>선택지 *</label>
                {questionForm.choices.map((choice, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type="radio"
                      checked={questionForm.correctAnswer === idx}
                      onChange={() => setQuestionForm({ ...questionForm, correctAnswer: idx })}
                      id={`choice-${idx}`}
                    />
                    <label htmlFor={`choice-${idx}`} style={{ fontSize: '13px', width: '30px' }}>정답</label>
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => {
                        const newChoices = [...questionForm.choices];
                        newChoices[idx] = e.target.value;
                        setQuestionForm({ ...questionForm, choices: newChoices });
                      }}
                      placeholder={`선택지 ${idx + 1}`}
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
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>해설</label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  rows={2}
                  placeholder="정답에 대한 해설"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>난이도 (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: parseInt(e.target.value, 10) || 3 })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>태그</label>
                  <input
                    type="text"
                    value={questionForm.tags}
                    onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })}
                    placeholder="예: 안전, 기초"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                    setQuestionForm({
                      content: '',
                      choices: ['', '', '', ''],
                      correctAnswer: 0,
                      explanation: '',
                      difficulty: 3,
                      tags: '',
                    });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {editingQuestion ? '수정' : '생성'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
