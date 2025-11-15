'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { SignupData } from './page';

interface StepAccountProps {
  onComplete: (data: Partial<SignupData>) => void;
  onBack: () => void;
  initialData: Partial<SignupData>;
}

interface PasswordStrength {
  hasLowerCase: boolean;
  hasUpperCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasMinLength: boolean;
}

export default function StepAccount({ onComplete, onBack, initialData }: StepAccountProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    password: '',
    confirmPassword: '',
    inviteCode: initialData.inviteCode || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasLowerCase: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  useEffect(() => {
    checkPasswordStrength(formData.password);
  }, [formData.password]);

  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasLowerCase: /[a-z]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  const isPasswordValid = (password: string): boolean => {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return pattern.test(password);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 클라이언트 측 검증
    if (!isPasswordValid(formData.password)) {
      setError('비밀번호는 최소 8자이며, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함해야 합니다.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.inviteCode && !/^[A-Z0-9]{6,12}$/.test(formData.inviteCode)) {
      setError('초대코드는 6-12자리 영대문자와 숫자 조합이어야 합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const registerData = {
        phone: initialData.phone,
        otpToken: initialData.otpToken,
        password: formData.password,
        name: formData.name.trim(),
        inviteCode: formData.inviteCode || undefined,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await axios.post(`${apiUrl}/auth/register`, registerData);
      
      const { accessToken, refreshToken, user } = response.data;
      
      // 토큰 저장 (기존 로그인 시스템과 동일하게)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // 쿠키에도 저장 (미들웨어용)
      document.cookie = `accessToken=${accessToken}; path=/; secure; samesite=strict`;
      document.cookie = `refreshToken=${refreshToken}; path=/; secure; samesite=strict`;

      // 다음 단계로 진행
      onComplete({
        name: formData.name.trim(),
        password: formData.password,
        inviteCode: formData.inviteCode,
      });

    } catch (error) {
      console.error('회원가입 실패:', error);
      
      const isAxiosError = (err: unknown): err is { response?: { status?: number; data?: { code?: string; message?: string } } } => {
        return typeof err === 'object' && err !== null && 'response' in err;
      };
      
      if (isAxiosError(error) && error.response?.status === 409) {
        const data = error.response.data;
        if (data?.code === 'PHONE_ALREADY_REGISTERED') {
          setError('이미 가입된 전화번호입니다.');
        } else {
          setError('중복된 정보가 있습니다. 확인해주세요.');
        }
      } else if (isAxiosError(error) && error.response?.status === 422) {
        const data = error.response.data;
        switch (data?.code) {
          case 'WEAK_PASSWORD':
            setError('비밀번호는 최소 8자이며, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함해야 합니다.');
            break;
          case 'INVALID_OTP':
            setError('인증 토큰이 유효하지 않습니다. 다시 인증해주세요.');
            break;
          case 'INVALID_INVITE_CODE':
            setError('유효하지 않은 초대코드입니다.');
            break;
          default:
            setError(data?.message || '입력 정보를 확인해주세요.');
        }
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-primary uppercase tracking-wide">이름 *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full h-12 px-4 bg-bg-primary border-2 border-border rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface"
          disabled={loading}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-primary uppercase tracking-wide">비밀번호 *</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder="비밀번호를 입력하세요"
          className={`w-full h-12 px-4 bg-bg-primary border-2 rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface ${
            error && !isPasswordValid(formData.password) ? 'border-error ring-2 ring-error/20' : 'border-border'
          }`}
          disabled={loading}
          required
        />
        
        {formData.password && (
          <div className="mt-2 p-3 bg-surface rounded-lg border border-border">
            <div className="text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wide">비밀번호 조건</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all ${
                  passwordStrength.hasMinLength ? 'bg-success text-white' : 'bg-surface border border-border text-text-tertiary'
                }`}>
                  {passwordStrength.hasMinLength ? '✓' : '○'}
                </div>
                <span className={passwordStrength.hasMinLength ? 'text-success' : 'text-text-tertiary'}>
                  최소 8자 이상
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all ${
                  passwordStrength.hasLowerCase ? 'bg-success text-white' : 'bg-surface border border-border text-text-tertiary'
                }`}>
                  {passwordStrength.hasLowerCase ? '✓' : '○'}
                </div>
                <span className={passwordStrength.hasLowerCase ? 'text-success' : 'text-text-tertiary'}>
                  소문자 포함
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all ${
                  passwordStrength.hasUpperCase ? 'bg-success text-white' : 'bg-surface border border-border text-text-tertiary'
                }`}>
                  {passwordStrength.hasUpperCase ? '✓' : '○'}
                </div>
                <span className={passwordStrength.hasUpperCase ? 'text-success' : 'text-text-tertiary'}>
                  대문자 포함
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all ${
                  passwordStrength.hasNumber ? 'bg-success text-white' : 'bg-surface border border-border text-text-tertiary'
                }`}>
                  {passwordStrength.hasNumber ? '✓' : '○'}
                </div>
                <span className={passwordStrength.hasNumber ? 'text-success' : 'text-text-tertiary'}>
                  숫자 포함
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all ${
                  passwordStrength.hasSpecialChar ? 'bg-success text-white' : 'bg-surface border border-border text-text-tertiary'
                }`}>
                  {passwordStrength.hasSpecialChar ? '✓' : '○'}
                </div>
                <span className={passwordStrength.hasSpecialChar ? 'text-success' : 'text-text-tertiary'}>
                  특수문자 포함
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-primary uppercase tracking-wide">비밀번호 확인 *</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          className={`w-full h-12 px-4 bg-bg-primary border-2 rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface ${
            error && formData.password !== formData.confirmPassword ? 'border-error ring-2 ring-error/20' : 'border-border'
          }`}
          disabled={loading}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-primary uppercase tracking-wide">초대코드 (선택)</label>
        <input
          type="text"
          value={formData.inviteCode}
          onChange={(e) => handleInputChange('inviteCode', e.target.value.toUpperCase())}
          placeholder="회사 초대코드를 입력하세요"
          className="w-full h-12 px-4 bg-bg-primary border-2 border-border rounded-lg text-base text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface"
          disabled={loading}
          maxLength={12}
        />
        <p className="text-xs text-text-tertiary mt-1">
          초대코드가 있으면 해당 회사로 자동 배정됩니다
        </p>
      </div>

      {error && (
        <div className="p-3 md:p-4 bg-error-bg border border-error rounded-lg text-error text-sm font-semibold animate-[slideDown_0.3s_ease-out]">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-full h-12 bg-bg-primary text-text-secondary border-2 border-border rounded-lg text-base font-semibold transition-all hover:bg-surface hover:text-text-primary hover:border-border-light disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          이전
        </button>
        
        <button
          type="submit"
          disabled={
            loading ||
            !formData.name.trim() ||
            !formData.password ||
            !formData.confirmPassword ||
            !isPasswordValid(formData.password)
          }
          className="w-full h-12 bg-primary text-text-primary rounded-lg text-base font-semibold transition-all hover:bg-primary-600 active:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              회원가입 중...
            </span>
          ) : (
            '회원가입 완료'
          )}
        </button>
      </div>
    </form>
  );
}
