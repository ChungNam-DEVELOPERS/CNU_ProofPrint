-- 자료를 제목만 두지 않고 본문까지 저장한다.
-- read_material 이 제목 매칭만 하던 반쪽 상태를 벗어나기 위한 것.

alter table materials
  add column if not exists page_count integer,
  add column if not exists byte_size integer,
  add column if not exists mime_type text;

-- 에이전트가 통째로 읽으면 맥락이 낭비되므로 조각 단위로 찾는다.
create table if not exists material_chunks (
  id bigint generated always as identity primary key,
  material_id bigint not null references materials(id) on delete cascade,
  page integer,
  position integer not null default 0 check (position >= 0),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists material_chunks_material_idx
  on material_chunks (material_id, position);
