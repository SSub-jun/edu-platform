'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '../../../../../lib/auth';

interface Company {
  id: string;
  name: string;
  inviteCode: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  lessonCount: number;
}

interface AllSubject {
  id: string;
  name: string;
  description: string;
}

export default function CompanySubjectsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [assignedSubjects, setAssignedSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<AllSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      // 기관 정보 로드
      const companiesResponse = await authClient.getApi().get('/admin/companies');
      const companies = Array.isArray(companiesResponse.data) ? companiesResponse.data : [];
      const currentCompany = companies.find(c => c.id === companyId);
      setCompany(currentCompany || null);

      // 배정된 과목 로드
      const assignedResponse = await authClient.getApi().get(`/admin/companies/${companyId}/subjects`);
      if (assignedResponse.data.success) {
        setAssignedSubjects(assignedResponse.data.data || []);
      }

      // 전체 과목 목록 로드
      const allSubjectsResponse = await authClient.getApi().get('/instructor/subjects');
      if (allSubjectsResponse.data.success) {
        setAllSubjects(allSubjectsResponse.data.data || []);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubjects = async (subjectIds: string[]) => {
    try {
      await authClient.getApi().patch(`/admin/companies/${companyId}/subjects`, {
        subjectIds
      });

      alert('과목 배정이 완료되었습니다.');
      setShowAssignModal(false);
      setSelectedSubjectIds([]);
      loadData();
    } catch (error) {
      console.error('과목 배정 실패:', error);
      alert('과목 배정에 실패했습니다.');
    }
  };

  const handleRemoveSubject = async (subjectId: string, subjectName: string) => {
    if (!confirm(`'${subjectName}' 과목을 이 기관에서 제거하시겠습니까?`)) {
      return;
    }

    const remainingSubjectIds = assignedSubjects
      .filter(s => s.id !== subjectId)
      .map(s => s.id);
    
    handleAssignSubjects(remainingSubjectIds);
  };

  const getUnassignedSubjects = () => {
    const assignedIds = new Set(assignedSubjects.map(s => s.id));
    return allSubjects.filter(s => !assignedIds.has(s.id));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

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

  if (!company) {
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
          기관을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const unassignedSubjects = getUnassignedSubjects();

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
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
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
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← 기관 목록
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
              📚 {company.name} - 과목 배정
            </h1>
          </div>

          {/* 기관 정보 */}
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div><strong>초대 코드:</strong> {company.inviteCode}</div>
            <div><strong>운영 기간:</strong> {formatDate(company.startDate)} ~ {formatDate(company.endDate)}</div>
            <div><strong>상태:</strong> {company.isActive ? '활성' : '비활성'}</div>
            <div><strong>배정된 과목:</strong> {assignedSubjects.length}개</div>
          </div>
        </div>

        {/* 과목 배정 관리 버튼 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{ 
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0
          }}>
            배정된 과목 목록
          </h2>
          
          <button
            onClick={() => setShowAssignModal(true)}
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
            disabled={unassignedSubjects.length === 0}
          >
            ➕ 과목 추가하기 ({unassignedSubjects.length}개 추가 가능)
          </button>
        </div>

        {/* 배정된 과목 목록 */}
        {assignedSubjects.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            배정된 과목이 없습니다. 과목을 추가해보세요.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '15px'
          }}>
            {assignedSubjects.map((subject) => (
              <div
                key={subject.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ 
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {subject.name}
                  </h3>
                  
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                    {subject.description || '설명이 없습니다.'}
                  </div>
                  
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    레슨 수: {subject.lessonCount}개
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveSubject(subject.id, subject.name)}
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
                  🗑️ 제거
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 과목 추가 모달 */}
        {showAssignModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ 
                margin: '0 0 20px 0',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                과목 추가하기
              </h3>

              {unassignedSubjects.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                  추가할 수 있는 과목이 없습니다.
                </p>
              ) : (
                <>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    추가할 과목을 선택하세요. (클릭하여 선택/해제)
                  </p>

                  <div style={{ 
                    display: 'grid', 
                    gap: '10px',
                    marginBottom: '25px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '15px'
                  }}>
                    {unassignedSubjects.map((subject) => {
                      const isSelected = selectedSubjectIds.includes(subject.id);
                      
                      return (
                        <button
                          key={subject.id}
                          onClick={() => {
                            setSelectedSubjectIds(prev => 
                              prev.includes(subject.id) 
                                ? prev.filter(id => id !== subject.id)
                                : [...prev, subject.id]
                            );
                          }}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: isSelected ? '#0070f3' : '#f8f9fa',
                            color: isSelected ? 'white' : '#333',
                            border: isSelected ? 'none' : '1px solid #ddd',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            {subject.name}
                          </div>
                          {subject.description && (
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                              {subject.description}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedSubjectIds([]);
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  취소
                </button>

                <button
                  onClick={() => {
                    if (selectedSubjectIds.length > 0) {
                      handleAssignSubjects([...assignedSubjects.map(s => s.id), ...selectedSubjectIds]);
                    } else {
                      alert('선택된 과목이 없습니다.');
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  추가하기 ({selectedSubjectIds.length}개)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
