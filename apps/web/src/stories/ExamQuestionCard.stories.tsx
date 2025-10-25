import type { Meta, StoryObj } from '@storybook/react';
import { ExamQuestionCard } from '../components/exam/ExamQuestionCard';

const meta: Meta<typeof ExamQuestionCard> = {
  title: 'Exam/ExamQuestionCard',
  component: ExamQuestionCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    questionNumber: {
      control: { type: 'number', min: 1, max: 10 }
    },
    selectedIndex: {
      control: { type: 'number', min: 0, max: 3 }
    },
    showValidation: {
      control: 'boolean'
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 문항
export const Default: Story = {
  args: {
    question: {
      id: 'question-1',
      content: 'React에서 컴포넌트의 상태를 관리하기 위해 사용하는 Hook은 무엇인가요?',
      choices: [
        'useEffect',
        'useState',
        'useContext',
        'useReducer'
      ]
    },
    questionNumber: 1,
    onSelect: (questionId: string, choiceIndex: number) => {
      console.log(`Question ${questionId} selected choice ${choiceIndex}`);
    }
  }
};

// 선택된 상태
export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedIndex: 1
  }
};

// 긴 문제 텍스트
export const LongQuestion: Story = {
  args: {
    question: {
      id: 'question-2',
      content: 'Next.js 14에서 App Router를 사용할 때, 서버 컴포넌트와 클라이언트 컴포넌트의 차이점에 대한 설명으로 가장 적절한 것은 무엇인가요? 각 컴포넌트의 렌더링 위치와 사용 가능한 기능을 고려하여 답변해주세요.',
      choices: [
        '서버 컴포넌트는 브라우저에서 실행되고, 클라이언트 컴포넌트는 서버에서 실행된다',
        '서버 컴포넌트는 서버에서 실행되며 상태를 가질 수 없고, 클라이언트 컴포넌트는 브라우저에서 실행되며 상태를 가질 수 있다',
        '서버 컴포넌트와 클라이언트 컴포넌트는 동일한 기능을 제공하며 차이점이 없다',
        '서버 컴포넌트는 정적 파일로 빌드되고, 클라이언트 컴포넌트는 런타임에 생성된다'
      ]
    },
    questionNumber: 5,
    selectedIndex: 1,
    onSelect: (questionId: string, choiceIndex: number) => {
      console.log(`Question ${questionId} selected choice ${choiceIndex}`);
    }
  }
};

// 검증 실패 상태
export const WithValidationError: Story = {
  args: {
    ...Default.args,
    showValidation: true
  }
};

// 코드 문제
export const CodeQuestion: Story = {
  args: {
    question: {
      id: 'question-3',
      content: '다음 TypeScript 코드에서 컴파일 에러가 발생하는 이유는 무엇인가요?\n\n```typescript\ninterface User {\n  id: number;\n  name: string;\n}\n\nconst user: User = {\n  id: 1\n};\n```',
      choices: [
        'User 인터페이스에 선택적 속성이 없어서',
        'name 속성이 누락되어서',
        'id 속성의 타입이 잘못되어서',
        'User 인터페이스 정의가 잘못되어서'
      ]
    },
    questionNumber: 7,
    selectedIndex: 1,
    onSelect: (questionId: string, choiceIndex: number) => {
      console.log(`Question ${questionId} selected choice ${choiceIndex}`);
    }
  }
};

// 객관식 4지선다 (전체 예시)
export const MultipleChoice: Story = {
  args: {
    question: {
      id: 'question-4',
      content: 'React Query에서 데이터 캐싱과 관련된 설명으로 올바른 것은?',
      choices: [
        'staleTime은 데이터가 신선한 상태로 유지되는 시간이다',
        'cacheTime은 데이터가 메모리에 유지되는 시간이다',
        'queryKey가 같으면 동일한 쿼리로 간주된다',
        '위의 모든 설명이 올바르다'
      ]
    },
    questionNumber: 10,
    selectedIndex: 3,
    showValidation: false,
    onSelect: (questionId: string, choiceIndex: number) => {
      console.log(`Question ${questionId} selected choice ${choiceIndex}`);
    }
  }
};










