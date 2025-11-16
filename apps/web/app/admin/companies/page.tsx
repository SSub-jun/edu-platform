'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../lib/auth';

interface Company {
  id: string;
  name: string;
  inviteCode: string;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  userCount?: number;
  activeLessonCount?: number;
  createdAt: string;
}

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const loadCompanies = async () => {
    try {
      const response = await authClient.getApi().get('/admin/companies');
      if (Array.isArray(response.data)) {
        setCompanies(response.data);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('기관 목록 로드 실패:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) {
      alert('기관명을 입력해주세요.');
      return;
    }

    try {
      await authClient.getApi().post('/admin/companies', {
        name: newCompany.name.trim(),
        startDate: newCompany.startDate || undefined,
        endDate: newCompany.endDate || undefined,
        description: newCompany.description || undefined
      });

      alert('기관이 성공적으로 생성되었습니다.');
      setNewCompany({ name: '', startDate: '', endDate: '', description: '' });
      setShowCreateForm(false);
      loadCompanies();
    } catch (error) {
      console.error('기관 생성 실패:', error);
      alert('기관 생성에 실패했습니다.');
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`'${companyName}' 기관을 정말 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await authClient.getApi().delete(`/admin/companies/${companyId}`);
      alert('기관이 삭제되었습니다.');
      loadCompanies();
    } catch (error) {
      console.error('기관 삭제 실패:', error);
      alert('기관 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '미정';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  useEffect(() => {
    loadCompanies();
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
                🏢 회사 목록 / Cohort 준비
              </h1>
              <p style={{ marginTop: '6px', color: '#666', fontSize: '14px' }}>
                회사를 선택하면 새로운 Cohort 관리 화면으로 이동할 수 있습니다.
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
            ➕ 새 기관 추가
          </button>
        </div>

        {/* 새 기관 생성 폼 */}
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
              새 기관 생성
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                  기관명 *
                </label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="기관명을 입력하세요"
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
                  설명
                </label>
                <input
                  type="text"
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                  placeholder="기관 설명 (선택사항)"
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
                  시작일
                </label>
                <input
                  type="date"
                  value={newCompany.startDate}
                  onChange={(e) => setNewCompany({ ...newCompany, startDate: e.target.value })}
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
                  종료일
                </label>
                <input
                  type="date"
                  value={newCompany.endDate}
                  onChange={(e) => setNewCompany({ ...newCompany, endDate: e.target.value })}
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
                onClick={handleCreateCompany}
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

        {/* 기관 목록 */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            로딩 중...
          </div>
        ) : companies.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            등록된 기관이 없습니다.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '20px'
          }}>
            {companies.map((company) => (
              <div
                key={company.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '10px',
                  padding: '24px',
                  backgroundColor: '#fafafa',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 6px 0',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {company.name}
                      {!company.isActive && (
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
                    <div style={{ color: '#666', fontSize: '13px' }}>
                      생성일 {new Date(company.createdAt).toLocaleDateString('ko-KR')} · 초대코드 {company.inviteCode}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => router.push(`/admin/cohorts/${company.id}`)}
                      style={{
                        padding: '10px 16px',
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
                      📅 Cohort 관리
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company.id, company.name)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  color: '#555',
                  fontSize: '14px'
                }}>
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>예정 기수 기간</div>
                    <strong>{formatDate(company.startDate ?? undefined)} ~ {formatDate(company.endDate ?? undefined)}</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>등록 학생 수</div>
                    <strong>{company.userCount ?? 0}명</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>활성 레슨</div>
                    <strong>{company.activeLessonCount ?? 0}개</strong>
                  </div>
                </div>

                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: '1px dashed #d0d5dd',
                  color: '#495057',
                  fontSize: '13px',
                  lineHeight: '1.6'
                }}>
                  앞으로 이 회사에 속한 기수, 배정된 과목/학생 현황을 Cohort 관리 페이지에서 확인할 수 있습니다.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

