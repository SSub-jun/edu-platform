'use client';

import Link from 'next/link';
import type { CurriculumLesson } from '../lib/types';

interface LessonCardProps {
  lesson: CurriculumLesson;
  subjectTitle: string;
}

export default function LessonCard({ lesson, subjectTitle }: LessonCardProps) {
  const {
    lessonId,
    lessonTitle,
    progressPercent,
    status,
    remainingTries,
    remainDays,
  } = lesson;

  const getStatusBadge = () => {
    switch (status) {
      case 'locked':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] leading-5 bg-surface border border-border text-text-tertiary">🔒 잠금</span>;
      case 'available':
        return progressPercent >= 90 
          ? <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] leading-5 bg-success-bg border border-success text-success">📝 시험 가능</span>
          : <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] leading-5 bg-info-bg border border-info text-info">📚 학습 중</span>;
      case 'passed':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] leading-5 bg-success-bg border border-success text-success">✅ 완료</span>;
      default:
        return null;
    }
  };

  const getProgressBarColor = () => {
    if (status === 'passed') return 'bg-success';
    if (progressPercent >= 90) return 'bg-success';
    return 'bg-primary';
  };

  const canTakeExam = status === 'available' && progressPercent >= 90;
  const canStudy = status === 'available' || status === 'passed';

  return (
    <div className="bg-surface border border-border rounded-xl p-4 md:p-6 transition-all hover:border-border-light">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-semibold text-text-primary flex-1 mr-3">{lessonTitle}</h3>
        {getStatusBadge()}
      </div>

      {/* Subject Name */}
      <div className="text-[13px] text-text-secondary mb-4">{subjectTitle}</div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-text-secondary">진행률</span>
          <span className="text-sm font-semibold text-text-primary">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-2 bg-surface border border-border rounded-md overflow-hidden">
          <div 
            className={`h-full rounded-md transition-[width] duration-300 ease-linear ${getProgressBarColor()}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-bg-primary rounded-lg border border-border">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-text-tertiary font-normal">남은 시도</span>
          <span className="text-sm font-semibold text-text-primary">{remainingTries}회</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-text-tertiary font-normal">남은 기간</span>
          <span className="text-sm font-semibold text-text-primary">{remainDays}일</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link 
          href={`/lesson/${lessonId}`}
          className={`inline-flex items-center justify-center h-10 px-6 rounded-btn text-[14px] leading-5 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2 ${
            canStudy 
              ? 'bg-transparent border border-border text-text-secondary hover:bg-surface' 
              : 'opacity-60 cursor-not-allowed pointer-events-none bg-surface text-text-tertiary'
          }`}
          aria-disabled={!canStudy}
        >
          학습하기
        </Link>

        <Link
          href={`/exam/lesson/${lessonId}`}
          className={`inline-flex items-center justify-center h-10 px-6 rounded-btn text-[14px] leading-5 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-2 ${
            canTakeExam 
              ? 'bg-primary text-text-primary hover:bg-primary-600 active:bg-primary-700' 
              : 'opacity-60 cursor-not-allowed pointer-events-none bg-surface text-text-tertiary'
          }`}
          aria-disabled={!canTakeExam}
          title={
            !canTakeExam 
              ? status === 'locked' 
                ? '이전 레슨을 완료하세요' 
                : '진도율 90% 이상 필요'
              : '시험 응시하기'
          }
        >
          시험보기
        </Link>
      </div>

      {/* Info Messages */}
      {status === 'locked' && (
        <div className="mt-3 px-3 py-2 rounded-md text-[13px] text-center bg-warning-bg border border-warning text-warning">
          이전 레슨을 완료하면 해금됩니다
        </div>
      )}

      {status === 'available' && progressPercent < 90 && (
        <div className="mt-3 px-3 py-2 rounded-md text-[13px] text-center bg-info-bg border border-info text-info">
          시험 응시를 위해 진도율 90% 이상이 필요합니다
        </div>
      )}
    </div>
  );
}

