## Quick Ops (Seoul, preview=1h)

### 0) 로그인/프로젝트 설정
```
gcloud auth login && gcloud config set project ${GCP_PROJECT_ID}
firebase login
```

### 1) API 배포(Cloud Run, min=0)
```
export GCP_PROJECT_ID="kist2017-portal"
export REGION="asia-northeast3"
export CLOUD_RUN_SERVICE="portal-api"
export DATABASE_URL="postgresql://portal_user:***@ep-portal-seoul-xxxx.ap-neon.tech:5432/portal?sslmode=require"
export ADMIN_PASS="***"
export JWT_SECRET="***"
./scripts/deploy_cloud_run.sh
```

### 2) DB 마이그(선택)
```
export DATABASE_URL="postgresql://portal_user:***@ep-portal-seoul-xxxx.ap-neon.tech:5432/portal?sslmode=require"
./scripts/db_migrate_seed.sh
```

### 3) 웹 프리뷰(1시간 만료)
```
export FIREBASE_PROJECT_ID="kist2017-portal"
export PREVIEW_CHANNEL="test-verify"
export PREVIEW_EXPIRES="1h"
./scripts/firebase_preview.sh
```

### 4) 즉시 닫기
```
firebase hosting:channel:delete ${PREVIEW_CHANNEL}
gcloud run services remove-iam-policy-binding ${CLOUD_RUN_SERVICE} \
  --member="allUsers" --role="roles/run.invoker" \
  --region ${REGION} --project ${GCP_PROJECT_ID}
```



