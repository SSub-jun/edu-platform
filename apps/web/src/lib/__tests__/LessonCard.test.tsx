import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LessonCard from '../components/LessonCard';
import { Lesson } from '../types/api';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockLesson: Lesson = {
  id: 'lesson-1',
  title: '테스트 레슨',
  description: '테스트용 레슨입니다.',
  order: 1,
  subjectId: 'subject-1',
  progressPercent: 75,
  status: 'available',
  remainingTries: 2,
  totalDurationMs: 300000, // 5분
};

describe('LessonCard', () => {
  it('레슨 제목과 진도율을 올바르게 표시한다', () => {
    render(<LessonCard lesson={mockLesson} remainingDays={30} />);
    
    expect(screen.getByText('테스트 레슨')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('잠긴 레슨의 경우 시험보기 버튼이 비활성화된다', () => {
    const lockedLesson: Lesson = {
      ...mockLesson,
      status: 'locked',
      progressPercent: 0,
    };

    render(<LessonCard lesson={lockedLesson} remainingDays={30} />);
    
    const examButton = screen.getByRole('link', { name: /시험보기/i });
    expect(examButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('진도가 90% 미만인 경우 시험보기 버튼이 비활성화된다', () => {
    const lowProgressLesson: Lesson = {
      ...mockLesson,
      progressPercent: 80,
      status: 'available',
    };

    render(<LessonCard lesson={lowProgressLesson} remainingDays={30} />);
    
    const examButton = screen.getByRole('link', { name: /시험보기/i });
    expect(examButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('진도가 90% 이상이고 시도 횟수가 있는 경우 시험보기 버튼이 활성화된다', () => {
    const readyLesson: Lesson = {
      ...mockLesson,
      progressPercent: 95,
      status: 'available',
      remainingTries: 3,
    };

    render(<LessonCard lesson={readyLesson} remainingDays={30} />);
    
    const examButton = screen.getByRole('link', { name: /시험보기/i });
    expect(examButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('합격한 레슨의 경우 완료 상태를 표시한다', () => {
    const passedLesson: Lesson = {
      ...mockLesson,
      status: 'passed',
      progressPercent: 100,
    };

    render(<LessonCard lesson={passedLesson} remainingDays={30} />);
    
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument(); // 시험 응시 기회 섹션
  });

  it('남은 기간을 올바르게 표시한다', () => {
    render(<LessonCard lesson={mockLesson} remainingDays={15} />);
    
    expect(screen.getByText('15일 남음')).toBeInTheDocument();
  });

  it('기간이 만료된 경우를 올바르게 표시한다', () => {
    render(<LessonCard lesson={mockLesson} remainingDays={0} />);
    
    expect(screen.getByText('만료')).toBeInTheDocument();
  });

  it('레슨 시간을 분 단위로 표시한다', () => {
    render(<LessonCard lesson={mockLesson} remainingDays={30} />);
    
    expect(screen.getByText('5분')).toBeInTheDocument();
  });
});









