'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { SignupData } from './page';
import styles from './page.module.css';

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
    email: initialData.email || '',
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

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('올바른 이메일 주소를 입력해주세요.');
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
        email: formData.email || undefined,
        inviteCode: formData.inviteCode || undefined,
      };

      const response = await axios.post('http://localhost:4000/auth/register', registerData);
      
      const { accessToken, refreshToken, user } = response.data;
      
      // 토큰 저장 (기존 로그인 시스템과 동일하게)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // 쿠키에도 저장 (미들웨어용)
      document.cookie = `accessToken=${accessToken}; path=/; secure; samesite=strict`;
      document.cookie = `refreshToken=${refreshToken}; path=/; secure; samesite=strict`;

      // 다음 단계로 진행
      onComplete({
        email: formData.email,
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
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>이메일 (선택)</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="example@email.com"
          className={styles.input}
          disabled={loading}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>비밀번호 *</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder="비밀번호를 입력하세요"
          className={`${styles.input} ${error && !isPasswordValid(formData.password) ? styles.inputError : ''}`}
          disabled={loading}
          required
        />
        
        {formData.password && (
          <div className={styles.passwordStrength}>
            <div className={styles.strengthTitle}>비밀번호 조건</div>
            <div className={styles.strengthItems}>
              <div className={styles.strengthItem}>
                <div className={`${styles.strengthCheck} ${passwordStrength.hasMinLength ? styles.strengthCheckValid : styles.strengthCheckInvalid}`}>
                  {passwordStrength.hasMinLength ? '✓' : '○'}
                </div>
                <span style={{ color: passwordStrength.hasMinLength ? 'var(--success)' : 'var(--text-muted)' }}>
                  최소 8자 이상
                </span>
              </div>
              <div className={styles.strengthItem}>
                <div className={`${styles.strengthCheck} ${passwordStrength.hasLowerCase ? styles.strengthCheckValid : styles.strengthCheckInvalid}`}>
                  {passwordStrength.hasLowerCase ? '✓' : '○'}
                </div>
                <span style={{ color: passwordStrength.hasLowerCase ? 'var(--success)' : 'var(--text-muted)' }}>
                  소문자 포함
                </span>
              </div>
              <div className={styles.strengthItem}>
                <div className={`${styles.strengthCheck} ${passwordStrength.hasUpperCase ? styles.strengthCheckValid : styles.strengthCheckInvalid}`}>
                  {passwordStrength.hasUpperCase ? '✓' : '○'}
                </div>
                <span style={{ color: passwordStrength.hasUpperCase ? 'var(--success)' : 'var(--text-muted)' }}>
                  대문자 포함
                </span>
              </div>
              <div className={styles.strengthItem}>
                <div className={`${styles.strengthCheck} ${passwordStrength.hasNumber ? styles.strengthCheckValid : styles.strengthCheckInvalid}`}>
                  {passwordStrength.hasNumber ? '✓' : '○'}
                </div>
                <span style={{ color: passwordStrength.hasNumber ? 'var(--success)' : 'var(--text-muted)' }}>
                  숫자 포함
                </span>
              </div>
              <div className={styles.strengthItem}>
                <div className={`${styles.strengthCheck} ${passwordStrength.hasSpecialChar ? styles.strengthCheckValid : styles.strengthCheckInvalid}`}>
                  {passwordStrength.hasSpecialChar ? '✓' : '○'}
                </div>
                <span style={{ color: passwordStrength.hasSpecialChar ? 'var(--success)' : 'var(--text-muted)' }}>
                  특수문자 포함
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>비밀번호 확인 *</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          className={`${styles.input} ${error && formData.password !== formData.confirmPassword ? styles.inputError : ''}`}
          disabled={loading}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>초대코드 (선택)</label>
        <input
          type="text"
          value={formData.inviteCode}
          onChange={(e) => handleInputChange('inviteCode', e.target.value.toUpperCase())}
          placeholder="회사 초대코드를 입력하세요"
          className={styles.input}
          disabled={loading}
          maxLength={12}
        />
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          초대코드가 있으면 해당 회사로 자동 배정됩니다
        </p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={onBack}
          className={`${styles.button} ${styles.buttonSecondary}`}
          disabled={loading}
        >
          이전
        </button>
        
        <button
          type="submit"
          disabled={loading || !formData.password || !formData.confirmPassword || !isPasswordValid(formData.password)}
          className={styles.button}
        >
          {loading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              회원가입 중...
            </div>
          ) : (
            '회원가입 완료'
          )}
        </button>
      </div>
    </form>
  );
}
