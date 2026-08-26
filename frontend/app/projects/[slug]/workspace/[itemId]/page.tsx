import { notFound } from "next/navigation";
import { AppShell } from "../../../../components/app-shell";
import { ProofprintWorkspace } from "../../../../components/proofprint-workspace";
import { WorkItemPlaceholder } from "../../../../components/work-item-placeholder";
import { getProject, getWorkItem, proofprintAssignmentSlug } from "../../../../lib/study-data";
import { getCnuAiMode } from "../../../../server/ai/cnu-multillm";
import { getServerActor } from "../../../../server/auth";
import { getWorkspaceByAssignmentSlug } from "../../../../server/proofprint-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WorkItemPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const project = getProject(slug);
  const item = getWorkItem(slug, itemId);
  if (!project || !item) notFound();

  if (!item.hasProofprint) {
    return (
      <AppShell projectSlug={slug} active="workspace">
        <WorkItemPlaceholder item={item} projectSlug={slug} />
      </AppShell>
    );
  }

  const actor = await getServerActor();
  const workspace = await getWorkspaceByAssignmentSlug(actor, proofprintAssignmentSlug);

  return (
    <AppShell projectSlug={slug} active="workspace">
      <ProofprintWorkspace initialWorkspace={workspace} initialAiMode={getCnuAiMode()} />
    </AppShell>
  );
}
