insert into tenants (public_id, name, data_region, retention_policy)
values (
  'cnu',
  '충남대학교',
  'KR',
  '{"draft_days": 180, "submitted_days": 365}'::jsonb
)
on conflict (public_id) do update
set name = excluded.name,
    data_region = excluded.data_region,
    retention_policy = excluded.retention_policy;

insert into users (
  tenant_id,
  external_subject,
  display_name,
  student_number,
  department,
  role
)
select id, 'demo:cnu:202600001', '기니돼지', '202600001', '컴퓨터융합학부', 'student'
from tenants
where public_id = 'cnu'
on conflict (tenant_id, external_subject) do update
set display_name = excluded.display_name,
    student_number = excluded.student_number,
    department = excluded.department;

insert into courses (tenant_id, public_id, lms_context_id, title, section, term)
select id, 'course_eng_presentation_2026_2_06', 'lms-demo-adventure-design-2026-2-01',
       '어드벤처디자인', '01반', '2026-2'
from tenants
where public_id = 'cnu'
on conflict (public_id) do update
set lms_context_id = excluded.lms_context_id,
    title = excluded.title,
    section = excluded.section,
    term = excluded.term;

insert into courses (tenant_id, public_id, lms_context_id, title, section, term)
select id, 'course_data_ethics_2026_1', 'lms-demo-data-ethics-2026-1',
       '컴퓨팅 사고와 데이터 윤리', '01반', '2026-1'
from tenants
where public_id = 'cnu'
on conflict (public_id) do update
set title = excluded.title,
    section = excluded.section,
    term = excluded.term;

insert into memberships (course_id, user_id, role)
select courses.id, users.id, 'student'
from courses
join tenants on tenants.id = courses.tenant_id
join users on users.tenant_id = tenants.id
where tenants.public_id = 'cnu'
  and users.external_subject = 'demo:cnu:202600001'
on conflict (course_id, user_id) do nothing;

insert into assignments (
  course_id,
  public_id,
  slug,
  title,
  description,
  course_goal,
  due_at,
  score,
  ai_policy
)
select id,
       'assignment_ai_service_proposal',
       'ai-service-proposal',
       '캠퍼스 문제 해결 서비스 설계',
       '충남대학교 캠퍼스에서 겪는 불편을 사용자 관점에서 정의하고, 요구사항과 핵심 기능을 도출해 실행 가능한 소프트웨어 서비스 프로토타입을 제안합니다.',
       '사용자 문제를 요구사항으로 구조화하고, 대안을 비교해 구현 가능한 소프트웨어 해결안을 설계한다.',
       '2026-09-18 23:59:00+09'::timestamptz,
       20,
       '{"proofprint_required": true, "raw_default": false, "cnu_multillm_allowed": true}'::jsonb
from courses
where public_id = 'course_eng_presentation_2026_2_06'
on conflict (public_id) do update
set title = excluded.title,
    description = excluded.description,
    course_goal = excluded.course_goal,
    due_at = excluded.due_at,
    score = excluded.score,
    ai_policy = excluded.ai_policy;

insert into assignments (
  course_id, public_id, slug, title, description, course_goal, due_at, score, ai_policy
)
select id,
       'assignment_team_feedback',
       'team-presentation-feedback',
       '사용자 인터뷰 분석 보고서',
       '캠퍼스 이용자 인터뷰를 분석해 핵심 문제와 요구사항을 도출합니다.',
       '사용자 관찰과 인터뷰 결과를 검증 가능한 요구사항으로 변환한다.',
       '2026-08-19 21:32:00+09'::timestamptz,
       10,
       '{"proofprint_required": true, "raw_default": false}'::jsonb
from courses
where public_id = 'course_eng_presentation_2026_2_06'
on conflict (public_id) do update set title = excluded.title;

insert into assignments (
  course_id, public_id, slug, title, description, course_goal, due_at, score, ai_policy
)
select id,
       'assignment_data_ethics',
       'data-ethics-case-analysis',
       '데이터 윤리 사례 분석',
       '데이터 활용 사례의 윤리적 쟁점을 분석합니다.',
       '데이터 활용의 이익과 위험을 근거로 평가한다.',
       '2026-06-14 18:47:00+09'::timestamptz,
       20,
       '{"proofprint_required": true, "raw_default": false}'::jsonb
from courses
where public_id = 'course_data_ethics_2026_1'
on conflict (public_id) do update set title = excluded.title;

insert into workspaces (public_id, assignment_id, student_id, status, current_step)
select 'workspace_ai_service_proposal_demo', assignments.id, users.id, 'in_progress', 2
from assignments
join courses on courses.id = assignments.course_id
join users on users.tenant_id = courses.tenant_id
where assignments.public_id = 'assignment_ai_service_proposal'
  and users.external_subject = 'demo:cnu:202600001'
on conflict (public_id) do nothing;

insert into workspaces (
  public_id, assignment_id, student_id, status, current_step, started_at, updated_at, submitted_at
)
select 'workspace_team_feedback_demo', assignments.id, users.id, 'submitted', 4,
       '2026-08-18 19:10:00+09'::timestamptz,
       '2026-08-19 21:32:00+09'::timestamptz,
       '2026-08-19 21:32:00+09'::timestamptz
from assignments
join courses on courses.id = assignments.course_id
join users on users.tenant_id = courses.tenant_id
where assignments.public_id = 'assignment_team_feedback'
  and users.external_subject = 'demo:cnu:202600001'
on conflict (public_id) do nothing;

insert into workspaces (
  public_id, assignment_id, student_id, status, current_step, started_at, updated_at, submitted_at
)
select 'workspace_data_ethics_demo', assignments.id, users.id, 'submitted', 4,
       '2026-06-11 13:20:00+09'::timestamptz,
       '2026-06-14 18:47:00+09'::timestamptz,
       '2026-06-14 18:47:00+09'::timestamptz
from assignments
join courses on courses.id = assignments.course_id
join users on users.tenant_id = courses.tenant_id
where assignments.public_id = 'assignment_data_ethics'
  and users.external_subject = 'demo:cnu:202600001'
on conflict (public_id) do nothing;

insert into learning_goals (workspace_id, source, text, position)
select id, 'course', '사용자 문제를 요구사항으로 구조화하고, 대안을 비교해 구현 가능한 소프트웨어 해결안을 설계한다.', 0
from workspaces
where public_id = 'workspace_ai_service_proposal_demo'
on conflict (workspace_id, source, position) do nothing;

insert into learning_goals (workspace_id, source, text, position)
select id, 'personal',
       'AI가 제안한 기능을 그대로 수용하지 않고, 사용자 가치·기술 가능성·개인정보 관점에서 우선순위를 판단할 수 있다.',
       0
from workspaces
where public_id = 'workspace_ai_service_proposal_demo'
on conflict (workspace_id, source, position) do nothing;

insert into ai_uses (
  workspace_id, purpose, question_summary, suggestion_summary, is_primary, occurred_at,
  provider, model_id, source_request_id
)
select id,
       '아이디어 탐색',
       '도서관 좌석과 스터디룸 이용 불편을 해결하는 서비스의 핵심 기능과 예상되는 문제를 제안해 줘.',
       '실시간 좌석 현황, 혼잡도 예측, 스터디룸 예약 통합, 위치 기반 추천 기능을 제안했다. 다만 Wi-Fi·블루투스 기반 위치 추적은 개인정보와 정확도 문제가 있어 자발적 체크인과 익명 집계 방식도 함께 검토해야 한다.',
       true,
       '2026-08-25 14:18:00+09'::timestamptz,
       'demo',
       'cnu-auto',
       'seed-adventure-design-ai-use'
from workspaces
where public_id = 'workspace_ai_service_proposal_demo'
on conflict (workspace_id) where is_primary do nothing;

insert into decision_checkpoints (ai_use_id, decision, reason)
select id,
       'revise',
       '상시 위치 추적 기능은 제외하고, 사용자가 직접 체크인한 정보와 익명 혼잡도 데이터만 활용하도록 수정했다.'
from ai_uses
where workspace_id = (
  select id from workspaces where public_id = 'workspace_ai_service_proposal_demo'
)
  and is_primary
on conflict (ai_use_id) do nothing;

insert into reflections (workspace_id, learned, changed_mind, remaining_question)
select id,
       '기능의 수보다 사용자에게 필요한 정보가 무엇인지, 그 정보를 안전하게 수집할 수 있는지가 서비스 설계에서 더 중요하다는 것을 배웠다.',
       '처음에는 자동 위치 추적이 정확하고 편리하다고 생각했지만, 자발적 체크인과 익명 집계가 신뢰와 구현 가능성을 함께 높일 수 있다고 판단했다.',
       '자발적 체크인만으로도 실제 좌석 현황을 충분히 정확하게 유지하려면 어떤 참여 유인과 검증 방식이 필요할까?'
from workspaces
where public_id = 'workspace_ai_service_proposal_demo'
on conflict (workspace_id) do nothing;

insert into disclosure_settings (
  workspace_id, share_purpose, share_judgment, share_reflection, share_raw
)
select id, true, true, true, false
from workspaces
where public_id = 'workspace_ai_service_proposal_demo'
on conflict (workspace_id) do nothing;

insert into proofprint_versions (
  public_id, workspace_id, version, snapshot_json, checksum, submitted_at
)
select 'proofprint_team_feedback_v1', id, 1,
       '{"title":"사용자 인터뷰 분석 보고서","checkpointCount":4,"rawShared":false}'::jsonb,
       'seed-user-interview-v1',
       '2026-08-19 21:32:00+09'::timestamptz
from workspaces
where public_id = 'workspace_team_feedback_demo'
on conflict (public_id) do nothing;

insert into proofprint_versions (
  public_id, workspace_id, version, snapshot_json, checksum, submitted_at
)
select 'proofprint_data_ethics_v1', id, 1,
       '{"title":"데이터 윤리 사례 분석","checkpointCount":5,"rawShared":false}'::jsonb,
       'seed-data-ethics-v1',
       '2026-06-14 18:47:00+09'::timestamptz
from workspaces
where public_id = 'workspace_data_ethics_demo'
on conflict (public_id) do nothing;
