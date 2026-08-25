# CNU Proofprint frontend

CNU 사이버캠퍼스 과제 흐름 안에서 AI 활용 목적, 학생의 채택·수정·폐기 판단, 학습 변화를 기록하고 제출 버전으로 남기는 Next.js 파일럿이다.

현재 예시 교과목은 컴퓨터융합학부 `어드벤처디자인`이며, Proofprint 2단계에서 CNU 멀티LLM 형태의 AI 패널을 직접 사용할 수 있다. 학교 공식 API가 설정되지 않은 로컬 환경에서는 실제 크레딧을 사용하지 않는 연동 데모로 동작한다.

## 로컬 실행

현재 DB는 Docker가 아닌 로컬 PostgreSQL 14를 사용한다.

> `PROOFPRINT_DEMO_MODE=true`는 로컬 파일럿 전용이다. 공개 배포에서는 반드시 비활성화하고 CNU LTI/SSO 인증을 연결해야 한다.

```bash
npm install
npm run db:setup
npm run dev
```

- 앱: [http://localhost:3000](http://localhost:3000)
- PostgreSQL: `127.0.0.1:55432/cnu_proofprint`
- 설정 예시: `.env.example`

DB만 제어할 때는 `npm run db:start`, `npm run db:status`, `npm run db:stop`을 사용한다. 마이그레이션과 시드는 각각 `npm run db:migrate`, `npm run db:seed`다.

## 주요 경로

- `/` — 과제 대시보드
- `/assignments/ai-service-proposal` — 과제 상세
- `/assignments/ai-service-proposal/proofprint` — 5단계 작업공간
- `/assignments/ai-service-proposal/proofprint/result` — 1페이지 결과·공개 범위·제출
- `/proofprints` — 작성·제출 이력
- `/api/ai/assist` — 과제 컨텍스트를 확인한 뒤 AI 답변 스트리밍

## 확인 명령

```bash
npm run lint
npx tsc --noEmit
npm run build
```

백엔드 현황은 [`../docs/backend-architecture.md`](../docs/backend-architecture.md), 학교 AI 크레딧 연결 계약은 [`../docs/cnu-multillm-integration.md`](../docs/cnu-multillm-integration.md)를 참고한다.
