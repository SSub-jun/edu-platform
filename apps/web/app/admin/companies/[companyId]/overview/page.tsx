'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authClient } from '../../../../../lib/auth';

interface CohortSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'upcoming' | 'ongoing' | 'finished';
  durationDays: number;
  remainingDays: number | null;
  subjectCount: number;
  studentCount: number;
}

interface SubjectSummary {
  id: string;
  name: string;
  lessonCount: number;
  cohortCount: number;
}

interface StudentPreview {
  id: string;
  username: string;
  name?: string | null;
  phone?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
}

interface CompanyOverviewResponse {
  company: {
    id: string;
    name: string;
    inviteCode: string | null;
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    remainingDays: number | null;
    totalStudents: number;
    assignedToCohort: number;
    unassignedToCohort: number;
    activeStudents30d: number;
  };
  inviteCode: {
    value: string | null;
    lastUpdatedAt: string;
  };
  cohorts: {
    total: number;
    activeCount: number;
    upcomingCount: number;
    pastCount: number;
    items: CohortSummary[];
  };
  subjects: {
    total: number;
    lessons: number;
    items: SubjectSummary[];
  };
  progress: {
    avgPercent: number;
    entryCount: number;
    completedLessons: number;
  };
  exams: {
    attempts: number;
    passed: number;
    avgScore: number | null;
  };
  students: {
    unassigned: StudentPreview[];
    recentLogins: StudentPreview[];
  };
}

export default function CompanyOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [overview, setOverview] = useState<CompanyOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const loadOverview = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await authClient.getApi().get(`/admin/companies/${companyId}/overview`);
      setOverview(response.data);
    } catch (err) {
      console.error('[ADMIN][COMPANY_OVERVIEW] 데이터 로드 실패:', err);
      setError('회사 개요 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleCopyInviteCode = async () => {
    if (!overview?.inviteCode.value) {
      alert('초대코드가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(overview.inviteCode.value);
      alert('초대코드가 복사되었습니다.');
    } catch (err) {
      console.error('초대코드 복사 실패:', err);
      alert('초대코드를 복사할 수 없습니다.');
    }
  };

  const updateInviteCodeData = (nextCode: string) => {
    setOverview(prev =>
      prev
        ? {
            ...prev,
            company: {
              ...prev.company,
              inviteCode: nextCode,
            },
            inviteCode: {
              value: nextCode,
              lastUpdatedAt: new Date().toISOString(),
            },
          }
        : prev,
    );
  };

  const handleRegenerateInviteCode = async () => {
    if (!companyId) return;
    if (!confirm('새 초대코드를 발급하시겠습니까? 기존 코드는 즉시 만료됩니다.')) {
      return;
    }
    setInviteLoading(true);
    try {
      const response = await authClient.getApi().patch(`/admin/companies/${companyId}/invite-code`, {});
      if (response.data?.inviteCode) {
        updateInviteCodeData(response.data.inviteCode);
        alert('새 초대코드가 발급되었습니다.');
      }
    } catch (err) {
      console.error('초대코드 재발급 실패:', err);
      alert('초대코드 재발급에 실패했습니다.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleManualInviteCode = async () => {
    if (!companyId) return;
    const current = overview?.inviteCode.value ?? '';
    const next = prompt('새 초대코드를 입력하세요 (6자리 영대문자+숫자)', current);
    if (next === null) return;
    const trimmed = next.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(trimmed)) {
      alert('초대코드는 6자리 영대문자와 숫자 조합이어야 합니다.');
      return;
    }
    setInviteLoading(true);
    try {
      const response = await authClient
        .getApi()
        .patch(`/admin/companies/${companyId}/invite-code`, { inviteCode: trimmed });
      if (response.data?.inviteCode) {
        updateInviteCodeData(response.data.inviteCode);
        alert('초대코드가 변경되었습니다.');
      }
    } catch (err) {
      console.error('초대코드 변경 실패:', err);
      alert('초대코드 변경에 실패했습니다.');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666' }}>데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px' }}>
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            border: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>회사 개요를 불러올 수 없습니다</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={loadOverview}
            style={{
              padding: '10px 18px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: '등록 학생 수',
      value: `${overview.company.totalStudents.toLocaleString()}명`,
      detail: `기수 배정 ${overview.company.assignedToCohort}명`,
    },
    {
      label: '미배정 학생',
      value: `${overview.company.unassignedToCohort}명`,
      detail: '기수에 아직 배정되지 않은 학생',
    },
    {
      label: '최근 30일 활동',
      value: `${overview.company.activeStudents30d}명`,
      detail: '최근 30일 내 접속 학생 수',
    },
    {
      label: '남은 기간',
      value:
        overview.company.remainingDays != null
          ? `${overview.company.remainingDays}일`
          : '기간 정보 없음',
      detail: '진행 중 기수 또는 회사 기간 기준',
    },
  ];

  const invitesDisabled = inviteLoading;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '30px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              }}
            >
              ← 목록으로
            </button>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827' }}>{overview.company.name}</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>
                회사 ID: {overview.company.id} · 학생 {overview.company.totalStudents.toLocaleString()}명
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push(`/admin/cohorts/${overview.company.id}`)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              기수 관리
            </button>
            <button
              onClick={() => router.push(`/admin/companies/${overview.company.id}/subjects`)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              과목 배정
            </button>
            <button
              onClick={() => router.push('/admin/students')}
              style={{
                padding: '10px 16px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              학생 관리
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                border: '1px solid #edf2f7',
                borderRadius: '10px',
                padding: '16px',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{stat.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{stat.detail}</div>
            </div>
          ))}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '16px',
              backgroundColor: '#fff',
            }}
          >
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>초대코드</div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                letterSpacing: '0.3rem',
                color: overview.inviteCode.value ? '#111827' : '#9ca3af',
              }}
            >
              {overview.inviteCode.value || '미발급'}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
              마지막 업데이트: {new Date(overview.inviteCode.lastUpdatedAt).toLocaleString('ko-KR')}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopyInviteCode}
                disabled={!overview.inviteCode.value}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#111827',
                  cursor: overview.inviteCode.value ? 'pointer' : 'not-allowed',
                }}
              >
                복사
              </button>
              <button
                onClick={handleManualInviteCode}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#f97316',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                직접 입력
              </button>
              <button
                onClick={handleRegenerateInviteCode}
                disabled={invitesDisabled}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#111827',
                  color: 'white',
                  cursor: invitesDisabled ? 'not-allowed' : 'pointer',
                  opacity: invitesDisabled ? 0.6 : 1,
                }}
              >
                {invitesDisabled ? '발급 중...' : '재발급'}
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '24px',
            backgroundColor: '#fff',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px' }}>기수 현황</h3>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>
              총 {overview.cohorts.total}개 · 진행 중 {overview.cohorts.activeCount}개 · 예정{' '}
              {overview.cohorts.upcomingCount}개
            </div>
          </div>
          {overview.cohorts.items.length === 0 ? (
            <div style={{ padding: '20px', color: '#6b7280' }}>등록된 기수가 없습니다.</div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {overview.cohorts.items.map((cohort) => (
                <div
                  key={cohort.id}
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{cohort.name}</div>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor:
                          cohort.status === 'ongoing'
                            ? '#dcfce7'
                            : cohort.status === 'upcoming'
                            ? '#e0f2fe'
                            : '#f3f4f6',
                        color:
                          cohort.status === 'ongoing'
                            ? '#166534'
                            : cohort.status === 'upcoming'
                            ? '#0369a1'
                            : '#374151',
                      }}
                    >
                      {cohort.status === 'ongoing'
                        ? '진행 중'
                        : cohort.status === 'upcoming'
                        ? '예정'
                        : '종료'}
                    </span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                    {new Date(cohort.startDate).toLocaleDateString('ko-KR')} ~{' '}
                    {new Date(cohort.endDate).toLocaleDateString('ko-KR')} · 과목 {cohort.subjectCount}개 · 학생{' '}
                    {cohort.studentCount}명
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '24px',
            backgroundColor: '#fff',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>배정된 과목</h3>
            {overview.subjects.items.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '14px' }}>배정된 과목이 없습니다.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {overview.subjects.items.map((subject) => (
                  <div
                    key={subject.id}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{subject.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      레슨 {subject.lessonCount}개 · 기수 {subject.cohortCount}회 배정
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>학습 진행 & 시험</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ fontSize: '13px', color: '#6b7280' }}>평균 진도율</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>
                  {overview.progress.avgPercent.toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Progress 기록 {overview.progress.entryCount.toLocaleString()}건 · 완료 레슨{' '}
                  {overview.progress.completedLessons.toLocaleString()}개
                </div>
              </div>
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: '#fefce8',
                }}
              >
                <div style={{ fontSize: '13px', color: '#6b7280' }}>시험 현황</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>
                  {overview.exams.passed} / {overview.exams.attempts} 합격
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  평균 점수 {overview.exams.avgScore != null ? overview.exams.avgScore.toFixed(1) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '24px',
            backgroundColor: '#fff',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>기수 미배정 학생</h3>
            {overview.students.unassigned.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '14px' }}>모든 학생이 기수에 배정되어 있습니다.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {overview.students.unassigned.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{student.name || student.username}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      가입일 {student.createdAt ? new Date(student.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>최근 접속 학생</h3>
            {overview.students.recentLogins.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '14px' }}>최근 접속 기록이 없습니다.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {overview.students.recentLogins.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      backgroundColor: '#fdf2f8',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{student.name || student.username}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      마지막 접속:{' '}
                      {student.lastLoginAt
                        ? new Date(student.lastLoginAt).toLocaleString('ko-KR')
                        : '기록 없음'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

