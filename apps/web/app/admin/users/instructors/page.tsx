'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../../lib/auth';

interface User {
  id: string;
  username: string;
  phone: string;
  email: string;
  role: string;
  lastLoginAt: string;
  createdAt: string;
}

export default function AdminInstructorsPage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    username: '',
    password: '',
    phone: '',
    email: ''
  });

  const loadInstructors = async () => {
    try {
      const response = await authClient.getApi().get('/admin/users');
      // 응답이 배열로 직접 옴
      const users = Array.isArray(response.data) ? response.data : [];
      setInstructors(users.filter(user => user.role === 'instructor' || user.role === 'admin'));
    } catch (error) {
      console.error('강사 목록 로드 실패:', error);
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstructor = async () => {
    if (!newInstructor.username.trim() || !newInstructor.password.trim() || !newInstructor.phone.trim()) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      await authClient.getApi().post('/admin/users', {
        username: newInstructor.username.trim(),
        password: newInstructor.password,
        phone: newInstructor.phone.trim(),
        email: newInstructor.email.trim() || undefined,
        role: 'instructor'
      });

      alert('강사 계정이 성공적으로 생성되었습니다.');
      setNewInstructor({ username: '', password: '', phone: '', email: '' });
      setShowCreateForm(false);
      loadInstructors();
    } catch (error) {
      console.error('강사 계정 생성 실패:', error);
      alert('강사 계정 생성에 실패했습니다.');
    }
  };

  const handleDeleteInstructor = async (userId: string, username: string, role: string) => {
    if (role === 'admin') {
      alert('관리자 계정은 삭제할 수 없습니다.');
      return;
    }

    if (!confirm(`강사 '${username}' 계정을 정말 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await authClient.getApi().delete(`/admin/users/${userId}`);
      alert('강사 계정이 삭제되었습니다.');
      loadInstructors();
    } catch (error) {
      console.error('강사 계정 삭제 실패:', error);
      alert('강사 계정 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '없음';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'instructor': return '강사';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'instructor': return '#28a745';
      default: return '#6c757d';
    }
  };

  useEffect(() => {
    loadInstructors();
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
              👩‍🏫 강사 계정 관리
            </h1>
          </div>

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
            ➕ 새 강사 계정
          </button>
        </div>

        {/* 새 강사 계정 생성 폼 */}
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
              새 강사 계정 생성
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  사용자명 *
                </label>
                <input
                  type="text"
                  value={newInstructor.username}
                  onChange={(e) => setNewInstructor({ ...newInstructor, username: e.target.value })}
                  placeholder="사용자명을 입력하세요"
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
                  비밀번호 *
                </label>
                <input
                  type="password"
                  value={newInstructor.password}
                  onChange={(e) => setNewInstructor({ ...newInstructor, password: e.target.value })}
                  placeholder="비밀번호를 입력하세요"
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
                  휴대폰 번호 *
                </label>
                <input
                  type="tel"
                  value={newInstructor.phone}
                  onChange={(e) => setNewInstructor({ ...newInstructor, phone: e.target.value })}
                  placeholder="010-0000-0000"
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
                  이메일
                </label>
                <input
                  type="email"
                  value={newInstructor.email}
                  onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                  placeholder="email@example.com (선택사항)"
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
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreateInstructor}
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
                계정 생성
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

        {/* 강사 목록 */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            로딩 중...
          </div>
        ) : instructors.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            등록된 강사가 없습니다.
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
              총 {instructors.length}명의 계정 (관리자 및 강사)
            </div>

            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 10px 0',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {instructor.username}
                      <span style={{
                        fontSize: '12px',
                        color: 'white',
                        backgroundColor: getRoleColor(instructor.role),
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 'normal'
                      }}>
                        {getRoleDisplayName(instructor.role)}
                      </span>
                    </h3>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '15px',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      <div>
                        <strong>휴대폰:</strong> {instructor.phone}
                      </div>
                      <div>
                        <strong>이메일:</strong> {instructor.email || '미설정'}
                      </div>
                      <div>
                        <strong>마지막 로그인:</strong> {formatDate(instructor.lastLoginAt)}
                      </div>
                      <div>
                        <strong>계정 생성:</strong> {formatDate(instructor.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                    {instructor.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteInstructor(instructor.id, instructor.username, instructor.role)}
                        style={{
                          padding: '8px 12px',
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
