'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { SignupData } from './page';
import styles from './page.module.css';

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
      await axios.post('http://localhost:4000/auth/phone/send-otp', {
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
      const response = await axios.post('http://localhost:4000/auth/phone/verify', {
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
      await axios.post('http://localhost:4000/auth/phone/send-otp', {
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
      <form onSubmit={handlePhoneSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>휴대폰 번호</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="01012345678"
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            disabled={loading}
            maxLength={11}
          />
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !phone}
          className={styles.button}
        >
          {loading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              인증번호 전송 중...
            </div>
          ) : (
            '인증번호 받기'
          )}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleOtpSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>인증번호 입력</label>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '8px 0 16px' }}>
          {phone}으로 전송된 6자리 인증번호를 입력해주세요
        </p>
        
        <div className={styles.otpContainer}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { otpRefs.current[index] = el; }}
              type="text"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className={`${styles.otpInput} ${error ? styles.otpInputError : ''}`}
              disabled={loading}
              maxLength={1}
              inputMode="numeric"
            />
          ))}
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <div className={styles.resendInfo}>
          {resendCountdown > 0 ? (
            <span>인증번호 재전송 가능시간: {resendCountdown}초</span>
          ) : (
            <span>
              인증번호를 받지 못하셨나요?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className={styles.resendButton}
              >
                재전송
              </button>
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setIsPhoneSubmitted(false)}
          className={`${styles.button} ${styles.buttonSecondary}`}
          disabled={loading}
        >
          번호 변경
        </button>
        
        <button
          type="submit"
          disabled={loading || otp.some(digit => !digit)}
          className={styles.button}
        >
          {loading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              인증 중...
            </div>
          ) : (
            '인증 확인'
          )}
        </button>
      </div>
    </form>
  );
}







