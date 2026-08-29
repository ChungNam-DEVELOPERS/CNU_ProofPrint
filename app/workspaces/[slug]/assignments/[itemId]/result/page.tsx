import { notFound } from "next/navigation";
import { AppShell } from "../../../../../components/app-shell";
import { ProofprintResult } from "../../../../../components/proofprint-result";
import { getServerActor } from "../../../../../server/auth";
import {
  getAssignment,
  getWorkspaceBySlug,
  requireWorkspaceId,
} from "../../../../../server/learning-repository";
import { getWorkspaceByLearningAssignment } from "../../../../../server/proofprint-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AssignmentResultPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const actor = await getServerActor();
  if (!(await getWorkspaceBySlug(actor, slug))) notFound();

  const workspaceId = await requireWorkspaceId(actor, slug);
  const assignment = await getAssignment(workspaceId, itemId);
  if (!assignment?.hasProofprint) notFound();

  const record = await getWorkspaceByLearningAssignment(actor, workspaceId, itemId);

  return (
    <AppShell workspaceSlug={slug} active="assignments">
      <ProofprintResult initialWorkspace={record} />
    </AppShell>
  );
}
