import { CnuCourseShell } from "../../../../components/cnu-course-shell";
import { ProofprintResult } from "../../../../components/proofprint-result";
import { getServerActor } from "../../../../server/auth";
import { getWorkspaceByAssignmentSlug } from "../../../../server/proofprint-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProofprintResultPage() {
  const actor = await getServerActor();
  const workspace = await getWorkspaceByAssignmentSlug(actor, "ai-service-proposal");

  return (
    <CnuCourseShell activeMenu="Proofprint 작성">
      <ProofprintResult initialWorkspace={workspace} />
    </CnuCourseShell>
  );
}
