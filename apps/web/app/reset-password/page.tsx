'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Step = 'phone' | 'otp' | 'password' | 'done';

export default function ResetPasswordPage() {
  const router = useRouter();

  // 단계 상태
  const [step, setStep] = useState<Step>('phone');

  // Step 1: 전화번호 입력
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);

  // Step 2: OTP 인증
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: 새 비밀번호
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetting, setResetting] = useState(false);

  // 재전송 카운트다운
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ─── Step 1: 전화번호 입력 → OTP 발송 ───
  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (!/^01[0-9]{8,9}$/.test(cleaned)) {
      setPhoneError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setPhoneSending(true);
    setPhoneError('');

    try {
      await fetch(`${API_URL}/auth/password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });

      // 보안상 항상 다음 단계로 이동 (유저 존재 여부 미노출)
      setPhone(cleaned);
      setStep('otp');
      setResendCooldown(30);
    } catch {
      setPhoneError('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setPhoneSending(false);
    }
  };

  // ─── Step 2: OTP 인증 ───
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setOtpError('6자리 인증번호를 모두 입력해주세요.');
      return;
    }

    setOtpVerifying(true);
    setOtpError('');

    try {
      const res = await fetch(`${API_URL}/auth/password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg =
          json.message || json.error?.message || '인증에 실패했습니다.';
        setOtpError(msg);
        return;
      }

      setResetToken(json.data.resetToken);
      setStep('password');
    } catch {
      setOtpError('인증 처리 중 오류가 발생했습니다.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      await fetch(`${API_URL}/auth/password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      otpInputRefs.current[0]?.focus();
    } catch {
      setOtpError('재전송에 실패했습니다.');
    }
  };

  // ─── Step 3: 비밀번호 재설정 ───
  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      setPasswordError(
        '대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setResetting(true);
    setPasswordError('');

    try {
      const res = await fetch(`${API_URL}/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg =
          json.message || json.error?.message || '비밀번호 변경에 실패했습니다.';
        setPasswordError(msg);
        return;
      }

      setStep('done');
    } catch {
      setPasswordError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-6">
      {/* 배경 이미지 */}
      <Image
        src="/images/LoginBackground.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover -z-10"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/20" />

      <div className="w-full max-w-md mx-auto bg-surface/85 border border-border rounded-xl p-8 md:p-10 shadow-2xl">
        {/* ─── Step 1: 전화번호 입력 ─── */}
        {step === 'phone' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-[24px] font-bold text-text-primary mb-2">
                비밀번호 찾기
              </h1>
              <p className="text-sm text-text-secondary">
                가입 시 등록한 휴대폰 번호를 입력해주세요.
              </p>
            </div>

            {phoneError && (
              <div className="mb-4 p-3 bg-error-bg border border-error rounded-lg text-error text-sm font-semibold">
                {phoneError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-primary">
                  휴대폰 번호
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="01012345678"
                  inputMode="numeric"
                  className="w-full h-12 px-4 bg-bg-primary border-2 border-border rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                  disabled={phoneSending}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                />
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={phoneSending}
                className="w-full h-12 bg-primary-600 text-white rounded-lg text-base font-semibold transition-all hover:bg-primary active:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {phoneSending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    전송 중...
                  </span>
                ) : (
                  '인증번호 받기'
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-sm text-text-secondary hover:text-primary-600 transition-colors"
              >
                로그인으로 돌아가기
              </button>
            </div>
          </>
        )}

        {/* ─── Step 2: OTP 인증 ─── */}
        {step === 'otp' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-[24px] font-bold text-text-primary mb-2">
                인증번호 입력
              </h1>
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">{phone}</span>
                으로 전송된 6자리 인증번호를 입력해주세요.
              </p>
            </div>

            {otpError && (
              <div className="mb-4 p-3 bg-error-bg border border-error rounded-lg text-error text-sm font-semibold">
                {otpError}
              </div>
            )}

            <div className="flex justify-center gap-2 mb-6">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpInputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 ${
                    otpError
                      ? 'border-error bg-error-bg'
                      : 'border-border bg-bg-primary'
                  }`}
                  disabled={otpVerifying}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otpVerifying || otpDigits.join('').length !== 6}
              className="w-full h-12 bg-primary-600 text-white rounded-lg text-base font-semibold transition-all hover:bg-primary active:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
            >
              {otpVerifying ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  확인 중...
                </span>
              ) : (
                '인증 확인'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-sm text-text-secondary hover:text-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `인증번호 재전송 (${resendCooldown}초)`
                  : '인증번호 재전송'}
              </button>
            </div>
          </>
        )}

        {/* ─── Step 3: 새 비밀번호 설정 ─── */}
        {step === 'password' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-[24px] font-bold text-text-primary mb-2">
                새 비밀번호 설정
              </h1>
              <p className="text-sm text-text-secondary">
                새로운 비밀번호를 입력해주세요.
              </p>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-error-bg border border-error rounded-lg text-error text-sm font-semibold">
                {passwordError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-primary">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="8자 이상, 대/소문자/숫자/특수문자 포함"
                  className="w-full h-12 px-4 bg-bg-primary border-2 border-border rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                  disabled={resetting}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-primary">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="비밀번호를 다시 입력해주세요"
                  className="w-full h-12 px-4 bg-bg-primary border-2 border-border rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                  disabled={resetting}
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
              </div>

              <div className="text-xs text-text-tertiary space-y-1">
                <p>비밀번호 규칙:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>최소 8자 이상</li>
                  <li>대문자, 소문자 각 1개 이상</li>
                  <li>숫자 1개 이상</li>
                  <li>특수문자 1개 이상</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetting}
                className="w-full h-12 bg-primary-600 text-white rounded-lg text-base font-semibold transition-all hover:bg-primary active:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resetting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    변경 중...
                  </span>
                ) : (
                  '비밀번호 변경'
                )}
              </button>
            </div>
          </>
        )}

        {/* ─── Step 4: 완료 ─── */}
        {step === 'done' && (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-[24px] font-bold text-text-primary mb-2">
                비밀번호 변경 완료
              </h1>
              <p className="text-sm text-text-secondary">
                새 비밀번호로 로그인해주세요.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full h-12 bg-primary-600 text-white rounded-lg text-base font-semibold transition-all hover:bg-primary active:bg-primary-700"
            >
              로그인하러 가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
