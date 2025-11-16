# 데이터베이스 초기화 가이드

## 📋 개요

이 스크립트들은 교육 플랫폼의 데이터베이스를 처음부터 새로 만들고, 산업안전 교육 샘플 데이터를 생성합니다.

## 🗂️ 파일 설명

- `reset-database.sql`: 모든 테이블을 삭제하고 스키마를 새로 생성
- `seed-database.sql`: 산업안전 교육 샘플 데이터 생성

## 🚀 실행 방법

### 1. Supabase SQL Editor에서 실행

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭

#### Step 1: 스키마 초기화
```sql
-- reset-database.sql 파일의 내용을 복사해서 붙여넣고 실행
```

#### Step 2: 샘플 데이터 생성
```sql
-- seed-database.sql 파일의 내용을 복사해서 붙여넣고 실행
```

## 📚 생성되는 샘플 데이터

### 🏢 회사
- **KIST 안전교육센터** (초대코드: `KIST2024`)
- 수강 기간: 오늘부터 6개월

### 📖 과목 (3개)
1. **산업안전 기초** - 기본 안전 수칙
2. **개인보호구 착용법** - 안전모, 안전화, 보안경 등
3. **화재 예방과 대응** - 소화기 사용법, 대피 요령

### 📝 강의 (각 과목당 3개, 총 9개)

#### 과목1: 산업안전 기초
- 안전의 중요성
- 작업 전 안전 점검
- 위험 요소 파악하기

#### 과목2: 개인보호구 착용법
- 안전모 착용법
- 안전화와 안전장갑
- 보안경과 귀마개

#### 과목3: 화재 예방과 대응
- 화재의 3요소
- 소화기 사용법
- 화재 시 대피 요령

### ❓ 시험 문제 (각 과목당 10문제, 총 30문제)
- 모두 4지선다형
- 매우 쉬운 난이도
- 실제 산업안전 교육 내용 기반

### 👥 테스트 계정

| 역할 | 아이디 | 비밀번호 | 이름 | 전화번호 |
|------|--------|----------|------|----------|
| 관리자 | `admin` | `Admin123!` | 관리자 | 01012345678 |
| 학생1 | `student1` | `Student123!` | 김철수 | 01011111111 |
| 학생2 | `student2` | `Student123!` | 이영희 | 01022222222 |
| 학생3 | `student3` | `Student123!` | 박민수 | 01033333333 |

## ✅ 확인 방법

### 1. 테이블 생성 확인
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. 데이터 확인
```sql
-- 회사 확인
SELECT * FROM companies;

-- 과목 확인
SELECT * FROM subjects ORDER BY "order";

-- 강의 확인
SELECT s.name as subject_name, l.title as lesson_title, l."order"
FROM lessons l
JOIN subjects s ON l."subjectId" = s.id
ORDER BY s."order", l."order";

-- 문제 확인
SELECT s.name as subject_name, COUNT(q.id) as question_count
FROM questions q
JOIN subjects s ON q."subjectId" = s.id
GROUP BY s.name;

-- 사용자 확인
SELECT username, role, name, phone FROM users;
```

## 🎯 다음 단계

1. **로그인 테스트**
   - 학생 계정으로 로그인: `student1` / `Student123!`

2. **커리큘럼 확인**
   - 3개 과목이 표시되는지 확인
   - 각 과목당 3개 강의가 있는지 확인

3. **학습 진행**
   - 강의 수강 (90% 이상 수강 필요)
   - 시험 응시 (각 과목당 10문제)
   - 수료 확인 (총점 70점 이상)

## ⚠️ 주의사항

- **모든 데이터가 삭제됩니다!** 프로덕션 환경에서는 절대 실행하지 마세요.
- 비밀번호 해시는 bcrypt로 생성되어야 하지만, 샘플 데이터에서는 임시 해시를 사용합니다.
- 실제 운영 시에는 반드시 새로운 비밀번호로 변경하세요.

## 🔧 문제 해결

### "relation does not exist" 오류
- `reset-database.sql`을 먼저 실행했는지 확인
- 모든 테이블이 정상적으로 생성되었는지 확인

### "duplicate key value" 오류
- 이미 데이터가 존재하는 경우 발생
- `reset-database.sql`을 다시 실행하여 초기화

### 로그인이 안 되는 경우
- 비밀번호 해시가 올바른지 확인
- API 서버의 bcrypt 설정 확인
- 실제 로그인 시에는 회원가입을 통해 새 계정 생성 권장

## 📞 지원

문제가 발생하면 개발팀에 문의하세요.

