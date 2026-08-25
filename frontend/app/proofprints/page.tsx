import { CnuCourseShell } from "../components/cnu-course-shell";
import { ProofprintHistory } from "../components/proofprint-history";
import { getServerActor } from "../server/auth";
import { listProofprints } from "../server/proofprint-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProofprintsPage() {
  const actor = await getServerActor();
  const items = await listProofprints(actor);

  return (
    <CnuCourseShell activeMenu="제출 기록">
      <ProofprintHistory initialItems={items} />
    </CnuCourseShell>
  );
}
