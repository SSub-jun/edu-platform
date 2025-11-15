'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { authClient } from '../../lib/auth';

interface Profile {
  id: string;
  username: string;
  phone: string | null;
  email: string | null;
  role: 'student' | 'instructor' | 'admin';
  isCompanyAssigned: boolean;
  company: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null;
  createdAt: string;
}

const roleLabel: Record<Profile['role'], string> = {
  student: '학생',
  instructor: '강사',
  admin: '관리자',
};

export default function StudentPage() {
  const { isAuthenticated, isLoading, logout } = useAuthGuard();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) return;
      setLoadingProfile(true);
      try {
        const response = await authClient.getApi().get('/me/profile');
        if (response.data?.success && response.data.data) {
          setProfile(response.data.data as Profile);
        }
      } catch (e) {
        console.error('[STUDENT_PAGE] Failed to load profile', e);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex items-center gap-2 text-text-secondary">
          <div className="w-5 h-5 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin" />
          <span>인증 중...</span>
        </div>
      </div>
    );
  }

  const company = profile?.company ?? null;

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-8 md:py-10">
      <div className="max-w-3xl mx-auto bg-surface border border-border rounded-xl px-6 py-8 md:px-10 md:py-10">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              내 정보
            </h1>
            <p className="text-sm md:text-base text-text-secondary">
              계정 정보와 소속, 교육기간을 확인할 수 있습니다.
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-error text-white text-sm font-semibold transition-colors hover:bg-error/90"
          >
            로그아웃
          </button>
        </div>

        {/* 본문 */}
        {loadingProfile && !profile ? (
          <div className="flex items-center gap-2 text-text-secondary">
            <div className="w-4 h-4 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin" />
            <span>내 정보를 불러오는 중입니다...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 기본 정보 */}
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                기본 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-primary border border-border rounded-xl p-5">
                <div>
                  <div className="text-xs text-text-tertiary mb-1">이름 / 아이디</div>
                  <div className="text-base font-medium text-text-primary">
                    {profile?.username ?? '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">역할</div>
                  <div className="text-base font-medium text-text-primary">
                    {profile ? roleLabel[profile.role] : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">휴대폰 번호</div>
                  <div className="text-base text-text-primary">
                    {profile?.phone ?? '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">이메일</div>
                  <div className="text-base text-text-primary">
                    {profile?.email ?? '-'}
                  </div>
                </div>
              </div>
            </section>

            {/* 소속 및 교육기간 */}
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                소속 및 교육기간
              </h2>
              <div className="bg-bg-primary border border-border rounded-xl p-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">소속 회사</div>
                    <div className="text-base font-medium text-text-primary">
                      {company?.name ?? (profile?.isCompanyAssigned ? '회사 정보 없음' : '미배정')}
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-text-secondary">
                    {company
                      ? company.isActive
                        ? '진행 중인 교육'
                        : '비활성 회사'
                      : '회사 배정 상태를 확인해주세요.'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">교육 시작일</div>
                    <div className="text-base text-text-primary">
                      {company ? formatDate(company.startDate) : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">교육 종료일</div>
                    <div className="text-base text-text-primary">
                      {company ? formatDate(company.endDate) : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 기타 */}
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                기타
              </h2>
              <div className="bg-bg-primary border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-text-secondary">
                  강의실에서 학습 진도와 시험 결과를 확인하실 수 있습니다.
                </div>
                <Link
                  href="/curriculum"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold transition-colors hover:bg-primary-600"
                >
                  강의실로 이동
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

