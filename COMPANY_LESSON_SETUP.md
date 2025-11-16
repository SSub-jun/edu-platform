# Company Lesson 설정 가이드

## 🚨 문제 상황

학생이 로그인 후 커리큘럼에서 레슨 진입 시 **403 Forbidden** 에러 발생

### 원인
- `company_lessons` 테이블이 비어있음
- 회사에 레슨이 배정되지 않아 학생이 접근 불가
- `progress.service.ts`의 `getLessonStatus`에서 권한 체크 실패

### 에러 로그
```
GET /progress/lessons/lesson001/status 403 (Forbidden)
```

## ✅ 해결 완료

### 실행한 SQL
```sql
-- company001에 모든 활성 레슨 배정
INSERT INTO company_lessons ("id", "companyId", "lessonId", "createdAt")
SELECT 
  'cl_' || l.id || '_company001',
  'company001',
  l.id,
  CURRENT_TIMESTAMP
FROM lessons l
WHERE l."isActive" = true
ON CONFLICT ("companyId", "lessonId") DO NOTHING;
```

### 결과
- ✅ 9개 레슨이 company001에 배정됨
- ✅ 학생들이 모든 레슨에 접근 가능

## 📋 Company Lesson 관리

### 현재 상태 확인
```sql
-- 회사별 배정된 레슨 수
SELECT 
  cl."companyId", 
  c.name, 
  COUNT(*) as lesson_count
FROM company_lessons cl
JOIN companies c ON cl."companyId" = c.id
GROUP BY cl."companyId", c.name;

-- 특정 회사의 배정된 레슨 목록
SELECT 
  cl.id, 
  cl."lessonId", 
  l.title,
  l."order"
FROM company_lessons cl
JOIN lessons l ON cl."lessonId" = l.id
WHERE cl."companyId" = 'company001'
ORDER BY l."order";
```

### 새 회사에 레슨 배정
```sql
-- 모든 활성 레슨 배정
INSERT INTO company_lessons ("id", "companyId", "lessonId", "createdAt")
SELECT 
  'cl_' || l.id || '_' || :companyId,
  :companyId,
  l.id,
  CURRENT_TIMESTAMP
FROM lessons l
WHERE l."isActive" = true
ON CONFLICT ("companyId", "lessonId") DO NOTHING;

-- 특정 레슨만 배정
INSERT INTO company_lessons ("id", "companyId", "lessonId", "createdAt")
VALUES 
  ('cl_lesson001_company002', 'company002', 'lesson001', CURRENT_TIMESTAMP),
  ('cl_lesson002_company002', 'company002', 'lesson002', CURRENT_TIMESTAMP)
ON CONFLICT ("companyId", "lessonId") DO NOTHING;
```

### 레슨 배정 해제
```sql
-- 특정 레슨 배정 해제
DELETE FROM company_lessons 
WHERE "companyId" = 'company001' AND "lessonId" = 'lesson001';

-- 회사의 모든 레슨 배정 해제
DELETE FROM company_lessons 
WHERE "companyId" = 'company001';
```

## 🔄 Cohort 시스템으로 전환 (향후)

현재는 `company_lessons` (구버전)을 사용하지만, 향후 **Cohort 시스템**으로 전환 예정:

### Cohort 시스템의 장점
1. **기수별 관리**: 2025년 1기, 2025년 2기 등
2. **과목 단위 배정**: Lesson이 아닌 Subject 단위로 관리
3. **학생 그룹핑**: 같은 기수의 학생들을 그룹으로 관리
4. **진도 추적**: 기수별 진도 및 성과 추적

### 마이그레이션 계획
```sql
-- 1. Cohort 생성
INSERT INTO cohorts (id, "companyId", name, "startDate", "endDate", "isActive")
VALUES ('cohort001', 'company001', '2025년 1기', '2025-01-01', '2025-06-30', true);

-- 2. Cohort에 Subject 배정
INSERT INTO cohort_subjects (id, "cohortId", "subjectId")
SELECT 
  'cs_' || s.id || '_cohort001',
  'cohort001',
  s.id
FROM subjects s
WHERE s."isActive" = true;

-- 3. 학생들을 Cohort에 배정
INSERT INTO user_cohorts (id, "userId", "cohortId", "enrolledAt")
SELECT 
  'uc_' || u.id || '_cohort001',
  u.id,
  'cohort001',
  CURRENT_TIMESTAMP
FROM users u
WHERE u."companyId" = 'company001' AND u.role = 'student';
```

## 🎯 관리자 UI 개선 필요

현재 관리자 UI에서 다음 기능이 필요합니다:

### 1. 회사별 레슨 배정 관리
- `/admin/companies/[companyId]/lessons` 페이지
- 활성 레슨 목록 표시
- 체크박스로 레슨 선택/해제
- 일괄 배정/해제 기능

### 2. Cohort 관리 (이미 구현됨)
- `/admin/cohorts/[companyId]` 페이지
- Cohort 생성/수정/삭제
- Subject 배정
- 학생 배정

### 3. 레슨 접근 권한 확인
- 학생 상세 페이지에서 접근 가능한 레슨 목록 표시
- 권한 문제 디버깅 도구

## 📝 API 엔드포인트 (필요 시 구현)

```typescript
// 회사의 활성 레슨 조회
GET /admin/companies/:companyId/lessons

// 회사에 레슨 배정
POST /admin/companies/:companyId/lessons
Body: { lessonIds: string[] }

// 회사의 레슨 배정 해제
DELETE /admin/companies/:companyId/lessons/:lessonId
```

## ⚠️ 주의사항

1. **데이터 일관성**: `company_lessons`와 `cohort_subjects`를 동시에 사용하지 않도록 주의
2. **마이그레이션**: Cohort 시스템으로 전환 시 기존 데이터 마이그레이션 필요
3. **권한 체크**: `progress.service.ts`에서 Cohort 기반 권한 체크로 전환 필요

## 🔍 디버깅

학생이 레슨에 접근할 수 없는 경우:

```sql
-- 1. 학생의 회사 확인
SELECT u.id, u.username, u."companyId", c.name
FROM users u
LEFT JOIN companies c ON u."companyId" = c.id
WHERE u.id = 'student001';

-- 2. 회사에 배정된 레슨 확인
SELECT cl."lessonId", l.title
FROM company_lessons cl
JOIN lessons l ON cl."lessonId" = l.id
WHERE cl."companyId" = 'company001';

-- 3. 특정 레슨 접근 권한 확인
SELECT 
  u.username,
  c.name as company,
  l.title as lesson,
  CASE 
    WHEN cl.id IS NOT NULL THEN 'Accessible'
    ELSE 'Forbidden'
  END as access
FROM users u
LEFT JOIN companies c ON u."companyId" = c.id
LEFT JOIN company_lessons cl ON cl."companyId" = c.id
LEFT JOIN lessons l ON cl."lessonId" = l.id
WHERE u.id = 'student001' AND l.id = 'lesson001';
```

