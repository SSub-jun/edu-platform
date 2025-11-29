---
title: 관리자 운영 가이드
description: 처음 시스템을 접하는 관리자도 바로 활용할 수 있는 단계별 안내
---

# 1. 접속 전 준비
- 관리자 ID와 초기 비밀번호를 발급받습니다.  
- Chrome 최신 버전 사용을 권장합니다.  
- 운영팀이 `ALLOWED_ORIGINS` 등 필수 환경 변수를 사전에 설정합니다.

# 2. 로그인 & 기본 구조
1. `/login`에서 관리자 자격으로 로그인합니다.  
2. 로그인 후 JWT 토큰에는 `role`, `companyId`, `companyAssigned`가 포함되며 미들웨어가 즉시 검증합니다.  
3. `/admin` 대시보드에는 네 개의 핵심 카드가 있습니다.
   - **회사 관리**: 기관 등록, 초대코드 발급, 기수 관리 진입
   - **과목 관리**: 과목/레슨/영상/문항 CRUD
   - **학생 관리**: 학생 계정·회사 배정·진도 조회
   - **Q&A 관리**: 질의응답 게시판 운영

# 3. 회사(기관) 관리 절차
1. `/admin/companies` → “새 기관 추가” 버튼으로 기관 등록  
   - 필수: 기관명 / 선택: 운영 시작·종료일  
2. 기관 카드의 버튼
   - 📊 **Overview**: 학생/기수/과목/초대코드 요약
   - 📅 **기수 관리**: 회사별 기수 페이지(`/admin/cohorts/[companyId]`)
   - 🗑️ **삭제**: 회사 비활성화
3. 초대코드 영역에서 **복사 · 직접 입력 · 재발급**을 수행할 수 있습니다.

# 4. 기수(코호트) 운영
1. 기수 관리 화면에서 “+ 기수 생성” → 이름, 기간, 활성 여부 입력  
2. 기수 카드에서 가능한 작업
   - **수정**: 기간/활성 상태 변경  
   - **비활성화**  
   - **과목 배정**: `/admin/subjects` 목록에서 과목 선택  
   - **학생 배정**: `/admin/users/students?companyId=...` API 기반 목록에서 학생 선택  
3. 기수 상태 배지: 진행 중 / 비활성 (필드 `isActive`)  
4. 기수 삭제 동작은 안전하게 “비활성화”로 처리됩니다.

# 5. 과목 & 콘텐츠 관리
## 5.1 과목 CRUD
- `/admin/subjects`에서 과목 생성/수정/삭제  
- 상세 페이지(`/admin/subjects/[subjectId]`)에서 이름, 설명, 순서, 활성 여부 조정

## 5.2 질문/시험 관리
- `/admin/subjects/[subjectId]/questions` 또는 `/admin/questions`  
- 문항 생성 시 보기·정답 입력, 서버가 정답 형식을 자동 검증

## 5.3 레슨 & 영상 업로드
- 관리자는 강사용 경로(`/instructor/...`)도 공유 가능  
- 영상 업로드 API: `POST /media/videos/upload`  
  - 허용 MIME: mp4/webm/ogg/mov  
  - 파일 크기 제한: **500 MB** (Railway 로컬 디스크 한계 고려)

# 6. 학생 관리 & 회사 배정
1. `/admin/students`에서 학생 목록/검색/상세 확인  
2. 학생별 **회사 배정** 버튼으로 초대코드 없이 가입한 학생을 특정 회사에 연결  
3. **기수 배정**은 회사별 기수 관리 화면에서 진행  
4. 학생이 직접 회사 선택이 필요하면 `/company-assign` 페이지 안내  
5. 배정 후 `authClient.refresh()`로 JWT 갱신(프런트가 수행)

# 7. 진도·시험 모니터링
- `ProgressService`의 `ensureActiveLearningWindow`가 기수 기간(`startDate`~`endDate`)을 강제합니다.  
- 회사 Overview에서 기수별 과목, 학생, 평균 진도, 시험 결과를 한 번에 확인할 수 있습니다.  
- 포털/분석 페이지는 role 기반 접근 제어를 따릅니다.

# 8. 권한 & 라우팅 가드
- `apps/web/middleware.ts`
  - `/admin/**` → admin만 접근
  - `/instructor/**` → instructor만 접근
  - `companyRequiredRoutes`에서는 `companyAssigned`가 false면 `/company-assign`으로 이동
- JWT payload에 `role`, `companyId`, `companyAssigned`가 포함되므로 토큰 재발급 시 최신 상태 유지

# 9. 테스트 & 배포 체크리스트
1. 기능 수정 후 `pnpm test`, `pnpm lint` 권장  
2. `pnpm-lock.yaml`과 `package.json`을 항상 동기화  
3. Railway/Vercel 등 배포 환경에서 **환경 변수**와 **업로드 경로** 점검  
4. Git 작업은 **커밋**까지만 수행하고 `git push`는 담당자가 진행

# 10. 자주 묻는 질문 (FAQ)
| 질문 | 답변 |
| --- | --- |
| 영상 업로드 413 오류 | 업로드 파일이 500MB 제한을 초과했습니다. 파일 크기를 줄이거나 서버 limit를 조정하세요. |
| 기수 자동 배정 실패 | 회원가입 시 초대코드를 입력했는지, `tryAutoAssignUserToCohort`가 호출되는지 확인하세요. |
| 과목 목록이 비어 있음 | 관리자 UI는 `/admin/subjects` API를 사용해야 합니다. 기존 `/instructor/subjects` 호출은 404가 납니다. |

---
추가 질문이나 확장 요청이 있으면 팀 채널에 공유해 주세요.

