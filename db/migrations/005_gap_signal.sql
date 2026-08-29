-- 오답노트에 왜 기록됐는지 남긴다. 개념이 처음 나왔다는 이유만으로는 기록하지 않고,
-- 학생이 실제로 막혔다는 신호가 있을 때만 기록한다는 규칙을 감사 가능하게 만든다.
alter table gaps
  add column if not exists signal text;

do $$
begin
  alter table gaps
    add constraint gaps_signal_check
    check (signal is null or signal in (
      'repeat_question',        -- 전에 다룬 것을 다시 물음
      'slow_to_grasp',          -- 설명 뒤 한참 있다 되물음
      'explicit_confusion',     -- 모르겠다고 직접 말함
      'incorrect_explanation'   -- 설명해 봤는데 어긋남
    ));
exception
  when duplicate_object then null;
end;
$$;
