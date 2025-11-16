-- =====================================================
-- 교육 기수(Cohort) 시스템으로 마이그레이션
-- 기존 데이터를 보존하면서 새로운 구조로 전환
-- =====================================================

-- 1. 새로운 테이블 생성
CREATE TABLE IF NOT EXISTS "cohorts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cohort_subjects" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_cohorts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_cohorts_pkey" PRIMARY KEY ("id")
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS "cohorts_companyId_isActive_idx" ON "cohorts"("companyId", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "cohort_subjects_cohortId_subjectId_key" ON "cohort_subjects"("cohortId", "subjectId");
CREATE UNIQUE INDEX IF NOT EXISTS "user_cohorts_userId_cohortId_key" ON "user_cohorts"("userId", "cohortId");
CREATE INDEX IF NOT EXISTS "user_cohorts_userId_idx" ON "user_cohorts"("userId");
CREATE INDEX IF NOT EXISTS "user_cohorts_cohortId_idx" ON "user_cohorts"("cohortId");

-- 3. 외래키 제약조건 추가
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cohort_subjects" ADD CONSTRAINT "cohort_subjects_cohortId_fkey" 
    FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cohort_subjects" ADD CONSTRAINT "cohort_subjects_subjectId_fkey" 
    FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_cohorts" ADD CONSTRAINT "user_cohorts_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_cohorts" ADD CONSTRAINT "user_cohorts_cohortId_fkey" 
    FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. SubjectProgress에 cohortId 컬럼 추가
ALTER TABLE "subject_progress" ADD COLUMN IF NOT EXISTS "cohortId" TEXT;

-- 5. SubjectProgress에 인덱스 추가 (unique 제약조건은 유지)
CREATE INDEX IF NOT EXISTS "subject_progress_userId_cohortId_idx" 
    ON "subject_progress"("userId", "cohortId");
CREATE INDEX IF NOT EXISTS "subject_progress_userId_subjectId_cohortId_idx" 
    ON "subject_progress"("userId", "subjectId", "cohortId");

-- 6. SubjectProgress에 cohortId 외래키 추가
ALTER TABLE "subject_progress" ADD CONSTRAINT "subject_progress_cohortId_fkey" 
    FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. 기존 데이터 마이그레이션: Company의 startDate/endDate를 Cohort로 이동
-- 각 회사마다 "1기" Cohort 생성
INSERT INTO "cohorts" ("id", "companyId", "name", "startDate", "endDate", "isActive", "createdAt", "updatedAt")
SELECT 
    'cohort_' || c."id",
    c."id",
    '2025년 1기',
    c."startDate",
    c."endDate",
    c."isActive",
    NOW(),
    NOW()
FROM "companies" c
WHERE NOT EXISTS (
    SELECT 1 FROM "cohorts" ch WHERE ch."companyId" = c."id"
);

-- 8. 기존 CompanySubject 데이터를 CohortSubject로 복사
INSERT INTO "cohort_subjects" ("id", "cohortId", "subjectId", "createdAt")
SELECT 
    'cs_' || cs."id",
    'cohort_' || cs."companyId",
    cs."subjectId",
    NOW()
FROM "company_subjects" cs
WHERE EXISTS (
    SELECT 1 FROM "cohorts" ch WHERE ch."id" = 'cohort_' || cs."companyId"
)
ON CONFLICT ("cohortId", "subjectId") DO NOTHING;

-- 9. 기존 User를 UserCohort에 등록 (회사에 소속된 학생들)
INSERT INTO "user_cohorts" ("id", "userId", "cohortId", "enrolledAt", "createdAt")
SELECT 
    'uc_' || u."id",
    u."id",
    'cohort_' || u."companyId",
    u."createdAt",
    NOW()
FROM "users" u
WHERE u."companyId" IS NOT NULL
  AND u."role" = 'student'
  AND EXISTS (
    SELECT 1 FROM "cohorts" ch WHERE ch."id" = 'cohort_' || u."companyId"
  )
ON CONFLICT ("userId", "cohortId") DO NOTHING;

-- 10. 기존 SubjectProgress에 cohortId 설정
UPDATE "subject_progress" sp
SET "cohortId" = 'cohort_' || u."companyId"
FROM "users" u
WHERE sp."userId" = u."id"
  AND u."companyId" IS NOT NULL
  AND sp."cohortId" IS NULL
  AND EXISTS (
    SELECT 1 FROM "cohorts" ch WHERE ch."id" = 'cohort_' || u."companyId"
  );

-- 11. Company 테이블에서 startDate, endDate 컬럼 제거 (선택사항 - 나중에 실행)
-- ALTER TABLE "companies" DROP COLUMN IF EXISTS "startDate";
-- ALTER TABLE "companies" DROP COLUMN IF EXISTS "endDate";

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '마이그레이션 완료!';
    RAISE NOTICE '- Cohort 테이블 생성 및 데이터 이관 완료';
    RAISE NOTICE '- CohortSubject 테이블 생성 및 데이터 이관 완료';
    RAISE NOTICE '- UserCohort 테이블 생성 및 데이터 이관 완료';
    RAISE NOTICE '- SubjectProgress에 cohortId 추가 완료';
END $$;

