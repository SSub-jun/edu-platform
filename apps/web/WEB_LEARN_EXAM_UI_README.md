# Web Learn & Exam UI 구현 완료

## 🎯 구현 완료 기능

### 1. 커리큘럼 페이지 (`/curriculum`)
- **CurriculumList**: 배정된 과목/레슨 목록 표시
- **LessonCard**: 상태 배지(잠금/학습중/시험가능/완료), 진행률, 남은 시도, 기간 표시
- **상태 기반 CTA**: 조건에 따른 "학습하기"/"시험보기" 버튼 활성화

### 2. 레슨 학습 페이지 (`/lesson/[lessonId]`)
- **VideoPlayer**: 더미 플레이어 (디버그 모드로 자동 진행 시뮬레이션)
- **진도 동기화**: playedMs 누적 → 수동 핑 → 진도율 업데이트
- **시험 조건 확인**: 진도율 ≥90%, 레슨 해금 상태 검증
- **파트 리스트**: 레슨 구성 요소 표시 (현재 더미 데이터)

### 3. 시험 페이지 (`/exam/lesson/[lessonId]`)
- **사전 조건 확인**: 진도율, 해금 상태, 남은 시도 표시
- **시험 시작**: API 호출로 10문항 랜덤 출제
- **Question 컴포넌트**: 4지선다, 키보드 접근성, 선택 상태 표시
- **QuestionNavigation**: 진행 상황, 문제 번호별 이동, 완료 상태 표시
- **이탈 방지**: beforeunload 이벤트, 중단 확인 모달
- **제출 검증**: 모든 문항 응답 완료 시 제출 버튼 활성화

### 4. 결과 페이지 (`/exam/result`)
- **점수 표시**: 시각적 점수 카드, 진행률 바, 합격선 표시
- **피드백**: 합격/불합격별 맞춤 메시지, 개선 방법 안내
- **다음 액션**: 합격 시 다음 레슨 이동, 불합격 시 복습/재응시 옵션

### 5. 에러 처리 & UX
- **StatusBanner**: 422/403 에러별 맞춤 메시지 + CTA
- **조건별 툴팁**: 버튼 비활성화 시 이유 표시
- **접근성**: ARIA 라벨, 키보드 포커스, Live Region 알림

## 🛠️ 기술 스택

- **Next.js 15** (App Router)
- **TypeScript**
- **React Query** (@tanstack/react-query)
- **Axios** (인터셉터로 토큰 자동 갱신)
- **CSS Modules** (컴포넌트별 스타일링)
- **Jest + RTL** (테스트)

## 📂 파일 구조

```
apps/web/
├── app/
│   ├── curriculum/page.tsx         # 커리큘럼 메인
│   ├── lesson/[lessonId]/page.tsx  # 레슨 학습
│   ├── exam/
│   │   ├── lesson/[lessonId]/page.tsx  # 시험 응시
│   │   └── result/page.tsx             # 시험 결과
│   └── layout.tsx                  # QueryProvider 적용
├── components/
│   ├── CurriculumList.tsx          # 커리큘럼 목록
│   ├── LessonCard.tsx              # 레슨 카드
│   ├── VideoPlayer.tsx             # 비디오 플레이어
│   ├── StatusBanner.tsx            # 에러/상태 배너
│   ├── QueryProvider.tsx           # React Query 설정
│   └── Exam/
│       ├── Question.tsx            # 시험 문항
│       └── QuestionNavigation.tsx  # 문항 내비게이션
├── lib/
│   ├── http.ts                     # Axios 클라이언트
│   ├── queries.ts                  # React Query 훅
│   └── types.ts                    # TypeScript 타입
└── __tests__/                      # 테스트 파일
```

## 🔗 라우팅 & 흐름

1. **`/curriculum`** → 과목/레슨 목록 확인
2. **`/lesson/[lessonId]`** → 영상 학습, 진도 동기화
3. **`/exam/lesson/[lessonId]`** → 시험 응시 (조건 확인 → 문항 → 제출)
4. **`/exam/result?attemptId=...`** → 결과 확인, 다음 액션

## 🎮 사용법

### 로컬 개발 환경
```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 테스트 실행
pnpm test
```

### 주요 기능 체험

1. **커리큘럼 확인**: `/curriculum`에서 레슨 상태 확인
2. **학습 진행**: 레슨 페이지에서 VideoPlayer 디버그 모드로 진도 증가
3. **시험 응시**: 진도 90% 달성 후 시험 시작
4. **결과 확인**: 제출 후 점수/합격 여부 및 다음 액션

## 🧪 테스트

### 단위 테스트
- `LessonCard`: 상태별 렌더링, 버튼 활성화 조건
- `StatusBanner`: 에러 메시지 매핑, 자동 닫기, 액션 처리

### 통합 테스트 시나리오
- 커리큘럼 → 레슨 → 진도 업데이트 → 시험 가능 전환
- 시험 시작 실패(422/403) → 배너 노출
- 시험 제출 → 결과 화면 → 다음 액션

## 🔧 API 연동

### 현재 상태
- **Mock 데이터**: 커리큘럼 목록은 임시 데이터 사용
- **실제 API**: 진도 핑, 시험 시작/제출, 레슨 상태 조회
- **에러 처리**: 422/403 상태 코드별 UX 분기

### 백엔드 연동 시 수정 필요
1. `queries.ts`의 `useCurriculum` Mock 데이터 제거
2. `/me/curriculum` 엔드포인트 구현
3. 시험 결과 조회 API 연동 (`/exam/attempts/:id/result`)

## ⚡ 성능 & UX

### 최적화
- **React Query**: 데이터 캐싱, 자동 리페치
- **Debounced Progress**: 진도 핑 방지를 위한 수동 동기화
- **Lazy Loading**: 컴포넌트별 코드 스플리팅

### 접근성
- **키보드 네비게이션**: 시험 문항 간 이동
- **스크린 리더**: ARIA 라벨, Live Region
- **시각적 피드백**: 진행률, 상태 배지, 컬러 코딩

## 🚀 배포 준비

### 환경 변수
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 빌드 & 배포
```bash
pnpm build
pnpm start
```

## 📋 수락 기준 달성 현황

✅ **커리큘럼**: 배정 레슨 목록, 상태/진도 표시  
✅ **학습**: 진도 핑으로 퍼센트 증가 (디버그 모드 검증)  
✅ **시험**: 조건 확인 → 10문항 → 제출 → 결과  
✅ **에러 UX**: 422/403별 정확한 배너 표시  
✅ **다음 액션**: 합격 시 다음 레슨, 불합격 시 재응시 안내  
✅ **테스트**: 단위/통합 테스트 Green  

## 🔮 추후 개선사항

1. **실제 비디오 연동**: YouTube/Vimeo API 통합
2. **실시간 진도**: WebSocket 기반 실시간 동기화
3. **오프라인 지원**: PWA, 로컬 스토리지 캐싱
4. **고급 분석**: 학습 패턴, 성과 대시보드
5. **모바일 최적화**: 터치 제스처, 반응형 개선

---

**Branch**: `feat/web-learn-exam-ui`  
**구현 완료일**: 2024년 12월  
**구현자**: AI Assistant  








