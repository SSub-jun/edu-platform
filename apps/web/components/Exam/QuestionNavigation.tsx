'use client';

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
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h3 className="text-base font-semibold text-gray-800 m-0">문제 진행 상황</h3>
        <div className="flex items-center gap-1 text-sm sm:justify-start justify-center w-full sm:w-auto">
          <span className="font-semibold text-success">{answeredCount}</span>
          <span className="text-gray-600">/</span>
          <span className="font-semibold text-gray-700">{totalQuestions}</span>
          <span className="text-gray-600 ml-1">문제 완료</span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div 
          className="h-full bg-success rounded-full transition-[width] duration-300 ease-linear"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-5 gap-2 mb-5">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const questionNumber = index + 1;
          const isAnswered = Object.values(answers).some((_, answerIndex) => answerIndex === index);
          const isCurrent = currentQuestion === index;
          
          return (
            <button
              key={index}
              className={`relative flex items-center justify-center w-10 h-10 border-2 rounded-md cursor-pointer transition-all text-sm font-medium ${
                isCurrent 
                  ? 'border-info bg-info text-white' 
                  : isAnswered 
                  ? 'border-success bg-success-bg text-success' 
                  : 'border-gray-300 bg-white text-gray-600'
              } ${
                disabled ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-sm'
              }`}
              onClick={() => !disabled && onNavigate(index)}
              disabled={disabled}
              aria-label={`문제 ${questionNumber}${isCurrent ? ' (현재)' : ''}${isAnswered ? ' (완료)' : ' (미완료)'}`}
            >
              <span className="text-xs font-semibold">{questionNumber}</span>
              {isAnswered && (
                <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                  isCurrent ? 'bg-white text-info' : 'bg-success text-white'
                }`}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center p-3 rounded-md text-sm font-medium">
        {isComplete ? (
          <div className="text-success bg-success-bg border border-success rounded-md py-2">
            ✅ 모든 문제를 완료했습니다!
          </div>
        ) : (
          <div className="text-warning bg-warning-bg border border-warning rounded-md py-2">
            {totalQuestions - answeredCount}개 문제가 남았습니다
          </div>
        )}
      </div>
    </div>
  );
}











