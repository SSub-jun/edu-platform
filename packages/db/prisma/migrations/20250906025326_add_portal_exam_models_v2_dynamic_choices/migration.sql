-- CreateEnum
CREATE TYPE "PortalSelectionMode" AS ENUM ('RANDOM', 'MANUAL');

-- CreateTable
CREATE TABLE "portal_exam_banks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_exam_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_questions" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_choices" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "portal_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_exam_sessions" (
    "id" TEXT NOT NULL,
    "sessionNo" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bankId" TEXT,
    "mode" "PortalSelectionMode" NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 20,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_session_questions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "portal_session_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_participants" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pin4" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "portal_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,

    CONSTRAINT "portal_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portal_questions_bankId_idx" ON "portal_questions"("bankId");

-- CreateIndex
CREATE INDEX "portal_choices_questionId_idx" ON "portal_choices"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_exam_sessions_code_key" ON "portal_exam_sessions"("code");

-- CreateIndex
CREATE INDEX "portal_session_questions_sessionId_idx" ON "portal_session_questions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_session_questions_sessionId_questionId_key" ON "portal_session_questions"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "portal_participants_sessionId_idx" ON "portal_participants"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_participants_sessionId_pin4_key" ON "portal_participants"("sessionId", "pin4");

-- CreateIndex
CREATE INDEX "portal_attempts_sessionId_idx" ON "portal_attempts"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_attempts_sessionId_participantId_key" ON "portal_attempts"("sessionId", "participantId");

-- CreateIndex
CREATE INDEX "portal_answers_attemptId_idx" ON "portal_answers"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_answers_attemptId_questionId_key" ON "portal_answers"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "portal_questions" ADD CONSTRAINT "portal_questions_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "portal_exam_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_choices" ADD CONSTRAINT "portal_choices_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "portal_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_exam_sessions" ADD CONSTRAINT "portal_exam_sessions_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "portal_exam_banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_session_questions" ADD CONSTRAINT "portal_session_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "portal_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_session_questions" ADD CONSTRAINT "portal_session_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "portal_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_participants" ADD CONSTRAINT "portal_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "portal_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_attempts" ADD CONSTRAINT "portal_attempts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "portal_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_attempts" ADD CONSTRAINT "portal_attempts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "portal_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_answers" ADD CONSTRAINT "portal_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "portal_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
