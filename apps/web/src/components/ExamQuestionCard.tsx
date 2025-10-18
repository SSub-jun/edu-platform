import React from 'react';
import { ExamQuestion, ExamAnswer } from '../types/api';
import styles from './ExamQuestionCard.module.css';

interface ExamQuestionCardProps {
  question: ExamQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer?: number;
  onAnswerSelect: (answer: ExamAnswer) => void;
  disabled?: boolean;
}

export default function ExamQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  disabled = false,
}: ExamQuestionCardProps) {
  const handleChoiceSelect = (choiceIndex: number) => {
    if (disabled) return;
    
    onAnswerSelect({
      questionId: question.id,
      choiceIndex,
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.questionNumber}>
          문제 {questionIndex + 1} / {totalQuestions}
        </div>
        <div className={styles.progressDots}>
          {Array.from({ length: totalQuestions }).map((_, index) => (
            <div
              key={index}
              className={`${styles.dot} ${
                index === questionIndex ? styles.dotActive : 
                index < questionIndex ? styles.dotCompleted : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div className={styles.questionContent}>
        <h3 className={styles.questionStem}>
          {question.content}
        </h3>

        <div className={styles.choices}>
          {question.choices.map((choiceText, index) => (
              <label
                key={`${question.id}-choice-${index}`}
                className={`${styles.choiceLabel} ${
                  selectedAnswer === index ? styles.choiceLabelSelected : ''
                } ${disabled ? styles.choiceLabelDisabled : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={index}
                  checked={selectedAnswer === index}
                  onChange={() => handleChoiceSelect(index)}
                  disabled={disabled}
                  className={styles.choiceInput}
                />
                <div className={styles.choiceContent}>
                  <div className={styles.choiceNumber}>
                    {index + 1}
                  </div>
                  <div className={styles.choiceText}>
                    {choiceText}
                  </div>
                </div>
              </label>
            ))}
        </div>
      </div>
    </div>
  );
}

