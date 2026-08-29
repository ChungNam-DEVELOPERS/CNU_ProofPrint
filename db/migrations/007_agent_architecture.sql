-- 학습 Agent와 과제 Agent의 대화 경계를 분리하고, 두 경로에서 나온 근거를
-- Proofprint까지 잃지 않고 전달하기 위한 공용 원장이다.

create table if not exists agent_sessions (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  assignment_id bigint references workspace_assignments(id) on delete cascade,
  agent_type text not null check (agent_type in ('study', 'assignment')),
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (agent_type = 'study' and assignment_id is null)
    or (agent_type = 'assignment' and assignment_id is not null)
  )
);

create unique index if not exists agent_sessions_one_study_idx
  on agent_sessions (workspace_id) where agent_type = 'study';
create unique index if not exists agent_sessions_one_assignment_idx
  on agent_sessions (workspace_id, assignment_id) where agent_type = 'assignment';

alter table messages add column if not exists session_id bigint
  references agent_sessions(id) on delete cascade;
alter table tool_calls add column if not exists session_id bigint
  references agent_sessions(id) on delete cascade;

alter table tool_calls drop constraint if exists tool_calls_tool_check;
alter table tool_calls add constraint tool_calls_tool_check check (tool in (
  'record_gap', 'update_syllabus', 'log_evidence', 'read_material', 'web_search',
  'get_assignment_state', 'find_learning_evidence',
  'record_ai_contribution', 'propose_student_decision'
));

-- 기존 대화는 모두 학습 Agent 기록으로 보존한다.
insert into agent_sessions (workspace_id, agent_type, title)
select distinct workspace_id, 'study', '학습하기'
from messages
on conflict (workspace_id) where agent_type = 'study' do nothing;

update messages m set session_id = s.id
from agent_sessions s
where m.session_id is null
  and s.workspace_id = m.workspace_id
  and s.agent_type = 'study';

update tool_calls tc set session_id = s.id
from agent_sessions s
where tc.session_id is null
  and s.workspace_id = tc.workspace_id
  and s.agent_type = 'study';

create index if not exists messages_session_created_idx
  on messages (session_id, created_at);
create index if not exists tool_calls_session_occurred_idx
  on tool_calls (session_id, occurred_at);

-- Agent가 만든 원재료. 정리 전후에도 원본을 삭제하지 않는다.
create table if not exists agent_artifacts (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  assignment_id bigint references workspace_assignments(id) on delete cascade,
  session_id bigint not null references agent_sessions(id) on delete cascade,
  source_message_id bigint references messages(id) on delete set null,
  agent_type text not null check (agent_type in ('study', 'assignment', 'organizer')),
  artifact_type text not null check (artifact_type in (
    'learning_evidence', 'learning_gap', 'syllabus_topic',
    'ai_contribution', 'decision_candidate', 'reflection_candidate',
    'organized_summary'
  )),
  payload jsonb not null default '{}'::jsonb,
  canonical_key text,
  organized_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agent_artifacts_workspace_created_idx
  on agent_artifacts (workspace_id, created_at desc);
create index if not exists agent_artifacts_assignment_created_idx
  on agent_artifacts (assignment_id, created_at desc)
  where assignment_id is not null;
create index if not exists agent_artifacts_unorganized_idx
  on agent_artifacts (workspace_id, id) where organized_at is null;

-- AI는 후보까지만 만들고, 학생의 승인 이후에만 Proofprint 재료가 된다.
create table if not exists artifact_approvals (
  id bigint generated always as identity primary key,
  artifact_id bigint not null unique references agent_artifacts(id) on delete cascade,
  student_id bigint not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  edited_payload jsonb,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists artifact_approvals_student_status_idx
  on artifact_approvals (student_id, status, created_at desc);

-- 통합 Proofprint 초안은 승인된 과제/학습 근거의 출처를 그대로 가진다.
create table if not exists proofprint_sources (
  proofprint_id bigint not null references proofprints(id) on delete cascade,
  artifact_id bigint not null references agent_artifacts(id) on delete restrict,
  section text not null check (section in ('goal', 'ai_use', 'judgment', 'reflection', 'learning')),
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (proofprint_id, artifact_id, section)
);

drop trigger if exists agent_sessions_set_updated_at on agent_sessions;
create trigger agent_sessions_set_updated_at
before update on agent_sessions
for each row execute function set_updated_at();

drop trigger if exists artifact_approvals_set_updated_at on artifact_approvals;
create trigger artifact_approvals_set_updated_at
before update on artifact_approvals
for each row execute function set_updated_at();
