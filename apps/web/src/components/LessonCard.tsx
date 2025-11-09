import React from 'react';
import Link from 'next/link';
import { Lesson } from '../types/api';
import StatusBadge, { BadgeStatus } from './ui/StatusBadge';

interface LessonCardProps {
  lesson: Lesson;
  remainingDays: number;
}

export default function LessonCard({ lesson, remainingDays }: LessonCardProps) {
  const { id, title, progressPercent, status, remainingTries } = lesson;
  
  // 상태에 따른 배지 상태 결정
  const getBadgeStatus = (): BadgeStatus => {
    if (status === 'locked') return 'locked';
    if (status === 'passed') return 'passed';
    if (progressPercent > 0 && progressPercent < 90) return 'in-progress';
    return 'available';
  };

  // 학습하기 버튼 활성화 여부
  const canLearn = status !== 'locked';
  
  // 시험보기 버튼 활성화 여부
  const canTakeExam = status !== 'locked' && progressPercent >= 90 && remainingTries > 0;

  const formatDuration = (durationMs: number) => {
    const minutes = Math.ceil(durationMs / (1000 * 60));
    return `${minutes}분`;
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 md:p-6 transition-all hover:border-border-light">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-xl font-semibold text-text-primary leading-7">{title}</h3>
          <StatusBadge status={getBadgeStatus()} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[13px] text-text-secondary font-medium bg-bg-primary px-2 py-1 rounded-md">
            {formatDuration(lesson.totalDurationMs)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-2 bg-surface border border-border rounded-md overflow-hidden">
          <div 
            className="h-full bg-primary rounded-md transition-[width] duration-300 ease-linear"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <span className="text-[13px] font-semibold text-text-secondary min-w-[40px] text-right">
          {Math.round(progressPercent)}%
        </span>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-bg-primary rounded-lg border border-border">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-text-tertiary font-normal">시험 응시 기회</span>
          <span className="text-sm font-semibold text-text-primary">
            {status === 'passed' ? '완료' : `${remainingTries}회 남음`}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-text-tertiary font-normal">수강 기간</span>
          <span className="text-sm font-semibold text-text-primary">
            {remainingDays > 0 ? `${remainingDays}일 남음` : '만료'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link 
          href={`/lesson/${id}`}
          className={`flex-1 inline-flex items-center justify-center h-11 px-6 rounded-btn text-[14px] leading-5 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2 ${
            canLearn 
              ? 'bg-transparent border border-border text-text-secondary hover:bg-surface' 
              : 'opacity-60 cursor-not-allowed pointer-events-none bg-surface text-text-tertiary'
          }`}
          aria-disabled={!canLearn}
          tabIndex={!canLearn ? -1 : 0}
        >
          학습하기
        </Link>
        
        <Link 
          href={`/exam/lesson/${id}`}
          className={`flex-1 inline-flex items-center justify-center h-11 px-6 rounded-btn text-[14px] leading-5 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2 ${
            canTakeExam 
              ? 'bg-primary text-text-primary hover:bg-primary-600 active:bg-primary-700' 
              : 'opacity-60 cursor-not-allowed pointer-events-none bg-surface text-text-tertiary'
          }`}
          aria-disabled={!canTakeExam}
          tabIndex={!canTakeExam ? -1 : 0}
          title={
            !canTakeExam 
              ? progressPercent < 90 
                ? '진도 90% 이상 필요' 
                : remainingTries === 0 
                ? '응시 기회 없음' 
                : '잠긴 레슨'
              : undefined
          }
        >
          시험보기
        </Link>
      </div>
    </div>
  );
}











