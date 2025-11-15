'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepPhone from './StepPhone';
import StepAccount from './StepAccount';
import StepDone from './StepDone';

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
      <div className="w-full max-w-[520px] bg-surface border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="text-center px-10 py-10 pb-5 bg-surface border-b border-border">
          <h1 className="text-[32px] font-bold text-text-primary mb-3">회원가입</h1>
          <p className="text-base text-text-secondary font-medium">교육 플랫폼에서 학습을 시작하세요</p>
          
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
        <div className="p-10">
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
        <div className="px-10 py-5 text-center bg-bg-primary border-t border-border rounded-b-xl">
          <p className="text-sm text-text-secondary font-medium mb-3">이미 계정이 있으신가요?</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="bg-transparent border-2 border-primary text-primary px-6 py-2.5 rounded-md text-sm font-semibold transition-all hover:bg-primary hover:text-white hover:-translate-y-0.5"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
