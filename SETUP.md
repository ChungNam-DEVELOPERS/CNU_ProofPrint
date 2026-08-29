# 실행 가이드

두 가지 방법이 있습니다. **Docker 쪽이 쉽습니다** — PostgreSQL 설치가 필요 없습니다.

---

## 방법 1. Docker (권장)

### 사전 준비

- Docker Desktop (실행 중이어야 합니다)

### 실행

```bash
git clone https://github.com/ChungNam-DEVELOPERS/CNU_ProofPrint.git
cd CNU_ProofPrint
cp .env.example .env
```

`.env`를 열고 학교 게이트웨이 키만 채웁니다.

```
CNU_MULTI_LLM_CONNECTOR_TOKEN=<학교에서 발급받은 키>
```

그리고 띄웁니다.

```bash
docker compose up --build
```

→ http://localhost:3000

처음 실행할 때 컨테이너가 알아서 **DB 대기 → 마이그레이션 → 데모 데이터 시드**까지 합니다.

### 자주 쓰는 명령

```bash
docker compose up -d          # 백그라운드로 띄우기
docker compose logs -f app    # 앱 로그 보기
docker compose down           # 내리기 (데이터는 남음)
docker compose down -v        # 데이터까지 지우기
```

데모 데이터를 넣고 싶지 않으면 `docker-compose.yml`의 `app` 환경변수에 `SKIP_SEED: "1"`을 추가합니다.

---

## 방법 2. 로컬에 직접 (개발용)

Docker보다 리로드가 빠릅니다. 개발할 때는 이쪽을 씁니다.

### 사전 준비

- Node.js 20 이상
- PostgreSQL 14

macOS에서 PostgreSQL이 없으면:

```bash
brew install postgresql@14
```

`postgresql@14`는 keg-only라 PATH에 직접 넣어야 합니다. `~/.zshrc`에 넣어두면 편합니다.

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

### 실행

```bash
git clone https://github.com/ChungNam-DEVELOPERS/CNU_ProofPrint.git
cd CNU_ProofPrint
cp .env.example .env     # 그다음 CNU_MULTI_LLM_CONNECTOR_TOKEN 채우기
npm install
npm run db:setup         # DB 시작 + 마이그레이션 + 시드
npm run dev
```

→ http://localhost:3000

DB는 `.data/postgres`에 프로젝트 안쪽으로 만들어집니다. 시스템 PostgreSQL을 건드리지 않고,
포트도 `55432`를 써서 기본 `5432`와 겹치지 않습니다.

### DB만 다룰 때

```bash
npm run db:start     # 시작
npm run db:status    # 상태
npm run db:stop      # 정지
npm run db:migrate   # 마이그레이션만
npm run db:seed      # 시드만 (데모 데이터를 원래대로 되돌릴 때)
```

---

## 환경변수

| 이름 | 설명 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `CNU_LLM_BASE_URL` | 학교 게이트웨이. Anthropic 네이티브 Messages API 경로 |
| `CNU_MULTI_LLM_CONNECTOR_TOKEN` | **학교 발급 키. 절대 커밋하지 않습니다** |
| `CNU_LLM_MODEL` | 쓸 모델. 기본 `claude-sonnet-5` |
| `ANTHROPIC_API_KEY` | 게이트웨이 대신 Anthropic 직접 호출할 때만 |
| `PROOFPRINT_DEMO_MODE` | `true`면 로그인 없이 데모 학생으로 동작 |
| `DEMO_STUDENT_SUB` | 데모 학생 식별자 |

`.env`는 `.gitignore`에 잡혀 있습니다. `.env.example`만 커밋됩니다.

게이트웨이에서 쓸 수 있는 모델 목록은 이렇게 봅니다.

```bash
curl -s https://factchat-cloud.mindlogic.ai/v1/gateway/models/ \
  -H "x-api-key: $CNU_MULTI_LLM_CONNECTOR_TOKEN" | python3 -m json.tool
```

---

## 키가 없으면

앱은 정상적으로 뜹니다. 화면과 데모 데이터를 전부 볼 수 있습니다.
다만 **학습하기** 화면에서 질문하면 대화는 저장되지만 답변이 만들어지지 않고,
"AI 연결이 설정되지 않았습니다"라고 알려 줍니다.

---

## 확인 명령

```bash
npm run lint
npx tsc --noEmit
npm run build
```

---

## 문제 해결

**`psql: connection to server ... failed: Connection refused`**
DB가 안 떠 있습니다. `npm run db:start` (Docker면 `docker compose up -d db`).

**`initdb: command not found` / `pg_ctl: command not found`**
PostgreSQL이 PATH에 없습니다. 위의 `export PATH=...` 줄을 실행하세요.

**`Error: connect ECONNREFUSED 127.0.0.1:55432` 가 빌드 중에 뜬다**
빌드에는 DB가 필요 없습니다. 이 오류가 나면 DB를 읽는 화면이 정적 프리렌더로
잡힌 것이므로, 해당 페이지에 `export const dynamic = "force-dynamic"`이 있는지 확인하세요.

**포트 3000이 이미 쓰이는 중**
`PORT=3001 npm run dev` 또는 `docker-compose.yml`의 포트 매핑을 바꿉니다.

**AI 답변이 «키가 거부됐습니다»로 나온다**
`CNU_MULTI_LLM_CONNECTOR_TOKEN` 값을 확인하세요. 아래로 직접 검증할 수 있습니다.

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  https://factchat-cloud.mindlogic.ai/v1/gateway/models/ \
  -H "x-api-key: <키>"
```
`200`이 나와야 정상입니다.
