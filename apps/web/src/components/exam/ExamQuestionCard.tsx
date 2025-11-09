'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

interface Question {
  id: string;
  content: string;
  choices: string[];
}

interface ExamQuestionCardProps {
  question: Question;
  questionNumber: number;
  selectedIndex?: number;
  onSelect: (questionId: string, choiceIndex: number) => void;
  showValidation?: boolean;
}

export function ExamQuestionCard({ 
  question, 
  questionNumber, 
  selectedIndex, 
  onSelect,
  showValidation = false 
}: ExamQuestionCardProps) {
  const hasAnswer = selectedIndex !== undefined;
  
  return (
    <Card className={`mb-6 ${showValidation && !hasAnswer ? 'border-error bg-error-bg' : ''}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-primary">
          문제 {questionNumber}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-base leading-relaxed text-text-primary">
          {question.content}
        </div>
        
        <RadioGroup 
          value={selectedIndex?.toString()} 
          onValueChange={(value) => onSelect(question.id, parseInt(value))}
          className="space-y-3"
        >
          {question.choices.map((choice, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-surface hover:border-border-light transition-colors"
            >
              <RadioGroupItem 
                value={index.toString()} 
                id={`${question.id}-${index}`}
                className="text-primary"
              />
              <Label 
                htmlFor={`${question.id}-${index}`}
                className="flex-1 cursor-pointer text-sm leading-relaxed text-text-primary"
              >
                <span className="font-medium mr-2">{index + 1}.</span>
                {choice}
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {showValidation && !hasAnswer && (
          <p className="text-sm text-error mt-2">
            ⚠️ 답을 선택해주세요
          </p>
        )}
      </CardContent>
    </Card>
  );
}










