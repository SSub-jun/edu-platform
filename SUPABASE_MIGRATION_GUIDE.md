# Supabase 마이그레이션 가이드

## 🚨 현재 문제

Railway 배포 후 다음 오류 발생:
```
The table `public.company_lessons` does not exist in the current database.
```

**원인**: Prisma 스키마는 최신이지만, Supabase 데이터베이스에 마이그레이션이 적용되지 않음

## ✅ 해결 방법

### 방법 1: Railway에서 자동 마이그레이션 (권장)

Railway는 빌드 시 자동으로 마이그레이션을 실행하지 않습니다. 수동으로 설정해야 합니다.

#### A. Railway Dashboard에서 실행

1. Railway Dashboard → 프로젝트 선택
2. API 서비스 클릭
3. **Settings** → **Deploy**
4. **Build Command** 수정:

```bash
pnpm install --frozen-lockfile --filter @edu-platform/db --filter api && cd packages/db && npx prisma generate && npx prisma migrate deploy && cd ../../apps/api && pnpm build
```

5. 재배포

#### B. 또는 Start Command에 추가 (비권장 - 시작 시간 증가)

**Start Command**:
```bash
cd packages/db && npx prisma migrate deploy && cd ../../apps/api && node dist/main.js
```

### 방법 2: 로컬에서 Supabase에 직접 마이그레이션

```bash
# 1. packages/db/.env 파일 생성 또는 수정
cd packages/db
echo "DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres" > .env

# 2. 마이그레이션 실행
pnpm prisma migrate deploy

# 3. 확인
pnpm prisma db pull
```

### 방법 3: Supabase SQL Editor에서 직접 실행

1. Supabase Dashboard → SQL Editor
2. 다음 SQL 실행:

```sql
-- company_lessons 테이블 생성
CREATE TABLE IF NOT EXISTS "public"."company_lessons" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_lessons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_lessons_companyId_lessonId_key" UNIQUE ("companyId", "lessonId")
);

-- 외래 키 제약 조건
ALTER TABLE "public"."company_lessons" 
  ADD CONSTRAINT "company_lessons_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."company_lessons" 
  ADD CONSTRAINT "company_lessons_lessonId_fkey" 
  FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- company_subjects 테이블도 없다면 생성
CREATE TABLE IF NOT EXISTS "public"."company_subjects" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_subjects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_subjects_companyId_subjectId_key" UNIQUE ("companyId", "subjectId")
);

ALTER TABLE "public"."company_subjects" 
  ADD CONSTRAINT "company_subjects_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."company_subjects" 
  ADD CONSTRAINT "company_subjects_subjectId_fkey" 
  FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cohort 관련 테이블들도 생성
CREATE TABLE IF NOT EXISTS "public"."cohorts" (
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

CREATE INDEX IF NOT EXISTS "cohorts_companyId_isActive_idx" ON "public"."cohorts"("companyId", "isActive");

ALTER TABLE "public"."cohorts" 
  ADD CONSTRAINT "cohorts_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."cohort_subjects" (
  "id" TEXT NOT NULL,
  "cohortId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cohort_subjects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cohort_subjects_cohortId_subjectId_key" UNIQUE ("cohortId", "subjectId")
);

ALTER TABLE "public"."cohort_subjects" 
  ADD CONSTRAINT "cohort_subjects_cohortId_fkey" 
  FOREIGN KEY ("cohortId") REFERENCES "public"."cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."cohort_subjects" 
  ADD CONSTRAINT "cohort_subjects_subjectId_fkey" 
  FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."user_cohorts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cohortId" TEXT NOT NULL,
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_cohorts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_cohorts_userId_cohortId_key" UNIQUE ("userId", "cohortId")
);

CREATE INDEX IF NOT EXISTS "user_cohorts_userId_idx" ON "public"."user_cohorts"("userId");
CREATE INDEX IF NOT EXISTS "user_cohorts_cohortId_idx" ON "public"."user_cohorts"("cohortId");

ALTER TABLE "public"."user_cohorts" 
  ADD CONSTRAINT "user_cohorts_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."user_cohorts" 
  ADD CONSTRAINT "user_cohorts_cohortId_fkey" 
  FOREIGN KEY ("cohortId") REFERENCES "public"."cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## 🎯 권장 순서

1. **즉시 해결** (방법 3): Supabase SQL Editor에서 테이블 생성
2. **장기 해결** (방법 1): Railway Build Command에 마이그레이션 추가

## 📋 마이그레이션 확인

```bash
# Supabase 데이터베이스 스키마 확인
cd packages/db
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres" pnpm prisma db pull

# 또는 Railway에서 로그 확인
# Railway Dashboard → Deployments → Build Logs
```

## ⚠️ 주의사항

- **Session Mode (포트 5432)** 사용 필수 (마이그레이션용)
- Transaction Mode (포트 6543)는 마이그레이션 불가
- 프로덕션 환경에서는 반드시 백업 후 실행
