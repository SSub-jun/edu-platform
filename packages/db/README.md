# Database Package

이 패키지는 Prisma를 사용한 데이터베이스 스키마와 마이그레이션을 관리합니다.

## 설정

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음을 추가하세요:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/edu_platform?schema=public"
```

### 2. PostgreSQL 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE edu_platform;

# 종료
\q
```

## 사용법

### 마이그레이션

```bash
# 개발용 마이그레이션 (스키마 변경 시)
pnpm --filter @edu-platform/db db:migrate

# 프로덕션용 마이그레이션
pnpm --filter @edu-platform/db db:deploy
```

### 시드 데이터

```bash
# 시드 데이터 실행
pnpm --filter @edu-platform/db db:seed
```

### Prisma Studio

```bash
# 데이터베이스 GUI 도구 실행
pnpm --filter @edu-platform/db db:studio
```

## 스키마

### User 모델
- `id`: 고유 식별자 (CUID)
- `username`: 사용자명 (고유)
- `passwordHash`: bcrypt로 해시화된 비밀번호
- `role`: 사용자 역할 (student, instructor, admin)
- `phone`: 전화번호 (선택사항)
- `createdAt`: 생성 시간
- `updatedAt`: 수정 시간

### Session 모델
- `id`: 세션 식별자 (CUID)
- `userId`: 사용자 ID (User와 연결)
- `deviceId`: 디바이스 식별자
- `createdAt`: 생성 시간
- `revokedAt`: 폐기 시간 (선택사항)

## 개발자 계정

시드 데이터로 생성되는 기본 계정:

- **admin/admin123** (관리자)
- **teacher/teach123** (강사)
- **user/user123** (학생)
