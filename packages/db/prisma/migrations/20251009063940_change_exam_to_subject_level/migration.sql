/*
  Warnings:

  - You are about to drop the column `cycle` on the `exam_attempts` table. All the data in the column will be lost.
  - You are about to drop the column `tryIndex` on the `exam_attempts` table. All the data in the column will be lost.

*/
-- 기존 데이터 삭제 (구조 변경으로 인해 전체 초기화)
DELETE FROM "choices";
DELETE FROM "questions";
DELETE FROM "exam_attempts";
DELETE FROM "progress";

-- DropIndex
DROP INDEX "exam_attempts_userId_lessonId_cycle_idx";

-- DropIndex
DROP INDEX "exam_attempts_userId_lessonId_cycle_tryIndex_key";

-- AlterTable
ALTER TABLE "exam_attempts" DROP COLUMN "cycle",
DROP COLUMN "tryIndex",
ADD COLUMN     "attemptNumber" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "lessonId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "lessonId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "video_parts" ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- CreateIndex
CREATE INDEX "exam_attempts_userId_subjectId_idx" ON "exam_attempts"("userId", "subjectId");

-- CreateIndex
CREATE INDEX "exam_attempts_userId_subjectId_attemptNumber_idx" ON "exam_attempts"("userId", "subjectId", "attemptNumber");

-- CreateIndex
CREATE INDEX "questions_subjectId_idx" ON "questions"("subjectId");
