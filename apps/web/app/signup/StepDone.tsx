'use client';

import { useEffect } from 'react';
import { SignupData } from './page';

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
    <div className="text-center">
      <div className="text-6xl mb-4 animate-bounce">
        🎉
      </div>
      
      <h2 className="text-2xl font-bold text-text-primary mb-4 bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
        회원가입이 완료되었습니다!
      </h2>
      
      <p className="text-base text-text-secondary mb-8 leading-relaxed">
        교육 플랫폼에 오신 것을 환영합니다.<br />
        이제 학습을 시작할 수 있습니다.
      </p>

      <div className="bg-gradient-to-br from-surface to-bg-primary border border-border rounded-xl p-6 mb-8">
        <h3 className="text-base font-semibold text-text-primary mb-4">
          가입 정보
        </h3>
        
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-tertiary font-semibold">휴대폰번호:</span>
            <span className="text-text-primary font-medium">
              {maskPhone(signupData.phone)}
            </span>
          </div>
          
          {signupData.name && (
            <div className="flex justify-between">
              <span className="text-text-tertiary font-semibold">이름:</span>
              <span className="text-text-primary font-medium">
                {signupData.name}
              </span>
            </div>
          )}
          
          {signupData.inviteCode && (
            <div className="flex justify-between">
              <span className="text-text-tertiary font-semibold">초대코드:</span>
              <span className="text-primary font-semibold bg-info-bg px-2 py-0.5 rounded border border-primary">
                {signupData.inviteCode}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary mb-6">
        <div className="w-4 h-4 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin"></div>
        <span>3초 후 자동으로 학습 페이지로 이동합니다...</span>
      </div>

      <button
        onClick={onComplete}
        className="w-full max-w-[200px] h-12 bg-primary text-white rounded-lg text-base font-semibold transition-all hover:bg-primary-600 active:bg-primary-700 mx-auto"
      >
        바로 시작하기
      </button>

      <p className="text-xs text-text-tertiary mt-6 leading-normal">
        문제가 있으시거나 도움이 필요하시면<br />
        언제든지 고객지원팀에 문의해주세요.
      </p>
    </div>
  );
}









