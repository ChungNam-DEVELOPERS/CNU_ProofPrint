import { CnuCourseShell } from "../../../components/cnu-course-shell";
import { ProofprintWorkspace } from "../../../components/proofprint-workspace";
import { getServerActor } from "../../../server/auth";
import { getCnuAiMode } from "../../../server/ai/cnu-multillm";
import { getWorkspaceByAssignmentSlug } from "../../../server/proofprint-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProofprintWorkspacePage() {
  const actor = await getServerActor();
  const workspace = await getWorkspaceByAssignmentSlug(actor, "ai-service-proposal");

  return (
    <CnuCourseShell activeMenu="Proofprint 작성">
      <ProofprintWorkspace
        initialWorkspace={workspace}
        initialAiMode={getCnuAiMode()}
      />
    </CnuCourseShell>
  );
}
