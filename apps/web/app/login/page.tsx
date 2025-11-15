'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth';
import BrandTrustMini from '../../src/components/BrandTrustMini';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState(''); // ID 또는 휴대폰 번호
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    // 로그인 페이지는 항상 접근 가능: 자동 리디렉션 제거
  }, [router]);

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
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-6">
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
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/20" />

      {/* Desktop: 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl items-center">
        {/* Left: 타이틀 섹션 (Desktop only) */}
        <div className="hidden md:flex md:flex-col md:justify-center md:gap-4 md:px-8">
          <h1 className="text-[35px] md:text-[43px] leading-tight font-bold text-white drop-shadow-lg">
            함께하는 안전,<br />든든한 동반자가 되겠습니다.
          </h1>
          <p className="text-[20px] md:text-[24px] leading-relaxed font-semibold text-white/90 drop-shadow-md">
            고객이 신뢰하는 한국산업보건안전기술원입니다.
          </p>
        </div>

        {/* Right: Login Form */}
        <div className="w-full max-w-md mx-auto md:mx-0 bg-surface/85 border border-border rounded-xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          {/* <div className="text-center mb-10">
            <h1 className="text-[28px] md:text-[32px] leading-9 font-bold text-text-primary mb-3">로그인</h1>
            <p className="text-base text-text-secondary font-medium">교육 플랫폼에 오신 것을 환영합니다</p>
          </div> */}

          {/* Error Message */}
        {error && (
            <div className="mb-6 p-4 bg-error-bg border border-error rounded-lg text-error text-sm font-semibold animate-[slideDown_0.3s_ease-out]">
            {error}
          </div>
        )}

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary">
                휴대폰 번호
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="학생: 01012345678 / 관리자·강사: admin001"
                className="w-full h-12 px-4 bg-bg-primary border-2 border-border rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface"
              disabled={loading}
            />
          </div>
          
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
                className="w-full h-12 px-4 bg-bg-primary border-2 border-border rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
              className="w-full h-12 bg-primary-600 text-white rounded-lg text-base font-semibold transition-all hover:bg-primary active:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2"
          >
            {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                로그인 중...
                </span>
            ) : (
              '로그인'
            )}
          </button>
        </form>

          {/* Signup Section */}
          <div className="mt-6 p-5 text-center bg-bg-primary rounded-lg border border-border">
            <p className="text-sm text-text-secondary font-medium mb-3">계정이 없으신가요?</p>
          <button
            type="button"
            onClick={() => router.push('/signup')}
              className="w-full h-10 bg-success text-white rounded-md text-sm font-semibold transition-all hover:bg-success/90 active:bg-success/80 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            학생 회원가입
          </button>
        </div>

        </div>
      </div>

      {/* Mobile: BrandTrustMini at bottom */}
      {/* <div className="mt-6 md:hidden w-full max-w-md mx-auto px-4">
        <BrandTrustMini />
      </div> */}
    </div>
  );
}
