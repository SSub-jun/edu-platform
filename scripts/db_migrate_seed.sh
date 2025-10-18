#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL required}"

pnpm --filter db exec npx prisma migrate deploy
# 선택: 포털 전용 시드 스크립트가 있다면 활성화
# pnpm --filter db exec tsx prisma/portal.seed.ts



