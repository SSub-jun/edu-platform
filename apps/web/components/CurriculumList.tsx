'use client';

import { useCurriculum } from '../lib/queries';
import LessonCard from './LessonCard';
import StatusBanner from './StatusBanner';
import styles from './CurriculumList.module.css';

export default function CurriculumList() {
  const { data: curriculum, isLoading, error } = useCurriculum();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>커리큘럼을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
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
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>배정된 과목이 없습니다.</p>
          <p>관리자에게 문의하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>나의 커리큘럼</h1>
        <p className={styles.subtitle}>
          배정된 과목과 레슨을 확인하고 학습을 진행하세요
        </p>
      </header>

      <div className={styles.subjects}>
        {curriculum.map((subject) => (
          <section key={subject.subjectId} className={styles.subject}>
            <div className={styles.subjectHeader}>
              <h2 className={styles.subjectTitle}>{subject.subjectTitle}</h2>
              <div className={styles.subjectStats}>
                총 {subject.lessons.length}개 레슨
              </div>
            </div>

            <div className={styles.lessonGrid}>
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

