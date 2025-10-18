#!/usr/bin/env bash
set -euo pipefail

: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID required}"
: "${PREVIEW_CHANNEL:=test-verify}"
: "${PREVIEW_EXPIRES:=1h}"

# 웹 빌드 & export
pushd apps/portal-web >/dev/null
pnpm i --frozen-lockfile
pnpm build
pnpm export
popd >/dev/null

# 프리뷰 채널 배포(만료시간 지정)
firebase use "${FIREBASE_PROJECT_ID}"
firebase hosting:channel:deploy "${PREVIEW_CHANNEL}" --expires "${PREVIEW_EXPIRES}"



