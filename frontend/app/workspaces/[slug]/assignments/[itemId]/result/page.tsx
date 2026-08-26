import { notFound } from "next/navigation";
import { AppShell } from "../../../../../components/app-shell";
import { ProofprintResult } from "../../../../../components/proofprint-result";
import {
  getAssignment,
  getWorkspace,
  proofprintAssignmentSlug,
} from "../../../../../lib/study-data";
import { getServerActor } from "../../../../../server/auth";
import { getWorkspaceByAssignmentSlug } from "../../../../../server/proofprint-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AssignmentResultPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const assignment = getAssignment(slug, itemId);
  if (!getWorkspace(slug) || !assignment?.hasProofprint) notFound();

  const actor = await getServerActor();
  const record = await getWorkspaceByAssignmentSlug(actor, proofprintAssignmentSlug);

  return (
    <AppShell workspaceSlug={slug} active="assignments">
      <ProofprintResult initialWorkspace={record} />
    </AppShell>
  );
}
