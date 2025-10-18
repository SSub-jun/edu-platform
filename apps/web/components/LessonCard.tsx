'use client';

import Link from 'next/link';
import styles from './LessonCard.module.css';
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
        return <span className={`${styles.badge} ${styles.locked}`}>🔒 잠금</span>;
      case 'available':
        return progressPercent >= 90 
          ? <span className={`${styles.badge} ${styles.examReady}`}>📝 시험 가능</span>
          : <span className={`${styles.badge} ${styles.inProgress}`}>📚 학습 중</span>;
      case 'passed':
        return <span className={`${styles.badge} ${styles.passed}`}>✅ 완료</span>;
      default:
        return null;
    }
  };

  const getProgressBarColor = () => {
    if (status === 'passed') return styles.progressPassed;
    if (progressPercent >= 90) return styles.progressReady;
    return styles.progressDefault;
  };

  const canTakeExam = status === 'available' && progressPercent >= 90;
  const canStudy = status === 'available' || status === 'passed';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{lessonTitle}</h3>
        {getStatusBadge()}
      </div>

      <div className={styles.subjectName}>{subjectTitle}</div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>진행률</span>
          <span className={styles.progressValue}>{Math.round(progressPercent)}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={`${styles.progressFill} ${getProgressBarColor()}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className={styles.metadata}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>남은 시도</span>
          <span className={styles.metaValue}>{remainingTries}회</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>남은 기간</span>
          <span className={styles.metaValue}>{remainDays}일</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Link 
          href={`/lesson/${lessonId}`}
          className={`${styles.button} ${styles.studyButton} ${
            !canStudy ? styles.disabled : ''
          }`}
          aria-disabled={!canStudy}
        >
          학습하기
        </Link>

        <Link
          href={`/exam/lesson/${lessonId}`}
          className={`${styles.button} ${styles.examButton} ${
            !canTakeExam ? styles.disabled : ''
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

      {status === 'locked' && (
        <div className={styles.lockReason}>
          이전 레슨을 완료하면 해금됩니다
        </div>
      )}

      {status === 'available' && progressPercent < 90 && (
        <div className={styles.progressRequired}>
          시험 응시를 위해 진도율 90% 이상이 필요합니다
        </div>
      )}
    </div>
  );
}

