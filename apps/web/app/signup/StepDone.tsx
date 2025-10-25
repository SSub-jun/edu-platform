'use client';

import { useEffect } from 'react';
import { SignupData } from './page';
import styles from './page.module.css';

interface StepDoneProps {
  onComplete: () => void;
  signupData: SignupData;
}

export default function StepDone({ onComplete, signupData }: StepDoneProps) {
  useEffect(() => {
    // 3초 후 자동으로 커리큘럼 페이지로 이동
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const maskPhone = (phone: string): string => {
    if (phone.length !== 11) return phone;
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className={styles.successIcon}>
        🎉
      </div>
      
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '700', 
        color: 'var(--text-primary)', 
        margin: '0 0 16px 0',
        background: 'linear-gradient(135deg, var(--success) 0%, var(--primary) 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        회원가입이 완료되었습니다!
      </h2>
      
      <p style={{ 
        fontSize: '16px', 
        color: 'var(--text-secondary)', 
        margin: '0 0 32px 0',
        lineHeight: 1.6 
      }}>
        교육 플랫폼에 오신 것을 환영합니다.<br />
        이제 학습을 시작할 수 있습니다.
      </p>

      <div style={{
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-muted) 100%)',
        border: '1px solid var(--border-muted)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: 'var(--text-primary)', 
          margin: '0 0 16px 0' 
        }}>
          가입 정보
        </h3>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          fontSize: '14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>휴대폰번호:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              {maskPhone(signupData.phone)}
            </span>
          </div>
          
          {signupData.username && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>사용자명:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                {signupData.username}
              </span>
            </div>
          )}
          
          {signupData.email && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>이메일:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                {signupData.email}
              </span>
            </div>
          )}
          
          {signupData.inviteCode && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>초대코드:</span>
              <span style={{ 
                color: 'var(--primary)', 
                fontWeight: '600',
                background: 'var(--info-light)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--primary)',
              }}>
                {signupData.inviteCode}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '14px',
        color: 'var(--text-muted)',
        marginBottom: '24px',
      }}>
        <div className={styles.spinner} style={{ width: '16px', height: '16px' }}></div>
        <span>3초 후 자동으로 학습 페이지로 이동합니다...</span>
      </div>

      <button
        onClick={onComplete}
        className={styles.button}
        style={{ maxWidth: '200px', margin: '0 auto' }}
      >
        바로 시작하기
      </button>

      <p style={{ 
        fontSize: '12px', 
        color: 'var(--text-light)', 
        margin: '24px 0 0 0',
        lineHeight: 1.5 
      }}>
        문제가 있으시거나 도움이 필요하시면<br />
        언제든지 고객지원팀에 문의해주세요.
      </p>
    </div>
  );
}









