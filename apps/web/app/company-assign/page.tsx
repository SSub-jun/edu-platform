'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth';
import { useLocale } from '../../src/i18n/client';
import { translateStudentText } from '../../src/i18n/studentTranslations';

export default function CompanyAssignPage() {
  const { locale } = useLocale();
  const t = (source: string) => translateStudentText(source, locale);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [assignedCompany, setAssignedCompany] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  // 이미 회사에 배정된 사용자라면 커리큘럼으로 리다이렉트
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await authClient.getApi().get('/me/profile');
        if (response.data.success && response.data.data.isCompanyAssigned) {
          router.push('/curriculum');
        }
      } catch (error) {
        console.error('사용자 상태 확인 실패:', error);
      }
    };

    checkUserStatus();
  }, [router]);

  const handleInputChange = (value: string) => {
    // 영어만 또는 영어+숫자 조합, 자동 대문자 변환, 6자리 제한
    const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setInviteCode(formattedValue);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode) {
      setError(t('회사 코드를 입력해주세요.'));
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(inviteCode)) {
      setError(t('회사 코드는 6자리 영문과 숫자 조합이어야 합니다.'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authClient.getApi().post('/auth/assign-company', {
        inviteCode,
      });

      if (response.data.success) {
        setAssignedCompany(response.data.company);
        setSuccess(true);
        
        try {
          await authClient.refresh();
        } catch (refreshError) {
          console.error('토큰 갱신 실패 (회사 배정 후):', refreshError);
        }
        
        // 3초 후 자동으로 커리큘럼 페이지로 이동
        setTimeout(() => {
          router.push('/curriculum');
        }, 3000);
      }

    } catch (error) {
      console.error('회사 배정 실패:', error);
      
      const isAxiosError = (err: unknown): err is { response?: { status?: number; data?: { code?: string; message?: string } } } => {
        return typeof err === 'object' && err !== null && 'response' in err;
      };
      
      if (isAxiosError(error) && error.response?.status === 409) {
        const data = error.response.data;
        if (data?.code === 'ALREADY_ASSIGNED') {
          setError(t('이미 회사에 배정된 사용자입니다.'));
          // 이미 배정된 경우 커리큘럼으로 이동
          setTimeout(() => router.push('/curriculum'), 2000);
        } else {
          setError(t('중복된 요청입니다.'));
        }
      } else if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data;
        switch (data?.code) {
          case 'INVALID_INVITE_CODE':
            setError(t('유효하지 않은 회사 코드입니다. 다시 확인해주세요.'));
            break;
          case 'COMPANY_INACTIVE':
            setError(t('비활성화된 회사입니다. 관리자에게 문의해주세요.'));
            break;
          default:
            setError(data?.message ? t(data.message) : t('입력한 회사 코드를 확인해주세요.'));
        }
      } else if (isAxiosError(error) && error.response?.status === 401) {
        setError(t('로그인이 필요합니다.'));
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(t('회사 배정에 실패했습니다. 다시 시도해주세요.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      // 로그아웃 API 호출
      await authClient.getApi().post('/auth/logout');
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      // 클라이언트 측 토큰 정리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // ap-auth 쿠키 삭제 (현재 시스템에서 사용하는 쿠키)
      document.cookie = 'ap-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      
      // 기존 쿠키들도 삭제 (호환성을 위해)
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      
      // 로그인 페이지로 리다이렉트
      router.push('/login');
    }
  };

  if (success && assignedCompany) {
    return (
      <div className="student-page flex items-center justify-center">
        <div className="student-panel-strong w-full max-w-md overflow-hidden">
          <div className="border-b border-border bg-bg-elevated px-8 py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-2xl font-black text-success">OK</div>
            <h1 className="text-[32px] font-bold text-text-primary mb-3">{t('배정 완료!')}</h1>
            <p className="text-base text-text-secondary font-medium">{t('회사에 성공적으로 배정되었습니다')}</p>
          </div>

          <div className="p-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary mb-2 bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
                {t('환영합니다!')}
              </h2>
              
              <p className="text-base text-text-secondary mb-6">
                {t('이제 학습을 시작할 수 있습니다.')}
              </p>

              <div className="student-muted-box mb-6 text-center">
                <div className="text-xl font-bold text-text-primary mb-1">
                  {assignedCompany.name}
                </div>
                <div className="text-sm text-text-tertiary">
                  ID: {assignedCompany.id}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary mb-6">
                <div className="w-4 h-4 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin"></div>
                <span>{t('3초 후 자동으로 학습 페이지로 이동합니다...')}</span>
              </div>

              <button
                onClick={() => router.push('/curriculum')}
                className="student-button-primary w-full"
              >
                {t('바로 시작하기')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page flex items-center justify-center">
      <div className="student-panel-strong w-full max-w-md overflow-hidden">
        <div className="border-b border-border bg-bg-elevated px-8 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-info-bg text-2xl font-black text-info">ID</div>
          <h1 className="text-[32px] font-bold text-text-primary mb-3">{t('회사 배정')}</h1>
          <p className="text-base text-text-secondary font-medium mb-4">
            {t('회사 코드를 입력하여')}<br />
            {t('소속 회사를 등록해주세요')}
          </p>
          <div className="bg-info-bg border border-info rounded-lg px-4 py-3 text-info text-sm font-bold">
            {t('회사 코드는 관리자로부터 받으실 수 있습니다')}
          </div>
        </div>

        <div className="p-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary uppercase tracking-wide text-center">{t('회사 코드')}</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="COMPANY123"
                className={`student-input text-center text-xl tracking-widest ${
                  error ? 'border-error ring-2 ring-error/20' : 'border-border'
                }`}
                disabled={loading}
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-text-tertiary text-center mt-1">
                {t('6자리 영문과 숫자 조합')}
              </p>
              
              {error && (
                <div className="mt-2 p-3 md:p-4 bg-error-bg border border-error rounded-lg text-error text-sm font-semibold animate-[slideDown_0.3s_ease-out]">
                  {error}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || !inviteCode}
                className="student-button-primary w-full"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('배정 중...')}
                  </span>
                ) : (
                  t('회사 배정하기')
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="bg-transparent border-0 text-text-tertiary text-sm cursor-pointer underline py-2 transition-colors hover:text-text-secondary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {t('나중에 배정하기 (로그아웃)')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
