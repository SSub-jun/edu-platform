'use client';

import styles from './QuestionNavigation.module.css';

interface QuestionNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  answers: Record<string, string>;
  onNavigate: (questionIndex: number) => void;
  disabled?: boolean;
}

export default function QuestionNavigation({
  currentQuestion,
  totalQuestions,
  answers,
  onNavigate,
  disabled = false,
}: QuestionNavigationProps) {
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === totalQuestions;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>문제 진행 상황</h3>
        <div className={styles.summary}>
          <span className={styles.answered}>{answeredCount}</span>
          <span className={styles.divider}>/</span>
          <span className={styles.total}>{totalQuestions}</span>
          <span className={styles.label}>문제 완료</span>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>

      <div className={styles.questionGrid}>
        {Array.from({ length: totalQuestions }, (_, index) => {
          const questionNumber = index + 1;
          const isAnswered = Object.values(answers).some((_, answerIndex) => answerIndex === index);
          const isCurrent = currentQuestion === index;
          
          return (
            <button
              key={index}
              className={`${styles.questionButton} ${
                isCurrent ? styles.current : ''
              } ${
                isAnswered ? styles.answered : styles.unanswered
              } ${
                disabled ? styles.disabled : ''
              }`}
              onClick={() => !disabled && onNavigate(index)}
              disabled={disabled}
              aria-label={`문제 ${questionNumber}${isCurrent ? ' (현재)' : ''}${isAnswered ? ' (완료)' : ' (미완료)'}`}
            >
              <span className={styles.questionNumber}>{questionNumber}</span>
              {isAnswered && <span className={styles.checkmark}>✓</span>}
            </button>
          );
        })}
      </div>

      <div className={styles.status}>
        {isComplete ? (
          <div className={styles.completeMessage}>
            ✅ 모든 문제를 완료했습니다!
          </div>
        ) : (
          <div className={styles.incompleteMessage}>
            {totalQuestions - answeredCount}개 문제가 남았습니다
          </div>
        )}
      </div>
    </div>
  );
}








