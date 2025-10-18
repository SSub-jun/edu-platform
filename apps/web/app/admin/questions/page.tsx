'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../lib/auth';

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
  subjectName: string;
  choices: Choice[];
  createdAt: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);

  const loadData = async () => {
    try {
      // 전체 과목의 문제들을 로드
      const subjectsResponse = await authClient.getApi().get('/instructor/subjects');
      if (subjectsResponse.data.success) {
        const allSubjects = subjectsResponse.data.data || [];
        setSubjects(allSubjects);
        
        // 각 과목의 상세 정보(문제 포함)를 로드
        const questionsPromises = allSubjects.map(async (subject: Subject) => {
          try {
            const response = await authClient.getApi().get(`/instructor/subjects/${subject.id}`);
            if (response.data.success && response.data.data.questions) {
              return response.data.data.questions.map((q: any) => ({
                ...q,
                subjectName: subject.name
              }));
            }
            return [];
          } catch (error) {
            console.warn(`과목 ${subject.id} 문제 로드 실패:`, error);
            return [];
          }
        });

        const allQuestions = await Promise.all(questionsPromises);
        setQuestions(allQuestions.flat());
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setQuestions([]);
      setSubjects([]);
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
      // 문제 상태 업데이트 (instructor API 사용)
      await authClient.getApi().patch(`/instructor/questions/${questionId}`, {
        isActive: newStatus
      });
      
      alert(`문제가 ${action}되었습니다.`);
      loadData();
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
      await authClient.getApi().delete(`/instructor/questions/${questionId}`);
      alert('문제가 삭제되었습니다.');
      loadData();
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
  const filteredQuestions = questions.filter(question => {
    const matchesSubject = selectedSubject === '' || question.subjectName === selectedSubject;
    const matchesSearch = searchTerm === '' || 
      question.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.lessonTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActiveFilter = showInactiveOnly ? !question.isActive : true;
    
    return matchesSubject && matchesSearch && matchesActiveFilter;
  });

  useEffect(() => {
    loadData();
  }, []);

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
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => router.push('/admin')}
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
              ← 관리자 대시보드
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
              📝 문제 은행 관리
            </h1>
          </div>

          <button
            onClick={() => router.push('/admin/subjects')}
            style={{
              padding: '10px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📖 과목 관리
          </button>
        </div>

        {/* 필터링 및 검색 */}
        <div style={{
          marginBottom: '25px',
          display: 'grid',
          gridTemplateColumns: 'auto auto 1fr auto',
          gap: '15px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#555', whiteSpace: 'nowrap' }}>
              과목:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">전체 과목</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#555' }}>
            <input
              type="checkbox"
              checked={showInactiveOnly}
              onChange={(e) => setShowInactiveOnly(e.target.checked)}
            />
            비활성 문제만
          </label>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="문제 내용, 과목명, 레슨명으로 검색..."
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />

          <div style={{ fontSize: '14px', color: '#666', whiteSpace: 'nowrap' }}>
            총 {filteredQuestions.length}개 문제
          </div>
        </div>

        {/* 문제 목록 */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            로딩 중...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            {questions.length === 0 ? '등록된 문제가 없습니다.' : '조건에 맞는 문제가 없습니다.'}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '20px'
          }}>
            {filteredQuestions.map((question) => {
              const correctChoice = getCorrectChoice(question);
              
              return (
                <div
                  key={question.id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
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
                        marginBottom: '15px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            fontSize: '12px',
                            color: '#0070f3',
                            backgroundColor: '#e6f3ff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {question.subjectName}
                          </span>
                          
                          <span style={{
                            fontSize: '11px',
                            color: '#666',
                            backgroundColor: '#f1f1f1',
                            padding: '2px 6px',
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
                        </div>

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
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor: 'white',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px'
                      }}>
                        <p style={{ 
                          margin: '0 0 10px 0',
                          fontSize: '15px',
                          lineHeight: '1.6',
                          color: '#333'
                        }}>
                          <strong>Q.</strong> {question.stem}
                        </p>
                        
                        {/* 선택지 */}
                        <div style={{ marginLeft: '20px' }}>
                          {question.choices
                            .sort((a, b) => a.order - b.order)
                            .map((choice, index) => (
                              <div 
                                key={choice.id}
                                style={{
                                  margin: '5px 0',
                                  padding: '8px 10px',
                                  backgroundColor: choice.isAnswer ? '#d4edda' : '#f8f9fa',
                                  border: choice.isAnswer ? '1px solid #c3e6cb' : '1px solid #e9ecef',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <span style={{ 
                                  fontWeight: 'bold',
                                  color: choice.isAnswer ? '#155724' : '#666'
                                }}>
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                <span style={{ 
                                  color: choice.isAnswer ? '#155724' : '#333'
                                }}>
                                  {choice.text}
                                </span>
                                {choice.isAnswer && (
                                  <span style={{
                                    marginLeft: 'auto',
                                    fontSize: '12px',
                                    color: '#155724',
                                    fontWeight: 'bold'
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
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: '#f1f3f5',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#495057'
                          }}>
                            <strong>해설:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
                      <button
                        onClick={() => handleToggleQuestionActive(question.id, question.isActive)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: question.isActive ? '#ffc107' : '#28a745',
                          color: question.isActive ? '#333' : 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}
                      >
                        {question.isActive ? '⏸️ 비활성화' : '▶️ 활성화'}
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
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

