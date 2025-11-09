'use client';

import { useState } from 'react';
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
    <div className="max-w-3xl mx-auto p-6 md:p-8 bg-white rounded-xl shadow-md">
      {/* Question header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b-2 border-gray-100 gap-4">
        <div className="text-base font-semibold text-info bg-info-bg px-4 py-2 rounded-full">
          문제 {questionNumber}/{totalQuestions}
        </div>
        <div className="flex-1 md:ml-6 w-full">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-info rounded-full transition-[width] duration-300 ease-linear"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question stem */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">{question.stem}</h2>
      </div>

      {/* Answer choices */}
      <div className="mb-6">
        <fieldset className="border-0 p-0 m-0">
          <legend className="sr-only">
            답안을 선택하세요
          </legend>
          
          {question.choices.map((choice, index) => {
            const choiceId = `${question.id}-${index}`;
            const isSelected = selectedAnswer === choiceId;
            const isHovered = hoveredChoice === choiceId;
            
            return (
              <label
                key={choiceId}
                className={`flex items-center p-4 md:px-5 mb-3 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-info bg-info-bg' 
                    : isHovered 
                    ? 'border-info/60 bg-gray-50' 
                    : 'border-gray-200 bg-white hover:border-info hover:bg-gray-50'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                  className="sr-only"
                  aria-describedby={`question-${question.id}-stem`}
                />
                
                <div className="flex items-center flex-1 gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${
                    isSelected || isHovered 
                      ? 'bg-info text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="text-base text-gray-700 leading-normal">
                    {choice}
                  </div>
                </div>
                
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {isSelected && <span className="text-info text-lg font-bold">✓</span>}
                </div>
              </label>
            );
          })}
        </fieldset>
      </div>

      {/* Selection status */}
      <div className="text-center p-4 rounded-md text-sm font-medium">
        {selectedAnswer ? (
          <span className="text-success bg-success-bg border border-success px-4 py-2 rounded-md">✓ 답안 선택됨</span>
        ) : (
          <span className="text-warning bg-warning-bg border border-warning px-4 py-2 rounded-md">답안을 선택해주세요</span>
        )}
      </div>
    </div>
  );
}

