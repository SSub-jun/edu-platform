'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../../lib/auth';

interface Company {
  id: string;
  name: string;
  inviteCode: string;
  isActive: boolean;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  lessonCount?: number;
}

interface CompanySubjectAssignment {
  companyId: string;
  subjects: Subject[];
}

export default function AdminSubjectAssignPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<CompanySubjectAssignment[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // 기관 목록 로드
      const companiesResponse = await authClient.getApi().get('/admin/companies');
      const companiesData = Array.isArray(companiesResponse.data) ? companiesResponse.data : [];
      setCompanies(companiesData.filter(c => c.isActive));

      // 전체 과목 목록 로드 (강사 API 활용)
      const subjectsResponse = await authClient.getApi().get('/instructor/subjects');
      if (subjectsResponse.data.success) {
        setAllSubjects(subjectsResponse.data.data || []);
      }

      // 각 기관별 배정된 과목 로드
      const assignmentPromises = companiesData.map(async (company) => {
        try {
          const response = await authClient.getApi().get(`/admin/companies/${company.id}/subjects`);
          return {
            companyId: company.id,
            subjects: response.data.success ? response.data.data : []
          };
        } catch (error) {
          console.warn(`기관 ${company.id} 과목 로드 실패:`, error);
          return { companyId: company.id, subjects: [] };
        }
      });

      const assignmentsData = await Promise.all(assignmentPromises);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubjects = async (companyId: string, subjectIds: string[]) => {
    try {
      await authClient.getApi().patch(`/admin/companies/${companyId}/subjects`, {
        subjectIds
      });

      alert('과목 배정이 완료되었습니다.');
      loadData(); // 데이터 새로고침
    } catch (error) {
      console.error('과목 배정 실패:', error);
      alert('과목 배정에 실패했습니다.');
    }
  };

  const getAssignedSubjects = (companyId: string): Subject[] => {
    const assignment = assignments.find(a => a.companyId === companyId);
    return assignment ? assignment.subjects : [];
  };

  const isSubjectAssigned = (companyId: string, subjectId: string): boolean => {
    const assignedSubjects = getAssignedSubjects(companyId);
    return assignedSubjects.some(s => s.id === subjectId);
  };

  const toggleSubjectAssignment = (companyId: string, subjectId: string) => {
    const assignedSubjects = getAssignedSubjects(companyId);
    const isCurrentlyAssigned = isSubjectAssigned(companyId, subjectId);
    
    let newSubjectIds: string[];
    if (isCurrentlyAssigned) {
      // 제거
      newSubjectIds = assignedSubjects.filter(s => s.id !== subjectId).map(s => s.id);
    } else {
      // 추가
      newSubjectIds = [...assignedSubjects.map(s => s.id), subjectId];
    }
    
    handleAssignSubjects(companyId, newSubjectIds);
  };

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
              📚 과목 배정 관리
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => router.push('/admin/companies')}
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
              🏢 기관 목록
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            로딩 중...
          </div>
        ) : (
          <>
            {/* 전체 과목 목록 */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ 
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📖 전체 과목 목록 ({allSubjects.length}개)
              </h2>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '12px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                {allSubjects.map(subject => (
                  <div
                    key={subject.id}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                      {subject.name}
                    </div>
                    {subject.description && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {subject.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 기관별 과목 배정 */}
            <div>
              <h2 style={{ 
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🏢 기관별 과목 배정 ({companies.length}개 기관)
              </h2>

              <div style={{ display: 'grid', gap: '25px' }}>
                {companies.map(company => {
                  const assignedSubjects = getAssignedSubjects(company.id);
                  
                  return (
                    <div
                      key={company.id}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '25px',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '20px'
                      }}>
                        <h3 style={{ 
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#333',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          {company.name}
                          <span style={{
                            fontSize: '12px',
                            color: '#666',
                            backgroundColor: '#e9ecef',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 'normal'
                          }}>
                            {company.inviteCode}
                          </span>
                        </h3>
                        
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          배정된 과목: {assignedSubjects.length}개
                        </div>
                      </div>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '10px'
                      }}>
                        {allSubjects.map(subject => {
                          const isAssigned = isSubjectAssigned(company.id, subject.id);
                          
                          return (
                            <button
                              key={subject.id}
                              onClick={() => toggleSubjectAssignment(company.id, subject.id)}
                              style={{
                                padding: '12px 16px',
                                backgroundColor: isAssigned ? '#0070f3' : '#f8f9fa',
                                color: isAssigned ? 'white' : '#333',
                                border: isAssigned ? 'none' : '1px solid #ddd',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              onMouseEnter={(e) => {
                                if (!isAssigned) {
                                  e.target.style.backgroundColor = '#e9ecef';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isAssigned) {
                                  e.target.style.backgroundColor = '#f8f9fa';
                                }
                              }}
                            >
                              <span style={{ fontSize: '12px' }}>
                                {isAssigned ? '✅' : '➕'}
                              </span>
                              {subject.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

