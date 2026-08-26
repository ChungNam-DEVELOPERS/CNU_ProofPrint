# Proofprint

사이버캠퍼스의 과목·과제를 읽어와, 학습 에이전트가 목차별 이해도와 오답노트를 스스로
정리하는 학습 서비스의 Next.js 파일럿이다. 사이버캠퍼스는 화면이 아니라 데이터 소스로만
사용하고, 학생은 Proofprint 안에서 학습한다.

Next.js 하나로 화면과 서버를 함께 돌린다. 별도 백엔드 프로세스는 없다.

```
app/workspaces, app/connect   화면
app/api                       HTTP 엔드포인트
app/server                    DB 접근 · 에이전트 · 인증 (server-only)
app/lib                       화면과 서버가 함께 쓰는 타입
db/migrations                 스키마
scripts                       DB 시작 · 마이그레이션 · 시드
```

`app/server/*` 는 모두 `import "server-only"` 가 걸려 있어 브라우저 번들에 들어가지 않는다.
서버 컴포넌트는 리포지토리 함수를 직접 부르고, 클라이언트는 같은 함수를 `app/api` 를 통해 쓴다.

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
/            → /workspaces (프로토타입은 항상 로그인된 상태로 시작)
/workspaces  내 워크스페이스 (과목·주제 1개 = 워크스페이스 1개)
/connect     사이버캠퍼스 SSO 연동
/connect/importing   읽어온 과목·과제 확인 → 워크스페이스 자동 생성
```

워크스페이스 하나가 과목 하나이고, 그 안에 학습과 과제가 함께 있다. 사이드바로 자유롭게 이동한다.

| 경로 | 화면 |
| --- | --- |
| `/workspaces/[slug]` | 학습 현황 — 지금 상태, 이해도, 학습 흐름, 제출 이력 |
| `/workspaces/[slug]/study` | 학습하기 — 에이전트 대화와 도구 호출 |
| `/workspaces/[slug]/assignments` | 과제 — 사이버캠퍼스에서 가져온 목록 |
| `/workspaces/[slug]/assignments/[id]` | 과제 상세 (Proofprint 5단계) |
| `/workspaces/[slug]/assignments/[id]/result` | 1페이지 결과·공개 범위·제출 |
| `/workspaces/[slug]/syllabus` | 목차 · 이해도 |
| `/workspaces/[slug]/notes` | 오답노트 — 몰랐던 개념 키워드 암기 카드 |
| `/workspaces/[slug]/materials` | 학습 자료 |

## 데이터 현황

- 워크스페이스·목차·이해도·오답노트·과제 목록은 아직 `app/lib/study-data.ts`의 목 데이터다.
- Proofprint 5단계 작업공간·제출·이력만 PostgreSQL에 저장된다.

## 학습 에이전트

`POST /api/workspaces/[slug]/agent` 하나가 한 턴을 돌린다. 도구는 다섯 개다.

| 도구 | 하는 일 |
| --- | --- |
| `get_state` | 목차·이해도·오답노트·자료를 먼저 읽는다 |
| `read_material` | 올린 자료에서 관련 부분을 찾고 참고 횟수를 올린다 |
| `log_evidence` | 학습 근거를 기록한다. 이해도 값은 쓰지 못한다 |
| `record_gap` | 몰랐던 개념을 오답노트에 키워드로 남긴다 |
| `update_syllabus` | 목차에 없는 주제를 추가한다 |

**에이전트는 이해도를 직접 쓰지 못한다.** `log_evidence`로 무슨 일이 있었는지만 기록하고,
상태는 `app/server/learning-writes.ts`의 `levelFromEvidence`가 계산한다. 에이전트가 설명해 준
근거(`explained_by_agent`)만으로는 `exposed`를 넘지 못하고, 학생이 직접 설명한 근거
(`self_explained`)가 있어야 `solid`가 된다.

`record_gap`은 `gaps`의 `(workspace_id, term)` 유일 제약을 타서, 같은 개념을 다시 남기면
행이 늘지 않고 `occurrences`가 올라간다.

### 모델 연결

학교 멀티LLM 게이트웨이가 Anthropic 네이티브 Messages API 를 그대로 제공하므로,
`baseURL` 만 바꿔 같은 SDK 로 붙는다. 도구 호출, adaptive thinking, `web_search`
서버 도구, mid-conversation system 메시지 모두 게이트웨이에서 동작을 확인했다.

```
CNU_LLM_BASE_URL=https://factchat-cloud.mindlogic.ai/v1/gateway/claude
CNU_MULTI_LLM_CONNECTOR_TOKEN=<학교 발급 키>
CNU_LLM_MODEL=claude-sonnet-5
```

게이트웨이에는 `claude-opus-5`, `claude-fable-5`, `gpt-5.6`, `gemini-3.7-flash` 등
30개 모델이 있다. `GET /v1/gateway/models/` 로 목록을 볼 수 있다.

게이트웨이가 설정되지 않으면 `ANTHROPIC_API_KEY` 로 대체하고, 둘 다 없으면 대화는
저장하되 답변을 만들지 않고 화면에 그 사실을 알린다.

## 확인 명령

```bash
npm run lint
npx tsc --noEmit
npm run build
```
