#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
: "${REGION:?REGION required}"
: "${CLOUD_RUN_SERVICE:?CLOUD_RUN_SERVICE required}"
: "${DATABASE_URL:?DATABASE_URL required}"
: "${ADMIN_PASS:?ADMIN_PASS required}"
: "${JWT_SECRET:?JWT_SECRET required}"

# API 빌드
pushd apps/portal-api >/dev/null
pnpm i --frozen-lockfile
pnpm build
popd >/dev/null

# API 활성화
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com --project "${GCP_PROJECT_ID}"

# Secret Manager 등록/갱신
echo -n "${DATABASE_URL}" | gcloud secrets create portal-db-url --project "${GCP_PROJECT_ID}" --data-file=- || \
echo -n "${DATABASE_URL}" | gcloud secrets versions add portal-db-url --project "${GCP_PROJECT_ID}" --data-file=-

echo -n "${ADMIN_PASS}"  | gcloud secrets create portal-admin-pass --project "${GCP_PROJECT_ID}" --data-file=- || \
echo -n "${ADMIN_PASS}"  | gcloud secrets versions add portal-admin-pass --project "${GCP_PROJECT_ID}" --data-file=-

echo -n "${JWT_SECRET}"  | gcloud secrets create portal-jwt --project "${GCP_PROJECT_ID}" --data-file=- || \
echo -n "${JWT_SECRET}"  | gcloud secrets versions add portal-jwt --project "${GCP_PROJECT_ID}" --data-file=-

# Cloud Run 배포
gcloud run deploy "${CLOUD_RUN_SERVICE}" \
  --source apps/portal-api \
  --project "${GCP_PROJECT_ID}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --concurrency 100 \
  --set-secrets DATABASE_URL=projects/${GCP_PROJECT_ID}/secrets/portal-db-url:latest \
                ADMIN_PASS=projects/${GCP_PROJECT_ID}/secrets/portal-admin-pass:latest \
                JWT_SECRET=projects/${GCP_PROJECT_ID}/secrets/portal-jwt:latest

# URL 출력
gcloud run services describe "${CLOUD_RUN_SERVICE}" \
  --project "${GCP_PROJECT_ID}" --region "${REGION}" \
  --format='value(status.url)'



