'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth';
import Image from 'next/image';
import { CheckCircle2, Globe2, ShieldCheck } from 'lucide-react';
import { localeLabels, supportedLocales, type Locale } from '../../src/i18n/config';
import { useLocale, useT } from '../../src/i18n/client';

export default function LoginPage() {
  const [username, setUsername] = useState(''); // ID 또는 휴대폰 번호
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const t = useT(locale);

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    // 로그인 페이지는 항상 접근 가능: 자동 리디렉션 제거
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('login.error.required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authClient.login(username, password);
      
      console.log(`[LOGIN_PAGE] Login result:`, result);
      
      if (result.success && result.user) {
        // role에 따라 다른 페이지로 리다이렉트
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/curriculum';
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
        // 더 명확한 에러 메시지 표시
        const errorMessage = result.error || t('login.error.generic');
        if (errorMessage.includes('Invalid') || errorMessage.includes('credentials') || errorMessage.includes('Unauthorized')) {
          setError(t('login.error.invalid'));
        } else {
          setError(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('[LOGIN_PAGE] Login error:', error);
      // 네트워크 오류와 인증 오류 구분
      if (error.response?.status === 401) {
        setError(t('login.error.invalid'));
      } else if (error.message?.includes('Network')) {
        setError(t('login.error.network'));
      } else {
        setError(t('login.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden p-4 md:p-6">
      {/* 배경 이미지 (전체 화면) */}
      <Image
        src="/images/LoginBackground.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover -z-10"
      />

      {/* 화이트 오버레이: 이미지 위에 흰색 톤을 덧씌워서 가독성 확보 */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-primary/72" />

      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center md:min-h-[calc(100vh-3rem)]">
        <div className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-[1fr_440px] md:gap-10">
          <section className="text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-bold backdrop-blur">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <span>{t('nav.brand')}</span>
            </div>
            <h1 className="text-3xl font-black leading-tight drop-shadow md:text-5xl">
            {t('login.hero.title').split('\n').map((line, index) => (
              <span key={line}>
                {line}
                {index === 0 && <br />}
              </span>
            ))}
          </h1>
            <p className="mt-4 max-w-xl text-lg font-semibold leading-relaxed text-white/90 drop-shadow md:text-2xl">
            {t('login.hero.subtitle')}
          </p>
            <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[t('login.trust.compliance'), t('login.trust.progress'), t('login.trust.mobile')].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/12 px-4 py-3 text-sm font-bold backdrop-blur">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-white" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="student-panel-strong w-full bg-surface p-6 md:p-8">
            <div className="mb-6">
              <p className="student-kicker">{t('login.submit')}</p>
              <h2 className="student-title mt-1">{t('login.submit')}</h2>
              <p className="student-copy mt-2">{t('login.signup.prompt')}</p>
            </div>

          {/* Error Message */}
        {error && (
            <div className="mb-6 p-4 bg-error-bg border border-error rounded-lg text-error text-sm font-semibold animate-[slideDown_0.3s_ease-out]">
            {error}
          </div>
        )}

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="sr-only">
                {t('login.language.label')}
              </label>
              <div className="relative">
                <Globe2
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
                />
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                  aria-label="Language"
                  className="student-input pl-12"
                  disabled={loading}
                >
                  {supportedLocales.map((option) => (
                    <option key={option} value={option}>
                      {localeLabels[option]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary">
                {t('login.phone.label')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
                className="student-input"
              disabled={loading}
            />
          </div>
          
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary">
              {t('login.password.label')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.password.placeholder')}
                className="student-input"
              disabled={loading}
            />
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => router.push('/reset-password')}
                className="text-sm font-bold text-info transition-colors hover:text-primary"
              >
                {t('login.forgotPassword')}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
              className="student-button-primary w-full"
          >
            {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {t('login.submitting')}
                </span>
            ) : (
              t('login.submit')
            )}
          </button>
        </form>

          {/* Signup Section */}
          <div className="mt-6 rounded-lg border border-border bg-bg-elevated p-5 text-center">
            <p className="text-sm text-text-secondary font-medium mb-3">{t('login.signup.prompt')}</p>
          <button
            type="button"
            onClick={() => router.push('/signup')}
              className="student-button-success w-full text-sm"
            disabled={loading}
          >
            {t('login.signup.button')}
          </button>
        </div>

          </section>
      </div>
    </div>
    </div>
  );
}
