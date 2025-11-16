# Railway 빌드 최적화 가이드

## 🚀 빌드 속도 개선 방법

### 1. Railway 환경 변수 설정

Railway Dashboard → Variables에 다음 추가:

```bash
# Nixpacks 최적화
NIXPACKS_NO_MUSL=1
NIXPACKS_INSTALL_CACHE_DIRS=/root/.pnpm-store

# Node.js 최적화
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=4096

# pnpm 최적화
PNPM_HOME=/pnpm
```

### 2. 빌드 캐시 활성화

1. Railway Dashboard → 프로젝트 선택
2. Settings → Build Configuration
3. **Build Cache** 활성화

### 3. 빌드 명령어 최적화 (선택사항)

Railway Dashboard → Settings → Build Command:

```bash
pnpm install --frozen-lockfile --filter @edu-platform/db --filter api && cd packages/db && npx prisma generate && cd ../../apps/api && pnpm build
```

Start Command:
```bash
cd apps/api && node dist/main.js
```

### 4. 예상 빌드 시간

**최적화 전:**
- 첫 빌드: 5-8분
- 재빌드: 3-5분

**최적화 후:**
- 첫 빌드: 3-5분
- 재빌드: 1-2분 (캐시 활용)

### 5. 빌드 로그 확인

빌드가 느린 단계 확인:
1. Railway Dashboard → Deployments
2. 최근 배포 클릭
3. Build Logs 확인
4. 시간이 오래 걸리는 단계 파악

일반적으로 느린 단계:
- ⏱️ `pnpm install` (1-3분)
- ⏱️ `prisma generate` (30초-1분)
- ⏱️ `nest build` (1-2분)

### 6. 추가 최적화 팁

#### A. 불필요한 devDependencies 제거
```json
// package.json에서 production에 불필요한 패키지 확인
```

#### B. Prisma 바이너리 캐싱
Railway는 자동으로 Prisma 바이너리를 캐싱하지만,
문제가 있다면 `PRISMA_CLI_BINARY_TARGETS` 설정:

```bash
PRISMA_CLI_BINARY_TARGETS=native,linux-musl-openssl-3.0.x
```

#### C. Turbo 캐시 활용 (향후)
```bash
# turbo.json에서 원격 캐시 설정
{
  "remoteCache": {
    "enabled": true
  }
}
```

### 7. 문제 해결

#### 빌드가 5분 이상 걸리는 경우:
1. Build Logs에서 어느 단계가 느린지 확인
2. `pnpm install`이 느리면 → 캐시 확인
3. `prisma generate`가 느리면 → Prisma 버전 확인
4. `nest build`가 느리면 → TypeScript 설정 확인

#### 캐시가 작동하지 않는 경우:
1. Railway Dashboard → Settings
2. "Clear Build Cache" 클릭
3. 다시 배포하여 새 캐시 생성

#### 메모리 부족 에러:
```bash
NODE_OPTIONS=--max-old-space-size=8192
```

## 📊 현재 설정

- ✅ `nixpacks.toml` 추가됨
- ✅ `.dockerignore` 최적화됨
- ✅ 필터링된 pnpm install 사용
- ✅ 단계별 빌드 명령어 분리

## 🎯 기대 효과

- 첫 빌드: **40-50% 시간 단축**
- 재빌드: **60-70% 시간 단축** (캐시 활용)
- 안정성: 빌드 실패율 감소

