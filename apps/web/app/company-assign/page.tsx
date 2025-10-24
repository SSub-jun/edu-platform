'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth';
import styles from './page.module.css';

export default function CompanyAssignPage() {
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
      setError('회사 코드를 입력해주세요.');
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(inviteCode)) {
      setError('회사 코드는 6자리 영문과 숫자 조합이어야 합니다.');
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
          setError('이미 회사에 배정된 사용자입니다.');
          // 이미 배정된 경우 커리큘럼으로 이동
          setTimeout(() => router.push('/curriculum'), 2000);
        } else {
          setError('중복된 요청입니다.');
        }
      } else if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data;
        switch (data?.code) {
          case 'INVALID_INVITE_CODE':
            setError('유효하지 않은 회사 코드입니다. 다시 확인해주세요.');
            break;
          case 'COMPANY_INACTIVE':
            setError('비활성화된 회사입니다. 관리자에게 문의해주세요.');
            break;
          default:
            setError(data?.message || '입력한 회사 코드를 확인해주세요.');
        }
      } else if (isAxiosError(error) && error.response?.status === 401) {
        setError('로그인이 필요합니다.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError('회사 배정에 실패했습니다. 다시 시도해주세요.');
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
      <div className={styles.container}>
        <div className={styles.assignCard}>
          <div className={styles.header}>
            <div className={styles.icon}>🎉</div>
            <h1 className={styles.title}>배정 완료!</h1>
            <p className={styles.subtitle}>회사에 성공적으로 배정되었습니다</p>
          </div>

          <div className={styles.content}>
            <div className={styles.successCard}>
              <div className={styles.successIcon}>✅</div>
              
              <h2 className={styles.successTitle}>
                환영합니다!
              </h2>
              
              <p className={styles.successMessage}>
                이제 학습을 시작할 수 있습니다.
              </p>

              <div className={styles.companyInfo}>
                <div className={styles.companyName}>
                  {assignedCompany.name}
                </div>
                <div className={styles.companyId}>
                  ID: {assignedCompany.id}
                </div>
              </div>

              <div className={styles.redirectInfo}>
                <div className={styles.spinner}></div>
                <span>3초 후 자동으로 학습 페이지로 이동합니다...</span>
              </div>

              <button
                onClick={() => router.push('/curriculum')}
                className={styles.button}
              >
                바로 시작하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.assignCard}>
        <div className={styles.header}>
          <div className={styles.icon}>🏢</div>
          <h1 className={styles.title}>회사 배정</h1>
          <p className={styles.subtitle}>
            회사 코드를 입력하여<br />
            소속 회사를 등록해주세요
          </p>
          <div className={styles.notice}>
            💡 회사 코드는 관리자로부터 받으실 수 있습니다
          </div>
        </div>

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>회사 코드</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="COMPANY123"
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                disabled={loading}
                maxLength={6}
                autoFocus
              />
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--text-muted)', 
                margin: '4px 0 0',
                textAlign: 'center'
              }}>
                6자리 영문과 숫자 조합
              </p>
              
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="submit"
                disabled={loading || !inviteCode}
                className={styles.button}
              >
                {loading ? (
                  <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                    배정 중...
                  </div>
                ) : (
                  '회사 배정하기'
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '8px',
                }}
              >
                나중에 배정하기 (로그아웃)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
