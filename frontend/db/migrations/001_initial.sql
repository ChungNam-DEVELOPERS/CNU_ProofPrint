create table if not exists tenants (
  id bigint generated always as identity primary key,
  public_id text not null unique,
  name text not null,
  data_region text not null default 'KR',
  retention_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id bigint generated always as identity primary key,
  tenant_id bigint not null references tenants(id) on delete cascade,
  external_subject text not null,
  display_name text not null,
  student_number text,
  department text,
  role text not null check (role in ('student', 'instructor', 'admin')),
  created_at timestamptz not null default now(),
  unique (tenant_id, external_subject)
);

create index if not exists users_tenant_id_idx on users (tenant_id);

create table if not exists courses (
  id bigint generated always as identity primary key,
  tenant_id bigint not null references tenants(id) on delete cascade,
  public_id text not null unique,
  lms_context_id text,
  title text not null,
  section text,
  term text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, lms_context_id)
);

create index if not exists courses_tenant_id_idx on courses (tenant_id);

create table if not exists memberships (
  course_id bigint not null references courses(id) on delete cascade,
  user_id bigint not null references users(id) on delete cascade,
  role text not null check (role in ('student', 'instructor', 'teaching_assistant')),
  created_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

create index if not exists memberships_user_id_idx on memberships (user_id);

create table if not exists assignments (
  id bigint generated always as identity primary key,
  course_id bigint not null references courses(id) on delete cascade,
  public_id text not null unique,
  slug text not null,
  title text not null,
  description text not null default '',
  course_goal text not null,
  due_at timestamptz,
  score numeric(6, 2),
  ai_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create index if not exists assignments_course_id_idx on assignments (course_id);
create index if not exists assignments_course_due_at_idx on assignments (course_id, due_at);

create table if not exists workspaces (
  id bigint generated always as identity primary key,
  public_id text not null unique,
  assignment_id bigint not null references assignments(id) on delete cascade,
  student_id bigint not null references users(id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'ready_to_submit', 'submitted', 'archived')),
  current_step smallint not null default 0 check (current_step between 0 and 4),
  revision bigint not null default 0 check (revision >= 0),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique (assignment_id, student_id)
);

create index if not exists workspaces_assignment_id_idx on workspaces (assignment_id);
create index if not exists workspaces_student_id_idx on workspaces (student_id);
create index if not exists workspaces_student_status_updated_idx
  on workspaces (student_id, status, updated_at desc);

create table if not exists learning_goals (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  source text not null check (source in ('course', 'personal')),
  text text not null check (char_length(text) between 1 and 1000),
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, source, position)
);

create index if not exists learning_goals_workspace_id_idx on learning_goals (workspace_id);

create table if not exists ai_uses (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  purpose text not null
    check (purpose in ('개념 이해', '아이디어 탐색', '반론 검토', '초안 피드백', '근거 확인', '기타')),
  question_summary text not null check (char_length(question_summary) between 1 and 2000),
  suggestion_summary text not null check (char_length(suggestion_summary) between 1 and 4000),
  is_primary boolean not null default false,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_uses_workspace_id_idx on ai_uses (workspace_id);
create unique index if not exists ai_uses_one_primary_per_workspace_idx
  on ai_uses (workspace_id) where is_primary;

create table if not exists decision_checkpoints (
  id bigint generated always as identity primary key,
  ai_use_id bigint not null unique references ai_uses(id) on delete cascade,
  decision text not null check (decision in ('adopt', 'revise', 'reject')),
  reason text not null check (char_length(reason) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists decision_checkpoints_ai_use_id_idx
  on decision_checkpoints (ai_use_id);

create table if not exists reflections (
  workspace_id bigint primary key references workspaces(id) on delete cascade,
  learned text not null check (char_length(learned) between 1 and 3000),
  changed_mind text not null check (char_length(changed_mind) between 1 and 3000),
  remaining_question text not null check (char_length(remaining_question) between 1 and 3000),
  updated_at timestamptz not null default now()
);

create table if not exists disclosure_settings (
  workspace_id bigint primary key references workspaces(id) on delete cascade,
  share_purpose boolean not null default true,
  share_judgment boolean not null default true,
  share_reflection boolean not null default true,
  share_raw boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists proofprint_versions (
  id bigint generated always as identity primary key,
  public_id text not null unique,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  version integer not null check (version > 0),
  snapshot_json jsonb not null,
  checksum text not null,
  submitted_at timestamptz not null default now(),
  unique (workspace_id, version)
);

create index if not exists proofprint_versions_workspace_version_idx
  on proofprint_versions (workspace_id, version desc);

create table if not exists audit_events (
  id bigint generated always as identity primary key,
  actor_user_id bigint not null references users(id) on delete restrict,
  workspace_id bigint not null references workspaces(id) on delete cascade,
  event_type text not null
    check (event_type in ('workspace_saved', 'disclosure_updated', 'proofprint_submitted', 'proofprint_viewed')),
  target_public_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists audit_events_actor_user_id_idx on audit_events (actor_user_id);
create index if not exists audit_events_workspace_occurred_idx
  on audit_events (workspace_id, occurred_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assignments_set_updated_at on assignments;
create trigger assignments_set_updated_at
before update on assignments
for each row execute function set_updated_at();

drop trigger if exists workspaces_set_updated_at on workspaces;
create trigger workspaces_set_updated_at
before update on workspaces
for each row execute function set_updated_at();

drop trigger if exists learning_goals_set_updated_at on learning_goals;
create trigger learning_goals_set_updated_at
before update on learning_goals
for each row execute function set_updated_at();

drop trigger if exists ai_uses_set_updated_at on ai_uses;
create trigger ai_uses_set_updated_at
before update on ai_uses
for each row execute function set_updated_at();

drop trigger if exists decision_checkpoints_set_updated_at on decision_checkpoints;
create trigger decision_checkpoints_set_updated_at
before update on decision_checkpoints
for each row execute function set_updated_at();

drop trigger if exists reflections_set_updated_at on reflections;
create trigger reflections_set_updated_at
before update on reflections
for each row execute function set_updated_at();

drop trigger if exists disclosure_settings_set_updated_at on disclosure_settings;
create trigger disclosure_settings_set_updated_at
before update on disclosure_settings
for each row execute function set_updated_at();
