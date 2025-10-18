'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../lib/auth';

interface Subject {
  id: string;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  lessonsCount?: number;
  questionsCount?: number;
  studentsCount?: number;
  examAttemptsCount?: number;
}

export default function AdminSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: '',
    order: 0
  });

  const loadSubjects = async () => {
    try {
      // 강사 API를 통해 모든 과목 조회 (관리자는 모든 과목 접근 가능)
      const response = await authClient.getApi().get('/instructor/subjects');
      if (response.data.success) {
        setSubjects(response.data.data || []);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('과목 목록 로드 실패:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubject.name.trim()) {
      alert('과목명을 입력해주세요.');
      return;
    }

    try {
      await authClient.getApi().post('/instructor/subjects', {
        name: newSubject.name.trim(),
        description: newSubject.description.trim() || undefined,
        order: newSubject.order || 0
      });

      alert('과목이 성공적으로 생성되었습니다.');
      setNewSubject({ name: '', description: '', order: 0 });
      setShowCreateForm(false);
      loadSubjects();
    } catch (error) {
      console.error('과목 생성 실패:', error);
      alert('과목 생성에 실패했습니다.');
    }
  };

  const handleUpdateSubject = async (subjectId: string, updates: Partial<Subject>) => {
    try {
      await authClient.getApi().put(`/instructor/subjects/${subjectId}`, updates);
      alert('과목이 성공적으로 수정되었습니다.');
      setEditingSubject(null);
      loadSubjects();
    } catch (error) {
      console.error('과목 수정 실패:', error);
      alert('과목 수정에 실패했습니다.');
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (!confirm(`'${subjectName}' 과목을 정말 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await authClient.getApi().delete(`/instructor/subjects/${subjectId}`);
      alert('과목이 삭제되었습니다.');
      loadSubjects();
    } catch (error) {
      console.error('과목 삭제 실패:', error);
      alert('과목 삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (subject: Subject) => {
    const newStatus = !subject.isActive;
    const action = newStatus ? '활성화' : '비활성화';
    
    if (!confirm(`'${subject.name}' 과목을 ${action}하시겠습니까?`)) {
      return;
    }

    handleUpdateSubject(subject.id, { isActive: newStatus });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    loadSubjects();
  }, []);

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
              📖 전체 과목 관리
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => router.push('/admin/questions')}
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
              📝 문제 은행 관리
            </button>
            
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '12px 20px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ➕ 새 과목 생성
            </button>
          </div>
        </div>

        {/* 새 과목 생성 폼 */}
        {showCreateForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '25px',
            borderRadius: '8px',
            marginBottom: '30px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#333',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              새 과목 생성
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  과목명 *
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="과목명을 입력하세요"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  정렬 순서
                </label>
                <input
                  type="number"
                  value={newSubject.order}
                  onChange={(e) => setNewSubject({ ...newSubject, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  설명
                </label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  placeholder="과목 설명을 입력하세요 (선택사항)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreateSubject}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                과목 생성
              </button>
              
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 과목 목록 */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            로딩 중...
          </div>
        ) : subjects.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            등록된 과목이 없습니다.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '20px'
          }}>
            <div style={{ 
              marginBottom: '15px',
              fontSize: '16px',
              color: '#666'
            }}>
              총 {subjects.length}개의 과목
            </div>

            {subjects.map((subject) => (
              <div
                key={subject.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '25px',
                  backgroundColor: subject.isActive ? '#fafafa' : '#f8f8f8',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  opacity: subject.isActive ? 1 : 0.7
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {editingSubject?.id === subject.id ? (
                      // 편집 모드
                      <div style={{ marginBottom: '20px' }}>
                        <input
                          type="text"
                          value={editingSubject.name}
                          onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                          style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            marginBottom: '10px',
                            width: '100%',
                            maxWidth: '400px',
                            boxSizing: 'border-box'
                          }}
                        />
                        <textarea
                          value={editingSubject.description || ''}
                          onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                          placeholder="과목 설명"
                          rows={2}
                          style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    ) : (
                      // 조회 모드
                      <>
                        <h3 style={{ 
                          margin: '0 0 10px 0',
                          fontSize: '22px',
                          fontWeight: 'bold',
                          color: '#333',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          {subject.name}
                          {!subject.isActive && (
                            <span style={{
                              fontSize: '12px',
                              color: '#dc3545',
                              backgroundColor: '#f8d7da',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 'normal'
                            }}>
                              비활성
                            </span>
                          )}
                        </h3>
                        
                        {subject.description && (
                          <p style={{ 
                            margin: '0 0 15px 0',
                            color: '#666',
                            fontSize: '14px',
                            lineHeight: '1.5'
                          }}>
                            {subject.description}
                          </p>
                        )}
                      </>
                    )}

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '15px',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      <div>
                        <strong>레슨:</strong> {subject.lessonsCount || 0}개
                      </div>
                      <div>
                        <strong>문제:</strong> {subject.questionsCount || 0}개
                      </div>
                      <div>
                        <strong>수강생:</strong> {subject.studentsCount || 0}명
                      </div>
                      <div>
                        <strong>시험 응시:</strong> {subject.examAttemptsCount || 0}회
                      </div>
                      <div>
                        <strong>생성일:</strong> {formatDate(subject.createdAt)}
                      </div>
                      <div>
                        <strong>순서:</strong> {subject.order}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '20px', flexWrap: 'wrap' }}>
                    {editingSubject?.id === subject.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateSubject(subject.id, editingSubject)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          ✓ 저장
                        </button>
                        <button
                          onClick={() => setEditingSubject(null)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          ✗ 취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => router.push(`/admin/subjects/${subject.id}/questions`)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          📝 문제 관리
                        </button>
                        
                        <button
                          onClick={() => handleToggleActive(subject)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: subject.isActive ? '#ffc107' : '#28a745',
                            color: subject.isActive ? '#333' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {subject.isActive ? '⏸️ 비활성화' : '▶️ 활성화'}
                        </button>
                        
                        <button
                          onClick={() => setEditingSubject(subject)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          ✏️ 편집
                        </button>

                        <button
                          onClick={() => handleDeleteSubject(subject.id, subject.name)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          🗑️ 삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

