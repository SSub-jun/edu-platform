'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '../../../../lib/auth';

interface Company {
  id: string;
  name: string;
  inviteCode: string;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface Student {
  id: string;
  username: string;
  name?: string;
  phone: string;
}

interface Cohort {
  id: string;
  companyId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  cohortSubjects?: Array<{ subject: Subject }>;
  userCohorts?: Array<{ user: Student }>;
  createdAt: string;
  updatedAt: string;
}

export default function CohortDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const formatDate = (date?: string | null) => {
    if (!date) return '미정';
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const formatDateForInput = (date?: string | null) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);

    try {
      // 회사 정보 로드
      const companiesResponse = await authClient.getApi().get('/admin/companies');
      const companies = Array.isArray(companiesResponse.data) ? companiesResponse.data : [];
      const currentCompany = companies.find((c: Company) => c.id === companyId) || null;
      setCompany(currentCompany);

      // Cohort 목록 로드
      const cohortResponse = await authClient.getApi().get(`/admin/cohorts/company/${companyId}`);
      setCohorts(Array.isArray(cohortResponse.data) ? cohortResponse.data : []);

      // 전체 과목 목록 로드
      const subjectsResponse = await authClient.getApi().get('/admin/subjects');
      const subjectList = subjectsResponse.data?.data ?? subjectsResponse.data;
      setAllSubjects(Array.isArray(subjectList) ? subjectList : []);

      // 회사 소속 학생 목록 로드
      const studentsResponse = await authClient.getApi().get(`/admin/users?role=student&companyId=${companyId}`);
      setAllStudents(Array.isArray(studentsResponse.data) ? studentsResponse.data : []);
    } catch (err: any) {
      console.error('[ADMIN/COHORTS] 데이터 로드 실패', err);
      setError('데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleCreateCohort = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      await authClient.getApi().post('/admin/cohorts', {
        companyId,
        name: formData.name,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: formData.isActive,
      });
      alert('Cohort가 생성되었습니다.');
      setShowCreateModal(false);
      setFormData({ name: '', startDate: '', endDate: '', isActive: true });
      loadData();
    } catch (err: any) {
      console.error('[ADMIN/COHORTS] Cohort 생성 실패', err);
      alert('Cohort 생성에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateCohort = async () => {
    if (!selectedCohort) return;

    try {
      await authClient.getApi().patch(`/admin/cohorts/${selectedCohort.id}`, {
        name: formData.name || undefined,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        isActive: formData.isActive,
      });
      alert('Cohort가 수정되었습니다.');
      setShowEditModal(false);
      setSelectedCohort(null);
      setFormData({ name: '', startDate: '', endDate: '', isActive: true });
      loadData();
    } catch (err: any) {
      console.error('[ADMIN/COHORTS] Cohort 수정 실패', err);
      alert('Cohort 수정에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCohort = async (cohortId: string) => {
    if (!confirm('이 Cohort를 비활성화하시겠습니까?')) return;

    try {
      await authClient.getApi().delete(`/admin/cohorts/${cohortId}`);
      alert('Cohort가 비활성화되었습니다.');
      loadData();
    } catch (err: any) {
      console.error('[ADMIN/COHORTS] Cohort 삭제 실패', err);
      alert('Cohort 삭제에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAssignSubjects = async () => {
    if (!selectedCohort) return;

    try {
      await authClient.getApi().put(`/admin/cohorts/${selectedCohort.id}/subjects`, {
        subjectIds: selectedSubjectIds,
      });
      alert('과목이 배정되었습니다.');
      setShowSubjectModal(false);
      setSelectedCohort(null);
      setSelectedSubjectIds([]);
      loadData();
    } catch (err: any) {
      console.error('[ADMIN/COHORTS] 과목 배정 실패', err);
      alert('과목 배정에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedCohort) return;

    try {
      await authClient.getApi().put(`/admin/cohorts/${selectedCohort.id}/students`, {
        userIds: selectedStudentIds,
      });
      alert('학생이 배정되었습니다.');
      setShowStudentModal(false);
      setSelectedCohort(null);
      setSelectedStudentIds([]);
      loadData();
    } catch (err: any) {
      console.error('[ADMIN/COHORTS] 학생 배정 실패', err);
      alert('학생 배정에 실패했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (cohort: Cohort) => {
    setSelectedCohort(cohort);
    setFormData({
      name: cohort.name,
      startDate: formatDateForInput(cohort.startDate) || '',
      endDate: formatDateForInput(cohort.endDate) || '',
      isActive: cohort.isActive,
    });
    setShowEditModal(true);
  };

  const openSubjectModal = (cohort: Cohort) => {
    setSelectedCohort(cohort);
    const currentSubjectIds = cohort.cohortSubjects?.map((cs) => cs.subject.id) || [];
    setSelectedSubjectIds(currentSubjectIds);
    setShowSubjectModal(true);
  };

  const openStudentModal = (cohort: Cohort) => {
    setSelectedCohort(cohort);
    const currentStudentIds = cohort.userCohorts?.map((uc) => uc.user.id) || [];
    setSelectedStudentIds(currentStudentIds);
    setShowStudentModal(true);
  };

  if (!companyId) {
    return (
      <div style={{ padding: '40px' }}>
        <p>잘못된 접근입니다. 회사 ID가 필요합니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        로딩 중...
      </div>
    );
  }

  if (error || !company) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
        {error ?? '회사를 찾을 수 없습니다.'}
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
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #eee',
          paddingBottom: '16px'
        }}>
          <div>
            <button
              onClick={() => router.push('/admin/companies')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '10px'
              }}
            >
              ← 회사 목록으로
            </button>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700 }}>
              {company.name} Cohort 관리
            </h1>
            <p style={{ margin: '6px 0 0', color: '#666', fontSize: '14px' }}>
              초대코드 <strong>{company.inviteCode}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              + Cohort 생성
            </button>
          </div>
        </div>

        {/* Cohort 목록 */}
        <div style={{
          display: 'grid',
          gap: '16px'
        }}>
          {cohorts.length === 0 ? (
            <div style={{
              padding: '24px',
              borderRadius: '10px',
              border: '1px dashed #d0d7de',
              backgroundColor: '#f8fafc',
              color: '#475467',
              lineHeight: 1.6,
              textAlign: 'center'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>등록된 Cohort가 없습니다</h3>
              <p style={{ margin: 0 }}>
                "+ Cohort 생성" 버튼을 눌러 새로운 기수를 만들어보세요.
              </p>
            </div>
          ) : (
            cohorts.map((cohort) => (
              <div
                key={cohort.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '10px',
                  padding: '20px',
                  backgroundColor: cohort.isActive ? '#fafafa' : '#f5f5f5'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>
                      {cohort.name}
                      <span style={{
                        marginLeft: '10px',
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: cohort.isActive ? '#e6f4ff' : '#f2f4f7',
                        color: cohort.isActive ? '#0b6bcb' : '#6c757d'
                      }}>
                        {cohort.isActive ? '진행 중' : '비활성'}
                      </span>
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                      {formatDate(cohort.startDate)} ~ {formatDate(cohort.endDate)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(cohort)}
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
                      onClick={() => handleDeleteCohort(cohort.id)}
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
                      비활성화
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '13px',
                  color: '#555',
                  marginBottom: '12px'
                }}>
                  <div>과목 {cohort.cohortSubjects?.length ?? 0}개</div>
                  <div>학생 {cohort.userCohorts?.length ?? 0}명</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openSubjectModal(cohort)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    과목 배정
                  </button>
                  <button
                    onClick={() => openStudentModal(cohort)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    학생 배정
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cohort 생성 모달 */}
      {showCreateModal && (
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
            <h2 style={{ marginTop: 0 }}>Cohort 생성</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>기수 이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 2025년 1기"
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
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>시작일 *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>종료일 *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  id="isActive"
                />
                <label htmlFor="isActive" style={{ fontWeight: 600 }}>활성 상태</label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', startDate: '', endDate: '', isActive: true });
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
                  onClick={handleCreateCohort}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cohort 수정 모달 */}
      {showEditModal && selectedCohort && (
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
            <h2 style={{ marginTop: 0 }}>Cohort 수정</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>기수 이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>시작일</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>종료일</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  id="isActiveEdit"
                />
                <label htmlFor="isActiveEdit" style={{ fontWeight: 600 }}>활성 상태</label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCohort(null);
                    setFormData({ name: '', startDate: '', endDate: '', isActive: true });
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
                  onClick={handleUpdateCohort}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 과목 배정 모달 */}
      {showSubjectModal && selectedCohort && (
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
            <h2 style={{ marginTop: 0 }}>과목 배정 - {selectedCohort.name}</h2>
            <div style={{ marginBottom: '20px' }}>
              {allSubjects.map((subject) => (
                <div key={subject.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.includes(subject.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubjectIds([...selectedSubjectIds, subject.id]);
                      } else {
                        setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subject.id));
                      }
                    }}
                    id={`subject-${subject.id}`}
                  />
                  <label htmlFor={`subject-${subject.id}`} style={{ fontSize: '14px' }}>
                    {subject.name}
                    {subject.description && <span style={{ color: '#666', marginLeft: '8px' }}>({subject.description})</span>}
                  </label>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSubjectModal(false);
                  setSelectedCohort(null);
                  setSelectedSubjectIds([]);
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
                onClick={handleAssignSubjects}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                배정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 학생 배정 모달 */}
      {showStudentModal && selectedCohort && (
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
            <h2 style={{ marginTop: 0 }}>학생 배정 - {selectedCohort.name}</h2>
            <div style={{ marginBottom: '20px' }}>
              {allStudents.length === 0 ? (
                <p style={{ color: '#666' }}>이 회사에 등록된 학생이 없습니다.</p>
              ) : (
                allStudents.map((student) => (
                  <div key={student.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds([...selectedStudentIds, student.id]);
                        } else {
                          setSelectedStudentIds(selectedStudentIds.filter((id) => id !== student.id));
                        }
                      }}
                      id={`student-${student.id}`}
                    />
                    <label htmlFor={`student-${student.id}`} style={{ fontSize: '14px' }}>
                      {student.name || student.username} ({student.phone})
                    </label>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setSelectedCohort(null);
                  setSelectedStudentIds([]);
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
                onClick={handleAssignStudents}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                배정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
