'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import StepPhone from './StepPhone';
import StepAccount from './StepAccount';
import StepDone from './StepDone';

export type SignupStep = 'phone' | 'account' | 'done';

export interface SignupData {
  phone: string;
  otpToken: string;
  username?: string;
  email?: string;
  password: string;
  inviteCode?: string;
}

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('phone');
  const [signupData, setSignupData] = useState<Partial<SignupData>>({});
  const router = useRouter();

  const handleStepComplete = (stepData: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep === 'phone') {
      setCurrentStep('account');
    } else if (currentStep === 'account') {
      setCurrentStep('done');
    } else if (currentStep === 'done') {
      // 회원가입 완료 후 커리큘럼으로 이동
      router.push('/curriculum');
    }
  };

  const handleBack = () => {
    if (currentStep === 'account') {
      setCurrentStep('phone');
    } else if (currentStep === 'done') {
      setCurrentStep('account');
    }
  };

  const getStepNumber = (step: SignupStep): number => {
    switch (step) {
      case 'phone': return 1;
      case 'account': return 2;
      case 'done': return 3;
      default: return 1;
    }
  };

  const isStepCompleted = (stepNumber: number): boolean => {
    const currentStepNumber = getStepNumber(currentStep);
    return stepNumber < currentStepNumber;
  };

  const isStepActive = (stepNumber: number): boolean => {
    return stepNumber === getStepNumber(currentStep);
  };

  return (
    <div className={styles.container}>
      <div className={styles.signupCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>회원가입</h1>
          <p className={styles.subtitle}>교육 플랫폼에서 학습을 시작하세요</p>
          
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${isStepCompleted(1) ? styles.stepCompleted : isStepActive(1) ? styles.stepActive : ''}`}>
              {isStepCompleted(1) ? '✓' : '1'}
            </div>
            <div className={`${styles.stepConnector} ${isStepCompleted(2) ? styles.stepConnectorActive : ''}`} />
            <div className={`${styles.step} ${isStepCompleted(2) ? styles.stepCompleted : isStepActive(2) ? styles.stepActive : ''}`}>
              {isStepCompleted(2) ? '✓' : '2'}
            </div>
            <div className={`${styles.stepConnector} ${isStepCompleted(3) ? styles.stepConnectorActive : ''}`} />
            <div className={`${styles.step} ${isStepCompleted(3) ? styles.stepCompleted : isStepActive(3) ? styles.stepActive : ''}`}>
              {isStepCompleted(3) ? '✓' : '3'}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {currentStep === 'phone' && (
            <StepPhone
              onComplete={handleStepComplete}
              initialData={signupData}
            />
          )}
          
          {currentStep === 'account' && (
            <StepAccount
              onComplete={handleStepComplete}
              onBack={handleBack}
              initialData={signupData}
            />
          )}
          
          {currentStep === 'done' && (
            <StepDone
              onComplete={handleStepComplete}
              signupData={signupData as SignupData}
            />
          )}
        </div>
        
        <div className={styles.loginSection}>
          <p className={styles.loginText}>이미 계정이 있으신가요?</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className={styles.loginButton}
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
