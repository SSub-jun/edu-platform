'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../lib/auth';

interface Company {
  id: string;
  name: string;
}

interface SubjectProgress {
  subject: {
    id: string;
    name: string;
  };
  progressPercent: number;
  status: string;
}

interface Student {
  id: string;
  username: string;
  phone: string;
  email?: string;
  company?: Company;
  subjectProgress: SubjectProgress[];
  examAttempts: number;
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 학생 생성 폼
  const [newStudent, setNewStudent] = useState({
    username: '',
    password: '',
    phone: '',
    email: '',
    companyId: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedCompany]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 학생 목록 조회
      const params = selectedCompany !== 'all' ? `?companyId=${selectedCompany}` : '';
      const studentsResponse = await authClient.getApi().get(`/admin/users/students${params}`);
      
      if (studentsResponse.data?.success) {
        setStudents(studentsResponse.data.data);
      }

      // 회사 목록 조회
      const companiesResponse = await authClient.getApi().get('/admin/companies');
      if (Array.isArray(companiesResponse.data)) {
        setCompanies(companiesResponse.data);
      }
    } catch (error) {
      console.error('[ADMIN][STUDENTS] 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudent.username.trim() || !newStudent.password.trim() || !newStudent.phone.trim()) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      await authClient.getApi().post('/admin/users/students', {
        username: newStudent.username.trim(),
        password: newStudent.password.trim(),
        phone: newStudent.phone.trim(),
        email: newStudent.email.trim() || undefined,
        companyId: newStudent.companyId || undefined
      });

      alert('학생 계정이 생성되었습니다.');
      setNewStudent({ username: '', password: '', phone: '', email: '', companyId: '' });
      setShowCreateForm(false);
      loadData();
    } catch (error: any) {
      console.error('[ADMIN][STUDENTS] 학생 생성 실패:', error);
      alert('학생 생성에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteStudent = async (studentId: string, username: string) => {
    if (!confirm(`"${username}" 학생을 삭제하시겠습니까?\n\n⚠️ 주의: 학습 기록도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await authClient.getApi().delete(`/admin/users/students/${studentId}`);
      alert('학생이 삭제되었습니다.');
      loadData();
    } catch (error) {
      console.error('[ADMIN][STUDENTS] 학생 삭제 실패:', error);
      alert('학생 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '없음';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastLoginStatus = (lastLoginAt?: string) => {
    if (!lastLoginAt) return { text: '미접속', color: '#dc3545' };
    
    const daysSince = Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return { text: '오늘', color: '#28a745' };
    if (daysSince <= 7) return { text: `${daysSince}일 전`, color: '#28a745' };
    if (daysSince <= 30) return { text: `${daysSince}일 전`, color: '#ffc107' };
    return { text: `${daysSince}일 전`, color: '#dc3545' };
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return '#28a745';
    if (percent >= 50) return '#ffc107';
    return '#dc3545';
  };

  // 필터링 및 검색
  const filteredStudents = students.filter(student => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        student.username.toLowerCase().includes(term) ||
        student.phone.includes(term) ||
        student.email?.toLowerCase().includes(term)
      );
    }
    return true;
  });

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
            
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#333',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                👥 학생 관리
              </h1>
              <p style={{ marginTop: '6px', color: '#666', fontSize: '14px' }}>
                학생 계정 생성, 조회, 학습 진도 확인
              </p>
            </div>
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
            ➕ 새 학생 추가
          </button>
        </div>

        {/* 학생 생성 폼 */}
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
                  아이디 *
                </label>
                <input
                  type="text"
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                  placeholder="학생 아이디"
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
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value.toLowerCase() })}
                  placeholder="초기 비밀번호"
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
                  전화번호 *
                </label>
                <input
                  type="tel"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  placeholder="010-1234-5678"
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
                  placeholder="student@example.com"
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
                  소속 회사
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
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">회사 선택 (선택사항)</option>
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
                생성하기
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

        {/* 필터 및 검색 */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '25px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              style={{
                padding: '8px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">전체 회사</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="이름, 전화번호, 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '8px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />

          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            fontWeight: '500'
          }}>
            총 {filteredStudents.length}명
          </div>
        </div>

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
            fontSize: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '15px'
          }}>
            {filteredStudents.map((student) => {
              const loginStatus = getLastLoginStatus(student.lastLoginAt);
              const avgProgress = student.subjectProgress.length > 0
                ? Math.round(student.subjectProgress.reduce((sum, sp) => sum + sp.progressPercent, 0) / student.subjectProgress.length)
                : 0;

              return (
                <div
                  key={student.id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '10px',
                    padding: '20px',
                    backgroundColor: '#fafafa',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: '0 0 8px 0',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        {student.username}
                        {student.company && (
                          <span style={{
                            marginLeft: '10px',
                            fontSize: '13px',
                            color: '#0070f3',
                            backgroundColor: '#e3f2fd',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontWeight: 'normal'
                          }}>
                            {student.company.name}
                          </span>
                        )}
                      </h3>
                      <div style={{ 
                        display: 'flex',
                        gap: '15px',
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        <span>📞 {student.phone}</span>
                        {student.email && <span>📧 {student.email}</span>}
                        <span>
                          마지막 접속: 
                          <span style={{ 
                            marginLeft: '5px',
                            color: loginStatus.color,
                            fontWeight: '500'
                          }}>
                            {loginStatus.text}
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteStudent(student.id, student.username)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        height: 'fit-content'
                      }}
                    >
                      🗑️ 삭제
                    </button>
                  </div>

                  {/* 학습 통계 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>평균 진도율</div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold',
                        color: getProgressColor(avgProgress)
                      }}>
                        {avgProgress}%
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>수강 과목</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                        {student.subjectProgress.length}개
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>시험 응시</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                        {student.examAttempts}회
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>가입일</div>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>
                        {new Date(student.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>

                  {/* 과목별 진도 */}
                  {student.subjectProgress.length > 0 && (
                    <div>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#555',
                        marginBottom: '8px'
                      }}>
                        📚 과목별 진도
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {student.subjectProgress.map((progress) => (
                          <div 
                            key={progress.subject.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <div style={{ 
                              minWidth: '120px',
                              fontSize: '12px',
                              color: '#666'
                            }}>
                              {progress.subject.name}
                            </div>
                            <div style={{ 
                              flex: 1,
                              height: '8px',
                              backgroundColor: '#e9ecef',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${progress.progressPercent}%`,
                                height: '100%',
                                backgroundColor: getProgressColor(progress.progressPercent),
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            <div style={{ 
                              minWidth: '45px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: getProgressColor(progress.progressPercent),
                              textAlign: 'right'
                            }}>
                              {Math.round(progress.progressPercent)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
