'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../../lib/auth';

interface PortalQuestion {
  id: string;
  stem: string;
  choices: Array<{
    id: string;
    label: string;
  }>;
  answerId: string;
  createdAt: string;
}

interface PortalBank {
  id: string;
  title: string;
  createdAt: string;
  questions: PortalQuestion[];
  questionsCount: number;
  sessionsCount: number;
  activeSessionsCount: number;
}

export default function AdminPortalBanksPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<PortalBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<PortalBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateBankForm, setShowCreateBankForm] = useState(false);
  const [showCreateQuestionForm, setShowCreateQuestionForm] = useState(false);
  const [newBank, setNewBank] = useState({ title: '' });
  const [newQuestion, setNewQuestion] = useState({
    stem: '',
    choices: ['', '', '', ''],
    answerIndex: 0
  });

  const loadBanks = async () => {
    try {
      const response = await authClient.getApi().get('/admin/portal/banks');
      if (response.data.success) {
        setBanks(response.data.data || []);
      } else {
        setBanks([]);
      }
    } catch (error) {
      console.error('문제 은행 목록 로드 실패:', error);
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBankDetails = async (bankId: string) => {
    try {
      const response = await authClient.getApi().get(`/admin/portal/banks/${bankId}`);
      if (response.data.success) {
        setSelectedBank(response.data.data);
      }
    } catch (error) {
      console.error('문제 은행 상세 로드 실패:', error);
      setSelectedBank(null);
    }
  };

  const handleCreateBank = async () => {
    if (!newBank.title.trim()) {
      alert('문제 은행 제목을 입력해주세요.');
      return;
    }

    try {
      await authClient.getApi().post('/admin/portal/banks', {
        title: newBank.title.trim()
      });

      alert('문제 은행이 성공적으로 생성되었습니다.');
      setNewBank({ title: '' });
      setShowCreateBankForm(false);
      loadBanks();
    } catch (error) {
      console.error('문제 은행 생성 실패:', error);
      alert('문제 은행 생성에 실패했습니다.');
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedBank) {
      alert('문제 은행이 선택되지 않았습니다.');
      return;
    }

    if (!newQuestion.stem.trim()) {
      alert('문제 내용을 입력해주세요.');
      return;
    }

    const validChoices = newQuestion.choices.filter(choice => choice.trim());
    if (validChoices.length < 2) {
      alert('최소 2개의 선택지를 입력해주세요.');
      return;
    }

    if (newQuestion.answerIndex >= validChoices.length) {
      alert('정답 인덱스가 유효하지 않습니다.');
      return;
    }

    try {
      await authClient.getApi().post(`/admin/portal/banks/${selectedBank.id}/questions`, {
        stem: newQuestion.stem.trim(),
        choices: validChoices,
        answerIndex: newQuestion.answerIndex
      });

      alert('문제가 성공적으로 추가되었습니다.');
      setNewQuestion({
        stem: '',
        choices: ['', '', '', ''],
        answerIndex: 0
      });
      setShowCreateQuestionForm(false);
      loadBankDetails(selectedBank.id);
    } catch (error) {
      console.error('문제 추가 실패:', error);
      alert('문제 추가에 실패했습니다.');
    }
  };

  const handleDeleteBank = async (bankId: string, title: string) => {
    if (!confirm(`'${title}' 문제 은행을 정말 삭제하시겠습니까?\n\n⚠️ 주의: 모든 문제가 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await authClient.getApi().delete(`/admin/portal/banks/${bankId}`);
      alert('문제 은행이 삭제되었습니다.');
      if (selectedBank?.id === bankId) {
        setSelectedBank(null);
      }
      loadBanks();
    } catch (error) {
      console.error('문제 은행 삭제 실패:', error);
      alert('문제 은행 삭제에 실패했습니다.');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('이 문제를 정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      await authClient.getApi().delete(`/admin/portal/questions/${questionId}`);
      alert('문제가 삭제되었습니다.');
      if (selectedBank) {
        loadBankDetails(selectedBank.id);
      }
    } catch (error) {
      console.error('문제 삭제 실패:', error);
      alert('문제 삭제에 실패했습니다.');
    }
  };

  const updateQuestionChoice = (index: number, value: string) => {
    const newChoices = [...newQuestion.choices];
    newChoices[index] = value;
    setNewQuestion({ ...newQuestion, choices: newChoices });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCorrectChoice = (question: PortalQuestion) => {
    return question.choices.find(choice => choice.id === question.answerId);
  };

  useEffect(() => {
    loadBanks();
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
        display: 'grid',
        gridTemplateColumns: selectedBank ? '400px 1fr' : '1fr',
        gap: '20px'
      }}>
        {/* 문제 은행 목록 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button
                onClick={() => router.push('/admin')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ← 대시보드
              </button>
              
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#333',
                margin: 0
              }}>
                🏦 문제 은행
              </h2>
            </div>

            <button
              onClick={() => setShowCreateBankForm(true)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              ➕ 새 은행
            </button>
          </div>

          {/* 새 문제 은행 생성 폼 */}
          {showCreateBankForm && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #e0e0e0'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
                새 문제 은행 생성
              </h4>
              
              <input
                type="text"
                value={newBank.title}
                onChange={(e) => setNewBank({ title: e.target.value })}
                placeholder="문제 은행 제목"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '10px',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreateBank}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  생성
                </button>
                
                <button
                  onClick={() => setShowCreateBankForm(false)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 문제 은행 목록 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              로딩 중...
            </div>
          ) : banks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              문제 은행이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {banks.map((bank) => (
                <div
                  key={bank.id}
                  onClick={() => loadBankDetails(bank.id)}
                  style={{
                    padding: '15px',
                    border: selectedBank?.id === bank.id ? '2px solid #0070f3' : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: selectedBank?.id === bank.id ? '#f0f7ff' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        {bank.title}
                      </h4>
                      
                      <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                        <div>문제: {bank.questionsCount}개</div>
                        <div>세션: {bank.sessionsCount}개 (활성: {bank.activeSessionsCount})</div>
                        <div>생성: {formatDate(bank.createdAt)}</div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBank(bank.id, bank.title);
                      }}
                      style={{
                        padding: '4px 6px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => router.push('/admin/portal/sessions')}
              style={{
                padding: '10px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              🎮 시험 세션 관리
            </button>
          </div>
        </div>

        {/* 선택된 문제 은행 상세 */}
        {selectedBank && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '25px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '20px'
            }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#333',
                margin: 0
              }}>
                {selectedBank.title}
              </h1>

              <button
                onClick={() => setShowCreateQuestionForm(true)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ➕ 문제 추가
              </button>
            </div>

            {/* 문제 은행 정보 */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '25px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px',
              fontSize: '13px',
              color: '#666'
            }}>
              <div><strong>총 문제:</strong> {selectedBank.questions.length}개</div>
              <div><strong>사용 세션:</strong> {selectedBank.sessionsCount}개</div>
              <div><strong>활성 세션:</strong> {selectedBank.activeSessionsCount}개</div>
              <div><strong>생성일:</strong> {formatDate(selectedBank.createdAt)}</div>
            </div>

            {/* 새 문제 추가 폼 */}
            {showCreateQuestionForm && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '25px',
                border: '1px solid #e0e0e0'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  새 문제 추가
                </h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    문제 내용 *
                  </label>
                  <textarea
                    value={newQuestion.stem}
                    onChange={(e) => setNewQuestion({ ...newQuestion, stem: e.target.value })}
                    placeholder="문제 내용을 입력하세요"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
                    선택지 *
                  </label>
                  {newQuestion.choices.map((choice, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '20px' }}>
                        {String.fromCharCode(65 + index)}.
                      </label>
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) => updateQuestionChoice(index, e.target.value)}
                        placeholder={`선택지 ${String.fromCharCode(65 + index)}`}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          border: newQuestion.answerIndex === index ? '2px solid #28a745' : '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                      <button
                        onClick={() => setNewQuestion({ ...newQuestion, answerIndex: index })}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: newQuestion.answerIndex === index ? '#28a745' : '#e9ecef',
                          color: newQuestion.answerIndex === index ? 'white' : '#666',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                      >
                        {newQuestion.answerIndex === index ? '✓ 정답' : '정답 설정'}
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleCreateQuestion}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    문제 추가
                  </button>
                  
                  <button
                    onClick={() => setShowCreateQuestionForm(false)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 문제 목록 */}
            {selectedBank.questions.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: '#666',
                fontSize: '15px'
              }}>
                등록된 문제가 없습니다. 문제를 추가해보세요.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {selectedBank.questions.map((question, index) => {
                  const correctChoice = getCorrectChoice(question);
                  
                  return (
                    <div
                      key={question.id}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '15px' }}>
                            <span style={{
                              fontSize: '12px',
                              color: '#666',
                              backgroundColor: '#e9ecef',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              marginRight: '10px'
                            }}>
                              문제 #{index + 1}
                            </span>
                            <span style={{ fontSize: '11px', color: '#999' }}>
                              {formatDate(question.createdAt)}
                            </span>
                          </div>
                          
                          <div style={{ 
                            fontSize: '15px',
                            lineHeight: '1.5',
                            color: '#333',
                            marginBottom: '15px',
                            fontWeight: '500'
                          }}>
                            <strong>Q.</strong> {question.stem}
                          </div>

                          <div style={{ marginLeft: '15px' }}>
                            {question.choices.map((choice, choiceIndex) => (
                              <div 
                                key={choice.id}
                                style={{
                                  margin: '6px 0',
                                  padding: '8px 12px',
                                  backgroundColor: choice.id === question.answerId ? '#d4edda' : 'white',
                                  border: choice.id === question.answerId ? '1px solid #28a745' : '1px solid #e9ecef',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <span style={{ 
                                  fontWeight: 'bold',
                                  color: choice.id === question.answerId ? '#155724' : '#666'
                                }}>
                                  {String.fromCharCode(65 + choiceIndex)}.
                                </span>
                                <span style={{ 
                                  color: choice.id === question.answerId ? '#155724' : '#333'
                                }}>
                                  {choice.label}
                                </span>
                                {choice.id === question.answerId && (
                                  <span style={{
                                    marginLeft: 'auto',
                                    fontSize: '10px',
                                    color: '#155724',
                                    fontWeight: 'bold'
                                  }}>
                                    ✓ 정답
                                  </span>
                                )}
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
                            fontSize: '11px',
                            marginLeft: '15px'
                          }}
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

