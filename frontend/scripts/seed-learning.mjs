// 워크스페이스 학습 데이터를 목 데이터에서 한 번 옮겨 심는다.
// 상대 시각 문구("3분 전")는 실제 timestamptz 로 바꿔 저장한다.
import postgres from "postgres";
import { workspaces, assignments, sampleConversation } from "./learning-seed-data.mjs";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres@127.0.0.1:55432/cnu_proofprint";
const sql = postgres(databaseUrl, { max: 1, prepare: false });

const NOW = new Date();
const YEAR = 2026;

function ago(ms) {
  return new Date(NOW.getTime() - ms);
}

/** "3분 전", "2시간 전", "어제", "8월 24일", "9월 18일 23:59" → Date */
function toTimestamp(label) {
  if (!label) return null;
  let match;
  if ((match = label.match(/^(\d+)분 전$/))) return ago(Number(match[1]) * 60_000);
  if ((match = label.match(/^(\d+)시간 전$/))) return ago(Number(match[1]) * 3_600_000);
  if ((match = label.match(/^(\d+)일 전$/))) return ago(Number(match[1]) * 86_400_000);
  if (label === "어제") return ago(86_400_000);
  if (label === "오늘") return NOW;
  if ((match = label.match(/^(\d+)월 (\d+)일(?:\s+(\d+):(\d+))?$/))) {
    return new Date(
      YEAR,
      Number(match[1]) - 1,
      Number(match[2]),
      match[3] ? Number(match[3]) : 12,
      match[4] ? Number(match[4]) : 0,
    );
  }
  return null;
}

/** 데모 오답노트에 «왜 기록됐는지» 를 채운다. */
function gapSignal(note) {
  if (note.occurrences > 1) return "repeat_question";
  if (note.confusedWith) return "incorrect_explanation";
  return "explicit_confusion";
}

/** 이해도 상태에서 근거 종류를 되짚는다. */
function evidenceKind(level) {
  if (level === "solid") return "self_explained";
  if (level === "shaky") return "incomplete_explanation";
  if (level === "exposed") return "explained_by_agent";
  return "seen_in_material";
}

const [actor] = await sql`
  select u.id as user_id, u.tenant_id
  from users u
  join tenants t on t.id = u.tenant_id
  where t.public_id = 'cnu' and u.external_subject = ${
    process.env.DEMO_STUDENT_SUB ?? "demo:cnu:202600001"
  }
  limit 1
`;

if (!actor) {
  console.error("데모 학생을 찾지 못했습니다. 먼저 npm run db:seed 를 실행하세요.");
  await sql.end();
  process.exit(1);
}

let counts = { workspaces: 0, topics: 0, evidence: 0, gaps: 0, materials: 0, tools: 0, assignments: 0, messages: 0 };

for (const workspace of workspaces) {
  const [row] = await sql`
    insert into workspaces (
      public_id, tenant_id, owner_id, slug, title, subject, term, emoji,
      status, source, summary, next_action, study_minutes, updated_at
    ) values (
      ${"ws_" + workspace.slug.replace(/-/g, "_")}, ${actor.tenant_id}, ${actor.user_id},
      ${workspace.slug}, ${workspace.title}, ${workspace.subject}, ${workspace.term},
      ${workspace.emoji}, ${workspace.status}, 'cybercampus', ${workspace.summary},
      ${workspace.nextAction}, ${workspace.studyMinutes},
      ${toTimestamp(workspace.updatedAt) ?? NOW}
    )
    on conflict (owner_id, slug) do update set
      title = excluded.title,
      summary = excluded.summary,
      next_action = excluded.next_action,
      study_minutes = excluded.study_minutes,
      updated_at = excluded.updated_at
    returning id
  `;
  const workspaceId = row.id;
  counts.workspaces += 1;

  await sql`delete from topics where workspace_id = ${workspaceId}`;
  await sql`delete from gaps where workspace_id = ${workspaceId}`;
  await sql`delete from materials where workspace_id = ${workspaceId}`;
  await sql`delete from tool_calls where workspace_id = ${workspaceId}`;
  await sql`delete from messages where workspace_id = ${workspaceId}`;
  await sql`delete from workspace_assignments where workspace_id = ${workspaceId}`;

  const topicIdByTitle = new Map();
  const normalizeTitle = (title) => title.replace(/^[0-9]+[.)]?\s*/, "").toLowerCase();

  async function insertTopic(topic, parentId, position) {
    const at = toTimestamp(topic.updatedAt);
    const [inserted] = await sql`
      insert into topics (
        workspace_id, parent_id, position, title, level, evidence_note, last_evidence_at
      ) values (
        ${workspaceId}, ${parentId}, ${position}, ${topic.title}, ${topic.level},
        ${topic.evidence ?? null}, ${at}
      )
      returning id
    `;
    counts.topics += 1;
    topicIdByTitle.set(topic.title, inserted.id);
    topicIdByTitle.set(normalizeTitle(topic.title), inserted.id);

    if (topic.level !== "unseen") {
      await sql`
        insert into topic_evidence (topic_id, kind, note, occurred_at)
        values (${inserted.id}, ${evidenceKind(topic.level)},
                ${topic.evidence ?? ""}, ${at ?? NOW})
      `;
      counts.evidence += 1;
    }

    let childPosition = 0;
    for (const child of topic.children ?? []) {
      await insertTopic(child, inserted.id, childPosition);
      childPosition += 1;
    }
  }

  let position = 0;
  for (const topic of workspace.topics) {
    await insertTopic(topic, null, position);
    position += 1;
  }

  for (const note of workspace.notes) {
    const seen = toTimestamp(note.lastSeen) ?? NOW;
    await sql`
      insert into gaps (
        workspace_id, topic_id, kind, term, definition, key_point,
        confused_with, occurrences, status, signal, first_seen_at, last_seen_at
      ) values (
        ${workspaceId}, ${topicIdByTitle.get(note.topicTitle) ?? topicIdByTitle.get(normalizeTitle(note.topicTitle)) ?? null}, ${note.kind},
        ${note.term}, ${note.definition}, ${note.keyPoint}, ${note.confusedWith},
        ${note.occurrences}, ${note.status}, ${gapSignal(note)}, ${seen}, ${seen}
      )
      on conflict (workspace_id, term) do update set
        occurrences = excluded.occurrences,
        status = excluded.status,
        signal = excluded.signal,
        last_seen_at = excluded.last_seen_at
    `;
    counts.gaps += 1;
  }

  for (const material of workspace.materials) {
    await sql`
      insert into materials (workspace_id, kind, title, extent, used_count, added_at)
      values (${workspaceId}, ${material.kind}, ${material.title}, ${material.pages},
              ${material.usedCount}, ${toTimestamp(material.addedAt) ?? NOW})
    `;
    counts.materials += 1;
  }

  for (const item of workspace.activity) {
    await sql`
      insert into tool_calls (workspace_id, tool, summary, occurred_at)
      values (${workspaceId}, ${item.tool}, ${item.message},
              ${toTimestamp(item.at) ?? NOW})
    `;
    counts.tools += 1;
  }

  for (const item of assignments.filter((a) => a.workspaceSlug === workspace.slug)) {
    const [proofprint] = item.hasProofprint
      ? await sql`
          select p.id from proofprints p
          join assignments a on a.id = p.assignment_id
          where a.slug = 'ai-service-proposal' and p.student_id = ${actor.user_id}
          limit 1
        `
      : [];

    await sql`
      insert into workspace_assignments (
        workspace_id, slug, title, summary, source, status, due_at, due_label,
        proofprint_id
      ) values (
        ${workspaceId}, ${item.id}, ${item.title}, ${item.summary}, ${item.source},
        ${item.status}, ${toTimestamp(item.due)}, ${item.due},
        ${proofprint?.id ?? null}
      )
      on conflict (workspace_id, slug) do update set
        status = excluded.status,
        summary = excluded.summary,
        proofprint_id = excluded.proofprint_id
    `;
    counts.assignments += 1;
  }

  if (sampleConversation.workspaceSlug === workspace.slug) {
    let offset = sampleConversation.messages.length;
    for (const message of sampleConversation.messages) {
      const at = ago(offset * 4 * 60_000);
      offset -= 1;
      const [inserted] = await sql`
        insert into messages (workspace_id, role, content, created_at)
        values (${workspaceId}, ${message.role},
                ${message.paragraphs.join("\n\n")}, ${at})
        returning id
      `;
      counts.messages += 1;

      if (message.tool) {
        const tool = message.tool.split("—")[0].trim();
        await sql`
          insert into tool_calls (workspace_id, message_id, tool, summary, occurred_at)
          values (${workspaceId}, ${inserted.id}, ${tool}, ${message.tool}, ${at})
        `;
        counts.tools += 1;
      }
    }
  }
}

console.log("학습 데이터 시드 완료:", counts);
await sql.end();
