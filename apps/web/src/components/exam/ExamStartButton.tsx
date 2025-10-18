'use client';

import React from 'react';
import { Button } from '../ui/button';
import { useStartExam } from '../../hooks/useExam';

interface ExamStartButtonProps {
  lessonId: string;
  progressPercent: number;
  hasPassedExam: boolean;
  onExamStarted?: (data: any) => void;
  disabled?: boolean;
}

export function ExamStartButton({ 
  lessonId, 
  progressPercent, 
  hasPassedExam, 
  onExamStarted,
  disabled 
}: ExamStartButtonProps) {
  const startExamMutation = useStartExam();

  const canStartExam = progressPercent >= 90 && !hasPassedExam;

  const handleStartExam = () => {
    if (!canStartExam || disabled) return;
    
    startExamMutation.mutate(lessonId, {
      onSuccess: (data) => {
        onExamStarted?.(data);
      }
    });
  };

  const getButtonText = () => {
    if (hasPassedExam) return '합격 완료';
    if (progressPercent < 90) return `진도 ${progressPercent.toFixed(1)}% (90% 필요)`;
    return '시험 시작하기';
  };

  const getTooltipText = () => {
    if (hasPassedExam) return '이미 합격한 시험입니다';
    if (progressPercent < 90) return '진도가 90% 이상이어야 시험을 볼 수 있습니다';
    return '시험을 시작합니다';
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleStartExam}
        disabled={!canStartExam || disabled || startExamMutation.isPending}
        className={`w-full ${canStartExam ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}
        size="lg"
      >
        {startExamMutation.isPending ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>시험 준비중...</span>
          </div>
        ) : (
          getButtonText()
        )}
      </Button>
      
      {!canStartExam && (
        <p className="text-sm text-gray-600 text-center">
          {getTooltipText()}
        </p>
      )}
    </div>
  );
}








