-- 007 이후 초기 구현에서 JSON.stringify 결과를 postgres.js가 다시 JSON 문자열로
-- 감싼 기록을 실제 jsonb 객체로 복구한다.
update agent_artifacts
set payload = (payload #>> '{}')::jsonb
where jsonb_typeof(payload) = 'string'
  and left(payload #>> '{}', 1) in ('{', '[');

update artifact_approvals
set edited_payload = (edited_payload #>> '{}')::jsonb
where jsonb_typeof(edited_payload) = 'string'
  and left(edited_payload #>> '{}', 1) in ('{', '[');
