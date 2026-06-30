'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepPhone from './StepPhone';
import StepAccount from './StepAccount';
import StepDone from './StepDone';
import { useLocale } from '../../src/i18n/client';
import { translateStudentText } from '../../src/i18n/studentTranslations';

export type SignupStep = 'phone' | 'account' | 'done';

export interface SignupData {
  phone: string;
  otpToken: string;
  name?: string;
  password: string;
  inviteCode?: string;
}

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('phone');
  const [signupData, setSignupData] = useState<Partial<SignupData>>({});
  const router = useRouter();
  const { locale } = useLocale();
  const t = (source: string) => translateStudentText(source, locale);

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
    <div className="student-page flex items-center justify-center">
      <div className="student-panel-strong w-full max-w-[560px] overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-bg-elevated px-8 py-8 text-center md:px-10">
          <h1 className="text-[32px] font-bold text-text-primary mb-3">{t('회원가입')}</h1>
          <p className="text-base text-text-secondary font-medium">{t('교육 플랫폼에서 학습을 시작하세요')}</p>
          
          {/* Step Indicator */}
          <div className="flex justify-center items-center gap-3 mt-5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
              isStepCompleted(1) 
                ? 'bg-success border-success text-white' 
                : isStepActive(1) 
                ? 'bg-primary border-primary text-white' 
                : 'bg-surface border-border text-text-tertiary'
            }`}>
              {isStepCompleted(1) ? '✓' : '1'}
            </div>
            <div className={`w-10 h-0.5 transition-all ${
              isStepCompleted(2) ? 'bg-gradient-to-r from-success to-primary' : 'bg-border'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
              isStepCompleted(2) 
                ? 'bg-success border-success text-white' 
                : isStepActive(2) 
                ? 'bg-primary border-primary text-white' 
                : 'bg-surface border-border text-text-tertiary'
            }`}>
              {isStepCompleted(2) ? '✓' : '2'}
            </div>
            <div className={`w-10 h-0.5 transition-all ${
              isStepCompleted(3) ? 'bg-gradient-to-r from-success to-primary' : 'bg-border'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
              isStepCompleted(3) 
                ? 'bg-success border-success text-white' 
                : isStepActive(3) 
                ? 'bg-primary border-primary text-white' 
                : 'bg-surface border-border text-text-tertiary'
            }`}>
              {isStepCompleted(3) ? '✓' : '3'}
            </div>
          </div>
        </div>

        {/* Content */}
          <div className="p-6 md:p-10">
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
              onComplete={() => router.push('/curriculum')}
              signupData={signupData as SignupData}
            />
          )}
        </div>
        
        {/* Login Section */}
        <div className="border-t border-border bg-bg-elevated px-8 py-5 text-center md:px-10">
          <p className="text-sm text-text-secondary font-medium mb-3">{t('이미 계정이 있으신가요?')}</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="student-button-secondary min-h-11 px-6 py-2.5 text-sm"
          >
            {t('로그인')}
          </button>
        </div>
      </div>
    </div>
  );
}
