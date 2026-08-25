alter table ai_uses
  add column if not exists provider text not null default 'manual',
  add column if not exists model_id text,
  add column if not exists source_request_id text;

do $$
begin
  alter table ai_uses
    add constraint ai_uses_provider_check
    check (provider in ('manual', 'demo', 'cnu_multillm'));
exception
  when duplicate_object then null;
end;
$$;

create index if not exists ai_uses_source_request_id_idx
  on ai_uses (source_request_id)
  where source_request_id is not null;
