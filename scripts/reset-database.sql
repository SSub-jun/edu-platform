-- =====================================================
-- 교육 플랫폼 DB 초기화 스크립트
-- =====================================================
-- 주의: 이 스크립트는 모든 데이터를 삭제하고 처음부터 다시 생성합니다!

-- 1. 기존 테이블 모두 삭제 (순서 중요 - 외래키 제약조건 때문)
DROP TABLE IF EXISTS "qna_replies" CASCADE;
DROP TABLE IF EXISTS "qna_posts" CASCADE;
DROP TABLE IF EXISTS "portal_answers" CASCADE;
DROP TABLE IF EXISTS "portal_attempts" CASCADE;
DROP TABLE IF EXISTS "portal_participants" CASCADE;
DROP TABLE IF EXISTS "portal_session_questions" CASCADE;
DROP TABLE IF EXISTS "portal_exam_sessions" CASCADE;
DROP TABLE IF EXISTS "portal_choices" CASCADE;
DROP TABLE IF EXISTS "portal_questions" CASCADE;
DROP TABLE IF EXISTS "portal_exam_banks" CASCADE;
DROP TABLE IF EXISTS "otp_requests" CASCADE;
DROP TABLE IF EXISTS "exam_attempts" CASCADE;
DROP TABLE IF EXISTS "choices" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "progress" CASCADE;
DROP TABLE IF EXISTS "subject_progress" CASCADE;
DROP TABLE IF EXISTS "video_parts" CASCADE;
DROP TABLE IF EXISTS "company_subjects" CASCADE;
DROP TABLE IF EXISTS "company_lessons" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "lessons" CASCADE;
DROP TABLE IF EXISTS "subjects" CASCADE;
DROP TABLE IF EXISTS "companies" CASCADE;

-- Enum 타입 삭제
DROP TYPE IF EXISTS "OtpPurpose" CASCADE;
DROP TYPE IF EXISTS "ExamStatus" CASCADE;
DROP TYPE IF EXISTS "ProgressStatus" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "PortalSelectionMode" CASCADE;

-- 2. Enum 타입 생성
CREATE TYPE "UserRole" AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE "ProgressStatus" AS ENUM ('inProgress', 'completed');
CREATE TYPE "ExamStatus" AS ENUM ('inProgress', 'submitted');
CREATE TYPE "OtpPurpose" AS ENUM ('signup');
CREATE TYPE "PortalSelectionMode" AS ENUM ('RANDOM', 'MANUAL');

-- 3. 테이블 생성
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

CREATE TABLE "company_subjects" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "name" TEXT,
    "phone" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "email" TEXT,
    "companyId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "subject_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastLessonId" TEXT,
    "lastPartId" TEXT,
    "lastPlayedMs" INTEGER NOT NULL DEFAULT 0,
    "finalScore" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "completedAt" TIMESTAMP(3),
    "examAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastExamScore" DOUBLE PRECISION,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxReachedSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "videoDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ProgressStatus" NOT NULL DEFAULT 'inProgress',
    "completedAt" TIMESTAMP(3),
    "finalScore" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "lessonId" TEXT,
    "cycle" INTEGER NOT NULL DEFAULT 1,
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

-- QnA Tables
CREATE TABLE "qna_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qna_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "qna_replies" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qna_replies_pkey" PRIMARY KEY ("id")
);

-- 4. Unique 제약조건
CREATE UNIQUE INDEX "companies_inviteCode_key" ON "companies"("inviteCode");
CREATE UNIQUE INDEX "company_subjects_companyId_subjectId_key" ON "company_subjects"("companyId", "subjectId");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "subject_progress_userId_subjectId_key" ON "subject_progress"("userId", "subjectId");
CREATE UNIQUE INDEX "progress_userId_lessonId_key" ON "progress"("userId", "lessonId");

-- 5. 인덱스
CREATE INDEX "sessions_userId_revokedAt_idx" ON "sessions"("userId", "revokedAt");
CREATE INDEX "questions_subjectId_idx" ON "questions"("subjectId");
CREATE INDEX "questions_lessonId_idx" ON "questions"("lessonId");
CREATE INDEX "exam_attempts_userId_subjectId_idx" ON "exam_attempts"("userId", "subjectId");
CREATE INDEX "exam_attempts_userId_subjectId_attemptNumber_idx" ON "exam_attempts"("userId", "subjectId", "attemptNumber");
CREATE INDEX "otp_requests_phone_purpose_createdAt_idx" ON "otp_requests"("phone", "purpose", "createdAt");
CREATE INDEX "qna_posts_userId_idx" ON "qna_posts"("userId");
CREATE INDEX "qna_posts_createdAt_idx" ON "qna_posts"("createdAt");
CREATE INDEX "qna_replies_postId_idx" ON "qna_replies"("postId");

-- 6. 외래키 제약조건
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_subjects" ADD CONSTRAINT "company_subjects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_subjects" ADD CONSTRAINT "company_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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
ALTER TABLE "qna_posts" ADD CONSTRAINT "qna_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qna_replies" ADD CONSTRAINT "qna_replies_postId_fkey" FOREIGN KEY ("postId") REFERENCES "qna_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qna_replies" ADD CONSTRAINT "qna_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

