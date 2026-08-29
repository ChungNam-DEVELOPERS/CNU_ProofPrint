import "server-only";

import type { Row } from "postgres";
import type {
  ActivityItem,
  Assignment,
  ChatMessage,
  Gap,
  Material,
  Topic,
  ToolName,
  UnderstandingLevel,
  Workspace,
} from "../lib/learning";
import { formatWhen } from "../lib/learning";
import type { ServerActor } from "./auth";
import { getDb } from "./db";
import { NotFoundError } from "./errors";

type WorkspaceRow = Row & {
  id: string;
  slug: string;
  title: string;
  subject: string;
  term: string;
  emoji: string;
  status: string;
  summary: string;
  next_action: string;
  study_minutes: number;
  updated_at: Date;
};

function toWorkspace(row: WorkspaceRow): Workspace {
  return {
    slug: row.slug,
    title: row.title,
    subject: row.subject,
    term: row.term,
    emoji: row.emoji,
    status: row.status,
    summary: row.summary,
    nextAction: row.next_action,
    updatedAt: formatWhen(row.updated_at),
    studyMinutes: Number(row.study_minutes),
  };
}

export async function listWorkspaces(actor: ServerActor): Promise<Workspace[]> {
  const sql = getDb();
  const rows = await sql<WorkspaceRow[]>`
    select w.id, w.slug, w.title, w.subject, w.term, w.emoji, w.status,
           w.summary, w.next_action, w.study_minutes, w.updated_at
    from workspaces w
    join users u on u.id = w.owner_id
    join tenants t on t.id = u.tenant_id
    where t.public_id = ${actor.tenantPublicId}
      and u.external_subject = ${actor.externalSubject}
    order by w.updated_at desc
  `;
  return rows.map(toWorkspace);
}

/** 워크스페이스의 내부 id. 소유자가 아니면 찾지 못한 것으로 처리한다. */
async function resolveWorkspaceId(
  actor: ServerActor,
  slug: string,
): Promise<string | null> {
  const sql = getDb();
  const [row] = await sql<Array<Row & { id: string }>>`
    select w.id
    from workspaces w
    join users u on u.id = w.owner_id
    join tenants t on t.id = u.tenant_id
    where t.public_id = ${actor.tenantPublicId}
      and u.external_subject = ${actor.externalSubject}
      and w.slug = ${slug}
    limit 1
  `;
  return row?.id ?? null;
}

export async function getWorkspaceBySlug(
  actor: ServerActor,
  slug: string,
): Promise<Workspace | null> {
  const sql = getDb();
  const [row] = await sql<WorkspaceRow[]>`
    select w.id, w.slug, w.title, w.subject, w.term, w.emoji, w.status,
           w.summary, w.next_action, w.study_minutes, w.updated_at
    from workspaces w
    join users u on u.id = w.owner_id
    join tenants t on t.id = u.tenant_id
    where t.public_id = ${actor.tenantPublicId}
      and u.external_subject = ${actor.externalSubject}
      and w.slug = ${slug}
    limit 1
  `;
  return row ? toWorkspace(row) : null;
}

export async function requireWorkspaceId(
  actor: ServerActor,
  slug: string,
): Promise<string> {
  const id = await resolveWorkspaceId(actor, slug);
  if (!id) throw new NotFoundError("워크스페이스를 찾을 수 없습니다.");
  return id;
}

export async function getTopicTree(workspaceId: string): Promise<Topic[]> {
  const sql = getDb();
  const rows = await sql<
    Array<
      Row & {
        id: string;
        parent_id: string | null;
        title: string;
        level: UnderstandingLevel;
        evidence_note: string | null;
        last_evidence_at: Date | null;
      }
    >
  >`
    select id, parent_id, title, level, evidence_note, last_evidence_at
    from topics
    where workspace_id = ${workspaceId}
    order by position, id
  `;

  const byId = new Map<string, Topic>();
  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      title: row.title,
      level: row.level,
      evidence: row.evidence_note,
      updatedAt: row.last_evidence_at ? formatWhen(row.last_evidence_at) : null,
      children: [],
    });
  }

  const roots: Topic[] = [];
  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parent_id && byId.has(row.parent_id)) {
      byId.get(row.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function listGaps(workspaceId: string): Promise<Gap[]> {
  const sql = getDb();
  const rows = await sql<
    Array<
      Row & {
        id: string;
        topic_title: string | null;
        kind: Gap["kind"];
        term: string;
        definition: string;
        key_point: string;
        confused_with: string | null;
        occurrences: number;
        status: Gap["status"];
        signal: Gap["signal"];
        last_seen_at: Date;
      }
    >
  >`
    select g.id, t.title as topic_title, g.kind, g.term, g.definition,
           g.key_point, g.confused_with, g.occurrences, g.status, g.signal,
           g.last_seen_at
    from gaps g
    left join topics t on t.id = g.topic_id
    where g.workspace_id = ${workspaceId}
    order by g.occurrences desc, g.last_seen_at desc
  `;

  return rows.map((row) => ({
    id: row.id,
    topicTitle: row.topic_title ?? "분류 전",
    kind: row.kind,
    term: row.term,
    definition: row.definition,
    keyPoint: row.key_point,
    confusedWith: row.confused_with,
    occurrences: Number(row.occurrences),
    status: row.status,
    signal: row.signal,
    lastSeen: formatWhen(row.last_seen_at),
  }));
}

export async function listMaterials(workspaceId: string): Promise<Material[]> {
  const sql = getDb();
  const rows = await sql<
    Array<
      Row & {
        id: string;
        kind: Material["kind"];
        title: string;
        extent: string;
        used_count: number;
        added_at: Date;
      }
    >
  >`
    select id, kind, title, extent, used_count, added_at
    from materials
    where workspace_id = ${workspaceId}
    order by added_at desc
  `;

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    extent: row.extent,
    usedCount: Number(row.used_count),
    addedAt: formatWhen(row.added_at),
  }));
}

export async function listActivity(
  workspaceId: string,
  limit = 12,
): Promise<ActivityItem[]> {
  const sql = getDb();
  const rows = await sql<
    Array<Row & { id: string; tool: ToolName; summary: string; occurred_at: Date }>
  >`
    select id, tool, summary, occurred_at
    from tool_calls
    where workspace_id = ${workspaceId}
    order by occurred_at desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    tool: row.tool,
    message: row.summary,
    at: formatWhen(row.occurred_at),
  }));
}

export async function listAssignments(workspaceId: string): Promise<Assignment[]> {
  const sql = getDb();
  const rows = await sql<
    Array<
      Row & {
        id: string;
        slug: string;
        title: string;
        summary: string;
        source: Assignment["source"];
        status: Assignment["status"];
        due_label: string | null;
        proofprint_id: string | null;
        current_step: number | null;
      }
    >
  >`
    select a.id, a.slug, a.title, a.summary, a.source, a.status, a.due_label,
           a.proofprint_id, p.current_step
    from workspace_assignments a
    left join proofprints p on p.id = a.proofprint_id
    where a.workspace_id = ${workspaceId}
    order by a.due_at nulls last, a.id
  `;

  return rows.map((row) => ({
    id: row.slug,
    title: row.title,
    summary: row.summary,
    source: row.source,
    status: row.status,
    due: row.due_label,
    hasProofprint: row.proofprint_id !== null,
    steps: Number(row.current_step ?? 0),
  }));
}

export async function getAssignment(
  workspaceId: string,
  slug: string,
): Promise<Assignment | null> {
  const items = await listAssignments(workspaceId);
  return items.find((item) => item.id === slug) ?? null;
}

export async function listMessages(workspaceId: string): Promise<ChatMessage[]> {
  const sql = getDb();
  const rows = await sql<
    Array<
      Row & {
        id: string;
        role: ChatMessage["role"];
        content: string;
        tool_summary: string | null;
      }
    >
  >`
    select m.id, m.role, m.content,
           (select tc.summary from tool_calls tc
             where tc.message_id = m.id
             order by tc.occurred_at limit 1) as tool_summary
    from messages m
    where m.workspace_id = ${workspaceId}
    order by m.created_at
  `;

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    paragraphs: row.content.split("\n\n").filter(Boolean),
    tool: row.tool_summary,
  }));
}
