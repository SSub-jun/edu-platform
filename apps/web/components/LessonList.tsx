'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  isLocked: boolean;
  progressPercent: number;
  isCompleted: boolean;
}

interface LessonListProps {
  lessons: Lesson[];
  onLessonClick: (lessonId: string) => void;
}

export default function LessonList({ lessons, onLessonClick }: LessonListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleLessonClick = async (lesson: Lesson) => {
    if (lesson.isLocked) {
      alert('이전 레슨을 완료해야 이 레슨에 접근할 수 있습니다.');
      return;
    }

    setLoading(lesson.id);
    try {
      onLessonClick(lesson.id);
      // 레슨 학습 페이지로 이동 (실제 구현에서는 해당 페이지로 라우팅)
      router.push(`/lesson/${lesson.id}`);
    } catch (error) {
      console.error('레슨 접근 오류:', error);
      alert('레슨 접근 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return '#4caf50';
    if (progress >= 50) return '#ffa726';
    return '#ff6b6b';
  };

  const getProgressText = (progress: number) => {
    if (progress >= 90) return '완료';
    if (progress >= 50) return '진행 중';
    return '미시작';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{
        marginBottom: '20px',
        fontSize: '24px',
        fontWeight: 'bold',
      }}>
        레슨 목록
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: 'white',
              cursor: lesson.isLocked ? 'not-allowed' : 'pointer',
              opacity: lesson.isLocked ? 0.6 : 1,
              transition: 'all 0.2s ease',
              ...(lesson.isLocked ? {} : {
                ':hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transform: 'translateY(-2px)',
                }
              })
            }}
            onClick={() => handleLessonClick(lesson)}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: lesson.isLocked ? '#ccc' : '#0070f3',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}>
                  {lesson.order}
                </div>
                
                <div>
                  <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: lesson.isLocked ? '#999' : '#333',
                  }}>
                    {lesson.title}
                  </h3>
                  <p style={{
                    margin: '0',
                    fontSize: '14px',
                    color: '#666',
                  }}>
                    {lesson.description}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* 진행률 표시 */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '2px',
                  }}>
                    진행률
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: getProgressColor(lesson.progressPercent),
                  }}>
                    {lesson.progressPercent.toFixed(1)}%
                  </div>
                </div>

                {/* 상태 뱃지 */}
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  backgroundColor: lesson.isLocked ? '#ff6b6b' : getProgressColor(lesson.progressPercent),
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>
                  {lesson.isLocked ? '🔒 잠김' : getProgressText(lesson.progressPercent)}
                </div>

                {/* 다음 학습 CTA */}
                {!lesson.isLocked && lesson.progressPercent < 90 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLessonClick(lesson);
                    }}
                    disabled={loading === lesson.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      opacity: loading === lesson.id ? 0.6 : 1,
                    }}
                  >
                    {loading === lesson.id ? '로딩...' : '다음 학습'}
                  </button>
                )}

                {/* 완료 표시 */}
                {lesson.isCompleted && (
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>
                    ✅ 완료
                  </div>
                )}
              </div>
            </div>

            {/* 진행률 바 */}
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#f0f0f0',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${lesson.progressPercent}%`,
                height: '100%',
                backgroundColor: getProgressColor(lesson.progressPercent),
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* 잠금 메시지 */}
            {lesson.isLocked && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#856404',
              }}>
                🔒 이전 레슨을 완료해야 이 레슨에 접근할 수 있습니다.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
