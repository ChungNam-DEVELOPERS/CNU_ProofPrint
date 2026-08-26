import "server-only";

import type { Row } from "postgres";
import type { UnderstandingLevel } from "../lib/learning";
import { getDb } from "./db";

/** 오답노트에 남길 만한 «막힘» 신호. 개념이 처음 나온 것만으로는 신호가 아니다. */
export type GapSignal =
  | "repeat_question"
  | "slow_to_grasp"
  | "explicit_confusion"
  | "incorrect_explanation";

export type EvidenceKind =
  | "explained_by_agent"
  | "seen_in_material"
  | "self_explained"
  | "incomplete_explanation"
  | "gap_recorded"
  | "gap_resolved";

/**
 * 이해도는 에이전트가 직접 쓰지 않는다. 근거 기록에서 서버가 계산한다.
 * 에이전트가 설명해 준 것만으로는 exposed 를 넘지 못하고,
 * 학생이 직접 산출한 근거가 있어야 solid 가 된다.
 */
export function levelFromEvidence(kinds: EvidenceKind[]): UnderstandingLevel {
  let level: UnderstandingLevel = "unseen";

  for (const kind of kinds) {
    switch (kind) {
      case "explained_by_agent":
      case "seen_in_material":
        // 노출은 미학습에서만 끌어올린다. 이미 올라간 상태를 내리지도 않는다.
        if (level === "unseen") level = "exposed";
        break;
      case "self_explained":
      case "gap_resolved":
        level = "solid";
        break;
      case "incomplete_explanation":
      case "gap_recorded":
        level = "shaky";
        break;
    }
  }

  return level;
}

async function recomputeTopicLevel(topicId: string) {
  const sql = getDb();
  const rows = await sql<Array<Row & { kind: EvidenceKind }>>`
    select kind from topic_evidence
    where topic_id = ${topicId}
    order by occurred_at, id
  `;
  const level = levelFromEvidence(rows.map((row) => row.kind));

  await sql`
    update topics set
      level = ${level},
      last_evidence_at = coalesce(
        (select max(occurred_at) from topic_evidence where topic_id = ${topicId}),
        last_evidence_at
      ),
      evidence_note = coalesce(
        (select note from topic_evidence
          where topic_id = ${topicId} and note <> ''
          order by occurred_at desc, id desc limit 1),
        evidence_note
      )
    where id = ${topicId}
  `;
  return level;
}

/** 목차 제목은 «3. 고유값과 고유벡터» 처럼 번호가 붙어 있다. 번호는 무시하고 찾는다. */
const TITLE_PREFIX = '^[0-9]+[.)]?\\s*';

async function findTopicId(workspaceId: string, title: string) {
  const sql = getDb();
  const [row] = await sql<Array<Row & { id: string }>>`
    select id from topics
    where workspace_id = ${workspaceId}
      and (
        lower(title) = lower(${title})
        or lower(regexp_replace(title, ${TITLE_PREFIX}, ''))
           = lower(regexp_replace(${title}, ${TITLE_PREFIX}, ''))
      )
    order by parent_id nulls first
    limit 1
  `;
  return row?.id ?? null;
}

export async function logEvidence(
  workspaceId: string,
  topicTitle: string,
  kind: EvidenceKind,
  note: string,
) {
  const topicId = await findTopicId(workspaceId, topicTitle);
  if (!topicId) {
    return { ok: false as const, reason: `목차에 «${topicTitle}» 이(가) 없습니다.` };
  }

  const sql = getDb();
  await sql`
    insert into topic_evidence (topic_id, kind, note)
    values (${topicId}, ${kind}, ${note})
  `;
  const level = await recomputeTopicLevel(topicId);
  return { ok: true as const, topicTitle, level };
}

/** 같은 개념을 또 몰라도 행이 늘지 않고 occurrences 만 올라간다. */
export async function upsertGap(
  workspaceId: string,
  input: {
    term: string;
    kind: "개념" | "공식" | "정리" | "용어";
    definition: string;
    keyPoint: string;
    confusedWith?: string | null;
    topicTitle?: string | null;
    signal: GapSignal;
  },
) {
  const sql = getDb();
  const topicId = input.topicTitle
    ? await findTopicId(workspaceId, input.topicTitle)
    : null;

  const [row] = await sql<Array<Row & { occurrences: number }>>`
    insert into gaps (
      workspace_id, topic_id, kind, term, definition, key_point, confused_with, signal
    ) values (
      ${workspaceId}, ${topicId}, ${input.kind}, ${input.term},
      ${input.definition}, ${input.keyPoint}, ${input.confusedWith ?? null}, ${input.signal}
    )
    on conflict (workspace_id, term) do update set
      occurrences = gaps.occurrences + 1,
      status = case when gaps.status = 'resolved' then 'open' else gaps.status end,
      definition = excluded.definition,
      key_point = excluded.key_point,
      confused_with = coalesce(excluded.confused_with, gaps.confused_with),
      signal = excluded.signal,
      last_seen_at = now()
    returning occurrences
  `;

  // 오답노트에 남았다는 것 자체가 이해도 근거다.
  if (topicId) {
    await sql`
      insert into topic_evidence (topic_id, kind, note)
      values (${topicId}, 'gap_recorded', ${`«${input.term}» 을(를) 오답노트에 기록`})
    `;
    await recomputeTopicLevel(topicId);
  }

  return { term: input.term, occurrences: Number(row.occurrences) };
}

export type SyllabusOp =
  | { op: "add"; title: string; parentTitle?: string | null }
  | { op: "rename"; title: string; newTitle: string };

export async function applySyllabusOps(workspaceId: string, ops: SyllabusOp[]) {
  const sql = getDb();
  const applied: string[] = [];

  for (const op of ops) {
    if (op.op === "add") {
      if (await findTopicId(workspaceId, op.title)) continue;
      const parentId = op.parentTitle
        ? await findTopicId(workspaceId, op.parentTitle)
        : null;
      const [{ next }] = await sql<Array<Row & { next: number }>>`
        select coalesce(max(position) + 1, 0) as next from topics
        where workspace_id = ${workspaceId}
          and parent_id is not distinct from ${parentId}
      `;
      await sql`
        insert into topics (workspace_id, parent_id, position, title)
        values (${workspaceId}, ${parentId}, ${next}, ${op.title})
      `;
      applied.push(`추가: ${op.title}`);
    } else {
      const topicId = await findTopicId(workspaceId, op.title);
      if (!topicId) continue;
      await sql`update topics set title = ${op.newTitle} where id = ${topicId}`;
      applied.push(`이름 변경: ${op.title} → ${op.newTitle}`);
    }
  }

  return applied;
}

export async function searchMaterials(workspaceId: string, query: string) {
  const sql = getDb();
  const rows = await sql<Array<Row & { id: string; title: string; extent: string }>>`
    select id, title, extent from materials
    where workspace_id = ${workspaceId}
      and (title ilike ${"%" + query + "%"} or ${query} = '')
    order by used_count desc
    limit 5
  `;

  if (rows.length > 0) {
    await sql`
      update materials set used_count = used_count + 1
      where id in ${sql(rows.map((row) => row.id))}
    `;
  }

  return rows.map((row) => ({ title: row.title, extent: row.extent }));
}

export async function appendMessage(
  workspaceId: string,
  role: "user" | "agent",
  content: string,
) {
  const sql = getDb();
  const [row] = await sql<Array<Row & { id: string }>>`
    insert into messages (workspace_id, role, content)
    values (${workspaceId}, ${role}, ${content})
    returning id
  `;
  return row.id;
}

export async function recordToolCall(
  workspaceId: string,
  messageId: string | null,
  tool: string,
  summary: string,
  args: unknown,
  result: unknown,
) {
  const sql = getDb();
  await sql`
    insert into tool_calls (workspace_id, message_id, tool, summary, args, result)
    values (${workspaceId}, ${messageId}, ${tool}, ${summary},
            ${JSON.stringify(args ?? {})}::jsonb, ${JSON.stringify(result ?? {})}::jsonb)
  `;
}

export async function touchWorkspace(
  workspaceId: string,
  patch?: { summary?: string; nextAction?: string },
) {
  const sql = getDb();
  await sql`
    update workspaces set
      summary = coalesce(${patch?.summary ?? null}, summary),
      next_action = coalesce(${patch?.nextAction ?? null}, next_action),
      updated_at = now()
    where id = ${workspaceId}
  `;
}
