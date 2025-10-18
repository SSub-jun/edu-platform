-- edu-platform Supabase 마이그레이션 스크립트
-- 생성일: 2025-10-18
-- 주의: Supabase SQL Editor에서 실행

-- Enums 생성
CREATE TYPE "UserRole" AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE "ProgressStatus" AS ENUM ('inProgress', 'completed');
CREATE TYPE "ExamStatus" AS ENUM ('inProgress', 'submitted');
CREATE TYPE "OtpPurpose" AS ENUM ('signup');
CREATE TYPE "PortalSelectionMode" AS ENUM ('RANDOM', 'MANUAL');

-- Companies 테이블
CREATE TABLE "companies" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "inviteCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- Company Lessons 테이블
CREATE TABLE "company_lessons" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_lessons_pkey" PRIMARY KEY ("id")
);

-- Users 테이블
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'student',
  "phone" TEXT,
  "phoneVerifiedAt" TIMESTAMP(3),
  "email" TEXT,
  "companyId" TEXT,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Sessions 테이블
CREATE TABLE "sessions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceInfo" TEXT,
  "ip" TEXT,
  "refreshTokenHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),

  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Subjects 테이블
CREATE TABLE "subjects" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- Lessons 테이블
CREATE TABLE "lessons" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- Video Parts 테이블
CREATE TABLE "video_parts" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "durationMs" INTEGER NOT NULL,
  "videoUrl" TEXT,
  "thumbnailUrl" TEXT,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "video_parts_pkey" PRIMARY KEY ("id")
);

-- Subject Progress 테이블
CREATE TABLE "subject_progress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastLessonId" TEXT,
  "lastPartId" TEXT,
  "lastPlayedMs" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "subject_progress_pkey" PRIMARY KEY ("id")
);

-- Progress 테이블
CREATE TABLE "progress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxReachedSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "videoDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "ProgressStatus" NOT NULL DEFAULT 'inProgress',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- Questions 테이블
CREATE TABLE "questions" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "lessonId" TEXT,
  "stem" TEXT NOT NULL,
  "explanation" TEXT,
  "answerIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- Choices 테이블
CREATE TABLE "choices" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "isAnswer" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "choices_pkey" PRIMARY KEY ("id")
);

-- Exam Attempts 테이블
CREATE TABLE "exam_attempts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "lessonId" TEXT,
  "attemptNumber" INTEGER NOT NULL DEFAULT 1,
  "status" "ExamStatus" NOT NULL DEFAULT 'inProgress',
  "score" DOUBLE PRECISION,
  "passed" BOOLEAN,
  "questionIds" JSONB,
  "answers" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- OTP Requests 테이블
CREATE TABLE "otp_requests" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "purpose" "OtpPurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- Portal Exam Banks 테이블
CREATE TABLE "portal_exam_banks" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "portal_exam_banks_pkey" PRIMARY KEY ("id")
);

-- Portal Questions 테이블
CREATE TABLE "portal_questions" (
  "id" TEXT NOT NULL,
  "bankId" TEXT NOT NULL,
  "stem" TEXT NOT NULL,
  "answerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "portal_questions_pkey" PRIMARY KEY ("id")
);

-- Portal Choices 테이블
CREATE TABLE "portal_choices" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "label" TEXT NOT NULL,

  CONSTRAINT "portal_choices_pkey" PRIMARY KEY ("id")
);

-- Portal Exam Sessions 테이블
CREATE TABLE "portal_exam_sessions" (
  "id" TEXT NOT NULL,
  "sessionNo" INTEGER NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "bankId" TEXT,
  "mode" "PortalSelectionMode" NOT NULL,
  "questionCount" INTEGER NOT NULL DEFAULT 20,
  "timeLimitMinutes" INTEGER NOT NULL DEFAULT 30,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "portal_exam_sessions_pkey" PRIMARY KEY ("id")
);

-- Portal Session Questions 테이블
CREATE TABLE "portal_session_questions" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,

  CONSTRAINT "portal_session_questions_pkey" PRIMARY KEY ("id")
);

-- Portal Participants 테이블
CREATE TABLE "portal_participants" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "pin4" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "portal_participants_pkey" PRIMARY KEY ("id")
);

-- Portal Attempts 테이블
CREATE TABLE "portal_attempts" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "score" INTEGER,
  "passed" BOOLEAN,

  CONSTRAINT "portal_attempts_pkey" PRIMARY KEY ("id")
);

-- Portal Answers 테이블
CREATE TABLE "portal_answers" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "choiceId" TEXT NOT NULL,

  CONSTRAINT "portal_answers_pkey" PRIMARY KEY ("id")
);

-- QnA Posts 테이블
CREATE TABLE "qna_posts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "qna_posts_pkey" PRIMARY KEY ("id")
);

-- QnA Replies 테이블
CREATE TABLE "qna_replies" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "qna_replies_pkey" PRIMARY KEY ("id")
);

-- 고유 제약 조건 추가
ALTER TABLE "companies" ADD CONSTRAINT "companies_inviteCode_key" UNIQUE ("inviteCode");
ALTER TABLE "company_lessons" ADD CONSTRAINT "company_lessons_companyId_lessonId_key" UNIQUE ("companyId", "lessonId");
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
ALTER TABLE "users" ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");
ALTER TABLE "subject_progress" ADD CONSTRAINT "subject_progress_userId_subjectId_key" UNIQUE ("userId", "subjectId");
ALTER TABLE "progress" ADD CONSTRAINT "progress_userId_lessonId_key" UNIQUE ("userId", "lessonId");
ALTER TABLE "portal_exam_sessions" ADD CONSTRAINT "portal_exam_sessions_code_key" UNIQUE ("code");
ALTER TABLE "portal_session_questions" ADD CONSTRAINT "portal_session_questions_sessionId_questionId_key" UNIQUE ("sessionId", "questionId");
ALTER TABLE "portal_participants" ADD CONSTRAINT "portal_participants_sessionId_pin4_key" UNIQUE ("sessionId", "pin4");
ALTER TABLE "portal_attempts" ADD CONSTRAINT "portal_attempts_sessionId_participantId_key" UNIQUE ("sessionId", "participantId");
ALTER TABLE "portal_answers" ADD CONSTRAINT "portal_answers_attemptId_questionId_key" UNIQUE ("attemptId", "questionId");

-- 외래키 제약 조건 추가
ALTER TABLE "company_lessons" ADD CONSTRAINT "company_lessons_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_lessons" ADD CONSTRAINT "company_lessons_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_parts" ADD CONSTRAINT "video_parts_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_progress" ADD CONSTRAINT "subject_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_progress" ADD CONSTRAINT "subject_progress_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "progress" ADD CONSTRAINT "progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "progress" ADD CONSTRAINT "progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "choices" ADD CONSTRAINT "choices_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_questions" ADD CONSTRAINT "portal_questions_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "portal_exam_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_choices" ADD CONSTRAINT "portal_choices_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "portal_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_exam_sessions" ADD CONSTRAINT "portal_exam_sessions_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "portal_exam_banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "portal_session_questions" ADD CONSTRAINT "portal_session_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "portal_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_session_questions" ADD CONSTRAINT "portal_session_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "portal_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_participants" ADD CONSTRAINT "portal_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "portal_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_attempts" ADD CONSTRAINT "portal_attempts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "portal_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_attempts" ADD CONSTRAINT "portal_attempts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "portal_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_answers" ADD CONSTRAINT "portal_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "portal_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_answers" ADD CONSTRAINT "portal_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "portal_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qna_posts" ADD CONSTRAINT "qna_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qna_replies" ADD CONSTRAINT "qna_replies_postId_fkey" FOREIGN KEY ("postId") REFERENCES "qna_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qna_replies" ADD CONSTRAINT "qna_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 인덱스 생성
CREATE INDEX "sessions_userId_revokedAt_idx" ON "sessions"("userId", "revokedAt");
CREATE INDEX "questions_subjectId_idx" ON "questions"("subjectId");
CREATE INDEX "questions_lessonId_idx" ON "questions"("lessonId");
CREATE INDEX "exam_attempts_userId_subjectId_idx" ON "exam_attempts"("userId", "subjectId");
CREATE INDEX "exam_attempts_userId_subjectId_attemptNumber_idx" ON "exam_attempts"("userId", "subjectId", "attemptNumber");
CREATE INDEX "otp_requests_phone_purpose_createdAt_idx" ON "otp_requests"("phone", "purpose", "createdAt");
CREATE INDEX "portal_questions_bankId_idx" ON "portal_questions"("bankId");
CREATE INDEX "portal_choices_questionId_idx" ON "portal_choices"("questionId");
CREATE INDEX "portal_session_questions_sessionId_idx" ON "portal_session_questions"("sessionId");
CREATE INDEX "portal_participants_sessionId_idx" ON "portal_participants"("sessionId");
CREATE INDEX "portal_attempts_sessionId_idx" ON "portal_attempts"("sessionId");
CREATE INDEX "portal_answers_attemptId_idx" ON "portal_answers"("attemptId");
CREATE INDEX "portal_answers_questionId_idx" ON "portal_answers"("questionId");
CREATE INDEX "qna_posts_userId_idx" ON "qna_posts"("userId");
CREATE INDEX "qna_posts_createdAt_idx" ON "qna_posts"("createdAt");
CREATE INDEX "qna_replies_postId_idx" ON "qna_replies"("postId");

-- 완료 메시지
SELECT 'Supabase 데이터베이스 마이그레이션 완료!' as status;
