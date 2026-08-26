import { notFound } from "next/navigation";
import { AppShell } from "../../../../components/app-shell";
import { AssignmentPlaceholder } from "../../../../components/assignment-placeholder";
import { ProofprintWorkspace } from "../../../../components/proofprint-workspace";
import {
  getAssignment,
  getWorkspace,
  proofprintAssignmentSlug,
} from "../../../../lib/study-data";
import { getCnuAiMode } from "../../../../server/ai/cnu-multillm";
import { getServerActor } from "../../../../server/auth";
import { getWorkspaceByAssignmentSlug } from "../../../../server/proofprint-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const assignment = getAssignment(slug, itemId);
  if (!getWorkspace(slug) || !assignment) notFound();

  if (!assignment.hasProofprint) {
    return (
      <AppShell workspaceSlug={slug} active="assignments">
        <AssignmentPlaceholder item={assignment} workspaceSlug={slug} />
      </AppShell>
    );
  }

  const actor = await getServerActor();
  const record = await getWorkspaceByAssignmentSlug(actor, proofprintAssignmentSlug);

  return (
    <AppShell workspaceSlug={slug} active="assignments">
      <ProofprintWorkspace initialWorkspace={record} initialAiMode={getCnuAiMode()} />
    </AppShell>
  );
}
