# 🎓 Edu-Platform

교육 플랫폼 - 순차학습, 시험 관리, JWT 인증을 포함한 완전한 온라인 교육 시스템

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd edu-platform

# 의존성 설치
pnpm install

# 환경 변수 설정
cp env.example .env.local
```

### 2. 환경 변수 설정

#### 로컬 개발 환경 (.env.local)
```env
NODE_ENV=development
API_PORT=4000
DATABASE_URL="postgresql://postgres:password@localhost:5432/edu_platform_local"
JWT_SECRET="your-super-secret-jwt-key-for-local-development-only"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"
AUTH_MODE=db
VERIFY_ON_COURSE_START=false
VERIFY_PROVIDER=mock
```

#### 스테이징 환경 (.env.staging)
```env
NODE_ENV=staging
API_PORT=4000
DATABASE_URL="postgresql://user:pass@staging-db:5432/edu_platform_staging"
JWT_SECRET="your-staging-jwt-secret"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"
AUTH_MODE=db
VERIFY_ON_COURSE_START=true
VERIFY_PROVIDER=real
```

#### 프로덕션 환경 (.env.production)
```env
NODE_ENV=production
API_PORT=4000
DATABASE_URL="postgresql://user:pass@prod-db:5432/edu_platform_production"
JWT_SECRET="your-production-jwt-secret"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"
AUTH_MODE=db
VERIFY_ON_COURSE_START=true
VERIFY_PROVIDER=real
```

### 3. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# 개발 환경 마이그레이션
pnpm db:migrate:dev

# 시드 데이터 생성
pnpm db:seed

# Prisma Studio 실행 (선택사항)
pnpm db:studio
```

### 4. 애플리케이션 실행

```bash
# 개발 모드 (모든 앱 동시 실행)
pnpm dev

# 또는 개별 실행
pnpm --filter @edu-platform/api dev
pnpm --filter @edu-platform/web dev
```

## 📁 프로젝트 구조

```
edu-platform/
├── apps/
│   ├── api/          # NestJS 백엔드 API
│   ├── web/          # Next.js 프론트엔드
│   └── docs/         # API 문서
├── packages/
│   ├── db/           # Prisma 데이터베이스
│   ├── ui/           # 공유 UI 컴포넌트
│   ├── eslint-config/ # ESLint 설정
│   └── typescript-config/ # TypeScript 설정
└── scripts/          # 유틸리티 스크립트
```

## 🛠️ 데이터베이스 운영

### 개발 환경
```bash
# 마이그레이션 개발 (스키마 변경 시)
pnpm db:migrate:dev

# 시드 데이터 생성 (멱등성 보장)
pnpm db:seed

# 데이터베이스 리셋 (주의!)
pnpm db:reset
```

### 스테이징/프로덕션 환경
```bash
# 마이그레이션 배포 (기존 마이그레이션 적용)
pnpm db:migrate:deploy

# 시드 데이터 생성
pnpm db:seed
```

### 유틸리티
```bash
# Prisma 스키마 검증
pnpm db:validate

# Prisma Studio (데이터베이스 GUI)
pnpm db:studio

# Prisma 클라이언트 재생성
pnpm db:generate
```

## 🔧 주요 기능

### 🎯 핵심 기능
- **순차학습 시스템**: 이전 레슨 완료 후 다음 레슨 접근
- **시험 재응시 제한**: 1 cycle당 최대 3회, 진도 90% 이상 시 다음 cycle
- **시험 랜덤 출제**: 문제은행 3배수 보유, 랜덤 10문항 출제
- **JWT 인증**: Access/Refresh 토큰, 단일세션 정책

### 🔐 인증 시스템
- JWT 기반 인증 (Access Token + Refresh Token)
- BCrypt 비밀번호 해시
- 단일세션 정책 (동시접속 제한)
- 역할 기반 권한 (student, instructor, admin)

### 📊 시험 시스템
- 온라인 시험 응시
- 자동 채점 (시험 80% + 진도 20%)
- 문제 랜덤 출제 (questionIds 매칭 검증)
- 재응시 제한 및 cycle 관리

### 📈 진도 관리
- 레슨별 진도 추적
- 순차학습 잠금 시스템
- 완료 상태 자동 업데이트

## 🧪 테스트

```bash
# 전체 테스트 실행
pnpm test

# E2E 테스트만 실행
pnpm test:e2e

# 특정 테스트 파일 실행
pnpm test:e2e -- --testNamePattern="Auth Real"
```

## 📚 API 문서

개발 서버 실행 후 다음 URL에서 API 문서 확인:
- Swagger UI: http://localhost:4000/docs
- Health Check: http://localhost:4000/health

## 🚀 배포

### 빌드
```bash
# 전체 프로젝트 빌드
pnpm build

# 개별 앱 빌드
pnpm --filter @edu-platform/api build
pnpm --filter @edu-platform/web build
```

### 환경별 배포
1. **스테이징**: `NODE_ENV=staging` 환경에서 `pnpm db:migrate:deploy` 실행
2. **프로덕션**: `NODE_ENV=production` 환경에서 `pnpm db:migrate:deploy` 실행

## 📊 모니터링

### Health Check
- **개발 환경**: 상세한 엔티티 수 정보 포함
- **운영 환경**: 기본 연결 상태만 제공

### 로그
- 데이터베이스 연결 상태
- 마이그레이션 실행 로그
- 시드 데이터 생성 요약

## 🔧 기술 스택

- **백엔드**: NestJS, TypeScript, Prisma, PostgreSQL
- **프론트엔드**: Next.js 15, React, TypeScript
- **인증**: JWT, BCrypt, Passport.js
- **데이터베이스**: PostgreSQL, Prisma ORM
- **개발 도구**: Turborepo, pnpm, ESLint, Prettier
- **테스트**: Jest, Supertest

## 📝 라이선스

MIT License

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
