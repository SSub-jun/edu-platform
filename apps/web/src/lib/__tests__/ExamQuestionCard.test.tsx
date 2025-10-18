import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExamQuestionCard from '../components/ExamQuestionCard';
import { ExamQuestion, ExamAnswer } from '../types/api';

const mockQuestion: ExamQuestion = {
  id: 'question-1',
  stem: '다음 중 올바른 변수 선언 방법은?',
  choices: [
    { id: 'choice-1', text: 'var name = "홍길동"', order: 1 },
    { id: 'choice-2', text: 'variable name = "홍길동"', order: 2 },
    { id: 'choice-3', text: 'name = "홍길동"', order: 3 },
    { id: 'choice-4', text: 'string name = "홍길동"', order: 4 },
  ],
};

const mockOnAnswerSelect = jest.fn();

describe('ExamQuestionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('문제와 선택지를 올바르게 렌더링한다', () => {
    render(
      <ExamQuestionCard
        question={mockQuestion}
        questionIndex={0}
        totalQuestions={10}
        onAnswerSelect={mockOnAnswerSelect}
      />
    );

    expect(screen.getByText('다음 중 올바른 변수 선언 방법은?')).toBeInTheDocument();
    expect(screen.getByText('var name = "홍길동"')).toBeInTheDocument();
    expect(screen.getByText('variable name = "홍길동"')).toBeInTheDocument();
    expect(screen.getByText('name = "홍길동"')).toBeInTheDocument();
    expect(screen.getByText('string name = "홍길동"')).toBeInTheDocument();
  });

  it('문제 번호와 진행 상황을 올바르게 표시한다', () => {
    render(
      <ExamQuestionCard
        question={mockQuestion}
        questionIndex={2}
        totalQuestions={10}
        onAnswerSelect={mockOnAnswerSelect}
      />
    );

    expect(screen.getByText('문제 3 / 10')).toBeInTheDocument();
  });

  it('선택지를 클릭하면 onAnswerSelect가 호출된다', () => {
    render(
      <ExamQuestionCard
        question={mockQuestion}
        questionIndex={0}
        totalQuestions={10}
        onAnswerSelect={mockOnAnswerSelect}
      />
    );

    const firstChoice = screen.getByDisplayValue('0');
    fireEvent.click(firstChoice);

    expect(mockOnAnswerSelect).toHaveBeenCalledWith({
      questionId: 'question-1',
      choiceIndex: 0,
    });
  });

  it('선택된 답안을 올바르게 표시한다', () => {
    render(
      <ExamQuestionCard
        question={mockQuestion}
        questionIndex={0}
        totalQuestions={10}
        selectedAnswer={1}
        onAnswerSelect={mockOnAnswerSelect}
      />
    );

    const secondChoice = screen.getByDisplayValue('1');
    expect(secondChoice).toBeChecked();
  });

  it('비활성화 상태에서는 선택지를 클릭할 수 없다', () => {
    render(
      <ExamQuestionCard
        question={mockQuestion}
        questionIndex={0}
        totalQuestions={10}
        onAnswerSelect={mockOnAnswerSelect}
        disabled={true}
      />
    );

    const firstChoice = screen.getByDisplayValue('0');
    fireEvent.click(firstChoice);

    expect(mockOnAnswerSelect).not.toHaveBeenCalled();
  });

  it('진행 도트를 올바르게 표시한다', () => {
    render(
      <ExamQuestionCard
        question={mockQuestion}
        questionIndex={2}
        totalQuestions={5}
        onAnswerSelect={mockOnAnswerSelect}
      />
    );

    const dots = screen.container.querySelectorAll('[class*="dot"]');
    expect(dots).toHaveLength(5);
    
    // 현재 문제는 active, 이전 문제들은 completed 상태여야 함
    expect(dots[2]).toHaveClass('dotActive');
    expect(dots[0]).toHaveClass('dotCompleted');
    expect(dots[1]).toHaveClass('dotCompleted');
  });
});








