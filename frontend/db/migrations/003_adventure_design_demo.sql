update courses
set title = '어드벤처디자인',
    section = '01반',
    lms_context_id = 'lms-demo-adventure-design-2026-2-01'
where public_id = 'course_eng_presentation_2026_2_06';

update assignments
set title = '캠퍼스 문제 해결 서비스 설계',
    description = '충남대학교 캠퍼스에서 겪는 불편을 사용자 관점에서 정의하고, 요구사항과 핵심 기능을 도출해 실행 가능한 소프트웨어 서비스 프로토타입을 제안합니다.',
    course_goal = '사용자 문제를 요구사항으로 구조화하고, 대안을 비교해 구현 가능한 소프트웨어 해결안을 설계한다.',
    ai_policy = '{"proofprint_required": true, "raw_default": false, "cnu_multillm_allowed": true}'::jsonb
where public_id = 'assignment_ai_service_proposal';

update assignments
set title = '사용자 인터뷰 분석 보고서',
    description = '캠퍼스 이용자 인터뷰를 분석해 핵심 문제와 요구사항을 도출합니다.',
    course_goal = '사용자 관찰과 인터뷰 결과를 검증 가능한 요구사항으로 변환한다.'
where public_id = 'assignment_team_feedback';

update learning_goals
set text = '사용자 문제를 요구사항으로 구조화하고, 대안을 비교해 구현 가능한 소프트웨어 해결안을 설계한다.'
where workspace_id = (
  select id from workspaces where public_id = 'workspace_ai_service_proposal_demo'
)
  and source = 'course'
  and position = 0;

update learning_goals
set text = 'AI가 제안한 기능을 그대로 수용하지 않고, 사용자 가치·기술 가능성·개인정보 관점에서 우선순위를 판단할 수 있다.'
where workspace_id = (
  select id from workspaces where public_id = 'workspace_ai_service_proposal_demo'
)
  and source = 'personal'
  and position = 0
  and text = 'AI 제안을 그대로 받아들이지 않고, 개인정보와 평가 공정성 관점에서 수정할 수 있다.';

update ai_uses
set purpose = '아이디어 탐색',
    question_summary = '도서관 좌석과 스터디룸 이용 불편을 해결하는 서비스의 핵심 기능과 예상되는 문제를 제안해 줘.',
    suggestion_summary = '실시간 좌석 현황, 혼잡도 예측, 스터디룸 예약 통합, 위치 기반 추천 기능을 제안했다. 다만 Wi-Fi·블루투스 기반 위치 추적은 개인정보와 정확도 문제가 있어 자발적 체크인과 익명 집계 방식도 함께 검토해야 한다.',
    provider = 'demo',
    model_id = 'cnu-auto',
    source_request_id = 'seed-adventure-design-ai-use'
where workspace_id = (
  select id from workspaces where public_id = 'workspace_ai_service_proposal_demo'
)
  and is_primary
  and question_summary = '학습과정 기록 서비스가 학생의 개인정보를 과도하게 수집한다는 반론을 검토해 줘.';

update decision_checkpoints
set decision = 'revise',
    reason = '상시 위치 추적 기능은 제외하고, 사용자가 직접 체크인한 정보와 익명 혼잡도 데이터만 활용하도록 수정했다.'
where ai_use_id = (
  select id
  from ai_uses
  where workspace_id = (
    select id from workspaces where public_id = 'workspace_ai_service_proposal_demo'
  )
    and is_primary
)
  and reason = '그대로 적용하기에는 개인정보 노출 위험이 있어 공개 범위를 학생이 선택하도록 수정했다.';

update reflections
set learned = '기능의 수보다 사용자에게 필요한 정보가 무엇인지, 그 정보를 안전하게 수집할 수 있는지가 서비스 설계에서 더 중요하다는 것을 배웠다.',
    changed_mind = '처음에는 자동 위치 추적이 정확하고 편리하다고 생각했지만, 자발적 체크인과 익명 집계가 신뢰와 구현 가능성을 함께 높일 수 있다고 판단했다.',
    remaining_question = '자발적 체크인만으로도 실제 좌석 현황을 충분히 정확하게 유지하려면 어떤 참여 유인과 검증 방식이 필요할까?'
where workspace_id = (
  select id from workspaces where public_id = 'workspace_ai_service_proposal_demo'
)
  and learned = '기록의 양보다 학생의 선택과 판단 이유가 학습과정을 설명하는 데 더 중요하다는 것을 배웠다.';

update proofprint_versions
set snapshot_json = '{"title":"사용자 인터뷰 분석 보고서","checkpointCount":4,"rawShared":false}'::jsonb,
    checksum = 'seed-user-interview-v1'
where public_id = 'proofprint_team_feedback_v1';

update workspaces
set revision = revision + 1
where public_id = 'workspace_ai_service_proposal_demo';
