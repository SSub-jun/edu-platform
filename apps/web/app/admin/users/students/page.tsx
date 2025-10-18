'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../../lib/auth';

interface Company {
  id: string;
  name: string;
}

interface Student {
  id: string;
  username: string;
  phone: string;
  email: string;
  company: Company | null;
  subjectProgress: Array<{
    subject: {
      id: string;
      name: string;
    }
  }>;
  examAttempts: number;
  lastLoginAt: string;
  createdAt: string;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('');
  const [newStudent, setNewStudent] = useState({
    username: '',
    password: '',
    phone: '',
    email: '',
    companyId: ''
  });

  const loadData = async () => {
    try {
      // 학생 목록 로드
      const studentsResponse = await authClient.getApi().get('/admin/users/students');
      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.data || []);
      }

      // 기관 목록 로드
      const companiesResponse = await authClient.getApi().get('/admin/companies');
      const companiesData = Array.isArray(companiesResponse.data) ? companiesResponse.data : [];
      setCompanies(companiesData.filter(c => c.isActive));
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setStudents([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudent.username.trim() || !newStudent.password.trim() || !newStudent.phone.trim()) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      await authClient.getApi().post('/admin/users/students', {
        username: newStudent.username.trim(),
        password: newStudent.password,
        phone: newStudent.phone.trim(),
        email: newStudent.email.trim() || undefined,
        companyId: newStudent.companyId || undefined
      });

      alert('학생 계정이 성공적으로 생성되었습니다.');
      setNewStudent({ username: '', password: '', phone: '', email: '', companyId: '' });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('학생 계정 생성 실패:', error);
      alert('학생 계정 생성에 실패했습니다.');
    }
  };

  const handleDeleteStudent = async (studentId: string, username: string) => {
    if (!confirm(`학생 '${username}' 계정을 정말 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await authClient.getApi().delete(`/admin/users/students/${studentId}`);
      alert('학생 계정이 삭제되었습니다.');
      loadData();
    } catch (error) {
      console.error('학생 계정 삭제 실패:', error);
      alert('학생 계정 삭제에 실패했습니다.');
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

  const filteredStudents = selectedCompanyFilter 
    ? selectedCompanyFilter === 'no-company'
      ? students.filter(student => !student.company)
      : students.filter(student => student.company?.id === selectedCompanyFilter)
    : students;

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
              👥 학생 계정 관리
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
            ➕ 새 학생 계정
          </button>
        </div>

        {/* 필터링 */}
        <div style={{
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>
            기관별 필터:
          </label>
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">전체 기관</option>
            <option value="no-company">미배정</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <div style={{ fontSize: '14px', color: '#666', marginLeft: 'auto' }}>
            총 {filteredStudents.length}명의 학생
          </div>
        </div>

        {/* 새 학생 계정 생성 폼 */}
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
              새 학생 계정 생성
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  사용자명 *
                </label>
                <input
                  type="text"
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
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
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
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
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
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
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
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

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  소속 기관
                </label>
                <select
                  value={newStudent.companyId}
                  onChange={(e) => setNewStudent({ ...newStudent, companyId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">기관 미배정</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreateStudent}
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

        {/* 학생 목록 */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            로딩 중...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            {selectedCompanyFilter ? '해당 기관에 소속된 학생이 없습니다.' : '등록된 학생이 없습니다.'}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '20px'
          }}>
            {filteredStudents.map((student) => (
              <div
                key={student.id}
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
                      {student.username}
                      {student.company && (
                        <span style={{
                          fontSize: '12px',
                          color: '#0070f3',
                          backgroundColor: '#e6f3ff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 'normal'
                        }}>
                          {student.company.name}
                        </span>
                      )}
                    </h3>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      <div>
                        <strong>휴대폰:</strong> {student.phone}
                      </div>
                      <div>
                        <strong>이메일:</strong> {student.email || '미설정'}
                      </div>
                      <div>
                        <strong>수강 과목:</strong> {student.subjectProgress.length}개
                      </div>
                      <div>
                        <strong>시험 응시:</strong> {student.examAttempts}회
                      </div>
                      <div>
                        <strong>마지막 로그인:</strong> {formatDate(student.lastLoginAt)}
                      </div>
                      <div>
                        <strong>계정 생성:</strong> {formatDate(student.createdAt)}
                      </div>
                    </div>

                    {/* 수강 과목 목록 */}
                    {student.subjectProgress.length > 0 && (
                      <div style={{ 
                        marginTop: '15px',
                        paddingTop: '15px',
                        borderTop: '1px solid #e0e0e0'
                      }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          marginBottom: '8px',
                          fontWeight: '500'
                        }}>
                          수강 과목:
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '6px'
                        }}>
                          {student.subjectProgress.map((sp) => (
                            <span
                              key={sp.subject.id}
                              style={{
                                fontSize: '11px',
                                color: '#555',
                                backgroundColor: '#e9ecef',
                                padding: '2px 6px',
                                borderRadius: '8px'
                              }}
                            >
                              {sp.subject.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                    <button
                      onClick={() => handleDeleteStudent(student.id, student.username)}
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
