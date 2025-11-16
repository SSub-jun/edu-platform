'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
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

  const updateSubject = async (subjectId: string, updates: Partial<Subject>) => {
    await authClient.getApi().put(`/instructor/subjects/${subjectId}`, updates);
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
    const nextState = !subject.isActive;
    try {
      await updateSubject(subject.id, { isActive: nextState });
      loadSubjects();
    } catch (error) {
      console.error('과목 상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
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

  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return subjects;
    const keyword = searchTerm.trim().toLowerCase();
    return subjects.filter((subject) =>
      subject.name.toLowerCase().includes(keyword) ||
      (subject.description || '').toLowerCase().includes(keyword),
    );
  }, [subjects, searchTerm]);

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
          flexDirection: 'column',
          gap: '18px',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
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
                  gap: '6px',
                  marginBottom: '10px'
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
                📚 과목 · 레슨 · 시험 관리
              </h1>
              <p style={{ marginTop: '6px', color: '#666', fontSize: '14px' }}>
                과목을 생성하고, Cohort에 배정할 커리큘럼 콘텐츠를 준비하세요.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => router.push('/admin/questions')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                📝 문제 은행
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
                  fontWeight: '500'
                }}
              >
                ➕ 새 과목
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '16px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="과목명, 설명으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />

            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              fontSize: '14px',
              color: '#495057'
            }}>
              총 {subjects.length}개 과목 · 검색 결과 {filteredSubjects.length}개
            </div>
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
        ) : filteredSubjects.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px',
            color: '#666',
            fontSize: '16px',
            border: '1px dashed #d0d7de',
            borderRadius: '10px',
            backgroundColor: '#f8fafc'
          }}>
            검색 조건에 해당하는 과목이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                style={{
                  border: '1px solid #e6e9ec',
                  borderRadius: '12px',
                  padding: '24px',
                  backgroundColor: '#fafafa',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                        {subject.name}
                      </h3>
                      {!subject.isActive && (
                        <span style={{
                          fontSize: '12px',
                          color: '#dc3545',
                          backgroundColor: '#f8d7da',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          비활성
                        </span>
                      )}
                    </div>
                    {subject.description && (
                      <p style={{
                        margin: '6px 0 12px',
                        color: '#666',
                        fontSize: '14px',
                        lineHeight: 1.5
                      }}>
                        {subject.description}
                      </p>
                    )}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '12px',
                      fontSize: '13px',
                      color: '#555'
                    }}>
                      <div><strong>레슨</strong> {subject.lessonsCount || 0}개</div>
                      <div><strong>문제</strong> {subject.questionsCount || 0}개</div>
                      <div><strong>학생</strong> {subject.studentsCount || 0}명</div>
                      <div><strong>응시</strong> {subject.examAttemptsCount || 0}회</div>
                      <div><strong>순서</strong> {subject.order}</div>
                      <div><strong>생성</strong> {formatDate(subject.createdAt)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                    <button
                      onClick={() => router.push(`/admin/subjects/${subject.id}`)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      📂 관리 페이지 열기
                    </button>
                    <button
                      onClick={() => router.push('/admin/questions')}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      📝 문제 은행 바로가기
                    </button>
                    <button
                      onClick={() => handleToggleActive(subject)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: subject.isActive ? '#ffc107' : '#28a745',
                        color: subject.isActive ? '#333' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {subject.isActive ? '⏸️ 비활성화' : '▶️ 활성화'}
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id, subject.name)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      🗑️ 삭제
                    </button>
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

