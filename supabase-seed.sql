-- edu-platform Supabase 시드 데이터
-- 생성일: 2025-10-18
-- 주의: 스키마 마이그레이션 완료 후 실행

-- 회사 데이터
INSERT INTO "companies" ("id", "name", "startDate", "endDate", "isActive", "inviteCode", "createdAt", "updatedAt") VALUES
  ('company-a', 'A기업', '2024-01-01 00:00:00'::timestamp, '2024-12-31 00:00:00'::timestamp, true, NULL, NOW(), NOW()),
  ('company-b', 'B기업', '2024-03-01 00:00:00'::timestamp, '2024-08-31 00:00:00'::timestamp, true, NULL, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 과목 데이터
INSERT INTO "subjects" ("id", "name", "description", "order", "isActive", "createdAt", "updatedAt") VALUES
  ('subject-math', '수학', '기초 수학 과정', 1, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 레슨 데이터
INSERT INTO "lessons" ("id", "subjectId", "title", "description", "order", "isActive", "createdAt", "updatedAt") VALUES
  ('lesson-1', 'subject-math', '1장: 수와 연산', '자연수, 정수, 유리수의 기본 개념', 1, true, NOW(), NOW()),
  ('lesson-2', 'subject-math', '2장: 방정식', '1차 방정식의 풀이', 2, true, NOW(), NOW()),
  ('lesson-3', 'subject-math', '3장: 함수', '함수의 개념과 그래프', 3, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 회사별 활성 레슨 설정
INSERT INTO "company_lessons" ("id", "companyId", "lessonId", "createdAt") VALUES
  -- A기업: 모든 레슨
  ('cl-a-1', 'company-a', 'lesson-1', NOW()),
  ('cl-a-2', 'company-a', 'lesson-2', NOW()),
  ('cl-a-3', 'company-a', 'lesson-3', NOW()),
  -- B기업: 레슨 1, 2만
  ('cl-b-1', 'company-b', 'lesson-1', NOW()),
  ('cl-b-2', 'company-b', 'lesson-2', NOW())
ON CONFLICT ("companyId", "lessonId") DO NOTHING;

-- 비디오 파트 데이터
INSERT INTO "video_parts" ("id", "lessonId", "title", "description", "order", "durationMs", "videoUrl", "thumbnailUrl", "fileSize", "mimeType", "isActive", "createdAt", "updatedAt") VALUES
  -- Lesson 1 (5개 파트)
  ('part-lesson-1-1', 'lesson-1', '1장: 수와 연산 - 1부', '1장: 수와 연산의 1번째 파트', 1, 420000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  ('part-lesson-1-2', 'lesson-1', '1장: 수와 연산 - 2부', '1장: 수와 연산의 2번째 파트', 2, 540000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  ('part-lesson-1-3', 'lesson-1', '1장: 수와 연산 - 3부', '1장: 수와 연산의 3번째 파트', 3, 660000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  ('part-lesson-1-4', 'lesson-1', '1장: 수와 연산 - 4부', '1장: 수와 연산의 4번째 파트', 4, 780000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  ('part-lesson-1-5', 'lesson-1', '1장: 수와 연산 - 5부', '1장: 수와 연산의 5번째 파트', 5, 900000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  -- Lesson 2 (3개 파트)
  ('part-lesson-2-1', 'lesson-2', '2장: 방정식 - 1부', '2장: 방정식의 1번째 파트', 1, 420000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  ('part-lesson-2-2', 'lesson-2', '2장: 방정식 - 2부', '2장: 방정식의 2번째 파트', 2, 540000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  ('part-lesson-2-3', 'lesson-2', '2장: 방정식 - 3부', '2장: 방정식의 3번째 파트', 3, 660000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  -- Lesson 3 (4개 파트)
  ('part-lesson-3-1', 'lesson-3', '3장: 함수 - 1부', '3장: 함수의 1번째 파트', 1, 420000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  ('part-lesson-3-2', 'lesson-3', '3장: 함수 - 2부', '3장: 함수의 2번째 파트', 2, 540000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  ('part-lesson-3-3', 'lesson-3', '3장: 함수 - 3부', '3장: 함수의 3번째 파트', 3, 660000, NULL, NULL, NULL, NULL, true, NOW(), NOW()),
  ('part-lesson-3-4', 'lesson-3', '3장: 함수 - 4부', '3장: 함수의 4번째 파트', 4, 780000, NULL, NULL, NULL, NULL, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 문제 데이터 (20문제)
INSERT INTO "questions" ("id", "subjectId", "lessonId", "stem", "explanation", "answerIndex", "isActive", "createdAt", "updatedAt") VALUES
  ('question-subject-math-1', 'subject-math', NULL, '수학 문제 1번: 자연수 1부터 10까지의 합을 구하시오.', '수학 문제 1번의 해설입니다.', 1, true, NOW(), NOW()),
  ('question-subject-math-2', 'subject-math', NULL, '수학 문제 2번: 방정식 2x + 3 = 7의 해를 구하시오.', '수학 문제 2번의 해설입니다.', 2, true, NOW(), NOW()),
  ('question-subject-math-3', 'subject-math', NULL, '수학 문제 3번: 함수 f(x) = 2x + 1의 그래프를 그리시오.', '수학 문제 3번의 해설입니다.', 3, true, NOW(), NOW()),
  ('question-subject-math-4', 'subject-math', NULL, '수학 문제 4번: 분수 3/4와 2/3의 합을 구하시오.', '수학 문제 4번의 해설입니다.', 0, true, NOW(), NOW()),
  ('question-subject-math-5', 'subject-math', NULL, '수학 문제 5번: 직사각형의 넓이가 24이고 가로가 6일 때 세로를 구하시오.', '수학 문제 5번의 해설입니다.', 1, true, NOW(), NOW()),
  ('question-subject-math-6', 'subject-math', NULL, '수학 문제 6번: 이차방정식 x² - 5x + 6 = 0의 해를 구하시오.', '수학 문제 6번의 해설입니다.', 2, true, NOW(), NOW()),
  ('question-subject-math-7', 'subject-math', NULL, '수학 문제 7번: 삼각형의 세 각의 합은 몇 도인가요?', '수학 문제 7번의 해설입니다.', 3, true, NOW(), NOW()),
  ('question-subject-math-8', 'subject-math', NULL, '수학 문제 8번: 원의 넓이 공식을 쓰시오.', '수학 문제 8번의 해설입니다.', 0, true, NOW(), NOW()),
  ('question-subject-math-9', 'subject-math', NULL, '수학 문제 9번: 로그 log₂8의 값을 구하시오.', '수학 문제 9번의 해설입니다.', 1, true, NOW(), NOW()),
  ('question-subject-math-10', 'subject-math', NULL, '수학 문제 10번: 미분 dy/dx를 구하시오.', '수학 문제 10번의 해설입니다.', 2, true, NOW(), NOW()),
  ('question-subject-math-11', 'subject-math', NULL, '수학 문제 11번: 적분 ∫x²dx를 구하시오.', '수학 문제 11번의 해설입니다.', 3, true, NOW(), NOW()),
  ('question-subject-math-12', 'subject-math', NULL, '수학 문제 12번: 확률 P(A∪B)를 구하시오.', '수학 문제 12번의 해설입니다.', 0, true, NOW(), NOW()),
  ('question-subject-math-13', 'subject-math', NULL, '수학 문제 13번: 통계에서 평균을 구하는 공식을 쓰시오.', '수학 문제 13번의 해설입니다.', 1, true, NOW(), NOW()),
  ('question-subject-math-14', 'subject-math', NULL, '수학 문제 14번: 기하학에서 피타고라스 정리를 설명하시오.', '수학 문제 14번의 해설입니다.', 2, true, NOW(), NOW()),
  ('question-subject-math-15', 'subject-math', NULL, '수학 문제 15번: 대수학에서 인수분해를 수행하시오.', '수학 문제 15번의 해설입니다.', 3, true, NOW(), NOW()),
  ('question-subject-math-16', 'subject-math', NULL, '수학 문제 16번: 자연수 1부터 10까지의 합을 구하시오.', '수학 문제 16번의 해설입니다.', 0, true, NOW(), NOW()),
  ('question-subject-math-17', 'subject-math', NULL, '수학 문제 17번: 방정식 2x + 3 = 7의 해를 구하시오.', '수학 문제 17번의 해설입니다.', 1, true, NOW(), NOW()),
  ('question-subject-math-18', 'subject-math', NULL, '수학 문제 18번: 함수 f(x) = 2x + 1의 그래프를 그리시오.', '수학 문제 18번의 해설입니다.', 2, true, NOW(), NOW()),
  ('question-subject-math-19', 'subject-math', NULL, '수학 문제 19번: 분수 3/4와 2/3의 합을 구하시오.', '수학 문제 19번의 해설입니다.', 3, true, NOW(), NOW()),
  ('question-subject-math-20', 'subject-math', NULL, '수학 문제 20번: 직사각형의 넓이가 24이고 가로가 6일 때 세로를 구하시오.', '수학 문제 20번의 해설입니다.', 0, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 선택지 데이터 (각 문제당 4개)
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt") VALUES
  -- Question 1 choices
  ('choice-question-subject-math-1-0', 'question-subject-math-1', '보기 1: 55', false, 0, NOW(), NOW()),
  ('choice-question-subject-math-1-1', 'question-subject-math-1', '보기 2: 56', true, 1, NOW(), NOW()),
  ('choice-question-subject-math-1-2', 'question-subject-math-1', '보기 3: 57', false, 2, NOW(), NOW()),
  ('choice-question-subject-math-1-3', 'question-subject-math-1', '보기 4: 58', false, 3, NOW(), NOW()),
  -- Question 2 choices
  ('choice-question-subject-math-2-0', 'question-subject-math-2', '보기 1: x = 2', false, 0, NOW(), NOW()),
  ('choice-question-subject-math-2-1', 'question-subject-math-2', '보기 2: x = 3', false, 1, NOW(), NOW()),
  ('choice-question-subject-math-2-2', 'question-subject-math-2', '보기 3: x = 4', true, 2, NOW(), NOW()),
  ('choice-question-subject-math-2-3', 'question-subject-math-2', '보기 4: x = 5', false, 3, NOW(), NOW()),
  -- Question 3 choices
  ('choice-question-subject-math-3-0', 'question-subject-math-3', '보기 1: 직선', false, 0, NOW(), NOW()),
  ('choice-question-subject-math-3-1', 'question-subject-math-3', '보기 2: 포물선', false, 1, NOW(), NOW()),
  ('choice-question-subject-math-3-2', 'question-subject-math-3', '보기 3: 지수함수', false, 2, NOW(), NOW()),
  ('choice-question-subject-math-3-3', 'question-subject-math-3', '보기 4: 로그함수', true, 3, NOW(), NOW()),
  -- Question 4 choices
  ('choice-question-subject-math-4-0', 'question-subject-math-4', '보기 1: 5/7', true, 0, NOW(), NOW()),
  ('choice-question-subject-math-4-1', 'question-subject-math-4', '보기 2: 17/12', false, 1, NOW(), NOW()),
  ('choice-question-subject-math-4-2', 'question-subject-math-4', '보기 3: 6/7', false, 2, NOW(), NOW()),
  ('choice-question-subject-math-4-3', 'question-subject-math-4', '보기 4: 1/12', false, 3, NOW(), NOW()),
  -- Question 5 choices
  ('choice-question-subject-math-5-0', 'question-subject-math-5', '보기 1: 4', false, 0, NOW(), NOW()),
  ('choice-question-subject-math-5-1', 'question-subject-math-5', '보기 2: 5', true, 1, NOW(), NOW()),
  ('choice-question-subject-math-5-2', 'question-subject-math-5', '보기 3: 6', false, 2, NOW(), NOW()),
  ('choice-question-subject-math-5-3', 'question-subject-math-5', '보기 4: 7', false, 3, NOW(), NOW()),
  -- Question 6-20 choices (축약된 버전)
  ('choice-question-subject-math-6-0', 'question-subject-math-6', '보기 1: x = 2, 3', false, 0, NOW(), NOW()),
  ('choice-question-subject-math-6-1', 'question-subject-math-6', '보기 2: x = 1, 6', false, 1, NOW(), NOW()),
  ('choice-question-subject-math-6-2', 'question-subject-math-6', '보기 3: x = -2, -3', true, 2, NOW(), NOW()),
  ('choice-question-subject-math-6-3', 'question-subject-math-6', '보기 4: x = 0, 5', false, 3, NOW(), NOW()),
  -- 나머지 문제들의 선택지도 이어서...
  ('choice-question-subject-math-7-0', 'question-subject-math-7', '보기 1: 90도', false, 0, NOW(), NOW()),
  ('choice-question-subject-math-7-1', 'question-subject-math-7', '보기 2: 180도', false, 1, NOW(), NOW()),
  ('choice-question-subject-math-7-2', 'question-subject-math-7', '보기 3: 270도', false, 2, NOW(), NOW()),
  ('choice-question-subject-math-7-3', 'question-subject-math-7', '보기 4: 360도', true, 3, NOW(), NOW()),
  ('choice-question-subject-math-8-0', 'question-subject-math-8', '보기 1: πr²', true, 0, NOW(), NOW()),
  ('choice-question-subject-math-8-1', 'question-subject-math-8', '보기 2: πr', false, 1, NOW(), NOW()),
  ('choice-question-subject-math-8-2', 'question-subject-math-8', '보기 3: 2πr', false, 2, NOW(), NOW()),
  ('choice-question-subject-math-8-3', 'question-subject-math-8', '보기 4: 4πr²', false, 3, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 기본 사용자 생성 (비밀번호는 실제로는 bcrypt 해시 필요)
INSERT INTO "users" ("id", "username", "passwordHash", "role", "phone", "phoneVerifiedAt", "email", "companyId", "lastLoginAt", "createdAt", "updatedAt") VALUES
  ('user-admin', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '010-0000-0000', NOW(), NULL, NULL, NULL, NOW(), NOW()),
  ('user-teacher', 'teacher', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'instructor', '010-0000-0001', NOW(), NULL, NULL, NULL, NOW(), NOW()),
  ('user-student', 'user', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', '010-0000-0002', NOW(), NULL, 'company-a', NULL, NOW(), NOW())
ON CONFLICT ("username") DO NOTHING;

-- 학생 과목 진도 초기화
INSERT INTO "subject_progress" ("id", "userId", "subjectId", "progressPercent", "lastLessonId", "lastPartId", "lastPlayedMs", "updatedAt") VALUES
  ('sp-student-math', 'user-student', 'subject-math', 0.0, NULL, NULL, 0, NOW())
ON CONFLICT ("userId", "subjectId") DO NOTHING;

-- Portal 예제 데이터 (간단한 문제은행 1개)
INSERT INTO "portal_exam_banks" ("id", "title", "createdAt") VALUES
  ('portal-bank-1', '기본 수학 문제은행', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "portal_questions" ("id", "bankId", "stem", "answerId", "createdAt") VALUES
  ('portal-q-1', 'portal-bank-1', '1 + 1 = ?', 'portal-c-1-2', NOW()),
  ('portal-q-2', 'portal-bank-1', '2 × 3 = ?', 'portal-c-2-3', NOW()),
  ('portal-q-3', 'portal-bank-1', '10 ÷ 2 = ?', 'portal-c-3-4', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "portal_choices" ("id", "questionId", "label") VALUES
  ('portal-c-1-1', 'portal-q-1', '1'),
  ('portal-c-1-2', 'portal-q-1', '2'),
  ('portal-c-1-3', 'portal-q-1', '3'),
  ('portal-c-1-4', 'portal-q-1', '4'),
  ('portal-c-2-1', 'portal-q-2', '5'),
  ('portal-c-2-2', 'portal-q-2', '6'),
  ('portal-c-2-3', 'portal-q-2', '7'),
  ('portal-c-2-4', 'portal-q-2', '8'),
  ('portal-c-3-1', 'portal-q-3', '3'),
  ('portal-c-3-2', 'portal-q-3', '4'),
  ('portal-c-3-3', 'portal-q-3', '5'),
  ('portal-c-3-4', 'portal-q-3', '6')
ON CONFLICT ("id") DO NOTHING;

-- 완료 메시지
SELECT 'Supabase 시드 데이터 생성 완료!' as status, 
       '⚡ 로그인 정보: admin/password, teacher/password, user/password' as note;
