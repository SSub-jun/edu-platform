'use client';

import React from 'react';
import { ExamPage } from '../../../components/exam/ExamPage';

interface ExamPageProps {
  params: {
    lessonId: string;
  };
}

// 실제 구현에서는 API를 통해 레슨 정보를 가져와야 함
export default function ExamPageRoute({ params }: ExamPageProps) {
  // 임시 데이터 (실제로는 useQuery로 레슨 정보 조회)
  const mockLessonData = {
    lessonId: params.lessonId,
    lessonTitle: `레슨 ${params.lessonId} - React 기초`,
    progressPercent: 95, // 시험 조건 충족
    hasPassedExam: false,
    canRetake: false
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ExamPage {...mockLessonData} />
      </div>
    </div>
  );
}










