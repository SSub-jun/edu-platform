import React from 'react';
import Link from 'next/link';
import { Lesson } from '../types/api';
import StatusBadge, { BadgeStatus } from './ui/StatusBadge';
import styles from './LessonCard.module.css';

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
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{title}</h3>
          <StatusBadge status={getBadgeStatus()} />
        </div>
        <div className={styles.meta}>
          <span className={styles.duration}>
            {formatDuration(lesson.totalDurationMs)}
          </span>
        </div>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <span className={styles.progressText}>
          {Math.round(progressPercent)}%
        </span>
      </div>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>시험 응시 기회</span>
          <span className={styles.infoValue}>
            {status === 'passed' ? '완료' : `${remainingTries}회 남음`}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>수강 기간</span>
          <span className={styles.infoValue}>
            {remainingDays > 0 ? `${remainingDays}일 남음` : '만료'}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <Link 
          href={`/lesson/${id}`}
          className={`${styles.button} ${styles.buttonSecondary} ${!canLearn ? styles.buttonDisabled : ''}`}
          aria-disabled={!canLearn}
          tabIndex={!canLearn ? -1 : 0}
        >
          학습하기
        </Link>
        
        <Link 
          href={`/exam/lesson/${id}`}
          className={`${styles.button} ${styles.buttonPrimary} ${!canTakeExam ? styles.buttonDisabled : ''}`}
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










