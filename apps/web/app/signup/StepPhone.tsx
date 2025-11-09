'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { SignupData } from './page';

interface StepPhoneProps {
  onComplete: (data: Partial<SignupData>) => void;
  initialData: Partial<SignupData>;
}

export default function StepPhone({ onComplete, initialData }: StepPhoneProps) {
  const [phone, setPhone] = useState(initialData.phone || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const validatePhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^01[0-9]{8,9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요 (01012345678)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await axios.post(`${apiUrl}/auth/phone/send-otp`, {
        phone,
        purpose: 'signup'
      });

      setIsPhoneSubmitted(true);
      setResendCountdown(30);
      
      // 카운트다운 시작
      const interval = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('OTP 전송 실패:', error);
      
      const isAxiosError = (err: unknown): err is { response?: { status?: number; data?: { message?: string; remainingSeconds?: number } } } => {
        return typeof err === 'object' && err !== null && 'response' in err;
      };
      
      if (isAxiosError(error) && error.response?.status === 429) {
        const data = error.response.data;
        setError(data?.message || '잠시 후 다시 시도해주세요');
        if (data?.remainingSeconds) {
          setResendCountdown(data.remainingSeconds);
        }
      } else {
        setError('인증번호 전송에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // 숫자만 입력 허용
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // 자동으로 다음 입력 필드로 포커스 이동
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // 현재 필드가 비어있고 백스페이스를 누르면 이전 필드로 이동
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('6자리 인증번호를 모두 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await axios.post(`${apiUrl}/auth/phone/verify`, {
        phone,
        code: otpCode
      });

      const { otpToken } = response.data;
      
      // 다음 단계로 진행
      onComplete({
        phone,
        otpToken
      });

    } catch (error: any) {
      console.error('OTP 인증 실패:', error);
      
      if (error.response?.status === 422) {
        const data = error.response.data;
        if (data.code === 'EXPIRED_OTP') {
          setError('인증번호가 만료되었습니다. 새로운 인증번호를 요청해주세요.');
        } else {
          setError('잘못된 인증번호입니다. 다시 확인해주세요.');
        }
      } else {
        setError('인증에 실패했습니다. 다시 시도해주세요.');
      }
      
      // OTP 입력 필드 초기화
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    
    setLoading(true);
    setError('');
    setOtp(['', '', '', '', '', '']);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await axios.post(`${apiUrl}/auth/phone/send-otp`, {
        phone,
        purpose: 'signup'
      });

      setResendCountdown(30);
      
      // 카운트다운 시작
      const interval = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      console.error('OTP 재전송 실패:', error);
      
      if (error.response?.status === 429) {
        const data = error.response.data;
        setError(data.message || '잠시 후 다시 시도해주세요');
      } else {
        setError('인증번호 재전송에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isPhoneSubmitted) {
    return (
      <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-primary uppercase tracking-wide">휴대폰 번호</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="01012345678"
            className={`w-full h-12 px-4 bg-bg-primary border-2 rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface ${
              error ? 'border-error ring-2 ring-error/20' : 'border-border'
            }`}
            disabled={loading}
            maxLength={11}
          />
          {error && (
            <div className="mt-2 p-3 md:p-4 bg-error-bg border border-error rounded-lg text-error text-sm font-semibold animate-[slideDown_0.3s_ease-out]">
              {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !phone}
          className="w-full h-12 bg-primary text-text-primary rounded-lg text-base font-semibold transition-all hover:bg-primary-600 active:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              인증번호 전송 중...
            </span>
          ) : (
            '인증번호 받기'
          )}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleOtpSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-primary uppercase tracking-wide">인증번호 입력</label>
        <p className="text-sm text-text-secondary my-2">
          {phone}으로 전송된 6자리 인증번호를 입력해주세요
        </p>
        
        <div className="flex gap-3 justify-center">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { otpRefs.current[index] = el; }}
              type="text"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg bg-bg-primary text-text-primary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:opacity-60 ${
                error ? 'border-error ring-2 ring-error/20' : 'border-border'
              }`}
              disabled={loading}
              maxLength={1}
              inputMode="numeric"
            />
          ))}
        </div>

        {error && (
          <div className="mt-2 p-3 md:p-4 bg-error-bg border border-error rounded-lg text-error text-sm font-semibold animate-[slideDown_0.3s_ease-out]">
            {error}
          </div>
        )}

        <div className="text-center mt-4 text-sm text-text-tertiary">
          {resendCountdown > 0 ? (
            <span>인증번호 재전송 가능시간: {resendCountdown}초</span>
          ) : (
            <span>
              인증번호를 받지 못하셨나요?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="bg-transparent border-0 text-primary font-semibold cursor-pointer underline transition-colors hover:text-primary-600 disabled:text-text-tertiary disabled:cursor-not-allowed disabled:no-underline"
              >
                재전송
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsPhoneSubmitted(false)}
          className="w-full h-12 bg-bg-primary text-text-secondary border-2 border-border rounded-lg text-base font-semibold transition-all hover:bg-surface hover:text-text-primary hover:border-border-light disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          번호 변경
        </button>
        
        <button
          type="submit"
          disabled={loading || otp.some(digit => !digit)}
          className="w-full h-12 bg-primary text-text-primary rounded-lg text-base font-semibold transition-all hover:bg-primary-600 active:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              인증 중...
            </span>
          ) : (
            '인증 확인'
          )}
        </button>
      </div>
    </form>
  );
}







