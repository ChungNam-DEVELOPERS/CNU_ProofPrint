import "server-only";

import type { Row } from "postgres";
import type { ChatMessage } from "../../lib/learning";
import { getDb } from "../db";
import { NotFoundError } from "../errors";
import type { ServerActor } from "../auth";

export type AgentType = "study" | "assignment";

export type AgentContext = {
  workspaceId: string;
  sessionId: string;
  agentType: AgentType;
  assignmentId: string | null;
  assignmentSlug: string | null;
  assignmentTitle: string | null;
  assignmentSummary: string | null;
};

export async function getOrCreateAgentContext(
  workspaceId: string,
  input: { agentType: AgentType; assignmentSlug?: string },
): Promise<AgentContext> {
  const sql = getDb();

  let assignment: {
    id: string;
    slug: string;
    title: string;
    summary: string;
  } | null = null;

  if (input.agentType === "assignment") {
    if (!input.assignmentSlug) throw new NotFoundError("과제를 찾을 수 없습니다.");
    const [row] = await sql<
      Array<Row & { id: string; slug: string; title: string; summary: string }>
    >`
      select id, slug, title, summary
      from workspace_assignments
      where workspace_id = ${workspaceId} and slug = ${input.assignmentSlug}
      limit 1
    `;
    if (!row) throw new NotFoundError("과제를 찾을 수 없습니다.");
    assignment = row;
  }

  const sessionRows = input.agentType === "study"
    ? await sql<Array<Row & { id: string }>>`
      insert into agent_sessions (workspace_id, assignment_id, agent_type, title)
      values (${workspaceId}, null, 'study', '학습하기')
      on conflict (workspace_id) where agent_type = 'study'
      do update set title = excluded.title
      returning id
    `
    : await sql<Array<Row & { id: string }>>`
      insert into agent_sessions (workspace_id, assignment_id, agent_type, title)
      values (${workspaceId}, ${assignment!.id}, 'assignment', ${assignment!.title})
      on conflict (workspace_id, assignment_id) where agent_type = 'assignment'
      do update set title = excluded.title
      returning id
    `;
  const [session] = sessionRows;

  return {
    workspaceId,
    sessionId: session.id,
    agentType: input.agentType,
    assignmentId: assignment?.id ?? null,
    assignmentSlug: assignment?.slug ?? null,
    assignmentTitle: assignment?.title ?? null,
    assignmentSummary: assignment?.summary ?? null,
  };
}

export async function listSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const sql = getDb();
  const rows = await sql<
    Array<Row & { id: string; role: ChatMessage["role"]; content: string; tool: string | null }>
  >`
    select m.id, m.role, m.content,
      (select tc.summary from tool_calls tc
       where tc.message_id = m.id order by tc.occurred_at limit 1) as tool
    from messages m
    where m.session_id = ${sessionId}
    order by m.created_at, m.id
  `;
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    paragraphs: row.content.split("\n\n").filter(Boolean),
    tool: row.tool,
  }));
}

export async function appendSessionMessage(
  context: AgentContext,
  role: "user" | "agent",
  content: string,
) {
  const sql = getDb();
  const [row] = await sql<Array<Row & { id: string }>>`
    insert into messages (workspace_id, session_id, role, content)
    values (${context.workspaceId}, ${context.sessionId}, ${role}, ${content})
    returning id
  `;
  return row.id;
}

export async function recordSessionToolCall(
  context: AgentContext,
  messageId: string | null,
  tool: string,
  summary: string,
  args: unknown,
  result: unknown,
) {
  const sql = getDb();
  await sql`
    insert into tool_calls (
      workspace_id, session_id, message_id, tool, summary, args, result
    ) values (
      ${context.workspaceId}, ${context.sessionId}, ${messageId}, ${tool}, ${summary},
      ${JSON.stringify(args ?? {})}::jsonb, ${JSON.stringify(result ?? {})}::jsonb
    )
  `;
}

export async function createArtifact(
  context: AgentContext,
  artifactType:
    | "learning_evidence"
    | "learning_gap"
    | "syllabus_topic"
    | "ai_contribution"
    | "decision_candidate"
    | "reflection_candidate"
    | "organized_summary",
  payload: unknown,
  canonicalKey?: string | null,
) {
  const sql = getDb();
  const [artifact] = await sql<Array<Row & { id: string }>>`
    insert into agent_artifacts (
      workspace_id, assignment_id, session_id, agent_type, artifact_type, payload, canonical_key
    ) values (
      ${context.workspaceId}, ${context.assignmentId}, ${context.sessionId},
      ${context.agentType}, ${artifactType}, ${sql.json(payload as never)},
      ${canonicalKey ?? null}
    )
    returning id
  `;
  return artifact.id;
}

export type DecisionCandidate = {
  id: string;
  decision: "adopt" | "revise" | "reject";
  reason: string;
  source: string;
  status: "pending" | "approved" | "rejected";
};

export async function listDecisionCandidates(
  context: AgentContext,
): Promise<DecisionCandidate[]> {
  if (!context.assignmentId) return [];
  const sql = getDb();
  const rows = await sql<
    Array<
      Row & {
        id: string;
        decision: DecisionCandidate["decision"];
        reason: string;
        source: string;
        status: DecisionCandidate["status"];
      }
    >
  >`
    select a.id,
      coalesce(ap.edited_payload->>'decision', a.payload->>'decision') as decision,
      coalesce(ap.edited_payload->>'reason', a.payload->>'reason') as reason,
      coalesce(a.payload->>'source', '') as source,
      coalesce(ap.status, 'pending') as status
    from agent_artifacts a
    left join artifact_approvals ap on ap.artifact_id = a.id
    where a.assignment_id = ${context.assignmentId}
      and a.artifact_type = 'decision_candidate'
    order by a.created_at desc
  `;
  return rows;
}

export async function decideCandidate(
  actor: ServerActor,
  context: AgentContext,
  artifactId: string,
  status: "approved" | "rejected",
  edited?: { decision: DecisionCandidate["decision"]; reason: string },
) {
  if (!context.assignmentId) throw new NotFoundError("과제를 찾을 수 없습니다.");
  const sql = getDb();
  const [student] = await sql<Array<Row & { id: string }>>`
    select u.id from users u
    join tenants t on t.id = u.tenant_id
    join workspaces w on w.owner_id = u.id
    where t.public_id = ${actor.tenantPublicId}
      and u.external_subject = ${actor.externalSubject}
      and w.id = ${context.workspaceId}
    limit 1
  `;
  if (!student) throw new NotFoundError("사용자를 찾을 수 없습니다.");

  const [artifact] = await sql<Array<Row & { id: string }>>`
    select id from agent_artifacts
    where id = ${artifactId}
      and workspace_id = ${context.workspaceId}
      and assignment_id = ${context.assignmentId}
      and artifact_type = 'decision_candidate'
    limit 1
  `;
  if (!artifact) throw new NotFoundError("판단 후보를 찾을 수 없습니다.");

  await sql`
    insert into artifact_approvals (
      artifact_id, student_id, status, edited_payload, decided_at
    )
    values (
      ${artifact.id}, ${student.id}, ${status},
      ${edited ? sql.json(edited) : null}, now()
    )
    on conflict (artifact_id) do update set
      status = excluded.status,
      student_id = excluded.student_id,
      edited_payload = excluded.edited_payload,
      decided_at = excluded.decided_at
  `;

  if (status === "approved") {
    await sql`
      insert into proofprint_sources (proofprint_id, artifact_id, section)
      select wa.proofprint_id, ${artifact.id}, 'judgment'
      from workspace_assignments wa
      where wa.id = ${context.assignmentId} and wa.proofprint_id is not null
      on conflict do nothing
    `;
  } else {
    await sql`
      delete from proofprint_sources
      where artifact_id = ${artifact.id} and section = 'judgment'
    `;
  }
  return { id: artifact.id, status };
}
