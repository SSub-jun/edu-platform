'use client';

import { useCurriculum } from '../lib/queries';
import LessonCard from './LessonCard';
import StatusBanner from './StatusBanner';

export default function CurriculumList() {
  const { data: curriculum, isLoading, error } = useCurriculum();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-8 h-8 border-2 border-surface border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-text-secondary">커리큘럼을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StatusBanner
          type="error"
          message="커리큘럼을 불러오는데 실패했습니다."
          actionLabel="다시 시도"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!curriculum || curriculum.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-20 text-text-secondary">
          <p className="mb-2">배정된 과목이 없습니다.</p>
          <p>관리자에게 문의하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-[28px] leading-9 font-semibold text-text-primary mb-2">나의 커리큘럼</h1>
        <p className="text-base text-text-secondary">
          배정된 과목과 레슨을 확인하고 학습을 진행하세요
        </p>
      </header>

      {/* Subjects */}
      <div className="flex flex-col gap-10">
        {curriculum.map((subject) => (
          <section key={subject.subjectId} className="bg-surface border border-border rounded-xl p-4 md:p-6">
            {/* Subject Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-6 pb-4 border-b border-border">
              <h2 className="text-2xl font-semibold text-text-primary">{subject.subjectTitle}</h2>
              <div className="text-sm text-text-secondary bg-bg-primary px-3 py-1.5 rounded-md border border-border w-fit">
                총 {subject.lessons.length}개 레슨
              </div>
            </div>

            {/* Lesson Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subject.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.lessonId}
                  lesson={lesson}
                  subjectTitle={subject.subjectTitle}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

