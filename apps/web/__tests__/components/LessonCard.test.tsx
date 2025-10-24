import { render, screen } from '@testing-library/react';
import LessonCard from '../../components/LessonCard';
import type { CurriculumLesson } from '../../lib/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('LessonCard', () => {
  const mockSubjectTitle = '수학';

  it('renders locked lesson correctly', () => {
    const lesson: CurriculumLesson = {
      lessonId: 'lesson-1',
      lessonTitle: '1장: 수와 연산',
      progressPercent: 0,
      status: 'locked',
      remainingTries: 3,
      remainDays: 30,
    };

    render(<LessonCard lesson={lesson} subjectTitle={mockSubjectTitle} />);

    expect(screen.getByText('1장: 수와 연산')).toBeInTheDocument();
    expect(screen.getByText('🔒 잠금')).toBeInTheDocument();
    expect(screen.getByText('이전 레슨을 완료하면 해금됩니다')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /학습하기/i })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: /시험보기/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders available lesson with low progress', () => {
    const lesson: CurriculumLesson = {
      lessonId: 'lesson-1',
      lessonTitle: '1장: 수와 연산',
      progressPercent: 50,
      status: 'available',
      remainingTries: 3,
      remainDays: 30,
    };

    render(<LessonCard lesson={lesson} subjectTitle={mockSubjectTitle} />);

    expect(screen.getByText('📚 학습 중')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('시험 응시를 위해 진도율 90% 이상이 필요합니다')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /학습하기/i })).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('link', { name: /시험보기/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders available lesson ready for exam', () => {
    const lesson: CurriculumLesson = {
      lessonId: 'lesson-1',
      lessonTitle: '1장: 수와 연산',
      progressPercent: 95,
      status: 'available',
      remainingTries: 3,
      remainDays: 30,
    };

    render(<LessonCard lesson={lesson} subjectTitle={mockSubjectTitle} />);

    expect(screen.getByText('📝 시험 가능')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /학습하기/i })).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('link', { name: /시험보기/i })).not.toHaveAttribute('aria-disabled');
  });

  it('renders passed lesson correctly', () => {
    const lesson: CurriculumLesson = {
      lessonId: 'lesson-1',
      lessonTitle: '1장: 수와 연산',
      progressPercent: 100,
      status: 'passed',
      remainingTries: 0,
      remainDays: 30,
    };

    render(<LessonCard lesson={lesson} subjectTitle={mockSubjectTitle} />);

    expect(screen.getByText('✅ 완료')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /학습하기/i })).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('link', { name: /시험보기/i })).not.toHaveAttribute('aria-disabled');
  });

  it('displays correct metadata', () => {
    const lesson: CurriculumLesson = {
      lessonId: 'lesson-1',
      lessonTitle: '1장: 수와 연산',
      progressPercent: 75,
      status: 'available',
      remainingTries: 2,
      remainDays: 15,
    };

    render(<LessonCard lesson={lesson} subjectTitle={mockSubjectTitle} />);

    expect(screen.getByText('2회')).toBeInTheDocument();
    expect(screen.getByText('15일')).toBeInTheDocument();
  });
});









