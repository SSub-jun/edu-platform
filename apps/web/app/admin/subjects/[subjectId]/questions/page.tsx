'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '../../../../../lib/auth';

interface Choice {
  id: string;
  text: string;
  isAnswer: boolean;
  order: number;
}

interface Question {
  id: string;
  stem: string;
  explanation: string;
  answerIndex: number;
  isActive: boolean;
  lessonTitle: string;
  choices: Choice[];
  createdAt: string;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  studentsCount: number;
  examAttemptsCount: number;
}

export default function SubjectQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.subjectId as string;
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const loadSubjectData = async () => {
    try {
      const response = await authClient.getApi().get(`/admin/subjects/${subjectId}`);
      if (response.data?.success) {
        setSubject(response.data.data);
      } else {
        setSubject(null);
      }
    } catch (error) {
      console.error('과목 데이터 로드 실패:', error);
      setSubject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuestionActive = async (questionId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? '활성화' : '비활성화';
    
    if (!confirm(`이 문제를 ${action}하시겠습니까?`)) {
      return;
    }

    try {
      await authClient.getApi().patch(`/admin/questions/${questionId}`, {
        isActive: newStatus
      });
      
      alert(`문제가 ${action}되었습니다.`);
      loadSubjectData();
    } catch (error) {
      console.error('문제 상태 변경 실패:', error);
      alert(`문제 ${action}에 실패했습니다.`);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('이 문제를 정말 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await authClient.getApi().delete(`/admin/questions/${questionId}`);
      alert('문제가 삭제되었습니다.');
      loadSubjectData();
    } catch (error) {
      console.error('문제 삭제 실패:', error);
      alert('문제 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCorrectChoice = (question: Question): Choice | null => {
    return question.choices.find(choice => choice.isAnswer) || null;
  };

  // 필터링된 문제 목록
  const filteredQuestions = subject ? subject.questions.filter(question => {
    const matchesSearch = searchTerm === '' || 
      question.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.lessonTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActiveFilter = showActiveOnly ? question.isActive : true;
    
    return matchesSearch && matchesActiveFilter;
  }) : [];

  useEffect(() => {
    if (subjectId) {
      loadSubjectData();
    }
  }, [subjectId]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ 
          color: '#666',
          fontSize: '16px'
        }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ 
          color: '#dc3545',
          fontSize: '16px'
        }}>
          과목을 찾을 수 없습니다.
        </div>
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
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* 헤더 */}
        <div style={{ 
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
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
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← 전체 과목 관리
            </button>
            
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#333',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📝 {subject.name} - 문제 관리
            </h1>
          </div>

          {/* 과목 정보 */}
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div><strong>과목:</strong> {subject.name}</div>
            <div><strong>전체 문제:</strong> {subject.questions.length}개</div>
            <div><strong>활성 문제:</strong> {subject.questions.filter(q => q.isActive).length}개</div>
            <div><strong>수강생:</strong> {subject.studentsCount}명</div>
            <div><strong>시험 응시:</strong> {subject.examAttemptsCount}회</div>
          </div>

          {subject.description && (
            <p style={{ 
              margin: '10px 0 0 0',
              color: '#666',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              {subject.description}
            </p>
          )}
        </div>

        {/* 필터링 및 검색 */}
        <div style={{
          marginBottom: '25px',
          display: 'flex',
          gap: '15px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="문제 내용 또는 레슨명으로 검색..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#555', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
            />
            활성 문제만 표시
          </label>

          <div style={{ fontSize: '14px', color: '#666', whiteSpace: 'nowrap' }}>
            {filteredQuestions.length}개 문제
          </div>
        </div>

        {/* 문제 목록 */}
        {filteredQuestions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            {subject.questions.length === 0 ? '등록된 문제가 없습니다.' : '조건에 맞는 문제가 없습니다.'}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '25px'
          }}>
            {filteredQuestions.map((question, index) => {
              const correctChoice = getCorrectChoice(question);
              
              return (
                <div
                  key={question.id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '25px',
                    backgroundColor: question.isActive ? '#fafafa' : '#f8f8f8',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    opacity: question.isActive ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      {/* 문제 헤더 */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        marginBottom: '20px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#333',
                          backgroundColor: '#e9ecef',
                          padding: '4px 8px',
                          borderRadius: '12px'
                        }}>
                          문제 #{index + 1}
                        </span>
                        
                        <span style={{
                          fontSize: '12px',
                          color: '#666',
                          backgroundColor: '#f1f1f1',
                          padding: '2px 8px',
                          borderRadius: '8px'
                        }}>
                          {question.lessonTitle}
                        </span>

                        {!question.isActive && (
                          <span style={{
                            fontSize: '11px',
                            color: '#dc3545',
                            backgroundColor: '#f8d7da',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}>
                            비활성
                          </span>
                        )}

                        <div style={{ 
                          fontSize: '12px', 
                          color: '#999',
                          marginLeft: 'auto'
                        }}>
                          {formatDate(question.createdAt)}
                        </div>
                      </div>

                      {/* 문제 내용 */}
                      <div style={{
                        marginBottom: '20px',
                        padding: '20px',
                        backgroundColor: 'white',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px'
                      }}>
                        <div style={{ 
                          margin: '0 0 15px 0',
                          fontSize: '16px',
                          lineHeight: '1.6',
                          color: '#333',
                          fontWeight: '500'
                        }}>
                          <strong>Q.</strong> {question.stem}
                        </div>
                        
                        {/* 선택지 */}
                        <div style={{ marginLeft: '20px' }}>
                          {question.choices
                            .sort((a, b) => a.order - b.order)
                            .map((choice, choiceIndex) => (
                              <div 
                                key={choice.id}
                                style={{
                                  margin: '8px 0',
                                  padding: '12px 15px',
                                  backgroundColor: choice.isAnswer ? '#d4edda' : '#f8f9fa',
                                  border: choice.isAnswer ? '2px solid #28a745' : '1px solid #e9ecef',
                                  borderRadius: '6px',
                                  fontSize: '15px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}
                              >
                                <span style={{ 
                                  fontWeight: 'bold',
                                  color: choice.isAnswer ? '#155724' : '#666',
                                  minWidth: '20px'
                                }}>
                                  {String.fromCharCode(65 + choiceIndex)}.
                                </span>
                                <span style={{ 
                                  color: choice.isAnswer ? '#155724' : '#333',
                                  flex: 1
                                }}>
                                  {choice.text}
                                </span>
                                {choice.isAnswer && (
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#155724',
                                    fontWeight: 'bold',
                                    backgroundColor: '#c3e6cb',
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                  }}>
                                    ✓ 정답
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>

                        {/* 해설 */}
                        {question.explanation && (
                          <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: '#f1f3f5',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#495057',
                            lineHeight: '1.5'
                          }}>
                            <strong>💡 해설:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                      <button
                        onClick={() => handleToggleQuestionActive(question.id, question.isActive)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: question.isActive ? '#ffc107' : '#28a745',
                          color: question.isActive ? '#333' : 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}
                      >
                        {question.isActive ? '⏸️ 비활성화' : '▶️ 활성화'}
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

