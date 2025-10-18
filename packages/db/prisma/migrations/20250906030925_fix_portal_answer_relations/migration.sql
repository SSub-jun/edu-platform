-- CreateIndex
CREATE INDEX "portal_answers_questionId_idx" ON "portal_answers"("questionId");

-- AddForeignKey
ALTER TABLE "portal_answers" ADD CONSTRAINT "portal_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "portal_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
