import { notFound } from "next/navigation";
import { AppShell } from "../../../../components/app-shell";
import { AssignmentPlaceholder } from "../../../../components/assignment-placeholder";
import { ProofprintWorkspace } from "../../../../components/proofprint-workspace";
import { proofprintAssignmentSlug } from "../../../../lib/study-data";
import { getCnuAiMode } from "../../../../server/ai/cnu-multillm";
import { getServerActor } from "../../../../server/auth";
import {
  getAssignment,
  getWorkspaceBySlug,
  requireWorkspaceId,
} from "../../../../server/learning-repository";
import { getWorkspaceByAssignmentSlug } from "../../../../server/proofprint-repository";

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

  const assignment = await getAssignment(await requireWorkspaceId(actor, slug), itemId);
  if (!assignment) notFound();

  if (!assignment.hasProofprint) {
    return (
      <AppShell workspaceSlug={slug} active="assignments">
        <AssignmentPlaceholder item={assignment} workspaceSlug={slug} />
      </AppShell>
    );
  }

  const record = await getWorkspaceByAssignmentSlug(actor, proofprintAssignmentSlug);

  return (
    <AppShell workspaceSlug={slug} active="assignments">
      <ProofprintWorkspace initialWorkspace={record} initialAiMode={getCnuAiMode()} />
    </AppShell>
  );
}
