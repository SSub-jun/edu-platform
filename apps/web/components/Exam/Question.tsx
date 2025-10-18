'use client';

import { useState } from 'react';
import styles from './Question.module.css';
import type { ExamQuestion } from '../../lib/types';

interface QuestionProps {
  question: ExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: string;
  onAnswerChange: (questionId: string, choiceId: string) => void;
  disabled?: boolean;
}

export default function Question({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerChange,
  disabled = false,
}: QuestionProps) {
  const [hoveredChoice, setHoveredChoice] = useState<string | null>(null);

  const handleChoiceClick = (choiceId: string) => {
    if (!disabled) {
      onAnswerChange(question.id, choiceId);
    }
  };

  return (
    <div className={styles.questionContainer}>
      {/* Question header */}
      <div className={styles.questionHeader}>
        <div className={styles.questionNumber}>
          문제 {questionNumber}/{totalQuestions}
        </div>
        <div className={styles.questionProgress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question stem */}
      <div className={styles.questionStem}>
        <h2 className={styles.stemText}>{question.stem}</h2>
      </div>

      {/* Answer choices */}
      <div className={styles.choicesContainer}>
        <fieldset className={styles.choicesFieldset}>
          <legend className={styles.choicesLegend}>
            답안을 선택하세요
          </legend>
          
          {question.choices.map((choice, index) => {
            const choiceId = `${question.id}-${index}`;
            const isSelected = selectedAnswer === choiceId;
            const isHovered = hoveredChoice === choiceId;
            
            return (
              <label
                key={choiceId}
                className={`${styles.choiceLabel} ${
                  isSelected ? styles.selected : ''
                } ${
                  isHovered ? styles.hovered : ''
                } ${
                  disabled ? styles.disabled : ''
                }`}
                onMouseEnter={() => setHoveredChoice(choiceId)}
                onMouseLeave={() => setHoveredChoice(null)}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={choiceId}
                  checked={isSelected}
                  onChange={() => handleChoiceClick(choiceId)}
                  disabled={disabled}
                  className={styles.choiceInput}
                  aria-describedby={`question-${question.id}-stem`}
                />
                
                <div className={styles.choiceContent}>
                  <div className={styles.choiceNumber}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className={styles.choiceText}>
                    {choice}
                  </div>
                </div>
                
                <div className={styles.choiceIndicator}>
                  {isSelected && <span className={styles.checkmark}>✓</span>}
                </div>
              </label>
            );
          })}
        </fieldset>
      </div>

      {/* Selection status */}
      <div className={styles.selectionStatus}>
        {selectedAnswer ? (
          <span className={styles.answered}>✓ 답안 선택됨</span>
        ) : (
          <span className={styles.unanswered}>답안을 선택해주세요</span>
        )}
      </div>
    </div>
  );
}

