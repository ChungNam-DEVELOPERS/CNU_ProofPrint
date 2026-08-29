import "server-only";

import type { Row } from "postgres";
import { getDb } from "../db";
import type { AgentContext } from "./sessions";

type ArtifactRow = Row & {
  id: string;
  artifact_type: string;
  payload: Record<string, unknown>;
  approval_status: "pending" | "approved" | "rejected" | "not_required";
};

function text(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function canonicalKey(artifact: ArtifactRow) {
  const candidate =
    text(artifact.payload, "term") ||
    text(artifact.payload, "topicTitle") ||
    text(artifact.payload, "questionSummary") ||
    artifact.artifact_type;
  return candidate.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").slice(0, 200);
}

function sectionFor(artifact: ArtifactRow) {
  if (artifact.artifact_type === "decision_candidate") return "judgment" as const;
  if (artifact.artifact_type === "ai_contribution") return "ai_use" as const;
  if (artifact.artifact_type === "reflection_candidate") return "reflection" as const;
  return "learning" as const;
}

function summaryLine(artifact: ArtifactRow) {
  const payload = artifact.payload;
  return (
    text(payload, "contributionSummary") ||
    text(payload, "reason") ||
    text(payload, "note") ||
    text(payload, "definition") ||
    text(payload, "term")
  );
}

/**
 * 외부 모델을 다시 호출하지 않는 정리 단계다. 원본은 보존하고 정규화 키·목차 링크·
 * Proofprint 출처만 만든다. 의미 기반 재분류는 별도 동의가 있는 경우에만 확장한다.
 */
export async function runOrganizer(context: AgentContext) {
  const sql = getDb();
  const artifactScope = context.assignmentId
    ? sql`(a.assignment_id is null or a.assignment_id = ${context.assignmentId})`
    : sql`true`;
  const [artifacts, topics] = await Promise.all([
    sql<ArtifactRow[]>`
      select a.id, a.artifact_type, a.payload,
             coalesce(ap.status, 'not_required') as approval_status
      from agent_artifacts a
      left join artifact_approvals ap on ap.artifact_id = a.id
      where a.workspace_id = ${context.workspaceId} and a.organized_at is null
        and ${artifactScope}
      order by a.id limit 100
    `,
    sql<Array<Row & { id: string; title: string }>>`
      select id, title from topics
      where workspace_id = ${context.workspaceId}
      order by position, id
    `,
  ]);

  const eligible = artifacts.filter(
    (artifact) =>
      artifact.artifact_type !== "decision_candidate" ||
      artifact.approval_status !== "pending",
  );
  if (eligible.length === 0) {
    return { mode: "local" as const, organized: 0, linked: 0 };
  }

  const topicByTitle = new Map(
    topics.map((topic) => [topic.title.replace(/^[0-9]+[.)]?\s*/, "").toLowerCase(), topic.id]),
  );
  const lines = eligible.map(summaryLine).filter(Boolean);
  const summary = lines.length > 0
    ? lines.slice(-3).join(" ").slice(0, 600)
    : `새 학습·과제 기록 ${eligible.length}개를 정리했습니다.`;
  const openDecision = artifacts.some(
    (artifact) =>
      artifact.artifact_type === "decision_candidate" &&
      artifact.approval_status === "pending",
  );
  const nextAction = openDecision
    ? "AI가 만든 판단 후보를 확인하고 내 문장으로 수정해 확정하기"
    : "정리된 근거로 Proofprint 초안을 확인하기";

  let linked = 0;
  await sql.begin(async (tx) => {
    for (const artifact of eligible) {
      const topicTitle = text(artifact.payload, "topicTitle")
        .replace(/^[0-9]+[.)]?\s*/, "")
        .toLowerCase();
      const topicId = topicByTitle.get(topicTitle) ?? null;
      if (topicId) {
        await tx`
          update agent_artifacts set
            canonical_key = ${canonicalKey(artifact)},
            payload = payload || jsonb_build_object('organizedTopicId', ${topicId}),
            organized_at = now()
          where id = ${artifact.id} and workspace_id = ${context.workspaceId}
        `;
      } else {
        await tx`
          update agent_artifacts set
            canonical_key = ${canonicalKey(artifact)}, organized_at = now()
          where id = ${artifact.id} and workspace_id = ${context.workspaceId}
        `;
      }

      if (!context.assignmentId || artifact.approval_status === "rejected") continue;
      const rows = await tx`
        insert into proofprint_sources (proofprint_id, artifact_id, section)
        select wa.proofprint_id, ${artifact.id}, ${sectionFor(artifact)}
        from workspace_assignments wa
        where wa.id = ${context.assignmentId} and wa.proofprint_id is not null
        on conflict do nothing
        returning artifact_id
      `;
      linked += rows.length;
    }

    await tx`
      update workspaces set
        summary = ${summary}, next_action = ${nextAction}, updated_at = now()
      where id = ${context.workspaceId}
    `;
  });

  return { mode: "local" as const, organized: eligible.length, linked };
}

export async function getOrganizerStatus(context: AgentContext) {
  const sql = getDb();
  const artifactScope = context.assignmentId
    ? sql`(a.assignment_id is null or a.assignment_id = ${context.assignmentId})`
    : sql`true`;
  const [row] = await sql<Array<{ pending: number; organized: number }>>`
    select
      count(*) filter (
        where a.organized_at is null
          and not (a.artifact_type = 'decision_candidate' and coalesce(ap.status, 'pending') = 'pending')
      )::int as pending,
      count(*) filter (where a.organized_at is not null)::int as organized
    from agent_artifacts a
    left join artifact_approvals ap on ap.artifact_id = a.id
    where a.workspace_id = ${context.workspaceId}
      and ${artifactScope}
  `;
  return {
    pending: Number(row?.pending ?? 0),
    organized: Number(row?.organized ?? 0),
  };
}
