# Supabase 데이터베이스 현재 상태 분석

## 📊 확인 결과 (2025-11-16)

### ✅ 존재하는 테이블 (18개)
```
choices, cohort_subjects, cohorts, companies, company_subjects,
exam_attempts, lessons, otp_requests, progress, qna_posts,
qna_replies, questions, sessions, subject_progress, subjects,
user_cohorts, users, video_parts
```

### ❌ 없는 테이블
- **`company_lessons`** ← 500 에러의 원인!
- `_prisma_migrations` ← Prisma 마이그레이션 추적 테이블

## 🚨 발견된 문제

### 1. Prisma 마이그레이션 미사용
- `_prisma_migrations` 테이블이 없음
- 테이블이 수동으로 생성되었거나 다른 도구로 생성됨
- Prisma는 어떤 마이그레이션이 적용되었는지 추적 불가

### 2. 스키마 불일치
**companies 테이블:**
```sql
-- 현재 Supabase (NOT NULL)
startDate  | timestamp(3) | NOT NULL
endDate    | timestamp(3) | NOT NULL

-- Prisma 스키마 (nullable)
startDate     DateTime?
endDate       DateTime?
```

### 3. 누락된 테이블
**company_lessons** 테이블이 없어서 다음 코드가 실패:
```typescript
// progress.service.ts
include: {
  company: {
    include: {
      activeLessons: { // ← company_lessons 테이블 참조
        include: { lesson: true }
      }
    }
  }
}
```

## ✅ 해결 방법

### 옵션 1: company_lessons 테이블만 추가 (빠른 해결)

```sql
-- Supabase SQL Editor에서 실행
CREATE TABLE IF NOT EXISTS "public"."company_lessons" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_lessons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_lessons_companyId_lessonId_key" UNIQUE ("companyId", "lessonId")
);

ALTER TABLE "public"."company_lessons" 
  ADD CONSTRAINT "company_lessons_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."company_lessons" 
  ADD CONSTRAINT "company_lessons_lessonId_fkey" 
  FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 옵션 2: Prisma 마이그레이션 시스템 도입 (권장)

#### A. 현재 상태를 베이스라인으로 설정

```bash
# 1. _prisma_migrations 테이블 생성 및 현재 상태 기록
cd packages/db

# 2. 베이스라인 마이그레이션 생성
DATABASE_URL="postgresql://postgres.foakaexaaslaheygqbam:iRLX%21Y2aH.kH%26T4@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" \
pnpm prisma migrate resolve --applied "20251009105315_add_max_reached_seconds_to_progress"

# 3. company_lessons 테이블 추가를 위한 새 마이그레이션 생성
pnpm prisma migrate dev --name add_company_lessons_table
```

#### B. 또는 스키마 동기화

```bash
# 1. 현재 DB 상태를 Prisma 스키마로 가져오기
DATABASE_URL="postgresql://postgres.foakaexaaslaheygqbam:iRLX%21Y2aH.kH%26T4@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" \
pnpm prisma db pull

# 2. 차이점 확인 후 수동 조정

# 3. 새 마이그레이션 생성
pnpm prisma migrate dev --name sync_with_supabase
```

### 옵션 3: companies 테이블 스키마 수정

```sql
-- startDate, endDate를 nullable로 변경 (Prisma 스키마와 일치)
ALTER TABLE "public"."companies" 
  ALTER COLUMN "startDate" DROP NOT NULL;

ALTER TABLE "public"."companies" 
  ALTER COLUMN "endDate" DROP NOT NULL;
```

## 🎯 권장 실행 순서

### 즉시 실행 (500 에러 해결)
1. **company_lessons 테이블 생성** (옵션 1의 SQL)
2. **companies 테이블 수정** (옵션 3의 SQL)

### 장기 계획
1. Prisma 마이그레이션 시스템 도입 (옵션 2)
2. Railway 빌드에 `prisma migrate deploy` 추가 (이미 완료)

## 📝 실행 SQL (복사해서 Supabase SQL Editor에 붙여넣기)

```sql
-- 1. company_lessons 테이블 생성
CREATE TABLE IF NOT EXISTS "public"."company_lessons" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_lessons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_lessons_companyId_lessonId_key" UNIQUE ("companyId", "lessonId")
);

ALTER TABLE "public"."company_lessons" 
  ADD CONSTRAINT "company_lessons_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."company_lessons" 
  ADD CONSTRAINT "company_lessons_lessonId_fkey" 
  FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. companies 테이블 nullable 수정
ALTER TABLE "public"."companies" 
  ALTER COLUMN "startDate" DROP NOT NULL;

ALTER TABLE "public"."companies" 
  ALTER COLUMN "endDate" DROP NOT NULL;

-- 3. 확인
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_lessons';
SELECT column_name, is_nullable FROM information_schema.columns 
WHERE table_name = 'companies' AND column_name IN ('startDate', 'endDate');
```

## ⚠️ 주의사항

- **Session Mode (포트 5432)** 사용 필수
- 프로덕션 환경이므로 신중하게 실행
- 실행 전 Supabase Dashboard에서 백업 확인

