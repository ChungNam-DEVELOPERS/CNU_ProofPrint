# Proofprint frontend

사이버캠퍼스의 과목·과제를 읽어와, 학습 에이전트가 목차별 이해도와 오답노트를 스스로
정리하는 학습 서비스의 Next.js 파일럿이다. 사이버캠퍼스는 화면이 아니라 데이터 소스로만
사용하고, 학생은 Proofprint 안에서 학습한다.

## 로컬 실행

DB는 로컬 PostgreSQL 14를 사용한다. keg-only 설치라 PATH가 필요하다.

```bash
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

- 앱: [http://localhost:3000](http://localhost:3000)
- PostgreSQL: `127.0.0.1:55432/cnu_proofprint`

DB만 제어할 때는 `npm run db:start`, `db:status`, `db:stop`. 마이그레이션·시드는
`npm run db:migrate`, `npm run db:seed`.

> `PROOFPRINT_DEMO_MODE=true`는 로컬 파일럿 전용이다. 공개 배포에서는 반드시
> 비활성화하고 학교 SSO를 연결해야 한다.

## 화면 흐름

```
/            → /projects (프로토타입은 항상 로그인된 상태로 시작)
/projects    내 프로젝트
/connect     사이버캠퍼스 SSO 연동
/connect/importing   읽어온 과목·과제 확인 → 프로젝트 자동 생성
```

프로젝트 안에서는 사이드바로 자유롭게 이동한다.

| 경로 | 화면 |
| --- | --- |
| `/projects/[slug]` | 학습 현황 — 지금 상태, 이해도, 학습 흐름, 제출 이력 |
| `/projects/[slug]/study` | 학습하기 — 에이전트 대화와 도구 호출 |
| `/projects/[slug]/workspace` | 작업공간 — 과제(사캠)와 개인 학습 |
| `/projects/[slug]/workspace/[itemId]` | 항목별 작업공간 (과제는 Proofprint 5단계) |
| `/projects/[slug]/workspace/[itemId]/result` | 1페이지 결과·공개 범위·제출 |
| `/projects/[slug]/syllabus` | 목차 · 이해도 |
| `/projects/[slug]/notes` | 오답노트 — 몰랐던 개념 키워드 암기 카드 |
| `/projects/[slug]/materials` | 학습 자료 |

## 데이터 현황

- 프로젝트·목차·이해도·오답노트·작업공간 항목은 아직 `app/lib/study-data.ts`의 목 데이터다.
- Proofprint 5단계 작업공간·제출·이력만 PostgreSQL에 저장된다.

## 확인 명령

```bash
npm run lint
npx tsc --noEmit
npm run build
```
