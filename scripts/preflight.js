#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preflight check 시작...\n');

let hasError = false;

// 1. .env 파일 존재 검사
console.log('📋 .env 파일 존재 검사...');
const apiEnvPath = path.join(__dirname, '../apps/api/.env');
const dbEnvPath = path.join(__dirname, '../packages/db/.env');

if (!fs.existsSync(apiEnvPath)) {
  console.error('❌ apps/api/.env 파일이 존재하지 않습니다.');
  console.error('   apps/api/.env.example을 복사하여 .env 파일을 생성하세요.');
  hasError = true;
} else {
  console.log('✅ apps/api/.env 파일 존재');
}

if (!fs.existsSync(dbEnvPath)) {
  console.error('❌ packages/db/.env 파일이 존재하지 않습니다.');
  console.error('   packages/db/.env.example을 복사하여 .env 파일을 생성하세요.');
  hasError = true;
} else {
  console.log('✅ packages/db/.env 파일 존재');
}

// 2. Prisma 스키마 검증
console.log('\n🔍 Prisma 스키마 검증...');
try {
  execSync('pnpm --filter @edu-platform/db run validate', { 
    stdio: 'pipe',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Prisma 스키마 검증 성공');
} catch (error) {
  console.error('❌ Prisma 스키마 검증 실패:', error.message);
  hasError = true;
}

// 3. AUTH_MODE=mock 테스트 실행
console.log('\n🧪 AUTH_MODE=mock 테스트 실행...');
try {
  // 환경변수 설정하여 테스트 실행
  const env = { ...process.env, AUTH_MODE: 'mock' };
  execSync('pnpm --filter api test', { 
    stdio: 'pipe',
    cwd: path.join(__dirname, '../apps/api'),
    env
  });
  console.log('✅ AUTH_MODE=mock 테스트 통과');
} catch (error) {
  console.error('❌ AUTH_MODE=mock 테스트 실패:', error.message);
  hasError = true;
}

// 결과 출력
console.log('\n' + '='.repeat(50));
if (hasError) {
  console.error('❌ Preflight check 실패!');
  console.error('위의 오류를 수정한 후 다시 실행하세요.');
  process.exit(1);
} else {
  console.log('✅ Preflight check 성공!');
  console.log('모든 검사가 통과되었습니다.');
}
