-- 워크스페이스 = 과목/주제 1개. 그 안에 학습(목차·이해도·오답노트·대화)과 과제가 들어간다.
-- 기존 workspaces 테이블은 "학생 1명 × 과제 1개의 Proofprint"라서 이름이 정반대였다.
-- proofprints 로 옮기고, workspaces 이름을 과목 단위에 돌려준다.

do $$
begin
  if exists (select 1 from pg_class where relname = 'workspaces' and relkind = 'r')
     and not exists (select 1 from pg_class where relname = 'proofprints' and relkind = 'r') then
    alter table workspaces rename to proofprints;
    alter table learning_goals rename column workspace_id to proofprint_id;
    alter table ai_uses rename column workspace_id to proofprint_id;
    alter table reflections rename column workspace_id to proofprint_id;
    alter table disclosure_settings rename column workspace_id to proofprint_id;
    alter table proofprint_versions rename column workspace_id to proofprint_id;
    alter table audit_events rename column workspace_id to proofprint_id;
  end if;
end;
$$;

drop trigger if exists workspaces_set_updated_at on proofprints;
drop trigger if exists proofprints_set_updated_at on proofprints;
create trigger proofprints_set_updated_at
before update on proofprints
for each row execute function set_updated_at();

-- ── 워크스페이스 ─────────────────────────────────────
create table if not exists workspaces (
  id bigint generated always as identity primary key,
  public_id text not null unique,
  tenant_id bigint not null references tenants(id) on delete cascade,
  owner_id bigint not null references users(id) on delete cascade,
  slug text not null,
  title text not null check (char_length(title) between 1 and 200),
  subject text not null default '',
  term text not null default '',
  emoji text not null default '📚',
  status text not null default '학습 중',
  source text not null default 'manual' check (source in ('cybercampus', 'manual')),
  external_course_id text,
  summary text not null default '',
  next_action text not null default '',
  study_minutes integer not null default 0 check (study_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create index if not exists workspaces_owner_updated_idx
  on workspaces (owner_id, updated_at desc);

-- ── 목차와 이해도 ────────────────────────────────────
create table if not exists topics (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  parent_id bigint references topics(id) on delete cascade,
  position smallint not null default 0 check (position >= 0),
  title text not null check (char_length(title) between 1 and 300),
  level text not null default 'unseen'
    check (level in ('unseen', 'exposed', 'shaky', 'solid')),
  evidence_note text,
  last_evidence_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists topics_workspace_idx on topics (workspace_id, position);
create index if not exists topics_parent_idx on topics (parent_id, position);

-- 이해도가 왜 그 상태인지에 대한 근거. 상태 자체는 이 기록에서 계산한다.
create table if not exists topic_evidence (
  id bigint generated always as identity primary key,
  topic_id bigint not null references topics(id) on delete cascade,
  kind text not null check (kind in (
    'explained_by_agent',      -- 에이전트가 설명해 줌   → exposed 까지만
    'seen_in_material',        -- 자료에 등장            → exposed 까지만
    'self_explained',          -- 학생이 직접 정확히 설명 → solid
    'incomplete_explanation',  -- 설명했지만 부정확       → shaky
    'gap_recorded',            -- 오답노트에 기록됨       → shaky
    'gap_resolved'             -- 오답노트 해소          → solid 후보
  )),
  note text not null default '',
  source_ref text,
  occurred_at timestamptz not null default now()
);

create index if not exists topic_evidence_topic_idx
  on topic_evidence (topic_id, occurred_at desc);

-- ── 오답노트: 몰랐던 개념 키워드 ─────────────────────
create table if not exists gaps (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  topic_id bigint references topics(id) on delete set null,
  kind text not null default '개념' check (kind in ('개념', '공식', '정리', '용어')),
  term text not null check (char_length(term) between 1 and 200),
  definition text not null default '',
  key_point text not null default '',
  confused_with text,
  occurrences integer not null default 1 check (occurrences > 0),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 같은 개념을 또 몰라도 행이 늘지 않고 occurrences 가 올라가게 한다.
  unique (workspace_id, term)
);

create index if not exists gaps_workspace_status_idx
  on gaps (workspace_id, status, occurrences desc);

-- ── 학습 자료 ────────────────────────────────────────
create table if not exists materials (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  kind text not null check (kind in ('PDF', '필기', '링크')),
  title text not null check (char_length(title) between 1 and 300),
  extent text not null default '',
  storage_ref text,
  used_count integer not null default 0 check (used_count >= 0),
  added_at timestamptz not null default now()
);

create index if not exists materials_workspace_idx on materials (workspace_id, added_at desc);

-- ── 에이전트 대화와 도구 호출 ────────────────────────
create table if not exists messages (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  role text not null check (role in ('user', 'agent')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_workspace_idx on messages (workspace_id, created_at);

create table if not exists tool_calls (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  message_id bigint references messages(id) on delete cascade,
  tool text not null check (tool in (
    'record_gap', 'update_syllabus', 'log_evidence', 'read_material', 'web_search'
  )),
  summary text not null default '',
  args jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists tool_calls_workspace_idx
  on tool_calls (workspace_id, occurred_at desc);

-- ── 워크스페이스 안의 과제 ───────────────────────────
create table if not exists workspace_assignments (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  slug text not null,
  title text not null check (char_length(title) between 1 and 300),
  summary text not null default '',
  source text not null default '사이버캠퍼스' check (source in ('사이버캠퍼스', '직접 추가')),
  status text not null default '시작 전'
    check (status in ('시작 전', '작성 중', '진행 중', '제출 완료')),
  due_at timestamptz,
  due_label text,
  external_id text,
  -- 이 과제의 Proofprint 기록. 없으면 아직 작성 전이다.
  proofprint_id bigint references proofprints(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index if not exists workspace_assignments_workspace_idx
  on workspace_assignments (workspace_id, due_at);

-- ── updated_at 트리거 ────────────────────────────────
drop trigger if exists workspaces_set_updated_at on workspaces;
create trigger workspaces_set_updated_at
before update on workspaces
for each row execute function set_updated_at();

drop trigger if exists topics_set_updated_at on topics;
create trigger topics_set_updated_at
before update on topics
for each row execute function set_updated_at();

drop trigger if exists gaps_set_updated_at on gaps;
create trigger gaps_set_updated_at
before update on gaps
for each row execute function set_updated_at();

drop trigger if exists workspace_assignments_set_updated_at on workspace_assignments;
create trigger workspace_assignments_set_updated_at
before update on workspace_assignments
for each row execute function set_updated_at();
