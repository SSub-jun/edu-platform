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

interface Cohort {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  subjectCount?: number;
  studentCount?: number;
  cycle?: number;
}

export default function CohortDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date?: string | null) => {
    if (!date) return '미정';
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);

    try {
      const companiesResponse = await authClient.getApi().get('/admin/companies');
      const companies = Array.isArray(companiesResponse.data) ? companiesResponse.data : [];
      const currentCompany = companies.find((c: Company) => c.id === companyId) || null;
      setCompany(currentCompany);

      // Cohort API는 아직 준비되지 않아 graceful fallback 처리
      try {
        const cohortResponse = await authClient.getApi().get(`/admin/cohorts/company/${companyId}`);
        if (cohortResponse.data?.success && Array.isArray(cohortResponse.data.data)) {
          setCohorts(cohortResponse.data.data);
        } else {
          setCohorts([]);
        }
      } catch (cohortError) {
        console.info('[ADMIN/COHORTS] Cohort API 준비 중:', cohortError);
        setCohorts([]);
      }
    } catch (err: any) {
      console.error('[ADMIN/COHORTS] 데이터 로드 실패', err);
      setError('회사를 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

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
              초대코드 <strong>{company.inviteCode}</strong> · 운영 기간 {formatDate(company.startDate)} ~ {formatDate(company.endDate)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              style={{
                padding: '10px 16px',
                backgroundColor: '#e9ecef',
                color: '#495057',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                cursor: 'not-allowed'
              }}
              disabled
            >
              + Cohort 생성 (곧 제공)
            </button>
          </div>
        </div>

        {/* Cohort 목록 혹은 안내 */}
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
              lineHeight: 1.6
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Cohort 관리 화면 준비 중</h3>
              <p style={{ margin: 0 }}>
                곧 이 영역에서 기수 생성, 기간 조정, 과목/학생 배정을 할 수 있습니다. <br />
                그때까지는 회사별 운영 일정을 기존 방식으로 관리해 주세요.
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
                  backgroundColor: '#fafafa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>
                      {cohort.name}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                      {formatDate(cohort.startDate)} ~ {formatDate(cohort.endDate)}
                    </p>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: cohort.isActive ? '#e6f4ff' : '#f2f4f7',
                    color: cohort.isActive ? '#0b6bcb' : '#6c757d'
                  }}>
                    {cohort.isActive ? '진행 중' : '비활성'}
                  </div>
                </div>
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  gap: '16px',
                  fontSize: '13px',
                  color: '#555'
                }}>
                  <div>과목 {cohort.subjectCount ?? 0}개</div>
                  <div>학생 {cohort.studentCount ?? 0}명</div>
                  <div>사이클 #{cohort.cycle ?? 1}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 운영 가이드 */}
        <div style={{
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #ffeac2',
          backgroundColor: '#fff8e6',
          color: '#8a6d3b',
          lineHeight: 1.6
        }}>
          <h3 style={{ marginTop: 0 }}>Cohort 기반 운영 계획</h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>기수별 과목 배정: CohortSubject API와 연동</li>
            <li>기수별 학생 배정: UserCohort API를 통해 관리</li>
            <li>진도/시험 정보: SubjectProgress가 Cohort 정보를 참조하도록 확장</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

