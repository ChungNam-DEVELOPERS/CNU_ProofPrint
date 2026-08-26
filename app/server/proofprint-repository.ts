import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { PendingQuery, Row } from "postgres";
import type {
  AiPurpose,
  CheckpointResource,
  DisclosureSettings,
  ProofprintHistoryItem,
  ProofprintSubmission,
  SaveWorkspaceInput,
  UpdateDisclosureInput,
  WorkspaceResource,
  WorkspaceStatus,
} from "../lib/proofprint-api";
import type { ServerActor } from "./auth";
import { proofprintBase } from "../lib/study-data";
import { getDb } from "./db";
import { ConflictError, NotFoundError } from "./errors";

type WorkspaceRow = Row & {
  internal_workspace_id: string;
  workspace_id: string;
  revision: string;
  status: WorkspaceStatus;
  current_step: number;
  started_at: Date;
  updated_at: Date;
  submitted_at: Date | null;
  assignment_public_id: string;
  assignment_slug: string;
  assignment_title: string;
  assignment_description: string;
  course_goal: string;
  due_at: Date | null;
  score: string | null;
  course_public_id: string;
  course_title: string;
  course_section: string | null;
  course_term: string;
  display_name: string;
  student_number: string | null;
  department: string | null;
  personal_goal: string | null;
  purpose: AiPurpose | null;
  ai_question: string | null;
  ai_summary: string | null;
  ai_provider: "manual" | "demo" | "cnu_multillm" | null;
  ai_model_id: string | null;
  ai_source_request_id: string | null;
  decision: "adopt" | "revise" | "reject" | null;
  decision_reason: string | null;
  learned: string | null;
  changed_mind: string | null;
  remaining_question: string | null;
  share_purpose: boolean | null;
  share_judgment: boolean | null;
  share_reflection: boolean | null;
  share_raw: boolean | null;
  version_public_id: string | null;
  version_number: number | null;
  version_checksum: string | null;
  version_submitted_at: Date | null;
};

type CheckpointRow = Row & {
  id: string;
  occurred_at: Date;
  purpose: AiPurpose;
  question_summary: string;
  suggestion_summary: string;
  provider: "manual" | "demo" | "cnu_multillm";
  model_id: string | null;
  source_request_id: string | null;
  decision: "adopt" | "revise" | "reject" | null;
  reason: string | null;
  is_primary: boolean;
};

type HistoryRow = Row & {
  workspace_id: string;
  slug: string;
  title: string;
  course_title: string;
  course_section: string | null;
  status: WorkspaceStatus;
  updated_at: Date;
  submitted_at: Date | null;
  checkpoint_count: number;
  share_raw: boolean;
};

const emptyDisclosure: DisclosureSettings = {
  sharePurpose: true,
  shareJudgment: true,
  shareReflection: true,
  shareRaw: false,
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function courseDisplayTitle(title: string, section: string | null) {
  return section ? `${title} (${section})` : title;
}

function assertWorkspaceFields(row: WorkspaceRow) {
  const fields = [
    row.personal_goal,
    row.purpose,
    row.ai_question,
    row.ai_summary,
    row.decision,
    row.decision_reason,
    row.learned,
    row.changed_mind,
    row.remaining_question,
  ];
  if (fields.some((field) => field === null)) {
    throw new NotFoundError("이 작업공간에는 아직 Proofprint 기본 기록이 없습니다.");
  }
}

function mapSubmission(row: WorkspaceRow): ProofprintSubmission | null {
  if (
    !row.version_public_id ||
    row.version_number === null ||
    !row.version_checksum ||
    !row.version_submitted_at
  ) {
    return null;
  }
  return {
    publicId: row.version_public_id,
    version: Number(row.version_number),
    checksum: row.version_checksum,
    submittedAt: toIso(row.version_submitted_at),
  };
}

function mapCheckpoint(row: CheckpointRow, workspaceId: string): CheckpointResource {
  return {
    publicKey: `${workspaceId}:checkpoint:${row.id}`,
    occurredAt: toIso(row.occurred_at),
    purpose: row.purpose,
    questionSummary: row.question_summary,
    suggestionSummary: row.suggestion_summary,
    provider: row.provider,
    modelId: row.model_id,
    sourceRequestId: row.source_request_id,
    decision: row.decision,
    reason: row.reason,
    isPrimary: row.is_primary,
  };
}

async function findWorkspace(
  actor: ServerActor,
  predicate: PendingQuery<Row[]>,
): Promise<WorkspaceResource> {
  const sql = getDb();
  const rows = await sql<WorkspaceRow[]>`
    select
      w.id as internal_workspace_id,
      w.public_id as workspace_id,
      w.revision,
      w.status,
      w.current_step,
      w.started_at,
      w.updated_at,
      w.submitted_at,
      a.public_id as assignment_public_id,
      a.slug as assignment_slug,
      a.title as assignment_title,
      a.description as assignment_description,
      a.course_goal,
      a.due_at,
      a.score,
      c.public_id as course_public_id,
      c.title as course_title,
      c.section as course_section,
      c.term as course_term,
      u.display_name,
      u.student_number,
      u.department,
      goal.text as personal_goal,
      ai.purpose,
      ai.question_summary as ai_question,
      ai.suggestion_summary as ai_summary,
      ai.provider as ai_provider,
      ai.model_id as ai_model_id,
      ai.source_request_id as ai_source_request_id,
      decision.decision,
      decision.reason as decision_reason,
      reflection.learned,
      reflection.changed_mind,
      reflection.remaining_question,
      disclosure.share_purpose,
      disclosure.share_judgment,
      disclosure.share_reflection,
      disclosure.share_raw,
      latest.public_id as version_public_id,
      latest.version as version_number,
      latest.checksum as version_checksum,
      latest.submitted_at as version_submitted_at
    from proofprints w
    join assignments a on a.id = w.assignment_id
    join courses c on c.id = a.course_id
    join tenants tenant on tenant.id = c.tenant_id
    join users u on u.id = w.student_id and u.tenant_id = tenant.id
    left join learning_goals goal
      on goal.proofprint_id = w.id and goal.source = 'personal' and goal.position = 0
    left join ai_uses ai on ai.proofprint_id = w.id and ai.is_primary
    left join decision_checkpoints decision on decision.ai_use_id = ai.id
    left join reflections reflection on reflection.proofprint_id = w.id
    left join disclosure_settings disclosure on disclosure.proofprint_id = w.id
    left join lateral (
      select public_id, version, checksum, submitted_at
      from proofprint_versions
      where proofprint_id = w.id
      order by version desc
      limit 1
    ) latest on true
    where tenant.public_id = ${actor.tenantPublicId}
      and u.external_subject = ${actor.externalSubject}
      and ${predicate}
    limit 1
  `;

  const row = rows[0];
  if (!row) throw new NotFoundError();
  assertWorkspaceFields(row);

  const checkpointRows = await sql<CheckpointRow[]>`
    select
      ai.id,
      ai.occurred_at,
      ai.purpose,
      ai.question_summary,
      ai.suggestion_summary,
      ai.provider,
      ai.model_id,
      ai.source_request_id,
      decision.decision,
      decision.reason,
      ai.is_primary
    from ai_uses ai
    left join decision_checkpoints decision on decision.ai_use_id = ai.id
    where ai.proofprint_id = ${row.internal_workspace_id}
    order by ai.occurred_at asc, ai.id asc
  `;

  return {
    workspaceId: row.workspace_id,
    revision: Number(row.revision),
    status: row.status,
    currentStep: Number(row.current_step),
    startedAt: toIso(row.started_at),
    updatedAt: toIso(row.updated_at),
    submittedAt: row.submitted_at ? toIso(row.submitted_at) : null,
    assignment: {
      publicId: row.assignment_public_id,
      slug: row.assignment_slug,
      title: row.assignment_title,
      description: row.assignment_description,
      courseGoal: row.course_goal,
      dueAt: row.due_at ? toIso(row.due_at) : null,
      score: row.score === null ? null : Number(row.score),
    },
    course: {
      publicId: row.course_public_id,
      title: row.course_title,
      section: row.course_section,
      term: row.course_term,
      displayTitle: courseDisplayTitle(row.course_title, row.course_section),
    },
    student: {
      displayName: row.display_name,
      studentNumber: row.student_number,
      department: row.department,
    },
    draft: {
      personalGoal: row.personal_goal!,
      purpose: row.purpose!,
      aiQuestion: row.ai_question!,
      aiSummary: row.ai_summary!,
      aiProvider: row.ai_provider ?? "manual",
      aiModel: row.ai_model_id,
      aiRequestId: row.ai_source_request_id,
      decision: row.decision!,
      reason: row.decision_reason!,
      learned: row.learned!,
      changed: row.changed_mind!,
      remainingQuestion: row.remaining_question!,
    },
    disclosure: row.share_purpose === null
      ? emptyDisclosure
      : {
          sharePurpose: row.share_purpose,
          shareJudgment: row.share_judgment ?? true,
          shareReflection: row.share_reflection ?? true,
          shareRaw: false,
        },
    checkpoints: checkpointRows.map((checkpoint) =>
      mapCheckpoint(checkpoint, row.workspace_id),
    ),
    latestSubmission: mapSubmission(row),
  };
}

export function getWorkspaceByAssignmentSlug(actor: ServerActor, slug: string) {
  const sql = getDb();
  return findWorkspace(actor, sql`a.slug = ${slug}`);
}

export function getWorkspaceByPublicId(actor: ServerActor, workspaceId: string) {
  const sql = getDb();
  return findWorkspace(actor, sql`w.public_id = ${workspaceId}`);
}

export async function saveWorkspace(
  actor: ServerActor,
  workspaceId: string,
  input: SaveWorkspaceInput,
) {
  const sql = getDb();
  await sql.begin(async (tx) => {
    const status = input.currentStep === 4 ? "ready_to_submit" : "in_progress";
    const updated = await tx<
      Array<{ id: string; student_id: string; revision: string }>
    >`
      update proofprints w
      set current_step = ${input.currentStep},
          status = ${status},
          submitted_at = case when status = 'submitted' then null else submitted_at end,
          revision = revision + 1
      from users u, tenants tenant
      where w.student_id = u.id
        and u.tenant_id = tenant.id
        and tenant.public_id = ${actor.tenantPublicId}
        and u.external_subject = ${actor.externalSubject}
        and w.public_id = ${workspaceId}
        and w.revision = ${input.revision}
      returning w.id, w.student_id, w.revision
    `;

    const workspace = updated[0];
    if (!workspace) throw new ConflictError();

    await tx`
      insert into learning_goals (proofprint_id, source, text, position)
      values (${workspace.id}, 'personal', ${input.draft.personalGoal}, 0)
      on conflict (proofprint_id, source, position) do update
      set text = excluded.text
    `;

    const aiUses = await tx<Array<{ id: string }>>`
      insert into ai_uses (
        proofprint_id, purpose, question_summary, suggestion_summary, is_primary,
        provider, model_id, source_request_id
      )
      values (
        ${workspace.id}, ${input.draft.purpose}, ${input.draft.aiQuestion},
        ${input.draft.aiSummary}, true, ${input.draft.aiProvider},
        ${input.draft.aiModel}, ${input.draft.aiRequestId}
      )
      on conflict (proofprint_id) where is_primary do update
      set purpose = excluded.purpose,
          question_summary = excluded.question_summary,
          suggestion_summary = excluded.suggestion_summary,
          provider = excluded.provider,
          model_id = excluded.model_id,
          source_request_id = excluded.source_request_id
      returning id
    `;
    const aiUse = aiUses[0];
    if (!aiUse) throw new Error("Primary AI use was not saved.");

    await tx`
      insert into decision_checkpoints (ai_use_id, decision, reason)
      values (${aiUse.id}, ${input.draft.decision}, ${input.draft.reason})
      on conflict (ai_use_id) do update
      set decision = excluded.decision,
          reason = excluded.reason
    `;

    await tx`
      insert into reflections (proofprint_id, learned, changed_mind, remaining_question)
      values (
        ${workspace.id}, ${input.draft.learned}, ${input.draft.changed},
        ${input.draft.remainingQuestion}
      )
      on conflict (proofprint_id) do update
      set learned = excluded.learned,
          changed_mind = excluded.changed_mind,
          remaining_question = excluded.remaining_question
    `;

    await tx`
      insert into audit_events (
        actor_user_id, proofprint_id, event_type, target_public_id, metadata
      )
      values (
        ${workspace.student_id}, ${workspace.id}, 'workspace_saved', ${workspaceId},
        ${tx.json({
          previousRevision: input.revision,
          revision: Number(workspace.revision),
          currentStep: input.currentStep,
        })}
      )
    `;
  });

  return getWorkspaceByPublicId(actor, workspaceId);
}

export async function updateDisclosure(
  actor: ServerActor,
  workspaceId: string,
  input: UpdateDisclosureInput,
) {
  const sql = getDb();
  await sql.begin(async (tx) => {
    const updated = await tx<
      Array<{ id: string; student_id: string; revision: string }>
    >`
      update proofprints w
      set revision = revision + 1
      from users u, tenants tenant
      where w.student_id = u.id
        and u.tenant_id = tenant.id
        and tenant.public_id = ${actor.tenantPublicId}
        and u.external_subject = ${actor.externalSubject}
        and w.public_id = ${workspaceId}
        and w.revision = ${input.revision}
      returning w.id, w.student_id, w.revision
    `;
    const workspace = updated[0];
    if (!workspace) throw new ConflictError();

    await tx`
      insert into disclosure_settings (
        proofprint_id, share_purpose, share_judgment, share_reflection, share_raw
      )
      values (
        ${workspace.id}, ${input.disclosure.sharePurpose},
        ${input.disclosure.shareJudgment}, ${input.disclosure.shareReflection}, false
      )
      on conflict (proofprint_id) do update
      set share_purpose = excluded.share_purpose,
          share_judgment = excluded.share_judgment,
          share_reflection = excluded.share_reflection,
          share_raw = false
    `;

    await tx`
      insert into audit_events (
        actor_user_id, proofprint_id, event_type, target_public_id, metadata
      )
      values (
        ${workspace.student_id}, ${workspace.id}, 'disclosure_updated', ${workspaceId},
        ${tx.json({
          revision: Number(workspace.revision),
          disclosure: input.disclosure,
        })}
      )
    `;
  });

  return getWorkspaceByPublicId(actor, workspaceId);
}

export async function submitWorkspace(
  actor: ServerActor,
  workspaceId: string,
  expectedRevision: number,
) {
  const current = await getWorkspaceByPublicId(actor, workspaceId);
  if (current.revision !== expectedRevision) throw new ConflictError();

  const submittedAt = new Date();
  const snapshot = {
    schemaVersion: 1,
    generatedFrom: "recorded_events_only",
    workspace: {
      ...current,
      status: "submitted" as const,
      currentStep: 4,
      revision: expectedRevision + 1,
      submittedAt: submittedAt.toISOString(),
      latestSubmission: null,
    },
    checkpointCount: current.checkpoints.length,
    rawShared: false,
  };
  const serializedSnapshot = JSON.stringify(snapshot);
  const checksum = createHash("sha256").update(serializedSnapshot).digest("hex");
  const versionPublicId = `proofprint_${randomUUID().replaceAll("-", "")}`;
  const sql = getDb();

  const created = await sql.begin(async (tx) => {
    const updated = await tx<
      Array<{ id: string; student_id: string; revision: string }>
    >`
      update proofprints w
      set status = 'submitted',
          current_step = 4,
          submitted_at = ${submittedAt},
          revision = revision + 1
      from users u, tenants tenant
      where w.student_id = u.id
        and u.tenant_id = tenant.id
        and tenant.public_id = ${actor.tenantPublicId}
        and u.external_subject = ${actor.externalSubject}
        and w.public_id = ${workspaceId}
        and w.revision = ${expectedRevision}
      returning w.id, w.student_id, w.revision
    `;
    const workspace = updated[0];
    if (!workspace) throw new ConflictError();

    const versions = await tx<Array<{ version: number }>>`
      select coalesce(max(version), 0)::int + 1 as version
      from proofprint_versions
      where proofprint_id = ${workspace.id}
    `;
    const version = Number(versions[0]?.version ?? 1);

    await tx`
      insert into proofprint_versions (
        public_id, proofprint_id, version, snapshot_json, checksum, submitted_at
      )
      values (
        ${versionPublicId}, ${workspace.id}, ${version},
        ${serializedSnapshot}::jsonb, ${checksum}, ${submittedAt}
      )
    `;

    await tx`
      insert into audit_events (
        actor_user_id, proofprint_id, event_type, target_public_id, metadata
      )
      values (
        ${workspace.student_id}, ${workspace.id}, 'proofprint_submitted', ${versionPublicId},
        ${tx.json({ version, checksum, revision: Number(workspace.revision) })}
      )
    `;

    return { version, revision: Number(workspace.revision) };
  });

  const workspace = await getWorkspaceByPublicId(actor, workspaceId);
  return {
    workspace,
    submission: {
      publicId: versionPublicId,
      version: created.version,
      checksum,
      submittedAt: submittedAt.toISOString(),
    } satisfies ProofprintSubmission,
  };
}

function formatKoreanTimestamp(value: Date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}.${part("month")}.${part("day")} ${part("hour")}:${part("minute")}`;
}

export async function listProofprints(actor: ServerActor): Promise<ProofprintHistoryItem[]> {
  const sql = getDb();
  const rows = await sql<HistoryRow[]>`
    select
      w.public_id as workspace_id,
      a.slug,
      a.title,
      c.title as course_title,
      c.section as course_section,
      w.status,
      w.updated_at,
      w.submitted_at,
      coalesce(
        nullif(latest.snapshot_json ->> 'checkpointCount', '')::int,
        checkpoint.count,
        0
      )::int as checkpoint_count,
      coalesce(disclosure.share_raw, false) as share_raw
    from proofprints w
    join assignments a on a.id = w.assignment_id
    join courses c on c.id = a.course_id
    join tenants tenant on tenant.id = c.tenant_id
    join users u on u.id = w.student_id and u.tenant_id = tenant.id
    left join disclosure_settings disclosure on disclosure.proofprint_id = w.id
    left join lateral (
      select snapshot_json
      from proofprint_versions
      where proofprint_id = w.id
      order by version desc
      limit 1
    ) latest on true
    left join lateral (
      select count(*)::int as count
      from ai_uses
      where proofprint_id = w.id
    ) checkpoint on true
    where tenant.public_id = ${actor.tenantPublicId}
      and u.external_subject = ${actor.externalSubject}
      and w.status <> 'archived'
    order by coalesce(w.submitted_at, w.updated_at) desc
  `;

  return rows.map((row) => {
    const submitted = row.status === "submitted";
    const date = submitted && row.submitted_at ? row.submitted_at : row.updated_at;
    const basePath = `${proofprintBase}/workspace`;
    const supportedPath = row.slug === "ai-service-proposal";
    return {
      workspaceId: row.workspace_id,
      title: row.title,
      course: courseDisplayTitle(row.course_title, row.course_section),
      date: `${submitted ? "제출" : "최근 수정"} ${formatKoreanTimestamp(date)}`,
      checkpointCount: Number(row.checkpoint_count),
      status: submitted ? "제출 완료" : "작성 중",
      rawShared: row.share_raw,
      href: supportedPath
        ? submitted
          ? `${basePath}/result`
          : basePath
        : `${proofprintBase}/history`,
    };
  });
}

export async function checkDatabaseHealth() {
  const sql = getDb();
  const result = await sql<Array<{ ok: number }>>`select 1::int as ok`;
  return result[0]?.ok === 1;
}
