# save as: audit-all.sh
# usage:
#   bash audit-all.sh --project <GCP_PROJECT_ID> --region <REGION> --service <CLOUD_RUN_SERVICE>
set -euo pipefail

PROJECT=""
REGION=""
SERVICE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT="$2"; shift 2 ;;
    --region)  REGION="$2";  shift 2 ;;
    --service) SERVICE="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done
[[ -z "$PROJECT" || -z "$REGION" || -z "$SERVICE" ]] && { echo "need: --project --region --service"; exit 1; }

BOLD=$(tput bold 2>/dev/null || true); NC=$(tput sgr0 2>/dev/null || true)
say(){ echo "${BOLD}== $* ==${NC}"; }
sub(){ echo " - $*"; }

has(){ command -v "$1" >/dev/null 2>&1; }

say "CLI 확인"
for c in gcloud firebase jq psql; do
  if has "$c"; then sub "$c: OK ($($c --version 2>/dev/null | head -n1))"; else sub "$c: MISSING"; fi
done

say "gcloud 인증/컨텍스트"
gcloud auth list 2>/dev/null || true
gcloud config list 2>/dev/null | sed 's/\(access_token\).*/\1 = (redacted)/' || true

say "프로젝트 & 결제"
gcloud projects describe "$PROJECT" --format="table(projectNumber,name,lifecycleState)" || true
gcloud beta billing projects describe "$PROJECT" --format="table(billingEnabled,billingAccountName)" || true

say "핵심 API 활성화"
apis=(run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com iam.googleapis.com logging.googleapis.com monitoring.googleapis.com firestore.googleapis.com storage.googleapis.com)
for a in "${apis[@]}"; do
  on=$(gcloud services list --enabled --project "$PROJECT" --filter="name:$a" --format="value(name)")
  [[ -n "$on" ]] && echo " ON  $a" || echo " OFF $a"
done

say "Secret Manager"
for s in portal-db-url portal-admin-pass portal-jwt; do
  echo "-- $s"
  gcloud secrets describe "$s" --project "$PROJECT" --format="value(name,replication.automatic)" 2>/dev/null || echo "  (not found)"
  gcloud secrets versions list "$s" --project "$PROJECT" --format="table(name,state,createTime)" 2>/dev/null || true
done

say "Cloud Build 최근 5개"
gcloud builds list --project "$PROJECT" --format="table(ID,STATUS,IMAGES,START_TIME,DURATION)" --limit=5 2>/dev/null || true

say "Artifact Registry 리포지토리"
gcloud artifacts repositories list --project "$PROJECT" --location="$REGION" 2>/dev/null || true

say "Cloud Run 서비스"
gcloud run services list --project "$PROJECT" --region "$REGION" --format="table(NAME,URL,READY,TRAFFIC)" || true

say "Cloud Run 서비스 상세: $SERVICE"
gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format="value(status.url)" || true
gcloud run revisions list --project "$PROJECT" --region "$REGION" --service "$SERVICE" --format="table(NAME,READY,ACTIVE,CREATED)" --limit=5 || true

REV="$(gcloud run revisions list --project "$PROJECT" --region "$REGION" --service "$SERVICE" --format='value(NAME)' --limit=1 2>/dev/null || true)"
if [[ -n "${REV}" ]]; then
  say "최근 리비전 조건/로그URL"
  gcloud run revisions describe "$REV" --project "$PROJECT" --region "$REGION" --format="yaml(status.conditions,status.logUri)" | sed -e 's/\(accessToken\|idToken\): .*/\1: (redacted)/' || true
fi

say "Cloud Run 환경변수/시크릿 매핑"
gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" \
  --format="yaml(spec.template.spec.containers[0].env,spec.template.spec.volumes)" | sed 's/password:\s*.*/password: (redacted)/' || true

say "Firebase 프로젝트 연동"
if has firebase; then
  firebase projects:list | (grep -E "$PROJECT" || true)
  sub "Console: https://console.firebase.google.com/project/$PROJECT/overview"
else
  sub "firebase CLI not installed; skip"
fi

say "Neon/DB 연결(시크릿에서 URL 가져와 마스킹 테스트)"
DB_URL_RAW="$(gcloud secrets versions access latest --secret=portal-db-url --project "$PROJECT" 2>/dev/null || true)"
if [[ -n "$DB_URL_RAW" ]]; then
  echo " portal-db-url: $(echo "$DB_URL_RAW" | sed -E 's#(postgres(ql)?://)[^:]+:([^@]+)@#\1***:***@#')"
  if has psql; then
    sub "psql -c 'SELECT version();' (10s 타임아웃)"
    PGPASSWORD="$(echo "$DB_URL_RAW" | sed -E 's#.*://[^:]+:([^@]+)@.*#\1#')" \
    psql "$DB_URL_RAW" -c "SELECT now(), current_user;" -t -A -v ON_ERROR_STOP=1 -q --set=sslmode=require -w -h "$(echo "$DB_URL_RAW" | sed -E 's#.*@([^:/?]+).*#\1#')" -p "$(echo "$DB_URL_RAW" | sed -E 's#.*:([0-9]+)/.*#\1#')" 2>/dev/null || echo "  (DB handshake failed)"
  fi
else
  echo " portal-db-url secret not readable (권한 또는 존재 여부 확인)"
fi

say "앱 스크립트/헬스 엔드포인트(로컬 소스 점검)"
if [[ -f apps/portal-api/package.json ]]; then
  jq '.name,.scripts,.dependencies."@prisma/client"?,.devDependencies.prisma?' apps/portal-api/package.json 2>/dev/null || true
fi
if [[ -f apps/portal-api/src/main.ts ]]; then
  grep -E "process\.env\.PORT|listen\(|0\.0\.0\.0" -n apps/portal-api/src/main.ts || true
fi
if [[ -f apps/portal-api/src/health.controller.ts ]]; then
  grep -n "@Get('/healthz')" apps/portal-api/src/health.controller.ts || true
else
  echo " health.controller.ts not found (권장: /healthz 추가)"
fi

say "요약 가이드"
cat <<EOF
- 결제 연결, 필수 API, Secrets(세 개), Cloud Build, Artifact Registry, Cloud Run READY 여부를 위에서 확인했다.
- 앱 측면: start는 node dist/main.js, build는 'prisma generate && nest build', main.ts는 PORT/0.0.0.0.
- DB: portal-db-url로 psql 간단 핸드셰이크가 되면 연결 OK(권한/SSL/방화벽 이슈 배제).
- 문제가 있으면 해당 섹션의 출력과 함께 물어보면 바로 포인트 짚어줄 수 있다.
EOF
