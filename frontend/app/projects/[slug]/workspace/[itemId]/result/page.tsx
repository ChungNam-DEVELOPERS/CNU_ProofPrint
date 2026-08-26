import { notFound } from "next/navigation";
import { AppShell } from "../../../../../components/app-shell";
import { ProofprintResult } from "../../../../../components/proofprint-result";
import { getProject, getWorkItem, proofprintAssignmentSlug } from "../../../../../lib/study-data";
import { getServerActor } from "../../../../../server/auth";
import { getWorkspaceByAssignmentSlug } from "../../../../../server/proofprint-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WorkItemResultPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const item = getWorkItem(slug, itemId);
  if (!getProject(slug) || !item?.hasProofprint) notFound();

  const actor = await getServerActor();
  const workspace = await getWorkspaceByAssignmentSlug(actor, proofprintAssignmentSlug);

  return (
    <AppShell projectSlug={slug} active="workspace">
      <ProofprintResult initialWorkspace={workspace} />
    </AppShell>
  );
}
