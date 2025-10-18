'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '../../lib/auth';
import styles from './page.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState(''); // ID 또는 휴대폰 번호
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    // 로그인 페이지는 항상 접근 가능: 자동 리디렉션 제거
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('ID/휴대폰 번호와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authClient.login(username, password);
      
      console.log(`[LOGIN_PAGE] Login result:`, result);
      
      if (result.success && result.user) {
        // role에 따라 다른 페이지로 리다이렉트
        const redirect = searchParams.get('redirect') || '/curriculum';
        let targetUrl: string;
        
        switch (result.user.role) {
          case 'admin':
            targetUrl = '/admin';
            break;
          case 'instructor':
            targetUrl = '/instructor';
            break;
          case 'student':
            // 학생의 경우 회사 배정 상태 확인
            if (!result.user.companyId) {
              targetUrl = '/company-assign';
            } else {
              targetUrl = '/curriculum';
            }
            break;
          default:
            targetUrl = redirect;
        }
        
        console.log(`[LOGIN_PAGE] Redirecting to: ${targetUrl}`);
        console.log(`  USER_ROLE: ${result.user.role}`);
        console.log(`  USER_COMPANY_ID: ${result.user.companyId}`);
        console.log(`  REDIRECT_PARAM: ${redirect}`);
        
        // 토큰 저장 확실히 한 후 리다이렉트
        console.log(`[LOGIN_PAGE] Verifying token storage...`);
        console.log(`  ACCESS_TOKEN_IN_LOCALSTORAGE: ${!!localStorage.getItem('accessToken')}`);
        console.log(`  REFRESH_TOKEN_IN_LOCALSTORAGE: ${!!localStorage.getItem('refreshToken')}`);
        console.log(`  AP_AUTH_COOKIE: ${document.cookie.includes('ap-auth=')}`);
        console.log(`  ALL_COOKIES: ${document.cookie}`);
        
        // 짧은 지연 후 리다이렉트 (토큰 저장 완료 보장)
        setTimeout(() => {
          console.log(`[LOGIN_PAGE] Proceeding with redirect to: ${targetUrl}`);
          console.log(`[LOGIN_PAGE] Final cookie check: ${document.cookie}`);
          window.location.href = targetUrl;
        }, 100);
      } else {
        console.error(`[LOGIN_PAGE] Login failed:`, result.error);
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAccountClick = (testUsername: string, testPassword: string) => {
    setUsername(testUsername);
    setPassword(testPassword);
    setError('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>로그인</h1>
          <p className={styles.subtitle}>교육 플랫폼에 오신 것을 환영합니다</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              ID / 휴대폰 번호
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="학생: 01012345678 / 관리자·강사: admin001"
              className={styles.input}
              disabled={loading}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                로그인 중...
              </div>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        <div className={styles.signupSection}>
          <p className={styles.signupText}>계정이 없으신가요?</p>
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className={styles.signupButton}
            disabled={loading}
          >
            학생 회원가입
          </button>
        </div>

        <div className={styles.testAccounts}>
          <p className={styles.testAccountsTitle}>테스트 계정</p>
          <div className={styles.testAccountsList}>
            <div 
              className={styles.testAccount}
              onClick={() => handleTestAccountClick('admin', 'admin123')}
            >
              admin / admin123 (관리자)
            </div>
            <div 
              className={styles.testAccount}
              onClick={() => handleTestAccountClick('teacher', 'teach123')}
            >
              teacher / teach123 (강사)
            </div>
            <div 
              className={styles.testAccount}
              onClick={() => handleTestAccountClick('user', 'user123')}
            >
              user / user123 (학생)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
