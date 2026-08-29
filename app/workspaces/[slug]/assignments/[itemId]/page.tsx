import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../../../components/app-shell";
import { AssignmentPlaceholder } from "../../../../components/assignment-placeholder";
import { ProofprintWorkspace } from "../../../../components/proofprint-workspace";
import { getCnuAiMode } from "../../../../server/ai/cnu-multillm";
import { getServerActor } from "../../../../server/auth";
import {
  getAssignment,
  getWorkspaceBySlug,
  requireWorkspaceId,
} from "../../../../server/learning-repository";
import { getWorkspaceByLearningAssignment } from "../../../../server/proofprint-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const actor = await getServerActor();
  if (!(await getWorkspaceBySlug(actor, slug))) notFound();

  const workspaceId = await requireWorkspaceId(actor, slug);
  const assignment = await getAssignment(workspaceId, itemId);
  if (!assignment) notFound();

  if (!assignment.hasProofprint) {
    return (
      <AppShell workspaceSlug={slug} active="assignments">
        <AssignmentPlaceholder item={assignment} workspaceSlug={slug} />
      </AppShell>
    );
  }

  const record = await getWorkspaceByLearningAssignment(actor, workspaceId, itemId);

  return (
    <AppShell workspaceSlug={slug} active="assignments">
      <div className={"agent-entry"}>
        <Link href={`/workspaces/${slug}/assignments/${itemId}/agent`}>
          과제 Agent와 먼저 대화하기
        </Link>
        <span>대화에서 확정한 판단과 학습 근거가 Proofprint 재료로 연결됩니다.</span>
      </div>
      <ProofprintWorkspace initialWorkspace={record} initialAiMode={getCnuAiMode()} />
    </AppShell>
  );
}
