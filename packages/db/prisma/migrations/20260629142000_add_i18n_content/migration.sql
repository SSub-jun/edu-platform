CREATE TABLE "subject_translations" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lesson_translations" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "video_subtitles" (
    "id" TEXT NOT NULL,
    "videoPartId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'vtt',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_subtitles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_translations" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "choice_translations" (
    "id" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "choice_translations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subject_translations_subjectId_locale_key" ON "subject_translations"("subjectId", "locale");
CREATE INDEX "subject_translations_locale_idx" ON "subject_translations"("locale");

CREATE UNIQUE INDEX "lesson_translations_lessonId_locale_key" ON "lesson_translations"("lessonId", "locale");
CREATE INDEX "lesson_translations_locale_idx" ON "lesson_translations"("locale");

CREATE UNIQUE INDEX "video_subtitles_videoPartId_locale_key" ON "video_subtitles"("videoPartId", "locale");
CREATE INDEX "video_subtitles_locale_idx" ON "video_subtitles"("locale");

CREATE UNIQUE INDEX "question_translations_questionId_locale_key" ON "question_translations"("questionId", "locale");
CREATE INDEX "question_translations_locale_idx" ON "question_translations"("locale");

CREATE UNIQUE INDEX "choice_translations_choiceId_locale_key" ON "choice_translations"("choiceId", "locale");
CREATE INDEX "choice_translations_locale_idx" ON "choice_translations"("locale");

ALTER TABLE "subject_translations" ADD CONSTRAINT "subject_translations_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_translations" ADD CONSTRAINT "lesson_translations_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_subtitles" ADD CONSTRAINT "video_subtitles_videoPartId_fkey" FOREIGN KEY ("videoPartId") REFERENCES "video_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_translations" ADD CONSTRAINT "question_translations_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "choice_translations" ADD CONSTRAINT "choice_translations_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "choices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

