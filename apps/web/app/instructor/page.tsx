'use client';

export const dynamic = 'force-dynamic';

import { useAuthGuard } from '../hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authClient } from '../../lib/auth';

interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export default function InstructorPage() {
  const { isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });

  // 과목 목록 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadSubjects();
    }
  }, [isAuthenticated]);

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/instructor/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // API 데이터를 Subject 타입에 맞게 변환
          const icons = ['🏭', '⚡', '📊', '🔧', '💼', '📈', '🎯', '🔬', '💡', '📋'];
          const apiSubjects: Subject[] = result.data.map((subject: any, index: number) => ({
            id: subject.id,
            name: subject.name,
            description: subject.description || '과목 설명 없음',
            color: '#0070f3',
            icon: icons[index % icons.length]
          }));
          setSubjects(apiSubjects);
        }
      } else {
        console.error('Failed to load subjects:', response.statusText);
        // 오류 시 빈 배열로 설정
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    }
  };

  const handleAddSubject = async () => {
    if (newSubject.name.trim()) {
      try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/instructor/subjects`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newSubject.name,
            description: newSubject.description || undefined,
            order: subjects.length
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // 성공적으로 생성되면 목록을 다시 로드
            await loadSubjects();
            setNewSubject({ name: '', description: '' });
            setShowAddForm(false);
          }
        } else {
          console.error('Failed to create subject:', response.statusText);
          alert('과목 생성에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error creating subject:', error);
        alert('과목 생성 중 오류가 발생했습니다.');
      }
    }
  };

  const handleLogout = async () => {
    await authClient.logout();
  };

  if (!isAuthenticated) {
    return <div>인증 중...</div>;
  }

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
            강사 대시보드
          </h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            로그아웃
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '25px'
        }}>
          {/* 과목 관리 */}
          <div style={{
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginBottom: '10px', 
              color: '#333',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📚 과목 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              담당 과목의 시험 문제, 학습 영상, 강의 자료를 통합 관리
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 과목 목록 */}
              {subjects.map((subject) => (
                <button 
                  key={subject.id}
                  onClick={() => router.push(`/instructor/subjects/${subject.id}`)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    marginBottom: '10px'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#0051a5';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#0070f3';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  {subject.icon} {subject.name}
                </button>
              ))}
              
              {/* 과목 추가 버튼/폼 */}
              {!showAddForm ? (
                <button 
                  onClick={() => setShowAddForm(true)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: '2px dashed #adb5bd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  ➕ 새 과목 추가
                </button>
              ) : (
                <div style={{
                  padding: '15px',
                  border: '2px solid #28a745',
                  borderRadius: '8px',
                  backgroundColor: '#f8fff9'
                }}>
                  <input
                    type="text"
                    placeholder="과목명 입력 (예: 생산관리, 품질경영)"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="과목 설명 (선택사항)"
                    value={newSubject.description}
                    onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleAddSubject}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      추가
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewSubject({ name: '', description: '' });
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#e9ecef',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#495057'
            }}>
              💡 각 과목별로 시험 문제, 영상, 자료를 관리할 수 있습니다
            </div>
          </div>

          {/* 학생 관리 */}
          <div style={{
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginBottom: '10px', 
              color: '#333',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👥 학생 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              수강생들의 학습 진도, 시험 성과, 출석 현황을 확인
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => router.push('/instructor/students')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0051a5'}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0070f3'}
              >
                📊 학생 현황 보기
              </button>
            </div>
            
          </div>

          {/* Q&A 답변 관리 */}
          <div style={{
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              marginBottom: '10px', 
              color: '#333',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💬 Q&A 답변 관리
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              학생들의 질문에 답변하고 학습 지원 제공
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => router.push('/qna')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0051a5'}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0070f3'}
              >
                💭 질문 답변하기
              </button>
            </div>
            
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#e9ecef',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#495057'
            }}>
              ⚡ 실시간으로 학생 질문에 빠른 답변을 제공하세요
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
